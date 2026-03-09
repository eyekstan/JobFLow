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

    // Stage navigation buttons with dynamic colors
    const prevBtnColor = canMoveBackward ? ProjectCard.getButtonColorClass(project.stageIndex - 1) : '';
    const nextBtnColor = canMoveForward ? ProjectCard.getButtonColorClass(project.stageIndex + 1) : '';
    
    let stageButtons = '';
    if (canMoveForward || canMoveBackward) {
      stageButtons = `
        <div class="action-buttons-grid">
          ${canMoveBackward ? `
            <button onclick="ProjectDetailScreen.moveStage('${projectId}', -1)" class="action-btn ${prevBtnColor}">
              ← ${prevStage}
            </button>
          ` : '<div></div>'}
          ${canMoveForward ? `
            <button onclick="ProjectDetailScreen.moveStage('${projectId}', 1)" class="action-btn ${nextBtnColor}">
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
            ${project.customerId ? `
              <button 
                onclick="App.navigateTo('customerDetail', '${project.customerId}')"
                class="text-2xl font-bold text-gray-900 hover:text-blue-600"
              >
                ${project.name || 'Unnamed Project'}
              </button>
            ` : `
              <h1 class="text-2xl font-bold text-gray-900">${project.name || 'Unnamed Project'}</h1>
            `}
            <span class="${stageClass} text-white text-sm font-medium px-3 py-1 rounded-full">Completed: ${stageName}</span>
          </div>
        </div>

        <!-- Phone + Address -->
        <div class="project-detail-card space-y-4">
          <div class="flex items-center justify-between">
            <span class="text-gray-500 text-sm font-medium uppercase">Contact</span>
            <button onclick="ProjectDetailScreen.toggleContactEdit('${projectId}')" class="text-blue-600 text-sm font-medium">
              Edit
            </button>
          </div>
          
          <!-- Contact Display -->
          <div id="contactDisplay">
            ${project.phone ? `
              <div class="flex items-center gap-3">
                <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                </svg>
                <a href="tel:${project.phone}" class="phone-link flex-1">${project.phone}</a>
                <a href="tel:${project.phone}" class="p-2 text-green-600 hover:bg-green-50 rounded-full">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                  </svg>
                </a>
                <a href="sms:${project.phone}" class="p-2 text-blue-600 hover:bg-blue-50 rounded-full">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                  </svg>
                </a>
              </div>
            ` : ''}
            
            ${project.address ? `
              <div class="flex items-start gap-3 mt-3">
                <svg class="w-5 h-5 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
                <a href="https://maps.google.com/?q=${encodeURIComponent(project.address)}" target="_blank" class="text-gray-700 flex-1">${project.address}</a>
                <a href="https://maps.google.com/?q=${encodeURIComponent(project.address)}" target="_blank" class="p-2 text-red-600 hover:bg-red-50 rounded-full" title="Navigate">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/>
                  </svg>
                </a>
              </div>
            ` : ''}
            
            ${!project.phone && !project.address ? `
              <p class="text-gray-400 text-sm">No contact info</p>
            ` : ''}
          </div>
          
          <!-- Contact Edit Form (hidden by default) -->
          <div id="contactEdit" class="hidden space-y-3">
            <input 
              type="tel" 
              id="edit_phone" 
              class="form-input" 
              value="${project.phone || ''}"
              placeholder="Phone number"
              autocomplete="tel"
            >
            <input 
              type="text" 
              id="edit_address" 
              class="form-input" 
              value="${project.address || ''}"
              placeholder="Address"
              autocomplete="street-address"
            >
            <div class="flex gap-2">
              <button onclick="ProjectDetailScreen.saveContact('${projectId}')" class="action-btn action-btn-primary flex-1">
                Save
              </button>
              <button onclick="ProjectDetailScreen.cancelContactEdit()" class="action-btn flex-1 bg-gray-100 text-gray-600">
                Cancel
              </button>
            </div>
          </div>
        </div>

        <!-- Project Name -->
        <div class="project-detail-card">
          <h3 class="font-bold text-gray-800 text-lg mb-2">Project Name</h3>
          <textarea 
            id="edit_note" 
            class="form-input" 
            rows="2"
            placeholder="Enter project name..."
            oninput="clearTimeout(window.noteSaveTimer); window.noteSaveTimer=setTimeout(()=>Store.updateProject('${projectId}',{note:document.getElementById('edit_note').value}),500)"
          >${project.note || ''}</textarea>
        </div>

        <!-- Notes -->
        <div class="project-detail-card">
          <h3 class="font-bold text-gray-800 text-lg mb-2">Notes</h3>
          <textarea 
            id="edit_notes" 
            class="form-input" 
            rows="4"
            placeholder="Enter additional notes..."
            oninput="clearTimeout(window.notesSaveTimer); window.notesSaveTimer=setTimeout(()=>Store.updateProject('${projectId}',{notes:document.getElementById('edit_notes').value}),500)"
          >${project.notes || ''}</textarea>
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
              <div class="flex gap-2">
                <input 
                  type="date" 
                  id="detail_next_action_date" 
                  class="form-input flex-1" 
                  value="${project.next_action_date || ''}"
                  onchange="ProjectDetailScreen.saveDate('${projectId}', this.value)"
                >
                ${project.next_action_date ? `
                  <button 
                    onclick="ProjectDetailScreen.openCalendar('${projectId}')"
                    class="action-btn bg-blue-50 text-blue-600 border-2 border-blue-200 px-3"
                    title="Add to calendar"
                  >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                    </svg>
                  </button>
                ` : ''}
              </div>
            </div>
          </div>
        </div>

        <!-- Archive and Delete Buttons -->
        <div class="flex gap-3 mt-6">
          <button 
            onclick="ProjectDetailScreen.archiveProject('${projectId}')" 
            class="action-btn flex-1 bg-purple-100 text-purple-700 border-2 border-purple-300"
          >
            Archive
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
    App.navigateTo('detail', projectId);
  },

  /**
   * Open Google Calendar with project due date
   * @param {string} projectId - Project ID
   */
  openCalendar(projectId) {
    const project = Store.getProject(projectId);
    if (!project || !project.next_action_date) return;

    const title = encodeURIComponent(project.note || project.name || 'Project Due');
    const dateStr = project.next_action_date.replace(/-/g, '');
    
    let details = '';
    if (project.customerId) {
      const customer = Store.getCustomer(project.customerId);
      if (customer) {
        details = encodeURIComponent(`Customer: ${customer.name}\n${customer.phone ? 'Phone: ' + customer.phone + '\n' : ''}${customer.address ? 'Address: ' + customer.address : ''}`);
      }
    }

    const url = `https://www.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dateStr}/${dateStr}&details=${details}`;
    window.open(url, '_blank');
  },

  /**
   * Handle form submission for editing details (kept for compatibility)
   * @param {string} projectId - Project ID
   */
  handleSubmit(projectId) {
    // No longer needed - auto-save implemented
  },

  /**
   * Move project to different stage
   * @param {string} projectId - Project ID
   * @param {number} direction - -1 for previous, 1 for next
   */
  moveStage(projectId, direction) {
    const project = Store.getProject(projectId);
    if (!project) return;
    
    const allStages = Store.getAllStages();
    const newIndex = project.stageIndex + direction;
    
    if (newIndex >= 0 && newIndex < allStages.length) {
      Store.updateProject(projectId, { stageIndex: newIndex });
      App.navigateTo('detail', projectId);
    }
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
  },

  /**
   * Toggle contact edit mode
   */
  toggleContactEdit(projectId) {
    const display = document.getElementById('contactDisplay');
    const edit = document.getElementById('contactEdit');
    
    if (display.classList.contains('hidden')) {
      display.classList.remove('hidden');
      edit.classList.add('hidden');
    } else {
      // Populate current values
      const project = Store.getProject(projectId);
      document.getElementById('edit_phone').value = project.phone || '';
      document.getElementById('edit_address').value = project.address || '';
      display.classList.add('hidden');
      edit.classList.remove('hidden');
    }
  },

  /**
   * Save contact info
   */
  saveContact(projectId) {
    const phone = document.getElementById('edit_phone').value.trim();
    const address = document.getElementById('edit_address').value.trim();
    
    Store.updateProject(projectId, { phone, address });
    App.navigateTo('detail', projectId);
  },

  /**
   * Cancel contact edit
   */
  cancelContactEdit() {
    document.getElementById('contactDisplay').classList.remove('hidden');
    document.getElementById('contactEdit').classList.add('hidden');
  },

  /**
   * Toggle note edit mode
   */
  toggleNoteEdit(projectId) {
    const display = document.getElementById('noteDisplay');
    const edit = document.getElementById('noteEdit');
    
    if (display.classList.contains('hidden')) {
      display.classList.remove('hidden');
      edit.classList.add('hidden');
    } else {
      // Populate current value
      const project = Store.getProject(projectId);
      document.getElementById('edit_note').value = project.note || '';
      display.classList.add('hidden');
      edit.classList.remove('hidden');
      document.getElementById('edit_note').focus();
    }
  },

  /**
   * Save note
   */
  saveNote(projectId) {
    const note = document.getElementById('edit_note').value.trim();
    
    Store.updateProject(projectId, { note });
    App.navigateTo('detail', projectId);
  },

  /**
   * Cancel note edit
   */
  cancelNoteEdit() {
    document.getElementById('noteDisplay').classList.remove('hidden');
    document.getElementById('noteEdit').classList.add('hidden');
  },

  /**
   * Toggle notes edit mode
   */
  toggleNotesEdit(projectId) {
    const display = document.getElementById('notesDisplay');
    const edit = document.getElementById('notesEdit');
    
    if (display.classList.contains('hidden')) {
      display.classList.remove('hidden');
      edit.classList.add('hidden');
    } else {
      const project = Store.getProject(projectId);
      document.getElementById('edit_notes').value = project.notes || '';
      display.classList.add('hidden');
      edit.classList.remove('hidden');
    }
  },

  /**
   * Save notes
   */
  saveNotes(projectId) {
    const notes = document.getElementById('edit_notes').value.trim();
    Store.updateProject(projectId, { notes });
    App.navigateTo('detail', projectId);
  },

  /**
   * Cancel notes edit
   */
  cancelNotesEdit() {
    document.getElementById('notesDisplay').classList.remove('hidden');
    document.getElementById('notesEdit').classList.add('hidden');
  }
};

// Export for use in other modules
window.ProjectDetailScreen = ProjectDetailScreen;
