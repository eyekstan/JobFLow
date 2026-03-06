/**
 * PipelineScreen
 * Display projects grouped by workflow stage
 */

const PipelineScreen = {
  /**
   * Render the pipeline screen
   * @returns {string} HTML string
   */
  render() {
    const projects = Storage.getProjects();
    
    // Group projects by status
    const grouped = {};
    STATUSES.forEach(status => {
      grouped[status] = projects.filter(p => p.status === status);
    });

    // Check if pipeline is empty
    const totalProjects = projects.length;
    
    if (totalProjects === 0) {
      return `
        <div class="max-w-lg mx-auto pb-20">
          <h2 class="screen-header">Pipeline</h2>
          <div class="empty-state">
            <svg class="w-16 h-16 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"/>
            </svg>
            <p>No projects in pipeline</p>
            <p class="text-sm mt-1">Add a lead to get started</p>
          </div>
        </div>
      `;
    }

    // Render each status section
    const sections = STATUSES.map(status => {
      const statusProjects = grouped[status];
      
      if (statusProjects.length === 0) {
        return ''; // Skip empty sections
      }

      const statusClass = Utils.getStatusClass(status);
      
      return `
        <div class="pipeline-section">
          <div class="pipeline-header">
            <h3 class="font-semibold text-gray-800">
              <span class="status-badge ${statusClass}">${status}</span>
            </h3>
            <span class="pipeline-count">${statusProjects.length}</span>
          </div>
          ${ProjectCard.renderList(statusProjects, true)}
        </div>
      `;
    }).join('');

    return `
      <div class="max-w-lg mx-auto pb-20">
        <h2 class="screen-header">Pipeline (${totalProjects})</h2>
        ${sections}
      </div>
    `;
  }
};

// Export for use in other modules
window.PipelineScreen = PipelineScreen;
