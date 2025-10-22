/* =====================================
   CREDITSCORE-MODULE.JS
   Módulo Principal - Orquestrador
   Sistema de Análise de Crédito e Compliance Financeiro
   Integra: Calculadores + Análise + Scoring + Compliance
   NO HARDCODED DATA - NO FALLBACKS - KISS - DRY - SOLID
   ===================================== */

import { FormGenerator } from './form-generator.js';
import { NavigationController } from './navigation-controller.js';
import { AutoSave } from './auto-save.js';

class CreditScoreModule {
    constructor(config) {
        // Validação explícita - NO FALLBACKS
        if (!config) {
            throw new Error('CreditScoreModule: config obrigatória não fornecida');
        }

        if (!config.database) {
            throw new Error('CreditScoreModule: config.database obrigatório');
        }

        if (!config.database.name) {
            throw new Error('CreditScoreModule: config.database.name obrigatório');
        }

        if (!config.database.version) {
            throw new Error('CreditScoreModule: config.database.version obrigatório');
        }

        this.config = config;
        this.dbName = config.database.name;
        this.dbVersion = config.database.version;
        this.db = null;
        this.dadosFormulario = new Map();

        // Core infrastructure
        this.formGenerator = null;
        this.navigationController = null;
        this.autoSave = null;
        this.dbManager = null; // Proxy to CreditscoreIndexedDB static methods
        this.hierarchicalNav = null; // tabs.js instance
        this.messages = null;

        // Calculadores
        this.indicesCalculator = null;
        this.scoringEngine = null;
        this.analiseCalculator = null;
        this.capitalGiroCalculator = null;

        // Compliance
        this.complianceChecker = null;

        // Exportadores
        this.exportadorExcel = null;
        this.exportadorPDF = null;

        console.log('✅ CreditScoreModule instanciado');
    }
    
    // ==========================================
    // INICIALIZAÇÃO
    // ==========================================

    /**
     * Inicializa o módulo completo
     */
    async init() {
        try {
            console.log('🚀 Inicializando Sistema de Análise de Crédito...');

            // Verificar configuração obrigatória
            this.validarConfiguracao();

            // Verificar dependências obrigatórias
            this.verificarDependencias();

            // Inicializar infraestrutura core (FormGenerator, NavigationController, AutoSave)
            await this.initCoreInfrastructure();

            // Inicializar IndexedDB
            await this.initIndexedDB();

            // Inicializar calculadores
            await this.initCalculadores();

            // Inicializar compliance checker
            await this.initCompliance();

            // Inicializar exportadores
            await this.initExportadores();

            console.log('✅ CreditScoreModule inicializado com sucesso');

        } catch (error) {
            console.error('❌ Erro ao inicializar CreditScoreModule:', error);
            throw error;
        }
    }

