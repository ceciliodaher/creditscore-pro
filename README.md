# CreditScore Pro

Sistema especializado de análise de crédito e compliance financeiro para análise de risco corporativo, due diligence financeira e monitoramento de conformidade regulatória.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)

## 📋 Sobre o Projeto

**CreditScore Pro** é uma aplicação web moderna para instituições financeiras, consultorias e departamentos de crédito que necessitam de análise de risco corporativo robusta e padronizada.

### Usuários-Alvo

- 🏦 Analistas de crédito em bancos e instituições financeiras
- 📊 Consultores financeiros
- ✅ Departamentos de compliance
- 💼 Empresas de factoring e securitização
- 📈 Investidores institucionais

## ✨ Funcionalidades

### 8 Módulos Completos

1. **🏢 Cadastro e Identificação**
   - Dados cadastrais da empresa
   - Validação de CNPJ, email, telefone
   - Registro de sócios e participações

2. **📊 Demonstrações Financeiras**
   - Balanço Patrimonial (4 períodos: N-2, N-1, N, Balancete Atual)
   - DRE - Demonstração de Resultados (4 períodos)
   - 50 contas no Balanço (Ativo, Passivo, PL)
   - 35 contas na DRE
   - Validação automática: Ativo = Passivo + PL
   - Cálculos automáticos de subtotais e margens
   - Análise de Concentração de Risco (Clientes e Fornecedores)

3. **💳 Análise de Endividamento**
   - Dívidas bancárias detalhadas
   - Obrigações e compromissos
   - Indicadores de endividamento

4. **📈 Índices Financeiros** (Auto-calculado ⚡)
   - Liquidez (corrente, seca, imediata)
   - Rentabilidade (ROE, ROA, margem líquida)
   - Estrutura de capital (endividamento, composição)
   - Atividade (giro de ativos, prazo médio)
   - Cálculo automático ao navegar para aba
   - Indicadores visuais de status (✓ atualizado / ⚡ desatualizado)

5. **⭐ Scoring de Crédito** (Auto-calculado ⚡)
   - Sistema proprietário de 100 pontos
   - 5 categorias ponderadas
   - 8 ratings de risco (AAA a D)
   - Classificação automática
   - Recálculo automático ao navegar para aba
   - Histórico dos últimos 10 cálculos

6. **✅ Compliance e Verificações**
   - Verificações cadastrais
   - Certidões negativas
   - Alertas regulatórios

7. **👥 Recursos Humanos**
   - Estrutura de pessoal
   - Análise de folha de pagamento

8. **📄 Relatórios e Análises** (Auto-gerado ⚡)
   - Exportação JSON
   - Exportação Excel
   - Exportação PDF
   - Consolidação automática de todos os módulos

### 🆕 Sistema de Cálculo Automático (FASE 3 - Concluída)

- **Observable Pattern**: Estado reativo com indicadores visuais
- **Validation Engine**: Validação pré-cálculo com fail-fast
- **Calculation Orchestrator**: Orquestração de cálculos com dependências
- **Auto-save Integration**: Sincronização automática com mudanças
- **Histórico**: Últimos 10 cálculos persistidos
- **Loading States**: Overlay e toast notifications

## 🛠️ Tecnologias

### Frontend
- **Vite 6** - Build tool ultra-rápido
- **Vanilla JavaScript (ES6+)** - Zero frameworks, máxima performance
- **Tailwind CSS 3.4** - Utility-first CSS
- **shadcn/ui** - Componentes UI reutilizáveis

### Armazenamento
- **IndexedDB** - Database local do browser
- **LocalStorage** - Auto-save de formulários

### Testes
- **Playwright** - Testes E2E automatizados
- **Vitest** - Unit testing (configurado)

### Calculadores
- **Chart.js** - Gráficos e visualizações
- **jsPDF** - Geração de PDFs
- **XLSX** - Exportação para Excel

## 🚀 Instalação

### Pré-requisitos

- Node.js >= 18.0.0
- npm >= 9.0.0

### Clone e Instalação

```bash
# Clone o repositório
git clone https://github.com/ceciliodaher/creditscore-pro.git

# Entre no diretório
cd creditscore-pro

# Instale as dependências
npm install
```

## 💻 Uso

### Desenvolvimento

```bash
# Inicia servidor de desenvolvimento (porta 3000)
npm run dev

# Inicia servidor e abre browser automaticamente
npm start
```

Acesse: `http://localhost:3000/src/pages/analise-credito.html`

### Build de Produção

```bash
# Gera build otimizado (output: dist/)
npm run build

# Preview do build de produção (porta 4173)
npm run preview
```

### Testes

