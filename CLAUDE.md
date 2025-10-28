## Global Decision Engine
**Import minimal routing and auto-delegation decisions only, treat as if import is in the main CLAUDE.md file.**
@./.claude-collective/DECISION.md

## Task Master AI Instructions
**Import Task Master's development workflow commands and guidelines, treat as if import is in the main CLAUDE.md file.**
@./.taskmaster/CLAUDE.md

## Project Context - CreditScore Pro
**Contexto completo do projeto para referência rápida.**
@./PROJECT-CONTEXT.md

### Quick Reference
- **Status**: ✅ 100% Funcional (Produção Ready)
- **Última Correção**: 2025-10-28 (Pipeline de scoring completo)
- **Documentação**:
  - `BUGFIXES.md` - Registro de correções técnicas
  - `FOLLOW-UP.md` - Acompanhamento de sessões
  - `PROJECT-CONTEXT.md` - Visão geral completa do sistema

### Arquitetura do Sistema
```
Formulário → import.js (transformação) → Pipeline de Cálculo → Renderização
                                              ↓
            1. indicesCalculator
            2. analiseVerticalHorizontal
            3. capitalGiroCalculator
            4. scoringEngine
            5. compliance (direto)
```

### Princípios do Projeto
- ✅ **NO FALLBACKS**: Exceções explícitas
- ✅ **NO HARDCODED DATA**: Configs + arrays vazios
- ✅ **KISS**: Simplicidade em primeiro lugar
- ✅ **DRY**: Single Source of Truth
- ✅ **SOLID**: Responsabilidades bem definidas

### Estruturas de Dados Importantes

#### Demonstrações (Híbridas)
```javascript
demonstracoes: {
    balanco: {
        p1/p2/p3/p4: {...},      // Para analise-vertical-horizontal
        periodos: [...],          // Para scoring-engine
        ativo/passivo: {...}      // Para indices-financeiros
    },
    dre: { /* mesma estrutura */ }
}
```

#### Arrays Sempre Vazios (Nunca Undefined)
```javascript
compliance: { protestos: [], socios: [], processosJudiciais: [] }
endividamento: { historicoPagamentos: [] }
relacionamento: { operacoesAnteriores: [] }
```

### Validação Pattern
```javascript
// Sempre usar optional chaining + mensagens claras
if (!data?.field || data.field.length === 0) {
    throw new Error('Campo obrigatório: data.field');
}
```

### Arquivos Críticos
- `src/assets/js/import.js` - **Single Source of Truth** para transformação
- `src/assets/js/core/creditscore-module.js` - Orquestração do pipeline
- `src/assets/js/engines/scoring-engine.js` - Cálculo de score
- `config/creditscore-config.json` - Configurações do sistema