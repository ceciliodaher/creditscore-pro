# Roadmap - Fases 2, 3 e 4

**Projeto:** CreditScore Pro
**Criado em:** 2025-10-22
**Baseado em:** Análise Arquitetural Completa (ARCHITECTURAL-ANALYSIS.md)

---

## 📋 OVERVIEW DAS FASES

| Fase | Objetivo | Tempo | Prioridade | Status |
|------|----------|-------|------------|--------|
| **FASE 1** | Correção de Blockers | 15min | ⚠️⚠️⚠️ CRÍTICO | 🟡 EM ANDAMENTO |
| **FASE 2** | Padronização Arquitetura | 4h | ⚠️⚠️ ALTO | 🔴 PENDENTE |
| **FASE 3** | Eliminação de Fallbacks | 2h | ⚠️ MÉDIO | 🔴 PENDENTE |
| **FASE 4** | Melhoria de Qualidade | 8h | ℹ️ BAIXO | 🔴 PENDENTE |

---

## 🎯 FASE 2 - Padronização de Arquitetura

**Tempo estimado:** 4 horas
**Pré-requisito:** FASE 1 concluída com sucesso
**Branch:** `phase2-architecture-refactoring`

### Objetivos

1. **Padronizar exports** - Todos os módulos usam ES6 + window
2. **Dependency Injection** - CreditScoreModule recebe messages via constructor
3. **Remover globals** - Eliminar dependências de window.MESSAGES/CONFIG
4. **Lifecycle explícito** - HierarchicalNavigation.init() manual

---

### 2.1 - Padronizar Exports em Todos os Módulos

**Arquivos afetados:**
- `src/assets/js/core/config-loader.js`
- `src/assets/js/core/creditscore-module.js`
- `src/assets/js/tabs.js`

**Padrão a implementar:**
```javascript
export class ModuleName {
    // ... class implementation
}

// Global export para retrocompatibilidade
if (typeof window !== 'undefined') {
    window.ModuleName = ModuleName;
}

// Default export (opcional)
export default ModuleName;
```

**Checklist:**
- [ ] ConfigLoader com export ES6
- [ ] CreditScoreModule com export ES6
- [ ] HierarchicalNavigation com export ES6
- [ ] Atualizar imports em analise-credito.html se necessário

---

### 2.2 - Dependency Injection - CreditScoreModule

**Objetivo:** Remover dependência de window.MESSAGES

**Arquivo:** `src/assets/js/core/creditscore-module.js`

**ANTES:**
```javascript
constructor(config) {
    if (!config) throw new Error(...);
    this.config = config;
    this.messages = null; // Definido no init()
}

async init() {
    // ...
    if (!window.MESSAGES) {
        throw new Error('window.MESSAGES não disponível');
    }
    this.messages = window.MESSAGES;
}
```

**DEPOIS:**
```javascript
constructor(config, messages) {
    if (!config) {
        throw new Error('CreditScoreModule: config obrigatória não fornecida');
    }
    if (!messages) {
        throw new Error('CreditScoreModule: messages obrigatório não fornecido');
    }

    this.config = config;
    this.messages = messages; // Injetado via constructor
    // ... resto
}

async init() {
    // ... REMOVER validação de window.MESSAGES
    // Messages já validado no constructor
}
```

**Arquivo:** `src/pages/analise-credito.html`

**ANTES (linha 308):**
```javascript
this.modules.set('creditScore', new window.CreditScoreModule(this.config));
```

**DEPOIS:**
```javascript
this.modules.set('creditScore', new window.CreditScoreModule(
    this.config,
    this.messages  // Passa explicitamente
));
```

**Checklist:**
- [ ] Atualizar constructor CreditScoreModule
- [ ] Remover validação window.MESSAGES do init()
- [ ] Atualizar instanciação em analise-credito.html
- [ ] REMOVER window.MESSAGES e window.CONFIG de loadConfig()
- [ ] Testar que sistema ainda inicializa

---

### 2.3 - Refatorar HierarchicalNavigation Lifecycle

**Objetivo:** Lifecycle manual via init(), não auto-inicialização

