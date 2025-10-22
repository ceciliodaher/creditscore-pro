# Fórmulas Modernas para Análise de Crédito

Baseado na estrutura do seu projeto CreditScore Pro e nas metodologias mais modernas do mercado, apresento o framework completo de fórmulas que você deverá implementar:

## Modelo Z-Score de Altman (Atualizado)

### Fórmula Exata

$$ Z = 1,2A + 1,4B + 3,3C + 0,6D + 1,0E $$

**Onde:**

- **A** = Capital de Giro / Ativos Totais
- **B** = Lucros Retidos / Ativos Totais
- **C** = EBIT / Ativos Totais
- **D** = Valor de Mercado do Patrimônio / Passivos Totais
- **E** = Vendas / Ativos Totais

**Origem dos Dados:** Balanço Patrimonial e DRE dos últimos 3 anos

**Resultado Esperado:**

- Z > 2,99: Zona Segura (baixo risco de falência)
- 1,81 < Z < 2,99: Zona Cinza (risco moderado)
- Z < 1,81: Zona de Perigo (alto risco de falência)

**Interpretação:** O Z-Score combina liquidez, rentabilidade, alavancagem e eficiência operacional para prever a probabilidade de falência em até 2 anos, com precisão de 80-90%[1][2][3].

**Peso Sugerido:** 15% na análise geral

## Modelo Basel III - Componentes de Risco

### 1. Probability of Default (PD)

**Fórmula:**
$$ PD = \frac{\text{Número de Defaults}}{\text{Total de Exposições}} \times 100 $$

**Cálculo Avançado com Rating:**
$$ PD_{\text{ajustada}} = PD_{\text{base}} \times \text{Fator Macroeconômico} \times \text{Fator Setorial} $$

**Origem dos Dados:** Histórico de inadimplência, rating interno, análise cadastral, situação fiscal[4][5].

**Resultado Esperado:** Percentual entre 0% e 100%

**Interpretação:**

- PD < 1%: Risco mínimo (Rating AAA/AA)
- 1% < PD < 5%: Risco baixo (Rating A/BBB)
- 5% < PD < 15%: Risco moderado (Rating BB/B)
- PD > 15%: Risco alto (Rating C/D)

**Peso Sugerido:** 25% na análise geral

### 2. Loss Given Default (LGD)

**Fórmula:**
$$ LGD = \frac{\text{Exposição} - \text{Recuperação}}{\text{Exposição}} \times 100 $$

**Cálculo com Garantias:**
$$ LGD_{\text{efetivo}} = \max\left(0, \frac{EAD - \text{Valor Garantias} \times (1-\text{Haircut})}{EAD}\right) $$

**Origem dos Dados:** Valor da exposição, garantias oferecidas, histórico de recuperação[6][7].

**Resultado Esperado:** Percentual entre 0% e 100%

**Interpretação:**

- LGD < 25%: Garantias sólidas, alta recuperação esperada
- 25% < LGD < 50%: Garantias adequadas
- 50% < LGD < 75%: Garantias insuficientes
- LGD > 75%: Risco severo de perda

**Peso Sugerido:** 15% na análise geral

### 3. Exposure at Default (EAD)

**Fórmula:**
$$ EAD = \text{Saldo Atual} + (CCF \times \text{Limite Não Utilizado}) $$

**Onde:** CCF = Credit Conversion Factor (tipicamente 75% para linhas de crédito)

**Origem dos Dados:** Posição atual da dívida, limites de crédito aprovados[4][8].

**Resultado Esperado:** Valor em moeda corrente

**Interpretação:** Representa a exposição total esperada no momento do default, considerando utilizações futuras de limites aprovados.

**Peso Sugerido:** Usado no cálculo de perda esperada, não pontuado isoladamente

### 4. Expected Loss (EL)

**Fórmula:**
$$ EL = PD \times LGD \times EAD $$

**Origem dos Dados:** Combinação dos três componentes anteriores[7][5].

**Resultado Esperado:** Valor monetário da perda esperada

**Interpretação:** Representa a perda média esperada em um horizonte de 1 ano. Deve ser provisionado contabilmente.

**Peso Sugerido:** 10% na análise geral

## RAROC (Risk-Adjusted Return on Capital)

### Fórmula Completa

$$ RAROC = \frac{\text{Receita} - \text{Custos Operacionais} - EL}{\text{Capital Econômico}} \times 100 $$

**Onde:**

- **Capital Econômico** = Unexpected Loss (UL) no percentil 99%
- **UL** = $$\sqrt{EAD^2 \times [PD \times LGD^2 \times (1-PD) + LGD^2 \times PD \times (1-PD)]}$$

**Origem dos Dados:** Demonstrações financeiras, pricing da operação, cálculos de PD/LGD/EAD[9][10][11].

**Resultado Esperado:** Percentual de retorno ajustado ao risco

**Interpretação:**

- RAROC > 15%: Operação excelente
- 10% < RAROC < 15%: Operação aceitável
- RAROC < 10%: Operação a ser rejeitada (abaixo do custo de capital)

**Peso Sugerido:** 20% na análise geral (decisório para pricing)

## Índices de Liquidez

### 1. Liquidez Corrente

$$ LC = \frac{\text{Ativo Circulante}}{\text{Passivo Circulante}} $$

**Origem dos Dados:** Balanço Patrimonial

**Resultado Esperado:**

- LC > 1,5: Excelente
- 1,2 < LC < 1,5: Bom
- 1,0 < LC < 1,2: Atenção
- LC < 1,0: Crítico

**Peso Sugerido:** 6% na análise geral

### 2. Liquidez Seca

$$ LS = \frac{\text{Ativo Circulante} - \text{Estoques}}{\text{Passivo Circulante}} $$

**Origem dos Dados:** Balanço Patrimonial

**Resultado Esperado:**

- LS > 1,0: Excelente capacidade de pagamento imediato
- 0,7 < LS < 1,0: Satisfatório
- LS < 0,7: Dependência de venda de estoques

**Peso Sugerido:** 4% na análise geral

## Índices de Rentabilidade

### 1. Margem EBITDA

$$ \text{Margem EBITDA} = \frac{EBITDA}{\text{Receita Líquida}} \times 100 $$

