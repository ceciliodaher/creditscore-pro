/* =====================================
   TABS.JS - HIERARCHICAL NAVIGATION (Sprint 0)
   Sistema de navegação hierárquica em 2 níveis:
   - Nível 1: Seções principais (1-7)
   - Nível 2: Tabs/Subseções (1-23)

   Baseado na estrutura existente do script.js
   Refatorado para suportar navegação hierárquica
   ===================================== */

class HierarchicalNavigation {
    constructor() {
        // Tab state
        this.currentTab = 1;
        this.currentSection = 1;

        // Section-to-Tab mapping (defines hierarchical structure)
        this.sectionMap = {
            1: [1, 2],           // Identificação (2 tabs)
            2: [3, 4, 5, 6, 7],  // Situação Atual (5 tabs)
            3: [8, 9, 10, 11],   // Operações Projetadas (4 tabs)
            4: [12, 13, 14, 15], // Investimentos e Funding (4 tabs)
            5: [16, 17],         // Integrações (2 tabs)
            6: [18, 19, 20],     // Demonstrativos Projetados (3 tabs)
            7: [21, 22, 23]      // Análises e Decisão (3 tabs)
        };

        // Protected tabs (Analyst mode only)
        this.protectedTabs = [6, 7, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23];

        // Tab states
        this.completedTabs = new Set();
        this.tabsWithErrors = new Set();
        this.tabsWithWarnings = new Set();

        // Detectar tabs no DOM - não lançar erro se não existirem ainda
        const tabItems = document.querySelectorAll('.tab-item');
        this.totalTabs = tabItems.length;

        if (this.totalTabs === 0) {
            console.warn('⚠️ HierarchicalNavigation: Nenhuma aba encontrada ainda');
            console.warn('👉 AÇÃO REQUERIDA: Main app DEVE chamar .initAfterDOM() após generateInterface()');
            console.warn('📋 ORDEM CORRETA: generateInterface() → HierarchicalNavigation() → initAfterDOM()');
            // NÃO chamar init() - será chamado em initAfterDOM()
        } else {
            console.log(`[HierarchicalNavigation] Inicializado com ${this.totalTabs} abas em 7 seções`);
            this.init();
        }
    }

    /**
     * Inicialização tardia após generateInterface() criar as .tab-item no DOM
     * DEVE ser chamado pelo main app após generateInterface()
     */
    initAfterDOM() {
        const tabItems = document.querySelectorAll('.tab-item');
        this.totalTabs = tabItems.length;

        if (this.totalTabs === 0) {
            throw new Error('HierarchicalNavigation.initAfterDOM: Nenhuma aba encontrada (.tab-item). DOM não foi gerado corretamente.');
        }

        console.log(`[HierarchicalNavigation] initAfterDOM: Detectadas ${this.totalTabs} abas em 7 seções`);
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.initializeTabStates();
        this.updateAllStates();
    }

