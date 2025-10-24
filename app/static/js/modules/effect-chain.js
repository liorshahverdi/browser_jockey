// Effect Chain Manager - Drag and Drop Effect Ordering

export class EffectChain {
    constructor(trackNumber, audioContext) {
        this.trackNumber = trackNumber;
        this.audioContext = audioContext;
        this.effects = [];
        this.draggedElement = null;
        this.draggedIndex = null;
        
        // Check if this is the master channel
        this.isMaster = trackNumber === 'Master';
        
        // Available effect types
        this.availableEffects = [
            { id: 'filter', name: 'Filter', icon: '🎚️' },
            { id: 'reverb', name: 'Reverb', icon: '🌊' },
            { id: 'delay', name: 'Delay', icon: '⏱️' }
        ];
        
        this.initializeUI();
        this.attachEventListeners();
    }
    
    initializeUI() {
        const container = document.getElementById(`effectChain${this.trackNumber}`);
        if (!container) return;
        
        container.innerHTML = `
            <div class="effect-chain-header">
                <span class="effect-chain-title">🔗 Effect Chain</span>
                <button class="effect-chain-reset" title="Reset to default order">↺ Reset</button>
            </div>
            <div class="effect-chain-list" id="effectChainList${this.trackNumber}">
                <!-- Effects will be added here -->
            </div>
            <div class="effect-chain-info">
                <small>💡 Drag to reorder • Click to toggle</small>
            </div>
        `;
        
        // Initialize with default effect order
        this.resetToDefault();
    }
    
    resetToDefault() {
        this.effects = [
            { id: 'filter', name: 'Filter', icon: '🎚️', enabled: true },
            { id: 'reverb', name: 'Reverb', icon: '🌊', enabled: true },
            { id: 'delay', name: 'Delay', icon: '⏱️', enabled: true }
        ];
        this.render();
        // Ensure controls are visible on reset
        this.updateEffectControlsVisibility();
    }
    
    render() {
        const list = document.getElementById(`effectChainList${this.trackNumber}`);
        if (!list) return;
        
        list.innerHTML = '';
        
        this.effects.forEach((effect, index) => {
            const effectItem = document.createElement('div');
            effectItem.className = `effect-chain-item ${effect.enabled ? 'enabled' : 'disabled'}`;
            effectItem.draggable = true;
            effectItem.dataset.index = index;
            effectItem.dataset.effectId = effect.id;
            
            effectItem.innerHTML = `
                <div class="effect-chain-drag-handle">⋮⋮</div>
                <div class="effect-chain-icon">${effect.icon}</div>
                <div class="effect-chain-name">${effect.name}</div>
                <button class="effect-chain-toggle" title="${effect.enabled ? 'Disable' : 'Enable'} effect">
                    ${effect.enabled ? '✓' : '✗'}
                </button>
            `;
            
            list.appendChild(effectItem);
        });
        
        this.attachDragListeners();
    }
    
    attachEventListeners() {
        const resetBtn = document.querySelector(`#effectChain${this.trackNumber} .effect-chain-reset`);
        if (resetBtn) {
            resetBtn.addEventListener('click', () => this.resetToDefault());
        }
    }
    
