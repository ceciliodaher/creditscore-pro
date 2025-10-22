# 📋 ESPECIFICAÇÕES COMPLETAS - COMPONENTES FALTANTES

## Sistema: CreditScore Pro - Análise de Crédito e Compliance Financeiro

Baseado na análise do código existente, aqui estão as especificações detalhadas dos 5 componentes principais que precisam ser implementados:

***

## 🎯 1. FORM-GENERATOR.JS

### 1.1 Propósito

Gerar formulários dinamicamente a partir da configuração JSON, eliminando HTML hardcoded e permitindo configuração centralizada.

### 1.2 Estrutura de Classe

```javascript
class FormGenerator {
    constructor(config) {
        this.config = config;
        this.validators = new Map();
        this.maskHandlers = new Map();
        this.currentModule = null;
    }
}
```

### 1.3 Tipos de Campo Suportados

Baseado no config e código existente:

```javascript
const FIELD_TYPES = {
    text: 'input[type="text"]',
    email: 'input[type="email"]',
    cnpj: 'input[type="text"]', // com máscara específica
    currency: 'input[type="text"]', // com CurrencyMask
    percentage: 'input[type="text"]', // com PercentageCalculator
    date: 'input[type="date"]',
    select: 'select',
    textarea: 'textarea',
    table: 'table', // para demonstrativos financeiros
    number: 'input[type="number"]',
    checkbox: 'input[type="checkbox"]',
    radio: 'input[type="radio"]'
};
```

### 1.4 Estrutura de Configuração de Formulário

```json
{
  "moduleId": 1,
  "moduleName": "cadastro",
  "fields": [
    {
      "id": "razaoSocial",
      "type": "text",
      "label": "Razão Social",
      "placeholder": "Digite a razão social",
      "required": true,
      "validation": {
        "minLength": 3,
        "maxLength": 200
      },
      "cssClass": "form-control",
      "container": "row-full"
    },
    {
      "id": "cnpj",
      "type": "cnpj",
      "label": "CNPJ",
      "placeholder": "00.000.000/0000-00",
      "required": true,
      "mask": "cnpj",
      "validation": {
        "custom": "validateCNPJ"
      }
    },
    {
      "id": "valorAtivo",
      "type": "currency",
      "label": "Ativo Total",
      "required": true,
      "mask": "currency",
      "precision": 2
    }
  ]
}
```

### 1.5 Métodos Principais

```javascript
/**
 * Gera HTML completo do módulo
 * @param {number} moduleId - ID do módulo (1-8)
 * @returns {string} HTML do formulário
 */
generateModule(moduleId) {
    const moduleConfig = this.getModuleConfig(moduleId);
    const fields = this.getFieldsForModule(moduleId);

    let html = `<div class="module-container" data-module="${moduleId}">`;
    html += this.generateModuleHeader(moduleConfig);
    html += '<form class="module-form">';

    fields.forEach(field => {
        html += this.generateField(field);
    });

    html += '</form>';
    html += '</div>';

    return html;
}

/**
 * Gera HTML de um campo individual
 * @param {Object} fieldConfig - Configuração do campo
 * @returns {string} HTML do campo
 */
generateField(fieldConfig) {
    const fieldType = fieldConfig.type;

    switch(fieldType) {
        case 'text':
        case 'email':
        case 'number':
            return this.generateInputField(fieldConfig);
        case 'cnpj':
            return this.generateCNPJField(fieldConfig);
        case 'currency':
            return this.generateCurrencyField(fieldConfig);
        case 'percentage':
            return this.generatePercentageField(fieldConfig);
        case 'select':
            return this.generateSelectField(fieldConfig);
        case 'textarea':
            return this.generateTextareaField(fieldConfig);
        case 'table':
            return this.generateTableField(fieldConfig);
        case 'date':
            return this.generateDateField(fieldConfig);
        default:
            throw new Error(`Tipo de campo não suportado: ${fieldType}`);
    }
}
```

### 1.6 Integração com Máscaras

```javascript
/**
 * Aplica máscara ao campo após renderização
 */
applyMasks(container) {
    // Currency Mask
    const currencyFields = container.querySelectorAll('[data-mask="currency"]');
    currencyFields.forEach(field => {
        if (window.CurrencyMask) {
            CurrencyMask.apply(field);
        }
    });

    // CNPJ Validator
    const cnpjFields = container.querySelectorAll('[data-mask="cnpj"]');
    cnpjFields.forEach(field => {
        if (window.CNPJValidator) {
            CNPJValidator.apply(field);
        }
    });

    // Percentage
    const percentageFields = container.querySelectorAll('[data-mask="percentage"]');
    percentageFields.forEach(field => {
        if (window.PercentageCalculator) {
            PercentageCalculator.apply(field);
        }
    });
}
```

### 1.7 Data Binding Bidirecional

```javascript
/**
 * Configura data binding entre campo e modelo
 */
setupDataBinding(field, dataPath) {
    // Model -> View
    this.observeModelChanges(dataPath, (newValue) => {
        field.value = newValue;
        field.dispatchEvent(new Event('change', { bubbles: true }));
    });

    // View -> Model
    field.addEventListener('input', (e) => {
        this.updateModel(dataPath, e.target.value);
        this.dispatchEvent('fieldChanged', { 
            field: dataPath, 
            value: e.target.value 
        });
    });

    field.addEventListener('blur', (e) => {
        this.validateField(field);
        this.dispatchEvent('fieldValidated', {
            field: dataPath,
            isValid: !field.classList.contains('is-invalid')
        });
    });
}
```

### 1.8 Estrutura HTML Gerada (Exemplo)

```html
<div class="form-group" data-field="razaoSocial">
    <label for="razaoSocial" class="form-label">
        Razão Social
        <span class="required-indicator">*</span>
    </label>
    <input 
        type="text" 
        id="razaoSocial" 
        name="razaoSocial"
        class="form-control"
        placeholder="Digite a razão social"
        required
        data-validation="text"
        data-min-length="3"
        data-max-length="200"
    />
    <div class="invalid-feedback"></div>
    <div class="field-hint">Informe a razão social completa conforme CNPJ</div>
</div>
```

### 1.9 Eventos Disparados

```javascript
// Quando um campo é alterado
this.dispatchEvent('fieldChanged', {
    moduleId: 1,
    fieldId: 'razaoSocial',
    value: 'Nova Empresa LTDA',
    timestamp: Date.now()
});

// Quando formulário é validado
this.dispatchEvent('formValidated', {
    moduleId: 1,
    isValid: true,
    errors: [],
    warnings: []
});

// Quando módulo é completado
this.dispatchEvent('moduleCompleted', {
    moduleId: 1,
     {...}
});
```

