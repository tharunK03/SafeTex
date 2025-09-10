// Simple script to create test users in Firebase
// Run this in your browser console or create a simple HTML file

import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBESxiYBuyIR9g7vmW4tFByc3q8QkCgsJk",
  authDomain: "safetex-749f9.firebaseapp.com",
  projectId: "safetex-749f9",
  storageBucket: "safetex-749f9.appspot.com",
  messagingSenderId: "811178603279",
  appId: "1:811178603279:web:27fbfb2e0d23a8b7ac847a"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const testUsers = [
  {
    email: 'admin@saft.com',
    password: 'admin123',
    displayName: 'System Administrator'
  },
  {
    email: 'production@saft.com',
    password: 'production123',
    displayName: 'Production Manager'
  },
  {
    email: 'sales@saft.com',
    password: 'sales123',
    displayName: 'Sales Representative'
  }
];

async function createTestUsers() {
  console.log('🚀 Creating test users...');
  
  for (const user of testUsers) {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        user.email,
        user.password
      );
      
      await updateProfile(userCredential.user, {
        displayName: user.displayName
      });
      
      console.log(`✅ Created user: ${user.email} (${user.displayName})`);
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        console.log(`⚠️ User already exists: ${user.email}`);
      } else {
        console.error(`❌ Error creating ${user.email}:`, error.message);
      }
    }
  }
  
  console.log('✅ Test user creation completed!');
  console.log('\n📋 Login Credentials:');
  testUsers.forEach(user => {
    console.log(`${user.displayName}: ${user.email} / ${user.password}`);
  });
}

// Run the function
createTestUsers();
