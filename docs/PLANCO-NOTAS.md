Análise UX: Fluxo de Cálculo no CreditScore Pro

1. Diagnóstico do Problema
- Identificadas violações de princípios de UX (Jakob, Proximidade, Affordance falsa, Fluxo mental).
- Proposta: Sistema híbrido Calculate-as-you-go + Manual Trigger.
- Dados de implementação e wireframes textuais inclusos (fluxo A: cálculo automático com indicador visual).

2. Solução Recomendada
- Abas 1-5: apenas entrada de dados; Abas 6-8: apenas visualização de resultados.
- Tomada de decisão baseada em status de cálculo com indicadores nas abas de índice e scoring.
- Auto-save integrado que marca dados como prontos para recalcular.

3. Wireframe textual (resumo):
- Navbar Global com abas 1-8; Aba 2 corrigida para apenas input; Aba 6 exibe resultados com botão opcional de recalcular.
- Header de status na Aba Índices com botão Recalcular Agora quando dados alterados.

4. Implementação Técnica (alto nível)
- Estado centralizado de Cálculo (calculation-state.js) com lastCalculated, dataChanged, autoCalculateEnabled.
- Orquestrador (calculation-orchestrator.js) que executa cálculos de índices e scoring na devida ordem.
- Integração com Auto-Save para marcar alterações e gatilhar recalculação apenas quando necessário.

5. Ações de Usabilidade
- Feedback visual contínuo durante cálculos.
- Configuração de auto-cálculo (opcional).
- Histórico de cálculos para auditoria.

6. Roadmap (fases iniciais)
- Fase 1: remoção imediata do problema com a aba Demonstrações; Fase 2: sistema de estado; Fase 3: cálculo automático com gatilho ao navegar.

7. Critérios de Sucesso
- Fluxo linear: input -> navegação -> visualização de resultados; restauração de dados sem perda; cálculos atualizados automaticamente ou sob trigger claro.

Este documento foi criado para consolidar as propostas de UI/UX e as diretrizes técnicas correspondentes.