**Arquivo:** `src/assets/js/tabs.js`

**ANTES:**
```javascript
constructor() {
    const tabItems = document.querySelectorAll('.tab-item');
    if (tabItems.length === 0) {
        throw new Error('Nenhuma aba encontrada');
    }
    // Inicialização no constructor
}
```

**DEPOIS:**
```javascript
constructor(options = {}) {
    // Setup inicial SEM buscar DOM
    this.currentTab = 1;
    this.currentSection = 1;
    this.sectionMap = options.sectionMap || {};
    this.protectedTabs = options.protectedTabs || [];
    // ... estado inicial apenas
}

/**
 * Inicializa navegação hierárquica
 * DEVE ser chamado APÓS .tab-item existirem no DOM
 * @throws {Error} Se .tab-item não encontrados
 */
async init() {
    const tabItems = document.querySelectorAll('.tab-item');
    if (tabItems.length === 0) {
        throw new Error('HierarchicalNavigation: Nenhuma aba encontrada no DOM');
    }

    this.totalTabs = tabItems.length;
    this.setupEventListeners();
    this.initializeTabStates();

    console.log('✅ HierarchicalNavigation inicializado');
}
```

**Arquivo:** `src/pages/analise-credito.html`

**ANTES (linha 323-326):**
```javascript
this.hierarchicalNav = new window.HierarchicalNavigation();
window.hierarchicalNavigation = this.hierarchicalNav;
console.log('✅ HierarchicalNavigation criado');
```

**DEPOIS:**
```javascript
this.hierarchicalNav = new window.HierarchicalNavigation();
await this.hierarchicalNav.init();  // ✅ Init explícito
window.hierarchicalNavigation = this.hierarchicalNav;
console.log('✅ HierarchicalNavigation inicializado');
```

**Checklist:**
- [ ] Mover validação de tabs do constructor para init()
- [ ] Constructor apenas setup de estado
- [ ] Adicionar método init() assíncrono
- [ ] Atualizar analise-credito.html para chamar init()
- [ ] Testar que navegação funciona

---

### 2.4 - Remover window.CONFIG (se usado)

**Objetivo:** Passar config via constructor para todos os módulos que precisam

**Pesquisar:** Procurar por `window.CONFIG` no código

```bash
grep -r "window.CONFIG" src/assets/js/
```

**Se encontrado:** Aplicar mesmo pattern de Dependency Injection usado para messages

---

### Critérios de Sucesso FASE 2

- [ ] Todos os módulos usam export ES6 + window
- [ ] Nenhum módulo acessa window.MESSAGES ou window.CONFIG
- [ ] CreditScoreModule recebe messages via constructor
- [ ] HierarchicalNavigation tem init() explícito
- [ ] Sistema inicializa sem erros
- [ ] Todos os testes passam

---

## 🚫 FASE 3 - Eliminação de Fallbacks

**Tempo estimado:** 2 horas
**Pré-requisito:** FASE 2 concluída
**Branch:** `phase3-no-fallbacks`

### Princípio

**NO FALLBACKS, NO HARDCODED DATA**

Módulos devem:
- ❌ **NÃO** ter valores default
- ❌ **NÃO** ter fallback para outras storages
- ✅ **SIM** lançar erro explícito se dependência ausente
- ✅ **SIM** validar config estrita

---

### 3.1 - AutoSave: Remover Fallback localStorage

**Arquivo:** `src/assets/js/core/auto-save.js`

**Problemas identificados:**

**Linha 178-200 - checkForSavedData():**
```javascript
async checkForSavedData() {
    let savedData = null;
    try {
        savedData = await this.db.get('autosave', 'current_session');
    } catch (error) {
        console.warn('⚠️ Sem dados no IndexedDB, tentando localStorage');
        // ❌ FALLBACK - viola princípio
    }
    if (!savedData) {
        const localData = localStorage.getItem('creditscore_autosave');
        // ❌ FALLBACK - viola princípio
    }
}
```