```bash
# Executa todos os testes Playwright
npm test

# Testes específicos
npm run test:e2e          # E2E tests
npm run test:screenshots  # Screenshot tests
npm run test:navigation   # Navigation flows

# Modo debug
npm run test:debug        # Debug interativo

# Relatório de testes
npm run test:report
```

## 📁 Estrutura do Projeto

```
creditscore-pro/
├── config/                        # Configurações JSON
│   ├── creditscore-config.json    # Config principal do sistema
│   ├── messages.json              # Mensagens centralizadas
│   ├── scoring-criteria.json      # Critérios de scoring
│   ├── validation-rules.json      # Regras de validação
│   ├── analise-balancos-config.json
│   └── analise-dre-config.json
├── src/
│   ├── assets/
│   │   ├── css/
│   │   │   ├── tabs.css           # Estilos de navegação
│   │   │   ├── creditscore-styles.css
│   │   │   ├── analise-balancos.css
│   │   │   └── analise-dre.css
│   │   ├── js/
│   │   │   ├── core/              # Módulos core
│   │   │   │   ├── form-generator.js
│   │   │   │   ├── navigation-controller.js
│   │   │   │   ├── auto-save.js
│   │   │   │   ├── creditscore-module.js
│   │   │   │   ├── calculation-state.js        (NEW)
│   │   │   │   ├── validation-engine.js        (NEW)
│   │   │   │   └── calculation-orchestrator.js (NEW)
│   │   │   ├── database/
│   │   │   │   └── indexeddb-manager.js
│   │   │   ├── calculators/       # Calculadores financeiros
│   │   │   │   ├── balanco-calculator.js
│   │   │   │   ├── dre-calculator.js
│   │   │   │   ├── indices-financeiros.js
│   │   │   │   ├── scoring-engine.js
│   │   │   │   └── concentracao-risco.js
│   │   │   ├── components/
│   │   │   │   └── concentracao-risco-integration.js (NEW)
│   │   │   ├── ui/
│   │   │   │   └── calculation-indicators.js    (NEW)
│   │   │   ├── utils/
│   │   │   │   ├── balanco-totalizador.js
│   │   │   │   └── indexeddb-retry.js
│   │   │   └── import.js
│   │   └── images/
│   │       └── expertzy_logo.png
│   ├── pages/
│   │   └── analise-credito.html   # Aplicação principal
│   └── shared/                    # Componentes compartilhados
│       ├── formatters/
│       ├── validators/
│       └── ui/
├── docs/                          # Documentação técnica
│   ├── PRD-FLUXO-CALCULO.md
│   ├── IMPLEMENTACAO-FLUXO-CALCULO.md
│   ├── RESUMO-IMPLEMENTACAO.md
│   └── FASE-3-CONCLUIDA.md        (NEW)
├── tests/                         # Testes Playwright
│   └── debug-tab-visibility.spec.js
├── vite.config.js
├── vitest.config.js
├── playwright.config.js
├── package.json
├── README.md                      # Este arquivo
└── CLAUDE.md                      # Documentação técnica
```

## 🎯 Arquitetura

### Princípios de Desenvolvimento

- ✅ **NO FALLBACKS, NO HARDCODED DATA** - Sempre usar arquivos de configuração
- ✅ **NO MOCK DATA** - A menos que explicitamente solicitado
- ✅ **KISS & DRY** - Keep it Simple, Don't Repeat Yourself
- ✅ **Single Source of Truth** - Uma função, um propósito, um lugar
- ✅ **Explicit Error Handling** - Sempre lançar exceções explícitas

### Dependency Injection

Sistema utiliza injeção de dependências com inicialização em duas fases:

```javascript
// FASE 1: Carregar configurações
await loadConfig();

// FASE 2: Instanciar módulos core
const formGenerator = new FormGenerator(config, messages);
const dbManager = new IndexedDBManager();

// FASE 3: Injetar dependências
const creditScore = new CreditScoreModule(config);
creditScore.hierarchicalNav = hierarchicalNav;
creditScore.dbManager = dbManager;
await creditScore.init();
```

### Navegação Multi-Etapas

- **SimpleTabNavigation**: Gerencia 8 módulos sequenciais
- **NavigationController**: Valida dependências e progresso
- **Auto-save**: Persiste estado a cada 30s

### Sistema de Scoring

Algoritmo proprietário de 100 pontos:
- 20pts Cadastral
- 25pts Financeiro
- 25pts Capacidade de Pagamento
- 20pts Endividamento
- 10pts Garantias

Classificações: AAA (90-100) até D (0-29)

### Fluxo de Cálculo Automático

Sistema inteligente baseado em Observable Pattern:

