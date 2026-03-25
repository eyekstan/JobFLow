/**
 * ArchiveScreen
 * Display archived projects with Won/Lost badges
 */

const ArchiveScreen = {
  render() {
    const allProjects = Store.getProjects();
    const archiveIndex = Store.getPipelineStages().length;
    const archivedProjects = allProjects.filter(p => p.stageIndex === archiveIndex);
    const wonProjects  = archivedProjects.filter(p => p.outcome === 'won');
    const lostProjects = archivedProjects.filter(p => p.outcome === 'lost');
    const otherProjects = archivedProjects.filter(p => !p.outcome);
    const currency = Store.getCurrencySymbol();
    const wonValue = wonProjects.reduce((s, p) => s + (parseFloat(p.value) || 0), 0);

    return `
      <div class="max-w-lg mx-auto pb-20">
        <h2 class="screen-header">Archive</h2>

        ${archivedProjects.length > 0 ? `
          <!-- Summary strip -->
          ${(wonProjects.length + lostProjects.length) > 0 ? `
            <div class="archive-summary">
              <div class="archive-summary-item">
                <span class="archive-summary-num won">${wonProjects.length}</span>
                <span class="archive-summary-label">Won</span>
              </div>
              <div class="archive-summary-divider"></div>
              <div class="archive-summary-item">
                <span class="archive-summary-num lost">${lostProjects.length}</span>
                <span class="archive-summary-label">Lost</span>
              </div>
              ${wonValue > 0 ? `
                <div class="archive-summary-divider"></div>
                <div class="archive-summary-item">
                  <span class="archive-summary-num value">${currency}${wonValue.toLocaleString()}</span>
                  <span class="archive-summary-label">Won Value</span>
                </div>
              ` : ''}
            </div>
          ` : ''}

          <div class="space-y-3">
            ${archivedProjects.map(p => this.renderArchivedCard(p, currency)).join('')}
          </div>
        ` : `
          <div class="empty-state">
            <svg class="w-20 h-20 mx-auto text-gray-200 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"/>
            </svg>
            <p class="text-lg font-semibold text-gray-400">No archived jobs yet</p>
            <p class="text-sm text-gray-400 mt-1">Archive jobs from the project detail screen</p>
          </div>
        `}
      </div>
    `;
  },

  renderArchivedCard(project, currency) {
    const outcomeLabel = project.outcome === 'won'
      ? `<span class="outcome-badge won">🏆 Won</span>`
      : project.outcome === 'lost'
        ? `<span class="outcome-badge lost">✕ Lost</span>`
        : `<span class="outcome-badge other">Archived</span>`;

    return `
      <div class="project-card" onclick="App.navigateTo('detail', '${project.id}')">
        <div class="flex items-start justify-between mb-3">
          <div class="flex-1 min-w-0 pr-2">
            <h3 class="font-semibold text-gray-900 truncate">${project.name || 'Unnamed Project'}</h3>
            <p class="text-gray-500 text-sm mt-0.5">${project.note || ''}</p>
            ${project.value ? `<span class="card-value-badge">${currency}${Number(project.value).toLocaleString()}</span>` : ''}
          </div>
          ${outcomeLabel}
        </div>
        <div style="border-top:1px solid #f3f4f6;padding-top:10px;">
          <button
            class="action-btn bg-blue-50 text-blue-600 border border-blue-200"
            style="height:38px;font-size:13px;"
            onclick="event.stopPropagation(); ArchiveScreen.restoreProject('${project.id}')">
            ← Restore to Pipeline
          </button>
        </div>
      </div>
    `;
  },

  restoreProject(projectId) {
    const stages = Store.getPipelineStages();

    // Build modal with stage options
    const existing = document.getElementById('restoreModal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'restoreModal';
    modal.className = 'won-lost-modal-overlay';
    modal.innerHTML = `
      <div class="won-lost-modal">
        <h3 class="won-lost-modal-title">Restore to which stage?</h3>
        <p class="won-lost-modal-body">Pick where this job should re-enter the pipeline.</p>
        <div class="restore-stage-list">
          ${stages.map((stage, i) => `
            <button
              class="restore-stage-btn"
              style="border-left: 4px solid ${ProjectCard.getStageHexColor(i)};"
              onclick="ArchiveScreen.confirmRestore('${projectId}', ${i})">
              <span class="restore-stage-num">${i + 1}</span>
              ${stage}
            </button>
          `).join('')}
        </div>
        <button class="won-lost-modal-cancel" onclick="document.getElementById('restoreModal').remove()">Cancel</button>
      </div>
    `;
    modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add('visible'), 20);
  },

  confirmRestore(projectId, stageIndex) {
    const modal = document.getElementById('restoreModal');
    if (modal) modal.remove();
    Store.updateProject(projectId, { stageIndex, outcome: null });
    App.navigateTo('archive');
  },
};

window.ArchiveScreen = ArchiveScreen;
