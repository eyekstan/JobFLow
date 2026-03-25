/**
 * CustomerDetailScreen
 * Customer info + full project history timeline
 */

const CustomerDetailScreen = {
  render(customerId) {
    const customer = Store.getCustomer(customerId);
    if (!customer) {
      return `<div class="empty-state"><p>Customer not found</p>
        <button onclick="App.navigateTo('customers')" class="text-blue-600 mt-2 font-medium">Go to Customers</button>
      </div>`;
    }

    const allProjects = Store.getProjects().filter(p => p.customerId === customerId);
    const stages = Store.getPipelineStages();
    const archiveIndex = stages.length;
    const activeProjects  = allProjects.filter(p => p.stageIndex < archiveIndex);
    const archivedProjects = allProjects.filter(p => p.stageIndex >= archiveIndex);
    const currency = Store.getCurrencySymbol();

    // Build timeline events from all projects
    const events = this.buildTimeline(allProjects, stages, archiveIndex);

    // Stats
    const totalValue = allProjects.reduce((s, p) => s + (parseFloat(p.value) || 0), 0);
    const wonValue   = archivedProjects.filter(p => p.outcome === 'won')
                         .reduce((s, p) => s + (parseFloat(p.value) || 0), 0);

    return `
      <div class="max-w-lg mx-auto pb-20">
        <button onclick="App.goBack()" class="back-btn">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
          </svg>
          Back
        </button>

        <!-- Customer Info Card -->
        <div class="project-detail-card">
          <div class="flex items-start justify-between mb-3">
            <div>
              <h1 class="text-2xl font-bold text-gray-900">${customer.name}</h1>
              ${customer.phone ? `<a href="tel:${customer.phone}" class="phone-link block mt-1">${customer.phone}</a>` : ''}
              ${customer.address ? `
                <a href="https://maps.google.com/?q=${encodeURIComponent(customer.address)}" target="_blank"
                   class="text-gray-500 text-sm block mt-1">${customer.address}</a>` : ''}
              ${!customer.phone && !customer.address ? `<p class="text-gray-400 text-sm mt-1">No contact info</p>` : ''}
            </div>
            <button onclick="CustomerDetailScreen.toggleEdit('${customerId}')" class="text-blue-600 text-sm font-medium">Edit</button>
          </div>

          <!-- Edit Mode -->
          <div id="customerEdit" class="hidden space-y-3 mt-3 pt-3 border-t border-gray-100">
            <input type="text" id="editCustomerName" class="form-input" value="${customer.name}" placeholder="Name">
            <input type="tel" id="editCustomerPhone" class="form-input" value="${customer.phone || ''}" placeholder="Phone">
            <input type="text" id="editCustomerAddress" class="form-input" value="${customer.address || ''}" placeholder="Address">
            <div class="flex gap-2">
              <button onclick="CustomerDetailScreen.saveCustomer('${customerId}')" class="action-btn action-btn-primary flex-1">Save</button>
              <button onclick="CustomerDetailScreen.cancelEdit()" class="action-btn flex-1 bg-gray-100 text-gray-600">Cancel</button>
            </div>
          </div>
        </div>

        <!-- Stats Strip -->
        ${allProjects.length > 0 ? `
          <div class="cust-stats-row">
            <div class="cust-stat">
              <span class="cust-stat-num">${allProjects.length}</span>
              <span class="cust-stat-label">Jobs</span>
            </div>
            <div class="cust-stat-div"></div>
            <div class="cust-stat">
              <span class="cust-stat-num">${activeProjects.length}</span>
              <span class="cust-stat-label">Active</span>
            </div>
            ${totalValue > 0 ? `
              <div class="cust-stat-div"></div>
              <div class="cust-stat">
                <span class="cust-stat-num" style="font-size:1rem;">${currency}${totalValue.toLocaleString()}</span>
                <span class="cust-stat-label">Total Value</span>
              </div>
            ` : ''}
            ${wonValue > 0 ? `
              <div class="cust-stat-div"></div>
              <div class="cust-stat">
                <span class="cust-stat-num" style="font-size:1rem;color:#16a34a;">${currency}${wonValue.toLocaleString()}</span>
                <span class="cust-stat-label">Won Value</span>
              </div>
            ` : ''}
          </div>
        ` : ''}

        <!-- Active Projects -->
        ${activeProjects.length > 0 ? `
          <div class="mb-4">
            <h2 class="section-header">Active Jobs (${activeProjects.length})</h2>
            ${activeProjects.map(p => this.renderProjectCard(p, stages, archiveIndex, currency)).join('')}
          </div>
        ` : ''}

        <!-- History Timeline -->
        ${events.length > 0 ? `
          <div class="mb-4">
            <h2 class="section-header">History</h2>
            <div class="cust-timeline">
              ${events.map(e => this.renderTimelineEvent(e, currency)).join('')}
            </div>
          </div>
        ` : `
          <div class="empty-state" style="padding:32px 0;">
            <p class="text-gray-400">No project history yet</p>
          </div>
        `}

        <!-- Delete Customer -->
        <button onclick="CustomerDetailScreen.deleteCustomer('${customerId}')"
          class="action-btn mt-4 text-red-500 border-2 border-red-300">
          Delete Customer
        </button>
      </div>
    `;
  },

  buildTimeline(projects, stages, archiveIndex) {
    const events = [];

    projects.forEach(project => {
      // Job created
      events.push({
        type: 'created',
        date: project.created_at,
        projectId: project.id,
        projectNote: project.note || 'Unnamed job',
        label: 'New job added',
        value: project.value || null,
      });

      // Stage due dates
      if (project.stageDates) {
        Object.entries(project.stageDates).forEach(([stageIdx, dateStr]) => {
          if (!dateStr) return;
          const stageName = stages[parseInt(stageIdx)] || 'Stage';
          events.push({
            type: 'stagedate',
            date: new Date(dateStr + 'T12:00:00').getTime(),
            projectId: project.id,
            projectNote: project.note || 'Unnamed job',
            label: `Due: ${stageName}`,
          });
        });
      }

      // Legacy single due date
      if (project.next_action_date && !project.stageDates) {
        events.push({
          type: 'stagedate',
          date: new Date(project.next_action_date + 'T12:00:00').getTime(),
          projectId: project.id,
          projectNote: project.note || 'Unnamed job',
          label: 'Due date set',
        });
      }

      // Archived / outcome
      if (project.stageIndex >= archiveIndex) {
        events.push({
          type: project.outcome === 'won' ? 'won' : project.outcome === 'lost' ? 'lost' : 'archived',
          date: project.created_at + 1, // approximate — no archive timestamp
          projectId: project.id,
          projectNote: project.note || 'Unnamed job',
          label: project.outcome === 'won' ? 'Job won 🏆' : project.outcome === 'lost' ? 'Job lost' : 'Archived',
          value: project.value || null,
        });
      }
    });

    // Sort newest first
    return events.sort((a, b) => b.date - a.date);
  },

  renderTimelineEvent(event, currency) {
    const dateStr = event.date
      ? new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      : '';

    const typeConfig = {
      created:   { dot: '#007AFF', icon: '＋' },
      stagedate: { dot: '#f97316', icon: '📅' },
      won:       { dot: '#16a34a', icon: '🏆' },
      lost:      { dot: '#dc2626', icon: '✕'  },
      archived:  { dot: '#9ca3af', icon: '📦' },
    };
    const cfg = typeConfig[event.type] || typeConfig.created;

    return `
      <div class="cust-timeline-event" onclick="App.navigateTo('detail', '${event.projectId}')">
        <div class="cust-timeline-dot" style="background:${cfg.dot};">${cfg.icon}</div>
        <div class="cust-timeline-body">
          <div class="cust-timeline-label">${event.label}</div>
          <div class="cust-timeline-project">${event.projectNote}${event.value ? ` · ${currency}${Number(event.value).toLocaleString()}` : ''}</div>
          ${dateStr ? `<div class="cust-timeline-date">${dateStr}</div>` : ''}
        </div>
        <svg class="w-4 h-4 text-gray-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
        </svg>
      </div>
    `;
  },

  renderProjectCard(project, stages, archiveIndex, currency) {
    const stageName = Store.getStageName(project.stageIndex);
    const hexColor  = ProjectCard.getStageHexColor(Math.min(project.stageIndex, stages.length - 1));
    return `
      <div class="bg-white rounded-xl p-4 mb-2 border-l-4 cursor-pointer"
           style="border-color:${hexColor};border-top:1.5px solid #e4e8ef;border-right:1.5px solid #e4e8ef;border-bottom:1.5px solid #e4e8ef;"
           onclick="App.navigateTo('detail', '${project.id}')">
        <div class="flex items-center justify-between">
          <div class="flex-1 min-w-0 pr-2">
            <span class="font-semibold text-gray-900 block truncate">${project.note || project.notes || 'No description'}</span>
            ${project.value ? `<span class="card-value-badge">${currency}${Number(project.value).toLocaleString()}</span>` : ''}
          </div>
          <span class="text-xs font-semibold px-2 py-1 rounded-full text-white flex-shrink-0"
                style="background:${hexColor};">${stageName}</span>
        </div>
        ${project.next_action_date ? `
          <p class="text-xs text-gray-400 mt-1">Due ${Utils.formatDateString(project.next_action_date)}</p>` : ''}
      </div>
    `;
  },

  toggleEdit(customerId) {
    const edit = document.getElementById('customerEdit');
    if (edit) edit.classList.toggle('hidden');
  },

  cancelEdit() {
    const edit = document.getElementById('customerEdit');
    if (edit) edit.classList.add('hidden');
  },

  saveCustomer(customerId) {
    const name    = document.getElementById('editCustomerName').value.trim();
    const phone   = document.getElementById('editCustomerPhone').value.trim();
    const address = document.getElementById('editCustomerAddress').value.trim();
    Store.updateCustomer(customerId, { name, phone, address });
    App.navigateTo('customerDetail', customerId);
  },

  deleteCustomer(customerId) {
    if (confirm('Delete this customer? Their jobs will remain but be unlinked.')) {
      Store.deleteCustomer(customerId);
      App.goBack();
    }
  }
};

window.CustomerDetailScreen = CustomerDetailScreen;
