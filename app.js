/**
 * JobFlow - Main Application Entry Point
 * Contractor job lead and project management PWA
 */

// ============================================
// DATA STORAGE
// ============================================

const Storage = {
  // Get all projects from LocalStorage
  getProjects() {
    const data = localStorage.getItem('projects');
    return data ? JSON.parse(data) : [];
  },

  // Save projects to LocalStorage
  saveProjects(projects) {
    localStorage.setItem('projects', JSON.stringify(projects));
  },

  // Generate unique ID
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  },

  // Create new project
  createProject(projectData) {
    const projects = this.getProjects();
    const newProject = {
      id: this.generateId(),
      name: projectData.name || '',
      phone: projectData.phone || '',
      address: projectData.address || '',
      note: projectData.note || '',
      status: projectData.status || 'Lead',
      next_action: projectData.next_action || '',
      next_action_date: projectData.next_action_date || '',
      created_at: Date.now()
    };
    projects.unshift(newProject);
    this.saveProjects(projects);
    return newProject;
  },

  // Update existing project
  updateProject(id, updates) {
    const projects = this.getProjects();
    const index = projects.findIndex(p => p.id === id);
    if (index !== -1) {
      projects[index] = { ...projects[index], ...updates };
      this.saveProjects(projects);
      return projects[index];
    }
    return null;
  },

  // Delete project
  deleteProject(id) {
    const projects = this.getProjects();
    const filtered = projects.filter(p => p.id !== id);
    this.saveProjects(filtered);
  },

  // Get single project
  getProject(id) {
    const projects = this.getProjects();
    return projects.find(p => p.id === id) || null;
  }
};

// ============================================
// STATUS CONFIGURATION
// ============================================

const STATUSES = [
  'Lead',
  'Visit',
  'Quote',
  'Approved',
  'Scheduled',
  'In Progress',
  'Complete'
];

// Status transitions and actions
const STATUS_ACTIONS = {
  'Lead': [
    { label: 'Visit Job', status: 'Visit', color: 'primary' },
    { label: 'Create Quote', status: 'Quote', color: 'accent' }
  ],
  'Visit': [
    { label: 'Create Quote', status: 'Quote', color: 'accent' },
    { label: 'No Go', status: 'Lead', color: 'outline' }
  ],
  'Quote': [
    { label: 'Send Quote', status: 'Approved', color: 'success' },
    { label: 'Revisit', status: 'Visit', color: 'outline' }
  ],
  'Approved': [
    { label: 'Schedule Job', status: 'Scheduled', color: 'primary' }
  ],
  'Scheduled': [
    { label: 'Start Job', status: 'In Progress', color: 'success' }
  ],
  'In Progress': [
    { label: 'Complete Job', status: 'Complete', color: 'success' },
    { label: 'Buy Materials', status: 'In Progress', color: 'accent' }
  ],
  'Complete': [
    { label: 'New Job', status: 'Lead', color: 'primary' }
  ]
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
    this.renderScreen();
  },

  // Update navigation button states
  updateNavButtons() {
    const navButtons = document.querySelectorAll('.nav-btn');
    navButtons.forEach(btn => {
      const btnScreen = btn.dataset.screen;
      if (
        (btnScreen === 'dashboard' && this.currentScreen === 'dashboard') ||
        (btnScreen === 'pipeline' && this.currentScreen === 'pipeline') ||
        (btnScreen === 'newlead' && this.currentScreen === 'newlead')
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
        break;
      case 'pipeline':
        container.innerHTML = PipelineScreen.render();
        break;
      case 'newlead':
        container.innerHTML = QuickCaptureScreen.render();
        break;
      case 'detail':
        container.innerHTML = ProjectDetailScreen.render(this.projectId);
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

    // Action buttons
    document.querySelectorAll('.action-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const status = btn.dataset.status;
        const projectId = btn.dataset.projectId;
        if (status && projectId) {
          ProjectDetailScreen.updateStatus(projectId, status);
        }
      });
    });

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
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  },

  // Check if date is today
  isToday(dateStr) {
    if (!dateStr) return false;
    const today = new Date().toISOString().split('T')[0];
    return dateStr === today;
  },

  // Check if date is overdue
  isOverdue(dateStr) {
    if (!dateStr) return false;
    const today = new Date().toISOString().split('T')[0];
    return dateStr < today;
  },

  // Get status class
  getStatusClass(status) {
    const statusLower = status.toLowerCase().replace(' ', '-');
    return `status-${statusLower}`;
  },

  // Get initials from name
  getInitials(name) {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
