/**
 * JobFlow - Main Application Entry Point
 * Contractor job lead and project management PWA
 */

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

  // Initialize the app
  init() {
    this.setupNavigation();
    this.setupFab();
    this.setupMenu();
    this.setCurrentDate();
    this.registerServiceWorker();
    this.navigateTo('dashboard');
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

  // Register Service Worker for PWA
  registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('service-worker.js')
        .then(reg => console.log('Service Worker registered'))
        .catch(err => console.log('Service Worker registration failed:', err));
    }
  },

  // Navigate to a screen
  navigateTo(screen, projectId = null) {
    this.currentScreen = screen;
    this.projectId = projectId;
    this.updateNavButtons();
    this.updateFabVisibility();
    this.renderScreen();
  },

  // Update FAB visibility
  updateFabVisibility() {
    const fab = document.getElementById('fab');
    if (!fab) return;
    
    if (this.currentScreen === 'newlead' || this.currentScreen === 'detail' || this.currentScreen === 'settings' || this.currentScreen === 'archive') {
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
        SettingsScreen.setupDragAndDrop();
        break;
      case 'archive':
        container.innerHTML = ArchiveScreen.render();
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
        this.navigateTo('dashboard');
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
