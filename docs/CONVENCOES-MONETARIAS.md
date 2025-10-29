# Convenções Monetárias - CreditScore Pro

**Versão**: 1.0.0 | **Data**: 2025-10-29 | **Autor**: Claude Code

---

## 1. ARMAZENAMENTO

### JSON
- **Formato**: String com `.00` explícito
- **Exemplo**: `"caixa_p1": "150000.00"`
- **Representa**: R$ 150.000,00 (cento e cinquenta mil reais)
- **Regra**: Valor inteiro sem decimal é normalizado automaticamente (150000 → 150000.00)
- **NUNCA**: 150000 = 1500.00 (interpretação como centavos)

### Sistema Interno
- **Processamento**: `number` (float 64-bit)
- **Armazenamento**: `string` no JSON/IndexedDB
- **Formulário**: `string` no FormData

---

## 2. NORMALIZAÇÃO AUTOMÁTICA

### Função: `normalizeMonetaryValue(val)`
**Localização**: `src/assets/js/import.js` (linha 123)

```javascript
// Entrada → Saída
"150000"    → "150000.00"  // Adiciona decimal
"150000.00" → "150000.00"  // Mantém
"150000,00" → "150000.00"  // Normaliza vírgula
null/""     → "0.00"       // Default
```

**Aplicada em**: `toNumber()` e `toPositiveNumber()` do import.js

---

## 3. APRESENTAÇÃO POR CONTEXTO

### 3.1 PDF - Valores em MILHARES

**Função**: `CurrencyFormatter.format(valor, 'pdf')`

**Transformação**: Divide por 1000
```javascript
150000 → R$ 150,00 (representa R$ 150 mil)
25000000 → R$ 25.000,00 (representa R$ 25 milhões)
```

**Nota Obrigatória**:
- Cabeçalho: Box amarelo destacado
- Rodapé: Cada página
- Texto: "⚠️ IMPORTANTE: Valores monetários expressos em milhares de reais (R$ mil)"

**Justificativa**: Compactação para relatórios extensos, padrão corporativo

---

### 3.2 TELA - Valores COMPLETOS

**Função**: `CurrencyFormatter.format(valor, 'screen')`

**Transformação**: Nenhuma (valor completo)
```javascript
150000 → R$ 150.000,00
25000000 → R$ 25.000.000,00
```

**Nota**: Não necessária (valores explícitos)

**Justificativa**: Máxima clareza para tomada de decisão

---

### 3.3 EXCEL - Valores COMPLETOS (Formatados)

**Função**: `CurrencyFormatter.format(valor, 'excel', {formatted: true})`
```javascript
150000 → "R$ 150.000,00" (string formatada para leitura)
```

**Estrutura Planilha**:
| Campo | Valor |
|-------|-------|
| Caixa P1 | R$ 150.000,00 |

**Justificativa**: Clareza máxima, evita confusão com múltiplas colunas

---

## 4. FUNÇÕES DE FORMATAÇÃO

### Método Principal
```javascript
CurrencyFormatter.format(value, context, options)
```

**Contextos**: `'pdf'` | `'screen'` | `'excel'` | `'input'`

### Métodos Privados
- `#formatForPDF(value)` - Divide por 1000
- `#formatForScreen(value)` - Valor completo
- `#formatForExcel(value, options)` - Numérico ou formatado
- `#formatForInput(value)` - Alias para screen

### Método Legacy (Retrocompatibilidade)
```javascript
CurrencyFormatter.formatBRL(value) // → usa 'screen'
```

### Nota de Escala
```javascript
CurrencyFormatter.getPDFScaleNotice()
// Retorna: HTML pronto para inserção
```

---

## 5. CAMPOS MONETÁRIOS (340+ campos)

### Cadastro
`capitalSocial`

### Recursos Humanos
`folhaPagamentoMensal`, `encargosSociais`

### Contas a Receber/Pagar
`contasReceberTotal`, `contasReceber90Dias`, `contasPagarTotal`, `contasPagar90Dias`

### Concentração
`cliente_receita_[1-5]`, `fornecedor_compras_[1-5]`

### Endividamento
`endividamento_[1-5]_valor_original`, `endividamento_[1-5]_saldo_devedor`

### Balanço Patrimonial (4 períodos: p1, p2, p3, p4)

**Ativo Circulante**:
`caixa_p[1-4]`, `bancos_p[1-4]`, `aplicacoes_p[1-4]`, `contasReceber_p[1-4]`, `pdd_p[1-4]`, `estoqueMP_p[1-4]`, `estoqueWIP_p[1-4]`, `estoqueProdAcabados_p[1-4]`, `estoquePecasReposicao_p[1-4]`, `impostosRecuperar_p[1-4]`, `adiantamentosFornecedores_p[1-4]`, `outrosAC_p[1-4]`

