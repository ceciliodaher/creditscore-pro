# Fórmulas Extraídas do Sistema GRC Sicoob

Identifiquei **30 indicadores financeiros** organizados em 8 categorias principais. Cada indicador possui dois campos: **nota** (0-6) e **alerta** (0-1).

### Indicadores de Desempenho Financeiro

**1. Sobras ou Perdas sobre Recursos Totais**

- Fórmula: `(Sobras ou Perdas / Recursos Totais) × 100`
- Mede lucratividade em relação aos recursos totais

**2. Receita Financeira sobre Total de Recursos**

- Fórmula: `(Receita Financeira / Total de Recursos) × 100`
- Eficiência na geração de receita financeira

**3. Retorno da Carteira de Crédito**

- Fórmula: `(Receita da Carteira de Crédito / Carteira de Crédito Total) × 100`
- Rentabilidade da carteira de crédito

**4. Despesas Financeiras sobre Recursos Captados**

- Fórmula: `(Despesas Financeiras / Recursos Captados) × 100`
- Custo da captação de recursos

### Indicadores de Risco

**5. Inadimplência**

- Fórmula: `(Créditos Vencidos > 90 dias / Carteira Total) × 100`
- Limite Bacen: < 2,5%

**6. PCLD sobre Despesas Totais do Mês**

- Fórmula: `(PCLD do Mês / Despesas Totais do Mês) × 100`
- Provisão para créditos duvidosos

**7. PCLD sobre Total de Recursos**

- Fórmula: `(PCLD Acumulada / Total de Recursos) × 100`

**8. Limite de Exposição por Cliente**

- Fórmula: `(Maior Exposição Individual / Patrimônio Líquido) × 100`
- Limite Bacen: < 25%

### Indicadores de Liquidez

**9. Liquidez na Central**

- Fórmula: `(Recursos Disponíveis na Central / Obrigações de Curto Prazo) × 100`

**10. Liquidez Geral**

- Fórmula: `(Ativo Circulante + Realizável LP) / (Passivo Circulante + Exigível LP)`
- Ideal: > 1,0

**11. Adiantamento a Depositante**

- Fórmula: `(Adiantamentos a Depositantes / Total de Depósitos) × 100`

### Indicadores de Custo

**12. Custo Fixo sobre Total de Recursos**

- Fórmula: `(Custos Fixos / Total de Recursos) × 100`

**13. Tarifas sobre Custo Fixo**

- Fórmula: `(Receita de Tarifas / Custo Fixo) × 100`

**14. Honorários e Cédula sobre Custo Fixo**

- Fórmula: `(Honorários + Cédulas / Custo Fixo) × 100`

**15. Folha e Encargos sobre Total de Recursos**

- Fórmula: `(Folha + Encargos / Total de Recursos) × 100`

### Indicadores de Rentabilidade

**16. Rentabilidade Sobras sobre Receitas Brutas**

- Fórmula: `(Sobras / Receitas Brutas) × 100`
- Margem líquida das operações

**17. Rentabilidade sobre Capital Próprio (ROE)**

- Fórmula: `(Sobras / Patrimônio Líquido) × 100`

### Indicadores de Estrutura

**18. Participação do Capital Próprio**

- Fórmula: `(Patrimônio Líquido / Ativo Total) × 100`
- Grau de independência financeira

**19. Imobilização do Capital Próprio**

- Fórmula: `(Ativo Permanente / Patrimônio Líquido) × 100`

**20. Evolução Patrimonial**

- Fórmula: `((PL Atual - PL Anterior) / PL Anterior) × 100`

### Indicadores de Concentração

**21. Concentração da Carteira de Crédito**

- Fórmula: `(Top 10 Maiores Operações / Carteira Total) × 100`

**22. Concentração de Depósitos**

- Fórmula: `(Top 10 Maiores Depositantes / Total Depósitos) × 100`

**23. Enquadramento PRE**

- Fórmula: `(Patrimônio de Referência Exigido / Patrimônio Líquido) × 100`
- Limite Bacen: Mínimo 11%

### Indicadores Operacionais

**24. Evolução do Quadro Social**

- Fórmula: `((Cooperados Atual - Cooperados Anterior) / Cooperados Anterior) × 100`

**25. Despesas de Captação sobre Depósitos a Prazo**

