/**
 * MaterialsScreen
 * Master shopping list across all active jobs.
 * Views: By Job / By Supplier / All
 * Shareable with optional job filter.
 */

const MaterialsScreen = {
  _view: 'job',       // 'job' | 'supplier' | 'all'
  _filterJobId: 'all', // job id or 'all'

  render() {
    const stages = Store.getPipelineStages();
    const archiveIndex = stages.length;
    const activeProjects = Store.getProjects().filter(p => p.stageIndex < archiveIndex);
    const allMaterials = Store.getMaterials().filter(m => {
      const proj = Store.getProject(m.projectId);
      return proj && proj.stageIndex < archiveIndex;
    });

    const currency = Store.getCurrencySymbol();
    const totalCost = allMaterials.filter(m => !m.purchased)
      .reduce((s, m) => s + (parseFloat(m.cost) || 0), 0);
    const neededCount = allMaterials.filter(m => !m.purchased).length;
    const purchasedCount = allMaterials.filter(m => m.purchased).length;

    return `
      <div class="max-w-lg mx-auto pb-24">
        <h2 class="screen-header">Shopping List</h2>

        <!-- Summary strip -->
        <div class="mat-summary">
          <div class="mat-summary-item">
            <span class="mat-summary-num">${neededCount}</span>
            <span class="mat-summary-label">Needed</span>
          </div>
          <div class="mat-summary-div"></div>
          <div class="mat-summary-item">
            <span class="mat-summary-num" style="color:#16a34a;">${purchasedCount}</span>
            <span class="mat-summary-label">Purchased</span>
          </div>
          ${totalCost > 0 ? `
            <div class="mat-summary-div"></div>
            <div class="mat-summary-item">
              <span class="mat-summary-num" style="font-size:1rem;color:#007AFF;">${currency}${totalCost.toLocaleString('en-US',{minimumFractionDigits:0,maximumFractionDigits:0})}</span>
              <span class="mat-summary-label">Est. Cost</span>
            </div>
          ` : ''}
        </div>

        <!-- View toggle -->
        <div class="mat-view-toggle">
          <button class="mat-toggle-btn ${this._view === 'job' ? 'active' : ''}"
            onclick="MaterialsScreen.setView('job')">By Job</button>
          <button class="mat-toggle-btn ${this._view === 'supplier' ? 'active' : ''}"
            onclick="MaterialsScreen.setView('supplier')">By Supplier</button>
          <button class="mat-toggle-btn ${this._view === 'all' ? 'active' : ''}"
            onclick="MaterialsScreen.setView('all')">All</button>
        </div>

        <!-- Share row -->
        <div class="mat-share-row">
          <select id="matShareFilter" class="mat-share-select" onchange="MaterialsScreen._filterJobId = this.value">
            <option value="all">All jobs</option>
            ${activeProjects.map(p => `
              <option value="${p.id}">${p.name || 'Unnamed'}${p.note ? ' — ' + p.note : ''}</option>
            `).join('')}
          </select>
          <button onclick="MaterialsScreen.share()" class="mat-share-btn">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/>
            </svg>
            Share
          </button>
        </div>

        <!-- List content -->
        <div id="matMasterList">
          ${this.renderList(allMaterials, activeProjects, currency)}
        </div>

        ${allMaterials.length === 0 ? `
          <div class="empty-state">
            <svg class="w-16 h-16 mx-auto text-gray-200 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
            </svg>
            <p class="text-gray-400 font-medium">No materials yet</p>
            <p class="text-gray-400 text-sm mt-1">Add materials from any project's detail screen</p>
          </div>
        ` : ''}
      </div>
    `;
  },

  renderList(allMaterials, activeProjects, currency) {
    currency = currency || Store.getCurrencySymbol();
    if (allMaterials.length === 0) return '';

    if (this._view === 'job') return this.renderByJob(allMaterials, activeProjects, currency);
    if (this._view === 'supplier') return this.renderBySupplier(allMaterials, currency);
    return this.renderAll(allMaterials, currency);
  },

  renderByJob(materials, projects, currency) {
    const projectMap = {};
    materials.forEach(m => {
      if (!projectMap[m.projectId]) projectMap[m.projectId] = [];
      projectMap[m.projectId].push(m);
    });

    return Object.entries(projectMap).map(([projectId, items]) => {
      const proj = Store.getProject(projectId);
      const label = proj ? (proj.name || 'Unnamed') + (proj.note ? ' — ' + proj.note : '') : 'Unknown Job';
      const hex = proj ? ProjectCard.getStageHexColor(Math.min(proj.stageIndex, Store.getPipelineStages().length - 1)) : '#9ca3af';
      return `
        <div class="mat-group">
          <div class="mat-group-header" style="border-left:3px solid ${hex};">
            <span class="mat-group-label">${label}</span>
            <button class="mat-group-goto" onclick="App.navigateTo('detail','${projectId}')">View Job →</button>
          </div>
          ${items.map(m => this.renderMasterItem(m, currency)).join('')}
        </div>
      `;
    }).join('');
  },

  renderBySupplier(materials, currency) {
    const supplierMap = {};
    materials.forEach(m => {
      const key = m.supplier ? m.supplier : '(No supplier)';
      if (!supplierMap[key]) supplierMap[key] = [];
      supplierMap[key].push(m);
    });

    return Object.entries(supplierMap)
      .sort(([a], [b]) => a === '(No supplier)' ? 1 : b === '(No supplier)' ? -1 : a.localeCompare(b))
      .map(([supplier, items]) => `
        <div class="mat-group">
          <div class="mat-group-header">
            <span class="mat-group-label">📍 ${supplier}</span>
            <span class="mat-group-count">${items.filter(m => !m.purchased).length} needed</span>
          </div>
          ${items.map(m => this.renderMasterItem(m, currency)).join('')}
        </div>
      `).join('');
  },

  renderAll(materials, currency) {
    const needed = materials.filter(m => !m.purchased);
    const purchased = materials.filter(m => m.purchased);
    return `
      ${needed.map(m => this.renderMasterItem(m, currency)).join('')}
      ${purchased.length > 0 ? `
        <div class="mat-purchased-divider">
          <span>Purchased (${purchased.length})</span>
        </div>
        ${purchased.map(m => this.renderMasterItem(m, currency)).join('')}
      ` : ''}
    `;
  },

  renderMasterItem(m, currency) {
    const proj = Store.getProject(m.projectId);
    const projLabel = this._view !== 'job' && proj
      ? `<span class="mat-item-proj">${proj.name || 'Job'}</span>` : '';

    return `
      <div class="mat-item ${m.purchased ? 'mat-purchased' : ''}" id="matmaster-${m.id}">
        <button class="mat-check-btn ${m.purchased ? 'mat-check-done' : ''}"
          onclick="MaterialsScreen.toggle('${m.id}')">
          ${m.purchased
            ? `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/>
               </svg>`
            : ''}
        </button>
        <div class="mat-item-body">
          <span class="mat-item-name">${m.name}</span>
          <div class="mat-item-meta">
            ${m.qty ? `<span>${m.qty}${m.unit ? ' ' + m.unit : ''}</span>` : ''}
            ${m.supplier && this._view !== 'supplier' ? `<span>📍 ${m.supplier}</span>` : ''}
            ${m.cost ? `<span>${currency}${Number(m.cost).toLocaleString()}</span>` : ''}
            ${projLabel}
          </div>
        </div>
      </div>
    `;
  },

  // ---- Actions ----

  setView(view) {
    this._view = view;
    App.navigateTo('materials');
  },

  toggle(materialId) {
    Store.toggleMaterialPurchased(materialId);
    // Re-render just the list section without full navigation
    const stages = Store.getPipelineStages();
    const archiveIndex = stages.length;
    const allMaterials = Store.getMaterials().filter(m => {
      const proj = Store.getProject(m.projectId);
      return proj && proj.stageIndex < archiveIndex;
    });
    const activeProjects = Store.getProjects().filter(p => p.stageIndex < archiveIndex);
    const currency = Store.getCurrencySymbol();
    const listEl = document.getElementById('matMasterList');
    if (listEl) listEl.innerHTML = this.renderList(allMaterials, activeProjects, currency);
    // Update summary
    App.navigateTo('materials');
  },

  share() {
    const filterJobId = document.getElementById('matShareFilter')?.value || 'all';
    const stages = Store.getPipelineStages();
    const archiveIndex = stages.length;
    const currency = Store.getCurrencySymbol();

    let materials = Store.getMaterials().filter(m => {
      const proj = Store.getProject(m.projectId);
      return proj && proj.stageIndex < archiveIndex;
    });

    if (filterJobId !== 'all') {
      materials = materials.filter(m => m.projectId === filterJobId);
    }

    if (materials.length === 0) {
      alert('No materials to share.');
      return;
    }

    // Group by job for the share text
    const byJob = {};
    materials.forEach(m => {
      if (!byJob[m.projectId]) byJob[m.projectId] = [];
      byJob[m.projectId].push(m);
    });

    const lines = ['🛒 MATERIALS LIST', ''];

    Object.entries(byJob).forEach(([projectId, items]) => {
      const proj = Store.getProject(projectId);
      lines.push(`📋 ${proj ? (proj.name || 'Job') + (proj.note ? ' — ' + proj.note : '') : 'Unknown Job'}`);
      items.forEach(m => {
        const purchased = m.purchased ? '✓ ' : '□ ';
        const qty = m.qty ? `${m.qty}${m.unit ? ' ' + m.unit : ''} ` : '';
        const cost = m.cost ? ` (${currency}${Number(m.cost).toLocaleString()})` : '';
        const supplier = m.supplier ? ` — ${m.supplier}` : '';
        lines.push(`  ${purchased}${qty}${m.name}${cost}${supplier}`);
      });
      lines.push('');
    });

    const totalCost = materials.filter(m => !m.purchased)
      .reduce((s, m) => s + (parseFloat(m.cost) || 0), 0);
    if (totalCost > 0) {
      lines.push(`Est. remaining cost: ${currency}${totalCost.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}`);
    }

    const text = lines.join('\n');

    if (navigator.share) {
      navigator.share({ title: 'Materials List', text }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text).then(() => {
        const btn = event?.target?.closest('button');
        if (btn) {
          const orig = btn.innerHTML;
          btn.textContent = '✓ Copied!';
          setTimeout(() => btn.innerHTML = orig, 2000);
        }
      });
    }
  }
};

window.MaterialsScreen = MaterialsScreen;
