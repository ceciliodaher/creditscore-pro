/**
 * analises-renderer.js
 * Renderizador de Análises Financeiras (AH, AV, Indicadores, Gráficos)
 *
 * Responsável por renderizar visualmente as análises calculadas pelos
 * calculadores de Balanço e DRE no DOM.
 *
 * Princípios:
 * - Separation of Concerns: Calculadores calculam, Renderer renderiza
 * - NO FALLBACKS: Se dados vazios, mostrar empty state
 * - Reusable: Mesma estrutura para Balanço e DRE
 * - HTML limpo e semântico
 *
 * @version 1.0.0
 * @date 2025-10-28
 */

class AnalisesRenderer {
    constructor() {
        console.log('🎨 AnalisesRenderer inicializado');
    }

    /**
     * Renderiza todas as análises (AH, AV, Indicadores)
     * @param {string} tipo - 'balanco' ou 'dre'
     * @param {Object} analises - Objeto com { ah, av, indicadores }
     */
    renderAnalises(tipo, analises) {
        if (!analises || (!analises.ah && !analises.av && !analises.indicadores)) {
            this.showEmptyState(tipo);
            return;
        }

        // Renderizar cada tipo de análise
        if (analises.ah) {
            this.renderAnaliseHorizontal(tipo, analises.ah);
        }

        if (analises.av) {
            this.renderAnaliseVertical(tipo, analises.av);
        }

        if (analises.indicadores) {
            this.renderIndicadores(tipo, analises.indicadores);
        }

        console.log(`✅ Análises de ${tipo} renderizadas`);
    }

    /**
     * Renderiza Análise Horizontal
     * @param {string} tipo - 'balanco' ou 'dre'
     * @param {Object} ah - Dados da análise horizontal
     */
    renderAnaliseHorizontal(tipo, ah) {
        const containerId = tipo === 'balanco' ? 'tabelaAnaliseHorizontalBalanco' : 'tabelaAnaliseHorizontalDRE';
        const container = document.getElementById(containerId);

        if (!container) {
            console.warn(`Container ${containerId} não encontrado`);
            return;
        }

        // Construir HTML da tabela
        let html = `
            <div class="analise-horizontal-wrapper">
                <h3>${tipo === 'balanco' ? '📊 Análise Horizontal - Balanço Patrimonial' : '📈 Análise Horizontal - DRE'}</h3>
                <table class="table-analise-horizontal">
                    <thead>
                        <tr>
                            <th>Conta</th>
                            <th>Var P1→P2</th>
                            <th>Var P2→P3</th>
                            <th>Var P3→P4</th>
                            <th>CAGR (2 anos)</th>
                            <th>Tendência</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        // Iterar sobre as contas com análise horizontal
        if (ah.variacoes) {
            for (const [conta, dados] of Object.entries(ah.variacoes)) {
                const var12 = this.formatarVariacao(dados.p1_p2);
                const var23 = this.formatarVariacao(dados.p2_p3);
                const var34 = this.formatarVariacao(dados.p3_p4);
                const cagr = this.formatarVariacao(dados.cagr);
                const tendencia = this.getTendenciaEmoji(dados.tendencia);

                html += `
                    <tr>
                        <td class="conta-nome">${this.formatarNomeConta(conta)}</td>
                        <td class="valor-variacao ${this.getClasseVariacao(dados.p1_p2)}">${var12}</td>
                        <td class="valor-variacao ${this.getClasseVariacao(dados.p2_p3)}">${var23}</td>
                        <td class="valor-variacao ${this.getClasseVariacao(dados.p3_p4)}">${var34}</td>
                        <td class="valor-cagr ${this.getClasseVariacao(dados.cagr)}">${cagr}</td>
                        <td class="tendencia">${tendencia}</td>
                    </tr>
                `;
            }
        }

        html += `
                    </tbody>
                </table>
            </div>
        `;

        container.innerHTML = html;
    }

    /**
     * Renderiza Análise Vertical
     * @param {string} tipo - 'balanco' ou 'dre'
     * @param {Object} av - Dados da análise vertical
     */
    renderAnaliseVertical(tipo, av) {
        const containerId = tipo === 'balanco' ? 'tabelaAnaliseVerticalBalanco' : 'tabelaAnaliseVerticalDRE';
        const container = document.getElementById(containerId);

        if (!container) {
            console.warn(`Container ${containerId} não encontrado`);
            return;
        }

        const base = tipo === 'balanco' ? 'Ativo Total' : 'Receita Líquida';

        let html = `
            <div class="analise-vertical-wrapper">
                <h3>${tipo === 'balanco' ? '📊 Análise Vertical - Balanço Patrimonial' : '📈 Análise Vertical - DRE'}</h3>
                <p class="base-calculo">Base de cálculo: ${base} = 100%</p>
                <table class="table-analise-vertical">
                    <thead>
                        <tr>
                            <th>Conta</th>
                            <th>Período 1 (%)</th>
                            <th>Período 2 (%)</th>
                            <th>Período 3 (%)</th>
                            <th>Período 4 (%)</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        // Iterar sobre as contas com análise vertical
        if (av.percentuais) {
            for (const [conta, percentuais] of Object.entries(av.percentuais)) {
                html += `
                    <tr>
                        <td class="conta-nome">${this.formatarNomeConta(conta)}</td>
                        <td class="valor-percentual">${this.formatarPercentual(percentuais.p1)}</td>
                        <td class="valor-percentual">${this.formatarPercentual(percentuais.p2)}</td>
                        <td class="valor-percentual">${this.formatarPercentual(percentuais.p3)}</td>
                        <td class="valor-percentual">${this.formatarPercentual(percentuais.p4)}</td>
                    </tr>
                `;
            }
        }

        html += `
                    </tbody>
                </table>
            </div>
        `;

        container.innerHTML = html;
    }

