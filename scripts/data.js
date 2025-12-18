/**
 * ATA Project Dashboard - Data Management Module
 * Uses Supabase for persistence
 */

const DataManager = {
  projectData: null,
  useSupabase: false,

  /**
   * Initialize and load data
   */
  async loadData() {
    // Check if Supabase is configured
    if (window.SupabaseClient?.client) {
      this.useSupabase = true;
      return await this.loadFromSupabase();
    }

    // Fallback to JSON file
    return await this.loadFromJSON();
  },

  /**
   * Load data from Supabase
   */
  async loadFromSupabase() {
    try {
      const client = window.SupabaseClient.client;

      // Load all data in parallel
      const [
        { data: settings },
        { data: stakeholders },
        { data: phases },
        { data: tasks },
        { data: actionItems },
        { data: blockers },
        { data: decisions }
      ] = await Promise.all([
        client.from('project_settings').select('*').single(),
        client.from('team_members').select('*').order('name'),
        client.from('phases').select('*').order('number'),
        client.from('tasks').select('*'),
        client.from('action_items').select('*').order('due_date'),
        client.from('blockers').select('*'),
        client.from('decisions').select('*')
      ]);

      // Transform to match expected format
      const phasesWithTasks = phases.map(phase => ({
        ...phase,
        tasks: tasks
          .filter(t => t.phase_id === phase.id)
          .map(t => ({
            id: t.id,
            title: t.title,
            description: t.description,
            status: t.status,
            assignee: t.assignee,
            dependsOn: t.depends_on || [],
            blockedBy: t.blocked_by,
            notes: t.notes
          }))
      }));

      this.projectData = {
        project: {
          name: settings?.name || 'BTB AI - ATA Automation',
          startDate: settings?.start_date,
          endDate: settings?.end_date,
          lastUpdated: settings?.last_updated
        },
        stakeholders: stakeholders.map(s => ({
          id: s.id,
          name: s.name,
          email: s.email,
          role: s.role,
          initials: s.initials,
          color: s.color,
          responsibilities: s.responsibilities || []
        })),
        phases: phasesWithTasks,
        actionItems: actionItems.map(a => ({
          id: a.id,
          title: a.title,
          assignee: a.assignee,
          dueDate: a.due_date,
          status: a.status,
          notes: a.notes
        })),
        blockers: blockers.map(b => ({
          id: b.id,
          title: b.title,
          description: b.description,
          impact: b.impact,
          mitigation: b.mitigation,
          status: b.status,
          affectedTasks: b.affected_tasks || []
        })),
        pendingDecisions: decisions.map(d => ({
          id: d.id,
          title: d.title,
          description: d.description,
          owner: d.owner,
          status: d.status,
          options: d.options || [],
          decision: d.decision
        }))
      };

      return this.projectData;
    } catch (error) {
      console.error('Error loading from Supabase:', error);
      return await this.loadFromJSON();
    }
  },

  /**
   * Load data from JSON file (fallback)
   */
  async loadFromJSON() {
    try {
      const response = await fetch('data/project-data.json');
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      this.projectData = await response.json();
      return this.projectData;
    } catch (error) {
      console.error('Error loading project data:', error);
      return null;
    }
  },

  /**
   * Update task status
   */
  async updateTaskStatus(taskId, newStatus, completedBy = null) {
    if (this.useSupabase) {
      const updateData = {
        status: newStatus,
        updated_at: new Date().toISOString()
      };

      if (newStatus === 'complete') {
        updateData.completed_at = new Date().toISOString();
        updateData.completed_by = completedBy;
      } else {
        updateData.completed_at = null;
        updateData.completed_by = null;
      }

      const { error } = await window.SupabaseClient.client
        .from('tasks')
        .update(updateData)
        .eq('id', taskId);

      if (error) throw error;
    }

    // Update local cache
    if (this.projectData) {
      for (const phase of this.projectData.phases) {
        const task = phase.tasks.find(t => t.id === taskId);
        if (task) {
          task.status = newStatus;
          break;
        }
      }
    }

    return true;
  },

  /**
   * Create a new task
   */
  async createTask(phaseId, taskData) {
    const newTask = {
      phase_id: phaseId,
      title: taskData.title,
      description: taskData.description || null,
      status: taskData.status || 'not_started',
      assignee: taskData.assignee || null,
      blocked_by: taskData.blockedBy || null,
      notes: taskData.notes || null,
      depends_on: taskData.dependsOn || []
    };

    if (this.useSupabase) {
      const { data, error } = await window.SupabaseClient.client
        .from('tasks')
        .insert(newTask)
        .select()
        .single();

      if (error) throw error;

      // Add to local cache
      const phase = this.projectData.phases.find(p => p.id === phaseId);
      if (phase) {
        phase.tasks.push({
          id: data.id,
          title: data.title,
          description: data.description,
          status: data.status,
          assignee: data.assignee,
          blockedBy: data.blocked_by,
          notes: data.notes,
          dependsOn: data.depends_on || []
        });
      }

      return data;
    }

    return null;
  },

  /**
   * Update action item status
   */
  async updateActionItemStatus(itemId, newStatus, completedBy = null) {
    if (this.useSupabase) {
      const updateData = {
        status: newStatus,
        updated_at: new Date().toISOString()
      };

      if (newStatus === 'complete') {
        updateData.completed_at = new Date().toISOString();
        updateData.completed_by = completedBy;
      }

      const { error } = await window.SupabaseClient.client
        .from('action_items')
        .update(updateData)
        .eq('id', itemId);

      if (error) throw error;
    }

    // Update local cache
    if (this.projectData) {
      const item = this.projectData.actionItems.find(a => a.id === itemId);
      if (item) item.status = newStatus;
    }

    return true;
  },

  /**
   * Create a new action item
   */
  async createActionItem(itemData) {
    const newItem = {
      title: itemData.title,
      assignee: itemData.assignee || null,
      due_date: itemData.dueDate,
      status: 'pending',
      notes: itemData.notes || null
    };

    if (this.useSupabase) {
      const { data, error } = await window.SupabaseClient.client
        .from('action_items')
        .insert(newItem)
        .select()
        .single();

      if (error) throw error;

      // Add to local cache
      this.projectData.actionItems.push({
        id: data.id,
        title: data.title,
        assignee: data.assignee,
        dueDate: data.due_date,
        status: data.status,
        notes: data.notes
      });

      return data;
    }

    return null;
  },

  // ========== Helper Methods ==========

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

  calculatePhaseProgress(phase) {
    const totalTasks = phase.tasks.length;
    const completedTasks = phase.tasks.filter((t) => t.status === 'complete').length;
    return totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  },

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

  getDaysUntil(dateString) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDate = new Date(dateString);
    targetDate.setHours(0, 0, 0, 0);
    const diffTime = targetDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  },

  formatDate(dateString, format = 'short') {
    const date = new Date(dateString);
    const options = format === 'short'
      ? { month: 'short', day: 'numeric' }
      : { month: 'short', day: 'numeric', year: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  },

  getDaysRemaining() {
    if (!this.projectData) return 0;
    return this.getDaysUntil(this.projectData.project.endDate);
  },

  getBlockedTasks() {
    if (!this.projectData) return [];
    const blockedTasks = [];
    this.projectData.phases.forEach((phase) => {
      phase.tasks.forEach((task) => {
        if (task.status === 'blocked') {
          blockedTasks.push({ ...task, phaseName: phase.name, phaseNumber: phase.number });
        }
      });
    });
    return blockedTasks;
  },

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

  getStakeholder(stakeholderId) {
    if (!this.projectData) return null;
    return this.projectData.stakeholders.find((s) => s.id === stakeholderId);
  },

  getStakeholderActionCount(stakeholderId) {
    if (!this.projectData) return 0;
    return this.projectData.actionItems.filter(
      (item) => item.assignee === stakeholderId && item.status !== 'complete'
    ).length;
  },

  getTotalTasks() {
    if (!this.projectData) return 0;
    return this.projectData.phases.reduce((sum, phase) => sum + phase.tasks.length, 0);
  },

  getCompletedTasks() {
    if (!this.projectData) return 0;
    return this.projectData.phases.reduce(
      (sum, phase) => sum + phase.tasks.filter((t) => t.status === 'complete').length,
      0
    );
  },

  getPendingDecisions() {
    if (!this.projectData) return [];
    return this.projectData.pendingDecisions.filter((d) => d.status === 'pending');
  },

  getActiveBlockers() {
    if (!this.projectData) return [];
    return this.projectData.blockers.filter((b) => b.status !== 'resolved');
  },

  /**
   * Get tasks for a specific team member
   */
  getTasksForMember(memberId) {
    if (!this.projectData) return [];
    const tasks = [];
    this.projectData.phases.forEach((phase) => {
      phase.tasks.forEach((task) => {
        if (task.assignee === memberId) {
          tasks.push({ ...task, phaseName: phase.name, phaseNumber: phase.number, phaseId: phase.id });
        }
      });
    });
    return tasks;
  },

  /**
   * Get action items for a specific team member
   */
  getActionItemsForMember(memberId) {
    if (!this.projectData) return [];
    return this.projectData.actionItems.filter((item) => item.assignee === memberId);
  }
};

window.DataManager = DataManager;
