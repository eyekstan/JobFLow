/**
 * ProjectDetailScreen
 * Display and edit project details with stage action buttons
 * Includes: value, photos, reminders, correct field labels
 */

const ProjectDetailScreen = {

  getSuggestedAction(stageName) {
    const suggestions = {
      'Lead': 'Follow up with lead', 'Call Back': 'Return customer call',
      'Site Visit': 'Complete site visit', 'Quote': 'Send quote to customer',
      'Schedule': 'Schedule work date', 'Materials': 'Order/confirm materials',
      'Begin Work': 'Start work', 'Invoice': 'Send invoice',
      'Project Complete': 'Collect payment'
    };
    return suggestions[stageName] || `Complete ${stageName}`;
  },

  render(projectId) {
    const project = Store.getProject(projectId);
    const stages = Store.getPipelineStages();
    const currencySymbol = Store.getCurrencySymbol();

    if (!project) {
      return `<div class="empty-state"><p>Project not found</p>
        <button onclick="App.navigateTo('dashboard')" class="text-blue-600 mt-2 font-medium">Go to Dashboard</button>
      </div>`;
    }

    const stageName = Store.getStageName(project.stageIndex);
    const stageHexColor = ProjectCard.getStageHexColor(
      Math.min(project.stageIndex, Store.getPipelineStages().length - 1)
    );
    const isArchived = project.stageIndex >= Store.getPipelineStages().length;

    // Pending reminders for this project
    const reminders = Store.getRemindersForProject(projectId);
    const reminderBadge = reminders.length > 0
      ? `<span class="reminder-badge">🔔 ${reminders.length} reminder${reminders.length > 1 ? 's' : ''}</span>`
      : '';

    // Schedule async photo load after render
    setTimeout(() => ProjectDetailScreen.loadPhotos(projectId), 50);

    return `
      <div class="max-w-lg mx-auto pb-20">
        <!-- Back Button -->
        <button id="backBtn" class="back-btn">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
          </svg>
          Back
        </button>

        <!-- Header: Contact Name + Pipeline Strip -->
        <div class="project-detail-card" style="border-left: 4px solid ${stageHexColor};">
          <div class="mb-4">
            ${project.customerId ? `
              <button onclick="App.navigateTo('customerDetail', '${project.customerId}')"
                class="text-2xl font-bold text-gray-900 hover:text-blue-600 text-left block w-full truncate">
                ${project.name || 'Unnamed Contact'}
              </button>
            ` : `
              <h1 class="text-2xl font-bold text-gray-900 truncate">${project.name || 'Unnamed Contact'}</h1>
            `}
            <p class="text-gray-500 text-sm mt-0.5">${project.note || 'No project description'}</p>
            ${reminderBadge}
          </div>
          <div style="border-top:1px solid #f3f4f6; margin-bottom:14px;"></div>
          ${ProjectCard.renderPipelineStrip(projectId, project.stageIndex, false, isArchived)}
        </div>

        <!-- Job Value -->
        <div class="project-detail-card">
          <div class="flex items-center justify-between mb-3">
            <h3 class="section-label">Job Value</h3>
          </div>
          <div class="relative">
            <span class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold text-lg">${currencySymbol}</span>
            <input
              type="number"
              id="edit_value"
              class="form-input"
              style="padding-left: 2.25rem; font-size: 1.25rem; font-weight: 600; color: #059669;"
              value="${project.value || ''}"
              placeholder="0"
              min="0"
              step="0.01"
              oninput="clearTimeout(window.valueSaveTimer); window.valueSaveTimer=setTimeout(()=>Store.updateProject('${projectId}',{value:parseFloat(document.getElementById('edit_value').value)||0}),600)"
            >
          </div>
        </div>

        <!-- Contact Info -->
        <div class="project-detail-card space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="section-label">Contact</h3>
            <button onclick="ProjectDetailScreen.toggleContactEdit('${projectId}')" class="text-blue-600 text-sm font-medium">Edit</button>
          </div>

          <div id="contactDisplay">
            ${project.phone ? `
              <div class="flex items-center gap-3">
                <svg class="w-5 h-5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                </svg>
                <a href="tel:${project.phone}" class="phone-link flex-1">${project.phone}</a>
                <a href="tel:${project.phone}" class="p-2 text-green-600 hover:bg-green-50 rounded-full">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                </a>
                <a href="sms:${project.phone}" class="p-2 text-blue-600 hover:bg-blue-50 rounded-full">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
                </a>
              </div>
            ` : ''}
            ${project.address ? `
              <div class="flex items-start gap-3 mt-3">
                <svg class="w-5 h-5 text-gray-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
                <a href="https://maps.google.com/?q=${encodeURIComponent(project.address)}" target="_blank" class="text-gray-700 flex-1">${project.address}</a>
                <a href="https://maps.google.com/?q=${encodeURIComponent(project.address)}" target="_blank" class="p-2 text-red-600 hover:bg-red-50 rounded-full" title="Navigate">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/></svg>
                </a>
              </div>
            ` : ''}
            ${!project.phone && !project.address ? `<p class="text-gray-400 text-sm">No contact info</p>` : ''}
          </div>

          <div id="contactEdit" class="hidden space-y-3">
            <input type="tel" id="edit_phone" class="form-input" value="${project.phone || ''}" placeholder="Phone number" autocomplete="tel">
            <input type="text" id="edit_address" class="form-input" value="${project.address || ''}" placeholder="Address" autocomplete="street-address">
            <div class="flex gap-2">
              <button onclick="ProjectDetailScreen.saveContact('${projectId}')" class="action-btn action-btn-primary flex-1">Save</button>
              <button onclick="ProjectDetailScreen.cancelContactEdit()" class="action-btn flex-1 bg-gray-100 text-gray-600">Cancel</button>
            </div>
          </div>
        </div>

        <!-- Project Description -->
        <div class="project-detail-card">
          <h3 class="section-label mb-2">Project</h3>
          <textarea
            id="edit_note"
            class="form-input"
            rows="2"
            placeholder="Describe the project..."
            oninput="clearTimeout(window.noteSaveTimer); window.noteSaveTimer=setTimeout(()=>Store.updateProject('${projectId}',{note:document.getElementById('edit_note').value}),500)"
          >${project.note || ''}</textarea>
        </div>

        <!-- Notes -->
        <div class="project-detail-card">
          <h3 class="section-label mb-2">Notes</h3>
          <textarea
            id="edit_notes"
            class="form-input"
            rows="4"
            placeholder="Additional notes..."
            oninput="clearTimeout(window.notesSaveTimer); window.notesSaveTimer=setTimeout(()=>Store.updateProject('${projectId}',{notes:document.getElementById('edit_notes').value}),500)"
          >${project.notes || ''}</textarea>
        </div>

        <!-- Stage Due Dates -->
        <div class="project-detail-card">
          <div class="flex items-center justify-between mb-3">
            <h3 class="section-label">Stage Due Dates</h3>
            <button onclick="ProjectDetailScreen.syncAllToCalendar('${projectId}')"
              class="text-blue-600 text-xs font-semibold flex items-center gap-1">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
              Sync All to Calendar
            </button>
          </div>
          <div class="stage-dates-list">
            ${Store.getPipelineStages().map((stage, i) => {
              const stageDates = project.stageDates || {};
              const val = stageDates[i] || (i === project.stageIndex ? (project.next_action_date || '') : '');
              const hex = ProjectCard.getStageHexColor(i);
              const isActive = i === project.stageIndex;
              return `
                <div class="stage-date-row ${isActive ? 'stage-date-row-active' : ''}">
                  <div class="stage-date-label">
                    <span class="stage-date-dot" style="background:${hex};"></span>
                    <span class="${isActive ? 'font-semibold text-gray-900' : 'text-gray-500'}">${stage}</span>
                    ${isActive ? '<span class="stage-date-current-badge">current</span>' : ''}
                  </div>
                  <div class="flex items-center gap-2">
                    <input type="date" class="stage-date-input"
                      value="${val}"
                      onchange="ProjectDetailScreen.saveStageDate('${projectId}', ${i}, this.value)">
                    ${val ? `
                      <button onclick="ProjectDetailScreen.openStageDateCalendar('${projectId}', ${i})"
                        class="stage-date-cal-btn" title="Add to Google Calendar">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                        </svg>
                      </button>
                    ` : ''}
                  </div>
                </div>`;
            }).join('')}
          </div>
        </div>

        <!-- Photos -->
        <div class="project-detail-card">
          <div class="flex items-center justify-between mb-3">
            <h3 class="section-label">Photos</h3>
            <label class="photo-add-btn cursor-pointer">
              <svg class="w-5 h-5 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
              Add Photo
              <input type="file" accept="image/*" multiple class="hidden"
                onchange="ProjectDetailScreen.handlePhotoUpload('${projectId}', this)">
            </label>
          </div>
          <div id="photoGallery" class="photo-gallery">
            <p class="text-gray-400 text-sm text-center py-4 col-span-3">Loading photos...</p>
          </div>
        </div>

        <!-- Reminder -->
        <div class="project-detail-card">
          <div class="flex items-center justify-between mb-3">
            <h3 class="section-label">🔔 Reminder</h3>
            ${reminders.length > 0 ? `
              <button onclick="ProjectDetailScreen.clearReminders('${projectId}')"
                class="text-red-500 text-sm font-medium">Clear all</button>
            ` : ''}
          </div>
          ${reminders.length > 0 ? `
            <div class="space-y-2 mb-3">
              ${reminders.map(r => `
                <div class="flex items-center justify-between bg-orange-50 rounded-lg px-3 py-2">
                  <span class="text-sm text-orange-800 font-medium">
                    ${new Date(r.datetime).toLocaleString('en-US', {month:'short',day:'numeric',hour:'numeric',minute:'2-digit'})}
                  </span>
                  <button onclick="Store.removeReminder('${r.id}'); App.navigateTo('detail','${projectId}')"
                    class="text-orange-400 hover:text-red-500 ml-2">✕</button>
                </div>
              `).join('')}
            </div>
          ` : ''}
          <div id="reminderForm" class="space-y-2">
            <input type="datetime-local" id="reminderDatetime" class="form-input"
              min="${new Date(Date.now() + 60000).toISOString().slice(0,16)}">
            <button onclick="ProjectDetailScreen.setReminder('${projectId}')"
              class="action-btn action-btn-primary w-full">
              Set Reminder
            </button>
            <p class="text-xs text-gray-400 text-center">Reminder fires when the app is open</p>
          </div>
        </div>

        <!-- Estimate (remove this block to disable feature) -->
        <button onclick="App.navigateTo('estimate', '${projectId}')"
          class="action-btn w-full mb-3" style="background:#f0fdf4;color:#15803d;border:1.5px solid #bbf7d0;">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 11h.01M12 11h.01M15 11h.01M4 19h16a2 2 0 002-2V7a2 2 0 00-2-2H4a2 2 0 00-2 2v10a2 2 0 002 2z"/>
          </svg>
          Build Estimate
        </button>
        <!-- End Estimate -->

        <!-- Share -->
        <button id="shareBtn" onclick="ProjectDetailScreen.shareProject('${projectId}')"
          class="action-btn action-btn-outline w-full mb-3">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/>
          </svg>
          Share Job
        </button>

        <!-- Archive and Delete -->
        <div class="flex gap-3 mt-2">
          <button onclick="ProjectDetailScreen.archiveProject('${projectId}')"
            class="action-btn flex-1 bg-purple-100 text-purple-700 border-2 border-purple-300">
            Archive
          </button>
          <button onclick="ProjectDetailScreen.deleteProject('${projectId}')"
            class="action-btn flex-1 text-red-500 border-2 border-red-300">
            Delete
          </button>
        </div>
      </div>
    `;
  },

  // ---- Photos ----

  async loadPhotos(projectId) {
    const gallery = document.getElementById('photoGallery');
    if (!gallery) return;
    try {
      const photos = await PhotoDB.getPhotos(projectId);
      if (photos.length === 0) {
        gallery.innerHTML = '<p class="text-gray-400 text-sm text-center py-4 col-span-3">No photos yet — tap Add Photo to start</p>';
      } else {
        gallery.innerHTML = photos.map(photo => `
          <div class="photo-thumb-wrapper">
            <img src="${photo.dataUrl}" class="photo-thumb" onclick="ProjectDetailScreen.viewPhoto('${photo.dataUrl}')">
            <button class="photo-delete-btn" onclick="ProjectDetailScreen.deletePhoto('${photo.id}', '${projectId}')">✕</button>
          </div>
        `).join('');
      }
    } catch (e) {
      gallery.innerHTML = '<p class="text-red-400 text-sm text-center py-4 col-span-3">Could not load photos.</p>';
    }
  },

  async handlePhotoUpload(projectId, input) {
    const files = Array.from(input.files);
    if (!files.length) return;

    const gallery = document.getElementById('photoGallery');
    if (gallery) gallery.innerHTML = '<p class="text-blue-400 text-sm text-center py-4 col-span-3">Saving photos...</p>';

    for (const file of files) {
      try {
        const dataUrl = await PhotoDB.fileToDataUrl(file);
        await PhotoDB.addPhoto(projectId, dataUrl, file.name);
      } catch (e) {
        console.error('Photo upload error:', e);
      }
    }
    await this.loadPhotos(projectId);
    input.value = '';
  },

  async deletePhoto(photoId, projectId) {
    if (!confirm('Delete this photo?')) return;
    await PhotoDB.deletePhoto(photoId);
    this.loadPhotos(projectId);
  },

  viewPhoto(dataUrl) {
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.92);z-index:9999;display:flex;align-items:center;justify-content:center;';
    overlay.innerHTML = `
      <img src="${dataUrl}" style="max-width:95vw;max-height:90vh;border-radius:12px;object-fit:contain;">
      <button onclick="this.parentElement.remove()" style="position:absolute;top:16px;right:16px;color:white;font-size:2rem;background:none;border:none;cursor:pointer;">✕</button>
    `;
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
    document.body.appendChild(overlay);
  },

  // ---- Reminders ----

  async setReminder(projectId) {
    const input = document.getElementById('reminderDatetime');
    if (!input || !input.value) {
      alert('Please pick a date and time for the reminder.');
      return;
    }

    const project = Store.getProject(projectId);
    const message = project ? `Reminder: ${project.note || project.name || 'Job follow-up'}` : 'JobFlow Reminder';

    const granted = await Notifications.requestPermission();
    if (!granted) {
      alert('Please allow notifications in your browser settings to use reminders.');
      return;
    }

    Store.addReminder(projectId, input.value, message);
    App.navigateTo('detail', projectId);
  },

  clearReminders(projectId) {
    const reminders = Store.getRemindersForProject(projectId);
    reminders.forEach(r => Store.removeReminder(r.id));
    App.navigateTo('detail', projectId);
  },

  // ---- Date / Stage ----

  saveStageDate(projectId, stageIndex, dateValue) {
    const project = Store.getProject(projectId);
    if (!project) return;
    const stageDates = { ...(project.stageDates || {}) };
    stageDates[stageIndex] = dateValue;
    // Keep legacy next_action_date in sync with current stage date
    const updates = { stageDates };
    if (stageIndex === project.stageIndex) updates.next_action_date = dateValue;
    Store.updateProject(projectId, updates);
    App.navigateTo('detail', projectId);
  },

  openStageDateCalendar(projectId, stageIndex) {
    const project = Store.getProject(projectId);
    if (!project) return;
    const stageDates = project.stageDates || {};
    const dateStr = stageDates[stageIndex] || project.next_action_date;
    if (!dateStr) return;
    const stages = Store.getPipelineStages();
    const stageName = stages[stageIndex] || 'Stage';
    const title = encodeURIComponent(`${project.note || project.name || 'Job'} — ${stageName}`);
    const d = dateStr.replace(/-/g, '');
    const url = `https://www.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${d}/${d}`;
    window.open(url, '_blank');
  },

  syncAllToCalendar(projectId) {
    const project = Store.getProject(projectId);
    if (!project) return;
    const stages = Store.getPipelineStages();
    const stageDates = project.stageDates || {};
    const hasDates = Object.values(stageDates).some(d => !!d);
    if (!hasDates) { alert('No stage dates set yet. Add dates to stages first.'); return; }

    // Open each dated stage in Google Calendar sequentially
    let opened = 0;
    stages.forEach((stage, i) => {
      const dateStr = stageDates[i];
      if (!dateStr) return;
      setTimeout(() => {
        const title = encodeURIComponent(`${project.note || project.name || 'Job'} — ${stage}`);
        const d = dateStr.replace(/-/g, '');
        window.open(`https://www.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${d}/${d}`, '_blank');
      }, opened * 600);
      opened++;
    });
  },

  // Legacy compat - keep for any remaining callers
  saveDate(projectId, dateValue) {
    Store.updateProject(projectId, { next_action_date: dateValue });
    App.navigateTo('detail', projectId);
  },

  openCalendar(projectId) {
    const project = Store.getProject(projectId);
    if (!project || !project.next_action_date) return;
    const title = encodeURIComponent(project.note || project.name || 'Project Due');
    const d = project.next_action_date.replace(/-/g, '');
    window.open(`https://www.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${d}/${d}`, '_blank');
  },

  handleSubmit(projectId) { /* auto-save */ },

  moveStage(projectId, direction) {
    const project = Store.getProject(projectId);
    if (!project) return;
    const allStages = Store.getAllStages();
    const newIndex = project.stageIndex + direction;
    if (newIndex >= 0 && newIndex < allStages.length) {
      Store.updateProject(projectId, { stageIndex: newIndex });
      App.navigateTo('detail', projectId);
    }
  },

  archiveProject(projectId) {
    // Show Won/Lost modal instead of plain confirm
    const existing = document.getElementById('wonLostModal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'wonLostModal';
    modal.className = 'won-lost-modal-overlay';
    modal.innerHTML = `
      <div class="won-lost-modal">
        <h3 class="won-lost-modal-title">How did this job end?</h3>
        <p class="won-lost-modal-body">This helps track your win rate over time.</p>
        <div class="won-lost-modal-actions">
          <button class="won-lost-modal-btn won" onclick="ProjectDetailScreen.confirmArchive('${projectId}', 'won')">
            🏆 Won
          </button>
          <button class="won-lost-modal-btn lost" onclick="ProjectDetailScreen.confirmArchive('${projectId}', 'lost')">
            ✕ Lost
          </button>
        </div>
        <button class="won-lost-modal-cancel" onclick="document.getElementById('wonLostModal').remove()">Cancel</button>
      </div>
    `;
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add('visible'), 20);
  },

  confirmArchive(projectId, outcome) {
    const modal = document.getElementById('wonLostModal');
    if (modal) modal.remove();
    const stages = Store.getPipelineStages();
    Store.updateProject(projectId, { stageIndex: stages.length, outcome });
    App.navigateTo('archive');
  },

  shareProject(projectId) {
    const project = Store.getProject(projectId);
    if (!project) return;
    const currency = Store.getCurrencySymbol();
    const lines = [
      `📋 ${project.note || 'Job Details'}`,
      `👤 ${project.name || ''}`,
      project.phone   ? `📞 ${project.phone}`   : null,
      project.address ? `📍 ${project.address}` : null,
      project.value   ? `💰 ${currency}${Number(project.value).toLocaleString()}` : null,
      project.notes   ? `\nNotes: ${project.notes}` : null,
    ].filter(Boolean).join('\n');

    if (navigator.share) {
      navigator.share({ title: project.note || 'Job Details', text: lines })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(lines).then(() => {
        const btn = document.getElementById('shareBtn');
        if (btn) { btn.textContent = '✓ Copied!'; setTimeout(() => btn.textContent = 'Share Job', 2000); }
      });
    }
  },

  deleteProject(projectId) {
    if (confirm('Delete this project? This cannot be undone.')) {
      Store.deleteProject(projectId);
      App.navigateTo('dashboard');
    }
  },

  toggleContactEdit(projectId) {
    const display = document.getElementById('contactDisplay');
    const edit = document.getElementById('contactEdit');
    if (display.classList.contains('hidden')) {
      display.classList.remove('hidden');
      edit.classList.add('hidden');
    } else {
      const project = Store.getProject(projectId);
      document.getElementById('edit_phone').value = project.phone || '';
      document.getElementById('edit_address').value = project.address || '';
      display.classList.add('hidden');
      edit.classList.remove('hidden');
    }
  },

  saveContact(projectId) {
    const phone = document.getElementById('edit_phone').value.trim();
    const address = document.getElementById('edit_address').value.trim();
    Store.updateProject(projectId, { phone, address });
    App.navigateTo('detail', projectId);
  },

  cancelContactEdit() {
    document.getElementById('contactDisplay').classList.remove('hidden');
    document.getElementById('contactEdit').classList.add('hidden');
  }
};

window.ProjectDetailScreen = ProjectDetailScreen;