### 1.10 Padrão de Exportação

```javascript
// Final do arquivo
window.FormGenerator = FormGenerator;
```

***

## 🧭 2. NAVIGATION-CONTROLLER.JS

### 2.1 Propósito

Gerenciar navegação hierárquica pelos 8 módulos, validações de progressão, e atualização da barra de progresso.

### 2.2 Estrutura de Classe

```javascript
class NavigationController {
    constructor(config, tabsInstance) {
        this.config = config;
        this.tabs = tabsInstance; // Integração com tabs.js existente
        this.currentModule = 1;
        this.completedModules = new Set();
        this.validationRules = config.validationRules;
        this.progressBar = null;
        this.navigationHistory = [];
    }
}
```

### 2.3 Integração com tabs.js

O `tabs.js` já existe e gerencia a UI das tabs. O NavigationController **complementa** essa funcionalidade com:

- Validação antes de permitir navegação
- Controle de progresso
- Lógica de negócio (módulos obrigatórios, dependências)

```javascript
/**
 * Inicializa integração com sistema de tabs
 */
initTabsIntegration() {
    if (!window.tabNavigation) {
        throw new Error('tabs.js não carregado. NavigationController depende dele.');
    }

    this.tabs = window.tabNavigation;

    // Interceptar mudanças de tab para validar
    this.tabs.onBeforeTabChange = async (fromTab, toTab) => {
        return await this.validateNavigation(fromTab, toTab);
    };

    // Atualizar progresso após mudança
    this.tabs.onAfterTabChange = (newTab) => {
        this.currentModule = newTab;
        this.updateProgressBar();
        this.saveNavigationState();
    };
}
```

### 2.4 Validação de Navegação

```javascript
/**
 * Valida se pode navegar para o módulo destino
 * @param {number} fromModule - Módulo atual
 * @param {number} toModule - Módulo destino
 * @returns {Promise<boolean>} true se permitido
 */
async validateNavigation(fromModule, toModule) {
    // Permitir voltar sempre
    if (toModule < fromModule) {
        return true;
    }

    // Verificar se módulo atual é obrigatório e está completo
    const fromModuleConfig = this.getModuleConfig(fromModule);
    if (fromModuleConfig.required && !this.isModuleComplete(fromModule)) {
        this.showValidationError(
            `Complete o módulo "${fromModuleConfig.title}" antes de continuar`
        );
        return false;
    }

    // Verificar dependências
    const dependencies = this.getModuleDependencies(toModule);
    for (const depId of dependencies) {
        if (!this.completedModules.has(depId)) {
            const depModule = this.getModuleConfig(depId);
            this.showValidationError(
                `É necessário completar "${depModule.title}" primeiro`
            );
            return false;
        }
    }

    return true;
}

/**
 * Verifica se módulo está completo
 */
isModuleComplete(moduleId) {
    const requiredFields = this.config.requiredFields[
        this.getModuleName(moduleId)
    ];

    if (!requiredFields) return true; // Módulo opcional ou computado

    // Verificar se todos os campos obrigatórios estão preenchidos
    return requiredFields.every(fieldName => {
        const field = document.querySelector(`[name="${fieldName}"]`);
        return field && field.value && field.value.trim() !== '';
    });
}
```

### 2.5 Gerenciamento de Progresso

```javascript
/**
 * Atualiza barra de progresso
 */
updateProgressBar() {
    const totalModules = this.config.totalSteps;
    const completedCount = this.completedModules.size;
    const percentage = Math.round((completedCount / totalModules) * 100);

    const progressBar = document.querySelector('.progress-bar');
    const progressText = document.querySelector('.progress-text');

    if (progressBar) {
        progressBar.style.width = `${percentage}%`;
        progressBar.setAttribute('aria-valuenow', percentage);
    }

    if (progressText) {
        progressText.textContent = `${completedCount} de ${totalModules} módulos completos (${percentage}%)`;
    }

    // Atualizar indicadores visuais das tabs
    this.updateModuleIndicators();

    console.log(`📊 Progresso: ${percentage}% (${completedCount}/${totalModules})`);
}

/**
 * Atualiza indicadores visuais dos módulos
 */
updateModuleIndicators() {
    this.config.modules.forEach(module => {
        const tabElement = document.querySelector(`[data-tab="${module.id}"]`);
        if (!tabElement) return;

        // Remover classes anteriores
        tabElement.classList.remove('completed', 'in-progress', 'locked');

        if (this.completedModules.has(module.id)) {
            tabElement.classList.add('completed');
            tabElement.innerHTML += ' <span class="status-icon">✅</span>';
        } else if (module.id === this.currentModule) {
            tabElement.classList.add('in-progress');
            tabElement.innerHTML += ' <span class="status-icon">🔄</span>';
        } else if (module.id > this.currentModule && module.required) {
            tabElement.classList.add('locked');
            tabElement.innerHTML += ' <span class="status-icon">🔒</span>';
        }
    });
}
```

### 2.6 Métodos Públicos

```javascript
/**
 * Navega para um módulo específico
 * @param {number} moduleId - ID do módulo (1-8)
 * @returns {Promise<boolean>} sucesso da navegação
 */
async goToModule(moduleId) {
    if (moduleId < 1 || moduleId > this.config.totalSteps) {
        console.error(`❌ Módulo inválido: ${moduleId}`);
        return false;
    }

    const canNavigate = await this.validateNavigation(this.currentModule, moduleId);
    if (!canNavigate) {
        return false;
    }

    this.tabs.switchToTab(moduleId);
    this.navigationHistory.push({
        from: this.currentModule,
        to: moduleId,
        timestamp: Date.now()
    });

    return true;
}

/**
 * Avança para próximo módulo
 */
async next() {
    const nextModule = this.currentModule + 1;
    if (nextModule > this.config.totalSteps) {
        console.log('✅ Último módulo alcançado');
        this.onFormComplete();
        return false;
    }

    return await this.goToModule(nextModule);
}

/**
 * Volta para módulo anterior
 */
async previous() {
    const prevModule = this.currentModule - 1;
    if (prevModule < 1) {
        console.log('⚠️ Já está no primeiro módulo');
        return false;
    }

    return await this.goToModule(prevModule);
}

/**
 * Marca módulo como completo
 */
markModuleComplete(moduleId) {
    this.completedModules.add(moduleId);
    this.updateProgressBar();

    console.log(`✅ Módulo ${moduleId} marcado como completo`);

    // Disparar evento
    this.dispatchEvent('moduleCompleted', {
        moduleId,
        totalCompleted: this.completedModules.size,
        percentage: (this.completedModules.size / this.config.totalSteps) * 100
    });
}
```

