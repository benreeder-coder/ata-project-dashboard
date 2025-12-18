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

      // Render the dashboard
      await UI.render();

      // Hide loading state
      hideLoading();

      // Add smooth animations
      animateIn();

      console.log('ATA Dashboard initialized successfully');
    } catch (error) {
      console.error('Failed to initialize dashboard:', error);
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
          background: var(--bg-primary);
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
          border: 4px solid var(--border-default);
          border-top-color: var(--ata-navy);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        .loader-text {
          font-family: var(--font-sans);
          font-size: var(--text-sm);
          color: var(--text-secondary);
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
          background: var(--status-blocked-bg);
          border: 1px solid var(--status-blocked);
          padding: 2rem;
          border-radius: var(--radius-xl);
          text-align: center;
          max-width: 400px;
        }
        .dashboard-error h2 {
          color: var(--status-blocked);
          margin-bottom: 0.5rem;
        }
        .dashboard-error p {
          color: var(--text-secondary);
        }
      </style>
      <h2>⚠ Error</h2>
      <p>${message}</p>
    `;
    document.body.appendChild(error);
  }

  /**
   * Add entrance animations
   */
  function animateIn() {
    // Animate phase cards
    const phaseCards = document.querySelectorAll('.phase-card');
    phaseCards.forEach((card, index) => {
      card.style.opacity = '0';
      card.style.transform = 'translateY(20px)';
      card.style.transition = 'opacity 0.4s ease, transform 0.4s ease';

      setTimeout(() => {
        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';
      }, 100 + index * 80);
    });

    // Animate panels
    const panels = document.querySelectorAll('.section-panel');
    panels.forEach((panel, index) => {
      panel.style.opacity = '0';
      panel.style.transform = 'translateY(20px)';
      panel.style.transition = 'opacity 0.4s ease, transform 0.4s ease';

      setTimeout(() => {
        panel.style.opacity = '1';
        panel.style.transform = 'translateY(0)';
      }, 400 + index * 100);
    });
  }

  /**
   * Refresh dashboard data
   */
  window.refreshDashboard = async function () {
    showLoading();
    await UI.render();
    hideLoading();
    animateIn();
  };

  /**
   * Export data as JSON (for backup/sharing)
   */
  window.exportData = function () {
    const data = DataManager.projectData;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ata-project-data-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  /**
   * Print dashboard
   */
  window.printDashboard = function () {
    // Expand all phase cards before printing
    document.querySelectorAll('.phase-card').forEach((card) => {
      card.classList.add('expanded');
    });

    setTimeout(() => {
      window.print();
    }, 100);
  };
})();
