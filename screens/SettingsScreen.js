/**
 * SettingsScreen
 * Manage pipeline stages - add, delete, reorder
 */

const SettingsScreen = {
  /**
   * Render the settings screen
   * @returns {string} HTML string
   */
  render() {
    const stages = Store.getPipelineStages();
    
    return `
      <div class="max-w-lg mx-auto pb-20">
        <h2 class="screen-header">Settings</h2>
        
        <!-- Add New Stage -->
        <div class="mb-8 px-1">
          <h3 class="text-lg font-semibold text-gray-800 mb-4">Add Pipeline Stage</h3>
          <form id="addStageForm" class="flex gap-2 items-center">
            <input 
              type="text" 
              id="newStageName" 
              class="form-input flex-1" 
              style="height: 48px; font-size: 16px; border-radius: 8px;"
              placeholder="Enter stage name..."
              required
            >
            <button type="submit" class="action-btn action-btn-primary" style="height: 48px; width: 56px; flex-shrink-0;">
              +
            </button>
          </form>
        </div>

        <!-- Pipeline Stages -->
        <div class="mb-6">
          <h3 class="text-lg font-semibold text-gray-800 mb-2">Pipeline Stages</h3>
          <p class="text-sm text-gray-500 mb-4">Click arrows to reorder</p>
          
          <div id="stagesList" class="space-y-2">
            ${stages.map((stage, index) => this.renderStageItem(stage, index)).join('')}
          </div>
        </div>
      </div>
    `;
  },

  /**
   * Render a single stage item
   */
  renderStageItem(stage, index) {
    const stages = Store.getPipelineStages();
    const isFirst = index === 0;
    const isLast = index === stages.length - 1;
    const stageClass = ProjectCard.getStageClass(index);
    
    return `
      <div class="stage-item flex items-center bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow" data-index="${index}">
        ${!isFirst ? `
          <button 
            class="move-up-btn text-gray-400 hover:text-green-600 p-1 mr-1" 
            data-index="${index}"
            onclick="SettingsScreen.moveStage(${index}, -1)"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"/>
            </svg>
          </button>
        ` : '<div class="w-6"></div>'}
        ${!isLast ? `
          <button 
            class="move-down-btn text-gray-400 hover:text-green-600 p-1" 
            data-index="${index}"
            onclick="SettingsScreen.moveStage(${index}, 1)"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
            </svg>
          </button>
        ` : '<div class="w-6"></div>'}
        <span class="${stageClass} w-4 h-4 rounded-full mr-3 shrink-0"></span>
        <span class="flex-1 font-medium text-gray-800 text-lg">${stage}</span>
        <span class="text-gray-300 mr-3 text-sm">${index + 1}</span>
        <button class="delete-stage-btn text-gray-300 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 transition-colors" data-index="${index}">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
          </svg>
        </button>
      </div>
    `;
  },

  /**
   * Handle add stage form submission
   */
  handleAddStage() {
    const input = document.getElementById('newStageName');
    const stageName = input.value.trim();
    
    if (stageName) {
      Store.addPipelineStage(stageName);
      input.value = '';
      App.navigateTo('settings');
    }
  },

  /**
   * Move a stage up or down
   */
  moveStage(index, direction) {
    const stages = Store.getPipelineStages();
    const newIndex = index + direction;
    
    if (newIndex < 0 || newIndex >= stages.length) return;
    
    const temp = stages[index];
    stages[index] = stages[newIndex];
    stages[newIndex] = temp;
    
    Store.reorderPipelineStages(stages);
    App.navigateTo('settings');
  },

  /**
   * Handle delete stage
   */
  handleDeleteStage(index) {
    if (confirm('Delete this stage? Projects will move to the previous stage.')) {
      Store.deletePipelineStage(index);
      App.navigateTo('settings');
    }
  },

  /**
   * Handle drag and drop reordering
   */
  setupDragAndDrop() {
    const list = document.getElementById('stagesList');
    if (!list) return;

    let draggedItem = null;
    let draggedIndex = -1;

    const items = list.querySelectorAll('.stage-item');
    items.forEach(item => {
      item.addEventListener('dragstart', (e) => {
        draggedItem = item;
        draggedIndex = parseInt(item.dataset.index);
        item.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
      });

      item.addEventListener('dragend', () => {
        item.classList.remove('dragging');
        draggedItem = null;
        draggedIndex = -1;
        items.forEach(i => i.classList.remove('drag-over'));
      });

      item.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        if (item !== draggedItem) {
          item.classList.add('drag-over');
        }
      });

      item.addEventListener('dragleave', () => {
        item.classList.remove('drag-over');
      });

      item.addEventListener('drop', (e) => {
        e.preventDefault();
        item.classList.remove('drag-over');
        
        if (!draggedItem || draggedItem === item) return;
        
        const toIndex = parseInt(item.dataset.index);
        
        if (draggedIndex !== toIndex) {
          const stages = Store.getPipelineStages();
          const [moved] = stages.splice(draggedIndex, 1);
          stages.splice(toIndex, 0, moved);
          
          Store.reorderPipelineStages(stages);
          App.navigateTo('settings');
        }
      });
    });

    // Delete button handlers
    list.querySelectorAll('.delete-stage-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const index = parseInt(btn.dataset.index);
        SettingsScreen.handleDeleteStage(index);
      });
    });
  }
};

// Export for use in other modules
window.SettingsScreen = SettingsScreen;
