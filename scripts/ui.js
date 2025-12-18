/**
 * ATA Project Dashboard - UI Module
 * Clean, focused interface rendering
 */

const UI = {
  activePhase: null,

  async render() {
    const data = await DataManager.loadData();
    if (!data) {
      document.body.innerHTML = '<div class="empty-state"><div class="empty-icon">!</div><div class="empty-text">Failed to load project data</div></div>';
      return;
    }

    // Find the current active phase (in_progress or first incomplete)
    this.activePhase = data.phases.find(p => p.status === 'in_progress')
      || data.phases.find(p => p.status !== 'complete')
      || data.phases[0];

    this.renderTopBar(data);
    this.renderHeroStats(data);
    this.renderPhaseNav(data);
    this.renderPhaseDetail(this.activePhase, data);
    this.renderActionItems(data);
    this.renderBlockers(data);
    this.renderTeam(data);
    this.attachEventListeners(data);

    // Animate progress ring after a brief delay
    setTimeout(() => this.animateProgress(data), 100);
  },

  renderTopBar(data) {
    const contractRef = data.project.contractRef.split('-').slice(0, 2).join('-');
    const lastUpdated = DataManager.formatDate(data.project.lastUpdated);

    document.getElementById('contract-ref').textContent = contractRef;
    document.getElementById('last-updated').textContent = lastUpdated;
  },

  renderHeroStats(data) {
    const progress = DataManager.calculateOverallProgress();
    const completed = DataManager.getCompletedTasks();
    const total = DataManager.getTotalTasks();
    const daysRemaining = DataManager.getDaysRemaining();
    const blockedCount = DataManager.getBlockedTasks().length;
    const overdueCount = DataManager.getOverdueItems().length;

    // Tasks summary
    document.getElementById('progress-percent').textContent = progress;
    document.getElementById('tasks-summary').textContent = `${completed} of ${total} tasks`;

    // Timeline
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

    // Timeline status
    const progressRate = progress / elapsedPercent;
    let statusText = 'On track';
    if (progressRate < 0.7) statusText = 'Behind schedule';
    else if (progressRate > 1.2) statusText = 'Ahead of schedule';
    document.getElementById('timeline-status').textContent = statusText;

    // Alerts
    const alertsCard = document.getElementById('alerts-card');
    const alertIndicators = document.getElementById('alert-indicators');
    const alertsTitle = document.getElementById('alerts-title');
    const alertsSubtitle = document.getElementById('alerts-subtitle');

    if (blockedCount > 0 || overdueCount > 0) {
      alertsCard.classList.add('has-alerts');

      let dots = '';
      if (blockedCount > 0) {
        dots += `<div class="alert-dot danger"></div>`;
      }
      if (overdueCount > 0) {
        dots += `<div class="alert-dot warning"></div>`;
      }
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
    if (ringFill) {
      ringFill.style.strokeDashoffset = offset;
    }
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

    let daysClass = 'on-track';
    let daysText = `${daysUntil} days`;
    if (daysUntil < 0) {
      daysClass = 'overdue';
      daysText = `${Math.abs(daysUntil)}d overdue`;
    } else if (daysUntil <= 7) {
      daysClass = 'soon';
      daysText = daysUntil === 0 ? 'Due today' : `${daysUntil}d left`;
    }

    // Group tasks by status
    const blocked = phase.tasks.filter(t => t.status === 'blocked');
    const inProgress = phase.tasks.filter(t => t.status === 'in_progress');
    const notStarted = phase.tasks.filter(t => t.status === 'not_started');
    const complete = phase.tasks.filter(t => t.status === 'complete');

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
        </div>
      </div>
      <div class="task-list">
        ${blocked.length > 0 ? this.renderTaskGroup('Blocked', blocked, data) : ''}
        ${inProgress.length > 0 ? this.renderTaskGroup('In Progress', inProgress, data) : ''}
        ${notStarted.length > 0 ? this.renderTaskGroup('Not Started', notStarted, data) : ''}
        ${complete.length > 0 ? this.renderTaskGroup('Complete', complete, data) : ''}
      </div>
    `;
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
    const checkIcon = task.status === 'complete' ? '&#10003;' : task.status === 'blocked' ? '!' : '';

    return `
      <div class="task-item ${task.status}">
        <div class="task-checkbox">${checkIcon}</div>
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
      </div>
    `;
  },

  renderActionItems(data) {
    const container = document.getElementById('action-items');
    const countEl = document.getElementById('action-count');
    const items = data.actionItems.filter(i => i.status !== 'complete');
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    countEl.textContent = items.length;

    if (items.length === 0) {
      container.innerHTML = '<div class="empty-state"><div class="empty-icon">&#10003;</div><div class="empty-text">All caught up!</div></div>';
      return;
    }

    // Sort by due date, overdue first
    const sorted = [...items].sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

    container.innerHTML = sorted.map(item => {
      const assignee = DataManager.getStakeholder(item.assignee);
      const dueDate = new Date(item.dueDate);
      dueDate.setHours(0, 0, 0, 0);
      const isOverdue = dueDate < today;
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

    let html = '';

    // Blockers first
    html += blockers.map(b => `
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

    // Decisions
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

          // Update active state
          document.querySelectorAll('.phase-tab').forEach(t => t.classList.remove('active'));
          tab.classList.add('active');

          // Re-render phase detail
          this.renderPhaseDetail(phase, data);
        }
      });
    });
  }
};

window.UI = UI;
