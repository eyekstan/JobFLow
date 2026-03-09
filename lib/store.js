/**
 * Store - LocalStorage data management
 * Handles all project and pipeline data persistence
 */

const Store = {
  // LocalStorage keys
  PROJECTS_KEY: 'jobflow_projects',
  CUSTOMERS_KEY: 'jobflow_customers',
  PIPELINE_KEY: 'jobflow_pipeline_stages',
  COMPLETIONS_KEY: 'jobflow_daily_completions',
  
  // Archive is always the final stage (read-only)
  ARCHIVE_STAGE_NAME: 'Archive',
  getArchiveStageIndex() {
    return this.getPipelineStages().length;
  },

  // Default pipeline stages
  DEFAULT_PIPELINE: [
    "Lead",
    "Call Back",
    "Site Visit",
    "Quote",
    "Schedule",
    "Materials",
    "Begin Work",
    "Invoice",
    "Project Complete"
  ],

  // ============ CUSTOMERS ============

  // Get all customers
  getCustomers() {
    const data = localStorage.getItem(this.CUSTOMERS_KEY);
    return data ? JSON.parse(data) : [];
  },

  // Get single customer
  getCustomer(id) {
    const customers = this.getCustomers();
    return customers.find(c => c.id === id) || null;
  },

  // Search customers by name (for auto-suggest)
  searchCustomers(query) {
    if (!query || query.trim() === '') return [];
    const customers = this.getCustomers();
    const searchTerm = query.toLowerCase().trim();
    return customers.filter(c => 
      c.name && c.name.toLowerCase().includes(searchTerm)
    ).slice(0, 5); // Limit to 5 suggestions
  },

  // Create new customer
  createCustomer(customerData) {
    const customers = this.getCustomers();
    const newCustomer = {
      id: this.generateId(),
      name: customerData.name || '',
      phone: customerData.phone || '',
      address: customerData.address || '',
      email: customerData.email || '',
      notes: customerData.notes || '',
      created_at: Date.now()
    };
    customers.unshift(newCustomer);
    localStorage.setItem(this.CUSTOMERS_KEY, JSON.stringify(customers));
    return newCustomer;
  },

  // Update customer and all linked projects
  updateCustomer(id, updates) {
    const customers = this.getCustomers();
    const index = customers.findIndex(c => c.id === id);
    if (index === -1) return null;
    
    // Update customer
    customers[index] = { ...customers[index], ...updates };
    localStorage.setItem(this.CUSTOMERS_KEY, JSON.stringify(customers));
    
    // Auto-update all linked projects
    const projects = this.getProjects();
    const updatedProjects = projects.map(p => {
      if (p.customerId === id) {
        return {
          ...p,
          name: updates.name || p.name,
          phone: updates.phone !== undefined ? updates.phone : p.phone,
          address: updates.address !== undefined ? updates.address : p.address
        };
      }
      return p;
    });
    this.saveProjects(updatedProjects);
    
    return customers[index];
  },

  // Delete customer (unlink from projects)
  deleteCustomer(id) {
    const customers = this.getCustomers();
    const filtered = customers.filter(c => c.id !== id);
    localStorage.setItem(this.CUSTOMERS_KEY, JSON.stringify(filtered));
    
    // Unlink from projects
    const projects = this.getProjects();
    const updatedProjects = projects.map(p => {
      if (p.customerId === id) {
        const { customerId, ...rest } = p;
        return rest;
      }
      return p;
    });
    this.saveProjects(updatedProjects);
  },

  // ============ PROJECTS ============

  // Get all projects
  getProjects() {
    const data = localStorage.getItem(this.PROJECTS_KEY);
    return data ? JSON.parse(data) : [];
  },

  // Save projects to LocalStorage
  saveProjects(projects) {
    localStorage.setItem(this.PROJECTS_KEY, JSON.stringify(projects));
  },

  // Generate unique ID
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  },

  // Create new project
  createProject(projectData) {
    const projects = this.getProjects();
    const stages = this.getPipelineStages();
    
    // Migrate old status-based projects
    let stageIndex = projectData.stageIndex;
    if (stageIndex === undefined && projectData.status) {
      // Try to match old status to new pipeline
      const foundIndex = stages.findIndex(s => s.toLowerCase() === projectData.status.toLowerCase());
      stageIndex = foundIndex >= 0 ? foundIndex : 0;
    }
    if (stageIndex === undefined) {
      stageIndex = 0;
    }

    // If customerId provided, get customer info
    let customerInfo = { name: '', phone: '', address: '' };
    if (projectData.customerId) {
      const customer = this.getCustomer(projectData.customerId);
      if (customer) {
        customerInfo = {
          name: customer.name,
          phone: customer.phone,
          address: customer.address
        };
      }
    }

    const newProject = {
      id: this.generateId(),
      customerId: projectData.customerId || null,
      name: projectData.name || customerInfo.name || '',
      phone: projectData.phone !== undefined ? projectData.phone : customerInfo.phone || '',
      address: projectData.address !== undefined ? projectData.address : customerInfo.address || '',
      note: projectData.note || '',
      notes: projectData.notes || '',
      stageIndex: stageIndex,
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
      // Handle backward compatibility for status -> stageIndex
      if (updates.status !== undefined && updates.stageIndex === undefined) {
        const stages = this.getPipelineStages();
        const foundIndex = stages.findIndex(s => s.toLowerCase() === updates.status.toLowerCase());
        updates.stageIndex = foundIndex >= 0 ? foundIndex : 0;
        delete updates.status;
      }
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
  },

  // Search fields configuration - add new fields here for search
  SEARCH_FIELDS: ['name', 'phone', 'address', 'note', 'next_action'],

  // Flexible search - searches all configured fields
  searchProjects(query) {
    if (!query || query.trim() === '') return [];
    
    const projects = this.getProjects();
    const searchTerm = query.toLowerCase().trim();
    
    return projects.filter(project => {
      return this.SEARCH_FIELDS.some(field => {
        const value = project[field];
        return value && value.toString().toLowerCase().includes(searchTerm);
      });
    });
  },

  // Move project to next stage
  moveProjectToNextStage(id) {
    const project = this.getProject(id);
    if (!project) return null;
    
    const stages = this.getPipelineStages();
    const newIndex = Math.min(project.stageIndex + 1, stages.length - 1);
    
    // Track completion if actually moving forward
    if (newIndex > project.stageIndex) {
      this.trackCompletion();
    }
    
    return this.updateProject(id, { stageIndex: newIndex });
  },

  // Move project to previous stage
  moveProjectToPrevStage(id) {
    const project = this.getProject(id);
    if (!project) return null;
    
    const newIndex = Math.max(project.stageIndex - 1, 0);
    return this.updateProject(id, { stageIndex: newIndex });
  },

  // Track daily completions
  trackCompletion() {
    const today = new Date().toISOString().split('T')[0];
    const data = this.getCompletionsData();
    
    if (data.date !== today) {
      // New day, reset
      data.date = today;
      data.count = 0;
      data.projects = [];
    }
    
    data.count++;
    this.saveCompletionsData(data);
  },

  // Get completions data
  getCompletionsData() {
    const data = localStorage.getItem(this.COMPLETIONS_KEY);
    if (data) {
      return JSON.parse(data);
    }
    return { date: '', count: 0, projects: [] };
  },

  // Save completions data
  saveCompletionsData(data) {
    localStorage.setItem(this.COMPLETIONS_KEY, JSON.stringify(data));
  },

  // Get today's completion count
  getTodayCompletionCount() {
    const today = new Date().toISOString().split('T')[0];
    const data = this.getCompletionsData();
    
    if (data.date !== today) {
      return 0;
    }
    return data.count;
  },

  // ============ PIPELINE STAGES ============

  // Get pipeline stages (editable stages only, excluding Archive)
  getPipelineStages() {
    const data = localStorage.getItem(this.PIPELINE_KEY);
    if (data) {
      return JSON.parse(data);
    }
    // Initialize with default stages
    this.savePipelineStages(this.DEFAULT_PIPELINE);
    return this.DEFAULT_PIPELINE;
  },
  
  // Get all stages including Archive (for display)
  getAllStages() {
    return [...this.getPipelineStages(), this.ARCHIVE_STAGE_NAME];
  },

  // Get stage name by index (includes Archive)
  getStageName(index) {
    const allStages = this.getAllStages();
    return allStages[index] || 'Unknown';
  },

  // Save pipeline stages
  savePipelineStages(stages) {
    localStorage.setItem(this.PIPELINE_KEY, JSON.stringify(stages));
  },

  // Add a new pipeline stage
  addPipelineStage(stageName) {
    const stages = this.getPipelineStages();
    stages.push(stageName);
    this.savePipelineStages(stages);
    return stages;
  },

  // Delete a pipeline stage
  deletePipelineStage(index) {
    const stages = this.getPipelineStages();
    if (index < 0 || index >= stages.length) return stages;
    
    // Remove the stage
    stages.splice(index, 1);
    this.savePipelineStages(stages);
    
    // Update projects that referenced this stage
    const projects = this.getProjects();
    projects.forEach(p => {
      if (p.stageIndex === index) {
        // Move to previous stage
        p.stageIndex = Math.max(0, index - 1);
      } else if (p.stageIndex > index) {
        // Shift down
        p.stageIndex = Math.max(0, p.stageIndex - 1);
      }
    });
    this.saveProjects(projects);
    
    return stages;
  },

  // Reorder pipeline stages
  reorderPipelineStages(newOrder) {
    const stages = newOrder;
    this.savePipelineStages(stages);
    return stages;
  },

  // Migrate old projects (convert status to stageIndex)
  migrateProjects() {
    const projects = this.getProjects();
    const stages = this.getPipelineStages();
    let migrated = false;
    
    projects.forEach(p => {
      if (p.status !== undefined && p.stageIndex === undefined) {
        const foundIndex = stages.findIndex(s => s.toLowerCase() === p.status.toLowerCase());
        p.stageIndex = foundIndex >= 0 ? foundIndex : 0;
        delete p.status;
        migrated = true;
      }
    });
    
    if (migrated) {
      this.saveProjects(projects);
    }
  }
};

// Run migration on load
Store.migrateProjects();

// Export for global use
window.Store = Store;
