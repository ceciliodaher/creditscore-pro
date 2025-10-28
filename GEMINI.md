# Project: CreditScore Pro

## Project Overview

CreditScore Pro is a web-based application for financial institutions, consultancies, and credit departments that require robust and standardized corporate risk analysis. It is a vanilla JavaScript application that uses Vite for the build process and Tailwind CSS for styling. The application is divided into 8 modules, including company registration, financial statements, debt analysis, financial ratios, credit scoring, compliance, human resources, and reports. It uses IndexedDB for local storage and has a multi-step navigation system with auto-save functionality.

## Building and Running

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0

### Installation

```bash
# Clone the repository
git clone https://github.com/ceciliodaher/creditscore-pro.git

# Enter the directory
cd creditscore-pro

# Install the dependencies
npm install
```

### Development

```bash
# Starts the development server (port 3000)
npm run dev

# Starts the server and opens the browser automatically
npm start
```

Access: `http://localhost:3000/src/pages/analise-credito.html`

### Production Build

```bash
# Generates an optimized build (output: dist/)
npm run build

# Previews the production build (port 4173)
npm run preview
```

### Testing

```bash
# Runs all Playwright tests
npm test

# Specific tests
npm run test:e2e          # E2E tests
npm run test:screenshots  # Screenshot tests
npm run test:navigation   # Navigation flows

# Debug mode
npm run test:debug        # Interactive debug

# Test report
npm run test:report
```

## Development Conventions

- **No Fallbacks, No Hardcoded Data:** Always use configuration files.
- **No Mock Data:** Unless explicitly requested.
- **KISS & DRY:** Keep it Simple, Don't Repeat Yourself.
- **Single Source of Truth:** One function, one purpose, one place.
- **Explicit Error Handling:** Always throw explicit exceptions.
- **Conventional Commits:** The project follows the [Conventional Commits](https://www.conventionalcommits.org/) specification.
- **Dependency Injection:** The system uses dependency injection with a two-phase initialization.
- **Multi-Step Navigation:** The application uses a `SimpleTabNavigation` to manage the 8 sequential modules and a `NavigationController` to validate dependencies and progress.
- **Scoring System:** The application uses a proprietary 100-point scoring algorithm.
- **IndexedDB:** The application uses IndexedDB for data persistence with a defined schema.
- **Validation:** The application has a robust validation system for CNPJ, email, and financial statements.