    attachDragListeners() {
        const items = document.querySelectorAll(`#effectChainList${this.trackNumber} .effect-chain-item`);
        
        items.forEach(item => {
            item.addEventListener('dragstart', (e) => this.handleDragStart(e));
            item.addEventListener('dragend', (e) => this.handleDragEnd(e));
            item.addEventListener('dragover', (e) => this.handleDragOver(e));
            item.addEventListener('drop', (e) => this.handleDrop(e));
            item.addEventListener('dragenter', (e) => this.handleDragEnter(e));
            item.addEventListener('dragleave', (e) => this.handleDragLeave(e));
            
            // Toggle effect enabled/disabled
            const toggleBtn = item.querySelector('.effect-chain-toggle');
            toggleBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const index = parseInt(item.dataset.index);
                this.toggleEffect(index);
            });
        });
    }
    
    handleDragStart(e) {
        this.draggedElement = e.currentTarget;
        this.draggedIndex = parseInt(e.currentTarget.dataset.index);
        e.currentTarget.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', e.currentTarget.innerHTML);
    }
    
    handleDragEnd(e) {
        e.currentTarget.classList.remove('dragging');
        
        // Remove all drag-over classes
        const items = document.querySelectorAll(`#effectChainList${this.trackNumber} .effect-chain-item`);
        items.forEach(item => item.classList.remove('drag-over'));
    }
    
    handleDragOver(e) {
        if (e.preventDefault) {
            e.preventDefault();
        }
        e.dataTransfer.dropEffect = 'move';
        return false;
    }
    
    handleDragEnter(e) {
        if (e.currentTarget !== this.draggedElement) {
            e.currentTarget.classList.add('drag-over');
        }
    }
    
    handleDragLeave(e) {
        e.currentTarget.classList.remove('drag-over');
    }
    
    handleDrop(e) {
        if (e.stopPropagation) {
            e.stopPropagation();
        }
        
        const dropIndex = parseInt(e.currentTarget.dataset.index);
        
        if (this.draggedIndex !== dropIndex) {
            // Reorder the effects array
            const draggedEffect = this.effects[this.draggedIndex];
            this.effects.splice(this.draggedIndex, 1);
            this.effects.splice(dropIndex, 0, draggedEffect);
            
            // Re-render
            this.render();
            
            // Notify that effect chain order has changed
            this.notifyOrderChange();
        }
        
        return false;
    }
    
    toggleEffect(index) {
        this.effects[index].enabled = !this.effects[index].enabled;
        this.render();
        this.updateEffectControlsVisibility();
        this.notifyOrderChange();
    }
    
    updateEffectControlsVisibility() {
        // Update visibility of effect controls based on enabled state
        this.effects.forEach(effect => {
            // Get control elements for this effect
            const controlIds = this.getEffectControlIds(effect.id);
            
            controlIds.forEach(controlId => {
                const controlElement = document.getElementById(controlId);
                
                if (controlElement) {
                    if (effect.enabled) {
                        controlElement.style.display = 'block';
                        // Fade in animation
                        setTimeout(() => {
                            controlElement.style.opacity = '1';
                        }, 10);
                    } else {
                        controlElement.style.opacity = '0';
                        // Hide after fade out
                        setTimeout(() => {
                            controlElement.style.display = 'none';
                        }, 300);
                    }
                }
            });
        });
    }
    
    getEffectControlIds(effectId) {
        // Map effect IDs to their corresponding control container IDs
        // Delay has two controls (delay amount and delay time)
        if (effectId === 'delay') {
            return [
                `delayControl${this.trackNumber}`,
                `delayTimeControl${this.trackNumber}`
            ];
        }
        return [`${effectId}Control${this.trackNumber}`];
    }
    
    notifyOrderChange() {
        // Dispatch custom event that the main visualizer can listen to
        const event = new CustomEvent('effectChainChanged', {
            detail: {
                trackNumber: this.trackNumber,
                effects: this.effects
            }
        });
        document.dispatchEvent(event);
        
        console.log(`Track ${this.trackNumber} effect chain:`, this.effects);
    }
    
    getEffectOrder() {
        return this.effects.map(e => ({
            id: e.id,
            enabled: e.enabled
        }));
    }
    
    getEnabledEffects() {
        return this.effects.filter(e => e.enabled).map(e => e.id);
    }
}

// Connect effects in the specified order
export function connectEffectsInOrder(source, effectsConfig, effectNodes, merger, audioContext) {
    let currentNode = source;
    
    // Get enabled effects in order
    const enabledEffects = effectsConfig.filter(e => e.enabled);
    
    if (enabledEffects.length === 0) {
        // No effects enabled, connect directly to output
        source.connect(merger, 0, 0);
        source.connect(merger, 0, 1);
        return;
    }
    
    // Connect effects in order
    for (let i = 0; i < enabledEffects.length; i++) {
        const effect = enabledEffects[i];
        const isLast = i === enabledEffects.length - 1;
        
        switch (effect.id) {
            case 'filter':
                currentNode.connect(effectNodes.filter);
                currentNode = effectNodes.filter;
                break;
                
            case 'reverb':
                // Reverb has wet/dry mix
                const reverbNode = connectReverbEffect(currentNode, effectNodes.reverb, audioContext);
                currentNode = reverbNode;
                break;
                
            case 'delay':
                // Delay has wet/dry mix
                const delayNode = connectDelayEffect(currentNode, effectNodes.delay, audioContext);
                currentNode = delayNode;
                break;
        }
    }
    
    // Connect the final node to the output
    currentNode.connect(merger, 0, 0);
    currentNode.connect(merger, 0, 1);
}

function connectReverbEffect(input, reverbEffects, audioContext) {
    const { convolver, wet, dry } = reverbEffects;
    
    // Reverb path
    input.connect(convolver);
    convolver.connect(wet);
    
    // Dry path
    input.connect(dry);
    
    // Merge wet and dry
    const reverbMix = audioContext.createGain();
    wet.connect(reverbMix);
    dry.connect(reverbMix);
    
    return reverbMix;
}

function connectDelayEffect(input, delayEffects, audioContext) {
    const { node, wet, dry } = delayEffects;
    
    // Delay path
    input.connect(node);
    node.connect(wet);
    
    // Dry path
    input.connect(dry);
    
    // Merge wet and dry
    const delayMix = audioContext.createGain();
    wet.connect(delayMix);
    dry.connect(delayMix);
    
    return delayMix;
}
