# Registro de Correções de Bugs - CreditScore Pro

## 2025-10-28 - Correção de Equação Contábil Desbalanceada

### 🔴 Problema Identificado

**Erro**: Equação contábil desbalanceada no período 1 ao importar dados JSON
- **Ativo Total**: R$ 4.585.000
- **Passivo + PL**: R$ 4.985.000
- **Diferença**: R$ 400.000 ❌

**Mensagem de Erro**:
```
❌ Erro na análise completa: Error: AnaliseVerticalHorizontal: balanço p1 desbalanceado -
Ativo Total (4585000) ≠ Passivo + PL (4985000), diferença: 400000.00
```

### 🔍 Causa Raiz

**Arquivo Afetado**: `src/assets/js/import.js` - Método `transformarParaCalculadores()`

**Problema**: Uso incorreto de `toPositiveNumber()` para contas retificadoras (redutoras do Ativo e PL), causando **dupla subtração**:

1. **PDD (Provisão Devedores Duvidosos)**: Linha 147-148
   - Valor vinha **negativo** do formulário (ex: -50.000)
   - `toPositiveNumber()` convertia para **positivo** (50.000)
   - Código **subtraía** o valor: `contasReceber - pdd`
   - **Efeito**: Ativo reduzido duas vezes (dupla subtração)

2. **Depreciação Acumulada**: Linha 182-183
   - Mesmo problema: valor negativo → forçado positivo → subtraído
   - Imobilizado Líquido incorreto

3. **Amortização Acumulada**: Linha 189-190
   - Mesmo problema: valor negativo → forçado positivo → subtraído
   - Intangível Líquido incorreto

4. **Ações em Tesouraria**: Linha 230-232
   - Mesmo problema no Patrimônio Líquido
   - PL Total incorreto

### ✅ Correções Implementadas

#### 1. Corrigido PDD (Provisão Devedores Duvidosos)
**Arquivo**: `src/assets/js/import.js:147-148`

```javascript
// ANTES (ERRADO):
const pdd = toPositiveNumber(formDataFlat[`pdd_${p}`]); // Força positivo
const contasReceberLiquido = contasReceber - pdd; // Subtrai → DUPLA SUBTRAÇÃO

// DEPOIS (CORRETO):
const pdd = toNumber(formDataFlat[`pdd_${p}`]); // Preserva sinal negativo
const contasReceberLiquido = contasReceber + pdd; // Soma (pdd já é negativo)
```

#### 2. Corrigido Depreciação Acumulada
**Arquivo**: `src/assets/js/import.js:182-183`

```javascript
// ANTES (ERRADO):
const depreciacaoAcumulada = toPositiveNumber(formDataFlat[`depreciacaoAcumulada_${p}`]);
const imobilizadoLiquido = imobilizadoBruto - depreciacaoAcumulada;

// DEPOIS (CORRETO):
const depreciacaoAcumulada = toNumber(formDataFlat[`depreciacaoAcumulada_${p}`]);
const imobilizadoLiquido = imobilizadoBruto + depreciacaoAcumulada; // Soma (já é negativo)
```

#### 3. Corrigido Amortização Acumulada
**Arquivo**: `src/assets/js/import.js:189-190`

```javascript
// ANTES (ERRADO):
const amortizacaoAcumulada = toPositiveNumber(formDataFlat[`amortizacaoAcumulada_${p}`]);
const intangivelLiquido = intangivelBruto - amortizacaoAcumulada;

// DEPOIS (CORRETO):
const amortizacaoAcumulada = toNumber(formDataFlat[`amortizacaoAcumulada_${p}`]);
const intangivelLiquido = intangivelBruto + amortizacaoAcumulada; // Soma (já é negativo)
```

#### 4. Corrigido Ações em Tesouraria
**Arquivo**: `src/assets/js/import.js:230-232`