**Correção:**
```javascript
async checkForSavedData() {
    // IndexedDB obrigatório - sem fallback
    if (!this.db) {
        throw new Error('AutoSave: IndexedDB não disponível - obrigatório para restauração');
    }

    const savedData = await this.db.get('autosave', 'current_session');
    return savedData || null;
}
```

**Linha 252-263 - save():**
```javascript
// REMOVER lógica de fallback localStorage
// Apenas IndexedDB - lançar erro se não disponível
```

**Checklist:**
- [ ] Remover fallback localStorage de checkForSavedData()
- [ ] Remover fallback localStorage de save()
- [ ] Lançar erro se IndexedDB não disponível
- [ ] Atualizar config para garantir IndexedDB sempre disponível
- [ ] Testar que auto-save funciona corretamente

---

### 3.2 - CreditScoreModule: Remover Defaults

**Arquivo:** `src/assets/js/core/creditscore-module.js`

**Linha 148-155 - initCoreInfrastructure():**
```javascript
// ANTES (com defaults)
if (!this.config.autoSaveInterval) {
    this.config.autoSaveInterval = 30000; // ❌ FALLBACK
    console.log('⚠️ autoSaveInterval não configurado, usando default: 30000ms');
}
```

**DEPOIS (sem defaults):**
```javascript
// Validar que config tem todas as propriedades obrigatórias
if (!this.config.autoSaveInterval) {
    throw new Error('CreditScoreModule: config.autoSaveInterval obrigatório');
}
if (!this.config.autoSaveMaxVersions) {
    throw new Error('CreditScoreModule: config.autoSaveMaxVersions obrigatório');
}
// Uso direto sem defaults
```

**Checklist:**
- [ ] Identificar todos os `if (!config.x) { config.x = default }`
- [ ] Substituir por `if (!config.x) throw new Error(...)`
- [ ] Garantir que creditscore-config.json tem TODOS os valores
- [ ] Documentar propriedades obrigatórias em JSON Schema

---

### 3.3 - Validação Estrita de Config

**Criar:** `src/assets/js/core/config-validator.js`

```javascript
export class ConfigValidator {
    static validate(config) {
        const required = [
            'systemName',
            'version',
            'database.name',
            'database.version',
            'autoSaveInterval',
            'autoSaveMaxVersions',
            'modules',
            'scoringEngine',
            'validationRules'
        ];

        const missing = [];
        for (const path of required) {
            if (!this.#hasPath(config, path)) {
                missing.push(path);
            }
        }

        if (missing.length > 0) {
            throw new Error(`Config inválida: propriedades obrigatórias ausentes: ${missing.join(', ')}`);
        }

        // Validações de tipo
        if (!Array.isArray(config.modules)) {
            throw new Error('Config inválida: modules deve ser um array');
        }

        if (typeof config.autoSaveInterval !== 'number') {
            throw new Error('Config inválida: autoSaveInterval deve ser um número');
        }

        // ... mais validações
    }

    static #hasPath(obj, path) {
        const parts = path.split('.');
        let current = obj;
        for (const part of parts) {
            if (!current || !current[part]) return false;
            current = current[part];
        }
        return true;
    }
}
```

**Uso:**
```javascript
// analise-credito.html - loadConfig()
this.config = await configResponse.json();
ConfigValidator.validate(this.config); // ✅ Lança erro se inválido
```

**Checklist:**
- [ ] Criar ConfigValidator
- [ ] Validar todas as propriedades obrigatórias
- [ ] Validar tipos (number, string, array, object)
- [ ] Validar ranges (ex: autoSaveInterval >= 1000)
- [ ] Integrar em loadConfig()

---

### Critérios de Sucesso FASE 3

- [ ] Nenhum fallback localStorage
- [ ] Nenhum valor default hardcoded
- [ ] Config validada com ConfigValidator
- [ ] Erros explícitos se dependências ausentes
- [ ] Sistema funciona com validação estrita

---

## 🎓 FASE 4 - Melhoria de Qualidade

**Tempo estimado:** 8 horas
**Pré-requisito:** FASE 3 concluída
**Branch:** `phase4-quality-improvements`

---

### 4.1 - JSDoc Completo

