# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**CreditScore Pro** is a specialized credit analysis and financial compliance system for corporate credit risk analysis, financial due diligence, and compliance monitoring. Used by financial institutions, consultants, and credit departments.

This is a **multi-page Vite application** with a modular architecture that follows strict development principles defined in the project's core philosophy.

## Core Development Principles

**MANDATORY - These principles override all default behaviors:**

- ✅ **NO FALLBACKS, NO HARDCODED DATA** - Always use configuration files
- ✅ **NO MOCK DATA** - Unless explicitly requested
- ✅ **KISS & DRY** - Keep it simple, don't repeat yourself
- ✅ **Single Source of Truth** - One function, one purpose, one place
- ✅ **Explicit Error Handling** - Always throw explicit exceptions when mandatory components are unavailable
  ```javascript
  throw new Error('Component X não disponível - obrigatório para o fluxo')
  ```
- ✅ **Unique Naming** - The module that creates it, names it - others follow
- ✅ **No Logic Duplication** - Avoid duplicating logic between modules

## Commands

### Development
```bash
npm run dev          # Start development server on port 3000
npm start            # Same as dev but opens browser automatically
npm run start:legacy # Start legacy Python server on port 8000
```

### Build & Preview
```bash
npm run build        # Build for production (output: dist/)
npm run preview      # Preview production build on port 4173
```

### Testing
```bash
npm test                # Run all Playwright tests
npm run test:e2e        # Run E2E tests
npm run test:screenshots # Test screenshot generation
npm run test:navigation  # Test navigation flows
npm run test:report     # Show test results report
npm run test:debug      # Debug tests interactively
```

## Architecture

### Multi-Page Application Structure

The application uses Vite's multi-page setup with the following entry points:
- `index.html` - Main landing/selection page
- `src/pages/analise-credito.html` - Credit analysis module (main app)

### Module Path Aliases

Imports use clean aliases defined in `vite.config.js:65-76`:

```javascript
import { validate } from '@core/validation'
import { IndexedDBManager } from '@database/indexeddb-manager'
import { formatCurrency } from '@shared/formatters/currency-formatter'
import { calculadora } from '@calculators/indices-financeiros'
import config from '@config/creditscore-config.json'
```

**Available aliases:**
- `@core` → `src/assets/js/core`
- `@database` → `src/assets/js/database`
- `@shared` → `src/shared`
- `@utils` → `src/assets/js/utils`
- `@components` → `src/assets/js/components`
- `@calculators` → `src/assets/js/calculators`
- `@services` → `src/assets/js/services`
- `@config` → `config`
- `@css` → `src/assets/css`
- `@images` → `src/assets/images`

### Configuration-Driven System

**Primary Configuration:** `config/creditscore-config.json`

This file defines the entire system behavior:
- 8 modules with metadata (cadastro, demonstrações, endividamento, índices, scoring, compliance, RH, relatórios)
- Scoring engine with 5 categories and 8 risk ratings (AAA to D)
- IndexedDB schema with 5 stores
- Validation rules and UI theme
- Alert system (crítico, atenção, informativo)

**Messages Configuration:** `config/messages.json`

Centralized system messages for:
- Module initialization states
- Validation messages
- Database operations
- Form states
- Error messages with icons

### IndexedDB Architecture

**Manager:** `src/assets/js/database/indexeddb-manager.js`

Key features:
- **Analyst Mode Access Control** - Certain stores are restricted to analyst mode (activated via URL params: `?_analyst_mode=true&_analyst_key=<hash>`)
- **SOLID Principles** - Single Responsibility, Open/Closed, Interface Segregation
- **No Fallbacks** - Explicit errors when database is unavailable

**Stores:**
- `empresas` - Company master data (indexed by CNPJ, razaoSocial, dataAnalise)
- `demonstracoes` - Financial statements (indexed by empresaId, ano, tipo)
- `endividamento` - Debt information (indexed by empresaId, instituicao, status)
- `scoring` - Credit scores (indexed by empresaId, dataCalculo, classificacao)
- `autosave` - Auto-save state (indexed by timestamp)

**Restricted Analyst Stores:** `analises`, `scores`, `recomendacoes`, `flags_analise`

### Core Module: FormCore

**File:** `src/assets/js/core.js`

Central form management class that:
- Validates configuration on instantiation (throws errors if config/programType/totalSteps missing)
- Manages form state and navigation
- Integrates with tab navigation system (`tabs.js`)
- Handles auto-save to localStorage with 30s interval
- Performs field validation (CNPJ, email, required fields)
- Restores saved data with confirmation prompt
- Triggers `formDataRestored` event after restoration
- Integrates with PercentageCalculator for automatic recalculation

