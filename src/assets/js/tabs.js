/* =====================================
   TABS.JS - SIMPLE TAB NAVIGATION
   Sistema de navegação sequencial de 8 módulos:
   1. Cadastro e Identificação
   2. Demonstrações Financeiras
   3. Análise de Endividamento
   4. Compliance e Verificações
   5. Recursos Humanos
   6. Índices Financeiros (Computado)
   7. Scoring de Crédito (Computado)
   8. Relatórios e Análises (Computado)

   Abordagem híbrida: HTML hardcoded + JavaScript para módulos computados
   ===================================== */

class SimpleTabNavigation {
    constructor() {
        // Tab state
        this.currentTab = 1;
        this.totalTabs = 8;

        // Guards contra loops e re-entrada
        this._switching = false; // Guard para switchTab()
        this._updateTimeout = null; // Timeout para debounce de updateAllStates()

        // Module names (matches data-module attributes)
        this.modules = [
            'cadastro',
            'demonstracoes',
            'endividamento',
            'compliance',
            'recursos-humanos',
            'indices',
            'scoring',
            'relatorios'
        ];

        // Tab states
        this.completedTabs = new Set();
        this.tabsWithErrors = new Set();
        this.tabsWithWarnings = new Set();

        console.log(`[SimpleTabNavigation] Inicializado com ${this.totalTabs} tabs sequenciais`);
    }

    /**
     * Gera estrutura HTML completa de tabs
     * Cria: .tab-list com 8 .tab-item (um para cada módulo)
     */
    generateTabsHTML() {
        const navContainer = document.getElementById('tabNavigation');
        if (!navContainer) {
            throw new Error('SimpleTabNavigation: #tabNavigation não encontrado');
        }

        // Criar tab-list
        const tabList = document.createElement('div');
        tabList.className = 'tab-list';
        tabList.setAttribute('role', 'tablist');

        // Criar tab-item para cada módulo
        this.modules.forEach((moduleName, index) => {
            const tabNumber = index + 1;
            
            // Mapear ícones e labels dos módulos
            const moduleInfo = {
                'cadastro': { icon: '🏢', label: 'Cadastro' },
                'demonstracoes': { icon: '📊', label: 'Demonstrações' },
                'endividamento': { icon: '💳', label: 'Endividamento' },
                'compliance': { icon: '✅', label: 'Compliance' },
                'recursos-humanos': { icon: '👥', label: 'Recursos Humanos' },
                'indices': { icon: '📈', label: 'Índices' },
                'scoring': { icon: '⭐', label: 'Scoring' },
                'relatorios': { icon: '📄', label: 'Relatórios' }
            };

            const info = moduleInfo[moduleName] || { icon: '📄', label: moduleName };

            const tabItem = document.createElement('button');
            tabItem.className = 'tab-item';
            tabItem.setAttribute('role', 'tab');
            tabItem.setAttribute('data-tab', tabNumber);
            tabItem.setAttribute('aria-label', `Módulo ${tabNumber}: ${info.label}`);
            
            tabItem.innerHTML = `
                <span class="tab-number">${tabNumber}</span>
                <span class="tab-label">${info.icon} ${info.label}</span>
                <span class="tab-status"></span>
            `;

            // Click handler
            tabItem.addEventListener('click', () => this.switchTab(tabNumber));

            tabList.appendChild(tabItem);
        });

        // Limpar e adicionar ao container
        navContainer.innerHTML = '';
        navContainer.appendChild(tabList);

        console.log(`[SimpleTabNavigation] ${this.totalTabs} tabs geradas no HTML`);
    }

    /**
     * Inicialização após DOM estar pronto
     * DEVE ser chamado pelo main app após generateInterface()
     */
    async init() {
        this.generateTabsHTML();
        this.setupEventListeners();
        this.loadTabState();
        this.updateAllStates();
        this.showTab(this.currentTab);
        console.log(`[SimpleTabNavigation] init() completo - tab ${this.currentTab} ativa`);
    }

