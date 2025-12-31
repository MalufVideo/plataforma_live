// Temporary script to create master admin user
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://supabasekong-mo0gsg800wo4csgw4w04gggs.72.60.142.28.sslip.io';
const supabaseAnonKey = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc2NDYzNzMyMCwiZXhwIjo0OTIwMzEwOTIwLCJyb2xlIjoiYW5vbiJ9.CqUFsTjOYVzcSNZBWCrVBsMTlWDJz5RTU_s24lm604w';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createMasterAdmin() {
  try {
    console.log('Creating user...');

    // Sign up the user
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email: 'nelsonhdvideo@gmail.com',
      password: 'Bananeta1234@',
      options: {
        data: {
          name: 'Nelson Master Admin',
          username: 'nelson-admin'
        }
      }
    });

    if (signUpError) {
      console.error('Error creating user:', signUpError);
      return;
    }

    console.log('User created:', authData.user.id);

    // Update role to MASTER_ADMIN
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ role: 'MASTER_ADMIN' })
      .eq('id', authData.user.id);

    if (updateError) {
      console.error('Error updating role:', updateError);
      return;
    }

    console.log('✅ Master admin created successfully!');
    console.log('Email: nelsonhdvideo@gmail.com');
    console.log('Password: Bananeta1234@');
    console.log('Role: MASTER_ADMIN');

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

createMasterAdmin();
