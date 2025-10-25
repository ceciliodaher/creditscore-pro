# PRD – Fluxo de Cálculo para Demonstrações Financeiras (CreditScore Pro)

---
## 1. Contexto e Objetivo
O objetivo deste documento é definir os requisitos e o workflow para corrigir o problema de UX identificado na aba "Demonstrações" do CreditScore Pro e garantir um fluxo de cálculo de índices financeiros e scoring aderente às expectativas dos analistas.

---
## 2. Problemas Identificados
- Botão "Calcular" presente na aba Demonstrações reseta dados e gera confusão.
- Cálculos realizados no momento inadequado (durante input, não na visualização).
- Expectativa do usuário: apenas input nas abas iniciais, cálculo e visualização posteriores.
- Erros técnicos: dependências como MessageLoader ausentes e campos obrigatórios não expostos pelo transformer.

---
## 3. Principais Requisitos

### 3.1 UX/UI
- Remover o botão "Calcular" da aba Demonstrações.
- Input e edição de dados totalmente separados do processamento/calculadora.
- Feedback visual contínuo sobre status dos dados e dos cálculos nas abas de visualização.
- Indicadores claros de dados alterados/desatualizados nas abas Índices e Scoring.

### 3.2 Técnica
- Implementar módulo central de estado de cálculo (`calculation-state.js`).
- Criar orquestrador de cálculos com dependências (`calculation-orchestrator.js`).
- Integrar auto-save marcação de dados alterados.
- Validação automática de campos obrigatórios antes do cálculo.
- Histórico de cálculos para auditoria.
- Loader/feedback durante execução dos cálculos.

---
## 4. Workflow Proposto

### 4.1 Estrutura
- Abas 1-5: Input e edição de dados, auto-save ativo.
- Abas 6 (Índices) e 7 (Scoring): Visualização dos cálculos, status atualizado.
- Cálculo disparado automaticamente ao acessar abas 6 ou 7, ou manual via botão "Recalcular".
- Dados alterados em qualquer aba de input ativam indicador visual de necessidade de recálculo nas abas de resultados.

### 4.2 Workflow Usuário Final
1. Usuário navega pelas abas de input e preenche/edita dados relevantes.
2. Sistema salva automaticamente os dados (auto-save/debounce).
3. Se usuário acessar aba de Índices, sistema identifica se há dados alterados:
    - Se sim: Executa cálculo automático (caso auto-cálculo ativado) OU solicita que usuário clique em [Recalcular Agora].
    - Resultados visualizados sempre atualizados ou com indicação de desatualizados.
4. O fluxo é reversível – ao retornar para input e editar, indica visualmente que resultados precisam ser recalculados.

### 4.3 Workflow Técnico
- Toda alteração relevante chama calculationState.markDirty().
- Acesso às abas de cálculo dispara validação e execução do orquestrador.
- Loader exibido durante cálculos; resultados anteriores mantidos como "desatualizados" até processamento.
- Após cálculo, calculationState.markCalculated(); indicadores visuais atualizados.

---
## 5. Requisitos de Implementação

### 5.1 Módulos
```
src/assets/js/core/calculation-state.js   # Estado e listeners
src/assets/js/core/calculation-orchestrator.js   # Orquestra cálculo
src/assets/js/ui/calculation-indicators.js   # Visuais e status
src/assets/js/calculators/indices-financeiros.js
src/assets/js/calculators/scoring-engine.js
```

### 5.2 Payloads de Validação
- Campos obrigatórios do balanço e DRE validados antes de cálculo automatizado/manual.
- Erro/alerta visual se campos chave faltarem.

### 5.3 Loader, feedback e histórico
- Loader/transição suave durante cálculos.
- Histórico de cálculos e dados base salvos (últimos 10).

---
## 6. Critérios de Aceite
- Não existe botão "Calcular" em abas de input.
- Sistema marca abas de resultado como "desatualizadas" quando houver alterações.
- Indicadores visuais corretos em todas as tabs.
- Loader nas abas de resultados durante cálculo (>=0.5s).
- Validação impede cálculo se campos obrigatórios faltarem.
- Todo cálculo executa de acordo com fluxo descrito acima.
- Auditoria/histórico operacional disponível para ao menos últimos 10 cálculos.

---
## 7. Roadmap de Entrega

### Fase 1
- Remoção do botão "Calcular" na aba Demonstrações.
- Implementação do calculation-state.js com integração mínima.

### Fase 2
- calculation-orchestrator.js integrado e fluxo de cálculo automático manual via botão.
- Validação obrigatória pré-cálculo.

### Fase 3
- Adição de indicadores visuais nas tabs; loader; histórico de cálculos.
- Testes com usuários reais / validação de UX.

---
## 8. Notas Finais
Este PRD define workflow técnico e de experiência de usuário para garantir que analistas possam navegar, preencher e rever resultados de análise financeira sem perda de dados, com cálculos automáticos e validação robusta. Recomenda-se validação rápida com power users antes da fase final de rollout.