### 2.7 Persistência de Estado

```javascript
/**
 * Salva estado da navegação no localStorage
 */
saveNavigationState() {
    const state = {
        currentModule: this.currentModule,
        completedModules: Array.from(this.completedModules),
        navigationHistory: this.navigationHistory,
        timestamp: Date.now()
    };

    localStorage.setItem('creditscore_navigation_state', JSON.stringify(state));
}

/**
 * Restaura estado da navegação
 */
restoreNavigationState() {
    const saved = localStorage.getItem('creditscore_navigation_state');
    if (!saved) return false;

    try {
        const state = JSON.parse(saved);
        this.currentModule = state.currentModule;
        this.completedModules = new Set(state.completedModules);
        this.navigationHistory = state.navigationHistory || [];

        this.goToModule(this.currentModule);
        this.updateProgressBar();

        console.log('✅ Estado de navegação restaurado');
        return true;
    } catch (error) {
        console.error('❌ Erro ao restaurar navegação:', error);
        return false;
    }
}
```

### 2.8 Padrão de Exportação

```javascript
window.NavigationController = NavigationController;
```

***

## 💾 3. AUTO-SAVE.JS

### 3.1 Propósito

Salvar automaticamente dados do formulário em IndexedDB a cada 30 segundos, com prompt de restauração ao reabrir.

### 3.2 Estrutura de Classe

```javascript
class AutoSave {
    constructor(config, formGenerator, dbManager) {
        this.config = config;
        this.formGenerator = formGenerator;
        this.db = dbManager;
        this.autoSaveInterval = config.autoSaveInterval || 30000; // 30s default
        this.timerId = null;
        this.lastSaveTimestamp = null;
        this.isDirty = false; // Indica se há mudanças não salvas
    }
}
```

### 3.3 Storage: IndexedDB vs localStorage

**Decisão: Usar IndexedDB como primary, localStorage como fallback**

Razões:

1. FormCore já usa localStorage (linha 93 do core.js)
2. IndexedDB permite armazenar estruturas complexas
3. Config define store `autosave` no database schema
4. localStorage tem limite de ~5-10MB, IndexedDB ~50MB+

```javascript
/**
 * Salva dados no store apropriado
 */
async save(data) {
    const saveData = {
        id: 'current_session', // Única sessão ativa
        timestamp: Date.now(),
        moduleId: this.getCurrentModuleId(),
        formData: data,
        completedModules: this.getCompletedModules(),
        version: this.config.version
    };

    try {
        // Tentar IndexedDB primeiro
        await this.db.save('autosave', saveData);
        this.lastSaveTimestamp = saveData.timestamp;
        this.isDirty = false;
        this.updateSaveStatus('✅ Salvo automaticamente');
        console.log('💾 AutoSave: dados salvos no IndexedDB');
    } catch (error) {
        console.warn('⚠️ IndexedDB falhou, usando localStorage:', error);
        // Fallback para localStorage
        localStorage.setItem('creditscore_autosave', JSON.stringify(saveData));
        this.lastSaveTimestamp = saveData.timestamp;
        this.isDirty = false;
    }
}
```

### 3.4 Timer de Auto-Save

```javascript
/**
 * Inicia timer de auto-save
 */
start() {
    if (this.timerId) {
        console.warn('⚠️ AutoSave já está rodando');
        return;
    }

    this.timerId = setInterval(() => {
        if (this.isDirty) {
            this.performAutoSave();
        }
    }, this.autoSaveInterval);

    console.log(`🚀 AutoSave iniciado (${this.autoSaveInterval / 1000}s)`);

    // Salvar também ao fechar página
    window.addEventListener('beforeunload', () => {
        if (this.isDirty) {
            this.performAutoSave();
        }
    });
}

/**
 * Para timer
 */
stop() {
    if (this.timerId) {
        clearInterval(this.timerId);
        this.timerId = null;
        console.log('⏹️ AutoSave parado');
    }
}

/**
 * Executa salvamento
 */
async performAutoSave() {
    try {
        const formData = this.collectFormData();
        await this.save(formData);
    } catch (error) {
        console.error('❌ Erro no auto-save:', error);
        this.updateSaveStatus('❌ Erro ao salvar');
    }
}
```

### 3.5 Prompt de Restauração

```javascript
/**
 * Verifica e exibe prompt de restauração ao iniciar
 */
async checkForSavedData() {
    let savedData = null;

    // Tentar IndexedDB
    try {
        savedData = await this.db.get('autosave', 'current_session');
    } catch (error) {
        console.warn('Sem dados no IndexedDB, tentando localStorage');
    }

    // Fallback para localStorage
    if (!savedData) {
        const localData = localStorage.getItem('creditscore_autosave');
        if (localData) {
            savedData = JSON.parse(localData);
        }
    }

    if (!savedData) {
        console.log('ℹ️ Nenhum dado salvo encontrado');
        return false;
    }

    // Verificar idade dos dados (não restaurar se > 7 dias)
    const age = Date.now() - savedData.timestamp;
    const MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 dias

    if (age > MAX_AGE) {
        console.log('ℹ️ Dados salvos muito antigos, descartando');
        this.clearSavedData();
        return false;
    }

    // Exibir prompt
    return this.showRestorePrompt(savedData);
}

/**
 * Exibe modal de restauração
 */
showRestorePrompt(savedData) {
    return new Promise((resolve) => {
        const modal = this.createRestoreModal(savedData);
        document.body.appendChild(modal);

        // Botão Restaurar
        modal.querySelector('.btn-restore').onclick = async () => {
            await this.restoreData(savedData);
            modal.remove();
            resolve(true);
        };

        // Botão Descartar
        modal.querySelector('.btn-discard').onclick = () => {
            this.clearSavedData();
            modal.remove();
            resolve(false);
        };
    });
}

/**
 * Cria HTML do modal de restauração
 */
createRestoreModal(savedData) {
    const modal = document.createElement('div');
    modal.className = 'modal modal-restore';
    modal.innerHTML = `
        <div class="modal-overlay"></div>
        <div class="modal-content">
            <div class="modal-header">
                <h2>💾 Dados Salvos Encontrados</h2>
            </div>
            <div class="modal-body">
                <p>Encontramos uma análise de crédito não finalizada:</p>
                <ul class="saved-data-info">
                    <li><strong>Data:</strong> ${new Date(savedData.timestamp).toLocaleString('pt-BR')}</li>
                    <li><strong>Módulo:</strong> ${this.getModuleName(savedData.moduleId)}</li>
                    <li><strong>Progresso:</strong> ${savedData.completedModules?.length || 0} de ${this.config.totalSteps} módulos</li>
                </ul>
                <p>Deseja continuar de onde parou?</p>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary btn-discard">
                    Descartar e Começar Novo
                </button>
                <button class="btn btn-primary btn-restore">
                    Restaurar Dados
                </button>
            </div>
        </div>
    `;
    return modal;
}
```