**Ativo Não Circulante**:
`titulosReceberLP_p[1-4]`, `depositosJudiciais_p[1-4]`, `outrosCreditosLP_p[1-4]`, `participacoesSocietarias_p[1-4]`, `outrosInvestimentos_p[1-4]`, `terrenos_p[1-4]`, `edificacoes_p[1-4]`, `maquinasEquipamentos_p[1-4]`, `veiculos_p[1-4]`, `moveisUtensilios_p[1-4]`, `equipamentosInformatica_p[1-4]`, `imobilizadoAndamento_p[1-4]`, `depreciacaoAcumulada_p[1-4]`, `software_p[1-4]`, `marcasPatentes_p[1-4]`, `goodwill_p[1-4]`, `amortizacaoAcumulada_p[1-4]`

**Passivo Circulante**:
`fornecedores_p[1-4]`, `emprestimosCP_p[1-4]`, `salariosPagar_p[1-4]`, `encargosSociaisPagar_p[1-4]`, `impostosRecolher_p[1-4]`, `dividendosPagar_p[1-4]`, `adiantamentosClientes_p[1-4]`, `obrigacoesFiscais_p[1-4]`, `outrosPC_p[1-4]`

**Passivo Não Circulante**:
`emprestimosLP_p[1-4]`, `financiamentosImobiliarios_p[1-4]`, `debentures_p[1-4]`, `provisoesTrabalhistas_p[1-4]`, `provisoesFiscais_p[1-4]`, `outrosPNC_p[1-4]`

**Patrimônio Líquido**:
`capitalSocial_p[1-4]`, `reservaCapital_p[1-4]`, `reservaLucros_p[1-4]`, `reservaLegal_p[1-4]`, `lucrosPrejuizosAcumulados_p[1-4]`, `ajustesAvaliacaoPatrimonial_p[1-4]`, `acoesTesouraria_p[1-4]`

### DRE (4 períodos: p1, p2, p3, p4)

**Receitas**:
`vendasProdutos_p[1-4]`, `vendasServicos_p[1-4]`, `outrasReceitas_p[1-4]`

**Deduções**:
`icms_p[1-4]`, `pis_p[1-4]`, `cofins_p[1-4]`, `iss_p[1-4]`, `devolucoesVendas_p[1-4]`, `abatimentos_p[1-4]`

**Custos**:
`cmv_p[1-4]`, `materiaPrima_p[1-4]`, `maoObraDireta_p[1-4]`, `cif_p[1-4]`, `csp_p[1-4]`

**Despesas Vendas**:
`comissoes_p[1-4]`, `vendasMarketing_p[1-4]`, `frete_p[1-4]`, `outrasDespVendas_p[1-4]`

**Despesas Administrativas**:
`pessoal_p[1-4]`, `alugueis_p[1-4]`, `utilidades_p[1-4]`, `seguros_p[1-4]`, `manutencao_p[1-4]`, `tecnologiaInformacao_p[1-4]`, `servicosProfissionais_p[1-4]`, `administrativas_p[1-4]`, `outrasDespesas_p[1-4]`, `depreciacaoAmortizacao_p[1-4]`

**Resultado Financeiro**:
`receitasFinanceiras_p[1-4]`, `despesasFinanceiras_p[1-4]`

**Não Operacional**:
`receitasNaoOperacionais_p[1-4]`, `despesasNaoOperacionais_p[1-4]`

**Impostos**:
`ir_p[1-4]`, `csll_p[1-4]`

---

## 6. DETECÇÃO AUTOMÁTICA

```javascript
function isMonetaryField(fieldName) {
    const monetaryPatterns = [
        /^capitalSocial$/,
        /^folhaPagamentoMensal$/,
        /^encargosSociais$/,
        /^contas(Receber|Pagar)(Total|90Dias)$/,
        /^cliente_receita_\d+$/,
        /^fornecedor_compras_\d+$/,
        /^endividamento_\d+_(valor_original|saldo_devedor)$/,
        /^(caixa|bancos|aplicacoes|contasReceber|pdd|estoque\w+|impostos\w+|adiantamentos\w+|outros\w+|titulos\w+|depositos\w+|participacoes\w+|terrenos|edificacoes|maquinas\w+|veiculos|moveis\w+|equipamentos\w+|imobilizado\w+|depreciacaoAcumulada|software|marcas\w+|goodwill|amortizacaoAcumulada|fornecedores|emprestimos\w+|salarios\w+|encargos\w+|impostos\w+|dividendos\w+|obrigacoes\w+|financiamentos\w+|debentures|provisoes\w+|capital\w+|reserva\w+|lucros\w+|ajustes\w+|acoes\w+)_p[1-4]$/,
        /^(vendas\w+|outras\w+|receitas\w+|icms|pis|cofins|iss|devolucoes\w+|abatimentos|cmv|materia\w+|maoObra\w+|cif|csp|comissoes|vendas\w+|frete|outras\w+|pessoal|alugueis|utilidades|seguros|manutencao|tecnologia\w+|servicos\w+|administrativas|depreciacaoAmortizacao|receitas\w+|despesas\w+|ir|csll)_p[1-4]$/
    ];

    return monetaryPatterns.some(pattern => pattern.test(fieldName));
}
```

