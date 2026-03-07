/**
 * QuickCaptureScreen
 * Fast lead capture during phone calls
 */

const QuickCaptureScreen = {
  /**
   * Render the quick capture form
   * @returns {string} HTML string
   */
  render() {
    return `
      <div class="max-w-lg mx-auto pb-20">
        <h2 class="screen-header">New Lead</h2>
        
        <form id="quickCaptureForm" class="space-y-6">
          <!-- Required Fields -->
          <div>
            <label class="form-label" for="name">Customer Name *</label>
            <input 
              type="text" 
              id="name" 
              name="name" 
              class="form-input form-input-lg" 
              placeholder="John Smith"
              required
              autocomplete="name"
            >
          </div>

          <div>
            <label class="form-label" for="note">Project Note *</label>
            <input 
              type="text" 
              id="note" 
              name="note" 
              class="form-input form-input-lg" 
              placeholder="Replace porch railing"
              required
            >
          </div>

          <!-- Contact Fields -->
          <div>
            <label class="form-label" for="phone">Phone</label>
            <input 
              type="tel" 
              id="phone" 
              name="phone" 
              class="form-input form-input-lg" 
              placeholder="555-555-5555"
              autocomplete="tel"
            >
          </div>

          <div>
            <label class="form-label" for="address">Address</label>
            <input 
              type="text" 
              id="address" 
              name="address" 
              class="form-input form-input-lg" 
              placeholder="123 Main St"
              autocomplete="street-address"
            >
          </div>

          <!-- Submit Button -->
          <div class="pt-8">
            <button type="submit" class="action-btn action-btn-primary action-btn-lg">
              Save Lead
            </button>
          </div>
        </form>
      </div>
    `;
  },

  /**
   * Handle form submission
   */
  handleSubmit() {
    const form = document.getElementById('quickCaptureForm');
    const formData = new FormData(form);
    
    const projectData = {
      name: formData.get('name'),
      note: formData.get('note'),
      phone: formData.get('phone') || '',
      address: formData.get('address') || '',
      stageIndex: 0, // Start at first pipeline stage
      next_action: 'Follow up',
      next_action_date: new Date().toISOString().split('T')[0]
    };

    // Create the project
    Store.createProject(projectData);

    // Show success feedback
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Saved!';
    submitBtn.classList.add('bg-green-500');

    // Navigate back to dashboard after short delay
    setTimeout(() => {
      App.navigateTo('dashboard');
    }, 500);
  }
};

// Export for use in other modules
window.QuickCaptureScreen = QuickCaptureScreen;