- Fórmula: `(Despesas de Captação / Depósitos a Prazo) × 100`

## Estrutura de Implementação

### Sistema de Avaliação

- **Notas**: Escala de 0 a 6 (0=Crítico, 6=Excelente)
- **Alertas**: Binário (0=Normal, 1=Atenção)
- **Total**: Somatório de todos os alertas ativos

### Campos Auxiliares no Banco

- `total` - Soma total dos alertas
- `nu_justificativa` - ID da justificativa
- `tx_justificativa` - Texto explicativo (até 2024 caracteres)
- `nu_plano` - ID do plano de ação
- `tx_plano` - Descrição do plano (até 512 caracteres)
- `st_justificativa` e `st_plano` - Status dos registros

## Como Implementar no Credit-Score

### 1. Criar Módulo de Fórmulas

Crie o arquivo: `/src/shared/formulas/sicoob-grc-formulas.js`

```javascript
export const indicadoresFinanceiros = {
  desempenhoFinanceiro: {
    sobrasRecursosTotais: (sobras, recursosT) => (sobras / recursosT) * 100,
    receitaFinanceira: (receita, recursosT) => (receita / recursosT) * 100,
    retornoCarteira: (receitaCart, carteiraTotal) => (receitaCart / carteiraTotal) * 100,
    despesasFinanceiras: (despesas, recursosCap) => (despesas / recursosCap) * 100
  },

  risco: {
    inadimplencia: (vencidos90d, carteiraTotal) => (vencidos90d / carteiraTotal) * 100,
    pcldDespesas: (pcldMes, despesasMes) => (pcldMes / despesasMes) * 100,
    pcldRecursos: (pcldAcum, recursosT) => (pcldAcum / recursosT) * 100,
    exposicaoCliente: (maiorExposicao, pl) => (maiorExposicao / pl) * 100
  },

  liquidez: {
    liquidezCentral: (recursosDisp, obrigCP) => (recursosDisp / obrigCP) * 100,
    liquidezGeral: (ativoC, realizavelLP, passivoC, exigivelLP) => 
      (ativoC + realizavelLP) / (passivoC + exigivelLP),
    adtoDepositante: (adiantamentos, totalDep) => (adiantamentos / totalDep) * 100
  }
};
```

### 2. Criar Sistema de Alertas

```javascript
export const avaliarIndicador = (valor, limites) => {
  const { critico, ruim, regular, bom } = limites;

  if (valor <= critico) return { nota: 0, alerta: 1 };
  if (valor <= ruim) return { nota: 1, alerta: 1 };
  if (valor <= regular) return { nota: 2, alerta: 1 };
  if (valor <= bom) return { nota: 3, alerta: 0 };
  return { nota: 4, alerta: 0 };
};
```

### 3. Estrutura de Dados Recomendada

```typescript
interface IndicadorFinanceiro {
  codigo: string;
  nome: string;
  categoria: string;
  valor: number;
  nota: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  alerta: 0 | 1;
  formula: string;
  unidade: 'percentual' | 'indice' | 'monetario';
  interpretacao: string;
  limiteRegulatorio?: string;
}
```

## Extração dos Balanços

O arquivo SQL contém dados históricos de **2009 a 2010+** com estrutura mensal. Para extrair os balanços como arquivos de texto, você pode:

### Opção 1: Criar arquivo por cooperativa

```
data/balances/cooperativa_[cd_cooperativa]_[ano]_[mes].txt
```

### Opção 2: Criar arquivo JSON consolidado

```json
{
  "cooperativa": "001",
  "periodo": "2010-01",
  "indicadores": {
    "inadimplencia": { "valor": 2.5, "nota": 3, "alerta": 0 },
    "liquidez_geral": { "valor": 1.2, "nota": 4, "alerta": 0 }
  }
}
```

## Próximos Passos Recomendados

1. **Criar diretório data/** no projeto creditscore-pro
2. **Exportar dados do SQL** para JSON ou CSV
3. **Implementar módulo de cálculo** com as 30 fórmulas
4. **Criar componente de dashboard** para visualização dos indicadores
5. **Implementar sistema de alertas** com threshold configurável
6. **Adicionar histórico temporal** para análise de evolução

O sistema GRC do Sicoob é robusto e orientado a compliance regulatório do Banco Central, perfeito para adaptar ao seu sistema de análise de crédito.

Sources
