from flask import Flask, request, jsonify, send_file, Response
from flask_cors import CORS
import requests
import sqlite3
import json
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv
import time
from collections import defaultdict
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter, A4
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
import io
import firebase_admin
from firebase_admin import credentials, auth
from functools import wraps
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app, origins=[
    'http://localhost:5175',
    'http://192.168.29.104:5175'
], methods=['GET', 'POST', 'PUT', 'DELETE'],
   allow_headers=['Content-Type', 'Authorization'])

# Database configuration
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///nutrivault.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)
migrate = Migrate(app, db)

# Database Models
class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    firebase_uid = db.Column(db.String, unique=True, nullable=False)
    email = db.Column(db.String, nullable=False)
    age = db.Column(db.Integer)
    weight = db.Column(db.Float)
    height = db.Column(db.Float)
    activity_level = db.Column(db.String)
    dietary_goal = db.Column(db.String)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class DietaryGoal(db.Model):
    __tablename__ = 'dietary_goals'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    goal_type = db.Column(db.String, nullable=False)
    target_calories = db.Column(db.Integer)
    target_protein = db.Column(db.Float)
    target_carbs = db.Column(db.Float)
    target_fat = db.Column(db.Float)
    current_weight = db.Column(db.Float)
    target_weight = db.Column(db.Float)
    activity_level = db.Column(db.String)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class MealLog(db.Model):
    __tablename__ = 'meal_logs'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    fdc_id = db.Column(db.String, nullable=False)
    food_name = db.Column(db.String, nullable=False)
    serving_size = db.Column(db.Float, nullable=False)
    serving_unit = db.Column(db.String, nullable=False)
    calories = db.Column(db.Float, nullable=False)
    protein = db.Column(db.Float)
    carbs = db.Column(db.Float)
    fat = db.Column(db.Float)
    meal_type = db.Column(db.String)
    logged_date = db.Column(db.Date, nullable=False)
    logged_at = db.Column(db.DateTime, default=datetime.utcnow)

class SearchHistory(db.Model):
    __tablename__ = 'search_history'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    fdc_id = db.Column(db.String, nullable=False)
    food_name = db.Column(db.String, nullable=False)
    searched_at = db.Column(db.DateTime, default=datetime.utcnow)
    nutrition_data = db.Column(db.Text)

# Firebase Configuration
firebase_config_path = os.getenv('FIREBASE_CONFIG_PATH', 'firebase-service-account.json')
if os.path.exists(firebase_config_path):
    cred = credentials.Certificate(firebase_config_path)
    firebase_admin.initialize_app(cred)
    print("Firebase Admin SDK initialized successfully")
else:
    print("Warning: Firebase service account file not found. Some features may not work.")

# USDA API Configuration
USDA_API_KEY = os.getenv('USDA_API_KEY', 'DEMO_KEY')  # Replace with your actual API key
USDA_BASE_URL = 'https://api.nal.usda.gov/fdc/v1'

# Rate limiting configuration
RATE_LIMIT_REQUESTS = 30  # Max requests per minute per IP
RATE_LIMIT_WINDOW = 60   # Time window in seconds
request_counts = defaultdict(list)

def is_rate_limited(client_ip):
    """Check if the client IP has exceeded rate limits"""
    now = datetime.now()
    minute_ago = now - timedelta(seconds=RATE_LIMIT_WINDOW)
    
    # Clean old requests
    request_counts[client_ip] = [req_time for req_time in request_counts[client_ip] if req_time > minute_ago]
    
    # Check if limit exceeded
    if len(request_counts[client_ip]) >= RATE_LIMIT_REQUESTS:
        return True
    
    # Add current request
    request_counts[client_ip].append(now)
    return False

# Firebase Authentication Decorator
def firebase_auth_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Authorization header required'}), 401
        
        try:
            token = auth_header.split('Bearer ')[1]
            decoded_token = auth.verify_id_token(token)
            request.user = decoded_token
            return f(*args, **kwargs)
        except Exception as e:
            return jsonify({'error': 'Invalid token'}), 401
    
    return decorated_function