    /**
     * Inicializa infraestrutura core com Dependency Injection
     *
     * ⚠️ ATENÇÃO: Este módulo usa Dependency Injection
     * As dependências DEVEM ser injetadas ANTES de chamar init():
     * - this.hierarchicalNav (HierarchicalNavigation instance)
     * - this.navigationController (NavigationController instance)
     * - this.autoSave (AutoSave instance)
     * - this.dbManager (dbManager proxy)
     * - this.formGenerator (FormGenerator instance)
     *
     * ORDEM CORRETA NO MAIN APP:
     * 1. const creditScore = new CreditScoreModule(config)
     * 2. creditScore.hierarchicalNav = hierarchicalNav
     * 3. creditScore.navigationController = navigationController
     * 4. creditScore.autoSave = autoSave
     * 5. creditScore.dbManager = dbManager
     * 6. creditScore.formGenerator = formGenerator
     * 7. await creditScore.init() // <-- Valida dependências injetadas
     *
     * @throws {Error} Se qualquer dependência não foi injetada ou é inválida
     */
    async initCoreInfrastructure() {
        console.log('🔧 Validando dependências injetadas...');

        // 1. Validar que HierarchicalNavigation foi injetado
        if (!this.hierarchicalNav) {
            throw new Error('CreditScoreModule: hierarchicalNav não foi injetado - obrigatório. Main app deve injetar via creditScore.hierarchicalNav = ...');
        }

        // Validar que é uma instância válida (tem getCurrentTab)
        if (typeof this.hierarchicalNav.getCurrentTab !== 'function') {
            throw new Error('CreditScoreModule: hierarchicalNav injetado não possui API esperada (getCurrentTab)');
        }

        // 2. Validar que NavigationController foi injetado
        if (!this.navigationController) {
            throw new Error('CreditScoreModule: navigationController não foi injetado - obrigatório. Main app deve injetar via creditScore.navigationController = ...');
        }

        // 3. Validar que AutoSave foi injetado
        if (!this.autoSave) {
            throw new Error('CreditScoreModule: autoSave não foi injetado - obrigatório. Main app deve injetar via creditScore.autoSave = ...');
        }

        // 4. Validar que dbManager foi injetado
        if (!this.dbManager) {
            throw new Error('CreditScoreModule: dbManager não foi injetado - obrigatório. Main app deve injetar via creditScore.dbManager = ...');
        }

        // Validar API esperada
        if (typeof this.dbManager.save !== 'function' || typeof this.dbManager.get !== 'function') {
            throw new Error('CreditScoreModule: dbManager injetado não possui API esperada (save, get)');
        }

        // 5. Validar que FormGenerator foi injetado
        if (!this.formGenerator) {
            throw new Error('CreditScoreModule: formGenerator não foi injetado - obrigatório. Main app deve injetar via creditScore.formGenerator = ...');
        }

        // 6. Validar que messages.json foi carregado globalmente
        if (!window.MESSAGES) {
            throw new Error('CreditScoreModule: window.MESSAGES não disponível - messages.json deve ser carregado');
        }
        this.messages = window.MESSAGES;

        // 7. Conectar eventos entre componentes
        this.setupCoreEventListeners();

        console.log('✅ Todas as dependências validadas com sucesso');
        console.log('✅ Infraestrutura core inicializada');
    }

    /**
     * Configura listeners de eventos entre os componentes core
     */
    setupCoreEventListeners() {
        // FormGenerator -> AutoSave (marcar dados como dirty)
        document.addEventListener('fieldChanged', (event) => {
            const { field, value, moduleId } = event.detail;
            console.log(`📝 Campo alterado: ${field} no módulo ${moduleId}`);

            // AutoSave vai detectar mudanças automaticamente através do mutation observer
            // Mas podemos forçar um save se necessário
            if (this.autoSave) {
                this.autoSave.markDirty();
            }
        });

        // FormGenerator -> NavigationController (módulo completado)
        document.addEventListener('moduleCompleted', (event) => {
            const { moduleId, completionData } = event.detail;
            console.log(`✅ Módulo ${moduleId} completado`);

            if (this.navigationController) {
                this.navigationController.markModuleComplete(moduleId, completionData);
            }
        });

        // NavigationController -> AutoSave (progresso atualizado)
        document.addEventListener('progressUpdated', (event) => {
            const { progress } = event.detail;
            console.log(`📊 Progresso atualizado: ${progress.percentage}%`);

            // Trigger auto-save quando progresso é atualizado
            if (this.autoSave) {
                this.autoSave.markDirty();
            }
        });

        // AutoSave -> Notificação ao usuário (dados restaurados)
        document.addEventListener('autoSaveRestored', (event) => {
            const { timestamp, dataSize } = event.detail;
            console.log(`💾 Auto-save restaurado: ${new Date(timestamp).toLocaleString()}`);

            // Notificar usuário via toast ou modal
            this.notifyUser({
                type: 'info',
                title: 'Dados Restaurados',
                message: `Seus dados foram restaurados automaticamente (${dataSize} bytes salvos em ${new Date(timestamp).toLocaleString()})`
            });
        });

        // AutoSave -> Notificação ao usuário (auto-save realizado)
        document.addEventListener('autoSaveCompleted', (event) => {
            const { timestamp, dataSize } = event.detail;
            this.atualizarStatusSave(`Salvo às ${new Date(timestamp).toLocaleTimeString()}`, 'success');
        });

        // AutoSave -> Notificação ao usuário (erro no auto-save)
        document.addEventListener('autoSaveError', (event) => {
            const { error } = event.detail;
            console.error('❌ Erro no auto-save:', error);
            this.atualizarStatusSave('Erro ao salvar', 'error');
        });

        console.log('✅ Event listeners configurados');
    }