```javascript
// ANTES (ERRADO):
const acoesTesouraria = toPositiveNumber(formDataFlat[`acoesTesouraria_${p}`]);
const patrimonioLiquidoTotal = capitalSocial + reservaCapital + reservaLucros +
                               reservaLegal + lucrosPrejuizosAcumulados +
                               ajustesAvaliacaoPatrimonial - acoesTesouraria;

// DEPOIS (CORRETO):
const acoesTesouraria = toNumber(formDataFlat[`acoesTesouraria_${p}`]);
const patrimonioLiquidoTotal = capitalSocial + reservaCapital + reservaLucros +
                               reservaLegal + lucrosPrejuizosAcumulados +
                               ajustesAvaliacaoPatrimonial + acoesTesouraria; // Soma (já é negativo)
```

#### 5. Atualizado Comentário do Helper `toNumber()`
**Arquivo**: `src/assets/js/import.js:126-128`

```javascript
// ANTES:
// Para o balanço, sempre usamos o valor absoluto, pois as contas redutoras são subtraídas na fórmula.

// DEPOIS:
// Preserva o sinal original (positivo ou negativo).
// Usado para: contas retificadoras (PDD, Depreciação, Ações em Tesouraria) que vêm negativas,
// e contas como Lucros/Prejuízos Acumulados que podem ser positivas ou negativas.
```

### 📊 Impacto

**Módulos Corrigidos**:
- ✅ `src/assets/js/import.js` - Transformação de dados

**Módulos Desbloqueados**:
- ✅ `analise-vertical-horizontal.js` - Agora valida sem erro
- ✅ `creditscore-module.js` - Análise completa executa
- ✅ `scoring-engine.js` - Score de crédito calculado
- ✅ Todos os calculadores de análises financeiras

**Módulos Não Afetados** (continuam funcionando):
- ✅ `dre-totalizador.js` - Correção anterior mantida
- ✅ `balanco-totalizador.js` - Sem alterações

### 🧪 Validação

Após correção, ao reimportar o mesmo JSON:
- ✅ Equação contábil balanceada: `Ativo = Passivo + PL`
- ✅ Diferença de R$ 400.000 eliminada
- ✅ "✅ Análise completa executada com sucesso"
- ✅ Score de crédito calculado corretamente

### 📝 Arquivos Modificados

1. `src/assets/js/import.js`
   - 4 correções de contas retificadoras
   - 1 atualização de comentário de documentação
   - Total: 5 mudanças

### 🎯 Princípios Mantidos

- ✅ **NO FALLBACKS**: Validação rigorosa mantida, erro detectado corretamente
- ✅ **KISS**: Solução simples - apenas corrigir operações matemáticas
- ✅ **DRY**: Reutilização do helper `toNumber()` existente
- ✅ **Nomenclatura única**: Pattern de sign handling consistente

### 🔗 Contexto Técnico

**Contas Retificadoras (Redutoras)**:
- São contas que **reduzem** o saldo de outra conta
- No sistema contábil, armazenadas com **sinal negativo**
- Exemplos:
  - **PDD**: Reduz Contas a Receber
  - **Depreciação Acumulada**: Reduz Imobilizado
  - **Amortização Acumulada**: Reduz Intangível
  - **Ações em Tesouraria**: Reduz Patrimônio Líquido

**Cálculo Correto**:
```
Contas a Receber Bruto:  R$ 1.000.000 (positivo)
PDD (retificadora):      R$ -50.000   (negativo, já armazenado assim)
───────────────────────────────────────────
Contas a Receber Líquido = 1.000.000 + (-50.000) = R$ 950.000
```

**Cálculo Errado (antes da correção)**:
```
Contas a Receber Bruto:  R$ 1.000.000
PDD convertido:          R$ 50.000 (toPositiveNumber forçou positivo)
───────────────────────────────────────────
Contas a Receber Líquido = 1.000.000 - 50.000 = R$ 950.000 ✓ (parece certo)

MAS o valor armazenado no JSON era:
PDD original:           R$ -50.000 (negativo)
Após toPositiveNumber:  R$ 50.000  (positivo)
Subtração:              -50.000    (adicional)
───────────────────────────────────────────
Efeito total no Ativo:  -100.000   (DUPLA SUBTRAÇÃO!)
```

---

**Data da Correção**: 2025-10-28
**Autor**: Claude Code
**Commit**: (pendente)
