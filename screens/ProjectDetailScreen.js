/**
 * ProjectDetailScreen
 * Display and edit project details with status action buttons
 */

const ProjectDetailScreen = {
  /**
   * Render the project detail screen
   * @param {string} projectId - Project ID
   * @returns {string} HTML string
   */
  render(projectId) {
    const project = Storage.getProject(projectId);
    
    if (!project) {
      return `
        <div class="empty-state">
          <p>Project not found</p>
          <button onclick="App.navigateTo('dashboard')" class="text-[#007AFF] mt-2">
            Go to Dashboard
          </button>
        </div>
      `;
    }

    const statusClass = Utils.getStatusClass(project.status);
    
    // Phone button if phone exists
    const phoneButton = project.phone ? `
      <button id="callBtn" data-phone="${project.phone}" class="action-btn action-btn-primary">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
        </svg>
        Call ${project.phone}
      </button>
    ` : '';

    // Next action date display
    let actionDateInput = '';
    if (project.next_action_date) {
      actionDateInput = `
        <div class="bg-gray-50 rounded-lg p-3 mt-3">
          <label class="text-sm text-gray-500">Next Action Date</label>
          <p class="font-medium">${Utils.formatDateString(project.next_action_date)}</p>
        </div>
      `;
    }

    return `
      <div class="max-w-lg mx-auto pb-24">
        <!-- Back Button -->
        <button id="backBtn" class="back-btn">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
          </svg>
          Back
        </button>

        <!-- Project Header -->
        <div class="bg-white rounded-xl p-4 shadow-sm mb-4">
          <div class="flex items-start justify-between mb-3">
            <h1 class="text-xl font-bold text-gray-900">${project.name || 'Unnamed Project'}</h1>
            <span class="status-badge ${statusClass}">${project.status}</span>
          </div>
          
          <p class="text-gray-600">${project.note || 'No notes'}</p>
        </div>

        <!-- Contact & Location -->
        <div class="bg-white rounded-xl p-4 shadow-sm mb-4 space-y-3">
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

        <!-- Edit Form -->
        <form id="detailForm" class="bg-white rounded-xl p-4 shadow-sm mb-4">
          <h3 class="font-semibold text-gray-800 mb-3">Edit Details</h3>
          
          <div class="space-y-3">
            <div>
              <label class="form-label" for="detail_note">Project Note</label>
              <input 
                type="text" 
                id="detail_note" 
                name="note" 
                class="form-input" 
                value="${project.note || ''}"
              >
            </div>
            
            <div>
              <label class="form-label" for="detail_next_action">Next Action</label>
              <input 
                type="text" 
                id="detail_next_action" 
                name="next_action" 
                class="form-input" 
                value="${project.next_action || ''}"
                placeholder="Follow up, Schedule visit..."
              >
            </div>
            
            <div>
              <label class="form-label" for="detail_next_action_date">Next Action Date</label>
              <input 
                type="date" 
                id="detail_next_action_date" 
                name="next_action_date" 
                class="form-input" 
                value="${project.next_action_date || ''}"
              >
            </div>
          </div>

          <button type="submit" class="action-btn action-btn-outline mt-4">
            Save Changes
          </button>
        </form>

        <!-- Action Buttons -->
        ${phoneButton}
        ${ActionButton.renderForStatus(project.status, projectId)}

        <!-- Delete Button -->
        <button 
          onclick="ProjectDetailScreen.deleteProject('${projectId}')" 
          class="action-btn mt-4 text-red-500 border-red-300 hover:bg-red-50"
        >
          Delete Project
        </button>
      </div>
    `;
  },

  /**
   * Handle form submission for editing details
   * @param {string} projectId - Project ID
   */
  handleSubmit(projectId) {
    const form = document.getElementById('detailForm');
    const formData = new FormData(form);
    
    const updates = {
      note: formData.get('note'),
      next_action: formData.get('next_action'),
      next_action_date: formData.get('next_action_date')
    };

    Storage.updateProject(projectId, updates);
    
    // Re-render to show updated data
    App.navigateTo('detail', projectId);
  },

  /**
   * Update project status
   * @param {string} projectId - Project ID
   * @param {string} newStatus - New status value
   */
  updateStatus(projectId, newStatus) {
    Storage.updateProject(projectId, { status: newStatus });
    App.navigateTo('detail', projectId);
  },

  /**
   * Delete a project
   * @param {string} projectId - Project ID
   */
  deleteProject(projectId) {
    if (confirm('Are you sure you want to delete this project?')) {
      Storage.deleteProject(projectId);
      App.navigateTo('dashboard');
    }
  }
};

// Export for use in other modules
window.ProjectDetailScreen = ProjectDetailScreen;
