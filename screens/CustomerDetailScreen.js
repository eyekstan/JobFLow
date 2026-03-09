/**
 * CustomerDetailScreen
 * Display customer details and all their projects
 */

const CustomerDetailScreen = {
  /**
   * Render the customer detail screen
   * @param {string} customerId - Customer ID
   * @returns {string} HTML string
   */
  render(customerId) {
    const customer = Store.getCustomer(customerId);
    
    if (!customer) {
      return `
        <div class="empty-state">
          <p>Customer not found</p>
          <button onclick="App.navigateTo('customers')" class="text-blue-600 mt-2 font-medium">
            Go to Customers
          </button>
        </div>
      `;
    }

    const projects = Store.getProjects().filter(p => p.customerId === customerId);
    const stages = Store.getPipelineStages();
    const archiveIndex = stages.length;

    // Group projects by status
    const activeProjects = projects.filter(p => p.stageIndex < archiveIndex);
    const archivedProjects = projects.filter(p => p.stageIndex >= archiveIndex);

    return `
      <div class="max-w-lg mx-auto pb-20">
        <!-- Back Button -->
        <button onclick="App.goBack()" class="back-btn">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
          </svg>
          Back
        </button>

        <!-- Customer Info -->
        <div class="project-detail-card">
          <div class="flex items-center justify-between mb-4">
            <h1 class="text-2xl font-bold text-gray-900">${customer.name}</h1>
            <button 
              onclick="CustomerDetailScreen.toggleEdit('${customerId}')"
              class="text-blue-600 text-sm font-medium"
            >
              Edit
            </button>
          </div>
          
          <!-- View Mode -->
          <div id="customerView">
            ${customer.phone ? `
              <div class="flex items-center gap-3 mb-2">
                <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                </svg>
                <a href="tel:${customer.phone}" class="phone-link">${customer.phone}</a>
              </div>
            ` : ''}
            
            ${customer.address ? `
              <div class="flex items-start gap-3 mb-2">
                <svg class="w-5 h-5 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
                <a href="https://maps.google.com/?q=${encodeURIComponent(customer.address)}" target="_blank" class="text-gray-700">${customer.address}</a>
              </div>
            ` : ''}
            
            ${!customer.phone && !customer.address ? `
              <p class="text-gray-400 text-sm">No contact info</p>
            ` : ''}
          </div>
          
          <!-- Edit Mode -->
          <div id="customerEdit" class="hidden space-y-3">
            <input type="text" id="editCustomerName" class="form-input" value="${customer.name}" placeholder="Name">
            <input type="tel" id="editCustomerPhone" class="form-input" value="${customer.phone || ''}" placeholder="Phone">
            <input type="text" id="editCustomerAddress" class="form-input" value="${customer.address || ''}" placeholder="Address">
            <div class="flex gap-2">
              <button onclick="CustomerDetailScreen.saveCustomer('${customerId}')" class="action-btn action-btn-primary flex-1">Save</button>
              <button onclick="CustomerDetailScreen.cancelEdit()" class="action-btn flex-1 bg-gray-100 text-gray-600">Cancel</button>
            </div>
          </div>
        </div>

        <!-- Projects -->
        <h2 class="section-header">Projects (${projects.length})</h2>
        
        ${activeProjects.length > 0 ? `
          <div class="mb-4">
            <h3 class="text-sm font-medium text-gray-500 mb-2">Active (${activeProjects.length})</h3>
            ${activeProjects.map(p => this.renderProjectCard(p)).join('')}
          </div>
        ` : ''}

        ${archivedProjects.length > 0 ? `
          <div>
            <h3 class="text-sm font-medium text-gray-500 mb-2">Archived (${archivedProjects.length})</h3>
            ${archivedProjects.map(p => this.renderProjectCard(p)).join('')}
          </div>
        ` : ''}

        ${projects.length === 0 ? `
          <p class="text-gray-400 text-center py-4">No projects yet</p>
        ` : ''}

        <!-- Delete Customer -->
        <button 
          onclick="CustomerDetailScreen.deleteCustomer('${customerId}')" 
          class="action-btn mt-6 text-red-500 border-2 border-red-300"
        >
          Delete Customer
        </button>
      </div>
    `;
  },

  /**
   * Render a project card
   */
  renderProjectCard(project) {
    const stageName = Store.getStageName(project.stageIndex);
    const stageClass = ProjectCard.getStageClass(project.stageIndex);

    return `
      <div 
        class="bg-white rounded-xl p-4 mb-2 shadow-sm border border-gray-100 cursor-pointer"
        onclick="App.navigateTo('detail', '${project.id}')"
      >
        <div class="flex items-center justify-between">
          <span class="font-medium text-gray-900">${project.note || 'No note'}</span>
          <span class="${stageClass} text-white text-xs font-medium px-2 py-1 rounded-full">${stageName}</span>
        </div>
        ${project.next_action_date ? `
          <p class="text-sm text-gray-500 mt-1">Due: ${Utils.formatDateString(project.next_action_date)}</p>
        ` : ''}
      </div>
    `;
  },

  /**
   * Toggle edit mode
   */
  toggleEdit(customerId) {
    const view = document.getElementById('customerView');
    const edit = document.getElementById('customerEdit');
    if (view.classList.contains('hidden')) {
      view.classList.remove('hidden');
      edit.classList.add('hidden');
    } else {
      // Populate current values
      const customer = Store.getCustomer(customerId);
      if (customer) {
        document.getElementById('editCustomerName').value = customer.name || '';
        document.getElementById('editCustomerPhone').value = customer.phone || '';
        document.getElementById('editCustomerAddress').value = customer.address || '';
      }
      view.classList.add('hidden');
      edit.classList.remove('hidden');
    }
  },

  /**
   * Cancel edit
   */
  cancelEdit() {
    document.getElementById('customerView').classList.remove('hidden');
    document.getElementById('customerEdit').classList.add('hidden');
  },

  /**
   * Save customer edits
   */
  saveCustomer(customerId) {
    const name = document.getElementById('editCustomerName').value.trim();
    const phone = document.getElementById('editCustomerPhone').value.trim();
    const address = document.getElementById('editCustomerAddress').value.trim();

    Store.updateCustomer(customerId, { name, phone, address });
    
    App.navigateTo('customerDetail', customerId);
  },

  /**
   * Delete customer
   */
  deleteCustomer(customerId) {
    if (confirm('Delete this customer? Their projects will remain but be unlinked.')) {
      Store.deleteCustomer(customerId);
      App.navigateTo('customers');
    }
  }
};

// Export for use in other modules
window.CustomerDetailScreen = CustomerDetailScreen;