**Origem dos Dados:** DRE

**Resultado Esperado:**

- > 20%: Excelente
- 10-20%: Bom
- 5-10%: Regular
- < 5%: Preocupante

**Peso Sugerido:** 5% na análise geral

### 2. ROE (Return on Equity)

$$ ROE = \frac{\text{Lucro Líquido}}{\text{Patrimônio Líquido}} \times 100 $$

**Origem dos Dados:** DRE e Balanço Patrimonial

**Resultado Esperado:**

- > 15%: Excelente retorno aos sócios
- 10-15%: Bom
- 5-10%: Regular
- < 5%: Insuficiente

**Peso Sugerido:** 5% na análise geral

## Índices de Endividamento

### 1. Endividamento Total

$$ \text{End. Total} = \frac{\text{Passivo Exigível}}{\text{Ativo Total}} \times 100 $$

**Origem dos Dados:** Balanço Patrimonial

**Resultado Esperado:**

- < 50%: Baixo endividamento
- 50-70%: Endividamento moderado
- > 70%: Alto endividamento (crítico)

**Peso Sugerido:** 7% na análise geral

### 2. Cobertura de Juros

$$ \text{Cob. Juros} = \frac{EBITDA}{\text{Despesas Financeiras}} $$

**Origem dos Dados:** DRE

**Resultado Esperado:**

- > 4,0: Excelente capacidade de pagamento
- 2,0-4,0: Boa capacidade
- 1,0-2,0: Capacidade limitada
- < 1,0: Incapacidade de cobrir juros (crítico)

**Peso Sugerido:** 8% na análise geral

## Análise de Capital de Giro

### Necessidade de Capital de Giro (NCG)

$$ NCG = (\text{AC Operacional} - \text{Disponível}) - (\text{PC Operacional} - \text{Empréstimos CP}) $$

**Ciclo Financeiro:**
$$ \text{Ciclo Fin.} = PMR + PME - PMP $$

**Onde:**

- PMR = Prazo Médio de Recebimento = $$\frac{\text{Contas a Receber}}{\text{Receita}} \times 360$$
- PME = Prazo Médio de Estoques = $$\frac{\text{Estoques}}{CMV} \times 360$$
- PMP = Prazo Médio de Pagamento = $$\frac{\text{Fornecedores}}{CMV} \times 360$$

**Origem dos Dados:** Balanço e DRE

**Resultado Esperado:**

- Ciclo Financeiro negativo: Empresa financia-se com fornecedores (ótimo)
- 0-30 dias: Excelente
- 30-60 dias: Bom
- > 60 dias: Necessidade elevada de capital

**Peso Sugerido:** 10% na análise geral

## Scoring Integrado (Sistema Proprietário)

### Modelo Ponderado Final

$$ \text{Score Final} = \sum_{i=1}^{n} (Nota_i \times Peso_i) $$

**Distribuição dos Pesos:**

1. **Análise Cadastral e Compliance** (20%)
   
   - Regularidade fiscal: 5%
   - Tempo de atividade: 5%
   - Protestos e restrições: 5%
   - Análise de sócios: 5%

2. **Capacidade de Pagamento** (25%)
   
   - PD (Probability of Default): 25%

3. **Solidez Financeira** (25%)
   
   - Z-Score de Altman: 15%
   - LGD: 15%
   - EL: 10%

4. **Performance Operacional** (20%)
   
   - RAROC: 20%

5. **Liquidez e Estrutura** (10%)
   
   - Liquidez Corrente: 6%
   - Liquidez Seca: 4%
   - Endividamento Total: 7%
   - Cobertura de Juros: 8%
   - Margem EBITDA: 5%
   - ROE: 5%
   - NCG/Ciclo Financeiro: 10%

**Classificação Final:**

- 90-100 pontos: AAA (Risco Mínimo)
- 80-89 pontos: AA (Risco Baixo)
- 70-79 pontos: A (Risco Moderado-Baixo)
- 60-69 pontos: BBB (Risco Moderado)
- 50-59 pontos: BB (Risco Moderado-Alto)
- 40-49 pontos: B (Risco Alto)
- 30-39 pontos: C (Risco Muito Alto)
- < 30 pontos: D (Risco Extremo)

## Modelos de Machine Learning (Complementares)

Para sofisticar ainda mais sua análise, considere implementar[12][13][14]:

**Algoritmos Recomendados:**

- Regressão Logística (baseline)
- Random Forest (ensemble)
- Gradient Boosting (XGBoost/LightGBM)
- Redes Neurais (para grandes volumes)

**Variáveis de Entrada:**

- Todas as fórmulas acima como features
- Dados comportamentais
- Dados de mercado
- Variáveis macroeconômicas

**Output:** Probabilidade de default calibrada (0-1)

Estas fórmulas representam o estado da arte em análise de crédito corporativo, combinando modelos clássicos validados (Altman), padrões regulatórios internacionais (Basel III)[15][16][17], métricas de retorno ajustado ao risco (RAROC) e índices financeiros fundamentais. A implementação completa no seu sistema CreditScore Pro proporcionará uma análise robusta, multidimensional e alinhada com as melhores práticas do mercado financeiro global.

# Guia Completo: Fórmulas para Análise de Crédito - Definições e Origens dos Dados

## Estrutura Fundamental - Demonstrações Contábeis

### Balanço Patrimonial - Estrutura Completa

Conforme CPC 26 (R1) e Lei 11.638/07[1][2], o Balanço Patrimonial brasileiro possui a seguinte estrutura:

#### ATIVO

**Ativo Circulante (AC)**
Bens e direitos conversíveis em dinheiro em até 12 meses[3][4]:

- **Disponível**: Caixa e equivalentes de caixa
- **Contas a Receber**: Clientes, duplicatas a receber
- **Estoques**: Matérias-primas, produtos acabados, mercadorias
- **Aplicações Financeiras CP**: Investimentos de curto prazo
- **Despesas Antecipadas**: Seguros pagos antecipadamente
- **Outros Ativos Circulantes**: Impostos a recuperar

**Ativo Não Circulante (ANC)**
Bens e direitos conversíveis após 12 meses[4][5]:

- **Realizável a Longo Prazo**: Contas a receber LP, depósitos judiciais
- **Investimentos**: Participações em outras empresas
- **Imobilizado**: Máquinas, equipamentos, veículos, imóveis
- **Intangível**: Marcas, patentes, software, fundo de comércio

#### PASSIVO

**Passivo Circulante (PC)**
Obrigações vencíveis em até 12 meses:

- **Fornecedores**: Contas a pagar a fornecedores
- **Empréstimos e Financiamentos CP**: Dívidas bancárias curto prazo
- **Obrigações Fiscais**: Impostos a recolher (ICMS, PIS, COFINS, ISS)
- **Obrigações Trabalhistas**: Salários, FGTS, INSS a pagar
- **Outras Obrigações**: Dividendos a pagar, adiantamentos de clientes

**Passivo Não Circulante (PNC)**
Obrigações vencíveis após 12 meses:

- **Financiamentos LP**: Empréstimos de longo prazo
- **Debêntures**: Títulos de dívida emitidos
- **Provisões LP**: Contingências trabalhistas, tributárias

**Patrimônio Líquido (PL)**
Capital próprio da empresa[1]:

- **Capital Social**: Valor investido pelos sócios
- **Reservas de Capital**: Ágio na emissão de ações
- **Reservas de Lucros**: Reserva legal, reserva estatutária
- **Lucros/Prejuízos Acumulados**: Resultados acumulados

### DRE - Demonstração do Resultado do Exercício

Estrutura conforme CPC 26[6][7]:

1. **Receita Operacional Bruta**: Total de vendas e serviços
2. **(-) Deduções da Receita**: Devoluções, abatimentos, impostos sobre vendas
3. **(=) Receita Operacional Líquida**: Receita efetiva
4. **(-) CPV/CMV/CSP**: Custo dos Produtos/Mercadorias/Serviços Vendidos
5. **(=) Lucro Bruto**: Margem sobre vendas
6. **(-) Despesas Operacionais**:
   - Despesas Comerciais/Vendas
   - Despesas Administrativas
   - Despesas Gerais
7. **(=) EBITDA**: Lucro antes de juros, impostos, depreciação e amortização
8. **(-) Depreciação e Amortização**
9. **(=) EBIT (Lucro Operacional)**
10. **(-) Despesas Financeiras / (+) Receitas Financeiras**
11. **(=) Resultado Antes dos Impostos**
12. **(-) IRPJ e CSLL**
13. **(=) Lucro Líquido do Exercício**

***

## PARTE 1: Modelo Z-Score de Altman

### Fórmula Completa

$$ Z = 1,2A + 1,4B + 3,3C + 0,6D + 1,0E $$

### Componente A: Capital de Giro / Ativos Totais

**Definição**: Mede a liquidez e eficiência da empresa em gerar capital de giro a partir de seus ativos.

**Cálculo do Capital de Giro Líquido (CGL)**:
$$ CGL = \text{Ativo Circulante} - \text{Passivo Circulante} $$

**Fórmula do Componente A**:
$$ A = \frac{CGL}{\text{Ativo Total}} $$

**Origem dos Dados**:

- **Ativo Circulante**: Balanço Patrimonial → Ativo Circulante (total)
- **Passivo Circulante**: Balanço Patrimonial → Passivo Circulante (total)
- **Ativo Total**: Balanço Patrimonial → Ativo Total (AC + ANC)

**Exemplo Prático**:

- AC = R$ 500.000
- PC = R$ 300.000
- Ativo Total = R$ 1.000.000
- CGL = 500.000 - 300.000 = R$ 200.000
- A = 200.000 / 1.000.000 = 0,20

**Interpretação**: Quanto maior, melhor. Indica capacidade de financiar operações com recursos próprios.

### Componente B: Lucros Retidos / Ativos Totais

**Definição**: Avalia a capacidade de retenção e acumulação de lucros ao longo do tempo.

**Cálculo de Lucros Retidos**:
$$ \text{Lucros Retidos} = \text{Reservas de Lucros} + \text{Lucros Acumulados} $$

**Fórmula do Componente B**:
$$ B = \frac{\text{Lucros Retidos}}{\text{Ativo Total}} $$

**Origem dos Dados**:

- **Reservas de Lucros**: Balanço Patrimonial → Patrimônio Líquido → Reservas de Lucros
- **Lucros Acumulados**: Balanço Patrimonial → Patrimônio Líquido → Lucros/Prejuízos Acumulados
- **Ativo Total**: Balanço Patrimonial → Ativo Total

**Exemplo Prático**:

- Reservas de Lucros = R$ 150.000
- Lucros Acumulados = R$ 50.000
- Ativo Total = R$ 1.000.000
- Lucros Retidos = 150.000 + 50.000 = R$ 200.000
- B = 200.000 / 1.000.000 = 0,20

**Interpretação**: Empresas jovens têm valores baixos; empresas maduras e lucrativas têm valores altos.

### Componente C: EBIT / Ativos Totais

**Definição**: Mede a produtividade dos ativos independentemente de estrutura fiscal e financeira.

**Cálculo do EBIT (Earnings Before Interest and Taxes)**:
$$ EBIT = \text{Receita Líquida} - CMV - \text{Despesas Operacionais} + \text{Receitas Não Operacionais} $$

Ou, de forma mais direta da DRE:
$$ EBIT = EBITDA - \text{Depreciação} - \text{Amortização} $$

**Fórmula do Componente C**:
$$ C = \frac{EBIT}{\text{Ativo Total}} $$

**Origem dos Dados**:

- **EBIT**: DRE → Resultado Operacional (antes de juros e impostos)
- **Ativo Total**: Balanço Patrimonial → Ativo Total

**Exemplo Prático**:

- EBIT = R$ 120.000
- Ativo Total = R$ 1.000.000
- C = 120.000 / 1.000.000 = 0,12

**Interpretação**: Taxa de retorno operacional. Quanto maior, mais eficiente é o uso dos ativos.

### Componente D: Valor de Mercado do PL / Passivos Totais

**Definição**: Avalia a solvência e a percepção de valor da empresa pelo mercado.

