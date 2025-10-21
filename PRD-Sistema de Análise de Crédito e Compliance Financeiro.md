# Análise de Viabilidade e PRD: Sistema de Análise de Crédito e Compliance Financeiro

## Análise de Viabilidade

Após examinar o sistema mapeador-projetos, identifiquei **alta viabilidade** para criação de um sistema de análise de crédito e compliance financeiro. As seguintes seções e componentes podem ser reutilizados:

### Componentes Reutilizáveis

**Seções do Módulo Financeiro:**

- **Seção 1 (A Empresa)**: Dados cadastrais completos, composição societária, administração
- **Seção 9 (Balanços)**: Demonstrações financeiras históricas com ativo/passivo circulante e não circulante
- **Seção 10 (DRE)**: Demonstrações de resultado com análise de receitas, custos e despesas
- **Seção 8 (Recursos Humanos)**: Estrutura de pessoal e folha salarial
- **Endividamento**: Dados sobre empréstimos, financiamentos e obrigações

**Infraestrutura Técnica:**

- Sistema de validação de CNPJ/CPF
- IndexedDB para persistência de dados
- Módulos core (validation.js, export.js, import.js)
- Sistema de máscaras para currency e percentuais
- Arquitetura baseada em config.json

***

## PRD: Sistema de Análise de Crédito e Compliance Financeiro

### 1. Visão Geral

**Nome do Sistema:** CreditScore Pro

**Objetivo:** Sistema especializado para análise de risco de crédito empresarial, due diligence financeira e monitoramento de compliance, utilizado por instituições financeiras, consultorias e departamentos de crédito.

**Público-Alvo:**

- Analistas de crédito em bancos e financeiras
- Consultores financeiros
- Departamentos de compliance
- Empresas de factoring e securitização
- Investidores institucionais

### 2. Diferenciais do Sistema

**Foco em Análise de Risco:**

- Cálculo automático de índices financeiros
- Scoring de crédito baseado em múltiplos indicadores
- Alertas de compliance regulatório
- Análise de tendências temporais

**Integração com Bases Externas:**

- Consulta a Serasa/SCPC
- Verificação de protestos e pendências
- Validação cadastral em órgãos públicos
- Análise de sócios em bases de dados

### 3. Estrutura do Sistema

#### 3.1 Arquitetura de Diretórios

```
/Users/ceciliodaher/Documents/git/creditscore-pro/
├── config/
│   └── creditscore-config.json
│
├── src/
│   ├── assets/
│   │   ├── css/
│   │   │   └── creditscore-styles.css
│   │   └── js/
│   │       ├── core/
│   │       │   ├── creditscore-module.js
│   │       │   ├── risk-calculator.js
│   │       │   └── compliance-checker.js
│   │       ├── calculators/
│   │       │   ├── indices-financeiros.js
│   │       │   ├── scoring-engine.js
│   │       │   ├── analise-vertical-horizontal.js
│   │       │   └── capital-giro.js
│   │       └── database/
│   │           ├── creditscore-indexeddb-schema.js
│   │           └── creditscore-form-sync.js
│   │
│   ├── components/
│   │   ├── company-selector.html
│   │   └── risk-dashboard.html
│   │
│   ├── pages/
│   │   └── analise-credito.html
│   │
│   └── shared/
│       ├── validation.js
│       ├── export.js
│       └── currency-mask.js
│
└── documentos/
    ├── PRD-CreditScore.md
    ├── indices-referencia.md
    └── manual-analise.md
```

### 4. Módulos Funcionais

#### Módulo 1: Cadastro e Identificação

**Origem:** Seção 1 do módulo Financiamento

**Campos:**

- Dados cadastrais completos (razão social, CNPJ, endereço)
- Composição societária com CPF e participação
- Administradores e gestores
- Contatos principais
- Tempo de atividade
- Regime tributário
- Natureza jurídica

**Funcionalidades Adicionais:**

- Validação automática de CNPJ em bases públicas
- Consulta de situação cadastral na Receita Federal
- Verificação de regularidade fiscal
- Histórico de alterações societárias
- Vinculação de empresas do mesmo grupo econômico

#### Módulo 2: Demonstrações Financeiras

**Origem:** Seções 9 e 10 do módulo Financiamento

**Componentes:**

**2.1 Balanço Patrimonial (últimos 3 anos)**

