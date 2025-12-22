/**
 * Script to find your old Base44 user ID
 * 
 * Run this in your browser console (F12) on your app
 */

console.log('🔍 Searching for old Base44 user ID...\n');

// Check localStorage
console.log('📦 Checking localStorage:');
const localStorageKeys = Object.keys(localStorage);
localStorageKeys.forEach(key => {
  const value = localStorage.getItem(key);
  if (key.toLowerCase().includes('user') || key.toLowerCase().includes('base44') || key.toLowerCase().includes('id')) {
    console.log(`  ${key}:`, value);
  }
});

// Check sessionStorage
console.log('\n📦 Checking sessionStorage:');
const sessionStorageKeys = Object.keys(sessionStorage);
sessionStorageKeys.forEach(key => {
  const value = sessionStorage.getItem(key);
  if (key.toLowerCase().includes('user') || key.toLowerCase().includes('base44') || key.toLowerCase().includes('id')) {
    console.log(`  ${key}:`, value);
  }
});

// Try to access Base44 SDK
console.log('\n🔍 Trying to access Base44 SDK:');
try {
  // Check if base44 is still available
  if (typeof window !== 'undefined') {
    // Try to import base44
    import('/src/api/base44Client.js').then(({ base44 }) => {
      console.log('✅ Base44 SDK found:', base44);
      console.log('App ID:', base44.appId || 'Not found');
      
      // Try to get user info if possible
      if (base44.auth) {
        base44.auth.getUser().then(user => {
          console.log('Base44 User:', user);
        }).catch(err => {
          console.log('Could not get Base44 user:', err.message);
        });
      }
    }).catch(err => {
      console.log('❌ Could not load Base44 SDK:', err.message);
    });
  }
} catch (error) {
  console.log('❌ Error accessing Base44:', error.message);
}

// Check cookies
console.log('\n🍪 Checking cookies:');
document.cookie.split(';').forEach(cookie => {
  const [key, value] = cookie.trim().split('=');
  if (key.toLowerCase().includes('user') || key.toLowerCase().includes('id') || key.toLowerCase().includes('base44')) {
    console.log(`  ${key}:`, value);
  }
});

// Check current Supabase user
console.log('\n✅ Current Supabase User:');
import('/src/api/supabaseClient.js').then(({ supabase }) => {
  supabase.auth.getSession().then(({ data: { session } }) => {
    if (session) {
      console.log('  User ID:', session.user.id);
      console.log('  Email:', session.user.email);
    } else {
      console.log('  Not signed in');
    }
  });
});

console.log('\n✨ Check the output above for your old user ID!');


