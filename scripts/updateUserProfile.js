// Script to update current user profile metadata
// This script requires the user to be logged in
// Run with: node scripts/updateUserProfile.js

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

// Create supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

async function updateUserProfile() {
  const firstName = 'Tarkan';
  const lastName = 'Bulut';

  console.log('Checking current user session...');

  try {
    // Check if user is logged in
    const { data: { user }, error: sessionError } = await supabase.auth.getUser();

    if (sessionError || !user) {
      console.error('No active user session found. Please log in first.');
      console.log('Alternatively, you can update your profile through the web interface.');
      return;
    }

    if (user.email !== 'tarkanbulut96@gmail.com') {
      console.error('This script is only for the user with email: tarkanbulut96@gmail.com');
      return;
    }

    console.log(`Updating profile for user: ${user.email}`);

    // Update user metadata
    const { data, error: updateError } = await supabase.auth.updateUser({
      data: {
        ...user.user_metadata,
        first_name: firstName,
        last_name: lastName,
      }
    });

    if (updateError) {
      console.error('Error updating user profile:', updateError);
      return;
    }

    console.log('Successfully updated user profile!');
    console.log(`- First Name: ${firstName}`);
    console.log(`- Last Name: ${lastName}`);
    console.log('Current user metadata:', data.user?.user_metadata);

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

updateUserProfile().catch(console.error);