- Ativo Circulante (disponibilidades, contas a receber, estoques)
- Ativo Não Circulante (imobilizado, intangível, investimentos)
- Passivo Circulante (fornecedores, empréstimos CP, obrigações fiscais)
- Passivo Não Circulante (financiamentos LP, debêntures)
- Patrimônio Líquido (capital social, reservas, lucros acumulados)

**2.2 DRE - Demonstração do Resultado (últimos 3 anos)**

- Receita Operacional Bruta
- Deduções e impostos sobre vendas
- Receita Operacional Líquida
- Custo dos Produtos/Serviços Vendidos
- Lucro Bruto
- Despesas Operacionais (vendas, administrativas, financeiras)
- EBITDA
- Resultado Operacional
- Resultado Financeiro
- Lucro Líquido

**2.3 Análise Automática:**

- Análise Vertical (composição percentual)
- Análise Horizontal (evolução temporal)
- Tendências e variações significativas
- Alertas de inconsistências

#### Módulo 3: Análise de Endividamento

**Novo módulo específico**

**Campos:**

**3.1 Dívidas Bancárias:**

- Instituição financeira
- Tipo de operação (capital de giro, FINAME, CDC, etc.)
- Valor original
- Saldo devedor atual
- Taxa de juros (% a.a.)
- Prazo total e prazo restante
- Valor da parcela
- Garantias oferecidas
- Data de vencimento
- Status (adimplente, atraso, renegociado)

**3.2 Outras Obrigações:**

- Fornecedores a pagar
- Obrigações fiscais
- Obrigações trabalhistas
- Empréstimos de sócios
- Adiantamento de clientes

**3.3 Indicadores Calculados:**

- Endividamento Total (Passivo Total / Ativo Total)
- Composição do Endividamento (PC / Exigível Total)
- Endividamento Financeiro (Dívidas Bancárias / PL)
- Cobertura de Juros (EBITDA / Despesas Financeiras)
- Custo médio da dívida

#### Módulo 4: Índices Financeiros

**Cálculo automático baseado nas demonstrações**

**4.1 Índices de Liquidez:**

- Liquidez Corrente = AC / PC
- Liquidez Seca = (AC - Estoques) / PC
- Liquidez Imediata = Disponível / PC
- Liquidez Geral = (AC + RLP) / (PC + PNC)

**4.2 Índices de Rentabilidade:**

- Margem Bruta = Lucro Bruto / Receita Líquida × 100
- Margem EBITDA = EBITDA / Receita Líquida × 100
- Margem Líquida = Lucro Líquido / Receita Líquida × 100
- ROE = Lucro Líquido / Patrimônio Líquido × 100
- ROA = Lucro Líquido / Ativo Total × 100

**4.3 Índices de Estrutura:**

- Participação de Capital de Terceiros = Passivo Exigível / PL
- Imobilização do Patrimônio Líquido = Ativo Permanente / PL
- Imobilização dos Recursos Não Correntes = Ativo Permanente / (PL + PNC)

**4.4 Índices de Atividade:**

- Prazo Médio de Recebimento = (Contas a Receber / Receita) × 360
- Prazo Médio de Pagamento = (Fornecedores / CMV) × 360
- Giro de Estoque = CMV / Estoque Médio
- Ciclo Operacional
- Ciclo Financeiro

#### Módulo 5: Scoring de Crédito

**Sistema proprietário de pontuação**

**5.1 Categorias de Análise (peso total = 100 pontos):**

**Situação Cadastral (20 pontos):**

- Regularidade fiscal (5 pts)
- Tempo de atividade (5 pts)
- Histórico de protestos (5 pts)
- Situação dos sócios (5 pts)

**Demonstrações Financeiras (25 pontos):**

- Evolução do faturamento (8 pts)
- Evolução da lucratividade (8 pts)
- Qualidade das demonstrações (5 pts)
- Consistência dos dados (4 pts)

**Capacidade de Pagamento (25 pontos):**

- Liquidez corrente (8 pts)
- Cobertura de juros (8 pts)
- Geração de caixa (5 pts)
- Capital de giro (4 pts)

**Endividamento (20 pontos):**

- Nível de endividamento (7 pts)
- Composição do endividamento (6 pts)
- Histórico de pagamentos (7 pts)

**Garantias e Relacionamento (10 pontos):**

- Garantias disponíveis (5 pts)
- Tempo de relacionamento (3 pts)
- Operações anteriores (2 pts)

**5.2 Classificação de Risco:**