**Objetivo:** Documentar todas as classes, métodos e parâmetros

**Padrão:**
```javascript
/**
 * @class NavigationController
 * @description Gerencia navegação entre módulos com validação de dependências
 *
 * @param {Object} config - Configuração do sistema (creditscore-config.json)
 * @param {Object} messages - Mensagens localizadas (messages.json)
 * @param {HierarchicalNavigation} hierarchicalNav - Sistema de navegação hierárquica
 *
 * @throws {Error} Se config ausente
 * @throws {Error} Se messages ausentes
 * @throws {Error} Se hierarchicalNav ausente
 *
 * @example
 * const nav = new NavigationController(config, messages, hierarchicalNav);
 * await nav.init();
 * nav.navigateToModule(2);
 */
```

**Checklist:**
- [ ] JSDoc em todas as classes
- [ ] JSDoc em todos os métodos públicos
- [ ] `@param` com tipos
- [ ] `@throws` para todas as exceções
- [ ] `@example` para uso comum
- [ ] `@returns` com tipo

---

### 4.2 - Padronizar Nomenclatura

**Objetivo:** Inglês + camelCase + `#` para private

**Regras:**
- **Idioma:** Inglês para código, português apenas em UI
- **Métodos:** camelCase (ex: `validateConfig`)
- **Classes:** PascalCase (ex: `NavigationController`)
- **Constantes:** UPPER_SNAKE_CASE (ex: `MAX_RETRIES`)
- **Private:** `#methodName` (ex: `#buildSaveData`)

**Checklist:**
- [ ] Renomear métodos português → inglês
- [ ] Padronizar camelCase em todos os métodos
- [ ] Adicionar `#` em métodos privados
- [ ] Atualizar chamadas dos métodos renomeados

---

### 4.3 - Testes Unitários

**Framework:** Jest ou Vitest

**Estrutura:**
```
tests/
├── unit/
│   ├── config-loader.test.js
│   ├── form-generator.test.js
│   ├── navigation-controller.test.js
│   ├── auto-save.test.js
│   ├── creditscore-module.test.js
│   └── hierarchical-navigation.test.js
├── integration/
│   ├── initialization.test.js
│   └── navigation-flow.test.js
└── e2e/
    └── full-flow.test.js
```

**Exemplo - NavigationController:**
```javascript
import { NavigationController } from '@core/navigation-controller';

describe('NavigationController', () => {
    let config, messages, hierarchicalNav;

    beforeEach(() => {
        config = { modules: [...], totalSteps: 8 };
        messages = { navigation: {...} };
        hierarchicalNav = new HierarchicalNavigation();
    });

    describe('Constructor', () => {
        test('deve lançar erro se config ausente', () => {
            expect(() => new NavigationController()).toThrow('config obrigatória');
        });

        test('deve lançar erro se messages ausentes', () => {
            expect(() => new NavigationController(config)).toThrow('messages obrigatório');
        });

        test('deve instanciar com parâmetros válidos', () => {
            const nav = new NavigationController(config, messages, hierarchicalNav);
            expect(nav).toBeDefined();
        });
    });

    describe('navigateToModule', () => {
        test('deve permitir navegação para módulos completos', async () => {
            const nav = new NavigationController(config, messages, hierarchicalNav);
            await nav.init();
            nav.markModuleComplete(1);

            const result = nav.navigateToModule(2);
            expect(result).toBe(true);
        });

        test('deve bloquear navegação para módulos não completos', async () => {
            const nav = new NavigationController(config, messages, hierarchicalNav);
            await nav.init();

            const result = nav.navigateToModule(3);
            expect(result).toBe(false);
        });
    });
});
```

**Checklist:**
- [ ] Instalar Jest/Vitest
- [ ] Configurar jest.config.js
- [ ] Escrever testes para ConfigLoader
- [ ] Escrever testes para FormGenerator
- [ ] Escrever testes para NavigationController
- [ ] Escrever testes para AutoSave
- [ ] Escrever testes para CreditScoreModule
- [ ] Escrever testes para HierarchicalNavigation
- [ ] Atingir > 80% cobertura de código

