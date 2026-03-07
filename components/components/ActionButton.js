/**
 * ActionButton Component
 * Reusable action button for project detail screen
 */

const ActionButton = {
  /**
   * Render an action button
   * @param {string} label - Button label
   * @param {string} status - Target status
   * @param {string} projectId - Project ID
   * @param {string} color - Button color (primary, success, accent, outline)
   * @returns {string} HTML string
   */
  render(label, status, projectId, color = 'primary') {
    const colorClass = this.getColorClass(color);
    return `
      <button 
        class="action-btn ${colorClass}" 
        data-status="${status}" 
        data-project-id="${projectId}"
      >
        ${label}
      </button>
    `;
  },

  /**
   * Get color class based on button type
   * @param {string} color - Color type
   * @returns {string} CSS class
   */
  getColorClass(color) {
    switch (color) {
      case 'success':
        return 'action-btn-success';
      case 'accent':
        return 'action-btn-accent';
      case 'outline':
        return 'action-btn-outline';
      default:
        return 'action-btn-primary';
    }
  },

  /**
   * Render action buttons based on current status
   * @param {string} status - Current project status
   * @param {string} projectId - Project ID
   * @returns {string} HTML string
   */
  renderForStatus(status, projectId) {
    const actions = STATUS_ACTIONS[status] || [];
    
    if (actions.length === 0) {
      return '';
    }

    return `
      <div class="action-buttons-grid">
        ${actions.map(action => 
          this.render(action.label, action.status, projectId, action.color)
        ).join('')}
      </div>
    `;
  }
};

// Export for use in other modules
window.ActionButton = ActionButton;
