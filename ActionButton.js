/**
 * ProjectCard Component
 * Reusable card for displaying project summary
 */

const ProjectCard = {

  // Hex color palette for gradient red → green
  HEX_COLORS: [
    '#dc2626','#ef4444','#f97316','#ea580c',
    '#f59e0b','#d97706','#eab308','#84cc16',
    '#65a30d','#22c55e','#16a34a'
  ],

  getStageHexColor(index) {
    const total = Store.getPipelineStages().length;
    if (total <= 1) return this.HEX_COLORS[0];
    const i = Math.round((index / (total - 1)) * (this.HEX_COLORS.length - 1));
    return this.HEX_COLORS[Math.min(i, this.HEX_COLORS.length - 1)];
  },

  // Keep for any legacy callers (SettingsScreen dot)
  getStageClass(index) {
    const hex = this.getStageHexColor(index);
    // Return a tailwind-compatible inline style fallback token
    return 'stage-colored-badge';
  },

  // Keep for legacy callers in ProjectDetailScreen stage buttons (now unused but safe)
  getButtonColorClass(index) { return ''; },

  /**
   * Render the unified pipeline strip component
   * Replaces both the old badge and the old prev/next buttons.
   *
   * @param {string} projectId
   * @param {number} currentIndex  - project.stageIndex
   * @param {boolean} compact      - true for dashboard cards, false for detail
   * @param {boolean} isArchived
   */
  renderPipelineStrip(projectId, currentIndex, compact = true, isArchived = false) {
    const editableStages = Store.getPipelineStages();
    const allStages = Store.getAllStages(); // includes Archive
    const total = editableStages.length;

    if (isArchived) {
      return `
        <div class="pipeline-strip-archived">
          <span class="pipeline-archived-label">Archived</span>
        </div>`;
    }

    // Clamp to editable range for the strip; archive is handled above
    const displayIndex = Math.min(currentIndex, total - 1);
    const color = this.getStageHexColor(displayIndex);
    const canBack = currentIndex > 0;
    const canFwd  = currentIndex < allStages.length - 1;
    const prevLabel = canBack ? allStages[currentIndex - 1] : '';
    const nextLabel = canFwd  ? allStages[currentIndex + 1] : '';

    // Build segment dots
    let segments = '';
    for (let i = 0; i < total; i++) {
      const isPast   = i < displayIndex;
      const isActive = i === displayIndex;
      const segColor = (isPast || isActive) ? this.getStageHexColor(i) : '#e5e7eb';
      const activeStyle = isActive
        ? `flex:2.5; height:10px; box-shadow:0 0 0 3px ${color}30; margin-top:0;`
        : `flex:1; height:6px; margin-top:2px;`;
      segments += `
        <div
          onclick="event.stopPropagation(); ProjectCard.jumpStage('${projectId}', ${i})"
          title="${editableStages[i]}"
          style="background:${segColor}; border-radius:99px; cursor:pointer;
                 transition:all 0.25s cubic-bezier(0.4,0,0.2,1); ${activeStyle}">
        </div>`;
    }

    const moveHandler = compact ? 'DashboardScreen.moveStage' : 'ProjectDetailScreen.moveStage';

    return `
      <div class="pipeline-strip" onclick="event.stopPropagation()">
        <!-- Meta row -->
        <div class="pipeline-strip-meta">
          <span class="pipeline-strip-label">Pipeline Stage</span>
          <span class="pipeline-strip-label">${displayIndex + 1} of ${total}</span>
        </div>

        <!-- Segments -->
        <div class="pipeline-strip-segments">${segments}</div>

        <!-- Controls: ← [Stage Pill] → -->
        <div class="pipeline-strip-controls">
          <button
            class="pipeline-arrow-btn"
            onclick="event.stopPropagation(); ${moveHandler}('${projectId}', -1${compact ? ', event' : ''})"
            ${!canBack ? 'disabled' : ''}>
            ←
          </button>
          <div class="pipeline-stage-pill"
               style="background:${color}; box-shadow:0 3px 12px ${color}44;">
            <span>${editableStages[displayIndex]}</span>
          </div>
          <button
            class="pipeline-arrow-btn"
            onclick="event.stopPropagation(); ${moveHandler}('${projectId}', 1${compact ? ', event' : ''})"
            ${!canFwd ? 'disabled' : ''}>
            →
          </button>
        </div>

        <!-- Neighbour labels -->
        <div class="pipeline-strip-neighbours">
          <span>${prevLabel}</span>
          <span>${nextLabel}</span>
        </div>
      </div>
    `;
  },

  /**
   * Jump a project directly to a stage index (called from segment tap)
   */
  jumpStage(projectId, stageIndex) {
    const project = Store.getProject(projectId);
    if (!project || stageIndex === project.stageIndex) return;
    if (stageIndex > project.stageIndex) Store.trackCompletion();
    Store.updateProject(projectId, { stageIndex });
    // Re-render whichever screen is active
    App.renderScreen();
  },

  /**
   * Render a single project card
   */
  render(project, isTodayAction = false) {
    const todayActionClass = isTodayAction ? 'today-action' : '';
    const editableStages = Store.getPipelineStages();
    const archiveIndex = editableStages.length;
    const isArchived = project.stageIndex >= archiveIndex;
    const stageHexColor = this.getStageHexColor(Math.min(project.stageIndex, editableStages.length - 1));
    const currencySymbol = Store.getCurrencySymbol();

    const valueDisplay = project.value ? `
      <span class="card-value-badge">
        ${currencySymbol}${Number(project.value).toLocaleString()}
      </span>` : '';

    let dateDisplay = '';
    if (project.next_action_date) {
      const isOverdue = Utils.isOverdue(project.next_action_date);
      const isToday   = Utils.isToday(project.next_action_date);
      const dateClass = isOverdue ? 'text-red-600 font-medium' : isToday ? 'text-orange-500 font-medium' : 'text-gray-500';
      dateDisplay = `
        <div class="flex items-center gap-1.5 mt-1.5 ${dateClass}">
          <svg class="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
          </svg>
          <span class="text-xs">${Utils.formatDateString(project.next_action_date)}</span>
          ${isOverdue ? '<span class="text-xs">(Overdue)</span>' : ''}
          ${isToday   ? '<span class="text-xs">(Today)</span>'   : ''}
        </div>`;
    }

    return `
      <div class="project-card-wrapper" data-project-id="${project.id}">
        <div class="project-card no-select ${todayActionClass}"
             data-project-id="${project.id}"
             style="border-left-color:${stageHexColor};">

          <!-- Top: name / description / value / date -->
          <div class="flex items-start justify-between mb-3">
            <div class="flex-1 min-w-0 pr-2">
              <h3 class="font-semibold text-gray-900 truncate">${project.name || 'Unnamed Project'}</h3>
              <p class="text-gray-500 mt-0.5 text-sm line-clamp-2">${project.note || ''}</p>
              ${valueDisplay}
              ${dateDisplay}
            </div>
          </div>

          <!-- Divider -->
          <div style="border-top:1px solid #f3f4f6; margin-bottom:12px;"></div>

          <!-- Pipeline Strip -->
          ${this.renderPipelineStrip(project.id, project.stageIndex, true, isArchived)}
        </div>
      </div>`;
  },

  renderList(projects, highlightToday = false) {
    if (!projects || projects.length === 0) {
      return '<div class="empty-state">No projects yet</div>';
    }
    return projects.map(project => {
      const isTodayAction = highlightToday && (
        Utils.isToday(project.next_action_date) ||
        Utils.isOverdue(project.next_action_date)
      );
      return this.render(project, isTodayAction);
    }).join('');
  }
};

window.ProjectCard = ProjectCard;
