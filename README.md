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
   - Balanço Patrimonial (3 anos)
   - DRE - Demonstração de Resultados (3 anos)
   - Análise Vertical e Horizontal
   - Anualização de períodos parciais

3. **💳 Análise de Endividamento**
   - Dívidas bancárias detalhadas
   - Obrigações e compromissos
   - Indicadores de endividamento

4. **📈 Índices Financeiros** (Auto-calculado)
   - Liquidez (corrente, seca, imediata)
   - Rentabilidade (ROE, ROA, margem líquida)
   - Estrutura de capital (endividamento, composição)
   - Atividade (giro de ativos, prazo médio)

5. **⭐ Scoring de Crédito** (Auto-calculado)
   - Sistema proprietário de 100 pontos
   - 5 categorias ponderadas
   - 8 ratings de risco (AAA a D)
   - Classificação automática

6. **✅ Compliance e Verificações**
   - Verificações cadastrais
   - Certidões negativas
   - Alertas regulatórios

7. **👥 Recursos Humanos**
   - Estrutura de pessoal
   - Análise de folha de pagamento

8. **📄 Relatórios e Análises** (Auto-gerado)
   - Exportação JSON
   - Exportação Excel
   - Exportação PDF

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
│   ├── analise-balancos-config.json
│   └── analise-dre-config.json
├── src/
│   ├── assets/
│   │   ├── css/
│   │   │   ├── tabs.css           # Estilos de navegação
│   │   │   └── creditscore-styles.css
│   │   ├── js/
│   │   │   ├── core/              # Módulos core
│   │   │   │   ├── form-generator.js
│   │   │   │   ├── navigation-controller.js
│   │   │   │   └── auto-save.js
│   │   │   ├── database/
│   │   │   │   └── indexeddb-manager.js
│   │   │   ├── calculators/       # Calculadores financeiros
│   │   │   │   ├── balanco-calculator.js
│   │   │   │   ├── dre-calculator.js
│   │   │   │   ├── indices-financeiros.js
│   │   │   │   └── scoring-engine.js
│   │   │   ├── components/
│   │   │   ├── services/
│   │   │   └── utils/
│   │   └── images/
│   ├── pages/
│   │   └── analise-credito.html   # Aplicação principal
│   └── shared/                    # Componentes compartilhados
│       ├── formatters/
│       ├── validators/
│       └── ui/
├── tests/                         # Testes Playwright
│   └── debug-tab-visibility.spec.js
├── vite.config.js
├── playwright.config.js
├── package.json
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

**Expertzy** - Sistema de Análise de Crédito e Compliance Financeiro

Para documentação técnica completa, consulte [CLAUDE.md](CLAUDE.md)
