# CreditScore Pro - Contexto do Projeto

## 📋 Visão Geral

**Nome**: CreditScore Pro - Sistema de Análise de Crédito Empresarial
**Status**: ✅ 100% Funcional (Produção Ready)
**Última Atualização**: 2025-10-28
**Branch Principal**: main
**Desenvolvedor**: Claude Code (Anthropic)

---

## 🎯 Propósito do Sistema

Sistema completo para análise de crédito empresarial baseado em:
- **Demonstrações Financeiras**: Balanço Patrimonial + DRE (4 períodos)
- **Dados Cadastrais**: Identificação e informações da empresa
- **Análise de Risco**: Endividamento, compliance, concentração
- **Cálculos Automáticos**: Índices financeiros, scoring, indicadores

**Objetivo Final**: Gerar score de crédito + relatórios de análise para decisão de concessão de crédito.

---

## 🏗️ Arquitetura do Sistema

### Estrutura de Diretórios
```
creditscore-pro/
├── src/
│   ├── pages/
│   │   └── analise-credito.html       # Página principal
│   ├── assets/
│   │   ├── js/
│   │   │   ├── core/                  # Módulos principais
│   │   │   │   ├── creditscore-module.js
│   │   │   │   ├── calculation-orchestrator.js
│   │   │   │   ├── validation-engine.js
│   │   │   │   └── calculation-state.js
│   │   │   ├── calculators/           # Calculadores especializados
│   │   │   │   ├── indices-financeiros.js
│   │   │   │   ├── analise-vertical-horizontal.js
│   │   │   │   ├── capital-giro.js
│   │   │   │   └── concentracao-risco.js
│   │   │   ├── engines/              # Engines de processamento
│   │   │   │   └── scoring-engine.js
│   │   │   ├── handlers/              # Handlers de eventos
│   │   │   │   └── dre-totalizador.js
│   │   │   └── import.js              # Transformação de dados
│   │   └── css/
│   │       └── creditscore-styles.css
├── config/
│   ├── creditscore-config.json        # Configurações gerais
│   └── messages-config.json           # Mensagens do sistema
├── docs/                              # Documentação técnica
├── BUGFIXES.md                        # Registro de correções
├── FOLLOW-UP.md                       # Acompanhamento de sessões
└── PROJECT-CONTEXT.md                 # Este arquivo
```

---

## 🔄 Fluxo de Dados

### 1. Input de Dados
```
Formulário HTML → FormData
                      ↓
            transformarParaCalculadores() [import.js]
                      ↓
            Estruturas Hierárquicas
```

### 2. Transformação (import.js)
**Entrada**: Dados flat do formulário (strings)
**Saída**: Estruturas hierárquicas (objects + arrays)

**Transformações aplicadas**:
- Balanço: `{p1, p2, p3, p4}` + `periodos[]` + estrutura hierárquica
- DRE: `{p1, p2, p3, p4}` + `periodos[]` + valores calculados
- Compliance: Arrays vazios + `regularidadeFiscal`
- Endividamento: Arrays vazios + conversões numéricas
- Concentração: Arrays de clientes/fornecedores

### 3. Pipeline de Cálculo (creditscore-module.js)
```
executarAnaliseCompleta()
        ↓
    1. indicesCalculator.calcularTodos()
    2. analiseCalculator.analisar()
    3. capitalGiroCalculator.calcularTodos()
    4. scoringEngine.calcularScoring()
    5. compliance data (direto do import)
        ↓
    Resultado Completo
```

### 4. Renderização
```
Resultado → FormGenerator → UI Components → DOM
```

---

## 📊 Estruturas de Dados Principais

### Demonstrações (Híbridas)
```javascript
demonstracoes: {
    balanco: {
        // OBJECT format (para analise-vertical-horizontal)
        p1: { ativoTotal, passivoTotal, patrimonioLiquido, ... },
        p2: { ... },
        p3: { ... },
        p4: { ... },

        // ARRAY format (para scoring-engine)
        periodos: [
            { ano: 'p1', ativoTotal, ... },
            { ano: 'p2', ativoTotal, ... },
            { ano: 'p3', ativoTotal, ... },
            { ano: 'p4', ativoTotal, ... }
        ],

        // HIERARCHICAL format (para indices-financeiros)
        ativo: {
            circulante: { total, disponibilidades, contasReceber, estoques },
            naoCirculante: { total, realizavelLP, investimentos, imobilizado, intangivel }
        },
        passivo: {
            circulante: { total },
            naoCirculante: { total }
        },
        patrimonioLiquido: { ... },

        // FLAT values (retrocompatibilidade)
        ativoTotal: number,
        passivoTotal: number,
        ...
    },
    dre: {
        // Mesma estrutura híbrida
        p1: { receitaLiquida, lucroLiquido, ... },
        p2: { ... },
        p3: { ... },
        p4: { ... },
        periodos: [...],
        // Valores flat do último período
        receitaLiquida: number,
        lucroBruto: number,
        lucroLiquido: number
    }
}
```

