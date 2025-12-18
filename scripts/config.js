/**
 * Supabase Configuration
 * Replace these values with your Supabase project credentials
 */

const SUPABASE_URL = 'YOUR_SUPABASE_URL'; // e.g., https://xxxxx.supabase.co
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY'; // starts with eyJ...

// Export for use in other modules
window.SUPABASE_CONFIG = {
  url: SUPABASE_URL,
  anonKey: SUPABASE_ANON_KEY
};