    /**
     * Renderiza Indicadores Financeiros
     * @param {string} tipo - 'balanco' ou 'dre'
     * @param {Array} indicadores - Array de indicadores calculados
     */
    renderIndicadores(tipo, indicadores) {
        const containerId = tipo === 'balanco' ? 'tabelaIndicadoresBalanco' : 'tabelaIndicadoresDRE';
        const container = document.getElementById(containerId);

        if (!container) {
            console.warn(`Container ${containerId} não encontrado`);
            return;
        }

        let html = `
            <div class="indicadores-wrapper">
                <h3>${tipo === 'balanco' ? '📊 Indicadores - Balanço Patrimonial' : '📈 Indicadores - DRE'}</h3>
                <div class="indicadores-grid">
        `;

        // Agrupar indicadores por categoria
        const grupos = this.agruparIndicadores(indicadores);

        for (const [categoria, inds] of Object.entries(grupos)) {
            html += `
                <div class="indicadores-categoria">
                    <h4>${categoria}</h4>
                    <div class="indicadores-cards">
            `;

            inds.forEach(ind => {
                const statusClass = this.getClasseStatus(ind.status);
                const emoji = ind.emoji || this.getEmojiStatus(ind.status);

                html += `
                    <div class="indicador-card ${statusClass}">
                        <div class="indicador-header">
                            <span class="indicador-emoji">${emoji}</span>
                            <span class="indicador-nome">${ind.nome}</span>
                        </div>
                        <div class="indicador-valor">${this.formatarValorIndicador(ind.valor, ind.tipo)}</div>
                        <div class="indicador-status">${ind.status}</div>
                        ${ind.descricao ? `<div class="indicador-descricao">${ind.descricao}</div>` : ''}
                    </div>
                `;
            });

            html += `
                    </div>
                </div>
            `;
        }

        html += `
                </div>
            </div>
        `;

        container.innerHTML = html;
    }

    /**
     * Mostra estado vazio (aguardando dados)
     * @param {string} tipo - 'balanco' ou 'dre'
     */
    showEmptyState(tipo) {
        const mensagem = `
            <div class="empty-state">
                <span class="empty-icon">⏳</span>
                <p>Aguardando preenchimento dos demonstrativos financeiros...</p>
                <small>Preencha ao menos 2 períodos para visualizar as análises</small>
            </div>
        `;

        // Aplicar em todos os containers
        const containers = [
            `tabelaAnaliseHorizontal${tipo === 'balanco' ? 'Balanco' : 'DRE'}`,
            `tabelaAnaliseVertical${tipo === 'balanco' ? 'Balanco' : 'DRE'}`,
            `tabelaIndicadores${tipo === 'balanco' ? 'Balanco' : 'DRE'}`
        ];

        containers.forEach(containerId => {
            const container = document.getElementById(containerId);
            if (container) {
                container.innerHTML = mensagem;
            }
        });
    }

    /**
     * Mostra mensagem de erro
     * @param {string} tipo - 'balanco' ou 'dre'
     * @param {string} mensagemErro - Mensagem de erro
     */
    showError(tipo, mensagemErro) {
        const html = `
            <div class="error-state">
                <span class="error-icon">⚠️</span>
                <p>Erro ao calcular análises</p>
                <small>${mensagemErro}</small>
            </div>
        `;

        const containers = [
            `tabelaAnaliseHorizontal${tipo === 'balanco' ? 'Balanco' : 'DRE'}`,
            `tabelaAnaliseVertical${tipo === 'balanco' ? 'Balanco' : 'DRE'}`,
            `tabelaIndicadores${tipo === 'balanco' ? 'Balanco' : 'DRE'}`
        ];

        containers.forEach(containerId => {
            const container = document.getElementById(containerId);
            if (container) {
                container.innerHTML = html;
            }
        });
    }

