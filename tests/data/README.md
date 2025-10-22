# 📁 DADOS DE TESTE - CreditScore Pro

Este diretório contém 3 cenários realistas para teste funcional do sistema CreditScore Pro.

---

## 📊 ARQUIVOS DISPONÍVEIS

### 1. `empresa-excelente.json` - Rating AAA ⭐⭐⭐
**Perfil:** Empresa de tecnologia saudável

**Características:**
- ✅ **Pontuação Esperada:** 92-95 pontos (de 100)
- ✅ **Classificação:** AAA - Risco Mínimo
- ✅ **Liquidez Corrente:** 1.80 (excelente)
- ✅ **Margem Líquida:** 1.7% → 2.5% → 3.5% (crescente)
- ✅ **ROE:** ~15%
- ✅ **Endividamento:** 54% (saudável)
- ✅ **Crescimento Receita:** +60% em 3 anos
- ✅ **Lucratividade:** Lucro líquido positivo e crescente
- ✅ **Compliance:** Todas certidões regulares
- ✅ **Score Serasa:** 850
- ✅ **Histórico:** Sem atrasos, protestos ou ações

**Objetivo do Teste:**
- Validar fluxo positivo completo
- Testar cálculos com dados saudáveis
- Verificar geração de scoring alto (AAA)
- Confirmar ausência de alertas críticos
- Testar recomendação de aprovação

---

### 2. `empresa-moderada.json` - Rating BBB ⚠️
**Perfil:** Comércio de materiais com pontos de atenção

**Características:**
- ⚠️ **Pontuação Esperada:** 62-68 pontos (de 100)
- ⚠️ **Classificação:** BBB - Risco Moderado
- ⚠️ **Liquidez Corrente:** 1.16 (aceitável, mas em queda)
- ⚠️ **Margem Líquida:** 0.2% → -4.9% → -10.0% (decrescente!)
- ⚠️ **ROE:** Negativo em 2022 e 2023
- ⚠️ **Endividamento:** 84% (alto e crescente)
- 📉 **Crescimento Receita:** +14% em 3 anos (moderado)
- 🔴 **Lucratividade:** Prejuízos em 2022 e 2023
- ⚠️ **Compliance:** Certidão estadual com pendência (parcelamento)
- ⚠️ **Score Serasa:** 620
- ⚠️ **Histórico:** 3 atrasos em 12 meses, 1 renegociação

**Alertas Esperados:**
- 🟡 Margem em declínio
- 🟡 Aumento de endividamento
- 🟡 Prejuízos consecutivos
- 🟡 Certidão estadual pendente
- 🟡 Atrasos ocasionais em pagamentos

**Objetivo do Teste:**
- Validar alertas de atenção (amarelos)
- Testar scoring intermediário (BBB)
- Verificar análise de tendências negativas
- Confirmar recomendação de "análise criteriosa"
- Testar comportamento com prejuízos

---

### 3. `empresa-risco-alto.json` - Rating C 🔴
**Perfil:** Indústria metalúrgica com problemas graves

**Características:**
- 🔴 **Pontuação Esperada:** 32-38 pontos (de 100)
- 🔴 **Classificação:** C - Risco Muito Alto
- 🔴 **Liquidez Corrente:** 0.62 (CRÍTICA - insolvência!)
- 🔴 **Margem Líquida:** -11.5% → -23.3% → -35.5% (colapso)
- 🔴 **ROE:** Negativo (patrimônio líquido negativo!)
- 🔴 **Endividamento:** 117% (passivo > ativo!)
- 📉 **Crescimento Receita:** -16% em 3 anos (queda)
- 🔴 **Lucratividade:** Prejuízos acumulados de -R$ 1.317.000
- 🔴 **Compliance:** Certidões federal, estadual, FGTS irregulares
- 🔴 **Score Serasa:** 280
- 🔴 **Histórico:** 3 protestos, 8 atrasos, 75 dias inadimplente em empréstimo

**Alertas Críticos Esperados:**
- 🔴 Liquidez crítica (< 1.0)
- 🔴 Patrimônio líquido negativo
- 🔴 Prejuízos consecutivos (3 anos)
- 🔴 Endividamento insustentável
- 🔴 Situação cadastral irregular
- 🔴 Protestos ativos
- 🔴 Inadimplência bancária
- 🔴 Ações trabalhistas (4)
- 🔴 Score de crédito muito baixo

