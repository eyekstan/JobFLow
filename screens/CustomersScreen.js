/**
 * CustomersScreen
 * Display all customers with their projects
 */

const CustomersScreen = {
  /**
   * Render the customers screen
   * @returns {string} HTML string
   */
  render() {
    const customers = Store.getCustomers();
    const stages = Store.getPipelineStages();
    const archiveIndex = stages.length;

    if (customers.length === 0) {
      return `
        <div class="max-w-lg mx-auto pb-20">
          <h2 class="screen-header">Customers</h2>
          <div class="empty-state">
            <svg class="w-24 h-24 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
            </svg>
            <p class="text-xl">No customers yet</p>
            <p class="text-lg mt-2">Add a lead to create your first customer</p>
          </div>
        </div>
      `;
    }

    return `
      <div class="max-w-lg mx-auto pb-20">
        <h2 class="screen-header">Customers (${customers.length})</h2>
        <div class="space-y-3">
          ${customers.map(customer => this.renderCustomerCard(customer)).join('')}
        </div>
      </div>
    `;
  },

  /**
   * Render a customer card with their projects
   */
  renderCustomerCard(customer) {
    const projects = Store.getProjects().filter(p => p.customerId === customer.id);
    const stages = Store.getPipelineStages();
    const archiveIndex = stages.length;
    const activeProjects = projects.filter(p => p.stageIndex < archiveIndex);
    const completedProjects = projects.filter(p => p.stageIndex >= archiveIndex);

    return `
      <div 
        class="bg-white rounded-xl p-4 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-shadow"
        onclick="App.navigateTo('customerDetail', '${customer.id}')"
      >
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <h3 class="font-bold text-lg text-gray-900">${customer.name}</h3>
            ${customer.phone ? `<p class="text-gray-600">📞 ${customer.phone}</p>` : ''}
            ${customer.address ? `<p class="text-gray-500 text-sm">📍 ${customer.address}</p>` : ''}
          </div>
          <div class="text-right">
            <span class="text-blue-600 text-sm font-medium">${projects.length} projects</span>
            ${activeProjects.length > 0 ? `<p class="text-xs text-orange-500">${activeProjects.length} active</p>` : ''}
          </div>
        </div>
        ${projects.length > 0 ? `
          <div class="mt-3 pt-3 border-t border-gray-100">
            <p class="text-xs text-gray-400">Tap to view details</p>
          </div>
        ` : ''}
      </div>
    `;
  }
};

// Export for use in other modules
window.CustomersScreen = CustomersScreen;
