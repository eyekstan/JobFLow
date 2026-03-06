/**
 * ProjectCard Component
 * Reusable card for displaying project summary
 */

const ProjectCard = {
  /**
   * Get status class
   */
  getStatusClass(status) {
    const statusLower = status.toLowerCase().replace(' ', '-');
    return `status-badge status-${statusLower}`;
  },

  /**
   * Render a project card
   * @param {Object} project - Project object
   * @param {boolean} isTodayAction - Whether this is a today's action item
   * @returns {string} HTML string
   */
  render(project, isTodayAction = false) {
    const todayActionClass = isTodayAction ? 'today-action' : '';
    const statusClass = this.getStatusClass(project.status);
    
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
      <div class="project-card no-select ${todayActionClass}" data-project-id="${project.id}">
        <div class="flex items-start justify-between">
          <div class="flex-1 min-w-0 pr-2">
            <h3 class="font-medium text-gray-900 truncate">${project.name || 'Unnamed Project'}</h3>
            <p class="text-gray-600 mt-1 line-clamp-2">${project.note || 'No notes'}</p>
            ${dateDisplay}
          </div>
          <span class="${statusClass} ml-2 shrink-0">${project.status}</span>
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