**Objetivo do Teste:**
- Validar alertas críticos (vermelhos)
- Testar scoring baixo (C)
- Verificar identificação de insolvência
- Confirmar recomendação de REJEIÇÃO
- Testar cálculos com patrimônio líquido negativo
- Validar análise de risco extremo

---

## 🚀 COMO USAR

### Passo 1: Iniciar o Sistema
```bash
npm run dev
```

### Passo 2: Abrir Interface
Navegue para: `http://localhost:3000/src/pages/analise-credito.html`

### Passo 3: Importar Dados
1. Clique no botão **"📤 Importar"** no header
2. Selecione um dos arquivos:
   - `empresa-excelente.json` → Para testar fluxo positivo
   - `empresa-moderada.json` → Para testar alertas intermediários
   - `empresa-risco-alto.json` → Para testar alertas críticos
3. Confirme a importação

### Passo 4: Navegar e Validar
- Navegue pelos 8 módulos usando os botões "Próximo"/"Anterior"
- Verifique se os dados foram importados corretamente
- Observe os cálculos automáticos nos Módulos 4 e 5
- Verifique os alertas no Módulo 6
- Gere relatórios no Módulo 8

---

## 📋 CHECKLIST DE VALIDAÇÃO

### Para `empresa-excelente.json`:
- [ ] Módulo 1: CNPJ = 12.345.678/0001-90
- [ ] Módulo 1: Razão Social = "Tech Solutions Ltda"
- [ ] Módulo 2: Equação contábil balanceada (3 anos)
- [ ] Módulo 2: Receita crescente: R$ 4.2M → R$ 5.5M → R$ 6.7M
- [ ] Módulo 4: Liquidez Corrente ≈ 1.80
- [ ] Módulo 4: ROE ≈ 15%
- [ ] Módulo 5: Scoring = AAA (92-95 pontos)
- [ ] Módulo 6: Nenhum alerta crítico
- [ ] Módulo 6: Score Serasa = 850

### Para `empresa-moderada.json`:
- [ ] Módulo 1: CNPJ = 98.765.432/0001-10
- [ ] Módulo 2: Prejuízo em 2022 e 2023
- [ ] Módulo 2: Margem bruta em queda
- [ ] Módulo 4: Liquidez Corrente ≈ 1.16
- [ ] Módulo 5: Scoring = BBB (62-68 pontos)
- [ ] Módulo 6: Alerta "Margem em declínio" (amarelo)
- [ ] Módulo 6: Alerta "Prejuízos consecutivos" (amarelo)
- [ ] Módulo 6: Certidão estadual com pendência
- [ ] Módulo 6: Score Serasa = 620

### Para `empresa-risco-alto.json`:
- [ ] Módulo 1: CNPJ = 11.222.333/0001-44
- [ ] Módulo 2: Patrimônio Líquido NEGATIVO em 2023
- [ ] Módulo 2: Prejuízos acumulados de -R$ 1.317.000
- [ ] Módulo 3: 75 dias de atraso em empréstimo BB
- [ ] Módulo 4: Liquidez Corrente = 0.62 (CRÍTICA)
- [ ] Módulo 5: Scoring = C (32-38 pontos)
- [ ] Módulo 6: Múltiplos alertas críticos (vermelhos)
- [ ] Módulo 6: 3 protestos ativos
- [ ] Módulo 6: Score Serasa = 280
- [ ] Módulo 6: Recomendação = REJEIÇÃO

---

## 🧮 CÁLCULOS ESPERADOS

### Índices Financeiros (Módulo 4)

#### Empresa Excelente (2023):
- **Liquidez Corrente:** 1.910.000 / 1.060.000 = **1.80**
- **Liquidez Seca:** (1.910.000 - 140.000) / 1.060.000 = **1.67**
- **ROE:** 116.000 / 1.790.000 = **6.5%** (calculado sobre PL médio = 15%)
- **Margem Líquida:** 116.000 / 6.720.000 = **1.7%**
- **Endividamento:** (1.060.000 + 1.050.000) / 3.900.000 = **54%**

#### Empresa Moderada (2023):
- **Liquidez Corrente:** 1.190.000 / 1.030.000 = **1.16**
- **Liquidez Seca:** (1.190.000 - 470.000) / 1.030.000 = **0.70**
- **ROE:** Negativo (PL positivo, lucro negativo)
- **Margem Líquida:** -337.600 / 3.360.000 = **-10.0%**
- **Endividamento:** (1.030.000 + 610.000) / 1.960.000 = **84%**

