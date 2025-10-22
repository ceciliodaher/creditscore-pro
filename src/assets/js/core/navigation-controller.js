/* =====================================
   NAVIGATION-CONTROLLER.JS
   Gerenciamento de navegação pelos 8 módulos com validações de negócio
   NO FALLBACKS - NO HARDCODED DATA
   ===================================== */

/**
 * Controlador de navegação entre módulos com validação de progressão
 * Complementa tabs.js (HierarchicalNavigation) com lógica de negócio:
 * - Validação de módulos obrigatórios antes de avançar
 * - Controle de dependências entre módulos
 * - Sistema de bloqueio/desbloqueio de módulos
 * - Controle de progresso (0-100%)
 * - Persistência de estado de navegação
 *
 * @class NavigationController
 */
export class NavigationController {
    /**
     * @param {Object} config - Configuração completa do sistema (creditscore-config.json)
     * @param {Object} messages - Mensagens do sistema (messages.json)
     * @param {HierarchicalNavigation} hierarchicalNav - Instância do HierarchicalNavigation (tabs.js)
     * @throws {Error} Se config, messages ou hierarchicalNav ausentes ou inválidos
     */
    constructor(config, messages, hierarchicalNav) {
        // Validação obrigatória - NO FALLBACKS
        if (!config) {
            throw new Error('NavigationController: config obrigatória não fornecida');
        }

        if (!messages) {
            throw new Error('NavigationController: messages obrigatório não fornecido');
        }

        if (!hierarchicalNav) {
            throw new Error('NavigationController: hierarchicalNav obrigatório não fornecido');
        }

        // Validar estrutura mínima da config
        if (!config.modules || !Array.isArray(config.modules)) {
            throw new Error('NavigationController: config.modules deve ser um array');
        }

        if (typeof config.totalSteps !== 'number' || config.totalSteps < 1) {
            throw new Error('NavigationController: config.totalSteps deve ser um número positivo');
        }

        if (!config.validationRules) {
            throw new Error('NavigationController: config.validationRules obrigatória');
        }

        if (!config.requiredFields) {
            throw new Error('NavigationController: config.requiredFields obrigatório');
        }

        // Validar messages
        if (!messages.navigation) {
            throw new Error('NavigationController: messages.navigation obrigatório');
        }

        this.config = config;
        this.messages = messages;
        this.tabs = hierarchicalNav;

        // Estado de navegação
        this.currentModule = 1;
        this.completedModules = new Set();
        this.lockedModules = new Set();
        this.blockedModules = new Map(); // moduleId -> reason
        this.navigationHistory = [];

        // Módulos computados (não editáveis) - extrair da config
        this.computedModules = new Set(
            config.modules
                .filter(m => m.computed === true)
                .map(m => m.id)
        );

        // Dependências entre módulos (hardcoded por enquanto, pode vir da config no futuro)
        this.moduleDependencies = new Map([
            [4, [2]], // Índices dependem de Demonstrações
            [5, [1, 2, 3]], // Scoring depende de Cadastro, Demonstrações, Endividamento
            [8, [1, 2]] // Relatórios dependem de Cadastro e Demonstrações (mínimo)
        ]);

        console.log('✅ NavigationController instanciado');
    }

    /**
     * Inicialização assíncrona
     * @returns {Promise<boolean>}
     */
    async init() {
        try {
            // Verificar integração com tabs.js
            if (typeof this.tabs.getCurrentTab !== 'function') {
                throw new Error('NavigationController: hierarchicalNav não possui API esperada (getCurrentTab)');
            }

            if (typeof this.tabs.switchToTab !== 'function') {
                throw new Error('NavigationController: hierarchicalNav não possui API esperada (switchToTab)');
            }

            // Restaurar estado salvo se existir
            this.restoreNavigationState();

            // Sincronizar estado inicial com tabs.js
            this.currentModule = this.tabs.getCurrentTab();

            // Atualizar estado visual inicial
            this.#updateProgressBar();
            this.#updateModuleIndicators();

            console.log(`✅ NavigationController inicializado - Módulo atual: ${this.currentModule}`);
            return true;
        } catch (error) {
            throw new Error(`NavigationController: Erro na inicialização - ${error.message}`);
        }
    }