    setupEventListeners() {
        // Navegação entre tabs
        const prevBtn = document.getElementById('prevTab');
        const nextBtn = document.getElementById('nextTab');

        if (prevBtn) {
            prevBtn.addEventListener('click', () => this.previousTab());
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => this.nextTab());
        }

        // Form field change events for auto-save
        const form = document.getElementById('creditScoreForm');
        if (form) {
            form.addEventListener('input', () => {
                this.validateCurrentTabFields();
            });

            form.addEventListener('change', () => {
                this.validateCurrentTabFields();
                this.autoSaveData();
            });
        }

        // Keyboard shortcuts (Ctrl+Arrow)
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                if (e.key === 'ArrowLeft') {
                    e.preventDefault();
                    this.previousTab();
                } else if (e.key === 'ArrowRight') {
                    e.preventDefault();
                    this.nextTab();
                }
            }
        });
    }

    /**
     * Navegar para a próxima tab
     */
    nextTab() {
        if (this.currentTab < this.totalTabs) {
            this.switchTab(this.currentTab + 1);
        }
    }

    /**
     * Navegar para a tab anterior
     */
    previousTab() {
        if (this.currentTab > 1) {
            this.switchTab(this.currentTab - 1);
        }
    }

    /**
     * Trocar para uma tab específica
     */
    switchTab(tabNumber) {
        // ✅ Guard contra re-entrada (evita loop infinito)
        if (this._switching) {
            console.warn(`[SimpleTabNavigation] switchTab(${tabNumber}) bloqueado: já em execução`);
            return;
        }
        this._switching = true;

        if (tabNumber < 1 || tabNumber > this.totalTabs) {
            this._switching = false;
            return;
        }

        // Validar tab atual antes de sair (apenas marca se há erros, mas permite navegação)
        if (this.currentTab !== tabNumber) {
            this.validateCurrentTabFields();
        }

        this.currentTab = tabNumber;

        // ✅ CÁLCULO AUTOMÁTICO: Disparar ao navegar para abas de resultado
        this.handleCalculationTrigger(tabNumber);

        this.showTab(tabNumber);
        this.updateAllStates();
        this.saveTabState();

        // Auto-save apenas se IndexedDB estiver pronto
        if (this.isIndexedDBReady()) {
            this.autoSaveData();
        }

        // ✅ Release guard
        this._switching = false;
    }

    /**
     * Alias para switchTab - compatibilidade com NavigationController
     * @param {number} tabNumber - Número da tab (1-8)
     */
    switchToTab(tabNumber) {
        return this.switchTab(tabNumber);
    }

    /**
     * Mostrar uma tab específica (form section)
     */
    showTab(tabNumber) {
        // Ocultar todas as seções
        const sections = document.querySelectorAll('.form-section');
        sections.forEach(section => {
            section.classList.remove('active');
            section.style.display = 'none';
        });

        // Mostrar a seção target
        const moduleName = this.modules[tabNumber - 1];
        const targetSection = document.querySelector(`[data-module="${moduleName}"]`);

        if (targetSection) {
            targetSection.classList.add('active');
            targetSection.style.display = 'block';
            targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
            console.error(`[SimpleTabNavigation] Seção não encontrada: data-module="${moduleName}"`);
        }

        // Atualizar botões de navegação
        this.updateNavigationButtons();

        // Atualizar barra de progresso
        this.updateProgressBar();

        console.log(`[SimpleTabNavigation] Tab ${tabNumber} (${moduleName}) ativa`);
    }

    /**
     * Atualizar estados dos botões de navegação
     */
    updateNavigationButtons() {
        const prevBtn = document.getElementById('prevTab');
        const nextBtn = document.getElementById('nextTab');

        if (prevBtn) {
            prevBtn.disabled = this.currentTab === 1;
        }

        if (nextBtn) {
            nextBtn.disabled = this.currentTab === this.totalTabs;
            nextBtn.textContent = this.currentTab === this.totalTabs ? 'Finalizar' : 'Próximo';
        }
    }

    /**
     * Atualizar barra de progresso
     */
    updateProgressBar() {
        const progressBar = document.getElementById('progressBar');
        const progressText = document.getElementById('progressText');

        if (progressBar) {
            const percentage = (this.currentTab / this.totalTabs) * 100;
            progressBar.style.width = `${percentage}%`;
        }

        if (progressText) {
            progressText.textContent = `${this.currentTab}/${this.totalTabs} - ${this.modules[this.currentTab - 1]}`;
        }
    }

    /**
     * Validar campos da tab atual (marcadores visuais apenas)
     */
    validateCurrentTabFields() {
        const moduleName = this.modules[this.currentTab - 1];
        const currentSection = document.querySelector(`[data-module="${moduleName}"]`);

        if (!currentSection) return;

        const requiredFields = currentSection.querySelectorAll('[required]');
        let hasErrors = false;
        let hasWarnings = false;

        requiredFields.forEach(field => {
            const isValid = field.value.trim() !== '';
            field.classList.toggle('error', !isValid);
            if (!isValid) hasErrors = true;
        });

        // Atualizar estado da tab
        if (hasErrors) {
            this.tabsWithErrors.add(this.currentTab);
            this.completedTabs.delete(this.currentTab);
            this.tabsWithWarnings.delete(this.currentTab);
        } else if (hasWarnings) {
            this.tabsWithWarnings.add(this.currentTab);
            this.tabsWithErrors.delete(this.currentTab);
        } else {
            this.completedTabs.add(this.currentTab);
            this.tabsWithErrors.delete(this.currentTab);
            this.tabsWithWarnings.delete(this.currentTab);
        }

        this.updateAllStates();
    }

    /**
     * Atualizar todos os estados (tabs, progresso)
     */
    updateAllStates() {
        // ✅ Debounce para evitar chamadas em rápida sucessão
        if (this._updateTimeout) {
            clearTimeout(this._updateTimeout);
        }

        this._updateTimeout = setTimeout(() => {
            this.updateProgressBar();
            this.updateNavigationButtons();
            this.updateProgressText();

            // ✅ Limpar TODAS as classes de estado antes de reaplicar (evita acúmulo)
            const allTabs = document.querySelectorAll('.tab-item');
            allTabs.forEach(tab => {
                tab.classList.remove('active', 'completed', 'error', 'warning');
            });

            // Atualizar visual de todas as tabs
            for (let i = 1; i <= this.totalTabs; i++) {
                this.updateTabVisualState(i);
            }

            this._updateTimeout = null;
        }, 10); // 10ms debounce
    }

    /**
     * Atualizar texto de progresso
     */
    updateProgressText() {
        const progressText = document.getElementById('progressText');
        if (progressText) {
            const completed = this.completedTabs.size;
            progressText.textContent = `${this.currentTab}/${this.totalTabs} - ${completed} concluídas`;
        }
    }

    /**
     * Atualiza estado visual de uma tab específica
     * @param {number} tabNumber - Número da tab (1-8)
     */
    updateTabVisualState(tabNumber) {
        const tabItem = document.querySelector(`.tab-item[data-tab="${tabNumber}"]`);
        if (!tabItem) return;

        // Remover todas as classes de estado
        tabItem.classList.remove('active', 'completed', 'error', 'warning');

        // Aplicar nova classe baseada no estado
        if (this.currentTab === tabNumber) {
            tabItem.classList.add('active');
        } else if (this.tabsWithErrors.has(tabNumber)) {
            tabItem.classList.add('error');
        } else if (this.tabsWithWarnings.has(tabNumber)) {
            tabItem.classList.add('warning');
        } else if (this.completedTabs.has(tabNumber)) {
            tabItem.classList.add('completed');
        }
    }

    /**
     * Check if IndexedDB is ready
     */
    isIndexedDBReady() {
        if (window.creditScoreModule && typeof window.creditScoreModule.isReady === 'function') {
            return window.creditScoreModule.isReady();
        }
        return true;
    }

    /**
     * Auto-save data (delegates to external function)
     */
    autoSaveData() {
        if (typeof autoSaveData === 'function') {
            autoSaveData();
        } else if (window.creditScoreModule && typeof window.creditScoreModule.autoSave === 'function') {
            window.creditScoreModule.autoSave();
        }
    }

    /**
     * Save tab state to localStorage
     */
    saveTabState() {
        const state = {
            currentTab: this.currentTab,
            completedTabs: Array.from(this.completedTabs),
            tabsWithErrors: Array.from(this.tabsWithErrors),
            tabsWithWarnings: Array.from(this.tabsWithWarnings),
            timestamp: Date.now()
        };

        try {
            localStorage.setItem('creditscore_tab_state', JSON.stringify(state));
        } catch (e) {
            console.warn('Could not save tab state to localStorage:', e);
        }
    }

    /**
     * Load tab state from localStorage
     */
    loadTabState() {
        try {
            const saved = localStorage.getItem('creditscore_tab_state');
            if (!saved) return;

            const state = JSON.parse(saved);

            // ✅ Validar estrutura do estado salvo
            if (!this.#validateTabState(state)) {
                console.warn('[SimpleTabNavigation] Estado corrompido detectado - limpando localStorage');
                localStorage.removeItem('creditscore_tab_state');
                return;
            }

            // ✅ Restaurar apenas valores válidos
            this.currentTab = state.currentTab;
            this.completedTabs = new Set(state.completedTabs);
            this.tabsWithErrors = new Set(state.tabsWithErrors);
            this.tabsWithWarnings = new Set(state.tabsWithWarnings);

            console.log(`[SimpleTabNavigation] Estado restaurado: tab ${this.currentTab}`);
        } catch (e) {
            console.warn('[SimpleTabNavigation] Erro ao carregar estado - limpando:', e);
            localStorage.removeItem('creditscore_tab_state');
        }
    }

    /**
     * Valida estrutura do estado salvo
     * @private
     */
    #validateTabState(state) {
        // Validar tipos básicos
        if (!state || typeof state !== 'object') return false;

        // Validar currentTab
        const currentTab = parseInt(state.currentTab);
        if (isNaN(currentTab) || currentTab < 1 || currentTab > this.totalTabs) {
            return false;
        }

        // Validar arrays de tabs
        const tabArrays = [
            state.completedTabs,
            state.tabsWithErrors,
            state.tabsWithWarnings
        ];

        for (const arr of tabArrays) {
            if (!Array.isArray(arr)) return false;

            // Validar cada tab no array
            for (const tabNum of arr) {
                const num = parseInt(tabNum);
                if (isNaN(num) || num < 1 || num > this.totalTabs) {
                    return false;
                }
            }
        }

        return true;
    }

    // ============================================
    // PUBLIC API METHODS
    // ============================================

    getCurrentTab() {
        return this.currentTab;
    }

    getCompletedTabs() {
        return Array.from(this.completedTabs);
    }

    markTabAsCompleted(tabNumber) {
        this.completedTabs.add(tabNumber);
        this.tabsWithErrors.delete(tabNumber);
        this.tabsWithWarnings.delete(tabNumber);
        this.updateAllStates();
        this.saveTabState();
    }

    markTabAsError(tabNumber) {
        this.tabsWithErrors.add(tabNumber);
        this.completedTabs.delete(tabNumber);
        this.tabsWithWarnings.delete(tabNumber);
        this.updateAllStates();
        this.saveTabState();
    }

    markTabAsWarning(tabNumber) {
        this.tabsWithWarnings.add(tabNumber);
        this.tabsWithErrors.delete(tabNumber);
        this.updateAllStates();
        this.saveTabState();
    }

    validateAllTabs() {
        let allValid = true;

        for (let i = 1; i <= this.totalTabs; i++) {
            const originalTab = this.currentTab;
            this.currentTab = i;

            const moduleName = this.modules[i - 1];
            const currentSection = document.querySelector(`[data-module="${moduleName}"]`);

            if (!currentSection) continue;

            const requiredFields = currentSection.querySelectorAll('[required]');
            let hasErrors = false;

            requiredFields.forEach(field => {
                if (!field.value.trim()) {
                    hasErrors = true;
                }
            });

            if (hasErrors) {
                this.markTabAsError(i);
                allValid = false;
            } else {
                this.markTabAsCompleted(i);
            }

            this.currentTab = originalTab;
        }

        return allValid;
    }

    /**
     * Dispara cálculo automático ao navegar para abas de resultado
     * Integrado com CalculationOrchestrator e CalculationState
     * @param {number} tabNumber
     */
    async handleCalculationTrigger(tabNumber) {
        // Abas de resultado que requerem cálculo
        const resultTabs = [6, 7, 8]; // Índices, Scoring, Relatórios

        if (!resultTabs.includes(tabNumber)) {
            return; // Não é aba de resultado, não faz nada
        }

        // Verificar se orchestrator está disponível
        if (!window.calculationOrchestrator) {
            console.warn('[TabNavigation] CalculationOrchestrator não disponível');
            return;
        }

        if (!window.calculationState) {
            console.warn('[TabNavigation] CalculationState não disponível');
            return;
        }

        const state = window.calculationState.getState();

        // Verificar se precisa recalcular
        const needsCalculation = state.dataChanged || !state.lastCalculated;

        if (!needsCalculation) {
            console.log(`[TabNavigation] Cálculos já atualizados, não é necessário recalcular`);
            return;
        }

        console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        console.log(`🎯 [TabNavigation] Aba ${tabNumber} - Disparando cálculo automático`);
        console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

        try {
            // Mostrar loading overlay
            this.showCalculatingOverlay();

            // Executar cálculos via orchestrator
            const results = await window.calculationOrchestrator.performAllCalculations();

            // Ocultar loading
            this.hideCalculatingOverlay();

            // Mostrar toast de sucesso
            this.showToast('Cálculos atualizados com sucesso', 'success');

            console.log('✅ [TabNavigation] Cálculo automático concluído');

        } catch (error) {
            // Ocultar loading
            this.hideCalculatingOverlay();

            // Tratar erro
            this.handleCalculationError(error);

            console.error('❌ [TabNavigation] Erro no cálculo automático:', error);
        }
    }

    /**
     * Mostra overlay de loading durante cálculo
     */
    showCalculatingOverlay() {
        const overlay = document.createElement('div');
        overlay.className = 'calculating-overlay';
        overlay.id = 'calculatingOverlay';
        overlay.innerHTML = `
            <div class="spinner"></div>
            <p>Calculando índices financeiros...</p>
            <small>Processando dados e validações</small>
        `;

        const activeSection = document.querySelector('.form-section.active');
        if (activeSection) {
            activeSection.style.position = 'relative';
            activeSection.appendChild(overlay);
        }
    }

    /**
     * Oculta overlay de loading
     */
    hideCalculatingOverlay() {
        const overlay = document.getElementById('calculatingOverlay');
        if (overlay) {
            overlay.remove();
        }
    }

    /**
     * Exibe toast notification
     * @param {string} message
     * @param {string} type - 'success', 'error', 'warning', 'info'
     */
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;

        document.body.appendChild(toast);

        // Auto-remove após 3 segundos
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease-out forwards';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    /**
     * Trata erros de cálculo
     * @param {Error} error
     */
    handleCalculationError(error) {
        if (error.name === 'ValidationError') {
            // Erro de validação - mostrar campos faltantes
            const errorList = error.errors.map(err => err.message).join('\n');

            this.showToast(
                `Dados incompletos: ${error.errors.length} campos precisam ser preenchidos`,
                'error'
            );

            console.error('Erros de validação:', errorList);

        } else {
            // Erro genérico
            this.showToast(
                `Erro ao calcular: ${error.message}`,
                'error'
            );
        }
    }
}

// Export class to window (available immediately for dependency checks)
if (typeof window !== 'undefined') {
    window.SimpleTabNavigation = SimpleTabNavigation;
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SimpleTabNavigation;
}

// NOTE: Initialization is managed by CreditScoreProApp.initNavigationAndDB()
// SimpleTabNavigation is created AFTER form generation in analise-credito.html
