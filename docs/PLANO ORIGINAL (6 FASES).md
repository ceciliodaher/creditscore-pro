# Plano de Implementação: Demonstrativos Financeiros + Arquitetura Multi-Empresa

**Projeto**: CreditScore Pro
**Data Atualização**: 2025-10-28
**Status**: FASE 0 descoberta como bloqueador crítico
**Versão**: 2.0 (atualizado com descoberta de arquitetura single-empresa)

---

## 📋 Sumário Executivo

### Situação Descoberta

Durante a implementação dos demonstrativos financeiros, foi **descoberto um problema crítico de arquitetura**: o sistema **NÃO suporta múltiplas empresas** adequadamente, apesar de ter componentes projetados para isso.

### Impacto

- **Dados de empresas diferentes se sobrescrevem mutuamente**
- DemonstrativosManager **não pode ser criado** sem correção da arquitetura
- Fases 1-6 do plano original **estão bloqueadas**
- Necessário implementar **FASE 0 (Arquitetura Multi-Empresa)** ANTES de prosseguir

### Causa Raiz

1. **IndexedDB store `calculation_data`** usa chaves simples (`'balanco'`, `'dre'`) sem empresaId
2. **Auto-save** sobrescreve dados ao trocar empresa (chave única: `'current_session'`)
3. **Calculation-Orchestrator** não filtra por empresaId ao carregar dados
4. **CompanySelector** não persiste empresa ativa entre recarregamentos
5. **Nenhum índice empresaId** nas stores de dados calculados

### Solução

Implementar **FASE 0 completa** (4-6h) ANTES do plano original:
- Schema IndexedDB v3 com índices empresaId
- Chaves compostas: `${tipo}_${empresaId}` (ex: `balanco_123`)
- Persistência de empresa ativa (localStorage)
- DemonstrativosManager com validações rigorosas
- Migração de dados existentes

---

## 🎯 Objetivos Gerais

### Objetivo Principal
Implementar sistema completo de demonstrativos financeiros (Balanço Patrimonial e DRE) com:
- ✅ Totalizadores real-time (cálculos automáticos)
- ✅ Análises Horizontal e Vertical
- ✅ Cálculo automático de 21 indicadores (11 Balanço + 10 DRE)
- ✅ Renderização visual de análises
- ✅ Gráficos interativos Chart.js
- ✅ **Suporte a múltiplas empresas com dados isolados**

### Objetivos Secundários
- Integração com módulo de scoring (pesos AH/AV)
- Persistência em IndexedDB com chaves compostas
- Restauração de sessão por empresa
- Interface em 3 abas (Balanço | DRE | Análises Integradas)

---

## 📊 Estado Atual do Sistema

### ✅ Componentes Já Criados (Funcionais)

#### 1. DRETotalizador (`/src/assets/js/utils/dre-totalizador.js`)
- **Status**: ✅ Completo (320 linhas)
- **Função**: Cálculo real-time de totais e margens da DRE
- **Contas**: 30 contas explícitas (TODAS, sem simplificação)
- **Princípios**: NO FALLBACKS, Event-driven, BRL + % formatting
- **Modificação necessária**: ❌ Nenhuma (trabalha apenas no DOM)

#### 2. AnalisesRenderer (`/src/assets/js/renderers/analises-renderer.js`)
- **Status**: ✅ Completo (560 linhas)
- **Função**: Renderização visual de AH, AV e Indicadores
- **Reusabilidade**: Mesmo renderer para Balanço e DRE
- **Features**: Empty states, error handling, format helpers
- **Modificação necessária**: ❌ Nenhuma (apenas renderiza HTML)

#### 3. BalancoTotalizador (`/src/assets/js/utils/balanco-totalizador.js`)
- **Status**: ✅ Funcional (320 linhas)
- **Contas**: 68 contas explícitas
- **Validação**: Equação contábil (Ativo = Passivo + PL)
- **Modificação necessária**: ❌ Nenhuma

#### 4. BalancoCalculator (`/src/assets/js/calculators/balanco-calculator.js`)
- **Status**: ✅ Funcional (1.257 linhas)
- **Análises**: AH, AV, 11 indicadores
- **Modificação necessária**: ❌ Nenhuma

#### 5. DRECalculator (`/src/assets/js/calculators/dre-calculator.js`)
- **Status**: ✅ Funcional (970 linhas)
- **Análises**: AH, AV, 10 indicadores
- **Anualização**: Trata períodos parciais
- **Modificação necessária**: ❌ Nenhuma

### ❌ Componentes Bloqueados

#### DemonstrativosManager
- **Status**: ❌ NÃO CRIADO
- **Motivo**: Precisa de empresaId em TODAS operações
- **Dependência**: FASE 0 (arquitetura multi-empresa)

### ⚠️ Componentes Precisam Modificação (FASE 0)

#### 1. Schema IndexedDB (`/config/creditscore-config.json`)
**Problema**: Stores sem índice empresaId
```json
{
  "calculation_data": {
    "keyPath": "key",
    "indexes": {
      "timestamp": { "unique": false }
      // ❌ FALTA: "empresaId": { "unique": false }
    }
  }
}
```

**Solução**: Bump version 2→3, adicionar índice empresaId

#### 2. Auto-Save (`/src/assets/js/core/auto-save.js`)
**Problema**: Chave única sobrescreve dados
```javascript
// ❌ ATUAL (linhas 244-251)
const saveData = {
    id: 'current_session',  // Sobrescreve entre empresas
    formData: formData
};
```

**Solução**: Usar chave composta com empresaId
```javascript
// ✅ PROPOSTO
const empresaId = window.EmpresaAccessManager?.getContext()?.empresaId;
if (!empresaId) {
    throw new Error('empresaId não disponível');
}

const saveData = {
    key: `session_${empresaId}`,  // Chave composta
    empresaId: empresaId,
    formData: formData
};
```

#### 3. Calculation-Orchestrator (`/src/assets/js/core/calculation-orchestrator.js`)
**Problema**: Não filtra por empresaId
```javascript
// ❌ ATUAL (linhas 168-217)
async #collectData() {
    const data = await this.#dbManager.get('calculation_data', 'balanco');
    // Não usa empresaId
}
```