---

### 4.4 - Refatorar CreditScoreModule

**Problema:** God Object (750 linhas, 30+ métodos)

**Solução:** Quebrar em sub-módulos

**Nova estrutura:**
```
src/assets/js/core/
├── creditscore-module.js (orquestrador, ~200 linhas)
├── database-manager.js (~150 linhas)
├── module-coordinator.js (~200 linhas)
└── validation-manager.js (~200 linhas)
```

**creditscore-module.js (orquestrador):**
```javascript
export class CreditScoreModule {
    constructor(config, messages) {
        this.config = config;
        this.messages = messages;

        // Delegação para sub-módulos
        this.database = new DatabaseManager(config, messages);
        this.coordinator = new ModuleCoordinator(config, messages);
        this.validator = new ValidationManager(config, messages);
    }

    async init() {
        await this.database.init();
        await this.coordinator.init();
        await this.validator.init();
    }

    // Métodos delegam para sub-módulos apropriados
}
```

**Checklist:**
- [ ] Identificar responsabilidades do CreditScoreModule
- [ ] Criar DatabaseManager (operações IndexedDB)
- [ ] Criar ModuleCoordinator (coordenação entre módulos)
- [ ] Criar ValidationManager (validações de negócio)
- [ ] Refatorar CreditScoreModule para orquestrador
- [ ] Atualizar testes
- [ ] Verificar que sistema funciona

---

### Critérios de Sucesso FASE 4

- [ ] JSDoc completo (100% das classes públicas)
- [ ] Nomenclatura padronizada (inglês + camelCase)
- [ ] Testes unitários (> 80% cobertura)
- [ ] CreditScoreModule refatorado (< 250 linhas)
- [ ] Complexidade ciclomática reduzida
- [ ] Sistema funciona sem regressões

---

## 📊 MÉTRICAS DE PROGRESSO

### Tracking por Fase

| Fase | Arquivos | Linhas + | Linhas - | Testes | Cobertura |
|------|----------|----------|----------|--------|-----------|
| 1 | 2 | +20 | -10 | 0 | N/A |
| 2 | 4 | +50 | -30 | 0 | N/A |
| 3 | 3 | +100 | -50 | 0 | N/A |
| 4 | 10 | +500 | -200 | 50+ | >80% |

### Debt Reduction

| Métrica | Antes | Após FASE 2 | Após FASE 3 | Após FASE 4 |
|---------|-------|-------------|-------------|-------------|
| Global Dependencies | 2 | 0 | 0 | 0 |
| Fallbacks | 3 | 3 | 0 | 0 |
| Test Coverage | 0% | 0% | 0% | >80% |
| Cyclomatic Complexity | Alta | Alta | Média | Baixa |
| JSDoc Coverage | 20% | 40% | 60% | 100% |

---

## 🔄 PROCESSO DE EXECUÇÃO

### Para cada Fase:

1. **Criar branch**
   ```bash
   git checkout -b phase{N}-nome-da-fase
   ```

2. **Implementar checklist**
   - Seguir ordem dos itens
   - Commitar incrementalmente
   - Testar após cada mudança

3. **Validar critérios de sucesso**
   - Executar testes
   - Verificar console sem erros
   - Testar funcionalidade manualmente

4. **Code review**
   - Revisão arquitetural
   - Verificar princípios SOLID
   - Validar NO FALLBACKS

5. **Merge para master**
   ```bash
   git checkout master
   git merge phase{N}-nome-da-fase
   git tag v1.{N}.0
   ```

6. **Documentar conclusão**
   - Atualizar PROGRESS.md
   - Exportar métricas
   - Próxima fase

---

## 📚 REFERÊNCIAS

- **Análise Arquitetural:** ARCHITECTURAL-ANALYSIS.md
- **FASE 1:** PHASE1-IMPLEMENTATION.md
- **Princípios:** CLAUDE.md
- **PRD:** PRD-Sistema de Análise de Crédito.md

---

**Última atualização:** 2025-10-22
**Próxima revisão:** Após conclusão de cada fase