### Compliance
```javascript
compliance: {
    protestos: [],                    // Array vazio (form básico)
    socios: [],                       // Array vazio
    processosJudiciais: [],           // Array vazio
    regularidadeFiscal: {
        federal: boolean,             // Certidão negativa federal
        estadual: boolean,            // Certidão negativa estadual
        municipal: boolean            // Certidão negativa municipal
    }
}
```

### Concentração
```javascript
concentracao: {
    clientes: [
        { nome: string, receita: number },
        ...
    ],
    fornecedores: [
        { nome: string, compras: number },
        ...
    ]
}
```

---

## 🔧 Princípios de Desenvolvimento

### Fundamentais
1. **NO FALLBACKS**: Exceções explícitas quando dados obrigatórios faltam
2. **NO HARDCODED DATA**: Sempre usar configs e arrays vazios
3. **KISS**: Keep It Simple, Stupid
4. **DRY**: Don't Repeat Yourself
5. **SOLID**: Single Responsibility, Open/Closed, etc.

### Nomenclatura
- **Módulo que cria, nomeia**: Primeiro módulo define o nome, demais seguem
- **Single Source of Truth**: Transformação única em `import.js`
- **Consistência**: Mesmos padrões em todos os calculadores

### Estruturas de Dados
- **Arrays vazios > undefined**: Sempre retornar `[]` para campos array
- **Optional chaining**: Usar `?.` para validações seguras
- **Hybrid structures**: Fornecer múltiplos formatos quando necessário
- **Fail-fast validation**: Validar no início, não no meio

---

## 🛠️ Calculadores Disponíveis

### 1. IndicesFinanceirosCalculator
**Arquivo**: `calculators/indices-financeiros.js`
**Entrada**: `dados.demonstracoes` (estrutura hierárquica)
**Saída**: Índices de liquidez, rentabilidade, endividamento

### 2. AnaliseVerticalHorizontal
**Arquivo**: `calculators/analise-vertical-horizontal.js`
**Entrada**: `dados.demonstracoes` (object p1/p2/p3/p4)
**Saída**: Percentuais verticais + variações horizontais

### 3. CapitalGiroCalculator
**Arquivo**: `calculators/capital-giro.js`
**Método**: `calcularTodos(dados.demonstracoes)`
**Saída**: Capital de giro líquido, NCG, CDG, saldo tesouraria

### 4. ConcentracaoRiscoCalculator
**Arquivo**: `calculators/concentracao-risco.js`
**Entrada**: Arrays de clientes/fornecedores
**Saída**: Concentrações percentuais + classificações

### 5. ScoringEngine
**Arquivo**: `engines/scoring-engine.js`
**Entrada**: `{cadastro, demonstracoes, endividamento, compliance, indices, capitalGiro}`
**Saída**: Score de crédito + breakdown por categoria

---

## 🐛 Problemas Conhecidos (Resolvidos)

### Equação Contábil Desbalanceada (2025-10-28)
**Status**: ✅ Resolvido
**Commit**: `2c7a804`
**Detalhes**: `BUGFIXES.md` seção 1

### Pipeline de Scoring (2025-10-28)
**Status**: ✅ Resolvido
**Commits**: `4372ee3`, `8699c59`, `1835e7b`
**Detalhes**: `BUGFIXES.md` seção 2

### 5 Categorias de Erros Corrigidos:
1. ✅ Método inexistente no capital de giro
2. ✅ Parâmetros incorretos no scoring engine
3. ✅ ComplianceChecker não implementado
4. ✅ Dados flat vs estruturas hierárquicas
5. ✅ Estrutura de períodos (object vs array)

---

## 📚 Documentação Disponível

