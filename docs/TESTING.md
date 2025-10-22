# 🧪 PLANO DE TESTES FUNCIONAIS - CreditScore Pro

**Objetivo:** Validar funcionalidades do sistema através de testes manuais com dados realistas importáveis.

---

## 📋 ESTRATÉGIA DE TESTES

### Tipos de Teste

1. **Testes Funcionais Manuais** - Executados diretamente no sistema via interface
2. **Testes de Importação** - Validar carga de dados JSON
3. **Testes de Cálculo** - Verificar precisão dos calculadores automáticos
4. **Testes de Validação** - Confirmar regras de negócio
5. **Testes de Persistência** - Verificar salvamento em IndexedDB
6. **Testes de Exportação** - Validar geração de JSON, Excel, PDF

### Dados de Teste Disponíveis

Criados 3 cenários realistas em `/tests/data/`:

| Arquivo | Cenário | Rating Esperado | Objetivo |
|---------|---------|-----------------|----------|
| `empresa-excelente.json` | Empresa saudável com excelentes indicadores | AAA (90-100) | Testar fluxo positivo |
| `empresa-moderada.json` | Empresa estável com alguns pontos de atenção | BBB (60-69) | Testar alertas intermediários |
| `empresa-risco-alto.json` | Empresa com problemas financeiros graves | C (30-39) | Testar alertas críticos |

---

## 🎯 CASOS DE TESTE POR FASE

### FASE 1: Infraestrutura Core

**PRÉ-REQUISITOS:**
- ✅ FormGenerator implementado
- ✅ NavigationController implementado
- ✅ AutoSave implementado
- ✅ Sistema carrega sem erros no console

#### TC-001: Carregamento do Sistema
**Objetivo:** Verificar se o sistema inicia corretamente

**Passos:**
1. Abrir `http://localhost:3000/src/pages/analise-credito.html`
2. Observar console do navegador
3. Aguardar carregamento completo

**Resultado Esperado:**
- ✅ Sem erros no console
- ✅ Mensagem "🚀 Sistema CreditScore Pro iniciado com sucesso"
- ✅ Tabs de navegação visíveis
- ✅ Módulo 1 (Cadastro) ativo por padrão
- ✅ Progress bar em 0%

**Validações:**
- [ ] Nenhum erro 404 (arquivos não encontrados)
- [ ] Nenhum erro de dependências ausentes
- [ ] IndexedDB conectado
- [ ] Configurações carregadas

---

#### TC-002: Navegação entre Módulos
**Objetivo:** Testar navegação sequencial pelos 8 módulos

**Passos:**
1. Clicar no botão "Próximo"
2. Verificar mudança de módulo (1 → 2)
3. Clicar em "Próximo" novamente (2 → 3)
4. Clicar em "Anterior" (3 → 2)
5. Clicar diretamente na tab do Módulo 5

**Resultado Esperado:**
- ✅ Navegação fluida sem erros
- ✅ Progress bar atualiza corretamente
- ✅ Tab ativa destacada visualmente
- ✅ Conteúdo do módulo atualizado

**Validações:**
- [ ] Não é possível avançar sem preencher campos obrigatórios
- [ ] Botão "Anterior" desabilitado no Módulo 1
- [ ] Botão "Próximo" muda para "Finalizar" no Módulo 8
- [ ] Progress bar reflete posição atual (ex: Módulo 3 = 37.5%)

---

#### TC-003: Auto-Save
**Objetivo:** Verificar salvamento automático de dados

**Passos:**
1. Preencher campo "Razão Social" no Módulo 1
2. Aguardar 30 segundos (intervalo de auto-save)
3. Recarregar a página (F5)
4. Verificar prompt de restauração

**Resultado Esperado:**
- ✅ Mensagem "💾 Rascunho salvo automaticamente" após 30s
- ✅ Ao recarregar, prompt pergunta: "Deseja restaurar o rascunho salvo anteriormente?"
- ✅ Ao clicar "Sim", dados preenchidos são restaurados

**Validações:**
- [ ] Auto-save não dispara antes de 30s
- [ ] Dados restaurados estão corretos
- [ ] Possível recusar restauração e começar limpo

---

### FASE 2 & 3: Demonstrações Financeiras

