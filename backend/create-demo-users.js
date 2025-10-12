require('dotenv').config();
const { supabase } = require('./src/config/supabase');

async function createDemoUsers() {
  const demoUsers = [
    {
      email: 'admin@saft.com',
      password: 'admin123',
      role: 'admin',
      full_name: 'Admin User'
    },
    {
      email: 'production@saft.com',
      password: 'production123',
      role: 'production_manager',
      full_name: 'Production Manager'
    },
    {
      email: 'sales@saft.com',
      password: 'sales123',
      role: 'sales',
      full_name: 'Sales User'
    }
  ];

  console.log('🚀 Creating demo users...\n');

  for (const user of demoUsers) {
    try {
      console.log(`Creating ${user.role}: ${user.email}`);
      
      const { data, error } = await supabase.auth.signUp({
        email: user.email,
        password: user.password,
        options: {
          data: {
            full_name: user.full_name,
            role: user.role
          }
        }
      });

      if (error) {
        if (error.message.includes('already registered')) {
          console.log(`✅ ${user.email} already exists`);
        } else {
          console.error(`❌ Error creating ${user.email}:`, error.message);
        }
      } else {
        console.log(`✅ ${user.email} created successfully`);
        console.log(`   ID: ${data.user?.id}`);
        console.log(`   Confirmed: ${data.user?.email_confirmed_at ? 'Yes' : 'No'}`);
      }
    } catch (error) {
      console.error(`❌ Error creating ${user.email}:`, error.message);
    }
    console.log('---');
  }

  console.log('\n🎉 Demo users setup complete!');
  console.log('\n📋 Demo Login Credentials:');
  console.log('Admin: admin@saft.com / admin123');
  console.log('Production: production@saft.com / production123');
  console.log('Sales: sales@saft.com / sales123');
  console.log('\n⚠️  Note: Users may need email confirmation before login.');
  console.log('   To disable email confirmation, go to Supabase Dashboard > Authentication > Settings');
}

createDemoUsers();
