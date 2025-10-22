export class ScoringEngine {
  constructor(cfg) { this.cfg = cfg; }
  async init() { return true; }
  async calcularScoring(data) { return { classificacao: { rating: 'AAA' } }; }
}
window.ScoringEngine = ScoringEngine;