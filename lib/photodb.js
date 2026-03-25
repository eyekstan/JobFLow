/**
 * PhotoDB - IndexedDB-backed photo storage
 * Keeps photos out of localStorage to avoid size limits
 */

const PhotoDB = {
  DB_NAME: 'jobflow_photos',
  DB_VERSION: 1,
  STORE_NAME: 'photos',
  _db: null,

  async open() {
    if (this._db) return this._db;
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(this.DB_NAME, this.DB_VERSION);
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(this.STORE_NAME)) {
          const store = db.createObjectStore(this.STORE_NAME, { keyPath: 'id' });
          store.createIndex('projectId', 'projectId', { unique: false });
        }
      };
      req.onsuccess = (e) => { this._db = e.target.result; resolve(this._db); };
      req.onerror = (e) => reject(e.target.error);
    });
  },

  async addPhoto(projectId, dataUrl, filename) {
    const db = await this.open();
    const id = Date.now().toString(36) + Math.random().toString(36).substr(2);
    const photo = { id, projectId, dataUrl, filename: filename || 'photo.jpg', createdAt: Date.now() };
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.STORE_NAME, 'readwrite');
      const req = tx.objectStore(this.STORE_NAME).add(photo);
      req.onsuccess = () => resolve(photo);
      req.onerror = (e) => reject(e.target.error);
    });
  },

  async getPhotos(projectId) {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.STORE_NAME, 'readonly');
      const index = tx.objectStore(this.STORE_NAME).index('projectId');
      const req = index.getAll(projectId);
      req.onsuccess = (e) => resolve(e.target.result || []);
      req.onerror = (e) => reject(e.target.error);
    });
  },

  async deletePhoto(id) {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.STORE_NAME, 'readwrite');
      const req = tx.objectStore(this.STORE_NAME).delete(id);
      req.onsuccess = () => resolve();
      req.onerror = (e) => reject(e.target.error);
    });
  },

  async getAllPhotos() {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.STORE_NAME, 'readonly');
      const req = tx.objectStore(this.STORE_NAME).getAll();
      req.onsuccess = (e) => resolve(e.target.result || []);
      req.onerror = (e) => reject(e.target.error);
    });
  },

  async importPhotos(photos) {
    if (!photos || photos.length === 0) return;
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.STORE_NAME, 'readwrite');
      const store = tx.objectStore(this.STORE_NAME);
      store.clear();
      photos.forEach(photo => store.put(photo));
      tx.oncomplete = () => resolve();
      tx.onerror = (e) => reject(e.target.error);
    });
  },

  // Read a File object as base64 data URL
  fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }
};

window.PhotoDB = PhotoDB;