**PRÉ-REQUISITOS:**
- ✅ Módulo 2 implementado com HTML completo
- ✅ AnaliseVerticalHorizontal implementado
- ✅ CapitalGiroCalculator implementado

#### TC-004: Importação de Dados - Empresa Excelente
**Objetivo:** Importar dados de empresa com excelentes indicadores

**Arquivo:** `/tests/data/empresa-excelente.json`

**Passos:**
1. Clicar no botão "📤 Importar" no header
2. Selecionar `empresa-excelente.json`
3. Confirmar substituição de dados (se houver)
4. Aguardar mensagem de sucesso

**Resultado Esperado:**
- ✅ Mensagem "✅ Dados importados com sucesso"
- ✅ Todos os 8 módulos preenchidos automaticamente
- ✅ Navegação pelos módulos mostra dados corretos

**Validações:**
- [ ] Módulo 1: CNPJ = 12.345.678/0001-90, Razão Social = "Tech Solutions Ltda"
- [ ] Módulo 2: Balanço Patrimonial de 3 anos (2021, 2022, 2023)
- [ ] Módulo 2: Equação contábil balanceada (Ativo = Passivo + PL)
- [ ] Módulo 4: Índices calculados automaticamente
- [ ] Módulo 5: Scoring = AAA (90-100 pontos)

---

#### TC-005: Validação de Equação Contábil
**Objetivo:** Garantir que Ativo = Passivo + Patrimônio Líquido

**Passos:**
1. Navegar até Módulo 2 (Demonstrações Financeiras)
2. No Balanço Patrimonial do Ano 1:
   - Ativo Total: R$ 1.000.000
   - Passivo: R$ 600.000
   - PL: R$ 350.000 (propositalmente errado)
3. Tentar avançar para próximo módulo

**Resultado Esperado:**
- ❌ Sistema bloqueia navegação
- ⚠️ Mensagem: "⚠️ Equação contábil não está balanceada: Ativo ≠ Passivo + PL"
- 🔴 Campo em vermelho indicando erro

**Validações:**
- [ ] Não permite avançar com equação incorreta
- [ ] Mensagem de erro clara
- [ ] Ao corrigir PL para R$ 400.000, validação passa

---

#### TC-006: Cálculo de Índices Financeiros
**Objetivo:** Verificar precisão dos cálculos automáticos

**Arquivo:** `/tests/data/empresa-excelente.json` (já importado)

**Passos:**
1. Navegar até Módulo 4 (Índices Financeiros)
2. Verificar índices calculados automaticamente

**Resultado Esperado:**
- ✅ **Liquidez Corrente:** ~1.67 (Ativo Circulante / Passivo Circulante)
- ✅ **Liquidez Seca:** ~1.33
- ✅ **ROE (Return on Equity):** ~15.0%
- ✅ **Margem Líquida:** ~12.5%
- ✅ **Endividamento:** ~60%

**Validações:**
- [ ] Todos os índices exibidos com 2 casas decimais
- [ ] Índices positivos em verde, negativos em vermelho
- [ ] Gráficos (se implementados) refletem dados corretos
- [ ] Comparativo entre 3 anos disponível

---

#### TC-007: Análise Vertical e Horizontal
**Objetivo:** Validar cálculos de análise V/H

**Arquivo:** `/tests/data/empresa-excelente.json` (já importado)

**Passos:**
1. No Módulo 2, clicar em "Análise Vertical/Horizontal"
2. Verificar percentuais calculados

**Resultado Esperado (Análise Vertical - Ano 2023):**
- ✅ Ativo Circulante / Ativo Total = 40%
- ✅ Ativo Não Circulante / Ativo Total = 60%
- ✅ Passivo Circulante / Passivo Total = 50%
- ✅ Patrimônio Líquido / Passivo Total = 40%

**Resultado Esperado (Análise Horizontal - Base 2021):**
- ✅ Ativo Total 2023 vs 2021 = +25%
- ✅ Receita Líquida 2023 vs 2021 = +30%
- ✅ Lucro Líquido 2023 vs 2021 = +50%

**Validações:**
- [ ] Soma dos percentuais verticais = 100%
- [ ] Análise horizontal mostra evolução correta
- [ ] Valores negativos (quedas) em vermelho

---

### FASE 4: Módulos Base (1, 3, 6)