**Solução**: Filtrar com chave composta
```javascript
// ✅ PROPOSTO
async #collectData() {
    const empresaId = window.EmpresaAccessManager?.getContext()?.empresaId;
    if (!empresaId) {
        throw new Error('empresaId não disponível');
    }

    const key = `balanco_${empresaId}`;
    const data = await this.#dbManager.get('calculation_data', key);
}
```

#### 4. CompanySelector (`/src/assets/js/company-selector.js`)
**Problema**: Não persiste empresa ativa
```javascript
// ❌ ATUAL
async switchCompany(company) {
    // ... código existente ...
    // NÃO persiste em localStorage
}
```

**Solução**: Adicionar persistência
```javascript
// ✅ PROPOSTO
async switchCompany(company) {
    // ... código existente ...

    // Persistir empresa ativa
    localStorage.setItem('creditscore_empresaAtiva', company.id);

    // Limpar dados calculados
    await this.limparDadosCalculados();
}

async init() {
    // Restaurar empresa ativa
    const empresaAtivaId = localStorage.getItem('creditscore_empresaAtiva');
    if (empresaAtivaId) {
        const empresa = this.state.companies.find(
            c => c.id === parseInt(empresaAtivaId)
        );
        if (empresa) {
            this.state.selectedCompany = empresa;
            window.EmpresaAccessManager.setContext(
                empresa.id,
                empresa.cnpj,
                empresa.razaoSocial
            );
        }
    }
}
```

#### 5. CreditscoreIndexedDB (`/src/assets/js/database/creditscore-indexeddb-schema.js`)
**Problema**: Falta método para buscar por índice
**Solução**: Adicionar `getAllByIndex()`
```javascript
// ✅ ADICIONAR
static async getAllByIndex(storeName, indexName, value) {
    const db = await CreditscoreIndexedDB.openDatabase();

    return new Promise((resolve, reject) => {
        const tx = db.transaction([storeName], 'readonly');
        const store = tx.objectStore(storeName);

        if (!store.indexNames.contains(indexName)) {
            reject(new Error(`Índice '${indexName}' não existe`));
            return;
        }

        const index = store.index(indexName);
        const req = index.getAll(value);

        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}
```

---

## 🗺️ Roadmap Atualizado (7 FASES)

### FASE 0: Arquitetura Multi-Empresa 🚨 CRÍTICA
**Prioridade**: 🔴 BLOQUEADOR (deve ser executada ANTES de tudo)
**Estimativa**: 4-6 horas
**Status**: Não iniciada

#### Subtarefas

**0.1. Modificar Schema IndexedDB (1-2h)**
- [ ] Backup do IndexedDB atual
- [ ] Modificar `/config/creditscore-config.json`:
  - [ ] Bump version: 2 → 3
  - [ ] Adicionar índice `empresaId` em:
    - [ ] `calculation_data`
    - [ ] `autosave`
    - [ ] `calculation_history`
    - [ ] `navigation_state`
  - [ ] Adicionar índice `active` em `empresas`
- [ ] Modificar keyPath de `autosave`: `"id"` → `"key"`
- [ ] Modificar keyPath de `calculation_history`: `"timestamp"` → `"id"` (autoIncrement)
- [ ] Testar schema no DevTools

**0.2. Implementar Migration Script (1h)**
```javascript
// Em creditscore-indexeddb-schema.js
db.onupgradeneeded = function(event) {
    const db = event.target.result;
    const oldVersion = event.oldVersion;

    if (oldVersion < 3) {
        console.log('🔄 Migrando para versão 3...');

        // 1. Pegar empresa ativa (ou criar empresa default)
        const empresaPadrao = await getOrCreateDefaultCompany(db);

        // 2. Migrar calculation_data
        const calcStore = event.target.transaction.objectStore('calculation_data');
        const calcData = await getAllFromStore(calcStore);

        for (const item of calcData) {
            // Adicionar empresaId e modificar key
            const newKey = `${item.key}_${empresaPadrao.id}`;
            const newItem = {
                ...item,
                key: newKey,
                empresaId: empresaPadrao.id
            };

            await saveToStore(calcStore, newItem);
            await deleteFromStore(calcStore, item.key); // Remove item antigo
        }

        // 3. Migrar autosave (similar)
        // 4. Migrar calculation_history (similar)

        console.log('✅ Migração para v3 concluída');
    }
};
```

**0.3. Melhorar CompanySelector (1h)**
- [ ] Adicionar método `limparDadosCalculados()`:
```javascript
async limparDadosCalculados() {
    if (window.calculationState) {
        window.calculationState.reset();
    }

    if (window.analisesRenderer) {
        window.analisesRenderer.showEmptyState('balanco');
        window.analisesRenderer.showEmptyState('dre');
    }

    console.log('🗑️ Dados calculados limpos');
}
```
- [ ] Modificar `init()` para restaurar empresa ativa
- [ ] Modificar `switchCompany()` para persistir em localStorage
- [ ] Adicionar validação de empresaId em todas operações
- [ ] Testar troca de empresa 3x consecutivas

**0.4. Modificar Auto-Save (30min)**
- [ ] Linha 244-251: Adicionar obtenção de empresaId
- [ ] Usar chave composta: `session_${empresaId}`
- [ ] Adicionar campo `empresaId` no saveData
- [ ] Linha 193-207: Modificar `checkForSavedData()`
- [ ] Linha 349-358: Modificar `clearSavedData()`
- [ ] Validação rigorosa: throw error se empresaId ausente
- [ ] Testar auto-save com 2 empresas diferentes

**0.5. Modificar Calculation-Orchestrator (1-2h)**
- [ ] Linha 168-217: Modificar `#collectData()`:
  - [ ] Obter empresaId de EmpresaAccessManager
  - [ ] Usar chaves compostas para todas buscas
  - [ ] Melhorar mensagens de erro com empresaId
- [ ] Linha 336-356: Modificar `saveHistory()`:
  - [ ] Adicionar empresaId ao registro
  - [ ] Usar autoIncrement no keyPath
- [ ] Linha 361-387: Modificar `loadHistory()`:
  - [ ] Usar `getAllByIndex('empresaId', empresaId)`
  - [ ] Filtrar apenas da empresa ativa
- [ ] Testar cálculo completo com 2 empresas