**Para empresas de capital fechado**:
$$ \text{Valor Mercado PL} = \text{Patrimônio Líquido Contábil} \times \text{Fator Ajuste} $$

**Fator de Ajuste** (conservador para empresas fechadas): 1,0 a 1,2

**Fórmula do Componente D**:
$$ D = \frac{\text{Valor Mercado PL}}{\text{Passivo Exigível Total}} $$

**Origem dos Dados**:

- **Patrimônio Líquido**: Balanço Patrimonial → Patrimônio Líquido (total)
- **Passivo Exigível Total**: PC + PNC (Balanço Patrimonial)

**Exemplo Prático**:

- Patrimônio Líquido = R$ 400.000
- Valor de Mercado PL = 400.000 × 1,0 = R$ 400.000
- Passivo Exigível = R$ 600.000
- D = 400.000 / 600.000 = 0,67

**Interpretação**: Quanto maior, menor o risco de insolvência. Indica quanto o PL cobre as dívidas.

### Componente E: Vendas / Ativos Totais

**Definição**: Mede a eficiência em gerar receita com os ativos disponíveis (giro de ativos).

**Fórmula do Componente E**:
$$ E = \frac{\text{Receita Líquida}}{\text{Ativo Total}} $$

**Origem dos Dados**:

- **Receita Líquida**: DRE → Receita Operacional Líquida
- **Ativo Total**: Balanço Patrimonial → Ativo Total

**Exemplo Prático**:

- Receita Líquida = R$ 2.000.000
- Ativo Total = R$ 1.000.000
- E = 2.000.000 / 1.000.000 = 2,0

**Interpretação**: Giro de 2,0 significa que a empresa vende 2x o valor de seus ativos por ano.

### Cálculo Final do Z-Score

**Aplicando os coeficientes**:
$$ Z = 1,2(0,20) + 1,4(0,20) + 3,3(0,12) + 0,6(0,67) + 1,0(2,0) $$
$$ Z = 0,24 + 0,28 + 0,396 + 0,402 + 2,0 = 3,318 $$

**Classificação**: Z = 3,318 → Zona Segura (baixo risco)

***

## PARTE 2: Modelos Basel III

### 1. Probability of Default (PD)

**Definição**: Probabilidade estatística de que um devedor não consiga honrar suas obrigações em 12 meses[8][9].

#### PD Simples (Histórico)

$$ PD_{\text{simples}} = \frac{\text{Número de Defaults Históricos}}{\text{Total de Exposições Similares}} \times 100 $$

**Origem dos Dados**:

- Base histórica de inadimplência do setor
- Rating interno da empresa
- Histórico de pagamentos anteriores

#### PD Ajustada (Metodologia Avançada)

$$ PD_{\text{ajustada}} = PD_{\text{base}} \times e^{(\beta_1 X_1 + \beta_2 X_2 + ... + \beta_n X_n)} $$

**Variáveis (Xi)**:

- **X₁**: Score de crédito (0-100)
- **X₂**: Índice de liquidez corrente
- **X₃**: Margem EBITDA (%)
- **X₄**: Endividamento Total (%)
- **X₅**: Tempo de atividade (anos)
- **X₆**: Restrições cadastrais (0=sem, 1=com)

**Coeficientes (βi)** - Estimados por regressão logística:

- β₁ = -0,03 (score de crédito)
- β₂ = -0,50 (liquidez)
- β₃ = -0,05 (margem EBITDA)
- β₄ = 0,02 (endividamento)
- β₅ = -0,10 (tempo atividade)
- β₆ = 1,50 (restrições)

**PD Base por Rating**:

- AAA: 0,1%
- AA: 0,3%
- A: 0,8%
- BBB: 2,0%
- BB: 5,0%
- B: 12,0%
- C: 25,0%

**Exemplo Prático**:

- Rating BBB → PD_base = 2,0%
- Score = 70, Liquidez = 1,5, Margem EBITDA = 15%, Endividamento = 60%, Tempo = 10 anos, Restrições = 0
- Cálculo: PD = 2,0% × e^[(-0,03×70) + (-0,50×1,5) + (-0,05×15) + (0,02×60) + (-0,10×10) + (1,50×0)]
- PD = 2,0% × e^[-2,1 - 0,75 - 0,75 + 1,2 - 1,0 + 0] = 2,0% × e^[-3,4]
- PD = 2,0% × 0,0334 = 0,067% ≈ **0,07%**

**Origem dos Dados**:

- **Score de Crédito**: Módulo 5 (Scoring)
- **Liquidez Corrente**: Módulo 4 (Índices Financeiros)
- **Margem EBITDA**: Calculada da DRE
- **Endividamento**: Módulo 3 (Endividamento)
- **Tempo de Atividade**: Módulo 1 (Cadastro) → Data de constituição
- **Restrições**: Módulo 6 (Compliance)

### 2. Loss Given Default (LGD)

**Definição**: Percentual de perda efetiva caso ocorra o default, após considerar recuperações e garantias[10][11].

#### LGD sem Garantias

$$ LGD_{\text{unsecured}} = 1 - \text{Taxa Recuperação Histórica} $$

**Taxa de Recuperação Típica**:

- Empresas de grande porte: 40% (LGD = 60%)
- Empresas de médio porte: 30% (LGD = 70%)
- Empresas de pequeno porte: 20% (LGD = 80%)

#### LGD com Garantias

$$ LGD_{\text{secured}} = \max\left[0, \frac{EAD - (\text{Valor Garantias} \times (1 - \text{Haircut}))}{EAD}\right] $$

**Haircuts por Tipo de Garantia**:

- Imóveis: 30-40%
- Equipamentos: 40-50%
- Estoque: 50-60%
- Recebíveis: 20-30%
- Aplicações Financeiras: 5-10%

**Exemplo Prático**:

- EAD = R$ 500.000
- Garantia: Imóvel avaliado em R$ 600.000
- Haircut imóvel = 35%
- Valor Efetivo Garantia = 600.000 × (1 - 0,35) = R$ 390.000
- LGD = max[0, (500.000 - 390.000) / 500.000]
- LGD = max[0, 110.000 / 500.000] = **22%**

**Origem dos Dados**:

- **EAD**: Calculado (ver próxima seção)
- **Valor Garantias**: Módulo 3 (Endividamento) → Garantias oferecidas
- **Avaliação de Garantias**: Laudos de avaliação, consulta a mercado
- **Haircuts**: Tabela regulatória ou política interna

### 3. Exposure at Default (EAD)

**Definição**: Exposição total esperada no momento do default, incluindo utilizações futuras de limites[8][12].

#### EAD para Operações Não Revolventes

$$ EAD = \text{Saldo Devedor Atual} + \text{Juros Vencidos} + \text{Encargos} $$

**Origem dos Dados**:

- **Saldo Devedor**: Sistema de crédito / Módulo 3 (Endividamento)
- **Juros e Encargos**: Contratos de empréstimo

#### EAD para Linhas Revolventes (Capital de Giro, Cartão Corporativo)

$$ EAD = \text{Saldo Utilizado} + (CCF \times \text{Limite Não Utilizado}) $$

**CCF (Credit Conversion Factor)** - Basel III:

- Linhas incondicionalmente canceláveis: 10%
- Compromissos com vencimento ≤ 1 ano: 20%
- Compromissos com vencimento > 1 ano: 50%
- Linhas de crédito empresariais: 75%

**Exemplo Prático**:

- Limite Total Aprovado = R$ 1.000.000
- Saldo Utilizado = R$ 400.000
- Limite Não Utilizado = R$ 600.000
- CCF = 75% (linha empresarial padrão)
- EAD = 400.000 + (0,75 × 600.000)
- EAD = 400.000 + 450.000 = **R$ 850.000**

**Origem dos Dados**:

- **Limite Aprovado**: Cadastro interno / Módulo 3
- **Saldo Utilizado**: Posição atual da dívida
- **Tipo de Linha**: Contrato / classificação interna

### 4. Expected Loss (EL)

**Definição**: Perda esperada em valor monetário ao longo de 12 meses[11][9].

#### Fórmula

$$ EL = PD \times LGD \times EAD $$

**Exemplo Prático** (usando exemplos anteriores):

- PD = 0,07% = 0,0007
- LGD = 22% = 0,22
- EAD = R$ 850.000
- EL = 0,0007 × 0,22 × 850.000
- EL = **R$ 131**

**Interpretação**: A perda esperada para esta operação é de R$ 131 em 12 meses, valor que deve ser provisionado contabilmente.

**Origem dos Dados**: Combinação dos três componentes anteriores (PD, LGD, EAD).

***

## PARTE 3: RAROC (Risk-Adjusted Return on Capital)

**Definição**: Retorno ajustado ao risco que considera o capital econômico necessário para cobrir perdas inesperadas[13][14][15].

### Unexpected Loss (UL)

**Fórmula**:
$$ UL = EAD \times \sqrt{PD \times \sigma_{LGD}^2 + LGD^2 \times \sigma_{PD}^2} $$

**Simplificação conservadora**:
$$ UL = EAD \times LGD \times \sqrt{PD \times (1-PD)} \times \text{Fator Confiança} $$

**Fator de Confiança** (percentil 99%): 2,33

**Exemplo Prático**:

- EAD = R$ 850.000
- PD = 0,0007
- LGD = 0,22
- UL = 850.000 × 0,22 × √[0,0007 × (1-0,0007)] × 2,33
- UL = 850.000 × 0,22 × √[0,0007 × 0,9993] × 2,33
- UL = 850.000 × 0,22 × 0,0264 × 2,33
- UL = **R$ 10.870**

### Capital Econômico

$$ \text{Capital Econômico} = UL $$

### Cálculo do RAROC

$$ RAROC = \frac{\text{Receita da Operação} - \text{Custos Operacionais} - EL}{\text{Capital Econômico}} \times 100 $$

**Componentes**:

- **Receita da Operação**: Juros + Tarifas + Comissões
- **Custos Operacionais**: Funding + Despesas administrativas + Impostos
- **EL**: Perda esperada (provisão)
- **Capital Econômico**: UL calculada acima

**Exemplo Prático**:

- Taxa de Juros: 2% a.m. (24% a.a.)
- Prazo: 12 meses
- EAD = R$ 850.000
- Receita de Juros = 850.000 × 0,24 = R$ 204.000
- Tarifas = R$ 5.000
- Receita Total = R$ 209.000
- Custo de Funding (CDI + spread) = 15% a.a. = R$ 127.500
- Despesas Operacionais = R$ 15.000
- Impostos (15% sobre receita) = R$ 31.350
- Custos Totais = 127.500 + 15.000 + 31.350 = R$ 173.850
- EL = R$ 131
- Capital Econômico = R$ 10.870
- RAROC = (209.000 - 173.850 - 131) / 10.870 × 100
- RAROC = 35.019 / 10.870 × 100 = **322%**

**Interpretação**: RAROC de 322% indica operação extremamente rentável (muito acima dos 15% mínimos aceitáveis).

**Origem dos Dados**:

- **Taxa de Juros**: Tabela de pricing / Módulo 3
- **Custos**: Sistema financeiro / Contabilidade gerencial
- **EL e UL**: Calculados nas etapas anteriores

***

## PARTE 4: Índices Financeiros Detalhados

### 1. Índices de Liquidez

#### A) Liquidez Corrente

**Definição**: Capacidade de pagar obrigações de curto prazo com ativos circulantes.

$$ LC = \frac{\text{Ativo Circulante}}{\text{Passivo Circulante}} $$

**Origem dos Dados**:

- **Ativo Circulante**: Balanço → Ativo → Circulante (somatório)
- **Passivo Circulante**: Balanço → Passivo → Circulante (somatório)

**Exemplo**:

- AC = R$ 500.000
- PC = R$ 300.000
- LC = 500.000 / 300.000 = **1,67**

**Interpretação**:

- LC > 1,5: Excelente - Para cada R$ 1,00 de dívida CP, tem R$ 1,67 em ativos líquidos
- 1,2 < LC < 1,5: Bom
- 1,0 < LC < 1,2: Atenção - margem apertada
- LC < 1,0: Crítico - passivo circulante maior que ativo circulante

#### B) Liquidez Seca

