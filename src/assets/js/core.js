/* =====================================
   CORE.JS
   Funcionalidades compartilhadas entre CEI e ProGoiás
   NO FALLBACKS - NO MOCK DATA
   ===================================== */

class FormCore {
    constructor(config) {
        if (!config) {
            throw new Error('FormCore: configuração obrigatória não fornecida');
        }
        
        if (!config.programType) {
            throw new Error('FormCore: tipo de programa (programType) é obrigatório');
        }
        
        if (!config.totalSteps) {
            throw new Error('FormCore: número total de steps (totalSteps) é obrigatório');
        }
        
        this.config = config;
        this.currentStep = 1;
        this.formData = {};
        this.uploadedFiles = {};
        this.validationErrors = new Map();
        
        this.elements = this.getDOMElements();
        this.init();
    }
    
    getDOMElements() {
        const form = document.getElementById('projectForm');
        
        if (!form) throw new Error('FormCore: elemento #projectForm não encontrado');
        
        return {
            form,
            progressText: document.getElementById('progressText'),
            saveStatus: document.getElementById('saveStatus'),
            previewModal: document.getElementById('previewModal'),
            previewContent: document.getElementById('previewContent'),
            modalClose: document.querySelector('#previewModal .modal-close'),
            editBtn: document.getElementById('editBtn')
        };
    }
    
    init() {
        // Tab navigation is handled by tabs.js
        // Only setup form data collection
        this.elements.form.addEventListener('input', () => this.collectAndSaveData());
        this.elements.form.addEventListener('change', () => this.collectAndSaveData());
        
        document.addEventListener('blur', (e) => {
            // Validar que e.target é um Element antes de chamar matches()
            if (e.target && typeof e.target.matches === 'function' && e.target.matches('.form-control')) {
                this.validateField(e.target);
            }
        }, true);
        
        this.updateProgressBar();
        this.updateNavigationButtons();
        this.showSection(this.currentStep);
        this.checkForSavedData();
    }
    
    goToNextStep() {
        // Navigation is now handled by tabs.js
        if (window.tabNavigation) {
            const nextTab = window.tabNavigation.getCurrentTab() + 1;
            window.tabNavigation.switchToTab(nextTab);
        }
    }
    
    goToPreviousStep() {
        // Navigation is now handled by tabs.js
        if (window.tabNavigation) {
            const prevTab = window.tabNavigation.getCurrentTab() - 1;
            window.tabNavigation.switchToTab(prevTab);
        }
    }
    
    showSection(step) {
        // Section visibility is now handled by tabs.js
        // This method is kept for compatibility
        if (window.tabNavigation) {
            window.tabNavigation.switchToTab(step);
        }
    }
    
    updateStepIndicators(currentStep) {
        // Step indicators are now handled by tabs.js
        // This method is kept for compatibility but does nothing
    }
    
    updateProgressBar() {
        // Progress is now handled by the tab system
        // This method is kept for compatibility but does nothing
    }
    
    updateNavigationButtons() {
        // Navigation is now handled by tabs
        // This method is kept for compatibility but does nothing
    }
    
    validateCurrentSection() {
        const currentSection = document.querySelector(`[data-section="${this.currentStep}"]`);
        const requiredFields = currentSection.querySelectorAll('[required]');
        let isValid = true;
        
        requiredFields.forEach(field => {
            if (!this.validateField(field)) {
                isValid = false;
            }
        });
        
        return isValid;
    }
    
    validateField(field) {
        const fieldName = field.name;
        if (!fieldName) {
            throw new Error('Campo sem atributo name encontrado');
        }
        
        this.clearFieldError(field);
        
        if (field.hasAttribute('required') && !field.value.trim()) {
            this.setFieldError(field, 'Este campo é obrigatório');
            return false;
        }
        
        if (field.type === 'email' && field.value && !this.isValidEmail(field.value)) {
            this.setFieldError(field, 'E-mail inválido');
            return false;
        }
        
        if (field.dataset.validation === 'cnpj' && field.value && !this.isValidCNPJ(field.value)) {
            this.setFieldError(field, 'CNPJ inválido');
            return false;
        }
        
        return true;
    }
    
    isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }
    
    isValidCNPJ(cnpj) {
        const digits = cnpj.replace(/\D/g, '');
        if (digits.length !== 14) return false;
        if (/^(\d)\1{13}$/.test(digits)) return false;
        return true;
    }
    
    setFieldError(field, message) {
        field.classList.add('error');
        
        let errorElement = field.parentNode.querySelector('.error-message');
        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.className = 'error-message show';
            field.parentNode.appendChild(errorElement);
        }
        
        errorElement.textContent = message;
        this.validationErrors.set(field.name, message);
    }
    
    clearFieldError(field) {
        field.classList.remove('error');
        const errorElement = field.parentNode.querySelector('.error-message');
        if (errorElement) {
            errorElement.remove();
        }
        this.validationErrors.delete(field.name);
    }
    
    collectAndSaveData() {
        this.collectFormData();
        this.saveToLocalStorage();
        
        if (this.elements.saveStatus) {
            this.elements.saveStatus.textContent = '💾 Salvo automaticamente';
        }
    }
    
    collectFormData() {
        const formData = new FormData(this.elements.form);
        this.formData = {};

        for (const [key, value] of formData.entries()) {
            // Skip File objects
            if (value instanceof File) {
                continue;
            }
            // Only add non-empty string values
            if (typeof value === 'string' && value.trim()) {
                this.formData[key] = value;
            }
        }

        this.formData._metadata = {
            programType: this.config.programType,
            currentStep: this.currentStep,
            lastModified: new Date().toISOString()
        };
    }

    getFormData() {
        return this.formData;
    }
    
    saveToLocalStorage() {
        const storageKey = `formData_${this.config.programType}`;
        const dataToSave = {
            formData: this.formData,
            currentStep: this.currentStep,
            savedAt: new Date().toISOString()
        };
        
        localStorage.setItem(storageKey, JSON.stringify(dataToSave));
    }
    
    checkForSavedData() {
        const storageKey = `formData_${this.config.programType}`;
        const savedData = localStorage.getItem(storageKey);
        
        if (!savedData) {
            return;
        }
        
        const parsedData = JSON.parse(savedData);
        
        if (Object.keys(parsedData.formData).length > 0) {
            const shouldRestore = confirm(`Dados salvos encontrados. Restaurar?`);
            if (shouldRestore) {
                this.restoreFormData(parsedData);
            }
        }
    }
    
    restoreFormData(savedData) {
        if (!savedData || !savedData.formData) {
            throw new Error('Dados salvos inválidos para restauração');
        }

        this.formData = savedData.formData;

        // Restaurar step salvo OU começar do 1 se ausente
        if (savedData.currentStep !== undefined && savedData.currentStep !== null) {
            this.currentStep = savedData.currentStep;
        } else {
            this.currentStep = 1;
        }

        // Popular campos
        Object.entries(this.formData).forEach(([key, value]) => {
            if (key.startsWith('_')) return;

            const field = document.querySelector(`[name="${key}"]`);
            if (field) {
                field.value = value;
                // Disparar eventos para atualizar cálculos automáticos
                field.dispatchEvent(new Event('change', { bubbles: true }));
                field.dispatchEvent(new Event('input', { bubbles: true }));
            }
        });

        // CORREÇÃO: Ocultar todas as seções antes de mostrar a correta
        const allSections = document.querySelectorAll('.form-section');
        allSections.forEach(section => {
            section.style.display = 'none';
            section.classList.remove('active');
        });

        // Mostrar apenas a seção salva
        this.showSection(this.currentStep);
        this.updateProgressBar();
        this.updateNavigationButtons();

        // Disparar evento customizado após restauração completa
        document.dispatchEvent(new CustomEvent('formDataRestored', {
            detail: { formData: this.formData, currentStep: this.currentStep }
        }));

        // Recalcular percentuais imediatamente (fix somatório 0%)
        if (window.PercentageCalculator) {
            window.PercentageCalculator.recalculateAll();
            console.log('[Core] Percentuais recalculados');
        }

        console.log(`[Core] Dados restaurados - navegando para seção ${this.currentStep}`);
    }
    
    clearAllData() {
        const storageKey = `formData_${this.config.programType}`;
        localStorage.removeItem(storageKey);
        this.formData = {};
        this.currentStep = 1;
        this.elements.form.reset();
        this.showSection(1);
        this.updateProgressBar();
        this.updateNavigationButtons();
    }
}

const FormUtils = {
    formatCNPJ(value) {
        const digits = value.replace(/\D/g, '');
        return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    },
    
    formatPhone(value) {
        const digits = value.replace(/\D/g, '');
        if (digits.length === 11) {
            return digits.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
        }
        return value;
    },
    
    formatCurrency(value) {
        const number = parseFloat(value.replace(/[^\d.,]/g, '').replace(',', '.'));
        if (isNaN(number)) {
            throw new Error('Valor monetário inválido');
        }
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(number);
    }
};