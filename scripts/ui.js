/**
 * ATA Project Dashboard - UI Rendering Module
 */

const UI = {
  /**
   * Render the entire dashboard
   */
  async render() {
    const data = await DataManager.loadData();
    if (!data) {
      document.body.innerHTML = '<div class="error">Failed to load project data</div>';
      return;
    }

    this.renderHeader(data);
    this.renderSidebar(data);
    this.renderMainContent(data);
    this.attachEventListeners();
  },

  /**
   * Render header section
   */
  renderHeader(data) {
    const progress = DataManager.calculateOverallProgress();
    const daysRemaining = DataManager.getDaysRemaining();
    const completedTasks = DataManager.getCompletedTasks();
    const totalTasks = DataManager.getTotalTasks();

    const circumference = 2 * Math.PI * 18;
    const offset = circumference - (progress / 100) * circumference;

    document.getElementById('header-content').innerHTML = `
      <div class="header-left">
        <img src="assets/logo.webp" alt="ATA Logo" class="logo" />
        <div class="header-divider"></div>
        <div class="project-title">
          <h1>${data.project.name}</h1>
          <span class="last-updated">Updated: ${DataManager.formatDate(data.project.lastUpdated, 'long')}</span>
        </div>
      </div>
      <div class="header-right">
        <div class="overall-progress">
          <div class="progress-ring">
            <svg width="44" height="44" viewBox="0 0 44 44">
              <circle class="progress-ring-bg" cx="22" cy="22" r="18" />
              <circle class="progress-ring-fill" cx="22" cy="22" r="18"
                stroke-dasharray="${circumference}"
                stroke-dashoffset="${offset}" />
            </svg>
            <span class="progress-percent">${progress}%</span>
          </div>
          <div class="progress-info">
            <span class="progress-label">${completedTasks}/${totalTasks} Tasks</span>
            <span class="progress-sublabel">Project Progress</span>
          </div>
        </div>
        <div class="days-remaining ${daysRemaining < 14 ? 'urgent' : ''}">
          <span class="days-remaining-number">${daysRemaining}</span>
          <span>days left</span>
        </div>
      </div>
    `;
  },

  /**
   * Render sidebar section
   */
  renderSidebar(data) {
    const sidebar = document.getElementById('sidebar-content');

    // Project Meta
    const projectMeta = `
      <div class="sidebar-section">
        <h3 class="sidebar-section-title">Project Info</h3>
        <div class="project-meta">
          <div class="meta-item">
            <span class="meta-label">Client</span>
            <span class="meta-value">${data.project.client}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Start</span>
            <span class="meta-value">${DataManager.formatDate(data.project.startDate)}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">End</span>
            <span class="meta-value">${DataManager.formatDate(data.project.endDate)}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Investment</span>
            <span class="meta-value currency">$${data.project.totalInvestment.toLocaleString()}</span>
          </div>
        </div>
      </div>
    `;

    // Stakeholders
    const stakeholdersList = data.stakeholders
      .map((s) => {
        const actionCount = DataManager.getStakeholderActionCount(s.id);
        return `
        <div class="stakeholder-item" data-stakeholder="${s.id}">
          <div class="stakeholder-avatar" style="background: ${s.color}">${s.initials}</div>
          <div class="stakeholder-info">
            <div class="stakeholder-name">${s.name}</div>
            <div class="stakeholder-role">${s.role}</div>
          </div>
          ${actionCount > 0 ? `<span class="stakeholder-count">${actionCount}</span>` : ''}
        </div>
      `;
      })
      .join('');

    const stakeholders = `
      <div class="sidebar-section">
        <h3 class="sidebar-section-title">Team</h3>
        <div class="stakeholder-list">${stakeholdersList}</div>
      </div>
    `;

    // Key Dates
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const keyDatesList = data.phases
      .map((phase) => {
        const deadline = new Date(phase.deadline);
        deadline.setHours(0, 0, 0, 0);
        const daysUntil = DataManager.getDaysUntil(phase.deadline);

        let statusClass = 'upcoming';
        let statusText = `${daysUntil}d`;

        if (deadline < today) {
          statusClass = 'past';
          statusText = 'Past';
        } else if (phase.status === 'in_progress') {
          statusClass = 'current';
          if (daysUntil <= 0) {
            statusText = 'Due today';
          } else if (daysUntil <= 7) {
            statusText = `${daysUntil}d left`;
          }
        }

        const statusLabelClass = daysUntil < 0 ? 'overdue' : daysUntil <= 7 ? 'soon' : '';

        return `
        <div class="date-item ${statusClass}">
          <span class="date-phase">P${phase.number}</span>
          <span class="date-value">${DataManager.formatDate(phase.deadline)}</span>
          <span class="date-status ${statusLabelClass}">${statusText}</span>
        </div>
      `;
      })
      .join('');

    const keyDates = `
      <div class="sidebar-section">
        <h3 class="sidebar-section-title">Key Dates</h3>
        <div class="key-dates">${keyDatesList}</div>
      </div>
    `;

    sidebar.innerHTML = projectMeta + stakeholders + keyDates;
  },

  /**
   * Render main content area
   */
  renderMainContent(data) {
    const main = document.getElementById('main-content');

    // Alerts Bar
    const blockedCount = DataManager.getBlockedTasks().length;
    const overdueCount = DataManager.getOverdueItems().length;

    const alertsBar =
      blockedCount > 0 || overdueCount > 0
        ? `
      <div class="alerts-bar">
        ${
          blockedCount > 0
            ? `
          <div class="alert-card blocked">
            <div class="alert-icon">⚠</div>
            <div class="alert-content">
              <div class="alert-count">${blockedCount}</div>
              <div class="alert-label">Blocked ${blockedCount === 1 ? 'Task' : 'Tasks'}</div>
            </div>
          </div>
        `
            : ''
        }
        ${
          overdueCount > 0
            ? `
          <div class="alert-card overdue">
            <div class="alert-icon">⏰</div>
            <div class="alert-content">
              <div class="alert-count">${overdueCount}</div>
              <div class="alert-label">Overdue ${overdueCount === 1 ? 'Item' : 'Items'}</div>
            </div>
          </div>
        `
            : ''
        }
      </div>
    `
        : '';

    // Phase Cards
    const phaseCards = data.phases.map((phase) => this.renderPhaseCard(phase, data)).join('');

    // Blockers & Decisions Panel
    const blockersDecisions = this.renderBlockersDecisions(data);

    // Action Items Panel
    const actionItems = this.renderActionItems(data);

    // Future Scope Panel
    const futureScope = this.renderFutureScope(data);

    main.innerHTML = `
      ${alertsBar}
      <div class="phases-grid">${phaseCards}</div>
      <div class="content-grid">
        <div class="left-column">
          ${blockersDecisions}
        </div>
        <div class="right-column">
          ${actionItems}
          ${futureScope}
        </div>
      </div>
    `;
  },

  /**
   * Render a phase card
   */
  renderPhaseCard(phase, data) {
    const progress = DataManager.calculatePhaseProgress(phase);
    const stats = DataManager.getPhaseStats(phase);
    const daysUntil = DataManager.getDaysUntil(phase.deadline);

    let daysClass = 'on-track';
    let daysText = `${daysUntil} days`;
    if (daysUntil < 0) {
      daysClass = 'overdue';
      daysText = `${Math.abs(daysUntil)}d overdue`;
    } else if (daysUntil <= 7) {
      daysClass = 'soon';
      daysText = daysUntil === 0 ? 'Due today' : `${daysUntil}d left`;
    }

    const tasksHtml = phase.tasks.map((task) => this.renderTaskItem(task, data)).join('');

    return `
      <div class="phase-card" data-phase="${phase.number}" data-phase-id="${phase.id}">
        <div class="phase-card-header">
          <div class="phase-number">${phase.number}</div>
          <div class="phase-info">
            <div class="phase-name">${phase.name}</div>
            <div class="phase-description">${phase.description}</div>
            <div class="phase-deadline">
              <span class="phase-deadline-icon">📅</span>
              <span>${DataManager.formatDate(phase.deadline)}</span>
              <span class="phase-days ${daysClass}">${daysText}</span>
            </div>
          </div>
          <div class="phase-status-badge ${phase.status}">${phase.status.replace('_', ' ')}</div>
        </div>
        <div class="phase-card-progress">
          <div class="progress-bar-container">
            <div class="progress-bar">
              <div class="progress-bar-fill" style="width: ${progress}%"></div>
            </div>
            <span class="progress-text">${progress}%</span>
          </div>
        </div>
        <div class="phase-card-stats">
          <div class="stat-item complete">
            <span class="stat-value">${stats.complete}</span>
            <span>done</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">${stats.inProgress}</span>
            <span>active</span>
          </div>
          ${
            stats.blocked > 0
              ? `
            <div class="stat-item blocked">
              <span class="stat-value">${stats.blocked}</span>
              <span>blocked</span>
            </div>
          `
              : ''
          }
          <div class="expand-toggle">
            <span class="expand-icon">▼</span>
            <span>Details</span>
          </div>
        </div>
        <div class="phase-card-tasks">
          <div class="task-list">${tasksHtml}</div>
        </div>
      </div>
    `;
  },

  /**
   * Render a task item
   */
  renderTaskItem(task, data) {
    const assignee = DataManager.getStakeholder(task.assignee);
    const checkIcon = task.status === 'complete' ? '✓' : task.status === 'blocked' ? '!' : '';

    return `
      <div class="task-item ${task.status}">
        <div class="task-header">
          <div class="task-checkbox">${checkIcon}</div>
          <div class="task-content">
            <div class="task-title">${task.title}</div>
            <div class="task-meta">
              ${
                assignee
                  ? `
                <span class="task-assignee">
                  <span class="task-assignee-avatar" style="background: ${assignee.color}">${assignee.initials}</span>
                  ${assignee.name.split(' ')[0]}
                </span>
              `
                  : ''
              }
              ${
                task.blockedBy
                  ? `
                <span class="task-blocker">⚠ ${task.blockedBy}</span>
              `
                  : ''
              }
            </div>
            ${task.notes ? `<div class="task-notes">${task.notes}</div>` : ''}
          </div>
        </div>
      </div>
    `;
  },

  /**
   * Render blockers and decisions panel
   */
  renderBlockersDecisions(data) {
    const blockers = DataManager.getActiveBlockers();
    const decisions = DataManager.getPendingDecisions();

    const blockersHtml =
      blockers.length > 0
        ? blockers
            .map(
              (b) => `
        <div class="blocker-card ${b.status}">
          <div class="blocker-header">
            <div class="blocker-icon">⚠</div>
            <div class="blocker-title">${b.title}</div>
            <span class="status-badge ${b.status}">${b.status}</span>
          </div>
          <div class="blocker-description">${b.description}</div>
          <div class="blocker-impact"><strong>Impact:</strong> ${b.impact}</div>
          ${b.mitigation ? `<div class="blocker-mitigation">✓ ${b.mitigation}</div>` : ''}
        </div>
      `
            )
            .join('')
        : '<div class="empty-state"><div class="empty-state-icon">✓</div><div class="empty-state-text">No active blockers</div></div>';

    const decisionsHtml =
      decisions.length > 0
        ? decisions
            .map((d) => {
              const owner = DataManager.getStakeholder(d.owner);
              return `
          <div class="decision-card">
            <div class="decision-header">
              <div class="decision-icon">?</div>
              <div class="decision-title">${d.title}</div>
            </div>
            <div class="decision-description">${d.description}</div>
            ${
              owner
                ? `
              <div class="decision-owner">
                <span class="task-assignee-avatar" style="background: ${owner.color}; width: 16px; height: 16px; font-size: 8px;">${owner.initials}</span>
                Awaiting ${owner.name.split(' ')[0]}
              </div>
            `
                : ''
            }
          </div>
        `;
            })
            .join('')
        : '';

    return `
      <div class="section-panel">
        <div class="panel-header">
          <h3 class="panel-title">Blockers & Risks</h3>
          <span class="panel-count">${blockers.length}</span>
        </div>
        <div class="panel-content">
          <div class="blocker-list">${blockersHtml}</div>
        </div>
      </div>
      ${
        decisions.length > 0
          ? `
        <div class="section-panel" style="margin-top: var(--space-4)">
          <div class="panel-header">
            <h3 class="panel-title">Pending Decisions</h3>
            <span class="panel-count">${decisions.length}</span>
          </div>
          <div class="panel-content">
            <div class="decision-list">${decisionsHtml}</div>
          </div>
        </div>
      `
          : ''
      }
    `;
  },

  /**
   * Render action items panel
   */
  renderActionItems(data) {
    const items = data.actionItems;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const itemsHtml = items
      .map((item) => {
        const assignee = DataManager.getStakeholder(item.assignee);
        const dueDate = new Date(item.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        const isOverdue = dueDate < today && item.status !== 'complete';
        const daysUntil = DataManager.getDaysUntil(item.dueDate);

        let dueText = DataManager.formatDate(item.dueDate);
        if (isOverdue) {
          dueText = `${Math.abs(daysUntil)}d overdue`;
        } else if (daysUntil === 0) {
          dueText = 'Due today';
        } else if (daysUntil <= 3) {
          dueText = `${daysUntil}d left`;
        }

        return `
        <div class="action-item ${isOverdue ? 'overdue' : ''} ${item.status}">
          <div class="action-checkbox"></div>
          <div class="action-content">
            <div class="action-title">${item.title}</div>
            <div class="action-meta">
              <span class="action-due">${dueText}</span>
              ${
                assignee
                  ? `
                <span class="action-assignee">
                  <span class="task-assignee-avatar" style="background: ${assignee.color}; width: 14px; height: 14px; font-size: 7px;">${assignee.initials}</span>
                  ${assignee.name.split(' ')[0]}
                </span>
              `
                  : ''
              }
              <span class="status-badge ${item.status}">${item.status.replace('_', ' ')}</span>
            </div>
          </div>
        </div>
      `;
      })
      .join('');

    return `
      <div class="section-panel">
        <div class="panel-header">
          <h3 class="panel-title">Action Items</h3>
          <span class="panel-count">${items.filter((i) => i.status !== 'complete').length}</span>
        </div>
        <div class="panel-content">
          <div class="action-list">${itemsHtml}</div>
        </div>
      </div>
    `;
  },

  /**
   * Render future scope panel
   */
  renderFutureScope(data) {
    if (!data.futureScope || data.futureScope.length === 0) return '';

    const itemsHtml = data.futureScope
      .map(
        (item) => `
      <div class="future-item">
        <div class="future-header">
          <span class="future-title">${item.title}</span>
          <span class="status-badge ${item.status}">${item.status}</span>
        </div>
        <div class="future-description">${item.description}</div>
        <div class="future-target">Target: ${item.targetDate}</div>
      </div>
    `
      )
      .join('');

    return `
      <div class="section-panel" style="margin-top: var(--space-4)">
        <div class="panel-header">
          <h3 class="panel-title">Future Scope</h3>
          <span class="panel-count">${data.futureScope.length}</span>
        </div>
        <div class="panel-content">
          <div class="future-list">${itemsHtml}</div>
        </div>
      </div>
    `;
  },

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    // Phase card expand/collapse
    document.querySelectorAll('.phase-card').forEach((card) => {
      card.addEventListener('click', (e) => {
        // Don't toggle if clicking on a link or button
        if (e.target.tagName === 'A' || e.target.tagName === 'BUTTON') return;
        card.classList.toggle('expanded');
      });
    });

    // Stakeholder filter
    document.querySelectorAll('.stakeholder-item').forEach((item) => {
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        const stakeholderId = item.dataset.stakeholder;

        // Toggle active state
        document.querySelectorAll('.stakeholder-item').forEach((i) => i.classList.remove('active'));
        item.classList.add('active');

        // In a full implementation, this would filter the view
        console.log('Filter by stakeholder:', stakeholderId);
      });
    });
  },
};

// Export for use
window.UI = UI;
