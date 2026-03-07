/**
 * ProjectDetailScreen
 * Display and edit project details with stage action buttons
 */

const ProjectDetailScreen = {
  /**
   * Get suggested action based on stage name
   */
  getSuggestedAction(stageName) {
    const suggestions = {
      'Lead': 'Follow up with lead',
      'Call Back': 'Return customer call',
      'Site Visit': 'Complete site visit',
      'Quote': 'Send quote to customer',
      'Schedule': 'Schedule work date',
      'Materials': 'Order/confirm materials',
      'Begin Work': 'Start work',
      'Invoice': 'Send invoice',
      'Project Complete': 'Collect payment'
    };
    return suggestions[stageName] || `Complete ${stageName}`;
  },

  /**
   * Render the project detail screen
   * @param {string} projectId - Project ID
   * @returns {string} HTML string
   */
  render(projectId) {
    const project = Store.getProject(projectId);
    const stages = Store.getPipelineStages();
    const archiveIndex = stages.length;
    
    if (!project) {
      return `
        <div class="empty-state">
          <p>Project not found</p>
          <button onclick="App.navigateTo('dashboard')" class="text-blue-600 mt-2 font-medium">
            Go to Dashboard
          </button>
        </div>
      `;
    }

    const stageName = Store.getStageName(project.stageIndex);
    const stageClass = ProjectCard.getStageClass(project.stageIndex);
    
    // Check if can move forward/backward
    const allStages = Store.getAllStages();
    const canMoveForward = project.stageIndex < allStages.length - 1;
    const canMoveBackward = project.stageIndex > 0;
    const nextStage = canMoveForward ? allStages[project.stageIndex + 1] : null;
    const prevStage = canMoveBackward ? allStages[project.stageIndex - 1] : null;
    
    // Get suggested action for this stage
    const suggestedAction = this.getSuggestedAction(stageName);

    // Stage navigation buttons
    let stageButtons = '';
    if (canMoveForward || canMoveBackward) {
      stageButtons = `
        <div class="action-buttons-grid">
          ${canMoveBackward ? `
            <button onclick="ProjectDetailScreen.moveStage('${projectId}', -1)" class="action-btn action-btn-outline">
              ← ${prevStage}
            </button>
          ` : '<div></div>'}
          ${canMoveForward ? `
            <button onclick="ProjectDetailScreen.moveStage('${projectId}', 1)" class="action-btn action-btn-primary">
              ${nextStage} →
            </button>
          ` : '<div></div>'}
        </div>
      `;
    }

    return `
      <div class="max-w-lg mx-auto pb-20">
        <!-- Back Button -->
        <button id="backBtn" class="back-btn">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
          </svg>
          Back
        </button>

        <!-- Contact Name + Stage Badge -->
        <div class="project-detail-card">
          <div class="flex items-center justify-between mb-2">
            <h1 class="text-2xl font-bold text-gray-900">${project.name || 'Unnamed Project'}</h1>
            <span class="${stageClass} text-white text-sm font-medium px-3 py-1 rounded-full">Completed: ${stageName}</span>
          </div>
        </div>

        <!-- Phone + Address -->
        <div class="project-detail-card space-y-4">
          ${project.phone ? `
            <div class="flex items-center gap-3">
              <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
              </svg>
              <a href="tel:${project.phone}" class="phone-link">${project.phone}</a>
            </div>
          ` : ''}
          
          ${project.address ? `
            <div class="flex items-start gap-3">
              <svg class="w-5 h-5 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
              <span class="text-gray-700">${project.address}</span>
            </div>
          ` : ''}
        </div>

        <!-- Project Note -->
        <div class="project-detail-card">
          <h3 class="font-bold text-gray-800 text-lg mb-2">Project Note</h3>
          <p class="text-gray-600">${project.note || 'No notes'}</p>
        </div>

        <!-- Stage Navigation -->
        ${stageButtons}

        <!-- Due Date for Next Stage -->
        <div class="project-detail-card">
          <h3 class="font-bold text-gray-800 text-lg mb-4">
            ${nextStage ? `Due Date for "${nextStage}"` : 'Set Due Date'}
          </h3>
          
          <div class="space-y-4">
            <div>
              <label class="form-label" for="detail_next_action_date">Due Date</label>
              <input 
                type="date" 
                id="detail_next_action_date" 
                class="form-input" 
                value="${project.next_action_date || ''}"
                onchange="ProjectDetailScreen.saveDate('${projectId}', this.value)"
              >
            </div>
          </div>
        </div>

        <!-- Archive and Delete Buttons -->
        <div class="flex gap-3 mt-6">
          <button 
            onclick="ProjectDetailScreen.archiveProject('${projectId}')" 
            class="action-btn flex-1 bg-purple-100 text-purple-700 border-2 border-purple-300"
          >
            📦 Archive
          </button>
          <button 
            onclick="ProjectDetailScreen.deleteProject('${projectId}')" 
            class="action-btn flex-1 text-red-500 border-2 border-red-300"
          >
            Delete
          </button>
        </div>
      </div>
    `;
  },

  /**
   * Save date automatically when changed
   * @param {string} projectId - Project ID
   * @param {string} dateValue - Date value
   */
  saveDate(projectId, dateValue) {
    Store.updateProject(projectId, { next_action_date: dateValue });
  },

  /**
   * Handle form submission for editing details (kept for compatibility)
   * @param {string} projectId - Project ID
   */
  handleSubmit(projectId) {
    // No longer needed - auto-save implemented
  },

  /**
   * Archive a project directly (bypasses normal pipeline)
   * @param {string} projectId - Project ID
   */
  archiveProject(projectId) {
    if (confirm('Archive this project? It will be moved to Archive.')) {
      const stages = Store.getPipelineStages();
      const archiveIndex = stages.length;
      Store.updateProject(projectId, { stageIndex: archiveIndex });
      App.navigateTo('archive');
    }
  },

  /**
   * Delete a project
   * @param {string} projectId - Project ID
   */
  deleteProject(projectId) {
    if (confirm('Are you sure you want to delete this project?')) {
      Store.deleteProject(projectId);
      App.navigateTo('dashboard');
    }
  }
};

// Export for use in other modules
window.ProjectDetailScreen = ProjectDetailScreen;