    /**
     * Valida se pode navegar para o módulo destino
     * @param {number} toModuleId - ID do módulo destino (1-8)
     * @returns {boolean} true se permitido, false caso contrário
     */
    canNavigateTo(toModuleId) {
        // Validar ID
        if (typeof toModuleId !== 'number' || toModuleId < 1 || toModuleId > this.config.totalSteps) {
            throw new Error(`NavigationController: ID de módulo inválido: ${toModuleId}`);
        }

        // Permitir voltar sempre (navegação para trás não tem restrições)
        if (toModuleId < this.currentModule) {
            return true;
        }

        // Permitir ficar no mesmo módulo
        if (toModuleId === this.currentModule) {
            return true;
        }

        // Verificar se módulo atual é obrigatório e está completo
        const currentModuleConfig = this.#getModuleConfig(this.currentModule);
        if (!currentModuleConfig) {
            throw new Error(`NavigationController: Configuração do módulo ${this.currentModule} não encontrada`);
        }

        if (currentModuleConfig.required === true && !this.isModuleCompleted(this.currentModule)) {
            const reason = `Complete o módulo "${currentModuleConfig.title}" antes de continuar`;
            this.blockedModules.set(toModuleId, reason);

            // Disparar evento de navegação bloqueada
            this.#dispatchEvent('navigationBlocked', {
                fromModule: this.currentModule,
                toModule: toModuleId,
                reason: reason
            });