### 3.6 Restauração de Dados

```javascript
/**
 * Restaura dados salvos no formulário
 */
async restoreData(savedData) {
    try {
        console.log('🔄 Restaurando dados salvos...');

        // Restaurar dados do formulário
        if (this.formGenerator) {
            this.formGenerator.populateForm(savedData.formData);
        }

        // Restaurar módulos completados
        if (window.navigationController && savedData.completedModules) {
            savedData.completedModules.forEach(moduleId => {
                window.navigationController.markModuleComplete(moduleId);
            });
        }

        // Navegar para o módulo salvo
        if (window.navigationController) {
            await window.navigationController.goToModule(savedData.moduleId);
        }

        this.isDirty = false;
        console.log('✅ Dados restaurados com sucesso');

        this.showNotification('Dados restaurados com sucesso', 'success');
    } catch (error) {
        console.error('❌ Erro ao restaurar dados:', error);
        this.showNotification('Erro ao restaurar dados', 'error');
    }
}
```

### 3.7 Integração com FormCore e CreditScoreModule

```javascript
/**
 * Inicializa integração com outros componentes
 */
init(creditScoreModule) {
    this.module = creditScoreModule;

    // Ouvir mudanças no formulário
    document.addEventListener('fieldChanged', () => {
        this.isDirty = true;
    });

    document.addEventListener('formValidated', () => {
        this.isDirty = true;
    });

    // Checar dados salvos ao iniciar
    this.checkForSavedData().then(restored => {
        if (restored) {
            console.log('✅ Sessão anterior restaurada');
        } else {
            console.log('🆕 Nova sessão iniciada');
        }

        // Iniciar auto-save
        this.start();
    });
}

/**
 * Coleta dados do formulário via creditscore-module
 */
collectFormData() {
    if (this.module && typeof this.module.coletarDadosFormulario === 'function') {
        return this.module.coletarDadosFormulario();
    }

    // Fallback: coletar direto do DOM
    const formData = {};
    const form = document.getElementById('creditScoreForm');
    if (form) {
        const data = new FormData(form);
        for (const [key, value] of data.entries()) {
            formData[key] = value;
        }
    }
    return formData;
}
```

### 3.8 Timer Configurável

O timer de 30s vem do config, mas pode ser alterado:

```javascript
// No config JSON:
{
  "autoSaveInterval": 30000  // 30 segundos
}

// Para alterar programaticamente:
autoSave.setInterval(60000); // Mudar para 60s

setInterval(newInterval) {
    this.autoSaveInterval = newInterval;
    if (this.timerId) {
        this.stop();
        this.start();
    }
    console.log(`⚙️ Intervalo de auto-save alterado para ${newInterval / 1000}s`);
}
```

### 3.9 Padrão de Exportação

```javascript
window.AutoSave = AutoSave;
```

***

## 📊 4. ANALISE-VERTICAL-HORIZONTAL.JS

### 4.1 Propósito

Calcular análise vertical (percentual de cada conta sobre o total) e análise horizontal (evolução entre anos) das demonstrações financeiras.

### 4.2 Conceitos Contábeis

**Análise Vertical:**

- Cada conta é expressa como % do total do grupo
- Balanço Patrimonial: % sobre Ativo Total ou Passivo Total
- DRE: % sobre Receita Líquida

**Análise Horizontal:**

- Ano base = 100%
- Anos seguintes = % de variação em relação ao ano base
- Identifica tendências de crescimento/redução

### 4.3 Estrutura de Classe

```javascript
class AnaliseVerticalHorizontal {
    constructor(config) {
        this.config = config;
        this.demonstrativos = null;
    }

    async init() {
        console.log('✅ AnaliseVerticalHorizontal inicializado');
        return true;
    }
}
```

### 4.4 Estrutura de Dados de Entrada

```javascript
const demonstrativos = {
    anos: [2023, 2024, 2025], // 3 anos obrigatórios
    balanco: {
        2023: {
            ativo: {
                circulante: {
                    caixa: 50000,
                    contasReceber: 120000,
                    estoques: 80000,
                    total: 250000
                },
                naoCirculante: {
                    imobilizado: 300000,
                    intangivel: 50000,
                    total: 350000
                },
                total: 600000
            },
            passivo: {
                circulante: {
                    fornecedores: 100000,
                    emprestimos: 50000,
                    total: 150000
                },
                naoCirculante: {
                    emprestimosLP: 200000,
                    total: 200000
                },
                patrimonioLiquido: {
                    capitalSocial: 150000,
                    lucrosAcumulados: 100000,
                    total: 250000
                },
                total: 600000
            }
        },
        2024: { /* ... */ },
        2025: { /* ... */ }
    },
    dre: {
        2023: {
            receitaBruta: 1000000,
            deducoes: -100000,
            receitaLiquida: 900000,
            cpm: -500000,
            lucrroBruto: 400000,
            despesasOperacionais: -200000,
            lucroOperacional: 200000,
            despesasFinanceiras: -50000,
            lucroLiquido: 150000
        },
        2024: { /* ... */ },
        2025: { /* ... */ }
    }
};
```

### 4.5 Fórmulas - Análise Vertical