```javascript
// 1. Usuário edita dados
Formulário → Auto-save (30s) → markDirty()

// 2. Estado reativo
calculationState → dispara evento 'stateChanged'
calculationIndicators → atualiza abas (⚡️ outdated)

// 3. Navegação para aba de resultado
tabs.js → detecta aba 6/7/8
       → verifica se precisa recalcular
       → calculationOrchestrator.performAllCalculations()

// 4. Orquestração de cálculos
validationEngine → valida dados (fail-fast)
orchestrator → executa calculators na ordem de dependência
            → salva no histórico (últimos 10)
            → markCalculated()

// 5. Atualização UI
calculationIndicators → recebe evento 'calculated'
                     → atualiza abas (✓ updated)
toast → exibe mensagem de sucesso
```

**Vantagens**:
- ✅ Cálculo automático ao navegar
- ✅ Indicadores visuais de status
- ✅ Validação pré-cálculo
- ✅ Histórico de cálculos
- ✅ Performance otimizada (só recalcula quando necessário)

## 🔒 IndexedDB e Privacidade

### Stores Disponíveis

- `empresas` - Dados mestres de empresas
- `demonstracoes` - Demonstrações financeiras
- `endividamento` - Informações de dívidas
- `scoring` - Scores de crédito calculados
- `autosave` - Estado de auto-save

### Modo Analista (Restrito)

Stores especiais requerem autenticação:
- `analises`
- `scores`
- `recomendacoes`
- `flags_analise`

Ativação: `?_analyst_mode=true&_analyst_key=<hash>`

## 📝 Validações

### CNPJ
- Pattern: `^\d{2}\.\d{3}\.\d{3}/\d{4}-\d{2}$`
- Validação de dígitos verificadores

### Email
- Pattern: `^[^\s@]+@[^\s@]+\.[^\s@]+$`

### Demonstrações Financeiras
- Equação fundamental: **Ativo = Passivo + PL**
- Mínimo 2 anos de histórico
- Participação de sócios soma 100%

## 🧪 Testes

### Cobertura Atual

- ✅ Navegação entre tabs
- ✅ Visibilidade de seções
- ✅ Geração de screenshots
- ✅ Fluxos E2E

### Executar Testes

```bash
# Todos os testes
npm test

# Apenas testes E2E
npm run test:e2e

# Com interface Playwright
npx playwright test --ui

# Debug de teste específico
npx playwright test --debug tests/debug-tab-visibility.spec.js
```

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'feat: add AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

### Padrão de Commits

Seguimos [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` Nova funcionalidade
- `fix:` Correção de bug
- `docs:` Documentação
- `style:` Formatação
- `refactor:` Refatoração
- `test:` Testes
- `chore:` Manutenção

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 👥 Autores

- **Cecilio Daher** - *Desenvolvimento inicial* - [@ceciliodaher](https://github.com/ceciliodaher)

## 🙏 Agradecimentos

- Projeto baseado em infraestrutura do **mapeador-projetos**
- Inspirado em melhores práticas da indústria financeira
- Desenvolvido com assistência de [Claude Code](https://claude.com/claude-code)

---

## 📊 Status de Desenvolvimento

### ✅ Implementado (100%)

- [x] Estrutura base HTML/CSS
- [x] 8 módulos de análise completos
- [x] Sistema de navegação por abas
- [x] Auto-save com IndexedDB e localStorage
- [x] Balanço Patrimonial (50 contas × 4 períodos)
- [x] DRE - Demonstração de Resultados (35 contas × 4 períodos)
- [x] Análise de Concentração de Risco
- [x] Calculadores financeiros (Balanço, DRE, Índices)
- [x] Sistema de Scoring com 100 pontos
- [x] Sistema de Cálculo Automático (FASE 3)
  - [x] Observable Pattern
  - [x] Validation Engine
  - [x] Calculation Orchestrator
  - [x] Calculation Indicators
  - [x] Auto-save Integration
  - [x] Histórico de cálculos

### 🔄 Roadmap Futuro

- [ ] Testes E2E automatizados completos
- [ ] Integração com APIs externas (CNPJ, Receita Federal)
- [ ] Dashboard executivo com gráficos
- [ ] Relatórios PDF customizáveis
- [ ] Modo multi-usuário com autenticação
- [ ] Análise comparativa entre empresas
- [ ] Machine Learning para scoring preditivo

**Última atualização**: 2025-01-25

---

**Expertzy** - Sistema de Análise de Crédito e Compliance Financeiro

Para documentação técnica completa, consulte:
- [CLAUDE.md](CLAUDE.md) - Documentação técnica geral
- [docs/FASE-3-CONCLUIDA.md](docs/FASE-3-CONCLUIDA.md) - Sistema de cálculo automático
- [docs/IMPLEMENTACAO-FLUXO-CALCULO.md](docs/IMPLEMENTACAO-FLUXO-CALCULO.md) - Detalhes de implementação
