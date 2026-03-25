/**
 * SettingsScreen
 * Pipeline stages, currency, backup & restore
 */

const SettingsScreen = {
  render() {
    const stages = Store.getPipelineStages();
    const settings = Store.getSettings();
    const currencies = [
      { symbol: '$', label: 'USD – $' },
      { symbol: '€', label: 'EUR – €' },
      { symbol: '£', label: 'GBP – £' },
      { symbol: '¥', label: 'JPY – ¥' },
      { symbol: 'A$', label: 'AUD – A$' },
      { symbol: 'C$', label: 'CAD – C$' },
      { symbol: 'Fr', label: 'CHF – Fr' },
    ];

    return `
      <div class="max-w-lg mx-auto pb-20">
        <h2 class="screen-header">Settings</h2>

        <!-- Currency -->
        <div class="project-detail-card mb-6">
          <h3 class="text-base font-semibold text-gray-800 mb-3">Currency</h3>
          <div class="grid grid-cols-4 gap-2">
            ${currencies.map(c => `
              <button
                onclick="SettingsScreen.setCurrency('${c.symbol}')"
                class="currency-btn ${settings.currencySymbol === c.symbol ? 'currency-btn-active' : ''}"
              >${c.label}</button>
            `).join('')}
          </div>
        </div>

        <!-- Labor Rate (used by AI estimates) -->
        <div class="project-detail-card mb-6">
          <h3 class="text-base font-semibold text-gray-800 mb-1">Your Labor Rate</h3>
          <p class="text-sm text-gray-500 mb-3">Used by AI to generate more accurate estimates.</p>
          <div class="relative">
            <span class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">${settings.currencySymbol || '$'}</span>
            <input
              type="number"
              class="form-input"
              style="padding-left:2rem;"
              placeholder="e.g. 75"
              value="${settings.laborRate || ''}"
              onchange="Store.saveSettings({laborRate: parseFloat(this.value) || 0})"
            >
            <span class="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">/hr</span>
          </div>
        </div>
        <div class="project-detail-card mb-6">
          <h3 class="text-base font-semibold text-gray-800 mb-1">Backup & Restore</h3>
          <p class="text-sm text-gray-500 mb-4">Export all your data to a JSON file, or restore from a previous backup.</p>
          <div class="space-y-3">
            <button onclick="SettingsScreen.exportBackup()" class="action-btn action-btn-primary">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
              </svg>
              Export Backup (JSON)
            </button>
            <label class="action-btn cursor-pointer" style="background:#f5f7fa;color:#374151;border:1.5px solid #e4e8ef;">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
              </svg>
              Restore from Backup
              <input type="file" accept=".json" class="hidden" onchange="SettingsScreen.importBackup(this)">
            </label>
            <p class="text-xs text-gray-400 text-center">⚠️ Restoring will overwrite all current data</p>
          </div>
        </div>

        <!-- Pipeline Stages -->
        <div class="project-detail-card mb-4">
          <h3 class="text-base font-semibold text-gray-800 mb-1">Pipeline Stages</h3>
          <p class="text-sm text-gray-500 mb-4">Add, reorder, or remove stages</p>

          <form id="addStageForm" class="flex gap-2 items-center mb-4">
            <input type="text" id="newStageName" class="form-input flex-1" placeholder="New stage name..." required>
            <button type="submit" class="action-btn action-btn-primary" style="width:52px;flex-shrink:0;">+</button>
          </form>

          <div id="stagesList" class="space-y-2">
            ${stages.map((stage, index) => this.renderStageItem(stage, index)).join('')}
          </div>
        </div>
      </div>
    `;
  },

  renderStageItem(stage, index) {
    const stages = Store.getPipelineStages();
    const isFirst = index === 0;
    const isLast = index === stages.length - 1;
    const stageHex = ProjectCard.getStageHexColor(index);

    return `
      <div class="flex items-center bg-gray-50 rounded-xl px-3 py-3 gap-2 border border-gray-100" data-index="${index}">
        <div class="flex flex-col gap-0.5 mr-1">
          ${!isFirst ? `
            <button class="text-gray-300 hover:text-gray-600" onclick="SettingsScreen.moveStage(${index}, -1)">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 15l7-7 7 7"/></svg>
            </button>
          ` : '<div class="w-4 h-4"></div>'}
          ${!isLast ? `
            <button class="text-gray-300 hover:text-gray-600" onclick="SettingsScreen.moveStage(${index}, 1)">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 9l-7 7-7-7"/></svg>
            </button>
          ` : '<div class="w-4 h-4"></div>'}
        </div>
        <span style="width:10px;height:10px;border-radius:50%;background:${stageHex};display:inline-block;flex-shrink:0;"></span>
        <span class="flex-1 font-medium text-gray-800">${stage}</span>
        <span class="text-xs text-gray-300 font-medium mr-1">${index + 1}</span>
        <button class="delete-stage-btn p-1.5 text-gray-300 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors" data-index="${index}">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
        </button>
      </div>
    `;
  },

  setCurrency(symbol) {
    Store.saveSettings({ currencySymbol: symbol });
    App.navigateTo('settings');
  },

  async exportBackup() {
    const btn = event.target.closest('button');
    const origText = btn.innerHTML;
    btn.innerHTML = '<span>Preparing backup...</span>';
    btn.disabled = true;

    try {
      const backup = await Store.exportBackup();
      const json = JSON.stringify(backup, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const date = new Date().toISOString().split('T')[0];
      a.href = url;
      a.download = `jobflow-backup-${date}.json`;
      a.click();
      URL.revokeObjectURL(url);

      btn.innerHTML = '✓ Downloaded!';
      setTimeout(() => { btn.innerHTML = origText; btn.disabled = false; }, 2000);
    } catch (e) {
      btn.innerHTML = origText;
      btn.disabled = false;
      alert('Export failed: ' + e.message);
    }
  },

  importBackup(input) {
    const file = input.files[0];
    if (!file) return;

    if (!confirm('Restore from this backup? All current data will be replaced.')) {
      input.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target.result);
        await Store.importBackup(data);
        alert('✓ Backup restored successfully!');
        App.navigateTo('dashboard');
      } catch (err) {
        alert('Restore failed: ' + err.message);
      }
      input.value = '';
    };
    reader.readAsText(file);
  },

  handleAddStage() {
    const input = document.getElementById('newStageName');
    const stageName = input.value.trim();
    if (stageName) {
      Store.addPipelineStage(stageName);
      input.value = '';
      App.navigateTo('settings');
    }
  },

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

  handleDeleteStage(index) {
    if (confirm('Delete this stage? Projects in it will move to the previous stage.')) {
      Store.deletePipelineStage(index);
      App.navigateTo('settings');
    }
  },

  setupDragAndDrop() {
    const list = document.getElementById('stagesList');
    if (!list) return;
    list.querySelectorAll('.delete-stage-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        SettingsScreen.handleDeleteStage(parseInt(btn.dataset.index));
      });
    });
  }
};

window.SettingsScreen = SettingsScreen;
