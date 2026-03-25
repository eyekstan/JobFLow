/**
 * DashboardScreen
 * Main home screen showing today's actions and active projects
 */

const DashboardScreen = {
  /**
   * project Move to different stage
   */
  moveStage(projectId, direction, event) {
    const project = Store.getProject(projectId);
    if (!project) return;
    
    const stages = Store.getPipelineStages();
    const archiveIndex = stages.length;
    const newIndex = project.stageIndex + direction;
    const maxIndex = archiveIndex; // Can move to Archive (which is at index = stages.length)
    
    if (newIndex >= 0 && newIndex <= maxIndex) {
      // Show animation only when moving forward (direction > 0) and actually progressing
      if (direction > 0 && newIndex > project.stageIndex) {
        Store.trackCompletion();
        this.showCompletionAnimation(event);
      }
      
      Store.updateProject(projectId, { stageIndex: newIndex });
      App.renderScreen();
    }
  },

  /**
   * Show completion animation near the clicked button
   */
  showCompletionAnimation(event) {
    const existing = document.getElementById('completionOverlay');
    if (existing) existing.remove();

    // Get button position if event was passed
    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;
    
    if (event && event.target) {
      const rect = event.target.getBoundingClientRect();
      x = rect.left + rect.width / 2;
      y = rect.top + 8; // Slightly inside the button
    }

    const overlay = document.createElement('div');
    overlay.id = 'completionOverlay';
    overlay.className = 'completion-animation';
    overlay.style.left = x + 'px';
    overlay.style.top = y + 'px';
    overlay.innerHTML = `
      <svg viewBox="0 0 52 52">
        <circle cx="26" cy="26" r="20"/>
        <path d="M14 27l7 7 16-16" stroke-dasharray="50" stroke-dashoffset="0">
          <animate attributeName="stroke-dashoffset" from="50" to="0" dur="0.4s" fill="freeze"/>
        </path>
      </svg>
    `;
    document.body.appendChild(overlay);
    
    setTimeout(() => overlay.remove(), 1000);
  },

  /**
   * Render the dashboard screen
   * @returns {string} HTML string
   */
  render() {
    const projects = Store.getProjects();
    const stages = Store.getPipelineStages();
    const archiveIndex = stages.length;
    const lastStageIndex = stages.length - 1;

    const todayCompletions = Store.getTodayCompletionCount();
    const currencySymbol = Store.getCurrencySymbol();
    const activeProjects = projects.filter(p => p.stageIndex < archiveIndex);
    const archivedProjects = projects.filter(p => p.stageIndex >= archiveIndex);

    // Won / Lost counts
    const wonCount  = archivedProjects.filter(p => p.outcome === 'won').length;
    const lostCount = archivedProjects.filter(p => p.outcome === 'lost').length;

    const pipelineValue = activeProjects.reduce((sum, p) => sum + (parseFloat(p.value) || 0), 0);
    const valueDisplay = `${currencySymbol}${pipelineValue.toLocaleString()}`;

    // Data warning banner (shown once)
    const showWarning = !Store.hasSeenDataWarning();
    const warningBanner = showWarning ? `
      <div class="data-warning-banner" id="dataWarningBanner">
        <div class="data-warning-icon">💾</div>
        <div class="data-warning-text">
          <strong>Your data is stored on this device.</strong>
          Export a backup in Settings so you never lose your jobs.
        </div>
        <button class="data-warning-close" onclick="Store.markDataWarningSeen(); document.getElementById('dataWarningBanner').remove()">✕</button>
      </div>
    ` : '';

    let todayActions = activeProjects.filter(p =>
      p.stageIndex !== lastStageIndex &&
      (Utils.isToday(p.next_action_date) || Utils.isOverdue(p.next_action_date))
    );

    todayActions.sort((a, b) => {
      const aDate = a.next_action_date || '9999-99-99';
      const bDate = b.next_action_date || '9999-99-99';
      const aOverdue = Utils.isOverdue(a.next_action_date);
      const bOverdue = Utils.isOverdue(b.next_action_date);
      const aToday   = Utils.isToday(a.next_action_date);
      const bToday   = Utils.isToday(b.next_action_date);
      if (aOverdue && !bOverdue) return -1;
      if (!aOverdue && bOverdue) return 1;
      if (aOverdue && bOverdue) return aDate.localeCompare(bDate);
      if (aToday && !bToday) return -1;
      if (!aToday && bToday) return 1;
      return 0;
    });

    return `
      ${warningBanner}

      <!-- Stats -->
      <div class="stats-header" style="grid-template-columns:1fr 1fr 1fr;">
        <div class="stats-item">
          <div class="stats-number" style="font-size:1.75rem;">${todayCompletions}</div>
          <div class="stats-label">Done Today</div>
        </div>
        <div class="stats-item">
          <div class="stats-number" style="font-size:1.75rem;">${activeProjects.length}</div>
          <div class="stats-label">Active Jobs</div>
        </div>
        <div class="stats-item">
          <div class="stats-number" style="font-size:1.4rem;color:#059669;">${valueDisplay}</div>
          <div class="stats-label">Pipeline</div>
        </div>
      </div>

      <!-- Won / Lost row -->
      ${(wonCount + lostCount) > 0 ? `
        <div class="won-lost-row">
          <div class="won-lost-item">
            <span class="won-lost-count won">${wonCount}</span>
            <span class="won-lost-label">Won</span>
          </div>
          <div class="won-lost-divider"></div>
          <div class="won-lost-item">
            <span class="won-lost-count lost">${lostCount}</span>
            <span class="won-lost-label">Lost</span>
          </div>
          <div class="won-lost-divider"></div>
          <div class="won-lost-item">
            <span class="won-lost-count rate">${Math.round((wonCount / (wonCount + lostCount)) * 100)}%</span>
            <span class="won-lost-label">Win Rate</span>
          </div>
        </div>
      ` : ''}

      <!-- Today's Actions -->
      ${todayActions.length > 0 ? `
        <div class="mb-8">
          <div class="flex items-center gap-3 mb-4">
            <svg class="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <h2 class="section-header mb-0 text-orange-500">Today's Actions</h2>
          </div>
          ${ProjectCard.renderList(todayActions, true)}
        </div>
      ` : ''}

      <!-- Active Jobs -->
      <div class="mb-4 pb-20">
        <div class="flex items-center gap-3 mb-4">
          <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
          </svg>
          <h2 class="section-header mb-0 text-blue-600">Active Jobs (${activeProjects.length})</h2>
        </div>
        ${activeProjects.length > 0
          ? ProjectCard.renderList(activeProjects, true)
          : `<div class="empty-state">
              <svg class="w-20 h-20 mx-auto text-gray-200 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
              </svg>
              <p class="text-lg font-semibold text-gray-400">No active jobs yet</p>
              <p class="text-sm text-gray-400 mt-1">Tap <strong>+</strong> to add your first lead</p>
            </div>`
        }
      </div>
    `;
  },

  /**
   * Setup swipe gestures - disabled, using buttons instead
   */
  setupSwipeGestures() {
    // Swipe disabled - using on-card buttons instead
  }
};

// Export for use in other modules
window.DashboardScreen = DashboardScreen;