            return false;
        }

        // Verificar dependências do módulo destino
        const dependencies = this.moduleDependencies.get(toModuleId);
        if (dependencies && dependencies.length > 0) {
            for (const depId of dependencies) {
                if (!this.completedModules.has(depId)) {
                    const depModule = this.#getModuleConfig(depId);
                    if (!depModule) {
                        throw new Error(`NavigationController: Configuração do módulo dependente ${depId} não encontrada`);
                    }

                    const reason = `É necessário completar "${depModule.title}" primeiro`;
                    this.blockedModules.set(toModuleId, reason);

                    // Disparar evento de navegação bloqueada
                    this.#dispatchEvent('navigationBlocked', {
                        fromModule: this.currentModule,
                        toModule: toModuleId,
                        reason: reason,
                        missingDependency: depId
                    });

                    return false;
                }
            }
        }

        // Verificar se módulo está explicitamente bloqueado
        if (this.lockedModules.has(toModuleId)) {
            // Validar consistência: módulo bloqueado deve ter motivo
            if (!this.blockedModules.has(toModuleId)) {
                throw new Error(`NavigationController: módulo ${toModuleId} está locked mas sem motivo em blockedModules - estado inconsistente`);
            }

            const reason = this.blockedModules.get(toModuleId);

            this.#dispatchEvent('navigationBlocked', {
                fromModule: this.currentModule,
                toModule: toModuleId,
                reason: reason
            });

            return false;
        }

        // Navegação permitida
        this.blockedModules.delete(toModuleId);

        this.#dispatchEvent('navigationAllowed', {
            fromModule: this.currentModule,
            toModule: toModuleId
        });

        return true;
    }

    /**
     * Navega para um módulo específico
     * @param {number} moduleId - ID do módulo (1-8)
     * @returns {boolean} true se navegação bem-sucedida
     */
    navigateToModule(moduleId) {
        // Validar ID
        if (typeof moduleId !== 'number' || moduleId < 1 || moduleId > this.config.totalSteps) {
            throw new Error(`NavigationController: ID de módulo inválido: ${moduleId}`);
        }

        // Validar navegação
        if (!this.canNavigateTo(moduleId)) {
            // Obter motivo explícito do bloqueio
            let reason;
            if (this.blockedModules.has(moduleId)) {
                reason = this.blockedModules.get(moduleId);
            } else {
                // Navegação foi bloqueada por lógica interna (validação, dependências, etc)
                reason = 'Navegação bloqueada por validação de regras de negócio';
            }

            console.warn(`⚠️ Navegação bloqueada para módulo ${moduleId}: ${reason}`);
            return false;
        }

        // Registrar no histórico
        this.navigationHistory.push({
            from: this.currentModule,
            to: moduleId,
            timestamp: Date.now()
        });

        // Atualizar estado atual
        const previousModule = this.currentModule;
        this.currentModule = moduleId;

        // Delegar navegação UI para tabs.js
        this.tabs.switchToTab(moduleId);

        // Atualizar visualização
        this.#updateProgressBar();
        this.#updateModuleIndicators();

        // Salvar estado
        this.saveNavigationState();

        console.log(`🧭 Navegação: Módulo ${previousModule} → ${moduleId}`);
        return true;
    }

    /**
     * Valida se o módulo atual está completo
     * @returns {boolean}
     */
    validateCurrentModule() {
        return this.isModuleCompleted(this.currentModule);
    }

    /**
     * Verifica se um módulo está completo
     * @param {number} moduleId - ID do módulo
     * @returns {boolean}
     */
    isModuleCompleted(moduleId) {
        // Validar ID
        if (typeof moduleId !== 'number' || moduleId < 1 || moduleId > this.config.totalSteps) {
            throw new Error(`NavigationController: ID de módulo inválido: ${moduleId}`);
        }

        // Módulos computed são sempre "completos" (calculados automaticamente)
        if (this.computedModules.has(moduleId)) {
            return true;
        }

        // Verificar se já marcado como completo
        if (this.completedModules.has(moduleId)) {
            return true;
        }

        // Obter nome do módulo para buscar campos obrigatórios
        const moduleConfig = this.#getModuleConfig(moduleId);
        if (!moduleConfig) {
            throw new Error(`NavigationController: Configuração do módulo ${moduleId} não encontrada`);
        }

        const moduleName = moduleConfig.name;
        const requiredFields = this.config.requiredFields[moduleName];

        // Se não há campos obrigatórios, módulo é opcional
        if (!requiredFields || !Array.isArray(requiredFields) || requiredFields.length === 0) {
            return true;
        }

        // Verificar se todos os campos obrigatórios estão preenchidos
        const allFieldsFilled = requiredFields.every(fieldName => {
            const field = document.querySelector(`[name="${fieldName}"]`);

            if (!field) {
                console.warn(`⚠️ Campo obrigatório "${fieldName}" não encontrado no DOM`);
                return false;
            }

            // Verificar se tem valor não vazio
            const value = field.value;
            return value !== null && value !== undefined && value.trim() !== '';
        });

        return allFieldsFilled;
    }

    /**
     * Calcula o progresso geral (0-100%)
     * @returns {number} Porcentagem de progresso
     */
    getProgress() {
        const totalModules = this.config.totalSteps;
        const completedCount = this.completedModules.size;

        if (totalModules === 0) {
            throw new Error('NavigationController: totalSteps não pode ser 0');
        }

        return Math.round((completedCount / totalModules) * 100);
    }

    /**
     * Obtém status de um módulo
     * @param {number} moduleId - ID do módulo
     * @returns {Object} { completed: boolean, locked: boolean, blocked: boolean, blockReason: string|null }
     */
    getModuleStatus(moduleId) {
        // Validar ID
        if (typeof moduleId !== 'number' || moduleId < 1 || moduleId > this.config.totalSteps) {
            throw new Error(`NavigationController: ID de módulo inválido: ${moduleId}`);
        }

        return {
            id: moduleId,
            completed: this.completedModules.has(moduleId),
            locked: this.lockedModules.has(moduleId),
            blocked: this.blockedModules.has(moduleId),
            // Retorna motivo explícito se bloqueado, senão null
            blockReason: this.blockedModules.has(moduleId) ? this.blockedModules.get(moduleId) : null,
            isCurrent: moduleId === this.currentModule,
            isComputed: this.computedModules.has(moduleId)
        };
    }

    /**
     * Desbloqueia um módulo
     * @param {number} moduleId - ID do módulo
     */
    unlockModule(moduleId) {
        // Validar ID
        if (typeof moduleId !== 'number' || moduleId < 1 || moduleId > this.config.totalSteps) {
            throw new Error(`NavigationController: ID de módulo inválido: ${moduleId}`);
        }

        this.lockedModules.delete(moduleId);
        this.blockedModules.delete(moduleId);

        console.log(`🔓 Módulo ${moduleId} desbloqueado`);

        this.#updateModuleIndicators();
    }

    /**
     * Bloqueia um módulo com razão
     * @param {number} moduleId - ID do módulo
     * @param {string} reason - Motivo do bloqueio
     */
    lockModule(moduleId, reason) {
        // Validar ID
        if (typeof moduleId !== 'number' || moduleId < 1 || moduleId > this.config.totalSteps) {
            throw new Error(`NavigationController: ID de módulo inválido: ${moduleId}`);
        }

        if (typeof reason !== 'string' || reason.trim() === '') {
            throw new Error('NavigationController: reason deve ser uma string não vazia');
        }

        this.lockedModules.add(moduleId);
        this.blockedModules.set(moduleId, reason);

        console.log(`🔒 Módulo ${moduleId} bloqueado: ${reason}`);

        this.#updateModuleIndicators();
    }

    /**
     * Marca módulo como completo
     * @param {number} moduleId - ID do módulo
     */
    markModuleComplete(moduleId) {
        // Validar ID
        if (typeof moduleId !== 'number' || moduleId < 1 || moduleId > this.config.totalSteps) {
            throw new Error(`NavigationController: ID de módulo inválido: ${moduleId}`);
        }

        // Adicionar aos completos
        this.completedModules.add(moduleId);

        // Desbloquear se estava bloqueado
        this.lockedModules.delete(moduleId);
        this.blockedModules.delete(moduleId);

        // Integrar com tabs.js (marcar tab como completa)
        if (typeof this.tabs.markTabAsCompleted === 'function') {
            this.tabs.markTabAsCompleted(moduleId);
        }

        console.log(`✅ Módulo ${moduleId} marcado como completo`);

        // Atualizar visualização
        this.#updateProgressBar();
        this.#updateModuleIndicators();

        // Disparar evento
        this.#dispatchEvent('progressUpdated', {
            moduleId,
            progress: this.getProgress(),
            completedModules: Array.from(this.completedModules)
        });

        // Verificar se todos módulos obrigatórios estão completos
        this.#checkAllModulesCompleted();

        // Salvar estado
        this.saveNavigationState();
    }

    /**
     * Desmarca módulo como completo
     * @param {number} moduleId - ID do módulo
     */
    markModuleIncomplete(moduleId) {
        // Validar ID
        if (typeof moduleId !== 'number' || moduleId < 1 || moduleId > this.config.totalSteps) {
            throw new Error(`NavigationController: ID de módulo inválido: ${moduleId}`);
        }

        this.completedModules.delete(moduleId);

        console.log(`🔄 Módulo ${moduleId} desmarcado como completo`);

        // Atualizar visualização
        this.#updateProgressBar();
        this.#updateModuleIndicators();

        // Disparar evento
        this.#dispatchEvent('progressUpdated', {
            moduleId,
            progress: this.getProgress(),
            completedModules: Array.from(this.completedModules)
        });

        // Salvar estado
        this.saveNavigationState();
    }

    /**
     * Obtém lista de módulos bloqueados com motivos
     * @returns {Array<Object>} [ { moduleId, reason }, ... ]
     */
    getBlockedModules() {
        return Array.from(this.blockedModules.entries()).map(([moduleId, reason]) => ({
            moduleId,
            reason
        }));
    }

    /**
     * Obtém lista de próximos módulos disponíveis para navegação
     * @returns {Array<number>} IDs dos módulos permitidos
     */
    getAllowedNextModules() {
        const allowed = [];

        for (let i = 1; i <= this.config.totalSteps; i++) {
            if (i !== this.currentModule && this.canNavigateTo(i)) {
                allowed.push(i);
            }
        }

        return allowed;
    }

    /**
     * Salva estado da navegação no localStorage
     */
    saveNavigationState() {
        const state = {
            currentModule: this.currentModule,
            completedModules: Array.from(this.completedModules),
            lockedModules: Array.from(this.lockedModules),
            blockedModules: Array.from(this.blockedModules.entries()),
            navigationHistory: this.navigationHistory,
            timestamp: Date.now()
        };

        try {
            localStorage.setItem('creditscore_navigation_state', JSON.stringify(state));
            console.log('💾 Estado de navegação salvo');
        } catch (error) {
            console.error('❌ Erro ao salvar estado de navegação:', error);
        }
    }

    /**
     * Restaura estado da navegação do localStorage
     * @returns {boolean} true se restaurado com sucesso
     */
    restoreNavigationState() {
        try {
            const saved = localStorage.getItem('creditscore_navigation_state');

            if (!saved) {
                console.log('ℹ️ Nenhum estado de navegação salvo encontrado');
                return false;
            }

            const state = JSON.parse(saved);

            // Validar estrutura
            if (!state || typeof state !== 'object') {
                throw new Error('Estado salvo inválido');
            }

            // Verificar idade dos dados (não restaurar se > 7 dias)
            const age = Date.now() - state.timestamp;
            const MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 dias

            if (age > MAX_AGE) {
                console.log('ℹ️ Estado de navegação muito antigo, descartando');
                localStorage.removeItem('creditscore_navigation_state');
                return false;
            }

            // Validar estrutura do estado restaurado
            if (typeof state.currentModule !== 'number') {
                throw new Error('NavigationController: estado restaurado possui currentModule inválido');
            }

            if (!Array.isArray(state.completedModules)) {
                throw new Error('NavigationController: estado restaurado possui completedModules inválido');
            }

            if (!Array.isArray(state.lockedModules)) {
                throw new Error('NavigationController: estado restaurado possui lockedModules inválido');
            }

            if (!Array.isArray(state.blockedModules)) {
                throw new Error('NavigationController: estado restaurado possui blockedModules inválido');
            }

            if (!Array.isArray(state.navigationHistory)) {
                throw new Error('NavigationController: estado restaurado possui navigationHistory inválido');
            }

            // Restaurar estado validado
            this.currentModule = state.currentModule;
            this.completedModules = new Set(state.completedModules);
            this.lockedModules = new Set(state.lockedModules);
            this.blockedModules = new Map(state.blockedModules);
            this.navigationHistory = state.navigationHistory;

            console.log('✅ Estado de navegação restaurado');
            return true;
        } catch (error) {
            console.error('❌ Erro ao restaurar estado de navegação:', error);
            return false;
        }
    }

    /**
     * Limpa estado de navegação salvo
     */
    clearNavigationState() {
        localStorage.removeItem('creditscore_navigation_state');
        console.log('🗑️ Estado de navegação limpo');
    }

    // ============================================
    // MÉTODOS PRIVADOS
    // ============================================

    /**
     * Obtém configuração de um módulo pelo ID
     * @private
     * @param {number} moduleId
     * @returns {Object|null}
     */
    #getModuleConfig(moduleId) {
        const module = this.config.modules.find(m => m.id === moduleId);

        if (!module) {
            return null;
        }

        return module;
    }

    /**
     * Atualiza barra de progresso visual
     * @private
     */
    #updateProgressBar() {
        const percentage = this.getProgress();
        const completedCount = this.completedModules.size;
        const totalModules = this.config.totalSteps;

        // Atualizar barra de progresso
        const progressBar = document.querySelector('.progress-bar');
        if (progressBar) {
            progressBar.style.width = `${percentage}%`;
            progressBar.setAttribute('aria-valuenow', percentage.toString());
        }

        // Atualizar texto de progresso
        const progressText = document.querySelector('.progress-text');
        if (progressText) {
            progressText.textContent = `${completedCount} de ${totalModules} módulos completos (${percentage}%)`;
        }

        console.log(`📊 Progresso: ${percentage}% (${completedCount}/${totalModules})`);
    }

    /**
     * Atualiza indicadores visuais dos módulos (status icons)
     * @private
     */
    #updateModuleIndicators() {
        this.config.modules.forEach(module => {
            const tabElement = document.querySelector(`[data-tab="${module.id}"]`);
            if (!tabElement) {
                return; // Tab não existe no DOM
            }

            // Remover classes e ícones anteriores
            tabElement.classList.remove('completed', 'in-progress', 'locked', 'blocked');

            // Remover ícones de status existentes
            const existingIcon = tabElement.querySelector('.status-icon');
            if (existingIcon) {
                existingIcon.remove();
            }

            // Aplicar novo estado e ícone
            if (this.completedModules.has(module.id)) {
                tabElement.classList.add('completed');
                this.#addStatusIcon(tabElement, '✅');
            } else if (module.id === this.currentModule) {
                tabElement.classList.add('in-progress');
                this.#addStatusIcon(tabElement, '🔄');
            } else if (this.lockedModules.has(module.id) || this.blockedModules.has(module.id)) {
                tabElement.classList.add('locked');
                this.#addStatusIcon(tabElement, '🔒');
            } else if (module.id > this.currentModule && module.required === true) {
                tabElement.classList.add('locked');
                this.#addStatusIcon(tabElement, '🔒');
            }
        });
    }

    /**
     * Adiciona ícone de status a um elemento de tab
     * @private
     * @param {HTMLElement} tabElement
     * @param {string} icon
     */
    #addStatusIcon(tabElement, icon) {
        const iconSpan = document.createElement('span');
        iconSpan.className = 'status-icon';
        iconSpan.textContent = ` ${icon}`;
        tabElement.appendChild(iconSpan);
    }

    /**
     * Verifica se todos módulos obrigatórios estão completos
     * @private
     */
    #checkAllModulesCompleted() {
        const requiredModules = this.config.modules
            .filter(m => m.required === true && m.computed !== true);

        const allRequiredCompleted = requiredModules.every(m =>
            this.completedModules.has(m.id)
        );

        if (allRequiredCompleted) {
            console.log('🎉 Todos módulos obrigatórios completos!');

            this.#dispatchEvent('allModulesCompleted', {
                completedModules: Array.from(this.completedModules),
                progress: this.getProgress()
            });
        }
    }

    /**
     * Dispara evento customizado
     * @private
     * @param {string} eventName
     * @param {Object} detail
     */
    #dispatchEvent(eventName, detail) {
        const event = new CustomEvent(eventName, {
            detail,
            bubbles: true,
            cancelable: false
        });

        document.dispatchEvent(event);
        console.log(`📡 Evento disparado: ${eventName}`, detail);
    }
}

// Exportação global (compatibilidade com módulos não-ES6)
if (typeof window !== 'undefined') {
    window.NavigationController = NavigationController;
}