**0.6. Criar DemonstrativosManager (1h)**
- [ ] Criar arquivo `/src/assets/js/managers/demonstrativos-manager.js`
- [ ] Implementar classe com métodos:
  - [ ] `salvarDados(tipo, dados)` - com chaves compostas
  - [ ] `carregarDados(tipo)` - filtrado por empresaId
  - [ ] `deletarDados(tipo)` - com empresaId
  - [ ] `listarDemonstrativosSalvos()` - por empresa
  - [ ] `limparTodosDados()` - da empresa ativa
  - [ ] `#obterEmpresaId()` - validação rigorosa (private)
  - [ ] `#dispatchEvent(eventName, detail)` - eventos customizados
- [ ] Implementar Singleton pattern:
  - [ ] `DemonstrativosManager.initializeSingleton(dbManager)`
  - [ ] `DemonstrativosManager.getInstance()`
- [ ] Adicionar validações:
  - [ ] Tipos válidos: `['balanco', 'dre', 'endividamento', 'compliance', 'concentracao-risco']`
  - [ ] Throw error se empresaId ausente
  - [ ] Throw error se dados inválidos
- [ ] Testar todos os métodos

**Código Completo**: Ver arquivo de referência no final deste documento

**0.7. Adicionar getAllByIndex() (15min)**
- [ ] Adicionar método em `CreditscoreIndexedDB`
- [ ] Testar busca por empresaId

**0.8. Testes de Fluxo Completo (30min)**
- [ ] Criar empresa A (id: 1)
- [ ] Preencher Balanço empresa A → salvar
- [ ] Criar empresa B (id: 2)
- [ ] Preencher Balanço empresa B (dados diferentes) → salvar
- [ ] Trocar para empresa A → verificar dados preservados
- [ ] Reload página → verificar empresa ativa restaurada
- [ ] Inspecionar IndexedDB:
  - [ ] Verificar chaves: `balanco_1`, `balanco_2`
  - [ ] Verificar campo empresaId presente
  - [ ] Verificar dados não sobrescritos

**Critério de Aceite FASE 0**: Sistema suporta múltiplas empresas com dados completamente isolados

---

### FASE 1: Fundação
**Prioridade**: 🟡 Alta (após FASE 0)
**Estimativa**: 2-3 horas
**Pré-requisito**: FASE 0 concluída e testada
**Status**: Parcialmente implementada

#### Subtarefas

**1.1. ✅ DRETotalizador (JÁ CRIADO)**
- [x] Arquivo criado: `/src/assets/js/utils/dre-totalizador.js`
- [x] 30 contas de DRE explícitas
- [x] Cálculo de margens (Bruta, EBITDA, Operacional, Líquida)
- [x] NO FALLBACKS implementado
- [ ] **Pendente**: Adicionar ao HTML (script tag)

**1.2. ✅ DemonstrativosManager (CRIADO NA FASE 0)**
- [x] Classe implementada
- [x] Métodos com empresaId
- [x] Validações rigorosas
- [ ] **Pendente**: Integrar com formulários

**1.3. Setup Event Listeners (1h)**
- [ ] Botão "Salvar Balanço":
```javascript
document.getElementById('btnSalvarBalanco')?.addEventListener('click', async () => {
    try {
        const manager = DemonstrativosManager.getInstance();
        const dados = coletarDadosFormulario('balanco');

        await manager.salvarDados('balanco', dados);

        // Feedback visual
        showToast('✅ Balanço salvo com sucesso', 'success');

        // Trigger cálculo
        await calcularAnalises('balanco');

    } catch (error) {
        showToast(`❌ Erro: ${error.message}`, 'error');
    }
});
```
- [ ] Botão "Salvar DRE" (similar)
- [ ] Listener `empresaAlterada`:
```javascript
document.addEventListener('empresaAlterada', async (event) => {
    const { empresaId } = event.detail;
    console.log(`🔄 Empresa alterada para ID ${empresaId}`);

    const manager = DemonstrativosManager.getInstance();

    // Carregar dados da nova empresa
    const balanco = await manager.carregarDados('balanco');
    const dre = await manager.carregarDados('dre');

    // Preencher formulários
    if (balanco) preencherFormulario('balanco', balanco);
    if (dre) preencherFormulario('dre', dre);

    // Limpar análises antigas
    window.analisesRenderer?.showEmptyState('balanco');
    window.analisesRenderer?.showEmptyState('dre');
});
```
- [ ] Feedback visual de salvamento (toast notifications)

**1.4. Testes Básicos (30min)**
- [ ] Salvar Balanço via botão → verificar IndexedDB
- [ ] Salvar DRE via botão → verificar IndexedDB
- [ ] Trocar empresa → verificar formulário limpo
- [ ] Reload página → verificar dados restaurados

**Critério de Aceite FASE 1**: Salvamento e carregamento de dados funcionam por empresa

---

### FASE 2: Integração Calculadores
**Prioridade**: 🟡 Alta
**Estimativa**: 3-4 horas
**Pré-requisito**: FASE 1 concluída
**Status**: Não iniciada

#### Subtarefas

**2.1. Integrar BalancoCalculator (1h)**
- [ ] Criar função `calcularAnalisesBalanco()`:
```javascript
async function calcularAnalisesBalanco() {
    try {
        const manager = DemonstrativosManager.getInstance();
        const dados = await manager.carregarDados('balanco');

        if (!dados || !dados.periodos || dados.periodos.length < 2) {
            console.log('ℹ️ Dados insuficientes para análise de Balanço');
            window.analisesRenderer.showEmptyState('balanco');
            return;
        }

        // Executar calculador
        const calculator = new BalancoCalculator();
        const analises = calculator.calcularAnalises(dados);

        // Renderizar
        window.analisesRenderer.renderAnalises('balanco', analises);

        console.log('✅ Análises de Balanço calculadas e renderizadas');

    } catch (error) {
        console.error('❌ Erro ao calcular análises de Balanço:', error);
        window.analisesRenderer.showError('balanco', error.message);
    }
}
```
- [ ] Testar com dados reais (4 períodos)
- [ ] Validar estrutura de retorno:
  - [ ] `analises.ah` (Análise Horizontal)
  - [ ] `analises.av` (Análise Vertical)
  - [ ] `analises.indicadores` (11 indicadores)