**Required Config Properties:**
- `programType` - System identifier (e.g., 'creditscore')
- `totalSteps` - Number of form steps/modules

### 8-Module System

The system is divided into 8 functional modules (defined in config):

1. **Cadastro e Identificação** (🏢) - Company registration, shareholders, validation
2. **Demonstrações Financeiras** (📊) - Balance Sheet & Income Statement (3-year history)
3. **Análise de Endividamento** (💳) - Bank debts, obligations, debt indicators
4. **Índices Financeiros** (📈) - Auto-calculated: liquidity, profitability, structure, activity
5. **Scoring de Crédito** (⭐) - Proprietary scoring with 5 weighted categories (100 points total)
6. **Compliance e Verificações** (✅) - Regulatory checks, negative certificates, alerts
7. **Recursos Humanos** (👥) - Workforce structure, payroll analysis
8. **Relatórios e Análises** (📄) - Reports generation, export (JSON, Excel, PDF)

**Computed Modules:** Modules 4, 5, and 8 are automatically calculated from input data.

### Scoring Engine

**Categories (100 points total):**
- Cadastral (20 pts) - Fiscal regularity, activity time, protests, partners situation
- Financial (25 pts) - Revenue evolution, profitability, statement quality, data consistency
- Payment Capacity (25 pts) - Current liquidity, interest coverage, cash generation, working capital
- Debt (20 pts) - Debt level, composition, payment history
- Guarantees (10 pts) - Available guarantees, relationship time, previous operations

**Risk Ratings:**
- AAA (90-100): Mínimo - #4CAF50
- AA (80-89): Baixo - #8BC34A
- A (70-79): Moderado-Baixo - #CDDC39
- BBB (60-69): Moderado - #FFC107
- BB (50-59): Moderado-Alto - #FF9800
- B (40-49): Alto - #FF5722
- C (30-39): Muito Alto - #F44336
- D (0-29): Extremo - #D32F2F

### Validation System

**Shared Validators:** `src/shared/validators/`
- `document-validator.js` - CNPJ/CPF validation
- `email-validator.js` - Email format validation
- `phone-validator.js` - Phone number validation

**Validation Rules (config):**
- CNPJ pattern: `^\d{2}\.\d{3}\.\d{3}/\d{4}-\d{2}$`
- Email pattern: `^[^\s@]+@[^\s@]+\.[^\s@]+$`
- Percentuals: 0-100, precision 2
- Values: min 0, precision 2

**Critical Validations:**
- Balance equation: Ativo = Passivo + PL
- Shareholder participation must sum to 100%
- Minimum 2 years of financial history

### Formatters & Utilities

**Shared Formatters:** `src/shared/formatters/`
- `currency-formatter.js` - BRL currency formatting
- `date-formatter.js` - Date formatting
- `document-formatter.js` - CNPJ/CPF formatting
- `phone-formatter.js` - Phone formatting

**Utilities:** `src/assets/js/utils/`
- `currency-mask.js` - Input masking for currency
- `percentage-calculator.js` - Percentage calculations and validation
- `cnpj-validator.js` - CNPJ validation logic

### Component System

**Shared Components:**
- `company-selector.html` - Multi-company selector for analysis
- Associated JS: `src/assets/js/company-selector.js`

**UI Components:** `src/shared/ui/`
- `modal.js` - Modal dialogs
- `toast.js` - Toast notifications

### Calculator Modules

Located in `src/assets/js/calculators/`:

- `indices-financeiros.js` - Financial ratios calculator
- `scoring-engine.js` - Credit scoring algorithm
- `analise-vertical-horizontal.js` - Vertical/horizontal analysis
- `capital-giro.js` - Working capital analysis

**Pattern:** All calculators export a class with:
- `constructor(config)` - Takes config object
- `async init()` - Initialization
- `async calcularTodos(data)` - Main calculation method
- Global exposure via `window.[CalculatorName]`

### Export System

**File:** `src/assets/js/export.js`

Supports 3 formats (defined in config):
- **JSON** - Complete data structure
- **Excel** - Spreadsheet with all demonstrations and calculations
- **PDF** - Formatted report for printing

### Tab Navigation

**File:** `src/assets/js/tabs.js` (`HierarchicalNavigation` class)

