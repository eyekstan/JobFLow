/**
 * JobFlow - Main Application Entry Point
 * Contractor job lead and project management PWA
 */

// ============================================
// NOTIFICATIONS
// ============================================

const Notifications = {
  async requestPermission() {
    if (!('Notification' in window)) return false;
    if (Notification.permission === 'granted') return true;
    if (Notification.permission === 'denied') return false;
    const result = await Notification.requestPermission();
    return result === 'granted';
  },

  show(title, body, projectId) {
    if (Notification.permission !== 'granted') return;
    const n = new Notification(title, {
      body,
      icon: 'data:image/svg+xml,<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 100 100\'><rect fill=\'%23007AFF\' width=\'100\' height=\'100\' rx=\'20\'/><text x=\'50\' y=\'65\' font-size=\'50\' text-anchor=\'middle\' fill=\'white\' font-family=\'system-ui\'>J</text></svg>',
      badge: 'data:image/svg+xml,<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 100 100\'><rect fill=\'%23007AFF\' width=\'100\' height=\'100\' rx=\'20\'/></svg>',
      data: { projectId },
      tag: projectId || 'jobflow'
    });
    n.onclick = () => {
      window.focus();
      if (projectId) App.navigateTo('detail', projectId);
      n.close();
    };
  },

  checkPending() {
    const pending = Store.getPendingReminders();
    pending.forEach(reminder => {
      this.show('JobFlow Reminder', reminder.message, reminder.projectId);
      Store.markReminderFired(reminder.id);
    });
  },

  startChecking() {
    // Check immediately, then every 30 seconds
    this.checkPending();
    setInterval(() => this.checkPending(), 30000);
  }
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

const Utils = {
  // Format date for display
  formatDate(timestamp) {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  },

  // Format date from YYYY-MM-DD string
  formatDateString(dateStr) {
    if (!dateStr) return '';
    // Append time to prevent timezone issues - use local date
    const date = new Date(dateStr + 'T12:00:00');
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  },

  // Check if date is today
  isToday(dateStr) {
    if (!dateStr) return false;
    const today = new Date();
    const compareDate = new Date(dateStr + 'T12:00:00');
    return today.toDateString() === compareDate.toDateString();
  },

  // Check if date is overdue
  isOverdue(dateStr) {
    if (!dateStr) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const compareDate = new Date(dateStr + 'T12:00:00');
    return compareDate < today;
  }
};

// ============================================
// NAVIGATION & ROUTING
// ============================================

const App = {
  currentScreen: 'dashboard',
  projectId: null,
  _history: [], // { screen, projectId } stack

  // Initialize the app
  init() {
    this.setupNavigation();
    this.setupFab();
    this.setupMenu();
    this.setupSearch();
    this.setCurrentDate();
    this.registerServiceWorker();
    this.setupInstallPrompt();
    Notifications.startChecking();

    if (!Store.hasSeenOnboarding()) {
      OnboardingScreen.currentSlide = 0;
      this.navigateTo('onboarding');
    } else {
      this.navigateTo('dashboard');
    }
  },

  // Setup FAB button
  setupFab() {
    const fab = document.getElementById('fab');
    if (fab) {
      fab.addEventListener('click', () => {
        this.navigateTo('newlead');
      });
    }
  },

  // Setup menu button
  setupMenu() {
    const menuBtn = document.getElementById('menuBtn');
    const menuDropdown = document.getElementById('menuDropdown');
    if (menuBtn && menuDropdown) {
      menuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        menuDropdown.classList.toggle('hidden');
      });
      document.addEventListener('click', () => {
        menuDropdown.classList.add('hidden');
      });
    }
  },

  // Setup search functionality
  setupSearch() {
    const searchBtn = document.getElementById('searchBtn');
    const closeSearchBtn = document.getElementById('closeSearchBtn');
    const searchOverlay = document.getElementById('searchOverlay');
    const searchInput = document.getElementById('searchInput');
    const searchResults = document.getElementById('searchResults');

    if (!searchBtn || !searchOverlay) return;

    // Open search
    searchBtn.addEventListener('click', () => {
      searchOverlay.classList.remove('hidden');
      searchInput.focus();
    });

    // Close search
    closeSearchBtn.addEventListener('click', () => {
      searchOverlay.classList.add('hidden');
    });

    // Close search and navigate
    this.closeSearchAndNavigate = (screen) => {
      searchOverlay.classList.add('hidden');
      searchInput.value = '';
      this.navigateTo(screen);
    };

    // Search on input
    let searchTimeout;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        this.performSearch(e.target.value, searchResults);
      }, 150);
    });

    // Close on escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !searchOverlay.classList.contains('hidden')) {
        searchOverlay.classList.add('hidden');
      }
    });
  },

  // Perform search and render results
  performSearch(query, resultsContainer) {
    if (!query || query.trim() === '') {
      resultsContainer.innerHTML = '<p class="text-gray-400 text-center py-8">Type to search...</p>';
      return;
    }

    const results = Store.searchProjects(query);
    const stages = Store.getPipelineStages();
    const archiveIndex = stages.length;

    if (results.length === 0) {
      resultsContainer.innerHTML = '<p class="text-gray-400 text-center py-8">No projects found</p>';
      return;
    }

    // Group results
    const activeResults = results.filter(p => p.stageIndex < archiveIndex);
    const archivedResults = results.filter(p => p.stageIndex >= archiveIndex);

    let html = '';

    // Active projects
    if (activeResults.length > 0) {
      html += '<h3 class="section-header text-blue-600">Active Projects (' + activeResults.length + ')</h3>';
      activeResults.forEach(project => {
        const stageName = Store.getStageName(project.stageIndex);
        const stageClass = ProjectCard.getStageClass(project.stageIndex);
        html += this.renderSearchResult(project, stageName, stageClass);
      });
    }

    // Archived projects
    if (archivedResults.length > 0) {
      if (html) html += '<hr class="my-4">';
      html += '<h3 class="section-header text-gray-500">Archived (' + archivedResults.length + ')</h3>';
      archivedResults.forEach(project => {
        html += this.renderSearchResult(project, 'Archived', 'bg-gray-500');
      });
    }

    resultsContainer.innerHTML = html;

    // Add click handlers
    resultsContainer.querySelectorAll('.search-result-card').forEach(card => {
      card.addEventListener('click', () => {
        document.getElementById('searchOverlay').classList.add('hidden');
        document.getElementById('searchInput').value = '';
        this.navigateTo('detail', card.dataset.projectId);
      });
    });
  },

  // Render a single search result
  renderSearchResult(project, stageName, stageClass) {
    return `
      <div class="search-result-card bg-white rounded-xl p-4 mb-3 shadow-sm border border-gray-100" data-project-id="${project.id}">
        <div class="flex items-center justify-between mb-2">
          <span class="font-bold text-gray-900">${project.name || 'Unnamed Project'}</span>
          <span class="${stageClass} text-white text-xs font-medium px-2 py-1 rounded-full">${stageName}</span>
        </div>
        ${project.note ? `<p class="text-gray-600 text-sm mb-1">${project.note}</p>` : ''}
        ${project.phone ? `<p class="text-gray-500 text-sm">📞 ${project.phone}</p>` : ''}
        ${project.address ? `<p class="text-gray-500 text-sm">📍 ${project.address}</p>` : ''}
      </div>
    `;
  },

  // Setup bottom navigation
  setupNavigation() {
    const navButtons = document.querySelectorAll('.nav-btn');
    navButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const screen = btn.dataset.screen;
        this.navigateTo(screen);
      });
    });
  },

  // Set current date in header
  setCurrentDate() {
    const dateEl = document.getElementById('currentDate');
    const today = new Date();
    const options = { weekday: 'short', month: 'short', day: 'numeric' };
    dateEl.textContent = today.toLocaleDateString('en-US', options);
  },

  // PWA install prompt
  setupInstallPrompt() {
    let deferredPrompt = null;
    let viewCount = parseInt(localStorage.getItem('jobflow_views') || '0');
    const dismissed = localStorage.getItem('jobflow_install_dismissed');

    // iOS Safari detection
    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches
      || window.navigator.standalone;

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
      if (viewCount >= 3 && !dismissed) {
        setTimeout(() => this.showInstallBanner(deferredPrompt, false), 1500);
      }
    });

    // iOS: show manual instructions after 3 views if not installed and not dismissed
    if (isIos && !isInStandaloneMode && viewCount >= 3 && !dismissed) {
      setTimeout(() => this.showInstallBanner(null, true), 1500);
    }

    viewCount++;
    localStorage.setItem('jobflow_views', viewCount);
  },

  showInstallBanner(deferredPrompt, isIos) {
    if (document.getElementById('installBanner')) return;
    const banner = document.createElement('div');
    banner.id = 'installBanner';
    banner.className = 'install-banner';

    if (isIos) {
      banner.innerHTML = `
        <div class="install-banner-content">
          <div class="install-banner-icon">📲</div>
          <div class="install-banner-text">
            <strong>Install JobFlow</strong>
            <span>Tap <strong>Share</strong> then <strong>"Add to Home Screen"</strong> for the best experience</span>
          </div>
        </div>
        <div class="install-banner-actions">
          <button class="install-btn-no" onclick="App.dismissInstall()">Got it</button>
        </div>
      `;
    } else {
      banner.innerHTML = `
        <div class="install-banner-content">
          <div class="install-banner-icon">📲</div>
          <div class="install-banner-text">
            <strong>Install JobFlow</strong>
            <span>Add to your home screen for the best experience</span>
          </div>
        </div>
        <div class="install-banner-actions">
          <button class="install-btn-yes" onclick="App.triggerInstall()">Install</button>
          <button class="install-btn-no" onclick="App.dismissInstall()">Not now</button>
        </div>
      `;
    }

    document.body.appendChild(banner);
    this._deferredPrompt = deferredPrompt;
    setTimeout(() => banner.classList.add('visible'), 50);
  },

  async triggerInstall() {
    const banner = document.getElementById('installBanner');
    if (banner) banner.remove();
    if (this._deferredPrompt) {
      this._deferredPrompt.prompt();
      await this._deferredPrompt.userChoice;
      this._deferredPrompt = null;
    }
    localStorage.setItem('jobflow_install_dismissed', '1');
  },

  dismissInstall() {
    const banner = document.getElementById('installBanner');
    if (banner) {
      banner.classList.remove('visible');
      setTimeout(() => banner.remove(), 300);
    }
    localStorage.setItem('jobflow_install_dismissed', '1');
  },

  // Register Service Worker for PWA
  registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('service-worker.js')
        .catch(err => {});
    }
  },

  // Navigate to a screen — pushes to history stack
  navigateTo(screen, projectId = null) {
    const searchOverlay = document.getElementById('searchOverlay');
    if (searchOverlay) {
      searchOverlay.classList.add('hidden');
      const si = document.getElementById('searchInput');
      if (si) si.value = '';
    }

    // Root screens reset the stack; all others push onto it
    const rootScreens = ['dashboard', 'pipeline', 'onboarding'];
    if (rootScreens.includes(screen)) {
      this._history = [];
    } else if (screen !== this.currentScreen || projectId !== this.projectId) {
      this._history.push({ screen: this.currentScreen, projectId: this.projectId });
    }

    this.currentScreen = screen;
    this.projectId = projectId;
    this.updateNavButtons();
    this.updateFabVisibility();
    this.renderScreen();
  },

  // Go back through history stack
  goBack() {
    if (this._history.length > 0) {
      const prev = this._history.pop();
      this.currentScreen = prev.screen;
      this.projectId = prev.projectId;
      this.updateNavButtons();
      this.updateFabVisibility();
      this.renderScreen();
    } else {
      this.navigateTo('dashboard');
    }
  },

  // Update FAB visibility
  updateFabVisibility() {
    const fab = document.getElementById('fab');
    const searchOverlay = document.getElementById('searchOverlay');
    if (!fab) return;
    
    // Hide FAB when search is open
    if (searchOverlay && !searchOverlay.classList.contains('hidden')) {
      fab.style.display = 'none';
      return;
    }
    
    if (this.currentScreen === 'newlead' || this.currentScreen === 'detail' || this.currentScreen === 'settings' || this.currentScreen === 'archive' || this.currentScreen === 'customers' || this.currentScreen === 'customerDetail' || this.currentScreen === 'onboarding' || this.currentScreen === 'estimate') {
      fab.style.display = 'none';
    } else {
      fab.style.display = 'flex';
    }
  },

  // Update navigation button states
  updateNavButtons() {
    const navButtons = document.querySelectorAll('.nav-btn');
    navButtons.forEach(btn => {
      const btnScreen = btn.dataset.screen;
      if (
        (btnScreen === 'dashboard' && this.currentScreen === 'dashboard') ||
        (btnScreen === 'pipeline' && this.currentScreen === 'pipeline')
      ) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  },

  // Render current screen
  renderScreen() {
    const container = document.getElementById('screen-container');
    
    switch (this.currentScreen) {
      case 'onboarding':
        container.innerHTML = OnboardingScreen.render();
        break;
      // ESTIMATE FEATURE - remove these 3 lines to disable
      case 'estimate':
        container.innerHTML = EstimateScreen.render(this.projectId);
        break;
      case 'dashboard':
        container.innerHTML = DashboardScreen.render();
        DashboardScreen.setupSwipeGestures();
        break;
      case 'pipeline':
        container.innerHTML = PipelineScreen.render();
        DashboardScreen.setupSwipeGestures();
        break;
      case 'newlead':
        container.innerHTML = QuickCaptureScreen.render();
        break;
      case 'detail':
        container.innerHTML = ProjectDetailScreen.render(this.projectId);
        break;
      case 'settings':
        container.innerHTML = SettingsScreen.render();
        break;
      case 'archive':
        container.innerHTML = ArchiveScreen.render();
        break;
      case 'customers':
        container.innerHTML = CustomersScreen.render();
        break;
      case 'customerDetail':
        container.innerHTML = CustomerDetailScreen.render(this.projectId);
        break;
      default:
        container.innerHTML = DashboardScreen.render();
    }

    // Attach event listeners for the rendered screen
    this.attachScreenListeners();
  },

  // Attach event listeners to rendered screen elements
  attachScreenListeners() {
    // Project card clicks
    document.querySelectorAll('.project-card').forEach(card => {
      card.addEventListener('click', () => {
        const projectId = card.dataset.projectId;
        this.navigateTo('detail', projectId);
      });
    });

    // Form submissions
    const quickCaptureForm = document.getElementById('quickCaptureForm');
    if (quickCaptureForm) {
      quickCaptureForm.addEventListener('submit', (e) => {
        e.preventDefault();
        QuickCaptureScreen.handleSubmit();
      });
    }

    const detailForm = document.getElementById('detailForm');
    if (detailForm) {
      detailForm.addEventListener('submit', (e) => {
        e.preventDefault();
        ProjectDetailScreen.handleSubmit(this.projectId);
      });
    }

    const addStageForm = document.getElementById('addStageForm');
    if (addStageForm) {
      addStageForm.addEventListener('submit', (e) => {
        e.preventDefault();
        SettingsScreen.handleAddStage();
      });
    }

    // Back buttons
    const backBtn = document.getElementById('backBtn');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        App.goBack();
      });
    }

    // Phone call button
    const callBtn = document.getElementById('callBtn');
    if (callBtn) {
      callBtn.addEventListener('click', () => {
        const phone = callBtn.dataset.phone;
        if (phone) {
          window.location.href = `tel:${phone}`;
        }
      });
    }
  }
};

// ============================================
// INITIALIZATION
// ============================================

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