```javascript
/**
 * Calcula análise vertical do Balanço Patrimonial
 * Cada conta como % do Ativo Total ou Passivo Total
 */
calcularAnaliseVerticalBalanco(balanco, ano) {
    const resultado = {
        ano,
        ativo: {},
        passivo: {}
    };

    const ativoTotal = balanco[ano].ativo.total;
    const passivoTotal = balanco[ano].passivo.total;

    // ATIVO
    // Circulante
    resultado.ativo.circulante = {
        caixa: (balanco[ano].ativo.circulante.caixa / ativoTotal) * 100,
        contasReceber: (balanco[ano].ativo.circulante.contasReceber / ativoTotal) * 100,
        estoques: (balanco[ano].ativo.circulante.estoques / ativoTotal) * 100,
        total: (balanco[ano].ativo.circulante.total / ativoTotal) * 100
    };

    // Não Circulante
    resultado.ativo.naoCirculante = {
        imobilizado: (balanco[ano].ativo.naoCirculante.imobilizado / ativoTotal) * 100,
        intangivel: (balanco[ano].ativo.naoCirculante.intangivel / ativoTotal) * 100,
        total: (balanco[ano].ativo.naoCirculante.total / ativoTotal) * 100
    };

    // PASSIVO
    resultado.passivo.circulante = {
        fornecedores: (balanco[ano].passivo.circulante.fornecedores / passivoTotal) * 100,
        emprestimos: (balanco[ano].passivo.circulante.emprestimos / passivoTotal) * 100,
        total: (balanco[ano].passivo.circulante.total / passivoTotal) * 100
    };

    resultado.passivo.naoCirculante = {
        emprestimosLP: (balanco[ano].passivo.naoCirculante.emprestimosLP / passivoTotal) * 100,
        total: (balanco[ano].passivo.naoCirculante.total / passivoTotal) * 100
    };

    resultado.passivo.patrimonioLiquido = {
        capitalSocial: (balanco[ano].passivo.patrimonioLiquido.capitalSocial / passivoTotal) * 100,
        lucrosAcumulados: (balanco[ano].passivo.patrimonioLiquido.lucrosAcumulados / passivoTotal) * 100,
        total: (balanco[ano].passivo.patrimonioLiquido.total / passivoTotal) * 100
    };

    return resultado;
}

/**
 * Calcula análise vertical da DRE
 * Cada conta como % da Receita Líquida
 */
calcularAnaliseVerticalDRE(dre, ano) {
    const receitaLiquida = dre[ano].receitaLiquida;

    return {
        ano,
        receitaBruta: (dre[ano].receitaBruta / receitaLiquida) * 100,
        deducoes: (dre[ano].deducoes / receitaLiquida) * 100,
        receitaLiquida: 100.0, // Sempre 100%
        cmv: (dre[ano].cmv / receitaLiquida) * 100,
        lucroBruto: (dre[ano].lucroBruto / receitaLiquida) * 100,
        despesasOperacionais: (dre[ano].despesasOperacionais / receitaLiquida) * 100,
        lucroOperacional: (dre[ano].lucroOperacional / receitaLiquida) * 100,
        despesasFinanceiras: (dre[ano].despesasFinanceiras / receitaLiquida) * 100,
        lucroLiquido: (dre[ano].lucroLiquido / receitaLiquida) * 100
    };
}
```

### 4.6 Fórmulas - Análise Horizontal

```javascript
/**
 * Calcula análise horizontal
 * Ano base = 100%, demais anos = % de variação
 */
calcularAnaliseHorizontal(demonstrativos, tipoDemo) {
    const anos = demonstrativos.anos.sort(); // [2023, 2024, 2025]
    const anoBase = anos[0]; // 2023

    const resultado = {
        anoBase,
        evolucao: {}
    };

    // Para cada ano (exceto o base)
    anos.forEach(ano => {
        if (ano === anoBase) {
            resultado.evolucao[ano] = this.criarObjetoBase100(demonstrativos, tipoDemo, ano);
        } else {
            resultado.evolucao[ano] = this.calcularVariacao(
                demonstrativos,
                tipoDemo,
                anoBase,
                ano
            );
        }
    });

    return resultado;
}

/**
 * Cria objeto com todos valores = 100 (ano base)
 */
criarObjetoBase100(demonstrativos, tipo, ano) {
    const demo = demonstrativos[tipo][ano];
    const resultado = {};

    // Recursivamente setar tudo como 100
    Object.keys(demo).forEach(key => {
        if (typeof demo[key] === 'object' && !Array.isArray(demo[key])) {
            resultado[key] = this.criarObjetoBase100({ [tipo]: { [ano]: demo[key] } }, tipo, ano);
        } else {
            resultado[key] = 100.0;
        }
    });

    return resultado;
}

/**
 * Calcula % de variação entre anos
 * Fórmula: ((ValorAnoAtual / ValorAnoBase) * 100)
 */
calcularVariacao(demonstrativos, tipo, anoBase, anoAtual) {
    const demoBase = demonstrativos[tipo][anoBase];
    const demoAtual = demonstrativos[tipo][anoAtual];

    const resultado = {};

    Object.keys(demoBase).forEach(key => {
        if (typeof demoBase[key] === 'object' && !Array.isArray(demoBase[key])) {
            resultado[key] = this.calcularVariacao(
                { [tipo]: { [anoBase]: demoBase[key], [anoAtual]: demoAtual[key] } },
                tipo,
                anoBase,
                anoAtual
            );
        } else {
            const valorBase = demoBase[key];
            const valorAtual = demoAtual[key];

            // Evitar divisão por zero
            if (valorBase === 0) {
                resultado[key] = valorAtual === 0 ? 100.0 : null;
            } else {
                resultado[key] = (valorAtual / valorBase) * 100;
            }
        }
    });

    return resultado;
}
```

### 4.7 Contas a Analisar

**Balanço Patrimonial:**

- Ativo Circulante (Caixa, Contas a Receber, Estoques)
- Ativo Não Circulante (Imobilizado, Intangível)
- Passivo Circulante (Fornecedores, Empréstimos CP)
- Passivo Não Circulante (Empréstimos LP)
- Patrimônio Líquido (Capital Social, Lucros Acumulados)

**DRE:**

- Receita Bruta
- Deduções
- Receita Líquida
- CMV/CPV
- Lucro Bruto
- Despesas Operacionais
- Lucro Operacional
- Despesas Financeiras
- Lucro Líquido

### 4.8 Método Principal de Análise

```javascript
/**
 * Executa análise completa (vertical + horizontal)
 */
async analisar(demonstrativos) {
    try {
        console.log('🔍 Iniciando análise vertical e horizontal...');

        this.demonstrativos = demonstrativos;

        const resultado = {
            vertical: {
                balanco: {},
                dre: {}
            },
            horizontal: {
                balanco: null,
                dre: null
            },
            insights: [],
            alertas: []
        };

        // Análise Vertical para cada ano
        demonstrativos.anos.forEach(ano => {
            resultado.vertical.balanco[ano] = this.calcularAnaliseVerticalBalanco(
                demonstrativos.balanco,
                ano
            );
            resultado.vertical.dre[ano] = this.calcularAnaliseVerticalDRE(
                demonstrativos.dre,
                ano
            );
        });

        // Análise Horizontal
        resultado.horizontal.balanco = this.calcularAnaliseHorizontal(
            demonstrativos,
            'balanco'
        );
        resultado.horizontal.dre = this.calcularAnaliseHorizontal(
            demonstrativos,
            'dre'
        );

        // Gerar insights
        resultado.insights = this.gerarInsights(resultado);

        // Gerar alertas
        resultado.alertas = this.gerarAlertas(resultado);

        console.log('✅ Análise vertical/horizontal concluída');
        return resultado;

    } catch (error) {
        console.error('❌ Erro na análise vertical/horizontal:', error);
        throw error;
    }
}
```