- AAA (90-100 pts): Risco Mínimo
- AA (80-89 pts): Risco Baixo
- A (70-79 pts): Risco Moderado-Baixo
- BBB (60-69 pts): Risco Moderado
- BB (50-59 pts): Risco Moderado-Alto
- B (40-49 pts): Risco Alto
- C (30-39 pts): Risco Muito Alto
- D (<30 pts): Risco Extremo

#### Módulo 6: Compliance e Alertas

**6.1 Verificações Automáticas:**

- Situação cadastral na Receita Federal
- Regularidade com FGTS e INSS
- Certidões negativas (federal, estadual, municipal)
- Cadastro de Inadimplentes (CADIN)
- Lista de restrições do Banco Central

**6.2 Análise de Sócios:**

- CPF regular
- Participação em outras empresas
- Histórico de falências
- Restrições cadastrais
- Processos judiciais relevantes

**6.3 Alertas de Risco:**

- Deterioração de índices financeiros
- Aumento significativo de endividamento
- Queda de faturamento
- Prejuízos consecutivos
- Atrasos em obrigações
- Mudanças societárias frequentes

#### Módulo 7: Recursos Humanos

**Origem:** Seção 8 do módulo Financiamento

**Análise:**

- Número total de funcionários
- Distribuição por cargo/função
- Folha de pagamento mensal
- Encargos sociais
- Índice de rotatividade
- Produtividade (receita por funcionário)
- Custo de pessoal sobre receita

#### Módulo 8: Relatórios e Dashboards

**8.1 Dashboard Principal:**

- Score de crédito com indicador visual
- Principais índices financeiros
- Evolução temporal (gráficos)
- Alertas críticos
- Situação de endividamento
- Comparação com benchmarks do setor

**8.2 Relatório de Análise de Crédito:**

- Sumário executivo
- Dados cadastrais
- Demonstrações financeiras
- Análise de índices
- Análise de endividamento
- Scoring e classificação de risco
- Recomendação (aprovar/rejeitar/solicitar garantias)
- Limite de crédito sugerido
- Condições recomendadas

**8.3 Formatos de Exportação:**

- PDF formatado para impressão
- Excel com todas as demonstrações e cálculos
- JSON para integração com outros sistemas
- XML para padrões bancários

### 5. Especificações Técnicas

#### 5.1 Banco de Dados IndexedDB

**Schema principal:**

```javascript
const CREDITSCORE_DB_SCHEMA = {
  dbName: 'CreditScoreProDB',
  version: 1,
  stores: {
    empresas: {
      keyPath: 'id',
      indexes: {
        cnpj: { unique: true },
        razaoSocial: { unique: false },
        dataAnalise: { unique: false }
      }
    },
    demonstracoes: {
      keyPath: 'id',
      indexes: {
        empresaId: { unique: false },
        ano: { unique: false },
        tipo: { unique: false } // 'balanco', 'dre'
      }
    },
    endividamento: {
      keyPath: 'id',
      indexes: {
        empresaId: { unique: false },
        instituicao: { unique: false },
        status: { unique: false }
      }
    },
    scoring: {
      keyPath: 'id',
      indexes: {
        empresaId: { unique: false },
        dataCalculo: { unique: false },
        classificacao: { unique: false }
      }
    },
    historico: {
      keyPath: 'id',
      indexes: {
        empresaId: { unique: false },
        tipo: { unique: false },
        timestamp: { unique: false }
      }
    }
  }
};
```

#### 5.2 Validações Críticas

```javascript
const VALIDATION_RULES = {
  cadastro: {
    cnpjValido: true,
    cpfSociosValido: true,
    somaParticipacoes: 100,
    emailValido: true
  },
  demonstracoes: {
    ativoBalanceado: true, // Ativo = Passivo + PL
    percentuaisConsistentes: true,
    valoresPositivos: ['ativo', 'passivo', 'pl'],
    periodoMinimo: 2 // anos de histórico
  },
  endividamento: {
    taxasPositivas: true,
    saldoMenorOriginal: true,
    datasValidas: true
  },
  indices: {
    liquidezMinima: 1.0,
    endividamentoMaximo: 70, // %
    margemMinimaPositiva: true
  }
};
```

### 6. Arquivos a Copiar do Sistema Original

**Do diretório `/src/shared/`:**

- `validation.js` - Sistema de validações base
- `export.js` - Exportação de dados
- `import.js` - Importação de dados
- `currency-mask.js` - Máscaras monetárias
- `utils/percentage-calculator.js` - Cálculos percentuais

**Do diretório `/src/components/`:**

- `company-selector.html` - Seletor de empresas

**Do diretório `/src/assets/js/database/`:**