**2.2. Integrar DRECalculator (1h)**
- [ ] Criar função `calcularAnalisesDRE()` (similar ao Balanço)
- [ ] Testar com dados reais (mínimo 2 períodos)
- [ ] Validar estrutura de retorno:
  - [ ] `analises.ah`
  - [ ] `analises.av`
  - [ ] `analises.indicadores` (10 indicadores)
- [ ] Validar tratamento de períodos parciais (anualização)

**2.3. Event Handlers de Salvamento (1h)**
- [ ] Modificar listener de "Salvar Balanço":
```javascript
await manager.salvarDados('balanco', dados);
showToast('✅ Balanço salvo', 'success');

// Calcular automaticamente
showLoadingState('balanco');
await calcularAnalisesBalanco();
hideLoadingState('balanco');
```
- [ ] Modificar listener de "Salvar DRE" (similar)
- [ ] Adicionar loading states (spinner durante cálculo)
- [ ] Testar fluxo: preencher → salvar → calcular → renderizar

**2.4. Testes de Integração (30min)**
- [ ] Cenário 1: Balanço completo (4 períodos)
- [ ] Cenário 2: DRE completa (4 períodos)
- [ ] Cenário 3: Balanço + DRE juntos
- [ ] Cenário 4: Trocar empresa → recalcular
- [ ] Validar isolamento de dados entre empresas

**Critério de Aceite FASE 2**: Calculadores integrados e funcionando automaticamente

---

### FASE 3: Renderização
**Prioridade**: 🟡 Alta
**Estimativa**: 2-3 horas
**Pré-requisito**: FASE 2 concluída
**Status**: Parcialmente implementada

#### Subtarefas

**3.1. ✅ AnalisesRenderer (JÁ CRIADO)**
- [x] Arquivo criado: `/src/assets/js/renderers/analises-renderer.js`
- [x] Métodos implementados:
  - [x] `renderAnalises(tipo, analises)`
  - [x] `renderAnaliseHorizontal(tipo, ah)`
  - [x] `renderAnaliseVertical(tipo, av)`
  - [x] `renderIndicadores(tipo, indicadores)`
  - [x] `showEmptyState(tipo)`
  - [x] `showError(tipo, mensagemErro)`
- [x] Format helpers implementados
- [ ] **Pendente**: Adicionar ao HTML (script tag)

**3.2. Reestruturar HTML (1h)**
- [ ] Modificar `/src/pages/analise-credito.html` Section 2:
  - [ ] Criar estrutura de 3 abas:
```html
<div class="demonstrativos-container">
    <!-- Tab Navigation -->
    <div class="tabs-header">
        <button class="tab-btn active" data-tab="balanco">
            📊 Balanço Patrimonial
        </button>
        <button class="tab-btn" data-tab="dre">
            📈 DRE
        </button>
        <button class="tab-btn" data-tab="analises">
            🔍 Análises Integradas
        </button>
    </div>

    <!-- Tab Content -->
    <div class="tabs-content">
        <!-- Aba 1: Balanço -->
        <div class="tab-pane active" id="tab-balanco">
            <!-- Formulário existente de Balanço (68 contas × 4 períodos) -->
        </div>

        <!-- Aba 2: DRE -->
        <div class="tab-pane" id="tab-dre">
            <!-- Formulário existente de DRE (30 contas × 4 períodos) -->
        </div>

        <!-- Aba 3: Análises Integradas -->
        <div class="tab-pane" id="tab-analises">
            <div class="analises-header">
                <h2>Análises Integradas</h2>
                <div class="analises-filters">
                    <button class="filter-btn active" data-tipo="balanco">Balanço</button>
                    <button class="filter-btn" data-tipo="dre">DRE</button>
                    <button class="filter-btn" data-tipo="comparativo">Comparativo</button>
                </div>
            </div>

            <!-- Sub-tabs de análises -->
            <div class="analises-subtabs">
                <button class="subtab-btn active" data-view="ah">Análise Horizontal</button>
                <button class="subtab-btn" data-view="av">Análise Vertical</button>
                <button class="subtab-btn" data-view="indicadores">Indicadores</button>
                <button class="subtab-btn" data-view="graficos">Gráficos</button>
            </div>

            <!-- Containers de renderização -->
            <div class="analises-content">
                <!-- Balanço -->
                <div class="analises-tipo-content active" data-tipo="balanco">
                    <div id="tabelaAnaliseHorizontalBalanco" class="analise-view active" data-view="ah"></div>
                    <div id="tabelaAnaliseVerticalBalanco" class="analise-view" data-view="av"></div>
                    <div id="tabelaIndicadoresBalanco" class="analise-view" data-view="indicadores"></div>
                    <div id="graficosBalanco" class="analise-view" data-view="graficos"></div>
                </div>

                <!-- DRE -->
                <div class="analises-tipo-content" data-tipo="dre">
                    <div id="tabelaAnaliseHorizontalDRE" class="analise-view active" data-view="ah"></div>
                    <div id="tabelaAnaliseVerticalDRE" class="analise-view" data-view="av"></div>
                    <div id="tabelaIndicadoresDRE" class="analise-view" data-view="indicadores"></div>
                    <div id="graficosDRE" class="analise-view" data-view="graficos"></div>
                </div>

                <!-- Comparativo (futuro) -->
                <div class="analises-tipo-content" data-tipo="comparativo">
                    <p>Comparativo Balanço × DRE (implementação futura)</p>
                </div>
            </div>
        </div>
    </div>
</div>
```
- [ ] JavaScript para alternância de tabs:
```javascript
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const tab = e.target.dataset.tab;

        // Atualizar botões
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');

        // Atualizar painéis
        document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
        document.getElementById(`tab-${tab}`).classList.add('active');
    });
});

// Similar para subtabs de análises
```

**3.3. Integração Calculadores → Renderer (1h)**
- [ ] Modificar `calcularAnalisesBalanco()` para renderizar:
```javascript
const analises = calculator.calcularAnalises(dados);
window.analisesRenderer.renderAnalises('balanco', {
    ah: analises.ah,
    av: analises.av,
    indicadores: analises.indicadores
});
```
- [ ] Modificar `calcularAnalisesDRE()` (similar)
- [ ] Adicionar error boundaries:
```javascript
try {
    // cálculo...
} catch (error) {
    window.analisesRenderer.showError('balanco', error.message);
}
```
- [ ] Testar renderização de todas análises