    /**
     * Notifica o usuário com mensagem (toast, modal, etc.)
     */
    notifyUser(notification) {
        const { type, title, message } = notification;

        // Usar toast se disponível
        if (window.Toast) {
            window.Toast.show(message, type);
        } else {
            // Fallback para console
            console.log(`[${type.toUpperCase()}] ${title}: ${message}`);
        }
    }
    
    /**
     * Valida configuração obrigatória
     */
    validarConfiguracao() {
        if (!this.config) {
            throw new Error('CreditScoreModule: Configuração obrigatória não fornecida');
        }
        
        const requiredConfigKeys = ['systemName', 'version', 'modules', 'database'];
        const missingKeys = requiredConfigKeys.filter(key => !this.config.hasOwnProperty(key));
        
        if (missingKeys.length > 0) {
            throw new Error(`CreditScoreModule: Chaves de configuração ausentes: ${missingKeys.join(', ')}`);
        }
        
        console.log('✅ Configuração válida');
    }
    
    /**
     * Verifica dependências obrigatórias
     */
    verificarDependencias() {
        const dependenciasObrigatorias = [
            'IndicesFinanceirosCalculator',
            'ScoringEngine', 
            'AnaliseVerticalHorizontal',
            'CapitalGiroCalculator'
        ];
        
        const dependenciasOpcionais = [
            'ComplianceChecker',
            'ExportadorExcel',
            'ExportadorPDF'
        ];
        
        // Verificar dependências obrigatórias
        const faltandoObrigatorias = dependenciasObrigatorias.filter(dep => 
            typeof window[dep] === 'undefined'
        );
        
        if (faltandoObrigatorias.length > 0) {
            throw new Error(`CreditScoreModule: Dependências obrigatórias ausentes - ${faltandoObrigatorias.join(', ')}`);
        }
        
        // Verificar dependências opcionais
        const faltandoOpcionais = dependenciasOpcionais.filter(dep => 
            typeof window[dep] === 'undefined'
        );
        
        if (faltandoOpcionais.length > 0) {
            console.warn(`⚠️ Dependências opcionais ausentes: ${faltandoOpcionais.join(', ')}`);
        }
        
        console.log('✅ Dependências verificadas');
    }
    
    /**
     * Inicializa IndexedDB usando schema configurado
     */
    async initIndexedDB() {
        try {
            // Usar configuração do database
            const dbConfig = this.config.database;
            
            // Verificar se IndexedDB está disponível
            if (!window.indexedDB) {
                throw new Error('IndexedDB não suportado pelo navegador');
            }
            
            // Abrir database
            this.db = await this.openDatabase(dbConfig.name, dbConfig.version, dbConfig.stores);
            
            console.log(`✅ IndexedDB conectado: ${dbConfig.name} v${dbConfig.version}`);
            
        } catch (error) {
            throw new Error(`CreditScoreModule: Erro ao conectar IndexedDB - ${error.message}`);
        }
    }
    