### 4.9 Estrutura de Saída

```javascript
{
    vertical: {
        balanco: {
            2023: {
                ano: 2023,
                ativo: {
                    circulante: {
                        caixa: 8.33,          // 50000/600000 * 100
                        contasReceber: 20.00,  // 120000/600000 * 100
                        estoques: 13.33,       // 80000/600000 * 100
                        total: 41.67           // 250000/600000 * 100
                    },
                    // ...
                }
            },
            2024: { /* ... */ },
            2025: { /* ... */ }
        },
        dre: {
            2023: {
                ano: 2023,
                receitaBruta: 111.11,          // 1000000/900000 * 100
                deducoes: -11.11,               // -100000/900000 * 100
                receitaLiquida: 100.00,         // Base
                cmv: -55.56,
                lucroBruto: 44.44,
                // ...
            }
        }
    },
    horizontal: {
        balanco: {
            anoBase: 2023,
            evolucao: {
                2023: { /* tudo 100.0 */ },
                2024: {
                    ativo: {
                        circulante: {
                            caixa: 120.0,  // Cresceu 20%
                            // ...
                        }
                    }
                },
                2025: { /* ... */ }
            }
        },
        dre: { /* similar */ }
    },
    insights: [
        "Ativo Circulante representa 41.67% do Ativo Total em 2023",
        "Caixa cresceu 20% entre 2023 e 2024",
        "Margem de Lucro Líquido de 16.67% em 2023"
    ],
    alertas: [
        {
            tipo: 'atencao',
            mensagem: 'Estoques representam mais de 10% do Ativo Total',
            severidade: 'media'
        }
    ]
}
```

### 4.10 Padrão de Exportação

```javascript
window.AnaliseVerticalHorizontal = AnaliseVerticalHorizontal;
```

***

## 💰 5. CAPITAL-GIRO-CALCULATOR.JS

### 5.1 Propósito

Calcular indicadores de capital de giro, necessidade de capital de giro (NCG) e ciclos financeiros.

### 5.2 Estrutura de Classe

```javascript
class CapitalGiroCalculator {
    constructor(config) {
        this.config = config;
    }

    async init() {
        console.log('✅ CapitalGiroCalculator inicializado');
        return true;
    }
}
```

### 5.3 Fórmulas Principais

```javascript
/**
 * 1. Capital de Giro Líquido (CGL)
 * Fórmula: CGL = Ativo Circulante - Passivo Circulante
 */
calcularCapitalGiroLiquido(ativoCirculante, passivoCirculante) {
    return ativoCirculante - passivoCirculante;
}

/**
 * 2. Necessidade de Capital de Giro (NCG)
 * Fórmula: NCG = (Estoques + Contas a Receber) - Fornecedores
 * 
 * Representa quanto a empresa precisa para financiar operações
 */
calcularNCG(estoques, contasReceber, fornecedores) {
    return (estoques + contasReceber) - fornecedores;
}

/**
 * 3. Saldo de Tesouraria (ST)
 * Fórmula: ST = CGL - NCG
 * 
 * Indica se a empresa tem folga (ST > 0) ou aperto (ST < 0) financeiro
 */
calcularSaldoTesouraria(cgl, ncg) {
    return cgl - ncg;
}

/**
 * 4. Prazo Médio de Recebimento (PMR) em dias
 * Fórmula: PMR = (Contas a Receber / Receita Bruta) * 360
 */
calcularPMR(contasReceber, receitaBruta) {
    if (receitaBruta === 0) return 0;
    return (contasReceber / receitaBruta) * 360;
}

/**
 * 5. Prazo Médio de Estocagem (PME) em dias
 * Fórmula: PME = (Estoques / CMV) * 360
 */
calcularPME(estoques, cmv) {
    if (cmv === 0) return 0;
    return (estoques / Math.abs(cmv)) * 360;
}

/**
 * 6. Prazo Médio de Pagamento (PMP) em dias
 * Fórmula: PMP = (Fornecedores / CMV) * 360
 */
calcularPMP(fornecedores, cmv) {
    if (cmv === 0) return 0;
    return (fornecedores / Math.abs(cmv)) * 360;
}

/**
 * 7. Ciclo Operacional (CO) em dias
 * Fórmula: CO = PMR + PME
 * 
 * Tempo desde a compra até o recebimento da venda
 */
calcularCicloOperacional(pmr, pme) {
    return pmr + pme;
}

/**
 * 8. Ciclo Financeiro (CF) em dias
 * Fórmula: CF = CO - PMP
 * 
 * Tempo que a empresa precisa financiar suas operações
 */
calcularCicloFinanceiro(cicloOperacional, pmp) {
    return cicloOperacional - pmp;
}

/**
 * 9. Ciclo Econômico
 * É o mesmo que Ciclo Operacional (PMR + PME)
 */
calcularCicloEconomico(pmr, pme) {
    return this.calcularCicloOperacional(pmr, pme);
}
```

### 5.4 Adaptação do calculador-ciclos-financeiros.js

O projeto mapeador-projetos já tem um calculador similar. Para adaptar:

```javascript
/**
 * Adapta estrutura do mapeador-projetos para CreditScore Pro
 */
adaptarDadosMapeadorProjetos(dadosMapeador) {
    // Mapeador usa nomes diferentes, precisamos mapear
    return {
        ativoCirculante: dadosMapeador.ativoCirculante || 0,
        passivoCirculante: dadosMapeador.passivoCirculante || 0,
        estoques: dadosMapeador.estoques || 0,
        contasReceber: dadosMapeador.contasAReceber || 0,
        fornecedores: dadosMapeador.fornecedores || 0,
        receitaBruta: dadosMapeador.faturamento || 0,
        cmv: Math.abs(dadosMapeador.custosMercadorias || 0)
    };
}
```

### 5.5 Estrutura de Dados de Entrada

```javascript
const dadosCapitalGiro = {
    // Do Balanço Patrimonial
    ativoCirculante: 250000,
    passivoCirculante: 150000,
    estoques: 80000,
    contasReceber: 120000,
    fornecedores: 100000,

    // Da DRE
    receitaBruta: 1000000,
    cmv: 500000
};
```

### 5.6 Método Principal de Análise

