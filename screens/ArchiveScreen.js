/**
 * ArchiveScreen
 * Display archived projects
 */

const ArchiveScreen = {
  /**
   * Render the archive screen
   * @returns {string} HTML string
   */
  render() {
    const allProjects = Store.getProjects();
    const stages = Store.getPipelineStages();
    const archiveIndex = stages.length; // Archive is after all editable stages
    
    // Get archived projects
    const archivedProjects = allProjects.filter(p => p.stageIndex === archiveIndex);

    return `
      <div class="max-w-lg mx-auto pb-20">
        <h2 class="screen-header">Archive</h2>
        
        ${archivedProjects.length > 0 ? `
          <div class="space-y-4">
            ${archivedProjects.map(project => this.renderArchivedCard(project)).join('')}
          </div>
        ` : `
          <div class="empty-state">
            <svg class="w-24 h-24 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"/>
            </svg>
            <p class="text-xl">No archived projects</p>
            <p class="text-lg mt-2">Move projects to Archive from the pipeline</p>
          </div>
        `}
      </div>
    `;
  },

  /**
   * Render an archived project card
   */
  renderArchivedCard(project) {
    return `
      <div class="project-card" onclick="App.navigateTo('detail', '${project.id}')">
        <div class="flex items-start justify-between">
          <div class="flex-1 min-w-0 pr-2">
            <h3 class="font-medium text-gray-900 truncate">${project.name || 'Unnamed Project'}</h3>
            <p class="text-gray-600 mt-1">${project.note || 'No notes'}</p>
            ${project.address ? `<p class="text-gray-500 text-sm mt-1">${project.address}</p>` : ''}
          </div>
          <span class="bg-gray-500 text-white text-sm font-medium px-2.5 py-1 rounded-full">Archived</span>
        </div>
        <div class="flex gap-2 mt-3 pt-3 border-t border-gray-100">
          <button 
            class="flex-1 py-2 px-3 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200"
            onclick="event.stopPropagation(); ArchiveScreen.restoreProject('${project.id}')"
          >
            ← Restore to Pipeline
          </button>
        </div>
      </div>
    `;
  },

  /**
   * Restore an archived project to the pipeline
   */
  restoreProject(projectId) {
    const project = Store.getProject(projectId);
    if (!project) return;
    
    // Move back to the last editable stage (Project Complete)
    const stages = Store.getPipelineStages();
    Store.updateProject(projectId, { stageIndex: stages.length - 1 });
    
    App.navigateTo('archive');
  }
};

// Export for use in other modules
window.ArchiveScreen = ArchiveScreen;