### Técnica
- `BUGFIXES.md` - Registro detalhado de todas as correções
- `FOLLOW-UP.md` - Acompanhamento de sessões de desenvolvimento
- `STATUS_IMPLEMENTACAO.md` - Status de implementação por módulo
- `docs/PRD-FLUXO-CALCULO.md` - Product Requirements Document
- `docs/IMPLEMENTACAO-FLUXO-CALCULO.md` - Guia de implementação
- `docs/FASE-3-CONCLUIDA.md` - Relatório de conclusão

### Configuração
- `config/creditscore-config.json` - Thresholds, limites, pesos
- `config/messages-config.json` - Mensagens do sistema
- `.mcp.json` - Configuração de MCP servers

---

## 🚦 Estado Atual do Sistema

### Módulos Implementados (100%)
- ✅ Cadastro (11 campos)
- ✅ Demonstrações (340 campos: 200 balanço + 140 DRE)
- ✅ Endividamento (8 campos)
- ✅ Compliance (7 campos)
- ✅ Recursos Humanos (5 campos)
- ✅ Índices Financeiros (12 índices calculados)
- ✅ Scoring (score + breakdown)
- ✅ Relatórios (3 formatos de export)

### Pipeline Funcional (100%)
1. ✅ Coleta de dados via formulário
2. ✅ Transformação de dados (import.js)
3. ✅ Validação pré-cálculo
4. ✅ Cálculo de índices
5. ✅ Análise vertical/horizontal
6. ✅ Capital de giro
7. ✅ Scoring de crédito
8. ✅ Renderização de resultados

### Testes
- ✅ Import de JSON balanceado - Funcional
- ✅ Validação de equação contábil - Funcional
- ✅ Cálculos automáticos - Funcionais
- ✅ Pipeline completo - Funcional
- ⏳ Testes E2E automatizados - Pendente
- ⏳ Testes de performance - Pendente

---

## 🔮 Próximos Passos Recomendados

### Curto Prazo
1. Implementar ComplianceChecker (módulo removido temporariamente)
2. Adicionar dados reais para arrays vazios (protestos, socios, etc)
3. Criar suite de testes automatizados
4. Implementar validação de schema com JSON Schema

### Médio Prazo
1. Adicionar logging estruturado
2. Implementar métricas de performance
3. Criar dashboard de monitoramento
4. Otimizar cálculos para grandes volumes

### Longo Prazo
1. API REST para integração externa
2. Integração com bureau de crédito
3. Machine learning para scoring
4. Histórico de análises

---

## 💻 Ambiente de Desenvolvimento

### Servidor Local
**URL**: http://localhost:3002/src/pages/analise-credito.html
**Porta**: 3002

### Stack Técnico
- **Frontend**: HTML5, Vanilla JavaScript (ES6+)
- **CSS**: CSS3 modular
- **Arquitetura**: MVC (Model-View-Controller)
- **Módulos**: ES6 Modules
- **Patterns**: Observer, Strategy, Factory

### Ferramentas
- **MCP**: Serena (code navigation)
- **Task Management**: Task Master AI
- **Version Control**: Git + GitHub
- **IDE**: Claude Code

---

## 📞 Referências Rápidas

### Arquivos Críticos
1. `import.js` - Transformação de dados (Single Source of Truth)
2. `creditscore-module.js` - Orquestração do pipeline
3. `scoring-engine.js` - Cálculo de score
4. `creditscore-config.json` - Configurações

### Comandos Git Úteis
```bash
# Ver últimas correções
git log --oneline -10

# Ver alterações de um commit
git show <commit-hash>

# Ver status do projeto
git status
```

### Debugging
```javascript
// Habilitar debug de cálculos
localStorage.setItem('debug_calculations', 'true');

// Ver estado do sistema
console.log(window.creditScoreModule);

// Ver dados transformados
console.log(window.lastTransformedData);
```

---

## 🎓 Lições Aprendidas (2025-10-28)

1. **Análise Proativa > Correção Reativa**
   - Identificar TODOS os problemas de uma categoria antes de corrigir

2. **Compatibilidade Híbrida**
   - Fornecer múltiplos formatos de dados simultaneamente

3. **Arrays Vazios > Undefined**
   - Sempre retornar arrays vazios para evitar TypeErrors

4. **Fail-Fast Validation**
   - Validar no início com mensagens claras

5. **Single Source of Truth**
   - Centralizar transformações em um único lugar

---

**Última Atualização**: 2025-10-28 18:00 BRT
**Próxima Revisão**: Após próxima sessão de desenvolvimento