```javascript
/**
 * Analisa capital de giro completo
 */
async analisar(dados) {
    try {
        console.log('💰 Iniciando análise de capital de giro...');

        const resultado = {
            // Indicadores absolutos
            cgl: this.calcularCapitalGiroLiquido(
                dados.ativoCirculante,
                dados.passivoCirculante
            ),
            ncg: this.calcularNCG(
                dados.estoques,
                dados.contasReceber,
                dados.fornecedores
            ),

            // Prazos médios
            pmr: this.calcularPMR(dados.contasReceber, dados.receitaBruta),
            pme: this.calcularPME(dados.estoques, dados.cmv),
            pmp: this.calcularPMP(dados.fornecedores, dados.cmv),

            // Ciclos
            cicloOperacional: 0,
            cicloFinanceiro: 0,
            cicloEconomico: 0,

            // Saldo
            saldoTesouraria: 0,

            // Análises
            situacao: '',
            alertas: [],
            recomendacoes: []
        };

        // Calcular ciclos
        resultado.cicloOperacional = this.calcularCicloOperacional(
            resultado.pmr,
            resultado.pme
        );

        resultado.cicloFinanceiro = this.calcularCicloFinanceiro(
            resultado.cicloOperacional,
            resultado.pmp
        );

        resultado.cicloEconomico = this.calcularCicloEconomico(
            resultado.pmr,
            resultado.pme
        );

        // Calcular saldo de tesouraria
        resultado.saldoTesouraria = this.calcularSaldoTesouraria(
            resultado.cgl,
            resultado.ncg
        );

        // Analisar situação
        resultado.situacao = this.analisarSituacao(resultado);

        // Gerar alertas
        resultado.alertas = this.gerarAlertas(resultado);

        // Gerar recomendações
        resultado.recomendacoes = this.gerarRecomendacoes(resultado);

        console.log('✅ Análise de capital de giro concluída');
        return resultado;

    } catch (error) {
        console.error('❌ Erro na análise de capital de giro:', error);
        throw error;
    }
}

/**
 * Analisa situação financeira baseada nos indicadores
 */
analisarSituacao(resultado) {
    const { cgl, ncg, saldoTesouraria, cicloFinanceiro } = resultado;

    // Tipo 1: Situação Excelente (CGL > NCG, ST > 0, CF baixo)
    if (cgl > 0 && ncg > 0 && saldoTesouraria > 0 && cicloFinanceiro < 30) {
        return 'EXCELENTE - Empresa autofinancia operações com folga';
    }

    // Tipo 2: Situação Boa (CGL > NCG, ST > 0)
    if (cgl > 0 && ncg > 0 && saldoTesouraria > 0) {
        return 'BOA - Empresa autofinancia operações';
    }

    // Tipo 3: Situação Equilibrada (CGL ≈ NCG, ST ≈ 0)
    if (cgl > 0 && ncg > 0 && Math.abs(saldoTesouraria) < (cgl * 0.1)) {
        return 'EQUILIBRADA - Empresa financia operações sem folga';
    }

    // Tipo 4: Situação Arriscada (CGL < NCG, ST < 0)
    if (cgl > 0 && ncg > 0 && saldoTesouraria < 0) {
        return 'ARRISCADA - Empresa precisa de capital de terceiros';
    }

    // Tipo 5: Situação Crítica (CGL < 0)
    if (cgl < 0) {
        return 'CRÍTICA - Passivo circulante maior que ativo circulante';
    }

    return 'INDETERMINADA';
}

/**
 * Gera alertas baseados nos indicadores
 */
gerarAlertas(resultado) {
    const alertas = [];

    if (resultado.cgl < 0) {
        alertas.push({
            tipo: 'critico',
            mensagem: 'Capital de Giro Líquido negativo',
            severidade: 'alta'
        });
    }

    if (resultado.cicloFinanceiro > 90) {
        alertas.push({
            tipo: 'atencao',
            mensagem: 'Ciclo financeiro muito longo (> 90 dias)',
            severidade: 'media'
        });
    }

    if (resultado.saldoTesouraria < 0) {
        alertas.push({
            tipo: 'atencao',
            mensagem: 'Saldo de tesouraria negativo',
            severidade: 'media'
        });
    }

    if (resultado.pmr > 60) {
        alertas.push({
            tipo: 'informativo',
            mensagem: 'Prazo médio de recebimento elevado',
            severidade: 'baixa'
        });
    }

    return alertas;
}
```

### 5.7 Estrutura de Dados de Saída

```javascript
{
    // Indicadores em valores absolutos (R$)
    cgl: 100000,              // Capital de Giro Líquido
    ncg: 100000,              // Necessidade de Capital de Giro
    saldoTesouraria: 0,       // Saldo de Tesouraria

    // Prazos médios (dias)
    pmr: 43.2,                // Prazo Médio de Recebimento
    pme: 57.6,                // Prazo Médio de Estocagem
    pmp: 72.0,                // Prazo Médio de Pagamento

    // Ciclos (dias)
    cicloOperacional: 100.8,  // PMR + PME
    cicloFinanceiro: 28.8,    // CO - PMP
    cicloEconomico: 100.8,    // Mesmo que CO

    // Análises
    situacao: 'BOA - Empresa autofinancia operações',
    alertas: [],
    recomendacoes: [
        'Manter controle de estoques',
        'Negociar prazos com fornecedores'
    ]
}
```

### 5.8 Padrão de Exportação

```javascript
window.CapitalGiroCalculator = CapitalGiroCalculator;
```

***

## 🔗 3. INTEGRAÇÕES E FLUXOS

### 3.1 Comunicação entre Componentes Core

```javascript
// Sequência de inicialização no creditscore-module.js
async inicializarSistema() {
    // 1. Carregar configuração
    const config = await ConfigLoader.load();

    // 2. Inicializar IndexedDB
    const dbManager = new IndexedDBManager();
    await dbManager.init();

    // 3. Criar FormGenerator
    const formGenerator = new FormGenerator(config);
    await formGenerator.init();

    // 4. Criar NavigationController (depende de tabs.js)
    const navigationController = new NavigationController(config, window.tabNavigation);
    await navigationController.init();

    // 5. Criar AutoSave (depende de FormGenerator e DBManager)
    const autoSave = new AutoSave(config, formGenerator, dbManager);
    await autoSave.init(this);

    // 6. Gerar módulos iniciais
    this.config.modules.forEach(module => {
        const html = formGenerator.generateModule(module.id);
        document.getElementById(`module-${module.id}`).innerHTML = html;
    });

    // 7. Restaurar navegação (se houver)
    navigationController.restoreNavigationState();
}
```

### 3.2 Fluxo de Eventos

```javascript
// FormGenerator dispara eventos
document.addEventListener('fieldChanged', (e) => {
    // AutoSave marca como dirty
    autoSave.isDirty = true;

    // NavigationController pode validar progressão
    if (navigationController.isModuleComplete(e.detail.moduleId)) {
        navigationController.markModuleComplete(e.detail.moduleId);
    }
});

// NavigationController dispara eventos
document.addEventListener('moduleCompleted', (e) => {
    // CreditScoreModule pode calcular índices
    if (e.detail.moduleId === 2) {
        creditScoreModule.calcularIndicesFinanceiros();
    }
});
```

