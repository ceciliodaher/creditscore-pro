# Análise da Seção de Endividamento para Credit Score

Com base na análise do sistema **CreditScore Pro**, apresento a estrutura completa da seção de endividamento, suas informações necessárias e o modelo de pontuação.

## Estrutura Atual da Seção

A seção de endividamento (Módulo 3) já está **parcialmente implementada** no arquivo `analise-credito.html` com os seguintes campos base:

### Campos de Entrada de Dados

1. **Instituição Financeira** (text) - Nome do credor
2. **Tipo de Dívida** (select) - Empréstimo, Financiamento, Leasing, Debêntures, etc.
3. **Valor Original** (currency) - Valor inicial contratado
4. **Saldo Devedor** (currency) - Valor atual da dívida
5. **Taxa de Juros** (percentage) - Taxa anual contratada
6. **Data de Vencimento** (date) - Prazo final
7. **Status** (select) - Em dia, Atraso leve, Atraso moderado, Inadimplente
8. **Garantias** (textarea) - Descrição das garantias oferecidas

## Informações Adicionais Necessárias

Para uma análise creditícia completa, a seção precisa ser **expandida** com:

### Dados Agregados (Campos Calculados)

**Métricas de Endividamento:**

- **Dívida Total** = Soma de todos os saldos devedores
- **Dívida de Curto Prazo** = Dívidas com vencimento < 12 meses
- **Dívida de Longo Prazo** = Dívidas com vencimento > 12 meses
- **Despesas Financeiras Mensais** = Soma dos juros + amortizações mensais

### Índices Calculados Automaticamente

Com base nos dados do Balanço Patrimonial (Módulo 2):

1. **Índice de Endividamento Geral**
   
   - Fórmula: `(Passivo Circulante + Passivo Não Circulante) / Patrimônio Líquido`
   - Interpretação: Quanto de capital de terceiros para cada R$ 1 de capital próprio[1][2]

2. **Composição do Endividamento**
   
   - Fórmula: `Passivo Circulante / (Passivo Circulante + Passivo Não Circulante) × 100`
   - Interpretação: Percentual de dívidas de curto prazo[1][3]

3. **Grau de Endividamento**
   
   - Fórmula: `Passivo Total / Ativo Total × 100`
   - Interpretação: Percentual dos ativos financiados por terceiros[4]

4. **Índice de Cobertura de Juros**
   
   - Fórmula: `EBITDA / Despesas Financeiras`
   - Interpretação: Capacidade de pagar juros com o lucro operacional[5]

## Estrutura de Apresentação dos Dados

### Layout Recomendado

```html
<!-- SEÇÃO 3.1: Cadastro de Dívidas -->
<div class="dividas-list">
  <!-- Tabela com múltiplas linhas para cada dívida -->
  <!-- Botão "Adicionar Dívida" -->
</div>

<!-- SEÇÃO 3.2: Resumo Consolidado -->
<div class="resumo-endividamento">
  <div class="card-metrica">
    <h4>Dívida Total</h4>
    <span class="valor-destaque">R$ XXX.XXX,XX</span>
  </div>
  <div class="card-metrica">
    <h4>Curto Prazo</h4>
    <span>R$ XXX.XXX,XX (XX%)</span>
  </div>
  <div class="card-metrica">
    <h4>Longo Prazo</h4>
    <span>R$ XXX.XXX,XX (XX%)</span>
  </div>
</div>

<!-- SEÇÃO 3.3: Índices Calculados -->
<div class="indices-endividamento">
  <table class="tabela-indices">
    <tr>
      <td>Índice de Endividamento Geral</td>
      <td class="valor">1.25</td>
      <td class="status bom">Bom</td>
    </tr>
    <tr>
      <td>Composição do Endividamento</td>
      <td class="valor">45%</td>
      <td class="status adequado">Adequado</td>
    </tr>
    <tr>
      <td>Cobertura de Juros</td>
      <td class="valor">3.2x</td>
      <td class="status bom">Bom</td>
    </tr>
  </table>
</div>

<!-- SEÇÃO 3.4: Histórico de Pagamentos -->
<div class="historico-pagamentos">
  <div class="estatistica">
    <span>Dívidas em Dia:</span> <strong>85%</strong>
  </div>
  <div class="estatistica">
    <span>Atrasos Leves (< 30 dias):</span> <strong>10%</strong>
  </div>
  <div class="estatistica">
    <span>Atrasos Moderados (30-60 dias):</span> <strong>5%</strong>
  </div>
</div>
```

## Sistema de Pontuação

