/**
 * PipelineScreen
 * Display projects grouped by workflow stage
 */

const PipelineScreen = {
  /**
   * Sort projects by due date (overdue first, then today, then upcoming)
   */
  sortByDueDate(projects) {
    return [...projects].sort((a, b) => {
      const aDate = a.next_action_date || '9999-99-99';
      const bDate = b.next_action_date || '9999-99-99';
      const aOverdue = Utils.isOverdue(a.next_action_date);
      const bOverdue = Utils.isOverdue(b.next_action_date);
      const aToday = Utils.isToday(a.next_action_date);
      const bToday = Utils.isToday(b.next_action_date);
      
      // Overdue first
      if (aOverdue && !bOverdue) return -1;
      if (!aOverdue && bOverdue) return 1;
      if (aOverdue && bOverdue) return aDate.localeCompare(bDate);
      
      // Then today
      if (aToday && !bToday) return -1;
      if (!aToday && bToday) return 1;
      
      // Then upcoming (ascending date)
      if (!aOverdue && !bOverdue && !aToday && !bToday) {
        return aDate.localeCompare(bDate);
      }
      
      return 0;
    });
  },

  /**
   * Render the pipeline screen
   * @returns {string} HTML string
   */
  render() {
    const projects = Store.getProjects();
    const stages = Store.getPipelineStages();
    const archiveIndex = stages.length;
    
    // Filter out archived projects
    const activeProjects = projects.filter(p => p.stageIndex < archiveIndex);
    
    // Group projects by stage index and sort each group by due date
    const grouped = {};
    stages.forEach((stage, index) => {
      const stageProjects = activeProjects.filter(p => p.stageIndex === index);
      grouped[index] = this.sortByDueDate(stageProjects);
    });

    // Check if pipeline is empty
    const totalProjects = activeProjects.length;
    
    if (totalProjects === 0) {
      return `
        <div class="max-w-lg mx-auto pb-20">
          <h2 class="section-header">Pipeline</h2>
          <div class="empty-state">
            <svg class="w-24 h-24 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"/>
            </svg>
            <p class="text-xl">No projects in pipeline</p>
            <p class="text-lg mt-2">Add a lead to get started</p>
          </div>
        </div>
      `;
    }

    // Render each stage section
    const sections = stages.map((stage, index) => {
      const stageProjects = grouped[index];
      
      if (!stageProjects || stageProjects.length === 0) {
        return ''; // Skip empty stages
      }

      const stageClass = ProjectCard.getStageClass(index);
      
      return `
        <div class="pipeline-section">
          <div class="pipeline-header">
            <h3 class="font-medium text-gray-800">
              <span class="${stageClass} text-white text-sm font-medium px-3 py-1 rounded-full">Completed: ${stage}</span>
            </h3>
            <span class="pipeline-count">${stageProjects.length}</span>
          </div>
          ${ProjectCard.renderList(stageProjects, false)}
        </div>
      `;
    }).join('');

    return `
      <div class="max-w-lg mx-auto pb-20">
        <h2 class="section-header">Pipeline (${totalProjects})</h2>
        ${sections}
      </div>
    `;
  }
};

// Export for use in other modules
window.PipelineScreen = PipelineScreen;
