# Firebase Setup Instructions for Nutrivault

To enable authentication and advanced features, you need to set up a Firebase project:

## 1. Create a Firebase Project

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or "Add project"
3. Enter a project name (e.g., "nutrivault")
4. Follow the setup wizard

## 2. Enable Authentication

1. In your Firebase project, go to "Authentication" in the left sidebar
2. Click "Get started"
3. Go to the "Sign-in method" tab
4. Enable "Email/password" authentication
5. (Optional) Enable other sign-in methods as needed

## 3. Get Configuration

### Frontend Configuration
1. Go to Project Settings (gear icon) → General tab
2. Scroll down to "Your apps" section
3. Click "Add app" → Web app (</>) 
4. Register your app with a nickname (e.g., "nutrivault-web")
5. Copy the firebaseConfig object
6. Replace the placeholder values in `/frontend/src/config/firebase.js`

Example:
```javascript
const firebaseConfig = {
  apiKey: "your-actual-api-key",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456"
};
```

### Backend Configuration (Service Account)
1. Go to Project Settings → Service accounts tab
2. Click "Generate new private key"
3. Download the JSON file
4. Rename it to `firebase-service-account.json`
5. Place it in the `/backend/` directory
6. Make sure it's added to `.gitignore` for security

## 4. Update CORS Settings (if needed)

In your Firebase project:
1. Go to Authentication → Settings
2. Add your domain to "Authorized domains":
   - `localhost` (for development)
   - Your production domain (when deployed)

## 5. Test the Setup

1. Start the backend: `cd backend && python app.py`
2. Start the frontend: `cd frontend && npm run dev`
3. Try creating an account and logging in
4. Test meal logging and PDF export features

## Security Notes

- Never commit your `firebase-service-account.json` file to version control
- Keep your API keys secure
- In production, set up proper environment variables
- Review Firebase security rules

## Troubleshooting

- If you get CORS errors, check your Firebase project's authorized domains
- If authentication fails, verify your API keys are correct
- Check the browser console for detailed error messages
- Ensure both backend and frontend are using the same Firebase project

## Current Status

✅ Backend Firebase integration complete
✅ Frontend authentication UI complete  
✅ Meal logging system complete
✅ User dashboard with progress tracking
✅ PDF export functionality
⏳ **Firebase project setup needed** (replace placeholder config)

Once you complete the Firebase setup, all authentication and meal tracking features will be fully functional!
