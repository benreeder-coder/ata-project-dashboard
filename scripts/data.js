/**
 * ATA Project Dashboard - Data Management Module
 */

const DataManager = {
  projectData: null,

  /**
   * Load project data from JSON file
   */
  async loadData() {
    try {
      const response = await fetch('data/project-data.json');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      this.projectData = await response.json();
      return this.projectData;
    } catch (error) {
      console.error('Error loading project data:', error);
      return null;
    }
  },

  /**
   * Calculate overall project progress
   */
  calculateOverallProgress() {
    if (!this.projectData) return 0;
    const phases = this.projectData.phases;
    const totalTasks = phases.reduce((sum, p) => sum + p.tasks.length, 0);
    const completedTasks = phases.reduce(
      (sum, p) => sum + p.tasks.filter((t) => t.status === 'complete').length,
      0
    );
    return totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  },

  /**
   * Calculate phase progress
   */
  calculatePhaseProgress(phase) {
    const totalTasks = phase.tasks.length;
    const completedTasks = phase.tasks.filter((t) => t.status === 'complete').length;
    return totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  },

  /**
   * Get phase statistics
   */
  getPhaseStats(phase) {
    const tasks = phase.tasks;
    return {
      total: tasks.length,
      complete: tasks.filter((t) => t.status === 'complete').length,
      inProgress: tasks.filter((t) => t.status === 'in_progress').length,
      blocked: tasks.filter((t) => t.status === 'blocked').length,
      notStarted: tasks.filter((t) => t.status === 'not_started').length,
    };
  },

  /**
   * Calculate days until a date
   */
  getDaysUntil(dateString) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDate = new Date(dateString);
    targetDate.setHours(0, 0, 0, 0);
    const diffTime = targetDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  },

  /**
   * Format date for display
   */
  formatDate(dateString, format = 'short') {
    const date = new Date(dateString);
    const options =
      format === 'short'
        ? { month: 'short', day: 'numeric' }
        : { month: 'short', day: 'numeric', year: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  },

  /**
   * Get days remaining in project
   */
  getDaysRemaining() {
    if (!this.projectData) return 0;
    return this.getDaysUntil(this.projectData.project.endDate);
  },

  /**
   * Get all blocked tasks across phases
   */
  getBlockedTasks() {
    if (!this.projectData) return [];
    const blockedTasks = [];
    this.projectData.phases.forEach((phase) => {
      phase.tasks.forEach((task) => {
        if (task.status === 'blocked') {
          blockedTasks.push({
            ...task,
            phaseName: phase.name,
            phaseNumber: phase.number,
          });
        }
      });
    });
    return blockedTasks;
  },

  /**
   * Get all overdue action items
   */
  getOverdueItems() {
    if (!this.projectData) return [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return this.projectData.actionItems.filter((item) => {
      if (item.status === 'complete') return false;
      const dueDate = new Date(item.dueDate);
      dueDate.setHours(0, 0, 0, 0);
      return dueDate < today;
    });
  },

  /**
   * Get action items by stakeholder
   */
  getActionItemsByStakeholder(stakeholderId) {
    if (!this.projectData) return [];
    return this.projectData.actionItems.filter((item) => item.assignee === stakeholderId);
  },

  /**
   * Get stakeholder action item count
   */
  getStakeholderActionCount(stakeholderId) {
    const items = this.getActionItemsByStakeholder(stakeholderId);
    return items.filter((item) => item.status !== 'complete').length;
  },

  /**
   * Get stakeholder by ID
   */
  getStakeholder(stakeholderId) {
    if (!this.projectData) return null;
    return this.projectData.stakeholders.find((s) => s.id === stakeholderId);
  },

  /**
   * Get all tasks assigned to a stakeholder
   */
  getTasksByAssignee(stakeholderId) {
    if (!this.projectData) return [];
    const tasks = [];
    this.projectData.phases.forEach((phase) => {
      phase.tasks.forEach((task) => {
        if (task.assignee === stakeholderId) {
          tasks.push({
            ...task,
            phaseName: phase.name,
            phaseNumber: phase.number,
          });
        }
      });
    });
    return tasks;
  },

  /**
   * Get next upcoming deadline
   */
  getNextDeadline() {
    if (!this.projectData) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcomingPhases = this.projectData.phases
      .filter((phase) => {
        const deadline = new Date(phase.deadline);
        deadline.setHours(0, 0, 0, 0);
        return deadline >= today && phase.status !== 'complete';
      })
      .sort((a, b) => new Date(a.deadline) - new Date(b.deadline));

    return upcomingPhases.length > 0 ? upcomingPhases[0] : null;
  },

  /**
   * Get current/active phase
   */
  getCurrentPhase() {
    if (!this.projectData) return null;
    const inProgressPhase = this.projectData.phases.find((p) => p.status === 'in_progress');
    if (inProgressPhase) return inProgressPhase;

    // If no phase is marked as in_progress, find the first incomplete phase
    return this.projectData.phases.find((p) => p.status !== 'complete') || null;
  },

  /**
   * Get total tasks count
   */
  getTotalTasks() {
    if (!this.projectData) return 0;
    return this.projectData.phases.reduce((sum, phase) => sum + phase.tasks.length, 0);
  },

  /**
   * Get completed tasks count
   */
  getCompletedTasks() {
    if (!this.projectData) return 0;
    return this.projectData.phases.reduce(
      (sum, phase) => sum + phase.tasks.filter((t) => t.status === 'complete').length,
      0
    );
  },

  /**
   * Get pending decisions
   */
  getPendingDecisions() {
    if (!this.projectData) return [];
    return this.projectData.pendingDecisions.filter((d) => d.status === 'pending');
  },

  /**
   * Get active blockers
   */
  getActiveBlockers() {
    if (!this.projectData) return [];
    return this.projectData.blockers.filter((b) => b.status !== 'resolved');
  },
};

// Export for use in other modules
window.DataManager = DataManager;