---

## 7. EXEMPLOS DE USO

### Renderização Tela
```javascript
// src/assets/js/renderers/analysis-renderer.js
import { CurrencyFormatter } from '../../shared/formatters/currency-formatter.js';

static #formatarValor(valor) {
    if (valor === null || valor === undefined) return '—';
    return CurrencyFormatter.format(valor, 'screen');
}
```

### Exportação PDF
```javascript
// src/assets/js/export.js
const isMonetaryField = this.#isMonetaryField(key);

if (isMonetaryField && value) {
    displayValue = CurrencyFormatter.format(parseFloat(value), 'pdf');
}

// Adicionar nota no cabeçalho
const notice = CurrencyFormatter.getPDFScaleNotice();
```

### Exportação Excel
```javascript
// src/assets/js/export.js
if (isMonetaryField && value) {
    const numericValue = parseFloat(value);
    const formattedValue = CurrencyFormatter.format(numericValue, 'excel', { formatted: true });

    data.push([
        fieldLabel,
        formattedValue  // Valor completo formatado
    ]);
}
```

---

## 8. TESTES DE VALIDAÇÃO

### Normalização
```javascript
expect(normalizeMonetaryValue("150000")).toBe("150000.00");
expect(normalizeMonetaryValue("150000.00")).toBe("150000.00");
expect(normalizeMonetaryValue("150000,00")).toBe("150000.00");
```

### Formatação Contextual
```javascript
expect(CurrencyFormatter.format(150000, 'pdf')).toBe('R$ 150,00');
expect(CurrencyFormatter.format(150000, 'screen')).toBe('R$ 150.000,00');
expect(CurrencyFormatter.format(150000, 'excel')).toBe(150000.00);
expect(CurrencyFormatter.format(150000, 'excel', {formatted: true})).toBe('R$ 150.000,00');
```

### Checklist Manual
- [ ] **PDF**: Valores ÷1000 + nota cabeçalho + nota rodapé
- [ ] **Tela**: Valores completos, sem nota
- [ ] **Excel**: Valores completos formatados (uma coluna)
- [ ] **Input**: Máscara funciona, armazena completo

---

## 9. ARQUIVOS MODIFICADOS

| Arquivo | Mudanças |
|---------|----------|
| `data/empresa-moderada-completa.json` | 362 campos com `.00` |
| `src/assets/js/import.js` | `normalizeMonetaryValue()`, `toNumber()`, `toPositiveNumber()` |
| `src/shared/formatters/currency-formatter.js` | `format(value, context, options)` |
| `src/assets/js/renderers/analysis-renderer.js` | Usa `format(valor, 'screen')` |
| `src/assets/js/renderers/analises-renderer.js` | Usa `format(valor, 'screen')` |
| `src/assets/js/export.js` | PDF + Excel com contextos |
| `src/pages/analise-credito.html` | `setupExportButtons()` |
| `src/assets/js/adapters/form-data-adapter.js` | Remove campo `numero` |
| `src/assets/js/utils/currency-mask.js` | Detecção de decimais existentes |

---

## 10. CORREÇÃO CRÍTICA: CURRENCY-MASK.JS

### Problema Identificado (2025-10-29)

**Bug**: `currency-mask.js` dividia TODOS os valores por 100, assumindo entrada manual sem decimais. Quando valores eram importados de JSON com `.00` explícito, ocorria divisão incorreta.

**Impacto**: 357 campos monetários afetados
- Valores mostrados 100x menores (R$ 9.972.000,00 → R$ 99.720,00)
- Cálculos subsequentes incorretos
- Concentração exibindo 3095.9% ao invés de 30.96%

**Fluxo do Erro**:
```
JSON: "9972000.00" (correto)
  ↓
import.js: field.value = "9972000.00"
  ↓
import.js: dispatchEvent('input')
  ↓
currency-mask: parseFloat("9972000.00") / 100 = 99720 ❌
  ↓
Formulário: R$ 997,20 (ERRADO)
  ↓
Cálculos: Todos baseados em valores ÷100
```

### Solução Implementada

**Arquivo**: `src/assets/js/utils/currency-mask.js`

#### Método `format()` (linhas 81-123)

**ANTES**:
```javascript
format(value) {
    let digits = value.toString().replace(/[^0-9]/g, '');
    let number = parseFloat(digits) / 100;  // ❌ SEMPRE dividia
    return formatter.format(number);
}
```