# Initialize SQLite database for history and user data
def init_db():
    conn = sqlite3.connect('nutrivault.db')
    cursor = conn.cursor()
    
    # Existing search history table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS search_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            fdc_id TEXT NOT NULL,
            food_name TEXT NOT NULL,
            searched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            nutrition_data TEXT
        )
    ''')
    
    # User profiles table with additional columns
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            firebase_uid TEXT UNIQUE NOT NULL,
            email TEXT NOT NULL,
            age INTEGER,
            weight REAL,
            height REAL,
            activity_level TEXT,
            dietary_goal TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # User dietary goals table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS dietary_goals (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            goal_type TEXT NOT NULL, -- 'weight_loss', 'muscle_gain', 'maintenance'
            target_calories INTEGER,
            target_protein REAL,
            target_carbs REAL,
            target_fat REAL,
            current_weight REAL,
            target_weight REAL,
            activity_level TEXT, -- 'sedentary', 'light', 'moderate', 'active', 'very_active'
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')
    
    # User meals/food log table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS meal_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            fdc_id TEXT NOT NULL,
            food_name TEXT NOT NULL,
            serving_size REAL NOT NULL,
            serving_unit TEXT NOT NULL,
            calories REAL NOT NULL,
            protein REAL,
            carbs REAL,
            fat REAL,
            meal_type TEXT, -- 'breakfast', 'lunch', 'dinner', 'snack'
            logged_date DATE NOT NULL,
            logged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')
    
    conn.commit()
    conn.close()

# User Authentication and Profile Endpoints

@app.route('/api/auth/verify', methods=['POST'])
def verify_user():
    """Verify Firebase token and create/update user profile"""
    try:
        data = request.get_json()
        id_token = data.get('idToken')
        
        if not id_token:
            return jsonify({'error': 'ID token required'}), 400
        
        # Verify the token
        decoded_token = auth.verify_id_token(id_token)
        firebase_uid = decoded_token['uid']
        email = decoded_token.get('email', '')
        
        # Create or update user in database
        conn = sqlite3.connect('nutrivault.db')
        cursor = conn.cursor()
        
        # Check if user exists
        cursor.execute('SELECT id FROM users WHERE firebase_uid = ?', (firebase_uid,))
        user_row = cursor.fetchone()
        if user_row:
            # User exists, update timestamp
            cursor.execute('UPDATE users SET updated_at = CURRENT_TIMESTAMP, email = ? WHERE firebase_uid = ?', (email, firebase_uid))
            user_id = user_row[0]
        else:
            # User does not exist, insert new
            cursor.execute('INSERT INTO users (firebase_uid, email, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)', (firebase_uid, email))
            user_id = cursor.lastrowid
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'user': {
                'id': user_id,
                'firebase_uid': firebase_uid,
                'email': email
            }
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 401

@app.route('/api/profile', methods=['GET'])
@firebase_auth_required
def get_user_profile():
    """Get user profile and current dietary goals"""
    try:
        firebase_uid = request.user['uid']
        
        conn = sqlite3.connect('nutrivault.db')
        cursor = conn.cursor()
        
        # Get user info
        cursor.execute('SELECT * FROM users WHERE firebase_uid = ?', (firebase_uid,))
        user_row = cursor.fetchone()
        
        if not user_row:
            return jsonify({'error': 'User not found'}), 404
        
        user_id = user_row[0]
        
        # Get current dietary goals
        cursor.execute('''
            SELECT * FROM dietary_goals 
            WHERE user_id = ? 
            ORDER BY created_at DESC 
            LIMIT 1
        ''', (user_id,))
        goals_row = cursor.fetchone()
        
        conn.close()
        
        user_profile = {
            'id': user_row[0],
            'firebase_uid': user_row[1],
            'email': user_row[2],
            'age': user_row[3],
            'weight': user_row[4],
            'height': user_row[5],
            'activity_level': user_row[6],
            'dietary_goal': user_row[7],
            'created_at': user_row[8],
            'updated_at': user_row[9],
            'dietary_goals': None
        }
        
        if goals_row:
            user_profile['dietary_goals'] = {
                'goal_type': goals_row[2],
                'target_calories': goals_row[3],
                'target_protein': goals_row[4],
                'target_carbs': goals_row[5],
                'target_fat': goals_row[6],
                'current_weight': goals_row[7],
                'target_weight': goals_row[8],
                'activity_level': goals_row[9]
            }
        
        return jsonify({
            'success': True,
            'profile': user_profile
        })
        
    except Exception as e:
        print(f"Error getting user profile: {str(e)}")  # Add logging
        return jsonify({'error': str(e)}), 500

@app.route('/api/dietary-goals', methods=['POST'])
@firebase_auth_required
def set_dietary_goals():
    """Set or update user's dietary goals"""
    try:
        firebase_uid = request.user['uid']
        data = request.get_json()
        
        conn = sqlite3.connect('nutrivault.db')
        cursor = conn.cursor()
        
        # Get user ID
        cursor.execute('SELECT id FROM users WHERE firebase_uid = ?', (firebase_uid,))
        user_row = cursor.fetchone()
        if not user_row:
            return jsonify({'error': 'User not found'}), 404
        
        user_id = user_row[0]
        
        # Calculate nutritional targets based on goals
        goal_type = data.get('goal_type')
        current_weight = float(data.get('current_weight', 0) or 0)
        target_weight = float(data.get('target_weight', 0) or 0)
        activity_level = data.get('activity_level')
        
        # Basic BMR calculation (Mifflin-St Jeor Equation for average adult)
        # This is a simplified calculation - in a real app you'd want age, gender, height
        bmr = current_weight * 22  # Simplified BMR
        
        # Activity multipliers
        activity_multipliers = {
            'sedentary': 1.2,
            'light': 1.375,
            'moderate': 1.55,
            'active': 1.725,
            'very_active': 1.9
        }
        
        maintenance_calories = bmr * activity_multipliers.get(activity_level, 1.55)
        
        # Adjust for goal
        if goal_type == 'weight_loss':
            target_calories = int(maintenance_calories - 500)  # 500 calorie deficit
        elif goal_type == 'muscle_gain':
            target_calories = int(maintenance_calories + 300)  # 300 calorie surplus
        else:  # maintenance
            target_calories = int(maintenance_calories)
        
        # Macro calculations (rough guidelines)
        target_protein = current_weight * 2.2  # 1g per lb
        target_fat = target_calories * 0.25 / 9  # 25% of calories from fat
        target_carbs = (target_calories - (target_protein * 4) - (target_fat * 9)) / 4
        
        cursor.execute('''
            INSERT INTO dietary_goals (
                user_id, goal_type, target_calories, target_protein, 
                target_carbs, target_fat, current_weight, target_weight, activity_level
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (user_id, goal_type, target_calories, target_protein, 
              target_carbs, target_fat, current_weight, target_weight, activity_level))
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'goals': {
                'goal_type': goal_type,
                'target_calories': target_calories,
                'target_protein': round(target_protein, 1),
                'target_carbs': round(target_carbs, 1),
                'target_fat': round(target_fat, 1),
                'current_weight': current_weight,
                'target_weight': target_weight,
                'activity_level': activity_level
            }
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/meals', methods=['POST'])
@firebase_auth_required
def log_meal():
    """Log a meal/food item"""
    try:
        firebase_uid = request.user['uid']
        data = request.get_json()
        
        conn = sqlite3.connect('nutrivault.db')
        cursor = conn.cursor()
        
        # Get user ID
        cursor.execute('SELECT id FROM users WHERE firebase_uid = ?', (firebase_uid,))
        user_row = cursor.fetchone()
        if not user_row:
            return jsonify({'error': 'User not found'}), 404
        
        user_id = user_row[0]
        
        cursor.execute('''
            INSERT INTO meal_logs (
                user_id, fdc_id, food_name, serving_size, serving_unit,
                calories, protein, carbs, fat, meal_type, logged_date
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            user_id, data.get('fdc_id'), data.get('food_name'),
            data.get('serving_size'), data.get('serving_unit'),
            data.get('calories'), data.get('protein'), data.get('carbs'),
            data.get('fat'), data.get('meal_type'), data.get('logged_date', datetime.now().date())
        ))
        
        meal_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'meal_id': meal_id,
            'message': 'Meal logged successfully'
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/meals', methods=['GET'])
@firebase_auth_required
def get_meals():
    """Get user's meal history"""
    try:
        firebase_uid = request.user['uid']
        date_filter = request.args.get('date')  # Optional date filter
        days = int(request.args.get('days', 7))  # Default to 7 days
        
        conn = sqlite3.connect('nutrivault.db')
        cursor = conn.cursor()
        
        # Get user ID
        cursor.execute('SELECT id FROM users WHERE firebase_uid = ?', (firebase_uid,))
        user_row = cursor.fetchone()
        if not user_row:
            return jsonify({'error': 'User not found'}), 404
        
        user_id = user_row[0]
        
        if date_filter:
            # Get meals for specific date
            cursor.execute('''
                SELECT * FROM meal_logs 
                WHERE user_id = ? AND logged_date = ?
                ORDER BY logged_at DESC
            ''', (user_id, date_filter))
        else:
            # Get meals for last N days
            cursor.execute('''
                SELECT * FROM meal_logs 
                WHERE user_id = ? AND logged_date >= date('now', '-{} days')
                ORDER BY logged_date DESC, logged_at DESC
            '''.format(days), (user_id,))
        
        meals = []
        for row in cursor.fetchall():
            meals.append({
                'id': row[0],
                'fdc_id': row[2],
                'food_name': row[3],
                'serving_size': row[4],
                'serving_unit': row[5],
                'calories': row[6],
                'protein': row[7],
                'carbs': row[8],
                'fat': row[9],
                'meal_type': row[10],
                'logged_date': row[11],
                'logged_at': row[12]
            })
        
        conn.close()
        
        return jsonify({
            'success': True,
            'meals': meals
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/nutrition-summary', methods=['GET'])
@firebase_auth_required
def get_nutrition_summary():
    """Get daily nutrition summary with progress towards goals"""
    try:
        firebase_uid = request.user['uid']
        date_filter = request.args.get('date', datetime.now().date())
        
        conn = sqlite3.connect('nutrivault.db')
        cursor = conn.cursor()
        
        # Get user ID
        cursor.execute('SELECT id FROM users WHERE firebase_uid = ?', (firebase_uid,))
        user_row = cursor.fetchone()
        if not user_row:
            return jsonify({'error': 'User not found'}), 404
        
        user_id = user_row[0]
        
        # Get daily totals
        cursor.execute('''
            SELECT 
                COALESCE(SUM(calories), 0) as total_calories,
                COALESCE(SUM(protein), 0) as total_protein,
                COALESCE(SUM(carbs), 0) as total_carbs,
                COALESCE(SUM(fat), 0) as total_fat,
                COUNT(*) as meal_count
            FROM meal_logs 
            WHERE user_id = ? AND logged_date = ?
        ''', (user_id, date_filter))
        
        totals = cursor.fetchone()
        
        # Get current goals (latest for user)
        cursor.execute('''
            SELECT target_calories, target_protein, target_carbs, target_fat
            FROM dietary_goals 
            WHERE user_id = ? 
            ORDER BY created_at DESC 
            LIMIT 1
        ''', (user_id,))
        
        goals = cursor.fetchone()
        
        conn.close()
        
        summary = {
            'date': str(date_filter),
            'totals': {
                'calories': round(totals[0]),
                'protein': round(totals[1], 1),
                'carbs': round(totals[2]),
                'fat': round(totals[3]),
                'meal_count': totals[4]
            },
            'goals': None,
            'progress': None
        }
        
        if goals:
            summary['goals'] = {
                'calories': round(goals[0] or 0),
                'protein': round(goals[1] or 0, 1),
                'carbs': round(goals[2] or 0),
                'fat': round(goals[3] or 0)
            }
            summary['progress'] = {
                'calories': round((totals[0] / goals[0]) * 100, 1) if goals[0] and goals[0] > 0 else 0,
                'protein': round((totals[1] / goals[1]) * 100, 1) if goals[1] and goals[1] > 0 else 0,
                'carbs': round((totals[2] / goals[2]) * 100, 1) if goals[2] and goals[2] > 0 else 0,
                'fat': round((totals[3] / goals[3]) * 100, 1) if goals[3] and goals[3] > 0 else 0
            }
        else:
            summary['goals'] = {
                'calories': 0,
                'protein': 0,
                'carbs': 0,
                'fat': 0
            }
            summary['progress'] = {
                'calories': 0,
                'protein': 0,
                'carbs': 0,
                'fat': 0
            }
        
        return jsonify({
            'success': True,
            'summary': summary
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/export/pdf', methods=['GET'])
@firebase_auth_required
def export_pdf():
    """Export nutrition report as PDF"""
    try:
        firebase_uid = request.user['uid']
        days = request.args.get('days', default=7, type=int)
        
        conn = sqlite3.connect('nutrivault.db')
        cursor = conn.cursor()
        
        # Get user ID
        cursor.execute('SELECT id FROM users WHERE firebase_uid = ?', (firebase_uid,))
        user_row = cursor.fetchone()
        if not user_row:
            return jsonify({'error': 'User not found'}), 404
        
        user_id = user_row[0]
        
        # Get nutrition data for the specified period
        cursor.execute('''
            SELECT * FROM meal_logs 
            WHERE user_id = ? 
            AND logged_date >= datetime('now', ?)
            ORDER BY logged_date DESC
        ''', (user_id, f'-{days} days'))
        
        meals = cursor.fetchall()
        
        # Generate PDF report
        # Note: You'll need to implement the actual PDF generation logic here
        # This is a placeholder that returns a simple text file
        report_content = f"Nutrition Report for the last {days} days\n\n"
        for meal in meals:
            report_content += f"Meal: {meal[3]} - {meal[4]}\n"
        
        conn.close()
        
        # Return the report as a PDF file
        return Response(
            report_content,
            mimetype='application/pdf',
            headers={
                'Content-Disposition': f'attachment; filename=nutrition_report_{datetime.now().strftime("%Y%m%d")}.pdf'
            }
        )
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/search/<query>')
def search_foods(query):
    """Search for foods using USDA API"""
    client_ip = request.remote_addr
    
    # Rate limiting check
    if is_rate_limited(client_ip):
        return jsonify({
            'success': False,
            'error': 'Too many requests. Please try again later.'
        }), 429
    
    try:
        params = {
            'query': query,
            'dataType': ['Foundation', 'SR Legacy'],
            'pageSize': 10,
            'api_key': USDA_API_KEY
        }
        
        response = requests.get(f'{USDA_BASE_URL}/foods/search', params=params)
        
        print(f"USDA API Response Status: {response.status_code}")
        print(f"USDA API Response: {response.text[:500]}...")  # Log first 500 chars
        
        if response.status_code == 200:
            data = response.json()
            
            # Simplify the response for frontend
            simplified_results = []
            for food in data.get('foods', []):
                simplified_food = {
                    'fdcId': food.get('fdcId'),
                    'description': food.get('description'),
                    'dataType': food.get('dataType'),
                    'brandOwner': food.get('brandOwner'),
                    'nutrients': []
                }
                
                # Extract key nutrients for preview
                for nutrient in food.get('foodNutrients', []):
                    nutrient_name = nutrient.get('nutrientName', '').lower()
                    if any(key in nutrient_name for key in ['energy', 'protein', 'carbohydrate', 'fat']):
                        simplified_food['nutrients'].append({
                            'name': nutrient.get('nutrientName'),
                            'amount': nutrient.get('value', 0),
                            'unit': nutrient.get('unitName', '')
                        })
                
                simplified_results.append(simplified_food)
            
            return jsonify({
                'success': True,
                'foods': simplified_results,
                'totalHits': data.get('totalHits', 0)
            })
        else:
            print(f"USDA API Error: Status {response.status_code}, Response: {response.text}")
            return jsonify({
                'success': False,
                'error': f'USDA API returned status {response.status_code}: {response.text[:200]}'
            }), 500
            
    except requests.exceptions.RequestException as e:
        print(f"Request Error: {e}")
        return jsonify({
            'success': False,
            'error': f'Network error: {str(e)}'
        }), 500
    except Exception as e:
        print(f"General Error: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/food/<fdc_id>')
def get_food_details(fdc_id):
    """Get detailed nutrition data for a specific food item"""
    client_ip = request.remote_addr
    
    # Rate limiting check
    if is_rate_limited(client_ip):
        return jsonify({
            'success': False,
            'error': 'Too many requests. Please try again later.'
        }), 429
    
    try:
        params = {
            'api_key': USDA_API_KEY
        }
        
        response = requests.get(f'{USDA_BASE_URL}/food/{fdc_id}', params=params)
        
        if response.status_code == 200:
            data = response.json()
            
            # Organize nutrients into categories
            macros = {}
            micros = {}
            other_nutrients = {}
            
            for nutrient in data.get('foodNutrients', []):
                nutrient_name = nutrient.get('nutrient', {}).get('name', '')
                nutrient_value = nutrient.get('amount', 0)
                nutrient_unit = nutrient.get('nutrient', {}).get('unitName', '')
                
                # Categorize nutrients
                if 'energy' in nutrient_name.lower() or 'calorie' in nutrient_name.lower():
                    macros['calories'] = {
                        'name': nutrient_name,
                        'amount': nutrient_value,
                        'unit': nutrient_unit
                    }
                elif 'protein' in nutrient_name.lower():
                    macros['protein'] = {
                        'name': nutrient_name,
                        'amount': nutrient_value,
                        'unit': nutrient_unit
                    }
                elif 'carbohydrate' in nutrient_name.lower() and 'by difference' in nutrient_name.lower():
                    macros['carbohydrates'] = {
                        'name': nutrient_name,
                        'amount': nutrient_value,
                        'unit': nutrient_unit
                    }
                elif 'total lipid' in nutrient_name.lower() or ('fat' in nutrient_name.lower() and 'total' in nutrient_name.lower()):
                    macros['fat'] = {
                        'name': nutrient_name,
                        'amount': nutrient_value,
                        'unit': nutrient_unit
                    }
                elif any(vitamin in nutrient_name.lower() for vitamin in ['vitamin', 'folate', 'niacin', 'riboflavin', 'thiamin']):
                    micros[nutrient_name] = {
                        'name': nutrient_name,
                        'amount': nutrient_value,
                        'unit': nutrient_unit
                    }
                elif any(mineral in nutrient_name.lower() for mineral in ['calcium', 'iron', 'magnesium', 'phosphorus', 'potassium', 'sodium', 'zinc']):
                    micros[nutrient_name] = {
                        'name': nutrient_name,
                        'amount': nutrient_value,
                        'unit': nutrient_unit
                    }
                else:
                    other_nutrients[nutrient_name] = {
                        'name': nutrient_name,
                        'amount': nutrient_value,
                        'unit': nutrient_unit
                    }
            
            nutrition_data = {
                'fdcId': data.get('fdcId'),
                'description': data.get('description'),
                'dataType': data.get('dataType'),
                'brandOwner': data.get('brandOwner'),
                'servingSize': data.get('servingSize'),
                'servingSizeUnit': data.get('servingSizeUnit'),
                'householdServingFullText': data.get('householdServingFullText'),
                'macronutrients': macros,
                'micronutrients': micros,
                'otherNutrients': other_nutrients
            }
            
            return jsonify({
                'success': True,
                'food': nutrition_data
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Food item not found'
            }), 404
            
    except requests.exceptions.RequestException as e:
        print(f"Request Error: {e}")
        return jsonify({
            'success': False,
            'error': f'Network error: {str(e)}'
        }), 500
    except Exception as e:
        print(f"General Error: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/history', methods=['GET'])
@firebase_auth_required
def get_history():
    """Get search history for the current user"""
    try:
        firebase_uid = request.user['uid']
        conn = sqlite3.connect('nutrivault.db')
        cursor = conn.cursor()
        # Get user ID
        cursor.execute('SELECT id FROM users WHERE firebase_uid = ?', (firebase_uid,))
        user_row = cursor.fetchone()
        if not user_row:
            return jsonify({'success': False, 'error': 'User not found'}), 404
        user_id = user_row[0]
        # Query only this user's history
        cursor.execute('''
            SELECT fdc_id, food_name, searched_at, nutrition_data 
            FROM search_history 
            WHERE user_id = ?
            ORDER BY searched_at DESC 
            LIMIT 20
        ''', (user_id,))
        history = []
        for row in cursor.fetchall():
            history.append({
                'fdcId': row[0],
                'foodName': row[1],
                'searchedAt': row[2],
                'nutritionData': json.loads(row[3]) if row[3] else None
            })
        conn.close()
        return jsonify({'success': True, 'history': history})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/history', methods=['POST'])
@firebase_auth_required
def add_to_history():
    """Add a food item to search history for the current user"""
    try:
        data = request.get_json()
        fdc_id = data.get('fdcId')
        food_name = data.get('foodName')
        nutrition_data = data.get('nutritionData')
        firebase_uid = request.user['uid']
        conn = sqlite3.connect('nutrivault.db')
        cursor = conn.cursor()
        # Get user ID
        cursor.execute('SELECT id FROM users WHERE firebase_uid = ?', (firebase_uid,))
        user_row = cursor.fetchone()
        if not user_row:
            return jsonify({'success': False, 'error': 'User not found'}), 404
        user_id = user_row[0]
        # Check if item already exists in recent history for this user
        cursor.execute('''
            SELECT id FROM search_history 
            WHERE user_id = ? AND fdc_id = ? AND datetime(searched_at) > datetime('now', '-1 day')
        ''', (user_id, fdc_id))
        if not cursor.fetchone():
            # Add new entry
            cursor.execute('''
                INSERT INTO search_history (user_id, fdc_id, food_name, nutrition_data)
                VALUES (?, ?, ?, ?)
            ''', (user_id, fdc_id, food_name, json.dumps(nutrition_data)))
            # Keep only last 50 entries for this user
            cursor.execute('''
                DELETE FROM search_history 
                WHERE user_id = ? AND id NOT IN (
                    SELECT id FROM search_history 
                    WHERE user_id = ?
                    ORDER BY searched_at DESC 
                    LIMIT 50
                )
            ''', (user_id, user_id))
        conn.commit()
        conn.close()
        return jsonify({'success': True, 'message': 'Added to history'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/health')
def health_check():
    """Health check endpoint"""
    return jsonify({
        'success': True,
        'message': 'Nutrivault API is running!',
        'timestamp': datetime.now().isoformat()
    })

@app.route('/api/profile/update', methods=['POST'])
@firebase_auth_required
def update_user_profile():
    """Update user profile information"""
    try:
        firebase_uid = request.user['uid']
        data = request.get_json()
        
        conn = sqlite3.connect('nutrivault.db')
        cursor = conn.cursor()
        
        # Get user ID
        cursor.execute('SELECT id FROM users WHERE firebase_uid = ?', (firebase_uid,))
        user_row = cursor.fetchone()
        if not user_row:
            return jsonify({'error': 'User not found'}), 404
        
        user_id = user_row[0]
        
        # Update user profile
        cursor.execute('''
            UPDATE users 
            SET age = ?, 
                weight = ?, 
                height = ?, 
                activity_level = ?, 
                dietary_goal = ?, 
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        ''', (
            data.get('age'),
            data.get('weight'),
            data.get('height'),
            data.get('activity_level'),
            data.get('dietary_goal'),
            user_id
        ))
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'Profile updated successfully'
        })
        
    except Exception as e:
        print(f"Error updating profile: {str(e)}")  # Add logging
        return jsonify({'error': str(e)}), 500

@app.route('/api/meals/<int:meal_id>', methods=['PUT'])
@firebase_auth_required
def update_meal(meal_id):
    """Update a logged meal (serving size, meal type, etc.)"""
    try:
        firebase_uid = request.user['uid']
        data = request.get_json()

        conn = sqlite3.connect('nutrivault.db')
        cursor = conn.cursor()

        # Get user ID
        cursor.execute('SELECT id FROM users WHERE firebase_uid = ?', (firebase_uid,))
        user_row = cursor.fetchone()
        if not user_row:
            return jsonify({'error': 'User not found'}), 404
        user_id = user_row[0]

        # Ensure the meal belongs to the user
        cursor.execute('SELECT id FROM meal_logs WHERE id = ? AND user_id = ?', (meal_id, user_id))
        if not cursor.fetchone():
            conn.close()
            return jsonify({'error': 'Meal not found or not authorized'}), 404

        # Update allowed fields
        update_fields = []
        params = []
        for field in ['serving_size', 'serving_unit', 'calories', 'protein', 'carbs', 'fat', 'meal_type', 'logged_date']:
            if field in data:
                update_fields.append(f"{field} = ?")
                params.append(data[field])
        if not update_fields:
            conn.close()
            return jsonify({'error': 'No fields to update'}), 400
        params.append(meal_id)
        cursor.execute(f"UPDATE meal_logs SET {', '.join(update_fields)} WHERE id = ?", params)
        conn.commit()
        conn.close()
        return jsonify({'success': True, 'message': 'Meal updated successfully'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/meals/<int:meal_id>', methods=['DELETE'])
@firebase_auth_required
def delete_meal(meal_id):
    """Delete a logged meal"""
    try:
        firebase_uid = request.user['uid']
        conn = sqlite3.connect('nutrivault.db')
        cursor = conn.cursor()
        # Get user ID
        cursor.execute('SELECT id FROM users WHERE firebase_uid = ?', (firebase_uid,))
        user_row = cursor.fetchone()
        if not user_row:
            return jsonify({'error': 'User not found'}), 404
        user_id = user_row[0]
        # Ensure the meal belongs to the user
        cursor.execute('SELECT id FROM meal_logs WHERE id = ? AND user_id = ?', (meal_id, user_id))
        if not cursor.fetchone():
            conn.close()
            return jsonify({'error': 'Meal not found or not authorized'}), 404
        cursor.execute('DELETE FROM meal_logs WHERE id = ?', (meal_id,))
        conn.commit()
        conn.close()
        return jsonify({'success': True, 'message': 'Meal deleted successfully'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def add_user_id_to_search_history():
    conn = sqlite3.connect('nutrivault.db')
    cursor = conn.cursor()
    try:
        cursor.execute('ALTER TABLE search_history ADD COLUMN user_id INTEGER')
    except Exception:
        pass  # Column may already exist
    conn.commit()
    conn.close()

add_user_id_to_search_history()

if __name__ == '__main__':
    init_db()
    port = int(os.getenv('PORT', 5002))
    app.run(debug=True, host='0.0.0.0', port=port)