- `indexeddb-manager.js` - Gerenciador do IndexedDB (adaptar schema)

**Seções específicas do módulo financiamento:**

- Seção 1 (cadastro) - HTML e JS
- Seção 8 (recursos humanos) - HTML e JS
- Seção 9 (balanços) - HTML e JS
- Seção 10 (DRE) - HTML e JS

### 7. Roadmap de Desenvolvimento

#### Fase 1: Estrutura Base (Sprint 1-2)

1. Criar estrutura de diretórios
2. Copiar e adaptar arquivos compartilhados
3. Configurar IndexedDB com novo schema
4. Criar `creditscore-config.json`
5. Desenvolver página principal HTML
6. Implementar navegação entre módulos

#### Fase 2: Módulos Core (Sprint 3-5)

1. Implementar Módulo 1 (Cadastro) - adaptar Seção 1
2. Implementar Módulo 2 (Demonstrações) - adaptar Seções 9 e 10
3. Desenvolver validações específicas
4. Criar sistema de persistência
5. Implementar importação de dados

#### Fase 3: Análise Financeira (Sprint 6-8)

1. Desenvolver calculadora de índices financeiros
2. Implementar análise vertical e horizontal
3. Criar Módulo 3 (Endividamento)
4. Desenvolver módulo de capital de giro
5. Implementar gráficos de evolução temporal

#### Fase 4: Scoring e Risco (Sprint 9-11)

1. Implementar engine de scoring
2. Desenvolver Módulo 5 (classificação de risco)
3. Criar sistema de pesos e pontuações
4. Implementar alertas automáticos
5. Desenvolver dashboard de risco

#### Fase 5: Compliance (Sprint 12-13)

1. Implementar Módulo 6 (verificações)
2. Desenvolver checklist de compliance
3. Criar sistema de alertas críticos
4. Implementar validação de sócios

#### Fase 6: Relatórios (Sprint 14-15)

1. Desenvolver dashboard principal
2. Implementar relatório completo de análise
3. Criar exportação PDF formatada
4. Implementar exportação Excel
5. Desenvolver comparação com benchmarks

#### Fase 7: Testes e Refinamentos (Sprint 16-17)

1. Testes de cálculos financeiros
2. Validação de scoring com casos reais
3. Testes de performance
4. Ajustes de UX/UI
5. Documentação completa

### 8. Configuração Inicial (creditscore-config.json)

```json
{
  "systemName": "CreditScore Pro",
  "version": "1.0.0",
  "modules": [
    {
      "id": 1,
      "name": "Cadastro e Identificação",
      "required": true,
      "icon": "building"
    },
    {
      "id": 2,
      "name": "Demonstrações Financeiras",
      "required": true,
      "icon": "chart-line",
      "submodules": ["balanco", "dre"]
    },
    {
      "id": 3,
      "name": "Endividamento",
      "required": true,
      "icon": "credit-card"
    },
    {
      "id": 4,
      "name": "Índices Financeiros",
      "computed": true,
      "icon": "calculator"
    },
    {
      "id": 5,
      "name": "Scoring de Crédito",
      "computed": true,
      "icon": "star"
    },
    {
      "id": 6,
      "name": "Compliance",
      "required": true,
      "icon": "shield-check"
    },
    {
      "id": 7,
      "name": "Recursos Humanos",
      "required": false,
      "icon": "users"
    },
    {
      "id": 8,
      "name": "Relatórios",
      "computed": true,
      "icon": "file-report"
    }
  ],
  "scoring": {
    "categorias": {
      "cadastral": { "peso": 20, "minimo": 0, "maximo": 20 },
      "financeiro": { "peso": 25, "minimo": 0, "maximo": 25 },
      "pagamento": { "peso": 25, "minimo": 0, "maximo": 25 },
      "endividamento": { "peso": 20, "minimo": 0, "maximo": 20 },
      "garantias": { "peso": 10, "minimo": 0, "maximo": 10 }
    },
    "classificacoes": [
      { "rating": "AAA", "min": 90, "max": 100, "risco": "Mínimo" },
      { "rating": "AA", "min": 80, "max": 89, "risco": "Baixo" },
      { "rating": "A", "min": 70, "max": 79, "risco": "Moderado-Baixo" },
      { "rating": "BBB", "min": 60, "max": 69, "risco": "Moderado" },
      { "rating": "BB", "min": 50, "max": 59, "risco": "Moderado-Alto" },
      { "rating": "B", "min": 40, "max": 49, "risco": "Alto" },
      { "rating": "C", "min": 30, "max": 39, "risco": "Muito Alto" },
      { "rating": "D", "min": 0, "max": 29, "risco": "Extremo" }
    ]
  },
  "indices": {
    "liquidez": {
      "corrente": { "ideal": ">= 1.5", "aceitavel": ">= 1.0", "critico": "< 1.0" },
      "seca": { "ideal": ">= 1.0", "aceitavel": ">= 0.7", "critico": "< 0.7" },
      "imediata": { "ideal": ">= 0.5", "aceitavel": ">= 0.3", "critico": "< 0.3" }
    },
    "rentabilidade": {
      "margemBruta": { "ideal": ">= 30", "aceitavel": ">= 20", "critico": "< 20" },
      "margemLiquida": { "ideal": ">= 10", "aceitavel": ">= 5", "critico": "< 5" },
      "roe": { "ideal": ">= 15", "aceitavel": ">= 10", "critico": "< 10" }
    },
    "endividamento": {
      "total": { "ideal": "<= 50", "aceitavel": "<= 70", "critico": "> 70" },
      "financeiro": { "ideal": "<= 100", "aceitavel": "<= 150", "critico": "> 150" }
    }
  },
  "alertas": {
    "critico": ["liquidezBaixa", "prejuizoConsecutivo", "endividamentoAlto"],
    "atencao": ["margemDecrescente", "aumendoEndividamento", "cycloLongo"],
    "informativo": ["mudancaSocietaria", "novaOperacao"]
  }
}
```

