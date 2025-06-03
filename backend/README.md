# Nutrivault Backend

A Flask-based API for nutritional data retrieval using the USDA FoodData Central API.

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Create a `.env` file from the example:
```bash
cp .env.example .env
```

3. Get your USDA API key from https://fdc.nal.usda.gov/api-guide.html and add it to `.env`

4. Run the application:
```bash
python app.py
```

## API Endpoints

- `GET /api/health` - Health check
- `GET /api/search/<query>` - Search for foods
- `GET /api/food/<fdc_id>` - Get detailed nutrition data
- `GET /api/history` - Get search history
- `POST /api/history` - Add item to history

## Deployment

For production deployment (e.g., Render), use:
```bash
gunicorn app:app
```