Baseado no arquivo `scoring-criteria.json`, a categoria **Endividamento** vale **20 pontos** no score total:

### Critério 1: Nível de Endividamento (6.67 pontos)

Avalia a relação **Endividamento / Patrimônio Líquido**:

- **Excelente (100%)**: Índice ≤ 0.50 → 6.67 pontos
- **Bom (80%)**: Índice entre 0.51 e 1.0 → 5.34 pontos
- **Adequado (60%)**: Índice entre 1.01 e 2.0 → 4.00 pontos
- **Baixo (40%)**: Índice entre 2.01 e 3.0 → 2.67 pontos
- **Crítico (20%)**: Índice > 3.0 → 1.33 pontos

### Critério 2: Composição do Endividamento (6.67 pontos)

Avalia a proporção de **Dívida Curto Prazo / Dívida Total**:

- **Excelente**: ≤ 30% de dívidas de curto prazo → 6.67 pontos
- **Bom**: 31% a 50% → 5.34 pontos
- **Adequado**: 51% a 70% → 4.00 pontos
- **Baixo**: 71% a 85% → 2.67 pontos
- **Crítico**: > 85% → 1.33 pontos

### Critério 3: Histórico de Pagamentos (6.66 pontos)

Avalia o comportamento de pagamento:

- **Excelente**: 100% pagamentos em dia → 6.66 pontos
- **Bom**: Até 10% atrasos leves (< 30 dias) → 5.33 pontos
- **Adequado**: Até 20% atrasos leves ou até 5% atrasos moderados → 4.00 pontos
- **Baixo**: 20-30% atrasos ou 5-15% moderados → 2.66 pontos
- **Crítico**: > 30% atrasos ou > 15% moderados ou inadimplência → 1.33 pontos

## Implementação no Código

O sistema já possui o arquivo `scoring-engine.js` no diretório `src/assets/js/calculators/`. Esta engine deve implementar:

```javascript
calcularScoreEndividamento(dados) {
  const scoreFinal = {
    nivelEndividamento: this.avaliarNivelEndividamento(dados),
    composicaoEndividamento: this.avaliarComposicaoEndividamento(dados),
    historicoPagamentos: this.avaliarHistoricoPagamentos(dados),
    total: 0
  };

  scoreFinal.total = Object.values(scoreFinal)
    .filter(v => typeof v === 'number')
    .reduce((a, b) => a + b, 0);

  return scoreFinal;
}
```

## Alertas e Recomendações

O sistema deve gerar alertas automáticos baseados em:

- **Crítico**: Endividamento > 3.0× PL ou > 85% curto prazo ou inadimplência
- **Atenção**: Endividamento entre 2.0-3.0× PL ou 70-85% curto prazo
- **Informativo**: Melhorias nos índices ou renegociações bem-sucedidas

Esta estrutura completa permite uma análise robusta do endividamento empresarial, gerando uma pontuação objetiva que compõe 20% do score creditício total do sistema.

    # Implementação de Múltiplos Endividamentos em Formato Tabular

Com base na análise do sistema, vou fornecer a estrutura completa para implementar uma tabela dinâmica de endividamentos que permite adicionar múltiplas entradas.

## Estrutura HTML para Seção de Endividamento

Substitua a **Seção 3** atual no arquivo `analise-credito.html` pelo seguinte código:

```html
<!-- ========================================= -->
<!-- SEÇÃO 3: ANÁLISE DE ENDIVIDAMENTO -->
<!-- ========================================= -->
<div class="form-section" data-module="endividamento" id="section-3" role="tabpanel">
    <div class="section-header">
        <h2 class="section-title">💳 Análise de Endividamento</h2>
        <p class="section-description">Detalhamento de dívidas bancárias e outras obrigações financeiras</p>
    </div>

    <!-- Botão Adicionar Dívida -->
    <div style="margin-bottom: 1.5rem; display: flex; justify-content: space-between; align-items: center;">
        <button type="button" id="addDividaBtn" class="btn btn-primary">
            ➕ Adicionar Dívida
        </button>
        <span id="totalDividas" style="color: #666; font-size: 0.9rem;">
            Total de dívidas cadastradas: <strong>0</strong>
        </span>
    </div>

    <!-- Tabela de Dívidas -->
    <div class="endividamento-container" style="overflow-x: auto;">
        <table class="endividamento-table" style="width: 100%; border-collapse: collapse;">
            <thead>
                <tr style="background: #091A30; color: white;">
                    <th style="padding: 12px; text-align: left; min-width: 180px;">Instituição Financeira</th>
                    <th style="padding: 12px; text-align: left; min-width: 150px;">Tipo de Dívida</th>
                    <th style="padding: 12px; text-align: right; min-width: 130px;">Valor Original (R$)</th>
                    <th style="padding: 12px; text-align: right; min-width: 130px;">Saldo Devedor (R$)</th>
                    <th style="padding: 12px; text-align: center; min-width: 100px;">Taxa Juros (%)</th>
                    <th style="padding: 12px; text-align: center; min-width: 120px;">Vencimento</th>
                    <th style="padding: 12px; text-align: center; min-width: 120px;">Status</th>
                    <th style="padding: 12px; text-align: left; min-width: 150px;">Garantias</th>
                    <th style="padding: 12px; text-align: center; min-width: 80px;">Ações</th>
                </tr>
            </thead>
            <tbody id="dividasTableBody">
                <!-- Linhas serão adicionadas dinamicamente -->
                <tr id="emptyState">
                    <td colspan="9" style="padding: 3rem; text-align: center; color: #999;">
                        Nenhuma dívida cadastrada. Clique em "Adicionar Dívida" para começar.
                    </td>
                </tr>
            </tbody>
        </table>
    </div>

    <!-- Resumo Consolidado -->
    <div class="resumo-endividamento" style="margin-top: 2rem; display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem;">
        <div class="card-metrica" style="background: #f8f9fa; padding: 1.5rem; border-radius: 8px; border-left: 4px solid #FF002D;">
            <h4 style="color: #666; font-size: 0.85rem; margin-bottom: 0.5rem;">DÍVIDA TOTAL</h4>
            <span id="dividaTotal" class="valor-destaque" style="font-size: 1.8rem; font-weight: 700; color: #091A30;">R$ 0,00</span>
        </div>
        <div class="card-metrica" style="background: #f8f9fa; padding: 1.5rem; border-radius: 8px; border-left: 4px solid #FF9800;">
            <h4 style="color: #666; font-size: 0.85rem; margin-bottom: 0.5rem;">CURTO PRAZO (< 12 meses)</h4>
            <span id="dividaCurtoPrazo" style="font-size: 1.5rem; font-weight: 600; color: #091A30;">R$ 0,00</span>
            <small id="percentualCP" style="color: #666; display: block; margin-top: 0.5rem;">0%</small>
        </div>
        <div class="card-metrica" style="background: #f8f9fa; padding: 1.5rem; border-radius: 8px; border-left: 4px solid #4CAF50;">
            <h4 style="color: #666; font-size: 0.85rem; margin-bottom: 0.5rem;">LONGO PRAZO (> 12 meses)</h4>
            <span id="dividaLongoPrazo" style="font-size: 1.5rem; font-weight: 600; color: #091A30;">R$ 0,00</span>
            <small id="percentualLP" style="color: #666; display: block; margin-top: 0.5rem;">0%</small>
        </div>
        <div class="card-metrica" style="background: #f8f9fa; padding: 1.5rem; border-radius: 8px; border-left: 4px solid #2196F3;">
            <h4 style="color: #666; font-size: 0.85rem; margin-bottom: 0.5rem;">NÚMERO DE DÍVIDAS</h4>
            <span id="numeroDividas" style="font-size: 1.5rem; font-weight: 600; color: #091A30;">0</span>
            <small id="statusGeral" style="color: #666; display: block; margin-top: 0.5rem;">-</small>
        </div>
    </div>
</div>
```

## JavaScript para Gerenciar Dívidas Dinâmicas

Crie um novo arquivo `src/assets/js/components/endividamento-manager.js`:

```javascript
class EndividamentoManager {
    constructor() {
        this.dividas = [];
        this.dividaIdCounter = 1;
        this.init();
    }

    init() {
        document.getElementById('addDividaBtn')?.addEventListener('click', () => this.addDivida());
        this.loadFromStorage();
    }

    addDivida(data = null) {
        const dividaId = `divida_${this.dividaIdCounter++}`;

        const divida = {
            id: dividaId,
            instituicao: data?.instituicao || '',
            tipo: data?.tipo || '',
            valorOriginal: data?.valorOriginal || 0,
            saldoDevedor: data?.saldoDevedor || 0,
            taxaJuros: data?.taxaJuros || 0,
            dataVencimento: data?.dataVencimento || '',
            status: data?.status || 'em_dia',
            garantias: data?.garantias || ''
        };

        this.dividas.push(divida);
        this.renderDivida(divida);
        this.updateResumo();
        this.saveToStorage();
    }

    renderDivida(divida) {
        const tbody = document.getElementById('dividasTableBody');
        const emptyState = document.getElementById('emptyState');

        if (emptyState) {
            emptyState.remove();
        }

        const row = document.createElement('tr');
        row.id = divida.id;
        row.style.borderBottom = '1px solid #e0e0e0';
        row.innerHTML = `
            <td style="padding: 12px;">
                <input type="text" 
                       class="input-table" 
                       data-field="instituicao"
                       value="${divida.instituicao}"
                       placeholder="Nome da instituição"
                       style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
            </td>
            <td style="padding: 12px;">
                <select class="input-table" 
                        data-field="tipo"
                        style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                    <option value="">Selecione</option>
                    <option value="emprestimo" ${divida.tipo === 'emprestimo' ? 'selected' : ''}>Empréstimo</option>
                    <option value="financiamento" ${divida.tipo === 'financiamento' ? 'selected' : ''}>Financiamento</option>
                    <option value="leasing" ${divida.tipo === 'leasing' ? 'selected' : ''}>Leasing</option>
                    <option value="debentures" ${divida.tipo === 'debentures' ? 'selected' : ''}>Debêntures</option>
                    <option value="capital_giro" ${divida.tipo === 'capital_giro' ? 'selected' : ''}>Capital de Giro</option>
                    <option value="cheque_especial" ${divida.tipo === 'cheque_especial' ? 'selected' : ''}>Cheque Especial</option>
                    <option value="outro" ${divida.tipo === 'outro' ? 'selected' : ''}>Outro</option>
                </select>
            </td>
            <td style="padding: 12px;">
                <input type="text" 
                       class="input-table" 
                       data-field="valorOriginal"
                       data-mask="currency"
                       value="${divida.valorOriginal}"
                       style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; text-align: right;">
            </td>
            <td style="padding: 12px;">
                <input type="text" 
                       class="input-table" 
                       data-field="saldoDevedor"
                       data-mask="currency"
                       value="${divida.saldoDevedor}"
                       style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; text-align: right;">
            </td>
            <td style="padding: 12px;">
                <input type="text" 
                       class="input-table" 
                       data-field="taxaJuros"
                       data-mask="percentage"
                       value="${divida.taxaJuros}"
                       style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; text-align: center;">
            </td>
            <td style="padding: 12px;">
                <input type="date" 
                       class="input-table" 
                       data-field="dataVencimento"
                       value="${divida.dataVencimento}"
                       style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
            </td>
            <td style="padding: 12px;">
                <select class="input-table" 
                        data-field="status"
                        style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                    <option value="em_dia" ${divida.status === 'em_dia' ? 'selected' : ''}>Em Dia</option>
                    <option value="atraso_leve" ${divida.status === 'atraso_leve' ? 'selected' : ''}>Atraso Leve (<30d)</option>
                    <option value="atraso_moderado" ${divida.status === 'atraso_moderado' ? 'selected' : ''}>Atraso Moderado (30-60d)</option>
                    <option value="inadimplente" ${divida.status === 'inadimplente' ? 'selected' : ''}>Inadimplente</option>
                </select>
            </td>
            <td style="padding: 12px;">
                <input type="text" 
                       class="input-table" 
                       data-field="garantias"
                       value="${divida.garantias}"
                       placeholder="Ex: Imóvel, veículo..."
                       style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
            </td>
            <td style="padding: 12px; text-align: center;">
                <button type="button" 
                        class="btn-delete"
                        onclick="endividamentoManager.removeDivida('${divida.id}')"
                        style="background: #F44336; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer;">
                    🗑️
                </button>
            </td>
        `;

        tbody.appendChild(row);

        // Adicionar listeners para atualização automática
        row.querySelectorAll('.input-table').forEach(input => {
            input.addEventListener('change', (e) => this.updateDivida(divida.id, e.target));
            input.addEventListener('input', (e) => {
                if (e.target.dataset.field === 'saldoDevedor') {
                    this.updateResumo();
                }
            });
        });

        // Aplicar máscaras
        this.applyMasks(row);
    }

    updateDivida(dividaId, input) {
        const divida = this.dividas.find(d => d.id === dividaId);
        if (divida) {
            const field = input.dataset.field;
            divida[field] = input.value;
            this.updateResumo();
            this.saveToStorage();
        }
    }

    removeDivida(dividaId) {
        if (confirm('Tem certeza que deseja remover esta dívida?')) {
            this.dividas = this.dividas.filter(d => d.id !== dividaId);
            document.getElementById(dividaId)?.remove();

            if (this.dividas.length === 0) {
                const tbody = document.getElementById('dividasTableBody');
                tbody.innerHTML = `
                    <tr id="emptyState">
                        <td colspan="9" style="padding: 3rem; text-align: center; color: #999;">
                            Nenhuma dívida cadastrada. Clique em "Adicionar Dívida" para começar.
                        </td>
                    </tr>
                `;
            }

            this.updateResumo();
            this.saveToStorage();
        }
    }

    updateResumo() {
        const total = this.dividas.reduce((sum, d) => sum + this.parseCurrency(d.saldoDevedor), 0);
        const hoje = new Date();
        const umAnoFrente = new Date(hoje.setFullYear(hoje.getFullYear() + 1));

        const curtoPrazo = this.dividas
            .filter(d => d.dataVencimento && new Date(d.dataVencimento) <= umAnoFrente)
            .reduce((sum, d) => sum + this.parseCurrency(d.saldoDevedor), 0);

        const longoPrazo = total - curtoPrazo;

        document.getElementById('dividaTotal').textContent = this.formatCurrency(total);
        document.getElementById('dividaCurtoPrazo').textContent = this.formatCurrency(curtoPrazo);
        document.getElementById('dividaLongoPrazo').textContent = this.formatCurrency(longoPrazo);
        document.getElementById('percentualCP').textContent = total > 0 ? `${((curtoPrazo/total)*100).toFixed(1)}%` : '0%';
        document.getElementById('percentualLP').textContent = total > 0 ? `${((longoPrazo/total)*100).toFixed(1)}%` : '0%';
        document.getElementById('numeroDividas').textContent = this.dividas.length;
        document.getElementById('totalDividas').innerHTML = `Total de dívidas cadastradas: <strong>${this.dividas.length}</strong>`;

        const emDia = this.dividas.filter(d => d.status === 'em_dia').length;
        const percentualEmDia = this.dividas.length > 0 ? ((emDia/this.dividas.length)*100).toFixed(0) : 0;
        document.getElementById('statusGeral').textContent = `${percentualEmDia}% em dia`;
    }

    parseCurrency(value) {
        if (typeof value === 'number') return value;
        return parseFloat(value.toString().replace(/[^\d,-]/g, '').replace(',', '.')) || 0;
    }

    formatCurrency(value) {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    }

    applyMasks(row) {
        // Aplicar máscaras de currency e percentage aos inputs
        const currencyInputs = row.querySelectorAll('[data-mask="currency"]');
        const percentageInputs = row.querySelectorAll('[data-mask="percentage"]');

        // Utilize as funções de máscara existentes no sistema
        if (window.Masks) {
            currencyInputs.forEach(input => window.Masks.applyCurrencyMask(input));
            percentageInputs.forEach(input => window.Masks.applyPercentageMask(input));
        }
    }

    saveToStorage() {
        localStorage.setItem('creditscore_dividas', JSON.stringify(this.dividas));
    }

    loadFromStorage() {
        const stored = localStorage.getItem('creditscore_dividas');
        if (stored) {
            const dividas = JSON.parse(stored);
            dividas.forEach(d => this.addDivida(d));
        }
    }

    getData() {
        return this.dividas;
    }
}

// Inicializar o gerenciador
let endividamentoManager;
document.addEventListener('DOMContentLoaded', () => {
    endividamentoManager = new EndividamentoManager();
});
```

## Integração no Sistema

1. **Adicione o script** no final do arquivo `analise-credito.html` antes do `</body>`:

```html
<script src="../assets/js/components/endividamento-manager.js"></script>
```

2. **CSS adicional** (adicione ao arquivo `creditscore-styles.css`):

```css
.endividamento-table {
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.endividamento-table th {
    font-weight: 600;
    font-size: 0.85rem;
    text-transform: uppercase;
}

.endividamento-table input,
.endividamento-table select {
    font-size: 0.9rem;
    transition: border-color 0.2s;
}

.endividamento-table input:focus,
.endividamento-table select:focus {
    outline: none;
    border-color: #FF002D !important;
    box-shadow: 0 0 0 2px rgba(255, 0, 45, 0.1);
}

.btn-delete:hover {
    background: #D32F2F !important;
    transform: scale(1.05);
}
```

Com esta implementação, você terá uma seção de endividamento totalmente funcional que permite adicionar múltiplas dívidas em formato tabular, com cálculo automático de resumos consolidados, persistência em localStorage e interface intuitiva.