### 9. Como Começar o Desenvolvimento

#### Passo 1: Preparação do Ambiente

```bash
# Criar novo diretório
mkdir /Users/ceciliodaher/Documents/git/creditscore-pro
cd /Users/ceciliodaher/Documents/git/creditscore-pro

# Inicializar Git
git init
git remote add origin [URL_DO_REPOSITORIO]

# Inicializar NPM (mesmo package.json base)
npm init -y
```

#### Passo 2: Copiar Estrutura Base

- Copiar `package.json` do mapeador-projetos (adaptar nome)
- Copiar `vite.config.js`
- Copiar `.gitignore`
- Copiar estrutura de diretórios base

#### Passo 3: Copiar Módulos Compartilhados

- Copiar todo `/src/shared/` com validações e utilitários
- Copiar `/src/components/company-selector.html`
- Copiar base do IndexedDB manager

#### Passo 4: Criar Configuração

- Criar `config/creditscore-config.json` conforme especificado acima

#### Passo 5: Desenvolver Estrutura HTML Base

- Criar `index.html` com menu de navegação
- Criar `src/pages/analise-credito.html` com estrutura de abas
- Implementar navegação entre módulos

#### Passo 6: Adaptar Módulos Existentes

- Adaptar Seção 1 (Cadastro) para foco em crédito
- Adaptar Seção 9 (Balanços) com 3 anos de histórico
- Adaptar Seção 10 (DRE) com análise vertical/horizontal
- Simplificar Seção 8 (RH) para dados essenciais

#### Passo 7: Desenvolver Módulos Novos

- Criar módulo de endividamento do zero
- Implementar calculadora de índices financeiros
- Desenvolver engine de scoring

#### Passo 8: Commits Progressivos

Seguir padrão de commits do projeto original:

```
feat(cadastro): implementa módulo de identificação empresarial
feat(demonstracoes): adapta seções de balanço e DRE
feat(endividamento): cria módulo de análise de dívidas
feat(indices): implementa calculadora de índices financeiros
feat(scoring): desenvolve engine de classificação de risco
```

### 10. Considerações Importantes

**Privacidade e Segurança:**

- Dados financeiros são sensíveis - implementar criptografia
- Controle de acesso por usuário
- Logs de auditoria
- Backup automático

**Performance:**

- Cálculos complexos devem ser otimizados
- Cache de resultados quando possível
- Lazy loading de demonstrações históricas

**Manutenibilidade:**

- Código modular e desacoplado
- Documentação inline
- Testes unitários para calculadoras
- Versionamento de schemas do IndexedDB

**Escalabilidade Futura:**

- API REST para integração externa
- Multi-empresa em modo SaaS
- Dashboards comparativos
- Machine learning para scoring

***

Este PRD fornece uma base sólida para desenvolver um sistema profissional de análise de crédito, aproveitando significativamente a infraestrutura do sistema de viabilidade econômico-financeira existente, mas com foco específico nas necessidades de instituições financeiras e análise de risco de crédito.
