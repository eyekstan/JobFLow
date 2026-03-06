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
      <div class="max-w-lg mx-auto pb-24">
        <h2 class="screen-header">New Lead</h2>
        
        <form id="quickCaptureForm" class="space-y-4">
          <!-- Required Fields -->
          <div>
            <label class="form-label" for="name">Customer Name *</label>
            <input 
              type="text" 
              id="name" 
              name="name" 
              class="form-input" 
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
              class="form-input" 
              placeholder="Replace porch railing"
              required
            >
          </div>

          <!-- Optional Fields -->
          <div class="pt-2">
            <button 
              type="button" 
              class="text-[#007AFF] text-sm font-medium"
              onclick="this.style.display='none'; document.getElementById('optionalFields').style.display='block'"
            >
              + Add Phone & Address
            </button>
          </div>

          <div id="optionalFields" class="space-y-4" style="display: none;">
            <div>
              <label class="form-label" for="phone">Phone</label>
              <input 
                type="tel" 
                id="phone" 
                name="phone" 
                class="form-input" 
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
                class="form-input" 
                placeholder="123 Main St"
                autocomplete="street-address"
              >
            </div>
          </div>

          <!-- Submit Button -->
          <div class="pt-4">
            <button 
              type="submit" 
              class="action-btn action-btn-primary w-full py-4 text-lg"
            >
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
      status: 'Lead',
      next_action: 'Follow up',
      next_action_date: new Date().toISOString().split('T')[0]
    };

    // Create the project
    Storage.createProject(projectData);

    // Show success feedback
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Saved!';
    submitBtn.classList.add('bg-[#34C759]');

    // Navigate back to dashboard after short delay
    setTimeout(() => {
      App.navigateTo('dashboard');
    }, 500);
  }
};

// Export for use in other modules
window.QuickCaptureScreen = QuickCaptureScreen;
