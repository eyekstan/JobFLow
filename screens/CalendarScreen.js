/**
 * CalendarScreen
 * Month grid + agenda combo view.
 * Shows: stage due dates (blue), reminders (orange), standalone events (purple).
 * Allows adding standalone calendar events linked to jobs.
 */

const CalendarScreen = {
  _year: null,
  _month: null,       // 0-based
  _selectedDate: null,
  _showAddForm: false,

  _init() {
    const now = new Date();
    if (this._year === null) this._year = now.getFullYear();
    if (this._month === null) this._month = now.getMonth();
    if (this._selectedDate === null) this._selectedDate = now.toISOString().split('T')[0];
  },

  render() {
    this._init();
    const activeProjects = Store.getProjects().filter(p =>
      p.stageIndex < Store.getPipelineStages().length
    );

    return `
      <div class="max-w-lg mx-auto pb-24" id="calRoot">
        <!-- Month navigator -->
        ${this.renderMonthNav()}

        <!-- Month grid -->
        ${this.renderGrid()}

        <!-- Agenda for selected day -->
        ${this.renderAgenda()}

        <!-- Add event form / button -->
        ${this.renderAddSection(activeProjects)}
      </div>
    `;
  },

  // ─── Month Navigator ─────────────────────────────────────
  renderMonthNav() {
    const monthNames = ['January','February','March','April','May','June',
                        'July','August','September','October','November','December'];
    return `
      <div class="cal-month-nav">
        <button class="cal-nav-btn" onclick="CalendarScreen.prevMonth()">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
          </svg>
        </button>
        <div class="cal-month-label">
          <span class="cal-month-name">${monthNames[this._month]}</span>
          <span class="cal-month-year">${this._year}</span>
        </div>
        <button class="cal-nav-btn" onclick="CalendarScreen.nextMonth()">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
          </svg>
        </button>
      </div>
    `;
  },

  // ─── Month Grid ──────────────────────────────────────────
  renderGrid() {
    const ym = `${this._year}-${String(this._month + 1).padStart(2, '0')}`;
    const entries = Store.getCalendarEntries(ym);
    const today = new Date().toISOString().split('T')[0];

    // First day of month & how many days
    const firstDay = new Date(this._year, this._month, 1).getDay(); // 0=Sun
    const daysInMonth = new Date(this._year, this._month + 1, 0).getDate();

    const dayHeaders = ['Su','Mo','Tu','We','Th','Fr','Sa'];
    let cells = '';

    // Empty cells before first day
    for (let i = 0; i < firstDay; i++) {
      cells += `<div class="cal-cell cal-cell-empty"></div>`;
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${ym}-${String(d).padStart(2, '0')}`;
      const dayEntries = entries[dateStr] || [];
      const isToday = dateStr === today;
      const isSelected = dateStr === this._selectedDate;
      const hasEvents = dayEntries.length > 0;

      // Collect unique colors for dots (max 3)
      const dotColors = [...new Set(dayEntries.map(e => e.color))].slice(0, 3);

      cells += `
        <div class="cal-cell ${isToday ? 'cal-today' : ''} ${isSelected ? 'cal-selected' : ''}"
             onclick="CalendarScreen.selectDate('${dateStr}')">
          <span class="cal-day-num">${d}</span>
          ${hasEvents ? `
            <div class="cal-dots">
              ${dotColors.map(c => `<span class="cal-dot" style="background:${c};"></span>`).join('')}
            </div>
          ` : '<div class="cal-dots"></div>'}
        </div>
      `;
    }

    return `
      <div class="cal-grid-wrapper">
        <div class="cal-day-headers">
          ${dayHeaders.map(d => `<div class="cal-day-header">${d}</div>`).join('')}
        </div>
        <div class="cal-grid">${cells}</div>
      </div>
    `;
  },

  // ─── Agenda ──────────────────────────────────────────────
  renderAgenda() {
    if (!this._selectedDate) return '';

    const entries = Store.getEntriesForDate(this._selectedDate);
    const dateLabel = new Date(this._selectedDate + 'T12:00:00').toLocaleDateString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric'
    });

    return `
      <div class="cal-agenda">
        <div class="cal-agenda-header">
          <span class="cal-agenda-date">${dateLabel}</span>
          <button class="cal-add-inline-btn" onclick="CalendarScreen.toggleAddForm()">
            ${this._showAddForm ? '✕ Cancel' : '+ Event'}
          </button>
        </div>

        ${entries.length === 0
          ? `<p class="cal-agenda-empty">Nothing scheduled</p>`
          : entries.map(e => this.renderEntry(e)).join('')
        }
      </div>
    `;
  },

  renderEntry(entry) {
    const typeIcon = entry.type === 'stage' ? '📋' : entry.type === 'reminder' ? '🔔' : '📌';
    const timeStr = entry.time ? `<span class="cal-entry-time">${this.formatTime(entry.time)}</span>` : '';

    return `
      <div class="cal-entry" onclick="${entry.projectId ? `App.navigateTo('detail','${entry.projectId}')` : ''}">
        <div class="cal-entry-dot" style="background:${entry.color};"></div>
        <div class="cal-entry-body">
          <div class="cal-entry-label">${typeIcon} ${entry.label}</div>
          ${timeStr}
        </div>
        ${entry.type === 'event' && entry.calEventId ? `
          <button class="cal-entry-delete" onclick="event.stopPropagation(); CalendarScreen.deleteEvent('${entry.calEventId}')">✕</button>
        ` : `
          <svg class="w-4 h-4 text-gray-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
          </svg>
        `}
      </div>
    `;
  },

  // ─── Add Event Form ───────────────────────────────────────
  renderAddSection(activeProjects) {
    if (!this._showAddForm) return '';

    const dateVal = this._selectedDate || new Date().toISOString().split('T')[0];

    return `
      <div class="cal-add-form">
        <h3 class="section-label mb-3">New Event</h3>
        <div class="space-y-3">
          <div>
            <label class="form-label">Title *</label>
            <input type="text" id="calEventTitle" class="form-input" placeholder="e.g. On the Johnson job all day">
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="form-label">Date *</label>
              <input type="date" id="calEventDate" class="form-input" value="${dateVal}">
            </div>
            <div>
              <label class="form-label">Time (optional)</label>
              <input type="time" id="calEventTime" class="form-input">
            </div>
          </div>
          <div>
            <label class="form-label">Link to Job (optional)</label>
            <select id="calEventProject" class="form-input">
              <option value="">— No job —</option>
              ${activeProjects.map(p => `
                <option value="${p.id}">${p.name || 'Unnamed'}${p.note ? ' — ' + p.note : ''}</option>
              `).join('')}
            </select>
          </div>
          <button onclick="CalendarScreen.saveEvent()" class="action-btn action-btn-primary w-full">
            Save Event
          </button>
        </div>
      </div>
    `;
  },

  // ─── Actions ─────────────────────────────────────────────
  prevMonth() {
    if (this._month === 0) { this._month = 11; this._year--; }
    else this._month--;
    this._selectedDate = null;
    this._showAddForm = false;
    App.renderScreen();
  },

  nextMonth() {
    if (this._month === 11) { this._month = 0; this._year++; }
    else this._month++;
    this._selectedDate = null;
    this._showAddForm = false;
    App.renderScreen();
  },

  selectDate(dateStr) {
    this._selectedDate = dateStr;
    this._showAddForm = false;
    App.renderScreen();
  },

  toggleAddForm() {
    this._showAddForm = !this._showAddForm;
    App.renderScreen();
  },

  saveEvent() {
    const title = document.getElementById('calEventTitle')?.value.trim();
    const date  = document.getElementById('calEventDate')?.value;
    const time  = document.getElementById('calEventTime')?.value;
    const projectId = document.getElementById('calEventProject')?.value || null;

    if (!title) { document.getElementById('calEventTitle')?.focus(); return; }
    if (!date)  { alert('Please pick a date.'); return; }

    Store.addCalEvent({ title, date, time, projectId });

    // Navigate to the saved event's date
    this._selectedDate = date;
    this._showAddForm = false;

    // Update month/year to match
    const d = new Date(date + 'T12:00:00');
    this._year  = d.getFullYear();
    this._month = d.getMonth();

    App.renderScreen();
  },

  deleteEvent(calEventId) {
    Store.deleteCalEvent(calEventId);
    App.renderScreen();
  },

  // ─── Helpers ─────────────────────────────────────────────
  formatTime(timeStr) {
    if (!timeStr) return '';
    const [h, m] = timeStr.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour = h % 12 || 12;
    return `${hour}:${String(m).padStart(2, '0')} ${ampm}`;
  }
};

window.CalendarScreen = CalendarScreen;
