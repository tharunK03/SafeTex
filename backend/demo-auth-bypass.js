import 'dotenv/config';
import { supabase } from './src/config/supabase.js';

// Demo users that can bypass email confirmation
const DEMO_USERS = {
  'admin@saft.com': { password: 'admin123', role: 'admin', name: 'Admin User' },
  'production@saft.com': { password: 'production123', role: 'production_manager', name: 'Production Manager' },
  'sales@saft.com': { password: 'sales123', role: 'sales', name: 'Sales User' }
};

async function createDemoToken(email) {
  try {
    const user = DEMO_USERS[email];
    if (!user) {
      throw new Error('Demo user not found');
    }

    // Create a simple JWT-like token for demo purposes
    const demoToken = Buffer.from(JSON.stringify({
      sub: `demo-${email}`,
      email: email,
      role: user.role,
      name: user.name,
      demo: true
    })).toString('base64');

    return demoToken;
  } catch (error) {
    console.error('Error creating demo token:', error.message);
    return null;
  }
}

function verifyDemoToken(token) {
  try {
    console.log('Token to decode:', token);
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
    console.log('Decoded token:', decoded);
    
    if (decoded.demo && DEMO_USERS[decoded.email]) {
      return {
        id: decoded.sub,
        email: decoded.email,
        user_metadata: {
          full_name: decoded.name,
          role: decoded.role
        }
      };
    }
    return null;
  } catch (error) {
    return null;
  }
}

export { createDemoToken, verifyDemoToken, DEMO_USERS };