    // ====================================================================
    // HELPERS DE FORMATAÇÃO
    // ====================================================================

    /**
     * Formata variação percentual
     * @param {number} valor - Valor da variação (0.15 = 15%)
     * @returns {string} Valor formatado
     */
    formatarVariacao(valor) {
        if (valor === null || valor === undefined || isNaN(valor)) {
            return '—';
        }

        const percentual = valor * 100;
        const sinal = percentual > 0 ? '+' : '';
        return `${sinal}${percentual.toFixed(2)}%`;
    }

    /**
     * Formata percentual simples
     * @param {number} valor - Valor percentual (15 = 15%)
     * @returns {string} Valor formatado
     */
    formatarPercentual(valor) {
        if (valor === null || valor === undefined || isNaN(valor)) {
            return '—';
        }

        return `${valor.toFixed(2)}%`;
    }

    /**
     * Formata valor de indicador conforme tipo
     * @param {number} valor - Valor do indicador
     * @param {string} tipo - Tipo do indicador ('ratio', 'percentual', 'monetario')
     * @returns {string} Valor formatado
     */
    formatarValorIndicador(valor, tipo) {
        if (valor === null || valor === undefined || isNaN(valor)) {
            return '—';
        }

        switch (tipo) {
            case 'percentual':
                return `${valor.toFixed(2)}%`;
            case 'monetario':
                return new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                }).format(valor);
            case 'ratio':
            default:
                return valor.toFixed(2);
        }
    }

    /**
     * Formata nome de conta (snake_case → Title Case)
     * @param {string} conta - Nome da conta em snake_case
     * @returns {string} Nome formatado
     */
    formatarNomeConta(conta) {
        return conta
            .replace(/_/g, ' ')
            .replace(/\b\w/g, l => l.toUpperCase());
    }

    /**
     * Retorna classe CSS para variação
     * @param {number} valor - Valor da variação
     * @returns {string} Classe CSS
     */
    getClasseVariacao(valor) {
        if (valor === null || valor === undefined || isNaN(valor)) {
            return '';
        }

        if (valor > 0.1) return 'positivo';
        if (valor < -0.1) return 'negativo';
        return 'neutro';
    }

    /**
     * Retorna classe CSS para status de indicador
     * @param {string} status - Status do indicador
     * @returns {string} Classe CSS
     */
    getClasseStatus(status) {
        const statusLower = (status || '').toLowerCase();

        if (statusLower.includes('bom') || statusLower.includes('saudável')) {
            return 'status-bom';
        }
        if (statusLower.includes('atenção') || statusLower.includes('moderado')) {
            return 'status-atencao';
        }
        if (statusLower.includes('crítico') || statusLower.includes('ruim')) {
            return 'status-critico';
        }

        return '';
    }

    /**
     * Retorna emoji para tendência
     * @param {string} tendencia - Tendência ('crescente', 'decrescente', 'estável')
     * @returns {string} Emoji
     */
    getTendenciaEmoji(tendencia) {
        const tendenciaLower = (tendencia || '').toLowerCase();

        if (tendenciaLower.includes('crescente') || tendenciaLower.includes('alta')) {
            return '📈';
        }
        if (tendenciaLower.includes('decrescente') || tendenciaLower.includes('queda')) {
            return '📉';
        }
        if (tendenciaLower.includes('estável') || tendenciaLower.includes('constante')) {
            return '➡️';
        }

        return '—';
    }

    /**
     * Retorna emoji para status
     * @param {string} status - Status do indicador
     * @returns {string} Emoji
     */
    getEmojiStatus(status) {
        const statusLower = (status || '').toLowerCase();

        if (statusLower.includes('bom') || statusLower.includes('saudável')) {
            return '🟢';
        }
        if (statusLower.includes('atenção') || statusLower.includes('moderado')) {
            return '🟡';
        }
        if (statusLower.includes('crítico') || statusLower.includes('ruim')) {
            return '🔴';
        }

        return '⚪';
    }

    /**
     * Agrupa indicadores por categoria
     * @param {Array} indicadores - Array de indicadores
     * @returns {Object} Indicadores agrupados
     */
    agruparIndicadores(indicadores) {
        const grupos = {};

        indicadores.forEach(ind => {
            const categoria = ind.categoria || 'Outros';

            if (!grupos[categoria]) {
                grupos[categoria] = [];
            }

            grupos[categoria].push(ind);
        });

        return grupos;
    }
}

// ====================================================================
// Inicialização
// ====================================================================

// Disponibilizar globalmente
if (typeof window !== 'undefined') {
    window.AnalisesRenderer = AnalisesRenderer;
}

// Export para ES6 modules
export default AnalisesRenderer;