#### Empresa Risco Alto (2023):
- **Liquidez Corrente:** 803.000 / 1.285.000 = **0.62**
- **Liquidez Seca:** (803.000 - 420.000) / 1.285.000 = **0.30**
- **ROE:** Não calculável (PL negativo)
- **Margem Líquida:** -625.520 / 1.764.000 = **-35.5%**
- **Endividamento:** (1.285.000 + 630.000) / 1.628.000 = **117%**

---

## 📊 SCORING BREAKDOWN ESPERADO

### Empresa Excelente - AAA (92-95 pts)
| Categoria | Peso | Pontuação | Justificativa |
|-----------|------|-----------|---------------|
| Cadastral | 20% | 19-20 pts | Regular, sem protestos, tempo atividade 6.5 anos |
| Financeiro | 25% | 23-25 pts | Receita +60%, lucro crescente, dados consistentes |
| Capacidade Pagamento | 25% | 23-24 pts | Liquidez 1.80, geração caixa positiva |
| Endividamento | 20% | 16-18 pts | 54%, composição saudável, adimplente |
| Garantias | 10% | 9-10 pts | Recebíveis, equipamentos, relacionamento |

### Empresa Moderada - BBB (62-68 pts)
| Categoria | Peso | Pontuação | Justificativa |
|-----------|------|-----------|---------------|
| Cadastral | 20% | 13-15 pts | Regular, 1 ação trabalhista, 9 anos atividade |
| Financeiro | 25% | 10-13 pts | Receita +14%, prejuízos 2 anos, margem em queda |
| Capacidade Pagamento | 25% | 14-16 pts | Liquidez 1.16 (limite), cobertura juros baixa |
| Endividamento | 20% | 12-14 pts | 84% (alto), 3 atrasos, 1 renegociação |
| Garantias | 10% | 6-8 pts | Imóvel hipotecado, relacionamento médio |

### Empresa Risco Alto - C (32-38 pts)
| Categoria | Peso | Pontuação | Justificativa |
|-----------|------|-----------|---------------|
| Cadastral | 20% | 4-6 pts | Irregular, protestos, 4 ações trabalhistas |
| Financeiro | 25% | 3-6 pts | Receita -16%, prejuízos 3 anos, dados ruins |
| Capacidade Pagamento | 25% | 2-5 pts | Liquidez 0.62 (crítica), sem geração caixa |
| Endividamento | 20% | 2-5 pts | 117% (insustentável), inadimplência, protestos |
| Garantias | 10% | 1-3 pts | Poucas garantias livres, máquinas alienadas |

---

## 🎨 VISUALIZAÇÕES ESPERADAS

### Gráficos (se implementados):
1. **Evolução de Receita** (3 anos)
2. **Evolução de Lucro Líquido** (3 anos)
3. **Composição do Ativo** (pizza)
4. **Composição do Passivo** (pizza)
5. **Índices de Liquidez** (barras)
6. **Breakdown do Scoring** (radar/pizza)

### Cores:
- 🟢 Verde: Indicadores positivos, AAA/AA/A
- 🟡 Amarelo: Alertas de atenção, BBB/BB
- 🔴 Vermelho: Alertas críticos, B/C/D

---

## 🔍 TESTES DE EXPORTAÇÃO

Após importar cada arquivo, teste as exportações:

### JSON:
- Arquivo gerado deve ter mesma estrutura do importado
- Reimportar deve funcionar sem erros

### Excel:
- 8 abas (uma por módulo)
- Formatação preservada (moeda, percentuais)
- Cores nos alertas

### PDF:
- Múltiplas páginas
- Capa, índice, seções
- Gráficos renderizados
- Cores nos alertas

---

## 📝 REGISTRO DE BUGS

Se encontrar divergências, registre aqui:

```markdown
### BUG-XXX: [Título do Bug]
- **Arquivo:** empresa-excelente.json
- **Módulo:** 4 (Índices Financeiros)
- **Esperado:** Liquidez Corrente = 1.80
- **Obtido:** Liquidez Corrente = 1.75
- **Severidade:** Alta
- **Data:** 2025-10-22
```

---

## 📞 SUPORTE

Dúvidas sobre os dados de teste? Consulte:
- `/docs/TESTING.md` - Plano completo de testes
- `/docs/PROGRESS.md` - Progresso do desenvolvimento
- `CLAUDE.md` - Documentação do sistema

---

**Última atualização:** 2025-10-22
**Versão:** 1.0.0