#### TC-008: Validação de CNPJ
**Objetivo:** Testar validação de documento

**Passos:**
1. Módulo 1 (Cadastro)
2. Campo CNPJ: digitar "11.111.111/1111-11" (CNPJ inválido)
3. Tentar avançar

**Resultado Esperado:**
- ❌ Mensagem: "CNPJ inválido"
- 🔴 Campo marcado como erro
- ❌ Navegação bloqueada

**Validações:**
- [ ] CNPJ válido: 12.345.678/0001-90 passa
- [ ] Máscara aplicada automaticamente
- [ ] Dígitos verificadores validados

---

#### TC-009: Composição Societária - Validação de 100%
**Objetivo:** Garantir que participação dos sócios soma 100%

**Passos:**
1. Módulo 1, seção "Composição Societária"
2. Adicionar sócios:
   - Sócio 1: 50%
   - Sócio 2: 30%
   - Sócio 3: 15% (total = 95%)
3. Tentar avançar

**Resultado Esperado:**
- ❌ Mensagem: "A soma dos percentuais deve ser 100%"
- ⚠️ Total exibido: 95% (em vermelho)

**Validações:**
- [ ] Ao corrigir Sócio 3 para 20%, validação passa
- [ ] Permite apenas valores 0-100 por sócio
- [ ] Cálculo do total atualiza em tempo real

---

#### TC-010: Alertas de Compliance
**Objetivo:** Verificar geração de alertas críticos/atenção/informativos

**Arquivo:** `/tests/data/empresa-risco-alto.json`

**Passos:**
1. Importar `empresa-risco-alto.json`
2. Navegar até Módulo 6 (Compliance)
3. Verificar alertas gerados

**Resultado Esperado:**
- 🔴 **ALERTA CRÍTICO:** "Liquidez Baixa" (liquidez < 1.0)
- 🔴 **ALERTA CRÍTICO:** "Endividamento Elevado" (>70%)
- 🔴 **ALERTA CRÍTICO:** "Prejuízos Consecutivos"
- ⚠️ **ATENÇÃO:** "Certidões Pendentes"

**Validações:**
- [ ] Alertas críticos exibidos em vermelho
- [ ] Alertas de atenção em amarelo
- [ ] Cada alerta tem título e descrição clara
- [ ] Possível visualizar detalhes do alerta

---

### FASE 5: Scoring de Crédito

#### TC-011: Scoring - Empresa Excelente (AAA)
**Objetivo:** Validar cálculo de scoring para empresa saudável

**Arquivo:** `/tests/data/empresa-excelente.json`

**Passos:**
1. Importar empresa-excelente.json
2. Navegar até Módulo 5 (Scoring de Crédito)
3. Verificar pontuação e classificação

