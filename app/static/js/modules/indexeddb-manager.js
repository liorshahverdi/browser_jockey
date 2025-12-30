/**
 * IndexedDB Manager
 * Handles storage and retrieval of AudioBuffers for sequencer projects
 */

export class IndexedDBManager {
    constructor(dbName = 'BrowserJockeyDB', version = 1) {
        this.dbName = dbName;
        this.version = version;
        this.db = null;
    }

    /**
     * Initialize the database
     * @returns {Promise<IDBDatabase>}
     */
    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);

            request.onerror = () => {
                console.error('Failed to open IndexedDB:', request.error);
                reject(request.error);
            };

            request.onsuccess = () => {
                this.db = request.result;
                console.log('✅ IndexedDB opened successfully');
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // Create object stores if they don't exist
                if (!db.objectStoreNames.contains('audioBuffers')) {
                    const audioStore = db.createObjectStore('audioBuffers', { keyPath: 'id' });
                    audioStore.createIndex('projectId', 'projectId', { unique: false });
                    console.log('Created audioBuffers object store');
                }

                if (!db.objectStoreNames.contains('projects')) {
                    db.createObjectStore('projects', { keyPath: 'id' });
                    console.log('Created projects object store');
                }
            };
        });
    }

    /**
     * Store an AudioBuffer
     * @param {string} id - Unique identifier for the buffer
     * @param {AudioBuffer} audioBuffer - The audio buffer to store
     * @param {string} projectId - Associated project ID
     * @param {object} metadata - Additional metadata
     * @returns {Promise<void>}
     */
    async saveAudioBuffer(id, audioBuffer, projectId, metadata = {}) {
        if (!this.db) await this.init();

        // Convert AudioBuffer to transferable format
        const bufferData = {
            id,
            projectId,
            numberOfChannels: audioBuffer.numberOfChannels,
            length: audioBuffer.length,
            sampleRate: audioBuffer.sampleRate,
            channels: [],
            metadata,
            timestamp: Date.now()
        };

        // Extract channel data
        for (let i = 0; i < audioBuffer.numberOfChannels; i++) {
            bufferData.channels.push(audioBuffer.getChannelData(i));
        }

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['audioBuffers'], 'readwrite');
            const store = transaction.objectStore('audioBuffers');
            const request = store.put(bufferData);

            request.onsuccess = () => {
                console.log(`💾 Saved audio buffer: ${id}`);
                resolve();
            };

            request.onerror = () => {
                console.error('Failed to save audio buffer:', request.error);
                reject(request.error);
            };
        });
    }

    /**
     * Retrieve an AudioBuffer
     * @param {string} id - Buffer identifier
     * @param {AudioContext} audioContext - Audio context to create buffer
     * @returns {Promise<AudioBuffer>}
     */
    async loadAudioBuffer(id, audioContext) {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['audioBuffers'], 'readonly');
            const store = transaction.objectStore('audioBuffers');
            const request = store.get(id);

            request.onsuccess = () => {
                const bufferData = request.result;
                if (!bufferData) {
                    reject(new Error(`Audio buffer not found: ${id}`));
                    return;
                }

                // Reconstruct AudioBuffer
                const audioBuffer = audioContext.createBuffer(
                    bufferData.numberOfChannels,
                    bufferData.length,
                    bufferData.sampleRate
                );

                for (let i = 0; i < bufferData.numberOfChannels; i++) {
                    audioBuffer.getChannelData(i).set(bufferData.channels[i]);
                }

                console.log(`📂 Loaded audio buffer: ${id}`);
                resolve(audioBuffer);
            };

            request.onerror = () => {
                console.error('Failed to load audio buffer:', request.error);
                reject(request.error);
            };
        });
    }

    /**
     * Save project metadata
     * @param {string} id - Project ID
     * @param {object} projectData - Project data to save
     * @returns {Promise<void>}
     */
    async saveProject(id, projectData) {
        if (!this.db) await this.init();

        const project = {
            id,
            ...projectData,
            savedAt: Date.now()
        };

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['projects'], 'readwrite');
            const store = transaction.objectStore('projects');
            const request = store.put(project);

            request.onsuccess = () => {
                console.log(`💾 Saved project: ${id}`);
                resolve();
            };

            request.onerror = () => {
                console.error('Failed to save project:', request.error);
                reject(request.error);
            };
        });
    }

    /**
     * Load project metadata
     * @param {string} id - Project ID
     * @returns {Promise<object>}
     */
    async loadProject(id) {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['projects'], 'readonly');
            const store = transaction.objectStore('projects');
            const request = store.get(id);

            request.onsuccess = () => {
                const project = request.result;
                if (!project) {
                    reject(new Error(`Project not found: ${id}`));
                    return;
                }

                console.log(`📂 Loaded project: ${id}`);
                resolve(project);
            };

            request.onerror = () => {
                console.error('Failed to load project:', request.error);
                reject(request.error);
            };
        });
    }

    /**
     * List all projects
     * @returns {Promise<Array>}
     */
    async listProjects() {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['projects'], 'readonly');
            const store = transaction.objectStore('projects');
            const request = store.getAll();

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    /**
     * Delete a project and its associated audio buffers
     * @param {string} projectId - Project ID
     * @returns {Promise<void>}
     */
    async deleteProject(projectId) {
        if (!this.db) await this.init();

        // Delete project metadata
        await new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['projects'], 'readwrite');
            const store = transaction.objectStore('projects');
            const request = store.delete(projectId);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });

        // Delete associated audio buffers
        await new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['audioBuffers'], 'readwrite');
            const store = transaction.objectStore('audioBuffers');
            const index = store.index('projectId');
            const request = index.openCursor(IDBKeyRange.only(projectId));

            request.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor) {
                    cursor.delete();
                    cursor.continue();
                } else {
                    resolve();
                }
            };

            request.onerror = () => reject(request.error);
        });

        console.log(`🗑️ Deleted project: ${projectId}`);
    }

    /**
     * Get storage usage statistics
     * @returns {Promise<object>}
     */
    async getStorageStats() {
        if (!this.db) await this.init();

        const stats = {
            projects: 0,
            audioBuffers: 0,
            totalSize: 0
        };

        // Count projects
        const projects = await this.listProjects();
        stats.projects = projects.length;

        // Count and size audio buffers
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['audioBuffers'], 'readonly');
            const store = transaction.objectStore('audioBuffers');
            const request = store.getAll();

            request.onsuccess = () => {
                const buffers = request.result;
                stats.audioBuffers = buffers.length;
                
                buffers.forEach(buffer => {
                    buffer.channels.forEach(channel => {
                        stats.totalSize += channel.byteLength;
                    });
                });

                stats.totalSizeMB = (stats.totalSize / (1024 * 1024)).toFixed(2);
                resolve(stats);
            };

            request.onerror = () => reject(request.error);
        });
    }
}
