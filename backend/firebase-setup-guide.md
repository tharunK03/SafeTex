# Firebase Setup Guide for SAFT ERP

## 1. Firebase Project Configuration

After creating your Firebase project, update these environment variables in your `.env` file:

```env
# Firebase Configuration
FIREBASE_PROJECT_ID=your-project-id-here
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=your-client-id
FIREBASE_CLIENT_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-xxxxx%40your-project-id.iam.gserviceaccount.com
```

## 2. Service Account Setup

1. Download the service account JSON file from Firebase Console
2. Extract the values and update your `.env` file
3. Make sure to keep the private key secure

## 3. Firestore Security Rules

Add these rules to your Firestore database:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read/write access to all documents for authenticated users
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
    
    // For development, you can use these rules (less secure):
    // match /{document=**} {
    //   allow read, write: if true;
    // }
  }
}
```

## 4. Collections Structure

Your Firestore will have these collections:
- `users` - User accounts
- `customers` - Customer information
- `products` - Product catalog
- `orders` - Order records
- `orderItems` - Order line items
- `rawMaterials` - Raw material inventory
- `productionLogs` - Production tracking
- `invoices` - Invoice records

## 5. Testing Connection

Run the test script to verify everything works:
```bash
node test-firestore.js
```




