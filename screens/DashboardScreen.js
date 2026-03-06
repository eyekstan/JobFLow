/**
 * DashboardScreen
 * Main home screen showing today's actions and active projects
 */

const DashboardScreen = {
  /**
   * Render the dashboard screen
   * @returns {string} HTML string
   */
  render() {
    const projects = Storage.getProjects();
    
    // Get today's actions (overdue or today)
    const todayActions = projects.filter(p => 
      p.status !== 'Complete' && 
      (Utils.isToday(p.next_action_date) || Utils.isOverdue(p.next_action_date))
    );

    // Get active projects (not complete)
    const activeProjects = projects.filter(p => p.status !== 'Complete');

    return `
      <!-- Today's Actions Section -->
      ${todayActions.length > 0 ? `
        <div class="mb-8">
          <div class="flex items-center gap-3 mb-4">
            <svg class="w-6 h-6 text-[#FF9500]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <h2 class="section-header mb-0 text-[#FF9500]">Today's Actions</h2>
          </div>
          ${ProjectCard.renderList(todayActions, true)}
        </div>
      ` : ''}

      <!-- Active Projects Section -->
      <div class="mb-4 pb-20">
        <div class="flex items-center gap-3 mb-4">
          <svg class="w-6 h-6 text-[#007AFF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
          </svg>
          <h2 class="section-header mb-0 text-[#007AFF]">Active Projects (${activeProjects.length})</h2>
        </div>
        ${activeProjects.length > 0 
          ? ProjectCard.renderList(activeProjects, true)
          : `<div class="empty-state">
              <svg class="w-24 h-24 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
              </svg>
              <p class="text-xl">No active projects</p>
              <p class="text-lg mt-2">Tap + to add your first lead</p>
            </div>`
        }
      </div>
    `;
  }
};

// Export for use in other modules
window.DashboardScreen = DashboardScreen;
