/**
 * ATA Dashboard - Supabase Client & Auth
 */

const SupabaseClient = {
  client: null,
  currentUser: null,
  currentTeamMember: null,

  /**
   * Initialize Supabase client
   */
  async init() {
    const { url, anonKey } = window.SUPABASE_CONFIG;

    if (url === 'YOUR_SUPABASE_URL' || anonKey === 'YOUR_SUPABASE_ANON_KEY') {
      console.error('Supabase not configured. Please update scripts/config.js');
      return false;
    }

    // Load Supabase from CDN
    if (!window.supabase) {
      await this.loadSupabaseScript();
    }

    this.client = window.supabase.createClient(url, anonKey);

    // Check for existing session
    const { data: { session } } = await this.client.auth.getSession();
    if (session) {
      this.currentUser = session.user;
      await this.loadTeamMember();
    }

    // Listen for auth changes
    this.client.auth.onAuthStateChange(async (event, session) => {
      this.currentUser = session?.user || null;
      if (session?.user) {
        await this.loadTeamMember();
      } else {
        this.currentTeamMember = null;
      }
      window.dispatchEvent(new CustomEvent('authChange', { detail: { user: this.currentUser, teamMember: this.currentTeamMember } }));
    });

    return true;
  },

  /**
   * Load Supabase script from CDN
   */
  loadSupabaseScript() {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  },

  /**
   * Load team member based on current user email
   */
  async loadTeamMember() {
    if (!this.currentUser?.email) return;

    const { data, error } = await this.client
      .from('team_members')
      .select('*')
      .eq('email', this.currentUser.email)
      .single();

    if (data) {
      this.currentTeamMember = data;
    }
  },

  /**
   * Sign up with email and password
   */
  async signUp(email, password) {
    const { data, error } = await this.client.auth.signUp({
      email,
      password
    });

    if (error) throw error;
    return data;
  },

  /**
   * Sign in with email and password
   */
  async signIn(email, password) {
    const { data, error } = await this.client.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;
    return data;
  },

  /**
   * Sign out
   */
  async signOut() {
    const { error } = await this.client.auth.signOut();
    if (error) throw error;
    this.currentUser = null;
    this.currentTeamMember = null;
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    return !!this.currentUser;
  },

  /**
   * Get current team member
   */
  getTeamMember() {
    return this.currentTeamMember;
  },

  /**
   * Check if current user is Ben (admin)
   */
  isAdmin() {
    return this.currentTeamMember?.id === 'ben';
  }
};

window.SupabaseClient = SupabaseClient;