    setupEventListeners() {
        // Section button click events
        const sectionButtons = document.querySelectorAll('.section-btn');
        sectionButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const sectionNumber = parseInt(btn.getAttribute('data-section'));
                this.switchToSection(sectionNumber);
            });
        });

        // Tab click events
        const tabItems = document.querySelectorAll('.tab-item');
        tabItems.forEach(tab => {
            tab.addEventListener('click', (e) => {
                const tabNumber = parseInt(tab.getAttribute('data-tab'));
                this.switchToTab(tabNumber);
            });

            // Keyboard navigation
            tab.addEventListener('keydown', (e) => {
                this.handleKeyboardNavigation(e);
            });
        });

        // Form field change events for auto-validation
        const form = document.getElementById('projectForm');
        if (form) {
            form.addEventListener('input', (e) => {
                this.validateCurrentTabFields();
            });

            form.addEventListener('change', (e) => {
                this.validateCurrentTabFields();
                this.autoSaveData();
            });
        }

        // Window resize event for mobile responsiveness
        window.addEventListener('resize', () => {
            this.updateScrollButtonsVisibility();
        });
    }

    initializeTabStates() {
        // Load any previously saved state
        const savedState = this.loadTabState();
        if (savedState) {
            this.currentTab = savedState.currentTab || 1;
            this.currentSection = this.getSectionForTab(this.currentTab);
            this.completedTabs = new Set(savedState.completedTabs || []);
            this.tabsWithErrors = new Set(savedState.tabsWithErrors || []);
            this.tabsWithWarnings = new Set(savedState.tabsWithWarnings || []);
        }

        this.showTab(this.currentTab);
        this.showSection(this.currentSection);
    }

    /**
     * Switch to a specific section (shows section button and subsection navbar)
     */
    switchToSection(sectionNumber) {
        // ✅ FIX BUG #3: Sistema tem 7 seções, não 9
        if (sectionNumber < 1 || sectionNumber > 7) return;

        this.currentSection = sectionNumber;
        this.showSection(sectionNumber);

        // Switch to first tab of this section
        const firstTab = this.sectionMap[sectionNumber][0];
        this.switchToTab(firstTab);
    }

    /**
     * Show a specific section navbar
     */
    showSection(sectionNumber) {
        // Update section buttons
        const sectionButtons = document.querySelectorAll('.section-btn');
        sectionButtons.forEach(btn => {
            const btnSection = parseInt(btn.getAttribute('data-section'));
            btn.classList.toggle('active', btnSection === sectionNumber);
        });

        // Show/hide subsection navbars
        const subnavbars = document.querySelectorAll('.subsection-navbar');
        subnavbars.forEach(navbar => {
            const parentSection = parseInt(navbar.getAttribute('data-parent-section'));
            navbar.classList.toggle('active', parentSection === sectionNumber);
        });
    }

    /**
     * Switch to a specific tab (with section detection)
     */
    switchToTab(tabNumber) {
        if (tabNumber < 1 || tabNumber > this.totalTabs) return;

        // Proteção para abas protegidas (Analyst mode)
        const targetTab = document.querySelector(`[data-tab="${tabNumber}"]`);
        if (targetTab && this.protectedTabs.includes(tabNumber) && !this.isAnalystMode()) {
            this.showProtectedTabMessage();
            return;
        }

        // Validação opcional - apenas marca se há erros, mas permite navegação
        if (this.currentTab !== tabNumber) {
            this.validateCurrentTabFields();
        }

        // Detect which section this tab belongs to
        const newSection = this.getSectionForTab(tabNumber);
        if (newSection !== this.currentSection) {
            this.currentSection = newSection;
            this.showSection(newSection);
        }

        this.currentTab = tabNumber;
        this.showTab(tabNumber);
        this.updateAllStates();
        this.saveTabState();

        // Auto-save apenas se IndexedDB estiver pronto
        if (this.isIndexedDBReady()) {
            this.autoSaveData();
        }

        // Scroll tab into view if needed
        this.scrollTabIntoView(tabNumber);
    }

    /**
     * Get section number for a given tab
     */
    getSectionForTab(tabNumber) {
        for (const [section, tabs] of Object.entries(this.sectionMap)) {
            if (tabs.includes(tabNumber)) {
                return parseInt(section);
            }
        }
        return 1; // Default to section 1 if not found
    }

    /**
     * Show a specific tab (form section)
     */
    showTab(tabNumber) {
        // Hide all sections (forçar display:none para evitar múltiplas visíveis)
        const sections = document.querySelectorAll('.form-section');
        sections.forEach(section => {
            section.classList.remove('active');
            section.style.display = 'none'; // ✅ CRITICAL: forçar via CSS inline
        });

        // Show target section (forçar display:block)
        // ✅ FIX BUG #1: Seletor específico para evitar conflito com section-buttons
        const targetSection = document.querySelector(`.form-section[data-section="${tabNumber}"]`);
        if (targetSection) {
            targetSection.classList.add('active');
            targetSection.style.display = 'block'; // ✅ CRITICAL: forçar via CSS inline
            targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }

        // Update tab active states
        const tabs = document.querySelectorAll('.tab-item');
        tabs.forEach(tab => {
            const t = parseInt(tab.getAttribute('data-tab'));
            tab.classList.toggle('active', t === tabNumber);
            tab.setAttribute('aria-selected', t === tabNumber ? 'true' : 'false');
        });

        // Update progress text
        this.updateProgressText();
    }

    /**
     * Validate current tab fields (visual markers only)
     */
    validateCurrentTabFields() {
        const currentSection = document.querySelector(`[data-section="${this.currentTab}"]`);
        if (!currentSection) return;

        const requiredFields = currentSection.querySelectorAll('[required]');
        let hasErrors = false;
        let hasWarnings = false;

        requiredFields.forEach(field => {
            const isValid = field.value.trim() !== '';
            field.classList.toggle('error', !isValid);
            if (!isValid) hasErrors = true;
        });

        // Update tab state
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

        this.updateTabStates();
        this.updateSectionStates();
    }

    /**
     * Update visual states of all tabs (completed, error, warning)
     */
    updateTabStates() {
        const tabs = document.querySelectorAll('.tab-item');

        tabs.forEach(tab => {
            const tabNumber = parseInt(tab.getAttribute('data-tab'));

            // Remove all state classes
            tab.classList.remove('completed', 'error', 'warning');

            // Apply appropriate state class
            if (this.tabsWithErrors.has(tabNumber)) {
                tab.classList.add('error');
            } else if (this.tabsWithWarnings.has(tabNumber)) {
                tab.classList.add('warning');
            } else if (this.completedTabs.has(tabNumber)) {
                tab.classList.add('completed');
            }
        });
    }

    /**
     * Update section button states based on child tabs
     */
    updateSectionStates() {
        const sectionButtons = document.querySelectorAll('.section-btn');

        sectionButtons.forEach(btn => {
            const sectionNumber = parseInt(btn.getAttribute('data-section'));
            const tabsInSection = this.sectionMap[sectionNumber] || [];

            // Check if all tabs in section are completed
            const allCompleted = tabsInSection.every(tab => this.completedTabs.has(tab));
            const hasErrors = tabsInSection.some(tab => this.tabsWithErrors.has(tab));
            const hasWarnings = tabsInSection.some(tab => this.tabsWithWarnings.has(tab));

            // Remove all state classes
            btn.classList.remove('completed', 'error', 'warning');

            // Apply appropriate state class
            if (hasErrors) {
                btn.classList.add('error');
            } else if (hasWarnings) {
                btn.classList.add('warning');
            } else if (allCompleted) {
                btn.classList.add('completed');
            }
        });
    }

    /**
     * Update all states (tabs, sections, progress)
     */
    updateAllStates() {
        this.updateTabStates();
        this.updateSectionStates();
        this.updateProgressText();
    }

    /**
     * Update progress text display
     */
    updateProgressText() {
        const progressText = document.getElementById('progressText');
        const completedSections = document.getElementById('completedSections');

        if (progressText) {
            progressText.innerHTML = `${this.totalTabs} seções • <span id="completedSections">${this.completedTabs.size}</span> concluídas`;
        }

        if (completedSections) {
            completedSections.textContent = this.completedTabs.size;
        }

        // Show preview button if all sections are completed
        const previewBtn = document.getElementById('previewBtn');
        if (previewBtn) {
            previewBtn.style.display = this.completedTabs.size === this.totalTabs ? 'inline-flex' : 'none';
        }
    }

    /**
     * Handle keyboard navigation (arrows, home, end)
     */
    handleKeyboardNavigation(e) {
        const currentTabElement = e.target;
        const currentTabNumber = parseInt(currentTabElement.getAttribute('data-tab'));

        switch (e.key) {
            case 'ArrowLeft':
                e.preventDefault();
                if (currentTabNumber > 1) {
                    this.switchToTab(currentTabNumber - 1);
                }
                break;

            case 'ArrowRight':
                e.preventDefault();
                if (currentTabNumber < this.totalTabs) {
                    this.switchToTab(currentTabNumber + 1);
                }
                break;

            case 'Home':
                e.preventDefault();
                this.switchToTab(1);
                break;

            case 'End':
                e.preventDefault();
                this.switchToTab(this.totalTabs);
                break;

            case 'Enter':
            case ' ':
                e.preventDefault();
                this.switchToTab(currentTabNumber);
                break;
        }
    }

    /**
     * Scroll tab into view (for horizontal overflow)
     */
    scrollTabIntoView(tabNumber) {
        const tab = document.querySelector(`[data-tab="${tabNumber}"]`);
        if (!tab) return;

        tab.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest',
            inline: 'center'
        });
    }

    /**
     * Setup scroll buttons (if present in UI)
     */
    setupScrollButtons() {
        const scrollLeft = document.querySelector('.tab-scroll-left');
        const scrollRight = document.querySelector('.tab-scroll-right');
        const scrollContainer = document.querySelector('.tab-scroll-container');

        if (scrollLeft && scrollRight && scrollContainer) {
            scrollLeft.addEventListener('click', () => {
                scrollContainer.scrollBy({ left: -200, behavior: 'smooth' });
            });

            scrollRight.addEventListener('click', () => {
                scrollContainer.scrollBy({ left: 200, behavior: 'smooth' });
            });

            scrollContainer.addEventListener('scroll', () => {
                this.updateScrollButtonsState();
            });

            this.updateScrollButtonsState();
        }
    }

    updateScrollButtonsState() {
        const scrollContainer = document.querySelector('.tab-scroll-container');
        const scrollLeft = document.querySelector('.tab-scroll-left');
        const scrollRight = document.querySelector('.tab-scroll-right');

        if (!scrollContainer || !scrollLeft || !scrollRight) return;

        const canScrollLeft = scrollContainer.scrollLeft > 0;
        const canScrollRight = scrollContainer.scrollLeft <
            (scrollContainer.scrollWidth - scrollContainer.clientWidth);

        scrollLeft.disabled = !canScrollLeft;
        scrollRight.disabled = !canScrollRight;
    }

    updateScrollButtonsVisibility() {
        const scrollContainer = document.querySelector('.tab-scroll-container');
        const scrollButtons = document.querySelector('.tab-scroll-buttons');

        if (!scrollContainer || !scrollButtons) return;

        const needsScrolling = scrollContainer.scrollWidth > scrollContainer.clientWidth;
        scrollButtons.style.display = needsScrolling ? 'flex' : 'none';
    }

    /**
     * Check if Analyst mode is active
     */
    isAnalystMode() {
        // Check if mode toggle exists and is set to "analista"
        const modeToggle = document.querySelector('.mode-btn.active');
        if (modeToggle && modeToggle.textContent.includes('Analista')) {
            return true;
        }

        // Check session storage (legacy)
        if (sessionStorage.getItem('analyst_authenticated') === 'true') {
            return true;
        }

        // Check if body has analyst-mode class
        if (document.body.classList.contains('analyst-mode')) {
            return true;
        }

        return false;
    }

    /**
     * Show message for protected tabs
     */
    showProtectedTabMessage() {
        alert('⚠️ Esta seção é restrita ao modo Analista.\n\nPara acessar, ative o modo Analista no canto superior direito.');
    }

    /**
     * Check if IndexedDB is ready
     */
    isIndexedDBReady() {
        // Verificar se o IndexedDB do módulo está pronto
        if (window.financiamentoModule && typeof window.financiamentoModule.isReady === 'function') {
            return window.financiamentoModule.isReady();
        }
        // Se não há módulo, assume que pode salvar
        return true;
    }

    /**
     * Auto-save data (delegates to external function)
     */
    autoSaveData() {
        // Use existing auto-save function if available
        if (typeof autoSaveData === 'function') {
            autoSaveData();
        } else if (window.financiamentoModule && typeof window.financiamentoModule.autoSave === 'function') {
            window.financiamentoModule.autoSave();
        }
    }

    /**
     * Save tab state to localStorage
     */
    saveTabState() {
        const state = {
            currentTab: this.currentTab,
            currentSection: this.currentSection,
            completedTabs: Array.from(this.completedTabs),
            tabsWithErrors: Array.from(this.tabsWithErrors),
            tabsWithWarnings: Array.from(this.tabsWithWarnings),
            timestamp: Date.now()
        };

        try {
            localStorage.setItem('financiamento_tab_state', JSON.stringify(state));
        } catch (e) {
            console.warn('Could not save tab state to localStorage:', e);
        }
    }

    /**
     * Load tab state from localStorage
     */
    loadTabState() {
        try {
            const saved = localStorage.getItem('financiamento_tab_state');
            return saved ? JSON.parse(saved) : null;
        } catch (e) {
            console.warn('Could not load tab state from localStorage:', e);
            return null;
        }
    }

    // ============================================
    // PUBLIC API METHODS
    // ============================================

    getCurrentTab() {
        return this.currentTab;
    }

    getCurrentSection() {
        return this.currentSection;
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

            const currentSection = document.querySelector(`[data-section="${i}"]`);
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
}

// Export class to window (available immediately for dependency checks)
if (typeof window !== 'undefined') {
    window.HierarchicalNavigation = HierarchicalNavigation;
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = HierarchicalNavigation;
}

// NOTE: Initialization is managed by CreditScoreProApp.initNavigationAndDB()
// REMOVED auto-initialization DOMContentLoaded listener to prevent race condition
// HierarchicalNavigation is now created AFTER generateInterface() creates .tab-item elements