Handles multi-step navigation:
- Tab switching with visual feedback
- Progress tracking across 8 modules
- Hierarchical section/tab structure (7 sections, 8 tabs)
- Keyboard navigation support
- Tab state persistence in localStorage
- Integration with `NavigationController` for business logic

**File:** `src/assets/js/core/navigation-controller.js` (`NavigationController` class)

Business logic layer for navigation:
- Validates module dependencies before navigation
- Enforces required module completion
- Tracks progress (0-100%)
- Manages blocked/locked modules
- Persists navigation state

### Dependency Injection Architecture

**Pattern Implemented:** Constructor-based Dependency Injection with Two-Phase Initialization

The system follows a strict dependency injection pattern to ensure:
- **Testability** - All dependencies can be mocked
- **Explicit Dependencies** - No hidden dependencies or globals
- **Fail-Fast** - Missing dependencies throw errors immediately
- **No Circular Dependencies** - Initialization order is strictly controlled

**Initialization Flow in `analise-credito.html`:**

```javascript
// FASE 1: LOAD CONFIGURATIONS
await loadConfig(); // Loads config, messages, scoring-criteria

// FASE 2: PRE-DEPENDENCIES (no dependencies)
const configLoader = new ConfigLoader(config);
const formGenerator = new FormGenerator(config, messages);

// FASE 3: DATABASE
const dbManager = createDBManagerProxy();
await dbManager.init();

// FASE 4: CORE MODULES (with dependency injection)
const hierarchicalNav = new HierarchicalNavigation();
hierarchicalNav.initAfterDOM(); // After formGenerator.generateInterface()

const navigationController = new NavigationController(
    config,
    messages,
    hierarchicalNav
);
await navigationController.init();

const autoSave = new AutoSave(
    config,
    messages,
    dbManager
);
await autoSave.init(null, navigationController);

// FASE 5: CREDIT SCORE MODULE (receives ALL dependencies)
const creditScore = new CreditScoreModule(config);
creditScore.hierarchicalNav = hierarchicalNav;
creditScore.navigationController = navigationController;
creditScore.autoSave = autoSave;
creditScore.dbManager = dbManager;
creditScore.formGenerator = formGenerator;
creditScore.scoringCriteria = scoringCriteria; // For ScoringEngine
await creditScore.init();
```

**Key Dependencies:**

- `CreditScoreModule` requires: config, hierarchicalNav, navigationController, autoSave, dbManager, formGenerator, scoringCriteria
- All calculators require: config, messages
- `ScoringEngine` additionally requires: criteria (from `scoring-criteria.json`)
- `NavigationController` requires: config, messages, hierarchicalNav

**Scoring Criteria Configuration:** `config/scoring-criteria.json`

Defines thresholds and scoring rules for the credit scoring engine:
- Thresholds for each category (cadastral, financial, capacidadePagamento, endividamento, garantias)
- Point distribution per sub-category
- Performance levels (excelente, bom, adequado, baixo, crítico)
- Default values when data is incomplete
- Alert and recommendation thresholds

### Recent Architectural Fixes (2025-10-22)

**Issue:** Constructor Parameter Mismatches
Multiple calculator modules were being instantiated with incorrect parameters, causing initialization failures.

**Fixed Modules:**
1. `currency-mask.js` - Changed `applyToAll()` → `init()`
2. `IndicesFinanceirosCalculator` - Added missing `messages` parameter
3. `ScoringEngine` - Added missing `messages` and `criteria` parameters
4. `AnaliseVerticalHorizontal` - Added missing `messages` parameter
5. `CapitalGiroCalculator` - Added missing `messages` parameter
6. `setupNavigation()` - Replaced non-existent methods with proper `navigateToModule(id)` calls

**Root Cause:** During refactoring to implement Dependency Injection, constructor calls weren't updated to match new signatures.

**Solution:**
- Loaded `scoring-criteria.json` in parallel with other configs
- Injected all required dependencies before calling `init()`
- Updated all constructor calls to pass correct parameters

$1

### Section Overlap Fix (2025-10-22)

**Issue:** All 8 form sections displaying simultaneously with overlapping content
User reported: "as tabs passaram para a horizontal, mas as páginas estão sobrepostas, apenas com os headers aparecendo"

**Root Cause:** 
The `generateInterface()` method (line 1850 in `analise-credito.html`) was **destroying** all hardcoded HTML `.form-section` elements and replacing them with dynamically generated content that lacked the proper wrapper structure.