    /**
     * Abre database IndexedDB
     */
    openDatabase(name, version, stores) {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(name, version);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Criar object stores baseado na configuração
                Object.entries(stores).forEach(([storeName, storeConfig]) => {
                    if (!db.objectStoreNames.contains(storeName)) {
                        const store = db.createObjectStore(storeName, {
                            keyPath: storeConfig.keyPath,
                            autoIncrement: storeConfig.autoIncrement || false
                        });
                        
                        // Criar índices
                        if (storeConfig.indexes) {
                            Object.entries(storeConfig.indexes).forEach(([indexName, indexConfig]) => {
                                store.createIndex(indexName, indexName, indexConfig);
                            });
                        }
                        
                        console.log(`✅ Object store criado: ${storeName}`);
                    }
                });
            };
        });
    }
    
    /**
     * Inicializa calculadores
     */
    async initCalculadores() {
        // Índices Financeiros Calculator
        if (window.IndicesFinanceirosCalculator) {
            this.indicesCalculator = new window.IndicesFinanceirosCalculator(this.config, this.messages); // ✅ Passa messages
            if (typeof this.indicesCalculator.init === 'function') {
                await this.indicesCalculator.init();
            }
        }

        // Scoring Engine
        if (window.ScoringEngine) {
            this.scoringEngine = new window.ScoringEngine(this.config, this.messages, this.scoringCriteria); // ✅ Passa config, messages E scoringCriteria
            if (typeof this.scoringEngine.init === 'function') {
                await this.scoringEngine.init();
            }
        }

        // Análise Vertical e Horizontal
        if (window.AnaliseVerticalHorizontal) {
            this.analiseCalculator = new window.AnaliseVerticalHorizontal(this.config, this.messages); // ✅ Passa messages
            if (typeof this.analiseCalculator.init === 'function') {
                await this.analiseCalculator.init();
            }
        }

        // Capital de Giro Calculator
        if (window.CapitalGiroCalculator) {
            this.capitalGiroCalculator = new window.CapitalGiroCalculator(this.config, this.messages); // ✅ Passa messages
            if (typeof this.capitalGiroCalculator.init === 'function') {
                await this.capitalGiroCalculator.init();
            }
        }

        console.log('✅ Calculadores inicializados');
    }
    
    /**
     * Inicializa compliance checker
     */
    async initCompliance() {
        if (window.ComplianceChecker) {
            this.complianceChecker = new window.ComplianceChecker(this.config);
            if (typeof this.complianceChecker.init === 'function') {
                await this.complianceChecker.init();
            }
            console.log('✅ Compliance checker inicializado');
        } else {
            console.warn('⚠️ ComplianceChecker não disponível');
        }
    }
    
    /**
     * Inicializa exportadores
     */
    async initExportadores() {
        // Excel Exporter
        if (window.ExportadorExcel) {
            this.exportadorExcel = new window.ExportadorExcel(this.config);
            if (typeof this.exportadorExcel.init === 'function') {
                await this.exportadorExcel.init();
            }
        }
        
        // PDF Exporter
        if (window.ExportadorPDF) {
            this.exportadorPDF = new window.ExportadorPDF(this.config);
            if (typeof this.exportadorPDF.init === 'function') {
                await this.exportadorPDF.init();
            }
        }
        
        console.log('✅ Exportadores inicializados');
    }
    
    // ==========================================
    // GERENCIAMENTO DE DADOS
    // ==========================================
    
    /**
     * Coleta todos os dados do formulário
     */
    coletarDadosFormulario() {
        const formData = new FormData(document.getElementById('creditScoreForm'));
        const dados = {};
        
        // Converter FormData para objeto
        for (const [key, value] of formData.entries()) {
            dados[key] = value;
        }
        
        // Adicionar dados dinâmicos salvos
        this.dadosFormulario.forEach((value, key) => {
            dados[key] = value;
        });
        
        return dados;
    }
    
    /**
     * Restaura dados no formulário
     */
    restaurarDadosFormulario(dados) {
        if (!dados || typeof dados !== 'object') {
            console.warn('CreditScoreModule.restaurarDadosFormulario: Dados inválidos');
            return;
        }
        
        // Restaurar campos do formulário
        Object.entries(dados).forEach(([key, value]) => {
            const element = document.getElementById(key) || document.querySelector(`[name="${key}"]`);
            
            if (element) {
                if (element.type === 'checkbox' || element.type === 'radio') {
                    element.checked = Boolean(value);
                } else {
                    element.value = value;
                }
                
                // Disparar evento change para atualizar dependências
                element.dispatchEvent(new Event('change', { bubbles: true }));
            } else {
                // Salvar dados dinâmicos
                this.dadosFormulario.set(key, value);
            }
        });
        
        console.log('✅ Dados do formulário restaurados');
    }
    
    /**
     * Salva dados no IndexedDB
     */
    async salvarDados(storeName, dados) {
        if (!this.db) {
            throw new Error('Database não inicializado');
        }
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            
            const request = store.put(dados);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }
    
    /**
     * Carrega dados do IndexedDB
     */
    async carregarDados(storeName, id) {
        if (!this.db) {
            throw new Error('Database não inicializado');
        }
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            
            const request = store.get(id);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }
    
    // ==========================================
    // ANÁLISE E CÁLCULOS
    // ==========================================
    
    /**
     * Executa análise completa de crédito
     */
    async executarAnaliseCompleta(dados) {
        try {
            console.log('🔍 Iniciando análise completa de crédito...');
            
            const resultado = {
                timestamp: new Date().toISOString(),
                dadosOriginais: dados,
                indices: null,
                analiseVerticalHorizontal: null,
                capitalGiro: null,
                scoring: null,
                compliance: null,
                alertas: [],
                recomendacoes: []
            };
            
            // 1. Calcular índices financeiros
            if (this.indicesCalculator && dados.demonstracoes) {
                resultado.indices = await this.indicesCalculator.calcularTodos(dados.demonstracoes);
                console.log('✅ Índices financeiros calculados');
            }
            
            // 2. Análise vertical e horizontal
            if (this.analiseCalculator && dados.demonstracoes) {
                resultado.analiseVerticalHorizontal = await this.analiseCalculator.analisar(dados.demonstracoes);
                console.log('✅ Análise vertical/horizontal realizada');
            }
            
            // 3. Análise de capital de giro
            if (this.capitalGiroCalculator && resultado.indices) {
                resultado.capitalGiro = await this.capitalGiroCalculator.analisar(resultado.indices);
                console.log('✅ Análise de capital de giro realizada');
            }
            
            // 4. Calcular scoring de crédito
            if (this.scoringEngine) {
                resultado.scoring = await this.scoringEngine.calcularScoring({
                    dadosCadastrais: dados.cadastro,
                    dadosFinanceiros: resultado.indices,
                    dadosEndividamento: dados.endividamento,
                    dadosCompliance: dados.compliance
                });
                console.log('✅ Scoring de crédito calculado');
            }
            
            // 5. Verificações de compliance
            if (this.complianceChecker && dados.cadastro) {
                resultado.compliance = await this.complianceChecker.verificar(dados.cadastro);
                console.log('✅ Verificações de compliance realizadas');
            }
            
            // 6. Gerar alertas baseados na configuração
            resultado.alertas = this.gerarAlertas(resultado);
            
            // 7. Gerar recomendações
            resultado.recomendacoes = this.gerarRecomendacoes(resultado);
            
            console.log('✅ Análise completa finalizada');
            return resultado;
            
        } catch (error) {
            console.error('❌ Erro na análise completa:', error);
            throw error;
        }
    }
    
    /**
     * Gera alertas baseados nos resultados
     */
    gerarAlertas(resultado) {
        const alertas = [];
        const alertsConfig = this.config.alerts || {};
        
        // Alertas críticos
        if (alertsConfig.critico) {
            alertsConfig.critico.forEach(criterio => {
                if (this.verificarCriterio(criterio, resultado)) {
                    alertas.push({
                        tipo: 'critico',
                        criterio,
                        descricao: this.getDescricaoCriterio(criterio),
                        timestamp: new Date().toISOString()
                    });
                }
            });
        }
        
        return alertas;
    }
    
    /**
     * Gera recomendações baseadas nos resultados
     */
    gerarRecomendacoes(resultado) {
        const recomendacoes = [];
        
        // Recomendações baseadas no scoring
        if (resultado.scoring && resultado.scoring.classificacao) {
            const classificacao = resultado.scoring.classificacao;
            
            if (classificacao.rating === 'AAA' || classificacao.rating === 'AA') {
                recomendacoes.push({
                    tipo: 'aprovacao',
                    descricao: 'Risco baixo. Aprovação recomendada com condições preferenciais.',
                    prioridade: 'alta'
                });
            } else if (classificacao.rating === 'C' || classificacao.rating === 'D') {
                recomendacoes.push({
                    tipo: 'rejeicao',
                    descricao: 'Risco alto. Rejeição recomendada ou solicitar garantias adicionais.',
                    prioridade: 'alta'
                });
            }
        }
        
        return recomendacoes;
    }
    
    /**
     * Verifica critério de alerta
     */
    verificarCriterio(criterio, resultado) {
        // TODO: Implementar lógica de verificação de critérios
        switch (criterio) {
            case 'liquidezBaixa':
                return resultado.indices?.liquidezCorrente < 1.0;
            case 'endividamentoAlto':
                return resultado.indices?.endividamentoTotal > 0.7;
            default:
                return false;
        }
    }
    
    /**
     * Obtém descrição do critério
     */
    getDescricaoCriterio(criterio) {
        const descricoes = {
            'liquidezBaixa': 'Liquidez corrente abaixo do mínimo recomendado',
            'endividamentoAlto': 'Nível de endividamento acima do limite aceitável',
            'prejuizoConsecutivo': 'Prejuízos em exercícios consecutivos',
            'situacaoIrregular': 'Irregularidades cadastrais identificadas'
        };
        
        return descricoes[criterio] || `Critério ${criterio} atingido`;
    }
    
    // ==========================================
    // UTILITÁRIOS
    // ==========================================
    
    /**
     * Atualiza status de salvamento na interface
     */
    atualizarStatusSave(mensagem, tipo = 'info') {
        const statusElement = document.getElementById('saveStatusText');
        if (statusElement) {
            statusElement.textContent = mensagem;
            statusElement.className = `save-status-${tipo}`;
        }
    }
    
    /**
     * Limpa dados salvos
     */
    async limparDadosSalvos() {
        if (!this.db) return;
        
        try {
            const stores = Object.keys(this.config.database.stores);
            
            for (const storeName of stores) {
                const transaction = this.db.transaction([storeName], 'readwrite');
                const store = transaction.objectStore(storeName);
                await store.clear();
            }
            
            console.log('✅ Dados salvos limpos');
        } catch (error) {
            console.error('❌ Erro ao limpar dados:', error);
        }
    }
    
    /**
     * Obtém estatísticas do sistema
     */
    async obterEstatisticas() {
        if (!this.db) return null;
        
        try {
            const stats = {};
            const stores = Object.keys(this.config.database.stores);
            
            for (const storeName of stores) {
                const transaction = this.db.transaction([storeName], 'readonly');
                const store = transaction.objectStore(storeName);
                const count = await store.count();
                stats[storeName] = count;
            }
            
            return stats;
        } catch (error) {
            console.error('❌ Erro ao obter estatísticas:', error);
            return null;
        }
    }
}

// Disponibilizar globalmente
window.CreditScoreModule = CreditScoreModule;

console.log('✅ CreditScoreModule carregado');