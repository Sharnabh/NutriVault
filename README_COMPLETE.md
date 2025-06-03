# 🍎 Nutrivault - Advanced Nutrition Tracking Application

A comprehensive nutrition tracking application with Firebase authentication, meal logging, dietary goal tracking, and PDF reporting.

## ✨ Features

### 🔍 **Food Search & Analysis**
- Search USDA's comprehensive food database
- Detailed nutritional information with macro and micronutrients
- Visual charts and analysis
- Search history tracking

### 🔐 **User Authentication** (Firebase)
- Email/password authentication
- User profile management
- Secure session handling

### 🎯 **Dietary Goal Tracking**
- Personalized calorie and macro goals
- Weight loss, muscle gain, and maintenance plans
- Activity level considerations
- Progress tracking with visual indicators

### 📝 **Meal Logging**
- Log meals with custom serving sizes
- Daily nutrition summaries
- Meal history with date tracking
- Real-time progress updates

### 📊 **Advanced Analytics**
- Daily nutrition dashboard
- Progress bars for macro targets
- Recent meals overview
- Goal achievement tracking

### 📄 **PDF Export**
- Generate comprehensive nutrition reports
- Meal logs and nutrition summaries
- Professional formatting with ReportLab

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- Node.js 16+
- Firebase project (see FIREBASE_SETUP.md)

### Backend Setup
```bash
cd backend
pip install -r requirements.txt
# Set up Firebase service account (see FIREBASE_SETUP.md)
python app.py
```

### Frontend Setup
```bash
cd frontend
npm install
# Configure Firebase (see FIREBASE_SETUP.md)
npm run dev
```

## 🏗️ Project Structure

```
Nutrivault/
├── backend/                    # Flask API server
│   ├── app.py                 # Main application with Firebase auth
│   ├── requirements.txt       # Python dependencies
│   ├── firebase-service-account.json.example
│   └── nutrivault.db         # SQLite database
├── frontend/                  # React application
│   ├── src/
│   │   ├── components/       # UI components
│   │   │   ├── AuthModal.jsx         # Login/signup modal
│   │   │   ├── UserDashboard.jsx     # User profile & progress
│   │   │   ├── MealLogModal.jsx      # Meal logging interface
│   │   │   └── ...
│   │   ├── contexts/
│   │   │   └── AuthContext.jsx       # Firebase auth context
│   │   ├── config/
│   │   │   └── firebase.js           # Firebase configuration
│   │   └── services/
│   │       └── api.js               # API service layer
│   └── package.json
└── FIREBASE_SETUP.md          # Firebase setup instructions
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/verify` - Verify Firebase ID token
- `GET /api/profile` - Get user profile
- `PUT /api/profile` - Update user profile

### Meal Tracking
- `POST /api/meals` - Log a meal
- `GET /api/nutrition-summary` - Get daily nutrition summary

### Food Data
- `GET /api/search` - Search USDA food database
- `GET /api/food/:id` - Get detailed food information

### Reports
- `GET /api/export/pdf` - Generate PDF nutrition report

## 🎨 UI Components

### **AuthModal**
- Unified login/signup interface
- Form validation and error handling
- Password visibility toggle

### **UserDashboard**
- Profile management with editable fields
- Dietary goal configuration
- Nutrition progress visualization
- Recent meals overview

### **MealLogModal**
- Serving size calculator
- Real-time nutrition calculation
- Date selection for meal logging

### **Nutrition Tracking**
- Daily calorie and macro progress bars
- Goal achievement indicators
- Historical meal data

## 🛠️ Technologies Used

### Backend
- **Flask** - Web framework
- **Firebase Admin SDK** - Authentication
- **SQLite** - Database
- **ReportLab** - PDF generation
- **Requests** - USDA API integration

### Frontend
- **React** - UI framework
- **Firebase** - Authentication
- **Tailwind CSS** - Styling
- **Lucide React** - Icons
- **Vite** - Build tool

## 📊 Database Schema

### Users Table
```sql
CREATE TABLE users (
    firebase_uid TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    display_name TEXT,
    age INTEGER,
    weight REAL,
    height REAL,
    activity_level TEXT,
    dietary_goal TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Dietary Goals Table
```sql
CREATE TABLE dietary_goals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT,
    calories_goal INTEGER,
    protein_goal REAL,
    carbs_goal REAL,
    fat_goal REAL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (firebase_uid)
);
```

### Meal Logs Table
```sql
CREATE TABLE meal_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT,
    food_id TEXT,
    food_name TEXT,
    serving_size REAL,
    calories REAL,
    protein REAL,
    carbs REAL,
    fat REAL,
    meal_date DATE,
    logged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (firebase_uid)
);
```

## 🔥 Firebase Integration

### Authentication Flow
1. User signs up/logs in through AuthModal
2. Firebase generates ID token
3. Backend verifies token with Firebase Admin SDK
4. User profile created/retrieved from database
5. Authenticated requests include Firebase ID token

### Security
- All sensitive endpoints protected by Firebase authentication
- ID tokens verified on each request
- User data isolated by Firebase UID

## 📈 Usage Examples

### Search and Log a Meal
1. Search for "chicken breast" in the main search bar
2. Click on a food item to view detailed nutrition
3. Click "Log Meal" button (requires authentication)
4. Adjust serving size and select meal date
5. Click "Log Meal" to save to your daily intake

### View Progress
1. Click "Dashboard" in the header
2. Navigate to "Nutrition Summary" tab
3. View daily progress bars and recent meals
4. Export PDF report for detailed analysis

### Set Dietary Goals
1. Open Dashboard → Profile & Goals tab
2. Edit personal information (age, weight, height)
3. Select activity level and dietary goal
4. Save to automatically calculate macro targets

## 🚧 Development Status

✅ **Completed Features:**
- ✅ User authentication with Firebase
- ✅ Meal logging with serving size calculation
- ✅ Dietary goal tracking and calculation
- ✅ Daily nutrition progress dashboard
- ✅ PDF export functionality
- ✅ Responsive UI design
- ✅ Real-time progress tracking

⏳ **Setup Required:**
- ⏳ Firebase project configuration (see FIREBASE_SETUP.md)

🔮 **Future Enhancements:**
- 📱 Mobile app version
- 🍽️ Meal planning features
- 📊 Advanced analytics and trends
- 🤝 Social sharing and challenges
- 🛒 Grocery list generation
- 📷 Barcode scanning

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- USDA FoodData Central for comprehensive nutrition data
- Firebase for authentication infrastructure
- React and Flask communities for excellent documentation

---

**Ready to track your nutrition?** 🍎 Set up Firebase and start logging your meals today!