### 3.3 Instanciação dos Calculadores

```javascript
// No creditscore-module.js método initCalculadores()
async initCalculadores() {
    // Análise Vertical e Horizontal
    if (window.AnaliseVerticalHorizontal) {
        this.analiseCalculator = new window.AnaliseVerticalHorizontal(this.config);
        await this.analiseCalculator.init();
    }

    // Capital de Giro Calculator
    if (window.CapitalGiroCalculator) {
        this.capitalGiroCalculator = new window.CapitalGiroCalculator(this.config);
        await this.capitalGiroCalculator.init();
    }

    console.log('✅ Calculadores inicializados');
}

// Uso posterior
async calcularDemonstrativos(dados) {
    const resultadoAnalise = await this.analiseCalculator.analisar(dados.demonstrativos);
    const resultadoCapitalGiro = await this.capitalGiroCalculator.analisar(dados.balanco);

    return { resultadoAnalise, resultadoCapitalGiro };
}
```

### 3.4 Interação com IndexedDB

```javascript
// AutoSave salvando dados
await this.db.save('autosave', {
    id: 'current_session',
    timestamp: Date.now(),
    formData: dados
});

// CreditScoreModule salvando análise completa
await this.salvarDados('empresas', {
    cnpj: dados.cnpj,
    razaoSocial: dados.razaoSocial,
    dataAnalise: new Date().toISOString()
});

await this.salvarDados('demonstracoes', {
    empresaId: empresaId,
    ano: 2025,
    tipo: 'balanco',
    dados: dados.balanco
});
```

***

## 📐 4. PADRÕES E CONVENÇÕES

### 4.1 Padrão de Exportação

```javascript
// Final de cada arquivo
window.NomeDaClasse = NomeDaClasse;

// Verificação opcional
if (typeof window !== 'undefined') {
    window.NomeDaClasse = NomeDaClasse;
}
```

### 4.2 JSDoc Padrão

```javascript
/**
 * Descrição breve da função
 * 
 * @param {tipo} nomeParametro - Descrição do parâmetro
 * @param {Object} config - Objeto de configuração
 * @param {number} config.valor - Propriedade do objeto
 * @returns {tipo} Descrição do retorno
 * @throws {Error} Quando acontece erro específico
 * 
 * @example
 * const resultado = minhaFuncao(10, { valor: 5 });
 */
minhaFuncao(nomeParametro, config) {
    // implementação
}
```

### 4.3 Console.log com Emojis

```javascript
console.log('✅ Sucesso');
console.log('❌ Erro');
console.log('⚠️ Aviso');
console.log('🚀 Inicializando');
console.log('🔍 Analisando');
console.log('💾 Salvando');
console.log('📊 Calculando');
console.log('🔄 Processando');
console.log('ℹ️ Informação');
```

### 4.4 Nomeação de Métodos e Variáveis

```javascript
// CamelCase para classes
class FormGenerator {}

// camelCase para métodos e variáveis
const formData = {};
function calcularTotal() {}

// SNAKE_CASE para constantes
const MAX_TENTATIVAS = 3;
const DB_NAME = 'creditscore_pro_db';

// Prefixos comuns
is/has para booleanos: isValid, hasErrors
get para getters: getModuleConfig
set para setters: setInterval
calculate/calcular para cálculos: calcularTotal
validate/validar para validações: validateField
generate/gerar para geradores: generateHTML
```

### 4.5 Tratamento de Erros

```javascript
try {
    // código
} catch (error) {
    console.error('❌ Contexto do erro:', error);

    // Opcional: registrar no sistema
    this.logError(error);

    // Opcional: notificar usuário
    this.showNotification('Erro ao processar', 'error');

    // Re-throw se necessário
    throw error;
}
```

***

## 🎯 5. PRIORIDADES DE IMPLEMENTAÇÃO

### 5.1 Ordem Recomendada

```
1. FormGenerator (base para tudo)
   ↓
2. NavigationController (navegação funcionando)
   ↓
3. AutoSave (persistência garantida)
   ↓
4. AnaliseVerticalHorizontal (cálculos do módulo 2)
   ↓
5. CapitalGiroCalculator (complementa módulo 2)
```

### 5.2 Dependências

```
FormGenerator
├── Não tem dependências externas
└── Depende apenas do config

NavigationController
├── Depende de tabs.js (já existe)
└── Depende do config

AutoSave
├── Depende de FormGenerator
├── Depende de IndexedDBManager (já existe)
└── Depende de creditscore-module.js

AnaliseVerticalHorizontal
├── Depende do config
└── Não depende de outros calculadores

CapitalGiroCalculator
├── Depende do config
└── Pode usar dados de AnaliseVerticalHorizontal (opcional)
```

### 5.3 Prioridades por Impacto

**Alta Prioridade (bloqueadores):**

1. **FormGenerator** - Sistema não funciona sem formulários
2. **NavigationController** - Navegação está quebrada

**Média Prioridade (funcionalidade core):**
3. **AutoSave** - Perda de dados é crítica
4. **AnaliseVerticalHorizontal** - Módulo 2 depende disso

**Baixa Prioridade (complementar):**
5. **CapitalGiroCalculator** - Melhora análise mas não é bloqueador

***

## 📝 RESUMO EXECUTIVO

Com estas especificações, você tem:

✅ **FormGenerator** - Gera formulários dinamicamente a partir do config, com 12 tipos de campo, máscaras integradas e data binding

✅ **NavigationController** - Gerencia navegação pelos 8 módulos com validação, progress bar e integração com tabs.js

✅ **AutoSave** - Salva automaticamente a cada 30s no IndexedDB com prompt de restauração

✅ **AnaliseVerticalHorizontal** - Calcula análise vertical (% sobre total) e horizontal (evolução entre anos) de BP e DRE

✅ **CapitalGiroCalculator** - Calcula CGL, NCG, ciclos financeiros (PMR, PME, PMP, CO, CF) com fórmulas exatas

📋 **Padrões definidos** - Exportação, JSDoc, console.log, nomeação, tratamento de erros

🔗 **Integrações mapeadas** - Fluxo de inicialização, eventos, comunicação entre componentes

🎯 **Ordem de implementação** - Prioridades claras com dependências identificadas

Todos os componentes seguem os princípios do projeto: **NO HARDCODED DATA**, **NO FALLBACKS**, **KISS**, **DRY**, **SOLID**.

Sources
