/* =====================================
   CONFIG-LOADER.JS
   Carregador e Validador de Configuração
   Responsável por carregar e validar configurações do sistema
   SOLID - Single Responsibility Principle
   ===================================== */

class ConfigLoader {
    constructor(config = null) {
        this.config = config;
        this.validated = false;
        this.errors = [];
        
        console.log('✅ ConfigLoader instanciado');
    }
    
    /**
     * Inicializa o loader
     */
    async init() {
        if (this.config) {
            this.validateConfig(this.config);
        }
        
        console.log('✅ ConfigLoader inicializado');
    }
    
    /**
     * Carrega configuração de arquivo
     */
    async loadFromFile(filePath) {
        try {
            const response = await fetch(filePath);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            this.config = await response.json();
            this.validateConfig(this.config);
            
            console.log(`✅ Configuração carregada de: ${filePath}`);
            return this.config;
            
        } catch (error) {
            throw new Error(`Erro ao carregar configuração: ${error.message}`);
        }
    }
    
    /**
     * Valida estrutura da configuração
     */
    validateConfig(config) {
        this.errors = [];
        
        // Validações obrigatórias
        this.validateRequired(config, 'systemName', 'string');
        this.validateRequired(config, 'version', 'string');
        this.validateRequired(config, 'modules', 'object');
        this.validateRequired(config, 'database', 'object');
        
        // Validações de módulos
        if (config.modules && Array.isArray(config.modules)) {
            config.modules.forEach((module, index) => {
                this.validateModule(module, index);
            });
        } else {
            this.errors.push('modules deve ser um array');
        }
        
        // Validações de database
        if (config.database) {
            this.validateDatabase(config.database);
        }
        
        // Validações de scoring (se presente)
        if (config.scoring) {
            this.validateScoring(config.scoring);
        }
        
        // Verificar se há erros
        if (this.errors.length > 0) {
            throw new Error(`Configuração inválida:\n${this.errors.join('\n')}`);
        }
        
        this.validated = true;
        console.log('✅ Configuração validada com sucesso');
    }
    
    /**
     * Valida campo obrigatório
     */
    validateRequired(obj, key, type) {
        if (!obj.hasOwnProperty(key)) {
            this.errors.push(`Campo obrigatório ausente: ${key}`);
            return false;
        }
        
        if (typeof obj[key] !== type) {
            this.errors.push(`Campo ${key} deve ser do tipo ${type}`);
            return false;
        }
        
        return true;
    }
    
    /**
     * Valida configuração de módulo
     */
    validateModule(module, index) {
        const prefix = `modules[${index}]`;
        
        if (!this.validateRequired(module, 'id', 'number')) return;
        if (!this.validateRequired(module, 'name', 'string')) return;
        if (!this.validateRequired(module, 'title', 'string')) return;
        if (!this.validateRequired(module, 'enabled', 'boolean')) return;
        
        // Validar ordem
        if (module.hasOwnProperty('order') && typeof module.order !== 'number') {
            this.errors.push(`${prefix}.order deve ser um número`);
        }
        
        // Validar dependências (se presente)
        if (module.dependencies && !Array.isArray(module.dependencies)) {
            this.errors.push(`${prefix}.dependencies deve ser um array`);
        }
    }
    
    /**
     * Valida configuração de database
     */
    validateDatabase(database) {
        if (!this.validateRequired(database, 'name', 'string')) return;
        if (!this.validateRequired(database, 'version', 'number')) return;
        if (!this.validateRequired(database, 'stores', 'object')) return;
        
        // Validar stores
        Object.entries(database.stores).forEach(([storeName, storeConfig]) => {
            this.validateStore(storeConfig, `database.stores.${storeName}`);
        });
    }
    
    /**
     * Valida configuração de store
     */
    validateStore(store, prefix) {
        if (!this.validateRequired(store, 'keyPath', 'string')) return;
        
        // Validar índices (se presente)
        if (store.indexes) {
            if (typeof store.indexes !== 'object') {
                this.errors.push(`${prefix}.indexes deve ser um objeto`);
            }
        }
    }
    
    /**
     * Valida configuração de scoring
     */
    validateScoring(scoring) {
        // Validar categorias
        if (scoring.categorias) {
            if (typeof scoring.categorias !== 'object') {
                this.errors.push('scoring.categorias deve ser um objeto');
                return;
            }
            
            Object.entries(scoring.categorias).forEach(([categoria, config]) => {
                if (typeof config.peso !== 'number') {
                    this.errors.push(`scoring.categorias.${categoria}.peso deve ser um número`);
                }
            });
        }
        
        // Validar classificações
        if (scoring.classificacoes) {
            if (!Array.isArray(scoring.classificacoes)) {
                this.errors.push('scoring.classificacoes deve ser um array');
                return;
            }
            
            scoring.classificacoes.forEach((classificacao, index) => {
                const prefix = `scoring.classificacoes[${index}]`;
                
                if (!this.validateRequired(classificacao, 'rating', 'string')) return;
                if (!this.validateRequired(classificacao, 'min', 'number')) return;
                if (!this.validateRequired(classificacao, 'max', 'number')) return;
                
                if (classificacao.min >= classificacao.max) {
                    this.errors.push(`${prefix}: min deve ser menor que max`);
                }
            });
        }
    }
    
    /**
     * Obtém configuração validada
     */
    getConfig() {
        if (!this.validated) {
            throw new Error('Configuração não foi validada');
        }
        
        return this.config;
    }
    
    /**
     * Obtém módulo por nome
     */
    getModule(name) {
        if (!this.validated) {
            throw new Error('Configuração não foi validada');
        }
        
        return this.config.modules.find(module => module.name === name);
    }
    
    /**
     * Obtém módulos habilitados ordenados
     */
    getEnabledModules() {
        if (!this.validated) {
            throw new Error('Configuração não foi validada');
        }
        
        return this.config.modules
            .filter(module => module.enabled)
            .sort((a, b) => (a.order || 0) - (b.order || 0));
    }
    
    /**
     * Verifica se módulo está habilitado
     */
    isModuleEnabled(name) {
        const module = this.getModule(name);
        return module ? module.enabled : false;
    }
    
    /**
     * Obtém configuração de scoring
     */
    getScoringConfig() {
        if (!this.validated) {
            throw new Error('Configuração não foi validada');
        }
        
        return this.config.scoring || null;
    }
    
    /**
     * Obtém configuração de database
     */
    getDatabaseConfig() {
        if (!this.validated) {
            throw new Error('Configuração não foi validada');
        }
        
        return this.config.database;
    }
    
    /**
     * Obtém regras de validação
     */
    getValidationRules() {
        if (!this.validated) {
            throw new Error('Configuração não foi validada');
        }
        
        return this.config.validationRules || {};
    }
    
    /**
     * Obtém configuração de UI
     */
    getUIConfig() {
        if (!this.validated) {
            throw new Error('Configuração não foi validada');
        }
        
        return this.config.ui || {};
    }
    
    /**
     * Exporta configuração para JSON
     */
    exportConfig() {
        if (!this.validated) {
            throw new Error('Configuração não foi validada');
        }
        
        return JSON.stringify(this.config, null, 2);
    }
    
    /**
     * Clona a configuração
     */
    cloneConfig() {
        if (!this.validated) {
            throw new Error('Configuração não foi validada');
        }
        
        return JSON.parse(JSON.stringify(this.config));
    }
}

// Disponibilizar globalmente
window.ConfigLoader = ConfigLoader;

console.log('✅ ConfigLoader carregado');