**Definição**: Liquidez imediata, excluindo estoques (ativos menos líquidos).

$$ LS = \frac{\text{Ativo Circulante} - \text{Estoques}}{\text{Passivo Circulante}} $$

**Origem dos Dados**:

- **Estoques**: Balanço → Ativo Circulante → Estoques

**Exemplo**:

- AC = R$ 500.000
- Estoques = R$ 150.000
- PC = R$ 300.000
- LS = (500.000 - 150.000) / 300.000 = **1,17**

**Interpretação**: Empresa pode pagar 117% das dívidas CP sem vender estoques.

#### C) Liquidez Imediata

**Definição**: Capacidade de pagamento com recursos imediatamente disponíveis.

$$ LI = \frac{\text{Disponível} + \text{Aplicações Financeiras CP}}{\text{Passivo Circulante}} $$

**Origem dos Dados**:

- **Disponível**: Balanço → AC → Caixa e Equivalentes
- **Aplicações CP**: Balanço → AC → Aplicações Financeiras

**Exemplo**:

- Disponível = R$ 80.000
- Aplicações CP = R$ 50.000
- PC = R$ 300.000
- LI = (80.000 + 50.000) / 300.000 = **0,43**

**Interpretação**: 43% das dívidas CP podem ser pagas imediatamente.

### 2. Índices de Rentabilidade

#### A) Margem Bruta

**Definição**: Percentual do lucro bruto em relação à receita líquida.

$$ \text{Margem Bruta} = \frac{\text{Lucro Bruto}}{\text{Receita Líquida}} \times 100 $$

**Cálculo do Lucro Bruto**:
$$ \text{Lucro Bruto} = \text{Receita Líquida} - CMV $$

**Origem dos Dados**:

- **Receita Líquida**: DRE → Receita Operacional Líquida
- **CMV**: DRE → Custo das Mercadorias Vendidas

**Exemplo**:

- Receita Líquida = R$ 2.000.000
- CMV = R$ 1.200.000
- Lucro Bruto = 2.000.000 - 1.200.000 = R$ 800.000
- Margem Bruta = (800.000 / 2.000.000) × 100 = **40%**

**Interpretação**: Para cada R$ 100 vendidos, R$ 40 sobram após custos diretos.

#### B) Margem EBITDA

**Definição**: Geração operacional de caixa antes de decisões financeiras e tributárias[16][17].

**Cálculo do EBITDA**:
$$ EBITDA = \text{Lucro Operacional} + \text{Depreciação} + \text{Amortização} $$

Ou, de forma mais completa[18]:
$$ EBITDA = \text{Receita Líquida} - CMV - \text{Despesas Operacionais} + \text{Depreciação} + \text{Amortização} $$

**Fórmula da Margem**:
$$ \text{Margem EBITDA} = \frac{EBITDA}{\text{Receita Líquida}} \times 100 $$

**Origem dos Dados**:

- **Receita Líquida**: DRE
- **CMV**: DRE
- **Despesas Operacionais**: DRE → Despesas Comerciais + Administrativas + Gerais
- **Depreciação**: DRE → Despesas Não Caixa / Nota Explicativa
- **Amortização**: DRE → Despesas Não Caixa / Nota Explicativa

**Exemplo Prático**[18]:

- Receita Líquida = R$ 2.000.000
- CMV = R$ 1.200.000
- Despesas Operacionais = R$ 400.000
- Depreciação = R$ 50.000
- Amortização = R$ 20.000
- EBITDA = 2.000.000 - 1.200.000 - 400.000 + 50.000 + 20.000 = R$ 470.000
- Margem EBITDA = (470.000 / 2.000.000) × 100 = **23,5%**

**Interpretação**:

- > 20%: Excelente geração de caixa operacional
- 10-20%: Boa
- 5-10%: Regular
- < 5%: Preocupante

#### C) ROE (Return on Equity)

**Definição**: Retorno sobre o capital próprio investido pelos sócios.

$$ ROE = \frac{\text{Lucro Líquido}}{\text{Patrimônio Líquido Médio}} \times 100 $$

**PL Médio**:
$$ PL_{\text{médio}} = \frac{PL_{\text{inicial}} + PL_{\text{final}}}{2} $$

**Origem dos Dados**:

- **Lucro Líquido**: DRE → Resultado Líquido do Exercício
- **PL Inicial**: Balanço ano anterior → PL
- **PL Final**: Balanço ano atual → PL

**Exemplo**:

- Lucro Líquido = R$ 120.000
- PL Inicial (ano anterior) = R$ 380.000
- PL Final (ano atual) = R$ 420.000
- PL Médio = (380.000 + 420.000) / 2 = R$ 400.000
- ROE = (120.000 / 400.000) × 100 = **30%**

**Interpretação**: Cada R$ 100 investidos pelos sócios geraram R$ 30 de lucro no período.

#### D) ROA (Return on Assets)

**Definição**: Eficiência em gerar lucro a partir dos ativos totais.

$$ ROA = \frac{\text{Lucro Líquido}}{\text{Ativo Total Médio}} \times 100 $$

**Origem dos Dados**:

- **Lucro Líquido**: DRE
- **Ativo Total**: Balanço → Ativo Total

**Exemplo**:

- Lucro Líquido = R$ 120.000
- Ativo Total Médio = R$ 1.000.000
- ROA = (120.000 / 1.000.000) × 100 = **12%**

### 3. Índices de Endividamento

#### A) Endividamento Total

**Definição**: Proporção de recursos de terceiros no financiamento dos ativos.

$$ \text{End. Total} = \frac{\text{Passivo Exigível Total}}{\text{Ativo Total}} \times 100 $$

**Passivo Exigível**:
$$ \text{Passivo Exigível} = PC + PNC $$

**Origem dos Dados**:

- **PC**: Balanço → Passivo Circulante
- **PNC**: Balanço → Passivo Não Circulante
- **Ativo Total**: Balanço → Ativo Total

**Exemplo**:

- PC = R$ 300.000
- PNC = R$ 300.000
- Passivo Exigível = 300.000 + 300.000 = R$ 600.000
- Ativo Total = R$ 1.000.000
- End. Total = (600.000 / 1.000.000) × 100 = **60%**

