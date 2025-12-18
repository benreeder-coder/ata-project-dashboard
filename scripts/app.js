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

      // Initialize Supabase if configured
      const supabaseReady = await SupabaseClient.init();
      if (supabaseReady) {
        console.log('Supabase initialized');
      } else {
        console.log('Running in offline mode (no Supabase)');
      }

      // Listen for auth changes
      window.addEventListener('authChange', () => {
        UI.render();
      });

      // Render the dashboard
      await UI.render();

      // Hide loading state
      hideLoading();

      console.log('ATA Dashboard initialized successfully');
    } catch (error) {
      console.error('Failed to initialize dashboard:', error);
      hideLoading();
      showError('Failed to load dashboard. Please refresh the page.');
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
   * Show error message
   */
  function showError(message) {
    const error = document.createElement('div');
    error.className = 'dashboard-error';
    error.innerHTML = `
      <style>
        .dashboard-error {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: var(--danger-bg, #FEF2F2);
          border: 1px solid var(--danger, #EF4444);
          padding: 2rem;
          border-radius: 14px;
          text-align: center;
          max-width: 400px;
        }
        .dashboard-error h2 {
          color: var(--danger, #EF4444);
          margin-bottom: 0.5rem;
        }
        .dashboard-error p {
          color: var(--ink-muted, #334155);
        }
      </style>
      <h2>Error</h2>
      <p>${message}</p>
    `;
    document.body.appendChild(error);
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
