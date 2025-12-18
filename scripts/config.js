/**
 * Supabase Configuration
 */

const SUPABASE_URL = 'https://aocgruwdftscjmwmebrt.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvY2dydXdkZnRzY2ptd21lYnJ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYwOTc1MTEsImV4cCI6MjA4MTY3MzUxMX0.d6ju7X8lsQh19d94xzLOdrfpLEmQWHCeK2PZwIuwBPc';

// Export for use in other modules
window.SUPABASE_CONFIG = {
  url: SUPABASE_URL,
  anonKey: SUPABASE_ANON_KEY
};