**Interpretação**:

- < 50%: Baixo endividamento (estrutura saudável)
- 50-70%: Endividamento moderado
- > 70%: Alto endividamento (risco elevado)

#### B) Cobertura de Juros

**Definição**: Capacidade de pagamento de despesas financeiras com geração operacional[16].

$$ \text{Cob. Juros} = \frac{EBITDA}{\text{Despesas Financeiras}} $$

**Origem dos Dados**:

- **EBITDA**: Calculado anteriormente
- **Despesas Financeiras**: DRE → Resultado Financeiro → Despesas Financeiras (juros sobre empréstimos)

**Exemplo**:

- EBITDA = R$ 470.000
- Despesas Financeiras = R$ 80.000
- Cob. Juros = 470.000 / 80.000 = **5,88x**

**Interpretação**:

- > 4,0x: Excelente capacidade
- 2,0-4,0x: Boa capacidade
- 1,0-2,0x: Capacidade limitada (atenção)
- < 1,0x: Incapacidade de cobrir juros (crítico)

### 4. Análise de Capital de Giro

#### Necessidade de Capital de Giro (NCG)

**Definição**: Capital necessário para financiar o ciclo operacional da empresa[19][20].

**Fórmula Completa**:
$$ NCG = (\text{AC Operacional}) - (\text{PC Operacional}) $$

**AC Operacional** (exclui disponível):
$$ AC_{\text{op}} = \text{Contas a Receber} + \text{Estoques} + \text{Outros Ativos Operacionais} $$

**PC Operacional** (exclui empréstimos):
$$ PC_{\text{op}} = \text{Fornecedores} + \text{Obrigações Fiscais} + \text{Obrigações Trabalhistas} $$

**Origem dos Dados**:

- **Contas a Receber**: Balanço → AC → Clientes/Duplicatas a Receber
- **Estoques**: Balanço → AC → Estoques
- **Fornecedores**: Balanço → PC → Fornecedores
- **Obrigações Fiscais**: Balanço → PC → Impostos a Pagar
- **Obrigações Trabalhistas**: Balanço → PC → Salários/FGTS/INSS a Pagar

**Exemplo Prático**[19]:

- Contas a Receber = R$ 200.000
- Estoques = R$ 150.000
- Fornecedores = R$ 120.000
- Obrigações Fiscais = R$ 40.000
- Obrigações Trabalhistas = R$ 30.000
- AC Operacional = 200.000 + 150.000 = R$ 350.000
- PC Operacional = 120.000 + 40.000 + 30.000 = R$ 190.000
- NCG = 350.000 - 190.000 = **R$ 160.000**

**Interpretação**:

- NCG > 0: Empresa precisa financiar suas operações (típico)
- NCG = 0: Autofinanciamento perfeito (raro)
- NCG < 0: Fornecedores financiam a operação (excelente)

#### Ciclo Financeiro

**Definição**: Tempo entre pagamento a fornecedores e recebimento de clientes[21].

$$ \text{Ciclo Financeiro} = PMR + PME - PMP $$

**PMR (Prazo Médio de Recebimento)**:
$$ PMR = \frac{\text{Contas a Receber}}{\text{Receita Líquida}} \times 360 $$

**PME (Prazo Médio de Estoques)**:
$$ PME = \frac{\text{Estoques}}{CMV} \times 360 $$

**PMP (Prazo Médio de Pagamento)**:
$$ PMP = \frac{\text{Fornecedores}}{CMV} \times 360 $$

**Origem dos Dados**:

- **Contas a Receber**: Balanço → AC
- **Estoques**: Balanço → AC
- **Fornecedores**: Balanço → PC
- **Receita Líquida**: DRE
- **CMV**: DRE

**Exemplo Prático**:

- Contas a Receber = R$ 200.000
- Receita Líquida Anual = R$ 2.000.000
- Estoques = R$ 150.000
- CMV Anual = R$ 1.200.000
- Fornecedores = R$ 120.000
- PMR = (200.000 / 2.000.000) × 360 = 36 dias
- PME = (150.000 / 1.200.000) × 360 = 45 dias
- PMP = (120.000 / 1.200.000) × 360 = 36 dias
- Ciclo Financeiro = 36 + 45 - 36 = **45 dias**

**Interpretação**:

- Ciclo < 0: Empresa recebe antes de pagar (ideal)
- 0-30 dias: Excelente
- 30-60 dias: Bom
- 60-90 dias: Regular
- > 90 dias: Necessidade elevada de capital (atenção)

***

## PARTE 5: Implementação no Sistema

### Módulo de Demonstrações (ID 2)

**Campos necessários no formulário**:

**Balanço Patrimonial**:

```json
{
  "ano": 2025,
  "ativoCirculante": {
    "caixaEquivalentes": 80000,
    "contasReceber": 200000,
    "estoques": 150000,
    "aplicacoesFinanceiras": 50000,
    "outros": 20000,
    "total": 500000
  },
  "ativoNaoCirculante": {
    "realizavelLongoPrazo": 100000,
    "investimentos": 50000,
    "imobilizado": 300000,
    "intangivel": 50000,
    "total": 500000
  },
  "passivoCirculante": {
    "fornecedores": 120000,
    "emprestimosCP": 100000,
    "obrigacoesFiscais": 40000,
    "obrigacoesTrabalhistas": 30000,
    "outros": 10000,
    "total": 300000
  },
  "passivoNaoCirculante": {
    "financiamentosLP": 250000,
    "outros": 50000,
    "total": 300000
  },
  "patrimonioLiquido": {
    "capitalSocial": 200000,
    "reservasLucros": 150000,
    "lucrosAcumulados": 50000,
    "total": 400000
  }
}
```

**DRE**:

```json
{
  "ano": 2025,
  "receitaBruta": 2400000,
  "deducoes": 400000,
  "receitaLiquida": 2000000,
  "cmv": 1200000,
  "lucroBruto": 800000,
  "despesasOperacionais": {
    "comerciais": 150000,
    "administrativas": 180000,
    "gerais": 70000,
    "total": 400000
  },
  "depreciacao": 50000,
  "amortizacao": 20000,
  "ebit": 330000,
  "despesasFinanceiras": 80000,
  "receitasFinanceiras": 10000,
  "resultadoAntesImpostos": 260000,
  "irpjCsll": 60000,
  "lucroLiquido": 200000
}
```