**Resultado Esperado:**
- ⭐ **Pontuação Total:** 92-95 pontos (de 100)
- 🟢 **Classificação:** AAA
- 🟢 **Risco:** Mínimo
- 🟢 **Cor:** Verde (#4CAF50)

**Breakdown Esperado:**
- Cadastral (20 pts): 18-20 pts
- Financeiro (25 pts): 23-25 pts
- Capacidade Pagamento (25 pts): 23-24 pts
- Endividamento (20 pts): 16-18 pts
- Garantias (10 pts): 8-10 pts

**Validações:**
- [ ] Pontuação por categoria exibida
- [ ] Gráfico radar/pizza mostrando distribuição
- [ ] Recomendação: "Aprovação com condições preferenciais"

---

#### TC-012: Scoring - Empresa Risco Alto (C)
**Objetivo:** Validar cálculo de scoring para empresa com problemas

**Arquivo:** `/tests/data/empresa-risco-alto.json`

**Passos:**
1. Importar empresa-risco-alto.json
2. Navegar até Módulo 5
3. Verificar pontuação

**Resultado Esperado:**
- ⭐ **Pontuação Total:** 32-38 pontos (de 100)
- 🔴 **Classificação:** C
- 🔴 **Risco:** Muito Alto
- 🔴 **Cor:** Vermelho (#F44336)

**Breakdown Esperado:**
- Cadastral: 8-10 pts (problemas cadastrais)
- Financeiro: 5-8 pts (prejuízos, queda de faturamento)
- Capacidade Pagamento: 4-6 pts (liquidez baixa)
- Endividamento: 5-8 pts (endividamento alto)
- Garantias: 3-5 pts (poucas garantias)

**Validações:**
- [ ] Recomendação: "Rejeição ou solicitar garantias adicionais"
- [ ] Alertas críticos listados
- [ ] Não permite aprovação automática

---

### FASE 6: Exportação e Persistência

#### TC-013: Exportação JSON
**Objetivo:** Validar exportação completa de dados

**Passos:**
1. Com dados da empresa-excelente.json carregados
2. Clicar em "💾 Exportar JSON"
3. Salvar arquivo

**Resultado Esperado:**
- ✅ Arquivo `creditscore-export-YYYY-MM-DD.json` baixado
- ✅ Arquivo contém todos os 8 módulos
- ✅ Estrutura válida (pode ser reimportada)

**Validações:**
- [ ] JSON é válido (sem erros de sintaxe)
- [ ] Contém metadados (data exportação, versão sistema)
- [ ] Ao reimportar, dados idênticos aos originais
- [ ] Valores monetários mantêm 2 casas decimais

---

#### TC-014: Exportação Excel
**Objetivo:** Verificar geração de planilha

**Passos:**
1. Com dados carregados
2. Clicar em "📊 Excel"
3. Abrir arquivo gerado no Excel/LibreOffice

**Resultado Esperado:**
- ✅ Arquivo `.xlsx` gerado
- ✅ **Abas separadas** para cada módulo:
  - Aba 1: Cadastro
  - Aba 2: Balanço Patrimonial (3 anos)
  - Aba 3: DRE (3 anos)
  - Aba 4: Endividamento
  - Aba 5: Índices Financeiros
  - Aba 6: Scoring
  - Aba 7: Compliance
  - Aba 8: RH
- ✅ Formatação preservada (negrito em títulos, cores em alertas)

**Validações:**
- [ ] Valores monetários formatados como moeda
- [ ] Percentuais com símbolo %
- [ ] Fórmulas do Excel para cálculos (se aplicável)
- [ ] Gráficos incluídos (se implementado)

---

#### TC-015: Exportação PDF
**Objetivo:** Validar geração de relatório PDF

**Passos:**
1. Com dados carregados
2. Clicar em "📄 PDF"
3. Abrir PDF gerado

**Resultado Esperado:**
- ✅ PDF com múltiplas páginas
- ✅ **Capa** com logo Expertzy, nome da empresa, data
- ✅ **Índice** com links para seções
- ✅ **Seções:**
  1. Resumo Executivo
  2. Dados Cadastrais
  3. Demonstrações Financeiras (tabelas)
  4. Análise de Índices (com gráficos)
  5. Scoring de Crédito (destaque visual)
  6. Alertas e Recomendações
  7. Compliance
  8. Conclusão

**Validações:**
- [ ] Formatação profissional (fonte, espaçamento)
- [ ] Cores corretas (verde para positivo, vermelho para alertas)
- [ ] Gráficos renderizados corretamente
- [ ] Footer com número de página e data

---

#### TC-016: Persistência em IndexedDB
**Objetivo:** Verificar salvamento local

**Passos:**
1. Importar empresa-moderada.json
2. Clicar em "💾 Salvar Rascunho"
3. Fechar aba do navegador
4. Reabrir `http://localhost:3000/src/pages/analise-credito.html`

**Resultado Esperado:**
- ✅ Prompt: "Deseja restaurar o rascunho salvo anteriormente?"
- ✅ Ao clicar "Sim", todos os dados restaurados

**Validações:**
- [ ] Dados salvos nos 5 stores do IndexedDB:
  - `empresas`
  - `demonstracoes`
  - `endividamento`
  - `scoring`
  - `autosave`
- [ ] Possível salvar múltiplas empresas
- [ ] Possível deletar rascunhos antigos
- [ ] Indicador visual de "última modificação"

---

## 📊 MATRIZ DE COBERTURA

| Módulo | Funcionalidade | TC Associado | Status |
|--------|----------------|--------------|--------|
| Core | Carregamento | TC-001 | ⏳ |
| Core | Navegação | TC-002 | ⏳ |
| Core | Auto-Save | TC-003 | ⏳ |
| Import/Export | Importação JSON | TC-004 | ⏳ |
| Módulo 1 | Validação CNPJ | TC-008 | ⏳ |
| Módulo 1 | Composição Societária | TC-009 | ⏳ |
| Módulo 2 | Equação Contábil | TC-005 | ⏳ |
| Módulo 2 | Análise V/H | TC-007 | ⏳ |
| Módulo 3 | Endividamento | - | ⏳ |
| Módulo 4 | Índices Financeiros | TC-006 | ⏳ |
| Módulo 5 | Scoring AAA | TC-011 | ⏳ |
| Módulo 5 | Scoring C | TC-012 | ⏳ |
| Módulo 6 | Alertas Compliance | TC-010 | ⏳ |
| Módulo 7 | RH | - | ⏳ |
| Módulo 8 | Exportação JSON | TC-013 | ⏳ |
| Módulo 8 | Exportação Excel | TC-014 | ⏳ |
| Módulo 8 | Exportação PDF | TC-015 | ⏳ |
| Database | Persistência | TC-016 | ⏳ |

**Legenda:**
- ⏳ Aguardando implementação
- 🔄 Em teste
- ✅ Passou
- ❌ Falhou

---

## 🎯 CRITÉRIOS DE ACEITE

### Módulos Essenciais (FASE 1-3)
- [ ] Sistema carrega sem erros (TC-001)
- [ ] Navegação funciona (TC-002)
- [ ] Auto-save ativo (TC-003)
- [ ] Importação JSON funciona (TC-004)
- [ ] Equação contábil validada (TC-005)
- [ ] Índices calculados corretamente (TC-006)

### Módulos Completos (FASE 4-5)
- [ ] Validações de cadastro (TC-008, TC-009)
- [ ] Alertas de compliance (TC-010)
- [ ] Scoring calculado (TC-011, TC-012)

### Sistema Finalizado (FASE 6)
- [ ] Exportação JSON (TC-013)
- [ ] Exportação Excel (TC-014)
- [ ] Exportação PDF (TC-015)
- [ ] Persistência IndexedDB (TC-016)

---

## 📝 REGISTRO DE TESTES

### Template de Execução

```markdown
## Execução: [DATA]
**Testador:** [Nome]
**Ambiente:** Chrome 120 / Firefox 121 / Safari 17
**Versão Sistema:** 1.0.0

### TC-XXX: [Nome do Teste]
- **Status:** ✅ Passou / ❌ Falhou / ⏸️ Bloqueado
- **Observações:** [Detalhes]
- **Screenshots:** [Links]
- **Tempo Execução:** [Minutos]

### Bugs Encontrados
1. [BUG-001] Descrição do bug
   - **Severidade:** Crítica / Alta / Média / Baixa
   - **Steps to Reproduce:** ...
   - **Expected vs Actual:** ...
```

---

## 🚀 COMO EXECUTAR OS TESTES

### Preparação
1. Iniciar servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

2. Abrir navegador em: `http://localhost:3000/src/pages/analise-credito.html`

3. Abrir DevTools (F12) para monitorar console

### Importar Dados de Teste
1. Clicar em "📤 Importar" no header
2. Navegar até `/tests/data/`
3. Selecionar arquivo desejado:
   - `empresa-excelente.json` → para fluxo positivo
   - `empresa-moderada.json` → para cenário intermediário
   - `empresa-risco-alto.json` → para alertas críticos

### Executar Casos de Teste
- Seguir os **Passos** de cada TC
- Comparar com **Resultado Esperado**
- Marcar **Validações** como ✅ ou ❌
- Registrar bugs encontrados

### Exportar Resultados
- Ao concluir bateria de testes, exportar dados
- Salvar evidências (screenshots, arquivos exportados)
- Documentar no registro de execução

---

## 📌 NOTAS IMPORTANTES

1. **Ordem de Execução:** Seguir ordem dos TCs (TC-001 → TC-016)
2. **Limpeza de Dados:** Usar botão "Limpar" entre testes se necessário
3. **Navegadores:** Testar em Chrome, Firefox e Safari
4. **IndexedDB:** Limpar dados no DevTools se persistência causar problemas
5. **Performance:** Anotar tempo de resposta de cálculos complexos

---

**Última atualização:** 2025-10-22
**Próxima revisão:** Após conclusão da Fase 3