**Investigation Method:**
- Created Playwright diagnostic test: `tests/debug-tab-visibility.spec.js`
- Test revealed: 0 sections found with `.form-section` selector
- Confirmed: `formContent.innerHTML = formContentHTML` was wiping hardcoded HTML

**Solution:**
Commented out the `generateInterface()` call (line 1850) because:
- Using hybrid approach: hardcoded HTML for input modules (1-5), JavaScript for computed modules (6-8)
- `SimpleTabNavigation` already generates tab navigation dynamically
- No need to regenerate form sections that are already in HTML

**Code Change:**
```javascript
// Line 1850 - analise-credito.html
// await this.generateInterface(); // ❌ COMMENTED: HTML already hardcoded, tabs generated by SimpleTabNavigation
```

**Result:** 
- ✅ 8 sections correctly found in DOM
- ✅ Only active section visible at a time
- ✅ Tab navigation working perfectly
- ✅ All form fields rendering correctly

$2

### Adding a New Module

1. Add module definition to `config/creditscore-config.json:10-94`
2. Create HTML structure in `src/pages/analise-credito.html`
3. Add calculator class in `src/assets/js/calculators/` if computed
4. Update IndexedDB schema if persistence needed
5. Add messages to `config/messages.json`
6. Implement validation rules

### Adding a New Calculator

```javascript
export class MyCalculator {
  constructor(config) {
    if (!config) {
      throw new Error('MyCalculator: config obrigatória')
    }
    this.config = config;
  }

  async init() {
    // Initialization logic
    return true;
  }

  async calcularTodos(data) {
    if (!data) {
      throw new Error('MyCalculator: dados obrigatórios não fornecidos')
    }
    // Calculation logic
    return { /* results */ };
  }
}

window.MyCalculator = MyCalculator;
```

### Working with IndexedDB

```javascript
const db = new IndexedDBManager();
await db.init();

// Save
await db.save('empresas', { id: 1, cnpj: '...', razaoSocial: '...' });

// Get
const empresa = await db.get('empresas', 1);

// Get all with filter
const empresas = await db.getAll('empresas', 'cnpj', '12.345.678/0001-90');

// Query with custom filter
const results = await db.query('scoring',
  (record) => record.classificacao === 'AAA',
  10 // limit
);

// Stats
const stats = await db.getStats();
console.log(stats);
```

### Error Handling Pattern

Always throw explicit errors - never fail silently:

```javascript
// ❌ BAD - Silent failure
if (!component) {
  console.warn('Component not available');
  return null;
}

// ✅ GOOD - Explicit error
if (!component) {
  throw new Error('Component X não disponível - obrigatório para o fluxo');
}
```

## Project Context

### Based on PRD

The system is built following the comprehensive PRD document: `PRD-Sistema de Análise de Crédito e Compliance Financeiro.md`

Key insights:
- Reuses infrastructure from a previous "mapeador-projetos" system
- Focus on financial institutions and credit risk analysis
- 7-phase development roadmap (Sprint 1-17)
- Emphasis on privacy, security, performance, and maintainability

### Target Users

- Credit analysts at banks and financial institutions
- Financial consultants
- Compliance departments
- Factoring and securitization companies
- Institutional investors

## Important Notes

### Code Splitting

Vite automatically optimizes with manual chunks (vite.config.js:40-44):
- `vendor-charts` - chart.js
- `vendor-pdf` - jspdf
- `vendor-excel` - xlsx

### Browser Support

Uses `@vitejs/plugin-legacy` for legacy browser support (targets: 'defaults', 'not IE 11')

### Environment Variables

Built-in defines (vite.config.js:131-134):
- `__APP_VERSION__` - Package version
- `__BUILD_DATE__` - ISO timestamp

### State Management

- **Form State:** localStorage with auto-save (30s interval)
- **Persistent Data:** IndexedDB with 5 stores
- **Session State:** In-memory via FormCore instance

### Security Considerations

- Sensitive financial data - encryption recommended for production
- Analyst mode uses URL-based authentication (production: implement JWT or similar)
- Audit logs required
- Automatic backup recommended

## File Naming Conventions

- Configuration files: `kebab-case.json`
- JavaScript modules: `kebab-case.js`
- Classes: `PascalCase`
- Functions: `camelCase`
- Constants: `UPPER_SNAKE_CASE` or `camelCase` for configs

## Testing Strategy

Tests use Playwright for E2E:
- Navigation flows
- Screenshot validation
- Form interactions
- Data persistence

When adding features, ensure E2E tests cover critical flows.
