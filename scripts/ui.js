/**
 * ATA Project Dashboard - UI Module
 * Interactive interface with auth and task management
 */

const UI = {
  activePhase: null,
  viewMode: 'all', // 'all' or 'my'

  async render() {
    // Check if user is authenticated
    const isAuth = window.SupabaseClient?.isAuthenticated();

    if (!isAuth) {
      this.renderLoginScreen();
      return;
    }

    const data = await DataManager.loadData();
    if (!data) {
      document.body.innerHTML = '<div class="empty-state"><div class="empty-icon">!</div><div class="empty-text">Failed to load project data</div></div>';
      return;
    }

    // Find the current active phase
    this.activePhase = data.phases.find(p => p.status === 'in_progress')
      || data.phases.find(p => p.status !== 'complete')
      || data.phases[0];

    // Restore the dashboard HTML if we're coming from login screen
    this.ensureDashboardStructure();

    this.renderTopBar(data);
    this.renderUserMenu();
    this.renderHeroStats(data);
    this.renderPhaseNav(data);
    this.renderPhaseDetail(this.activePhase, data);
    this.renderActionItems(data);
    this.renderBlockers(data);
    this.renderTeam(data);
    this.attachEventListeners(data);

    setTimeout(() => this.animateProgress(data), 100);
  },

  renderLoginScreen() {
    const teamMember = window.SupabaseClient?.getTeamMember();

    document.body.innerHTML = `
      <div class="login-screen">
        <div class="login-container">
          <div class="login-header">
            <div class="login-logo">
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                <rect width="48" height="48" rx="12" fill="var(--accent)"/>
                <path d="M14 24L22 32L34 16" stroke="white" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <h1 class="login-title">BTB AI - ATA Automation</h1>
            <p class="login-subtitle">Project Dashboard</p>
          </div>

          <div class="login-card">
            <div class="login-card-header">
              <h2 id="login-mode-title">Sign In</h2>
              <p class="login-card-text">Enter your credentials to access the dashboard</p>
            </div>

            <form id="login-form" class="login-form">
              <div class="form-group">
                <label for="login-email">Email Address</label>
                <input type="email" id="login-email" placeholder="you@example.com" required autocomplete="email">
              </div>
              <div class="form-group">
                <label for="login-password">Password</label>
                <input type="password" id="login-password" placeholder="••••••••" required minlength="6" autocomplete="current-password">
              </div>
              <button type="submit" class="btn-primary btn-full" id="login-submit">Sign In</button>
            </form>

            <div id="login-message" class="login-message"></div>

            <div class="login-footer">
              <span id="toggle-text">Don't have an account?</span>
              <button type="button" id="toggle-mode" class="btn-link">Sign Up</button>
            </div>
          </div>

          <div class="login-info">
            <p>Team members can sign in to view and manage their assigned tasks.</p>
          </div>
        </div>
      </div>
    `;

    this.attachLoginListeners();
  },

  attachLoginListeners() {
    let isSignUp = false;
    const form = document.getElementById('login-form');
    const modeTitle = document.getElementById('login-mode-title');
    const submitBtn = document.getElementById('login-submit');
    const toggleText = document.getElementById('toggle-text');
    const toggleMode = document.getElementById('toggle-mode');
    const messageEl = document.getElementById('login-message');

    // Toggle between sign in and sign up
    toggleMode?.addEventListener('click', () => {
      isSignUp = !isSignUp;
      modeTitle.textContent = isSignUp ? 'Create Account' : 'Sign In';
      submitBtn.textContent = isSignUp ? 'Create Account' : 'Sign In';
      toggleText.textContent = isSignUp ? 'Already have an account?' : "Don't have an account?";
      toggleMode.textContent = isSignUp ? 'Sign In' : 'Sign Up';
      messageEl.textContent = '';
      messageEl.className = 'login-message';

      // Update password field autocomplete
      const passwordInput = document.getElementById('login-password');
      passwordInput.autocomplete = isSignUp ? 'new-password' : 'current-password';
    });

    form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('login-email').value;
      const password = document.getElementById('login-password').value;

      submitBtn.disabled = true;
      submitBtn.textContent = isSignUp ? 'Creating account...' : 'Signing in...';

      try {
        if (isSignUp) {
          await window.SupabaseClient.signUp(email, password);
          messageEl.className = 'login-message success';
          messageEl.textContent = 'Account created successfully! You can now sign in.';
          // Switch to sign in mode
          isSignUp = false;
          modeTitle.textContent = 'Sign In';
          toggleText.textContent = "Don't have an account?";
          toggleMode.textContent = 'Sign Up';
        } else {
          await window.SupabaseClient.signIn(email, password);
          // Reload will trigger render which will show dashboard
          window.location.reload();
        }
      } catch (error) {
        messageEl.className = 'login-message error';
        messageEl.textContent = error.message || 'Authentication failed. Please try again.';
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = isSignUp ? 'Create Account' : 'Sign In';
      }
    });
  },

  ensureDashboardStructure() {
    // Check if dashboard structure exists, create it if not
    if (!document.getElementById('phase-nav')) {
      document.body.innerHTML = `
        <div class="app">
          <!-- Top Bar -->
          <header class="topbar">
            <div class="topbar-left">
              <img src="assets/logo.webp" alt="ATA" class="logo">
              <div class="project-info">
                <h1 class="project-name">BTB AI - ATA Automation</h1>
                <span class="project-client">Project Dashboard</span>
              </div>
            </div>
            <div class="topbar-right">
              <div class="meta-pill">
                <span class="meta-label">Updated</span>
                <span class="meta-value" id="last-updated">--</span>
              </div>
              <div class="user-menu" id="user-menu"></div>
            </div>
          </header>

          <!-- Main Content -->
          <main class="main">
            <!-- Hero Stats Row -->
            <section class="hero-stats">
              <div class="stat-card stat-progress">
                <div class="stat-ring" id="progress-ring">
                  <svg viewBox="0 0 120 120">
                    <circle class="ring-bg" cx="60" cy="60" r="52" />
                    <circle class="ring-fill" cx="60" cy="60" r="52" id="ring-fill" />
                  </svg>
                  <div class="ring-content">
                    <span class="ring-number" id="progress-percent">0</span>
                    <span class="ring-label">complete</span>
                  </div>
                </div>
                <div class="stat-details">
                  <span class="stat-title">Project Progress</span>
                  <span class="stat-subtitle" id="tasks-summary">0 of 0 tasks</span>
                </div>
              </div>

              <div class="stat-card stat-timeline">
                <div class="timeline-visual">
                  <div class="timeline-bar">
                    <div class="timeline-elapsed" id="timeline-elapsed"></div>
                    <div class="timeline-marker" id="timeline-marker"></div>
                  </div>
                  <div class="timeline-dates">
                    <span id="start-date">--</span>
                    <span id="end-date">--</span>
                  </div>
                </div>
                <div class="stat-details">
                  <span class="stat-title" id="days-remaining">-- days left</span>
                  <span class="stat-subtitle" id="timeline-status">On track</span>
                </div>
              </div>

              <div class="stat-card stat-alerts" id="alerts-card">
                <div class="alert-indicators" id="alert-indicators"></div>
                <div class="stat-details">
                  <span class="stat-title" id="alerts-title">All Clear</span>
                  <span class="stat-subtitle" id="alerts-subtitle">No blockers</span>
                </div>
              </div>
            </section>

            <!-- Phase Navigation -->
            <nav class="phase-nav" id="phase-nav"></nav>

            <!-- Active Phase Detail -->
            <section class="phase-detail" id="phase-detail"></section>

            <!-- Bottom Panels -->
            <section class="bottom-panels">
              <div class="panel panel-actions">
                <div class="panel-header">
                  <h3>Action Items</h3>
                  <span class="panel-count" id="action-count">0</span>
                </div>
                <div class="panel-body" id="action-items"></div>
              </div>

              <div class="panel panel-blockers">
                <div class="panel-header">
                  <h3>Blockers & Decisions</h3>
                  <span class="panel-count" id="blocker-count">0</span>
                </div>
                <div class="panel-body" id="blockers-list"></div>
              </div>

              <div class="panel panel-team">
                <div class="panel-header">
                  <h3>Team</h3>
                </div>
                <div class="panel-body" id="team-list"></div>
              </div>
            </section>
          </main>
        </div>
      `;
    }
  },

  renderTopBar(data) {
    const lastUpdated = DataManager.formatDate(new Date().toISOString());
    document.getElementById('last-updated').textContent = lastUpdated;
  },

  renderUserMenu() {
    const container = document.getElementById('user-menu');
    const isAuth = window.SupabaseClient?.isAuthenticated();
    const teamMember = window.SupabaseClient?.getTeamMember();
    const isAdmin = window.SupabaseClient?.isAdmin();

    if (isAuth && teamMember) {
      container.innerHTML = `
        <div class="user-info">
          <div class="user-avatar" style="background: ${teamMember.color}">${teamMember.initials}</div>
          <div class="user-details">
            <span class="user-name">${teamMember.name}</span>
            <span class="user-role">${teamMember.role}</span>
          </div>
          <button class="btn-icon" id="sign-out-btn" title="Sign out">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </button>
        </div>
        <div class="view-toggle">
          <button class="view-btn ${this.viewMode === 'all' ? 'active' : ''}" data-view="all">All Tasks</button>
          <button class="view-btn ${this.viewMode === 'my' ? 'active' : ''}" data-view="my">My Tasks</button>
        </div>
      `;

      // Sign out handler
      document.getElementById('sign-out-btn')?.addEventListener('click', async () => {
        await window.SupabaseClient.signOut();
        window.location.reload();
      });

      // View toggle handlers
      container.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          this.viewMode = btn.dataset.view;
          container.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          this.render();
        });
      });
    } else if (isAuth) {
      // Authenticated but no team member record
      container.innerHTML = `
        <div class="user-info">
          <span class="user-email">${window.SupabaseClient.currentUser?.email}</span>
          <button class="btn-small" id="sign-out-btn">Sign out</button>
        </div>
      `;
      document.getElementById('sign-out-btn')?.addEventListener('click', async () => {
        await window.SupabaseClient.signOut();
        window.location.reload();
      });
    } else {
      // Not authenticated
      container.innerHTML = `
        <button class="btn-primary" id="sign-in-btn">Sign In</button>
      `;
      document.getElementById('sign-in-btn')?.addEventListener('click', () => this.showLoginModal());
    }
  },

  showLoginModal() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal">
        <div class="modal-header">
          <h2>Sign In</h2>
          <button class="modal-close">&times;</button>
        </div>
        <div class="modal-body">
          <form id="login-form">
            <div class="form-group">
              <label for="login-email">Email</label>
              <input type="email" id="login-email" placeholder="you@example.com" required>
            </div>
            <div class="form-group">
              <label for="login-password">Password</label>
              <input type="password" id="login-password" placeholder="Your password" required minlength="6">
            </div>
            <button type="submit" class="btn-primary btn-full">Sign In</button>
          </form>
          <div id="login-message" class="login-message"></div>
          <div class="login-toggle">
            <span id="toggle-text">Don't have an account?</span>
            <button type="button" id="toggle-mode" class="btn-link">Sign Up</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    let isSignUp = false;

    modal.querySelector('.modal-close').addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });

    // Toggle between sign in and sign up
    modal.querySelector('#toggle-mode').addEventListener('click', () => {
      isSignUp = !isSignUp;
      modal.querySelector('.modal-header h2').textContent = isSignUp ? 'Sign Up' : 'Sign In';
      modal.querySelector('button[type="submit"]').textContent = isSignUp ? 'Create Account' : 'Sign In';
      modal.querySelector('#toggle-text').textContent = isSignUp ? 'Already have an account?' : "Don't have an account?";
      modal.querySelector('#toggle-mode').textContent = isSignUp ? 'Sign In' : 'Sign Up';
      modal.querySelector('#login-message').textContent = '';
      modal.querySelector('#login-message').className = 'login-message';
    });

    modal.querySelector('#login-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = modal.querySelector('#login-email').value;
      const password = modal.querySelector('#login-password').value;
      const messageEl = modal.querySelector('#login-message');
      const submitBtn = modal.querySelector('button[type="submit"]');

      submitBtn.disabled = true;
      submitBtn.textContent = isSignUp ? 'Creating...' : 'Signing in...';

      try {
        if (isSignUp) {
          await window.SupabaseClient.signUp(email, password);
          messageEl.className = 'login-message success';
          messageEl.textContent = 'Account created! You can now sign in.';
          isSignUp = false;
          modal.querySelector('.modal-header h2').textContent = 'Sign In';
          modal.querySelector('#toggle-text').textContent = "Don't have an account?";
          modal.querySelector('#toggle-mode').textContent = 'Sign Up';
        } else {
          await window.SupabaseClient.signIn(email, password);
          modal.remove();
          window.location.reload();
        }
      } catch (error) {
        messageEl.className = 'login-message error';
        messageEl.textContent = error.message || 'Authentication failed';
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = isSignUp ? 'Create Account' : 'Sign In';
      }
    });
  },

  renderHeroStats(data) {
    const progress = DataManager.calculateOverallProgress();
    const completed = DataManager.getCompletedTasks();
    const total = DataManager.getTotalTasks();
    const daysRemaining = DataManager.getDaysRemaining();
    const blockedCount = DataManager.getBlockedTasks().length;
    const overdueCount = DataManager.getOverdueItems().length;

    document.getElementById('progress-percent').textContent = progress;
    document.getElementById('tasks-summary').textContent = `${completed} of ${total} tasks`;

    const startDate = new Date(data.project.startDate);
    const endDate = new Date(data.project.endDate);
    const today = new Date();
    const totalDays = (endDate - startDate) / (1000 * 60 * 60 * 24);
    const elapsedDays = Math.max(0, (today - startDate) / (1000 * 60 * 60 * 24));
    const elapsedPercent = Math.min(100, Math.max(0, (elapsedDays / totalDays) * 100));

    document.getElementById('start-date').textContent = DataManager.formatDate(data.project.startDate);
    document.getElementById('end-date').textContent = DataManager.formatDate(data.project.endDate);
    document.getElementById('timeline-elapsed').style.width = `${elapsedPercent}%`;
    document.getElementById('timeline-marker').style.left = `${elapsedPercent}%`;
    document.getElementById('days-remaining').textContent = `${daysRemaining} days left`;

    const progressRate = progress / elapsedPercent;
    let statusText = 'On track';
    if (progressRate < 0.7) statusText = 'Behind schedule';
    else if (progressRate > 1.2) statusText = 'Ahead of schedule';
    document.getElementById('timeline-status').textContent = statusText;

    const alertsCard = document.getElementById('alerts-card');
    const alertIndicators = document.getElementById('alert-indicators');
    const alertsTitle = document.getElementById('alerts-title');
    const alertsSubtitle = document.getElementById('alerts-subtitle');

    if (blockedCount > 0 || overdueCount > 0) {
      alertsCard.classList.add('has-alerts');
      let dots = '';
      if (blockedCount > 0) dots += `<div class="alert-dot danger"></div>`;
      if (overdueCount > 0) dots += `<div class="alert-dot warning"></div>`;
      alertIndicators.innerHTML = dots;
      const issues = [];
      if (blockedCount > 0) issues.push(`${blockedCount} blocked`);
      if (overdueCount > 0) issues.push(`${overdueCount} overdue`);
      alertsTitle.textContent = 'Needs Attention';
      alertsSubtitle.textContent = issues.join(', ');
    } else {
      alertsCard.classList.remove('has-alerts');
      alertIndicators.innerHTML = '<div class="alert-dot" style="background: var(--success);"></div>';
      alertsTitle.textContent = 'All Clear';
      alertsSubtitle.textContent = 'No blockers';
    }
  },

  animateProgress(data) {
    const progress = DataManager.calculateOverallProgress();
    const circumference = 2 * Math.PI * 52;
    const offset = circumference - (progress / 100) * circumference;
    const ringFill = document.getElementById('ring-fill');
    if (ringFill) ringFill.style.strokeDashoffset = offset;
  },

  renderPhaseNav(data) {
    const nav = document.getElementById('phase-nav');
    nav.innerHTML = data.phases.map(phase => {
      const progress = DataManager.calculatePhaseProgress(phase);
      const isActive = phase.id === this.activePhase.id;
      let statusText = phase.status.replace('_', ' ');
      if (phase.status === 'complete') statusText = '100%';
      else if (progress > 0) statusText = `${progress}%`;

      return `
        <button class="phase-tab ${isActive ? 'active' : ''}" data-phase="${phase.number}" data-phase-id="${phase.id}">
          <div class="phase-tab-number">${phase.number}</div>
          <div class="phase-tab-info">
            <span class="phase-tab-name">${phase.name}</span>
            <span class="phase-tab-status">${statusText}</span>
          </div>
          <div class="phase-tab-progress">
            <div class="phase-tab-progress-fill" style="width: ${progress}%"></div>
          </div>
        </button>
      `;
    }).join('');
  },

  renderPhaseDetail(phase, data) {
    const container = document.getElementById('phase-detail');
    const progress = DataManager.calculatePhaseProgress(phase);
    const daysUntil = DataManager.getDaysUntil(phase.deadline);
    const isAdmin = window.SupabaseClient?.isAdmin();
    const currentMember = window.SupabaseClient?.getTeamMember();

    let daysClass = 'on-track';
    let daysText = `${daysUntil} days`;
    if (daysUntil < 0) {
      daysClass = 'overdue';
      daysText = `${Math.abs(daysUntil)}d overdue`;
    } else if (daysUntil <= 7) {
      daysClass = 'soon';
      daysText = daysUntil === 0 ? 'Due today' : `${daysUntil}d left`;
    }

    // Filter tasks if in "my" view mode
    let tasks = phase.tasks;
    if (this.viewMode === 'my' && currentMember) {
      tasks = tasks.filter(t => t.assignee === currentMember.id);
    }

    const blocked = tasks.filter(t => t.status === 'blocked');
    const inProgress = tasks.filter(t => t.status === 'in_progress');
    const notStarted = tasks.filter(t => t.status === 'not_started');
    const complete = tasks.filter(t => t.status === 'complete');

    container.setAttribute('data-phase', phase.number);
    container.innerHTML = `
      <div class="phase-header">
        <div class="phase-header-left">
          <div class="phase-title">
            <div class="phase-number">${phase.number}</div>
            <h2 class="phase-name">${phase.name}</h2>
          </div>
          <p class="phase-description">${phase.description}</p>
        </div>
        <div class="phase-header-right">
          <div class="phase-deadline">
            <span class="phase-deadline-date">${DataManager.formatDate(phase.deadline)}</span>
            <span class="phase-deadline-days ${daysClass}">${daysText}</span>
          </div>
          <div class="phase-progress-bar">
            <div class="phase-progress-fill" style="width: ${progress}%"></div>
          </div>
          ${isAdmin ? `<button class="btn-add-task" data-phase-id="${phase.id}">+ Add Task</button>` : ''}
        </div>
      </div>
      <div class="task-list">
        ${this.viewMode === 'my' && tasks.length === 0 ? '<div class="empty-state"><div class="empty-text">No tasks assigned to you in this phase</div></div>' : ''}
        ${blocked.length > 0 ? this.renderTaskGroup('Blocked', blocked, data) : ''}
        ${inProgress.length > 0 ? this.renderTaskGroup('In Progress', inProgress, data) : ''}
        ${notStarted.length > 0 ? this.renderTaskGroup('Not Started', notStarted, data) : ''}
        ${complete.length > 0 ? this.renderTaskGroup('Complete', complete, data) : ''}
      </div>
    `;

    // Add task button handler
    container.querySelector('.btn-add-task')?.addEventListener('click', () => {
      this.showAddTaskModal(phase.id, data);
    });
  },

  renderTaskGroup(title, tasks, data) {
    return `
      <div class="task-group">
        <div class="task-group-header">
          ${title}
          <span class="task-group-count">${tasks.length}</span>
        </div>
        ${tasks.map(task => this.renderTask(task, data)).join('')}
      </div>
    `;
  },

  renderTask(task, data) {
    const assignee = DataManager.getStakeholder(task.assignee);
    const isAuth = window.SupabaseClient?.isAuthenticated();
    const isAdmin = window.SupabaseClient?.isAdmin();
    const currentMember = window.SupabaseClient?.getTeamMember();
    const canToggle = isAdmin || (currentMember && task.assignee === currentMember.id);

    let checkIcon = '';
    if (task.status === 'complete') checkIcon = '&#10003;';
    else if (task.status === 'blocked') checkIcon = '!';
    else if (task.status === 'in_progress') checkIcon = '&#8226;';

    return `
      <div class="task-item ${task.status} ${canToggle ? 'clickable' : ''}" data-task-id="${task.id}">
        <div class="task-checkbox ${canToggle ? 'interactive' : ''}" data-task-id="${task.id}">${checkIcon}</div>
        <div class="task-content">
          <div class="task-title">${task.title}</div>
          <div class="task-meta">
            ${assignee ? `
              <span class="task-assignee">
                <span class="task-avatar" style="background: ${assignee.color}">${assignee.initials}</span>
                ${assignee.name.split(' ')[0]}
              </span>
            ` : ''}
            ${task.blockedBy ? `<span class="task-blocker">${task.blockedBy}</span>` : ''}
          </div>
          ${task.notes ? `<div class="task-notes">${task.notes}</div>` : ''}
        </div>
        ${canToggle && task.status !== 'complete' ? `
          <div class="task-actions">
            <select class="task-status-select" data-task-id="${task.id}">
              <option value="not_started" ${task.status === 'not_started' ? 'selected' : ''}>Not Started</option>
              <option value="in_progress" ${task.status === 'in_progress' ? 'selected' : ''}>In Progress</option>
              <option value="blocked" ${task.status === 'blocked' ? 'selected' : ''}>Blocked</option>
              <option value="complete" ${task.status === 'complete' ? 'selected' : ''}>Complete</option>
            </select>
          </div>
        ` : ''}
      </div>
    `;
  },

  showAddTaskModal(phaseId, data) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal">
        <div class="modal-header">
          <h2>Add New Task</h2>
          <button class="modal-close">&times;</button>
        </div>
        <div class="modal-body">
          <form id="add-task-form">
            <div class="form-group">
              <label for="task-title">Title *</label>
              <input type="text" id="task-title" required placeholder="Task title">
            </div>
            <div class="form-group">
              <label for="task-description">Description</label>
              <textarea id="task-description" rows="2" placeholder="Optional description"></textarea>
            </div>
            <div class="form-group">
              <label for="task-assignee">Assignee</label>
              <select id="task-assignee">
                <option value="">Unassigned</option>
                ${data.stakeholders.map(s => `<option value="${s.id}">${s.name}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label for="task-notes">Notes</label>
              <textarea id="task-notes" rows="2" placeholder="Optional notes"></textarea>
            </div>
            <button type="submit" class="btn-primary btn-full">Add Task</button>
          </form>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    modal.querySelector('.modal-close').addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });

    modal.querySelector('#add-task-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const taskData = {
        title: modal.querySelector('#task-title').value,
        description: modal.querySelector('#task-description').value || null,
        assignee: modal.querySelector('#task-assignee').value || null,
        notes: modal.querySelector('#task-notes').value || null
      };

      try {
        await DataManager.createTask(phaseId, taskData);
        modal.remove();
        this.render();
      } catch (error) {
        alert('Failed to create task: ' + error.message);
      }
    });
  },

  renderActionItems(data) {
    const container = document.getElementById('action-items');
    const countEl = document.getElementById('action-count');
    const currentMember = window.SupabaseClient?.getTeamMember();
    const isAdmin = window.SupabaseClient?.isAdmin();

    let items = data.actionItems.filter(i => i.status !== 'complete');

    if (this.viewMode === 'my' && currentMember) {
      items = items.filter(i => i.assignee === currentMember.id);
    }

    countEl.textContent = items.length;

    if (items.length === 0) {
      container.innerHTML = '<div class="empty-state"><div class="empty-icon">&#10003;</div><div class="empty-text">All caught up!</div></div>';
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sorted = [...items].sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

    container.innerHTML = sorted.map(item => {
      const assignee = DataManager.getStakeholder(item.assignee);
      const dueDate = new Date(item.dueDate);
      dueDate.setHours(0, 0, 0, 0);
      const isOverdue = dueDate < today;
      const daysUntil = DataManager.getDaysUntil(item.dueDate);
      const canToggle = isAdmin || (currentMember && item.assignee === currentMember.id);

      let dueText = DataManager.formatDate(item.dueDate);
      if (isOverdue) dueText = `${Math.abs(daysUntil)}d overdue`;
      else if (daysUntil === 0) dueText = 'Due today';
      else if (daysUntil <= 3) dueText = `${daysUntil}d left`;

      return `
        <div class="action-item ${isOverdue ? 'overdue' : ''} ${item.status} ${canToggle ? 'clickable' : ''}" data-action-id="${item.id}">
          <div class="action-checkbox ${canToggle ? 'interactive' : ''}" data-action-id="${item.id}"></div>
          <div class="action-content">
            <div class="action-title">${item.title}</div>
            <div class="action-meta">
              <span class="action-due">${dueText}</span>
              ${assignee ? `
                <span class="action-assignee">
                  <span class="task-avatar" style="background: ${assignee.color}; width: 16px; height: 16px; font-size: 8px;">${assignee.initials}</span>
                  ${assignee.name.split(' ')[0]}
                </span>
              ` : ''}
            </div>
          </div>
        </div>
      `;
    }).join('');
  },

  renderBlockers(data) {
    const container = document.getElementById('blockers-list');
    const countEl = document.getElementById('blocker-count');
    const blockers = DataManager.getActiveBlockers();
    const decisions = DataManager.getPendingDecisions();
    const total = blockers.length + decisions.length;

    countEl.textContent = total;

    if (total === 0) {
      container.innerHTML = '<div class="empty-state"><div class="empty-icon">&#10003;</div><div class="empty-text">No blockers or decisions</div></div>';
      return;
    }

    let html = blockers.map(b => `
      <div class="blocker-item ${b.status}">
        <div class="blocker-header">
          <div class="blocker-icon">!</div>
          <div class="blocker-title">${b.title}</div>
          <span class="blocker-badge ${b.status}">${b.status}</span>
        </div>
        <div class="blocker-description">${b.description}</div>
        <div class="blocker-impact"><strong>Impact:</strong> ${b.impact}</div>
        ${b.mitigation ? `<div class="blocker-mitigation">&#10003; ${b.mitigation}</div>` : ''}
      </div>
    `).join('');

    html += decisions.map(d => {
      const owner = DataManager.getStakeholder(d.owner);
      return `
        <div class="blocker-item decision">
          <div class="blocker-header">
            <div class="blocker-icon">?</div>
            <div class="blocker-title">${d.title}</div>
            <span class="blocker-badge decision">Decision</span>
          </div>
          <div class="blocker-description">${d.description}</div>
          ${owner ? `
            <div class="action-assignee" style="margin-top: 8px;">
              <span class="task-avatar" style="background: ${owner.color}; width: 16px; height: 16px; font-size: 8px;">${owner.initials}</span>
              Awaiting ${owner.name.split(' ')[0]}
            </div>
          ` : ''}
        </div>
      `;
    }).join('');

    container.innerHTML = html;
  },

  renderTeam(data) {
    const container = document.getElementById('team-list');
    container.innerHTML = data.stakeholders.map(s => {
      const actionCount = DataManager.getStakeholderActionCount(s.id);
      return `
        <div class="team-member">
          <div class="team-avatar" style="background: ${s.color}">${s.initials}</div>
          <div class="team-info">
            <div class="team-name">${s.name}</div>
            <div class="team-role">${s.role}</div>
          </div>
          ${actionCount > 0 ? `<span class="team-count active">${actionCount}</span>` : ''}
        </div>
      `;
    }).join('');
  },

  attachEventListeners(data) {
    // Phase tab switching
    document.querySelectorAll('.phase-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        const phaseId = tab.dataset.phaseId;
        const phase = data.phases.find(p => p.id === phaseId);
        if (phase) {
          this.activePhase = phase;
          document.querySelectorAll('.phase-tab').forEach(t => t.classList.remove('active'));
          tab.classList.add('active');
          this.renderPhaseDetail(phase, data);
        }
      });
    });

    // Task checkbox clicks
    document.querySelectorAll('.task-checkbox.interactive').forEach(checkbox => {
      checkbox.addEventListener('click', async (e) => {
        e.stopPropagation();
        const taskId = checkbox.dataset.taskId;
        const taskItem = checkbox.closest('.task-item');
        const currentStatus = taskItem.classList.contains('complete') ? 'complete' : 'not_started';
        const newStatus = currentStatus === 'complete' ? 'not_started' : 'complete';
        const memberId = window.SupabaseClient?.getTeamMember()?.id;

        try {
          await DataManager.updateTaskStatus(taskId, newStatus, memberId);
          this.render();
        } catch (error) {
          alert('Failed to update task: ' + error.message);
        }
      });
    });

    // Task status select
    document.querySelectorAll('.task-status-select').forEach(select => {
      select.addEventListener('change', async (e) => {
        const taskId = select.dataset.taskId;
        const newStatus = select.value;
        const memberId = window.SupabaseClient?.getTeamMember()?.id;

        try {
          await DataManager.updateTaskStatus(taskId, newStatus, memberId);
          this.render();
        } catch (error) {
          alert('Failed to update task: ' + error.message);
        }
      });
    });

    // Action item checkbox clicks
    document.querySelectorAll('.action-checkbox.interactive').forEach(checkbox => {
      checkbox.addEventListener('click', async (e) => {
        e.stopPropagation();
        const itemId = checkbox.dataset.actionId;
        const memberId = window.SupabaseClient?.getTeamMember()?.id;

        try {
          await DataManager.updateActionItemStatus(itemId, 'complete', memberId);
          this.render();
        } catch (error) {
          alert('Failed to update action item: ' + error.message);
        }
      });
    });
  }
};

window.UI = UI;
