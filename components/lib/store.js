/**
 * Store - LocalStorage data management
 * Handles all project and pipeline data persistence
 */

const Store = {
  // LocalStorage keys
  PROJECTS_KEY: 'jobflow_projects',
  PIPELINE_KEY: 'jobflow_pipeline_stages',
  
  // Archive is always the final stage (read-only)
  ARCHIVE_STAGE_NAME: 'Archive',
  getArchiveStageIndex() {
    return this.getPipelineStages().length; // Archive is always after all editable stages
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

    const newProject = {
      id: this.generateId(),
      name: projectData.name || '',
      phone: projectData.phone || '',
      address: projectData.address || '',
      note: projectData.note || '',
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

  // Move project to next stage
  moveProjectToNextStage(id) {
    const project = this.getProject(id);
    if (!project) return null;
    
    const stages = this.getPipelineStages();
    const newIndex = Math.min(project.stageIndex + 1, stages.length - 1);
    
    return this.updateProject(id, { stageIndex: newIndex });
  },

  // Move project to previous stage
  moveProjectToPrevStage(id) {
    const project = this.getProject(id);
    if (!project) return null;
    
    const newIndex = Math.max(project.stageIndex - 1, 0);
    return this.updateProject(id, { stageIndex: newIndex });
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
