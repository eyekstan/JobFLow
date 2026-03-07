/**
 * ProjectCard Component
 * Reusable card for displaying project summary
 */

const ProjectCard = {
  /**
   * Get stage badge class based on index
   */
  getStageClass(index) {
    const colors = [
      'bg-gray-600',    // Lead
      'bg-blue-600',    // Call Back
      'bg-yellow-600',  // Site Visit
      'bg-orange-600',  // Quote
      'bg-purple-600', // Schedule
      'bg-teal-600',   // Materials
      'bg-green-600',  // Begin Work
      'bg-indigo-600', // Invoice
      'bg-gray-800'    // Complete
    ];
    return colors[index % colors.length];
  },

  /**
   * Get stage name
   */
  getStageName(index) {
    return Store.getStageName(index);
  },

  /**
   * Render a project card with swipe support
   * @param {Object} project - Project object
   * @param {boolean} isTodayAction - Whether this is a today's action item
   * @returns {string} HTML string
   */
  render(project, isTodayAction = false) {
    const todayActionClass = isTodayAction ? 'today-action' : '';
    const stageName = this.getStageName(project.stageIndex);
    const stageClass = this.getStageClass(project.stageIndex);
    
    // Get all stages including Archive
    const allStages = Store.getAllStages();
    const editableStages = Store.getPipelineStages();
    const archiveIndex = editableStages.length; // Archive is after all editable stages
    
    // Get next/prev stage for buttons
    const nextStage = project.stageIndex < allStages.length - 1 ? allStages[project.stageIndex + 1] : null;
    const prevStage = project.stageIndex > 0 ? allStages[project.stageIndex - 1] : null;
    
    // Check if at final stage (before Archive)
    const isAtFinalEditableStage = project.stageIndex === editableStages.length - 1;
    const isArchived = project.stageIndex === archiveIndex;
    
    let dateDisplay = '';
    if (project.next_action_date) {
      const isOverdue = Utils.isOverdue(project.next_action_date);
      const isToday = Utils.isToday(project.next_action_date);
      const dateClass = isOverdue ? 'text-red-600 font-medium' : isToday ? 'text-orange-500 font-medium' : 'text-gray-500';
      dateDisplay = `
        <div class="flex items-center gap-1.5 mt-2 ${dateClass}">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
          </svg>
          <span class="text-sm">${Utils.formatDateString(project.next_action_date)}</span>
          ${isOverdue ? '<span class="text-xs ml-1">(Overdue)</span>' : ''}
          ${isToday ? '<span class="text-xs ml-1">(Today)</span>' : ''}
        </div>
      `;
    }

    return `
      <div class="project-card-wrapper relative" data-project-id="${project.id}">
        <!-- Card -->
        <div class="project-card no-select ${todayActionClass}" 
             data-project-id="${project.id}">
          <div class="flex items-start justify-between">
            <div class="flex-1 min-w-0 pr-2">
              <h3 class="font-medium text-gray-900 truncate">${project.name || 'Unnamed Project'}</h3>
              <p class="text-gray-600 mt-1 line-clamp-2">${project.note || 'No notes'}</p>
              ${dateDisplay}
            </div>
            <span class="${stageClass} text-white text-sm font-medium px-2.5 py-1 rounded-full ml-2 shrink-0">Completed: ${stageName}</span>
          </div>
          <!-- Stage Buttons (not shown for archived projects) -->
          ${!isArchived ? `
          <div class="flex gap-2 mt-3 pt-3 border-t border-gray-100">
            ${prevStage ? `
              <button 
                class="stage-btn flex-1 py-2 px-3 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200"
                onclick="event.stopPropagation(); DashboardScreen.moveStage('${project.id}', -1)"
              >
                ← ${prevStage}
              </button>
            ` : ''}
            ${nextStage ? `
              <button 
                class="stage-btn flex-1 py-2 px-3 ${isAtFinalEditableStage ? 'bg-purple-100 text-purple-700 hover:bg-purple-200' : 'bg-green-100 text-green-700 hover:bg-green-200'} rounded-lg text-sm font-medium"
                onclick="event.stopPropagation(); DashboardScreen.moveStage('${project.id}', 1)"
              >
                ${isAtFinalEditableStage ? '📦 ' : ''}${nextStage}${isAtFinalEditableStage ? ' →' : ' →'}
              </button>
            ` : ''}
          </div>
          ` : ''}
        </div>
      </div>
    `;
  },

  /**
   * Render multiple project cards
   * @param {Array} projects - Array of project objects
   * @param {boolean} highlightToday - Whether to highlight today's actions
   * @returns {string} HTML string
   */
  renderList(projects, highlightToday = false) {
    if (!projects || projects.length === 0) {
      return '<div class="empty-state">No projects yet</div>';
    }

    return projects.map(project => {
      const isTodayAction = highlightToday && (
        Utils.isToday(project.next_action_date) || 
        Utils.isOverdue(project.next_action_date)
      );
      return this.render(project, isTodayAction);
    }).join('');
  }
};

// Export for use in other modules
window.ProjectCard = ProjectCard;
