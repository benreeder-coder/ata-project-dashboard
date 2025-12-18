/**
 * ATA Project Dashboard - Main Application
 */

(function () {
  'use strict';

  // Initialize dashboard when DOM is ready
  document.addEventListener('DOMContentLoaded', async () => {
    try {
      // Show loading state
      showLoading();

      // Initialize Supabase - this is required
      const supabaseReady = await SupabaseClient.init();

      if (!supabaseReady) {
        // Supabase not configured - show login screen anyway
        hideLoading();
        UI.renderLoginScreen();
        console.log('Supabase not configured - showing login screen');
        return;
      }

      // Check authentication BEFORE trying to render dashboard
      const isAuth = SupabaseClient.isAuthenticated();

      if (!isAuth) {
        // Not authenticated - show login screen immediately
        hideLoading();
        UI.renderLoginScreen();
        console.log('User not authenticated - showing login screen');
        return;
      }

      // Listen for auth changes
      window.addEventListener('authChange', (e) => {
        if (e.detail?.user) {
          // User logged in - reload to show dashboard
          window.location.reload();
        } else {
          // User logged out - show login screen
          UI.renderLoginScreen();
        }
      });

      // User is authenticated - render the dashboard
      await UI.render();

      // Hide loading state
      hideLoading();

      console.log('ATA Dashboard initialized successfully');
    } catch (error) {
      console.error('Failed to initialize dashboard:', error);
      hideLoading();
      // On any error, show login screen instead of error
      UI.renderLoginScreen();
    }
  });

  /**
   * Show loading indicator
   */
  function showLoading() {
    const loader = document.createElement('div');
    loader.id = 'dashboard-loader';
    loader.innerHTML = `
      <style>
        #dashboard-loader {
          position: fixed;
          inset: 0;
          background: var(--paper, #FAFBFC);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          z-index: 9999;
        }
        .loader-spinner {
          width: 48px;
          height: 48px;
          border: 4px solid var(--paper-cool, #F1F5F9);
          border-top-color: var(--accent, #0077B5);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        .loader-text {
          font-family: var(--font-body, system-ui);
          font-size: 14px;
          color: var(--muted, #94A3B8);
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      </style>
      <div class="loader-spinner"></div>
      <div class="loader-text">Loading dashboard...</div>
    `;
    document.body.appendChild(loader);
  }

  /**
   * Hide loading indicator
   */
  function hideLoading() {
    const loader = document.getElementById('dashboard-loader');
    if (loader) {
      loader.style.opacity = '0';
      loader.style.transition = 'opacity 0.3s ease';
      setTimeout(() => loader.remove(), 300);
    }
  }

  /**
   * Refresh dashboard data
   */
  window.refreshDashboard = async function () {
    showLoading();
    await UI.render();
    hideLoading();
  };
})();