**3.4. CSS e Testes Visuais (30min)**
- [ ] CSS para tabs:
```css
.tabs-header {
    display: flex;
    border-bottom: 2px solid #e0e0e0;
    margin-bottom: 2rem;
}

.tab-btn {
    padding: 1rem 2rem;
    border: none;
    background: transparent;
    cursor: pointer;
    border-bottom: 3px solid transparent;
    transition: all 0.3s;
}

.tab-btn.active {
    border-bottom-color: #2196F3;
    color: #2196F3;
    font-weight: bold;
}

.tab-pane {
    display: none;
}

.tab-pane.active {
    display: block;
    animation: fadeIn 0.3s;
}

@keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}
```
- [ ] CSS para tabelas de análise:
```css
.table-analise-horizontal,
.table-analise-vertical {
    width: 100%;
    border-collapse: collapse;
    margin: 1rem 0;
}

.table-analise-horizontal th,
.table-analise-vertical th {
    background: #f5f5f5;
    padding: 1rem;
    text-align: left;
    font-weight: 600;
}

.table-analise-horizontal td,
.table-analise-vertical td {
    padding: 0.75rem;
    border-bottom: 1px solid #e0e0e0;
}

.valor-variacao.positivo {
    color: #4CAF50;
    font-weight: 600;
}

.valor-variacao.negativo {
    color: #F44336;
    font-weight: 600;
}

.valor-variacao.neutro {
    color: #9E9E9E;
}

.status-bom {
    background: #E8F5E9;
    border-left: 4px solid #4CAF50;
}

.status-atencao {
    background: #FFF3E0;
    border-left: 4px solid #FF9800;
}

.status-critico {
    background: #FFEBEE;
    border-left: 4px solid #F44336;
}
```
- [ ] Testar responsividade mobile
- [ ] Validar cores de status (🟢 bom, 🟡 atenção, 🔴 crítico)

**Critério de Aceite FASE 3**: Interface com 3 abas funcional e análises renderizadas

---

### FASE 4: Gráficos Chart.js
**Prioridade**: 🟢 Média
**Estimativa**: 4-5 horas
**Pré-requisito**: FASE 3 concluída
**Status**: Não iniciada

#### Subtarefas

**4.1. Instalar Chart.js (15min)**
- [ ] Verificar se já instalado
- [ ] Adicionar via CDN no HTML:
```html
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
```
- [ ] OU via npm: `npm install chart.js`
- [ ] Testar importação: `console.log(Chart.version)`