**DEPOIS**:
```javascript
format(value) {
    const str = value.toString();

    // NOVO: Detectar se já possui decimal
    if (str.includes('.') || str.includes(',')) {
        const number = parseFloat(str.replace(',', '.'));
        return formatter.format(number); // SEM dividir por 100
    }

    // Lógica original para digitação manual
    let digits = str.replace(/[^0-9]/g, '');
    let number = parseFloat(digits) / 100;
    return formatter.format(number);
}
```

#### Método `unformat()` (linhas 130-151)

**ANTES**:
```javascript
unformat(value) {
    const digits = value.toString().replace(/\D/g, '');
    return parseFloat(digits) / 100;  // ❌ SEMPRE dividia
}
```

**DEPOIS**:
```javascript
unformat(value) {
    const str = value.toString();

    // NOVO: Detectar valor JSON puro (sem R$, com decimal)
    if (!str.includes('R$') && (str.includes('.') || str.includes(','))) {
        const number = parseFloat(str.replace(',', '.'));
        return number; // SEM dividir por 100
    }

    // Lógica original para valores formatados
    const digits = str.replace(/\D/g, '');
    return parseFloat(digits) / 100;
}
```

### Cenários Suportados

| Cenário | Entrada | Saída | Status |
|---------|---------|-------|--------|
| Import JSON com decimal | `"9972000.00"` | R$ 9.972.000,00 | ✅ CORRIGIDO |
| Import JSON com vírgula | `"9972000,00"` | R$ 9.972.000,00 | ✅ CORRIGIDO |
| Digitação manual | Digite `997200000` | R$ 9.972.000,00 | ✅ PRESERVADO |
| Valor já formatado | `"R$ 9.972.000,00"` | 9972000 (unformat) | ✅ PRESERVADO |
| Valor sem decimal | `"997200000"` | R$ 9.972.000,00 | ✅ PRESERVADO |

### Resultado Esperado

**ANTES da correção**:
- Ativo Total (p4): R$ 322.100,00 ❌
- Lucros/Prejuízos Acumulados (p4): R$ 99.720,00 ❌
- Concentração: 3095.9% ❌

**DEPOIS da correção**:
- Ativo Total (p4): R$ 32.210.000,00 ✅
- Lucros/Prejuízos Acumulados (p4): R$ 9.972.000,00 ✅
- Concentração: 30.96% ✅

### Compatibilidade

- ✅ Import de JSON (novo comportamento correto)
- ✅ Digitação manual de valores (comportamento original preservado)
- ✅ Formatação automática durante input (funciona para ambos os casos)
- ✅ Todos os 357 campos monetários

### Commit

**Data**: 2025-10-29
**Commit**: `fix(currency-mask): Detecta decimais existentes antes de dividir por 100`
**Prioridade**: CRÍTICA

---

## 11. DECISÕES TÉCNICAS

### Por que Opção B (Função Única com Contexto)?
1. Single Source of Truth
2. Manutenção centralizada
3. Testabilidade
4. Explícito > Implícito
5. Escalável (novos contextos fáceis)

### Por que Valores Completos no JSON?
1. Precisão (evita arredondamento)
2. Flexibilidade (múltiplas escalas)
3. Compatibilidade (APIs, integrações)
4. Transformação na apresentação, não no storage

### Por que Milhares em PDF?
1. Compactação (legibilidade)
2. Padrão corporativo
3. Nota obrigatória evita confusão

### Por que Valores Completos na Tela?
1. Zero ambiguidade
2. Decisões com valores exatos
3. UX consistente
4. Confiança do usuário

### Por que Uma Coluna no Excel?
1. Clareza máxima (evita confusão)
2. Valores completos explícitos
3. Interface limpa e consistente

---

## 12. RETROCOMPATIBILIDADE

### Fase 1: Adicionar Novo Sistema ✅
- `CurrencyFormatter.format(value, context)` implementado
- Funções antigas funcionam (`formatBRL` → `format('screen')`)
- Zero breaking changes

### Fase 2: Refatorar Gradualmente ✅
- Renderers atualizados
- Exportadores atualizados
- Testes isolados por contexto

### Fase 3: Deprecar Legado (Futuro)
- Console.warn em funções antigas
- Migration guide
- Remover após transição

---

## 13. REGRA DE OURO

**SEMPRE**: `150000` sem decimal = `150000.00` (cento e cinquenta mil reais)

**NUNCA**: `150000` = `1500.00` (interpretação como centavos)

Sistema normaliza automaticamente mas JSON padrão deve ter `.00` explícito para máxima clareza.

---

**Última Atualização**: 2025-10-29 (Correção currency-mask.js)
**Status**: Implementado + Correção Crítica Aplicada
**Próxima Revisão**: Após validação em produção
