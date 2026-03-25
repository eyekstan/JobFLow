/**
 * QuickCaptureScreen
 * Fast lead capture with customer auto-suggest
 */

const QuickCaptureScreen = {
  selectedCustomerId: null,

  /**
   * Render the quick capture form
   * @returns {string} HTML string
   */
  render() {
    this.selectedCustomerId = null;
    const currencySymbol = Store.getCurrencySymbol();
    return `
      <div class="max-w-lg mx-auto pb-20">
        <h2 class="screen-header">New Lead</h2>
        
        <form id="quickCaptureForm" class="space-y-6">
          <!-- Contact Selection -->
          <div>
            <label class="form-label">Contact *</label>
            <div class="relative">
              <input 
                type="text" 
                id="customerName" 
                class="form-input form-input-lg" 
                placeholder="Start typing name..."
                required
                autocomplete="off"
                oninput="QuickCaptureScreen.searchCustomers(this.value)"
                onblur="setTimeout(() => QuickCaptureScreen.hideSuggestions(), 200)"
              >
              <div id="customerSuggestions" class="hidden absolute z-10 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-60 overflow-y-auto"></div>
            </div>
            <input type="hidden" id="customerId" name="customerId" value="">
          </div>

          <!-- Phone -->
          <div>
            <label class="form-label" for="phone">Phone</label>
            <input type="tel" id="phone" name="phone" class="form-input form-input-lg" placeholder="555-555-5555" autocomplete="tel">
          </div>

          <!-- Address -->
          <div>
            <label class="form-label" for="address">Address</label>
            <input type="text" id="address" name="address" class="form-input form-input-lg" placeholder="123 Main St" autocomplete="street-address">
          </div>

          <!-- Project Description -->
          <div>
            <label class="form-label" for="note">Project *</label>
            <input type="text" id="note" name="note" class="form-input form-input-lg" placeholder="e.g. Replace porch railing" required>
          </div>

          <!-- Job Value -->
          <div>
            <label class="form-label" for="value">Job Value</label>
            <div class="relative">
              <span class="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 font-semibold text-lg">${currencySymbol}</span>
              <input type="number" id="value" name="value" class="form-input form-input-lg" style="padding-left: 2.5rem;" placeholder="0" min="0" step="0.01">
            </div>
          </div>

          <!-- Notes -->
          <div>
            <label class="form-label" for="notes">Notes (Optional)</label>
            <textarea id="notes" name="notes" class="form-input form-input-lg" placeholder="Additional details..." rows="2"></textarea>
          </div>

          <!-- Submit -->
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
   * Search customers and show suggestions
   */
  searchCustomers(query) {
    const suggestionsEl = document.getElementById('customerSuggestions');
    const customerIdInput = document.getElementById('customerId');
    
    if (!query || query.length < 1) {
      this.hideSuggestions();
      return;
    }

    const matches = Store.searchCustomers(query);
    const nameInput = document.getElementById('customerName');
    const exactMatch = matches.find(c => c.name.toLowerCase() === query.toLowerCase());

    // If exact match found and user typed it, auto-select
    if (exactMatch && nameInput.value.toLowerCase() === exactMatch.name.toLowerCase()) {
      this.selectCustomer(exactMatch);
      suggestionsEl.classList.add('hidden');
      return;
    }

    if (matches.length === 0) {
      // No matches - user is creating new customer
      this.selectedCustomerId = null;
      customerIdInput.value = '';
      suggestionsEl.classList.add('hidden');
      return;
    }

    // Show suggestions
    let html = matches.map(customer => `
      <div 
        class="suggestion-item px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-0"
        onclick="QuickCaptureScreen.selectCustomerById('${customer.id}')"
      >
        <div class="font-medium text-gray-900">${customer.name}</div>
        <div class="text-sm text-gray-500">
          ${customer.phone ? '📞 ' + customer.phone : ''}
          ${customer.phone && customer.address ? ' | ' : ''}
          ${customer.address ? '📍 ' + customer.address : ''}
        </div>
      </div>
    `).join('');

    // Add "Create new" option if different from existing
    const alreadyExists = matches.some(c => c.name.toLowerCase() === query.toLowerCase());
    if (!alreadyExists) {
      html += `
        <div 
          class="suggestion-item px-4 py-3 hover:bg-green-50 cursor-pointer border-t-2 border-green-500"
          onclick="QuickCaptureScreen.createNewCustomer('${query.replace(/'/g, "\\'")}')"
        >
          <div class="font-medium text-green-700">+ Create "${query}"</div>
          <div class="text-sm text-green-600">New customer</div>
        </div>
      `;
    }

    suggestionsEl.innerHTML = html;
    suggestionsEl.classList.remove('hidden');
  },

  /**
   * Select a customer from suggestions
   */
  selectCustomer(customer) {
    this.selectedCustomerId = customer.id;
    document.getElementById('customerId').value = customer.id;
    document.getElementById('customerName').value = customer.name;
    document.getElementById('phone').value = customer.phone || '';
    document.getElementById('address').value = customer.address || '';
    this.hideSuggestions();
  },

  /**
   * Select customer by ID
   */
  selectCustomerById(customerId) {
    const customer = Store.getCustomer(customerId);
    if (customer) {
      this.selectCustomer(customer);
    }
  },

  /**
   * Create new customer from input
   */
  createNewCustomer(name) {
    // Create the customer
    const customer = Store.createCustomer({ name: name });
    this.selectCustomer(customer);
  },

  /**
   * Hide suggestions
   */
  hideSuggestions() {
    const suggestionsEl = document.getElementById('customerSuggestions');
    if (suggestionsEl) {
      suggestionsEl.classList.add('hidden');
    }
  },

  /**
   * Handle form submission
   */
  handleSubmit() {
    const form = document.getElementById('quickCaptureForm');
    
    // Get values directly from inputs
    const customerIdInput = document.getElementById('customerId');
    const customerNameInput = document.getElementById('customerName');
    const phoneInput = document.getElementById('phone');
    const addressInput = document.getElementById('address');
    const noteInput = document.getElementById('note');
    const notesInput = document.getElementById('notes');
    
    const customerId = customerIdInput ? customerIdInput.value : '';
    const name = customerNameInput ? customerNameInput.value : '';
    const phone = phoneInput ? phoneInput.value : '';
    const address = addressInput ? addressInput.value : '';
    const note = noteInput ? noteInput.value : '';
    const notes = notesInput ? notesInput.value : '';
    const valueInput = document.getElementById('value');
    const value = valueInput ? parseFloat(valueInput.value) || 0 : 0;

    let finalCustomerId = customerId;

    // If no customer selected but name entered, create new customer
    if (!finalCustomerId && name) {
      const customer = Store.createCustomer({ name, phone, address });
      finalCustomerId = customer.id;
    } else if (finalCustomerId) {
      // Update existing customer with any changed info
      Store.updateCustomer(finalCustomerId, { phone, address });
    }

    const projectData = {
      customerId: finalCustomerId,
      name: name,
      phone: phone,
      address: address,
      note: note,
      notes: notes,
      value: value,
      stageIndex: 0,
      next_action: 'Follow up',
      next_action_date: new Date().toISOString().split('T')[0]
    };

    // Create the project
    Store.createProject(projectData);

    // Show success feedback
    const submitBtn = form.querySelector('button[type="submit"]');
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