**4.2. Criar GraficosManager (2h)**
- [ ] Criar `/src/assets/js/renderers/graficos-manager.js`:
```javascript
class GraficosManager {
    constructor() {
        this.charts = {};  // Cache de charts criados
        this.defaultColors = [
            '#2196F3', '#4CAF50', '#FF9800', '#F44336',
            '#9C27B0', '#00BCD4', '#FFEB3B', '#795548'
        ];
    }

    /**
     * Cria gráfico de Análise Horizontal (linha)
     */
    criarGraficoAH(containerId, tipo, dadosAH) {
        const canvas = this.#criarCanvas(containerId);

        // Preparar dados
        const contas = Object.keys(dadosAH.variacoes);
        const datasets = [
            {
                label: 'P1→P2',
                data: contas.map(c => dadosAH.variacoes[c].p1_p2 * 100),
                borderColor: this.defaultColors[0],
                backgroundColor: this.defaultColors[0] + '20'
            },
            {
                label: 'P2→P3',
                data: contas.map(c => dadosAH.variacoes[c].p2_p3 * 100),
                borderColor: this.defaultColors[1],
                backgroundColor: this.defaultColors[1] + '20'
            },
            {
                label: 'P3→P4',
                data: contas.map(c => dadosAH.variacoes[c].p3_p4 * 100),
                borderColor: this.defaultColors[2],
                backgroundColor: this.defaultColors[2] + '20'
            },
            {
                label: 'CAGR',
                data: contas.map(c => dadosAH.variacoes[c].cagr * 100),
                borderColor: this.defaultColors[3],
                backgroundColor: this.defaultColors[3] + '20',
                borderWidth: 3
            }
        ];

        const chart = new Chart(canvas, {
            type: 'line',
            data: {
                labels: contas.map(c => this.formatarNomeConta(c)),
                datasets: datasets
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: `Análise Horizontal - ${tipo === 'balanco' ? 'Balanço' : 'DRE'}`
                    },
                    tooltip: {
                        callbacks: {
                            label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.y.toFixed(2)}%`
                        }
                    }
                },
                scales: {
                    y: {
                        ticks: {
                            callback: (value) => value + '%'
                        }
                    }
                }
            }
        });

        this.#salvarChart(containerId, chart);
    }

    /**
     * Cria gráfico de Análise Vertical (barras empilhadas)
     */
    criarGraficoAV(containerId, tipo, dadosAV) {
        const canvas = this.#criarCanvas(containerId);

        const contas = Object.keys(dadosAV.percentuais);
        const periodos = ['P1', 'P2', 'P3', 'P4'];

        const datasets = periodos.map((p, index) => ({
            label: p,
            data: contas.map(c => dadosAV.percentuais[c][`p${index+1}`]),
            backgroundColor: this.defaultColors[index],
        }));

        const chart = new Chart(canvas, {
            type: 'bar',
            data: {
                labels: contas.map(c => this.formatarNomeConta(c)),
                datasets: datasets
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: `Análise Vertical - ${tipo === 'balanco' ? 'Balanço' : 'DRE'}`
                    },
                    tooltip: {
                        callbacks: {
                            label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.y.toFixed(2)}%`
                        }
                    }
                },
                scales: {
                    x: { stacked: false },
                    y: {
                        stacked: false,
                        ticks: {
                            callback: (value) => value + '%'
                        }
                    }
                }
            }
        });

        this.#salvarChart(containerId, chart);
    }

    /**
     * Cria gráfico de Indicadores (radar)
     */
    criarGraficoIndicadores(containerId, tipo, indicadores) {
        const canvas = this.#criarCanvas(containerId);

        // Agrupar por categoria
        const grupos = this.#agruparIndicadores(indicadores);
        const nomeIndicadores = indicadores.map(ind => ind.nome);
        const valores = indicadores.map(ind => ind.valor);

        const chart = new Chart(canvas, {
            type: 'radar',
            data: {
                labels: nomeIndicadores,
                datasets: [{
                    label: 'Valores',
                    data: valores,
                    borderColor: this.defaultColors[0],
                    backgroundColor: this.defaultColors[0] + '30'
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: `Indicadores - ${tipo === 'balanco' ? 'Balanço' : 'DRE'}`
                    }
                }
            }
        });

        this.#salvarChart(containerId, chart);
    }

    /**
     * Destrói gráfico existente
     */
    destruirGrafico(containerId) {
        if (this.charts[containerId]) {
            this.charts[containerId].destroy();
            delete this.charts[containerId];
        }
    }

    /**
     * Destrói todos os gráficos
     */
    destruirTodos() {
        Object.keys(this.charts).forEach(id => this.destruirGrafico(id));
    }

    // MÉTODOS PRIVADOS

    #criarCanvas(containerId) {
        const container = document.getElementById(containerId);
        if (!container) {
            throw new Error(`Container ${containerId} não encontrado`);
        }

        // Limpar container
        container.innerHTML = '';

        // Criar canvas
        const canvas = document.createElement('canvas');
        container.appendChild(canvas);

        return canvas;
    }

    #salvarChart(containerId, chart) {
        // Destruir chart anterior se existir
        this.destruirGrafico(containerId);

        // Salvar novo chart
        this.charts[containerId] = chart;
    }

    #agruparIndicadores(indicadores) {
        const grupos = {};
        indicadores.forEach(ind => {
            const cat = ind.categoria || 'Outros';
            if (!grupos[cat]) grupos[cat] = [];
            grupos[cat].push(ind);
        });
        return grupos;
    }

    formatarNomeConta(conta) {
        return conta.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
}

// Singleton
if (typeof window !== 'undefined') {
    window.GraficosManager = GraficosManager;
    window.graficosManager = new GraficosManager();
}

export default GraficosManager;
```
- [ ] Testar criação de gráficos

**4.3. Integração com AnalisesRenderer (1h)**
- [ ] Adicionar botão "Visualizar Gráfico" nas tabelas
- [ ] Modificar sub-tab "Gráficos" para renderizar automaticamente:
```javascript
// No evento de click em subtab "graficos"
document.querySelectorAll('.subtab-btn[data-view="graficos"]').forEach(btn => {
    btn.addEventListener('click', () => {
        const tipo = document.querySelector('.analises-tipo-content.active').dataset.tipo;

        // Carregar dados das análises
        const analises = getAnalisesCache(tipo);  // Do cache ou recalcular

        if (analises) {
            // Renderizar gráficos
            window.graficosManager.criarGraficoAH(`graficosAH${tipo}`, tipo, analises.ah);
            window.graficosManager.criarGraficoAV(`graficosAV${tipo}`, tipo, analises.av);
            window.graficosManager.criarGraficoIndicadores(`graficosInd${tipo}`, tipo, analises.indicadores);
        }
    });
});
```
- [ ] Adicionar toggle tabela/gráfico:
```html
<div class="view-toggle">
    <button class="toggle-btn active" data-view="table">📊 Tabela</button>
    <button class="toggle-btn" data-view="chart">📈 Gráfico</button>
</div>
```
- [ ] Implementar exportação de gráficos (PNG):
```javascript
function exportarGraficoPNG(chartId) {
    const chart = window.graficosManager.charts[chartId];
    if (!chart) return;

    const url = chart.toBase64Image();
    const link = document.createElement('a');
    link.href = url;
    link.download = `grafico_${chartId}_${Date.now()}.png`;
    link.click();
}
```

**4.4. Testes Visuais (1h)**
- [ ] Testar gráfico AH com dados reais
- [ ] Testar gráfico AV com dados reais
- [ ] Testar gráfico Radar com indicadores
- [ ] Validar responsividade
- [ ] Validar cores e legibilidade
- [ ] Testar exportação PNG

**Critério de Aceite FASE 4**: Gráficos interativos funcionando e integrados

---

### FASE 5: Integração Scoring
**Prioridade**: 🟢 Baixa
**Estimativa**: 3-4 horas
**Pré-requisito**: FASE 4 concluída
**Status**: Não iniciada

#### Subtarefas

**5.1. Modificar ScoringEngine (2h)**
- [ ] Consumir indicadores de Balanço:
```javascript
// Em scoring-engine.js
async calcularScoreCompleto() {
    // ... código existente ...

    // ADICIONAR: Obter análises do DemonstrativosManager
    const manager = DemonstrativosManager.getInstance();

    const balanco = await manager.carregarDados('balanco');
    const dre = await manager.carregarDados('dre');

    if (balanco) {
        const analisesBalanco = window.balancoCalculator.calcularAnalises(balanco);
        this.scoreAHAV += this.calcularScoreAnalises(analisesBalanco);
    }

    if (dre) {
        const analisesDRE = window.dreCalculator.calcularAnalises(dre);
        this.scoreAHAV += this.calcularScoreAnalises(analisesDRE);
    }

    // ... resto do código ...
}

calcularScoreAnalises(analises) {
    let score = 0;

    // Análise Horizontal (peso: 5%)
    if (analises.ah && analises.ah.variacoes) {
        const cagrs = Object.values(analises.ah.variacoes).map(v => v.cagr);
        const cagr_medio = cagrs.reduce((a,b) => a+b, 0) / cagrs.length;

        if (cagr_medio > 0.15) score += 5;       // Crescimento > 15%
        else if (cagr_medio > 0.05) score += 3;  // Crescimento > 5%
        else if (cagr_medio >= 0) score += 1;    // Crescimento positivo
    }

    // Análise Vertical (peso: 5%)
    if (analises.av && analises.av.percentuais) {
        // Verificar estrutura saudável (exemplo: não concentração excessiva)
        // Lógica específica depende do tipo (balanco/dre)
        score += 5;  // Placeholder
    }

    return score;
}
```
- [ ] Adicionar pesos para AH/AV no sistema de scoring:
  - Análise Horizontal: 5% do score total
  - Análise Vertical: 5% do score total
  - Total AH+AV: 10% do score

**5.2. Testes de Integração (1h)**
- [ ] Cenário 1: Empresa com crescimento forte (CAGR > 15%)
- [ ] Cenário 2: Empresa estável (CAGR 0-5%)
- [ ] Cenário 3: Empresa em declínio (CAGR negativo)
- [ ] Validar pesos corretos aplicados
- [ ] Validar classificação final consistente

**5.3. Refinamentos (30min)**
- [ ] Ajustar pesos conforme `/docs/Análise Comparativa do Sistema CreditScore Pro.md`
- [ ] Documentar critérios de pontuação
- [ ] Adicionar explicações no relatório de score

**Critério de Aceite FASE 5**: Scoring integrado com análises AH/AV

---

### FASE 6: Testes e Refinamentos
**Prioridade**: 🟢 Baixa
**Estimativa**: 4-5 horas
**Pré-requisito**: FASE 5 concluída
**Status**: Não iniciada

#### Subtarefas

**6.1. Testes Unitários (2h)**
- [ ] DemonstrativosManager:
  - [ ] `salvarDados()` com empresaId correto
  - [ ] `carregarDados()` filtra por empresa
  - [ ] `deletarDados()` remove apenas da empresa
  - [ ] `#obterEmpresaId()` valida empresaId presente
- [ ] BalancoCalculator:
  - [ ] `calcularAH()` retorna estrutura correta
  - [ ] `calcularAV()` percentuais somam ~100%
  - [ ] `calcularIndicadores()` retorna 11 indicadores
- [ ] DRECalculator:
  - [ ] `calcularAH()` com CAGR correto
  - [ ] `calcularAV()` baseado em Receita Líquida
  - [ ] `calcularIndicadores()` retorna 10 indicadores
- [ ] AnalisesRenderer:
  - [ ] `renderAnalises()` gera HTML correto
  - [ ] `formatarVariacao()` formata % corretamente
  - [ ] `showEmptyState()` exibe mensagem apropriada

**6.2. Testes de Integração (2h)**
- [ ] Fluxo completo Empresa A:
  1. Criar empresa A
  2. Preencher Balanço (4 períodos)
  3. Salvar → verificar IndexedDB
  4. Verificar análises renderizadas
  5. Verificar gráficos gerados
- [ ] Fluxo completo Empresa B (paralelo):
  1. Criar empresa B
  2. Preencher dados diferentes
  3. Salvar
  4. Trocar para empresa A → verificar dados preservados
- [ ] Reload de página:
  1. Fechar navegador
  2. Reabrir
  3. Verificar empresa ativa restaurada
  4. Verificar dados carregados
- [ ] Concorrência:
  1. Abrir 2 abas do sistema
  2. Empresa A na aba 1, Empresa B na aba 2
  3. Preencher ambas simultaneamente
  4. Verificar isolamento de dados

**6.3. Refinamentos UX (1h)**
- [ ] Animações de transição entre tabs:
```css
.tab-pane {
    animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
    from {
        opacity: 0;
        transform: translateY(10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}
```
- [ ] Loading skeletons durante cálculos:
```html
<div class="loading-skeleton">
    <div class="skeleton-line"></div>
    <div class="skeleton-line"></div>
    <div class="skeleton-line"></div>
</div>
```
- [ ] Toast notifications para feedback:
```javascript
function showToast(message, type) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;

    document.body.appendChild(toast);

    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}
```
- [ ] Ajustes de CSS:
  - [ ] Espaçamentos consistentes
  - [ ] Cores de tema unificadas
  - [ ] Feedback hover em botões
  - [ ] Estados de foco acessíveis

**Critério de Aceite FASE 6**: Sistema testado, refinado e pronto para produção

---

## ⏱️ Estimativa Total de Tempo

| Fase | Descrição | Horas |
|------|-----------|-------|
| **0** | Arquitetura Multi-Empresa (NOVA) | 4-6h |
| **1** | Fundação | 2-3h |
| **2** | Integração Calculadores | 3-4h |
| **3** | Renderização | 2-3h |
| **4** | Gráficos Chart.js | 4-5h |
| **5** | Integração Scoring | 3-4h |
| **6** | Testes e Refinamentos | 4-5h |
| **TOTAL** | | **22-30 horas** |

---

## 📁 Arquivos Afetados

### Criar Novos (3 arquivos)

1. `/src/assets/js/managers/demonstrativos-manager.js` (FASE 0.6)
2. `/src/assets/js/renderers/graficos-manager.js` (FASE 4.2)
3. Migration script em `creditscore-indexeddb-schema.js` (FASE 0.2)

### Modificar Existentes (6 arquivos)

1. `/config/creditscore-config.json` - Schema IndexedDB (FASE 0.1)
2. `/src/assets/js/core/auto-save.js` - Adicionar empresaId (FASE 0.4)
3. `/src/assets/js/core/calculation-orchestrator.js` - Filtrar por empresaId (FASE 0.5)
4. `/src/assets/js/company-selector.js` - Persistência localStorage (FASE 0.3)
5. `/src/assets/js/database/creditscore-indexeddb-schema.js` - Método getAllByIndex() (FASE 0.7)
6. `/src/pages/analise-credito.html` - Reestruturar 3 abas (FASE 3.2)

### Manter Intactos (2 arquivos já criados)

1. `/src/assets/js/utils/dre-totalizador.js` ✅
2. `/src/assets/js/renderers/analises-renderer.js` ✅

---

## 🎯 Ordem de Execução

**CRÍTICO**: FASE 0 COMPLETA antes de qualquer outra fase!

```
FASE 0 (Multi-Empresa) ← OBRIGATÓRIA PRIMEIRO
  ↓
FASE 1 (Fundação)
  ↓
FASE 2 (Calculadores) ⟺ FASE 3 (Renderização) [podem ser paralelas]
  ↓
FASE 4 (Gráficos)
  ↓
FASE 5 (Scoring)
  ↓
FASE 6 (Testes)
```

---

## 🔑 Decisões Arquiteturais

### 1. Chaves Compostas (Pattern Obrigatório)

**Decisão**: Usar chaves compostas no formato `${tipo}_${empresaId}`

**Justificativa**:
- Isolamento de dados entre empresas
- Queries simples (get direto pela chave)
- Compatível com keyPath existente

**Implementação**:
```javascript
// ✅ SEMPRE usar este pattern
const key = `${tipo}_${empresaId}`;  // Ex: "balanco_123", "dre_456"

await db.save('calculation_data', {
    key: key,
    empresaId: empresaId,
    dados: dados
});
```

**Alternativa rejeitada**: Usar apenas índice empresaId sem chave composta
- ❌ Problema: Requer scan completo da store para filtrar
- ❌ Performance pior em bases grandes

### 2. Persistência de Empresa Ativa

**Decisão**: Usar localStorage com chave `creditscore_empresaAtiva`

**Justificativa**:
- Restauração automática entre sessões
- Disponível sincronamente (sem async)
- Compatível com todos navegadores

**Implementação**:
```javascript
// Salvar
localStorage.setItem('creditscore_empresaAtiva', empresaId);

// Carregar
const empresaId = localStorage.getItem('creditscore_empresaAtiva');
```

**Alternativa rejeitada**: Usar IndexedDB para persistir empresa ativa
- ❌ Problema: Assíncrono, complica inicialização
- ❌ Overhead desnecessário para um único valor

### 3. Validação de empresaId (NO FALLBACKS)

**Decisão**: Throw error explícito se empresaId ausente

**Justificativa**:
- Princípio NO FALLBACKS do projeto
- Força seleção consciente de empresa
- Evita bugs silenciosos

**Implementação**:
```javascript
// ✅ SEMPRE validar
const empresaId = window.EmpresaAccessManager?.getContext()?.empresaId;
if (!empresaId) {
    throw new Error(
        'empresaId não disponível - ' +
        'Nenhuma empresa selecionada. Use CompanySelector.'
    );
}
```

**Alternativa rejeitada**: Usar empresa "default" automaticamente
- ❌ Problema: Usuário pode não perceber qual empresa está ativa
- ❌ Viola princípio NO FALLBACKS

### 4. Migration de Dados Existentes

**Decisão**: Criar empresa "Padrão" e migrar dados existentes para ela

**Justificativa**:
- Preserva dados já preenchidos pelos usuários
- Evita perda de informação
- Transição suave para multi-empresa

**Implementação**:
```javascript
// No onupgradeneeded (v2 → v3)
const empresaPadrao = {
    id: 1,
    cnpj: '00.000.000/0000-00',
    razaoSocial: 'Empresa Padrão (dados migrados)',
    active: true
};

// Adicionar empresaId aos dados existentes
for (const item of calcData) {
    item.key = `${item.key}_1`;  // Adiciona "_1" ao final
    item.empresaId = 1;
}
```

**Alternativa rejeitada**: Limpar dados existentes
- ❌ Problema: Perda de trabalho do usuário
- ❌ UX negativa

### 5. DemonstrativosManager como Singleton

**Decisão**: Implementar Singleton pattern

**Justificativa**:
- Garante única instância com mesmo dbManager
- Evita recriação desnecessária
- API consistente em todo o código

**Implementação**:
```javascript
DemonstrativosManager.initializeSingleton(dbManager);
const manager = DemonstrativosManager.getInstance();
```

**Alternativa rejeitada**: Múltiplas instâncias
- ❌ Problema: Possíveis instâncias com dbManagers diferentes
- ❌ Maior uso de memória

### 6. Estrutura de 3 Abas

**Decisão**: Balanço | DRE | Análises Integradas

**Justificativa**:
- Clareza visual (separação input vs análises)
- Usuário solicitou explicitamente: "Balanço e DRE em abas separadas. A análise pode ser em única aba."
- Análises consolidadas em única aba facilitam comparação

**Implementação**:
- Aba 1: Formulário de Balanço (68 contas × 4 períodos)
- Aba 2: Formulário de DRE (30 contas × 4 períodos)
- Aba 3: Sub-tabs de análises (AH | AV | Indicadores | Gráficos)

**Alternativa rejeitada**: Balanço e DRE na mesma aba
- ❌ Problema: UI congestionada
- ❌ Usuário rejeitou explicitamente

---

## ✅ Validação Final

Ao término de todas as fases, o sistema terá:

- [x] ✅ Suporte a múltiplas empresas com dados isolados
- [x] ✅ Demonstrativos financeiros completos (Balanço + DRE)
- [x] ✅ Totalizadores real-time funcionais
- [x] ✅ Análises AH, AV e Indicadores funcionais
- [x] ✅ 21 indicadores calculados automaticamente (11 Balanço + 10 DRE)
- [x] ✅ Gráficos interativos Chart.js
- [x] ✅ Integração com módulo de scoring
- [x] ✅ Persistência em IndexedDB com chaves compostas
- [x] ✅ Restauração de sessão por empresa
- [x] ✅ Interface em 3 abas (Balanço | DRE | Análises)
- [x] ✅ Princípios respeitados (NO FALLBACKS, DRY, KISS)
- [x] ✅ Testado end-to-end com múltiplas empresas

---

## 📚 Referências

### Documentos do Projeto
- `/docs/Análise Comparativa do Sistema CreditScore Pro.md` - Requisitos de análises (AH, AV, Indicadores)
- `/config/creditscore-config.json` - Schema atual do IndexedDB (version 2)
- `/src/pages/analise-credito.html` - HTML dos demonstrativos (Section 2)

### Arquivos Relacionados
- `/src/assets/js/utils/balanco-totalizador.js` - Referência para totalizadores
- `/src/assets/js/calculators/balanco-calculator.js` - Calculador de Balanço
- `/src/assets/js/calculators/dre-calculator.js` - Calculador de DRE
- `/src/assets/js/core/auto-save.js` - Sistema de auto-save
- `/src/assets/js/core/calculation-orchestrator.js` - Orquestração de cálculos
- `/src/assets/js/company-selector.js` - Seleção de empresas

### Princípios Fundamentais
- **NO FALLBACKS**: Valores ausentes = 0, sem defaults ocultos
- **DRY**: Não duplicar lógica, reutilizar componentes
- **Single Source of Truth**: IndexedDB é a fonte primária
- **Explicit Errors**: Throw errors claros quando componentes ausentes
- **Multi-Company**: TODAS operações devem suportar múltiplas empresas

---

## 🚀 Próximos Passos Imediatos

1. **Revisar e aprovar este plano atualizado**
2. **Iniciar FASE 0.1**: Modificar schema IndexedDB
3. **Seguir ordem sequencial das fases**
4. **Validar cada fase antes de prosseguir**
5. **Documentar decisões arquiteturais importantes**

---

**Última Atualização**: 2025-10-28
**Versão**: 2.0
**Status**: Aguardando aprovação para início da FASE 0