### Arquivo: indices-financeiros.js (Implementação Completa)

```javascript
export class IndicesFinanceirosCalculator {
  constructor(config) {
    this.config = config;
  }

  async calcularTodos(balanco, dre) {
    const indices = {};

    // 1. Liquidez
    indices.liquidez = this.calcularLiquidez(balanco);

    // 2. Rentabilidade
    indices.rentabilidade = this.calcularRentabilidade(balanco, dre);

    // 3. Endividamento
    indices.endividamento = this.calcularEndividamento(balanco, dre);

    // 4. Atividade
    indices.atividade = this.calcularAtividade(balanco, dre);

    // 5. Z-Score Altman
    indices.zScore = this.calcularZScore(balanco, dre);

    return indices;
  }

  calcularLiquidez(balanco) {
    const ac = balanco.ativoCirculante.total;
    const pc = balanco.passivoCirculante.total;
    const est = balanco.ativoCirculante.estoques;
    const disp = balanco.ativoCirculante.caixaEquivalentes + 
                 balanco.ativoCirculante.aplicacoesFinanceiras;

    return {
      corrente: this.arredondar(ac / pc, 2),
      seca: this.arredondar((ac - est) / pc, 2),
      imediata: this.arredondar(disp / pc, 2),
      geral: this.arredondar(
        (ac + balanco.ativoNaoCirculante.realizavelLongoPrazo) /
        (pc + balanco.passivoNaoCirculante.total), 2
      )
    };
  }

  calcularRentabilidade(balanco, dre) {
    const recLiq = dre.receitaLiquida;
    const lucroBruto = dre.lucroBruto;
    const ebitda = dre.ebit + dre.depreciacao + dre.amortizacao;
    const lucroLiq = dre.lucroLiquido;
    const pl = balanco.patrimonioLiquido.total;
    const ativoTotal = balanco.ativoCirculante.total + 
                       balanco.ativoNaoCirculante.total;

    return {
      margemBruta: this.arredondar((lucroBruto / recLiq) * 100, 2),
      margemEbitda: this.arredondar((ebitda / recLiq) * 100, 2),
      margemLiquida: this.arredondar((lucroLiq / recLiq) * 100, 2),
      roe: this.arredondar((lucroLiq / pl) * 100, 2),
      roa: this.arredondar((lucroLiq / ativoTotal) * 100, 2),
      ebitda: ebitda
    };
  }

  calcularEndividamento(balanco, dre) {
    const pc = balanco.passivoCirculante.total;
    const pnc = balanco.passivoNaoCirculante.total;
    const passivoExigivel = pc + pnc;
    const ativoTotal = balanco.ativoCirculante.total + 
                       balanco.ativoNaoCirculante.total;
    const pl = balanco.patrimonioLiquido.total;
    const ebitda = dre.ebit + dre.depreciacao + dre.amortizacao;
    const despFin = dre.despesasFinanceiras;

    return {
      endividamentoTotal: this.arredondar((passivoExigivel / ativoTotal) * 100, 2),
      composicao: this.arredondar((pc / passivoExigivel) * 100, 2),
      participacaoTerceiros: this.arredondar((passivoExigivel / pl) * 100, 2),
      coberturaJuros: this.arredondar(ebitda / despFin, 2)
    };
  }

  calcularAtividade(balanco, dre) {
    const contasReceber = balanco.ativoCirculante.contasReceber;
    const estoques = balanco.ativoCirculante.estoques;
    const fornecedores = balanco.passivoCirculante.fornecedores;
    const recLiq = dre.receitaLiquida;
    const cmv = dre.cmv;

    const pmr = this.arredondar((contasReceber / recLiq) * 360, 0);
    const pme = this.arredondar((estoques / cmv) * 360, 0);
    const pmp = this.arredondar((fornecedores / cmv) * 360, 0);

    return {
      pmr: pmr,
      pme: pme,
      pmp: pmp,
      cicloOperacional: pmr + pme,
      cicloFinanceiro: pmr + pme - pmp,
      giroEstoque: this.arredondar(cmv / estoques, 2)
    };
  }

  calcularZScore(balanco, dre) {
    const ac = balanco.ativoCirculante.total;
    const pc = balanco.passivoCirculante.total;
    const ativoTotal = ac + balanco.ativoNaoCirculante.total;
    const lucrosRetidos = balanco.patrimonioLiquido.reservasLucros +
                          balanco.patrimonioLiquido.lucrosAcumulados;
    const ebit = dre.ebit;
    const pl = balanco.patrimonioLiquido.total;
    const passivoExigivel = pc + balanco.passivoNaoCirculante.total;
    const vendas = dre.receitaLiquida;

    // Componentes
    const A = (ac - pc) / ativoTotal;
    const B = lucrosRetidos / ativoTotal;
    const C = ebit / ativoTotal;
    const D = pl / passivoExigivel;
    const E = vendas / ativoTotal;

    // Z-Score
    const z = 1.2 * A + 1.4 * B + 3.3 * C + 0.6 * D + 1.0 * E;

    let classificacao, risco;
    if (z > 2.99) {
      classificacao = 'Zona Segura';
      risco = 'Baixo';
    } else if (z >= 1.81) {
      classificacao = 'Zona Cinza';
      risco = 'Moderado';
    } else {
      classificacao = 'Zona de Perigo';
      risco = 'Alto';
    }

    return {
      z: this.arredondar(z, 3),
      componentes: { A, B, C, D, E },
      classificacao: classificacao,
      risco: risco
    };
  }

  arredondar(valor, decimais) {
    return Math.round(valor * Math.pow(10, decimais)) / Math.pow(10, decimais);
  }
}
```

Este guia completo fornece todas as fórmulas necessárias com definições detalhadas de cada componente, origens exatas dos dados nas demonstrações contábeis, exemplos práticos de cálculo e interpretações para análise de crédito moderna e sofisticada, totalmente alinhado com a estrutura do seu sistema CreditScore Pro[1][6][16][19].
