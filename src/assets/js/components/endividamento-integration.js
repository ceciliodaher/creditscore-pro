/* =====================================
   ENDIVIDAMENTO-INTEGRATION.JS
   Orquestrador do sistema de endividamento
   Integra EndividamentoManager + EndividamentoCalculator + ScoringEngine
   NO FALLBACKS - NO MOCK DATA - SOLID PRINCIPLES
   ===================================== */

class EndividamentoIntegration {
    constructor(config, messages, dbManager) {
        // Validação de dependências obrigatórias
        if (!config) {
            throw new Error('EndividamentoIntegration: config obrigatória');
        }
        if (!messages) {
            throw new Error('EndividamentoIntegration: messages obrigatória');
        }
        if (!dbManager) {
            throw new Error('EndividamentoIntegration: dbManager obrigatório');
        }

        this.config = config;
        this.messages = messages;
        this.dbManager = dbManager;

        // Componentes (serão inicializados no init)
        this.dividasManager = null;
        this.calculator = null;
    }

    /**
     * Inicializa todo o sistema de endividamento
     * Two-phase initialization
     */
    async init(empresaId = null) {
        // 1. Inicializar EndividamentoManager
        if (!window.EndividamentoManager) {
            throw new Error('EndividamentoIntegration: EndividamentoManager não carregado - obrigatório');
        }

        this.dividasManager = new EndividamentoManager(this.config, this.messages, this.dbManager);
        await this.dividasManager.init(empresaId);

        // 2. Inicializar EndividamentoCalculator
        if (!window.EndividamentoCalculator) {
            throw new Error('EndividamentoIntegration: EndividamentoCalculator não carregado - obrigatório');
        }

        this.calculator = new EndividamentoCalculator(this.config, this.messages);
        await this.calculator.init();

        // 3. Configurar listeners para recálculo automático
        this.setupCalculationTriggers();

        console.log('✓ EndividamentoIntegration inicializado');
        return true;
    }

    /**
     * Configura triggers para recálculo automático de índices
     */
    setupCalculationTriggers() {
        // Observar mudanças no EndividamentoManager
        const originalUpdateResumo = this.dividasManager.updateResumo.bind(this.dividasManager);

        this.dividasManager.updateResumo = () => {
            originalUpdateResumo();
            // Recalcular índices após atualizar resumo
            this.recalcularIndices();
        };
    }

    /**
     * Recalcula índices de endividamento
     * Requer dados do Balanço Patrimonial (Módulo 2)
     */
    async recalcularIndices() {
        try {
            // Obter dados do Balanço Patrimonial
            const dadosBalanco = await this.obterDadosBalanco();

            if (!dadosBalanco) {
                // Balanço não preenchido ainda - ocultar seção de índices
                this.ocultarSecaoIndices();
                return;
            }

            // Obter métricas das dívidas
            const metricasDividas = this.dividasManager.getMetricas();

            // Calcular índices
            const indices = await this.calculator.calcularIndices(dadosBalanco, {
                total: metricasDividas.total,
                curtoPrazo: metricasDividas.curtoPrazo,
                longoPrazo: metricasDividas.longoPrazo,
                dividas: this.dividasManager.getData()
            });

            // Renderizar índices
            this.renderizarIndices(indices);

            // Gerar e renderizar alertas
            const alertas = this.calculator.gerarAlertas(indices);
            this.renderizarAlertas(alertas);

            // Mostrar seção de índices
            this.mostrarSecaoIndices();

        } catch (error) {
            console.error('Erro ao recalcular índices:', error);

            // Se erro for por falta de dados do balanço, ocultar seção
            if (error.message.includes('Balanço Patrimonial incompletos')) {
                this.ocultarSecaoIndices();
            } else {
                // Outros erros: exibir na UI
                this.exibirErroCalculo(error.message);
            }
        }
    }

    /**
     * Obtém dados do Balanço Patrimonial do Módulo 2
     * @returns {Object|null}
     */
    async obterDadosBalanco() {
        // Tentar obter do localStorage (auto-save)
        const savedData = localStorage.getItem('creditscore_form_data');

        if (!savedData) {
            return null;
        }

        try {
            const formData = JSON.parse(savedData);

            // Verificar se módulo 2 (demonstracoes) está preenchido
            if (!formData.demonstracoes) {
                return null;
            }

            // Extrair dados do balanço mais recente (ano mais alto)
            const anos = Object.keys(formData.demonstracoes).filter(k => k.startsWith('ano'));

            if (anos.length === 0) {
                return null;
            }

            // Pegar o ano mais recente
            const anoRecente = anos.sort().reverse()[0];
            const dadosAno = formData.demonstracoes[anoRecente];

            if (!dadosAno || !dadosAno.balanco) {
                return null;
            }

            const balanco = dadosAno.balanco;

            // Retornar estrutura esperada
            return {
                passivoCirculante: parseFloat(balanco.passivoCirculante),
                passivoNaoCirculante: parseFloat(balanco.passivoNaoCirculante),
                patrimonioLiquido: parseFloat(balanco.patrimonioLiquido),
                ativoTotal: parseFloat(balanco.ativoTotal),
                ebitda: dadosAno.dre ? parseFloat(dadosAno.dre.ebitda) : null
            };

        } catch (error) {
            console.error('Erro ao obter dados do balanço:', error);
            return null;
        }
    }

    /**
     * Renderiza índices na tabela
     * @param {Object} indices - Índices calculados
     */
    renderizarIndices(indices) {
        const tbody = document.getElementById('indicesEndividamentoTableBody');

        if (!tbody) {
            console.warn('Elemento indicesEndividamentoTableBody não encontrado');
            return;
        }

        // Limpar conteúdo anterior
        tbody.innerHTML = '';

        // Formatar índices para exibição
        const indicesFormatados = this.calculator.formatarParaExibicao(indices);

        // Renderizar cada índice
        indicesFormatados.forEach(indice => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td style="font-weight: 500;">${indice.nome}</td>
                <td style="text-align: center; font-size: 1.1rem; font-weight: 600;">${indice.valor}</td>
                <td style="text-align: center;">
                    <span class="status-badge status-${indice.status}">${this.traduzirStatus(indice.status)}</span>
                </td>
                <td style="color: #666;">${indice.interpretacao}</td>
            `;
            tbody.appendChild(row);
        });
    }

    /**
     * Renderiza alertas
     * @param {Array} alertas - Lista de alertas
     */
    renderizarAlertas(alertas) {
        const container = document.getElementById('alertasEndividamento');

        if (!container) {
            console.warn('Elemento alertasEndividamento não encontrado');
            return;
        }

        // Limpar alertas anteriores
        container.innerHTML = '';

        if (!alertas || alertas.length === 0) {
            return;
        }

        // Renderizar cada alerta
        alertas.forEach(alerta => {
            const alertaDiv = document.createElement('div');
            alertaDiv.className = `alerta-endividamento alerta-${alerta.tipo}`;

            const icon = alerta.tipo === 'critico' ? '🔴' : (alerta.tipo === 'atencao' ? '⚠️' : 'ℹ️');

            alertaDiv.innerHTML = `
                <div class="alerta-endividamento-icon">${icon}</div>
                <div class="alerta-endividamento-content">
                    <div class="alerta-endividamento-titulo">${this.traduzirTipoAlerta(alerta.tipo)}</div>
                    <div class="alerta-endividamento-mensagem">${alerta.mensagem}</div>
                    ${alerta.recomendacao ? `<div class="alerta-endividamento-recomendacao">💡 ${alerta.recomendacao}</div>` : ''}
                </div>
            `;

            container.appendChild(alertaDiv);
        });
    }

    /**
     * Mostra seção de índices
     */
    mostrarSecaoIndices() {
        const section = document.getElementById('indicesEndividamentoSection');
        if (section) {
            section.style.display = 'block';
        }
    }

    /**
     * Oculta seção de índices
     */
    ocultarSecaoIndices() {
        const section = document.getElementById('indicesEndividamentoSection');
        if (section) {
            section.style.display = 'none';
        }
    }

    /**
     * Exibe erro de cálculo na UI
     * @param {string} mensagem - Mensagem de erro
     */
    exibirErroCalculo(mensagem) {
        const container = document.getElementById('alertasEndividamento');
        if (!container) return;

        container.innerHTML = `
            <div class="alerta-endividamento alerta-atencao">
                <div class="alerta-endividamento-icon">⚠️</div>
                <div class="alerta-endividamento-content">
                    <div class="alerta-endividamento-titulo">Erro ao Calcular Índices</div>
                    <div class="alerta-endividamento-mensagem">${mensagem}</div>
                </div>
            </div>
        `;

        this.mostrarSecaoIndices();
    }

    /**
     * Traduz status para português
     * @param {string} status - Status em inglês
     * @returns {string}
     */
    traduzirStatus(status) {
        const traducoes = {
            'excelente': 'Excelente',
            'bom': 'Bom',
            'adequado': 'Adequado',
            'baixo': 'Baixo',
            'critico': 'Crítico',
            'indefinido': 'Indefinido'
        };

        return traducoes[status] || status;
    }

    /**
     * Traduz tipo de alerta para português
     * @param {string} tipo - Tipo de alerta
     * @returns {string}
     */
    traduzirTipoAlerta(tipo) {
        const traducoes = {
            'critico': 'Alerta Crítico',
            'atencao': 'Atenção',
            'informativo': 'Informação'
        };

        return traducoes[tipo] || tipo;
    }

    /**
     * Retorna dados formatados para ScoringEngine
     * Integração com o sistema de pontuação
     * @returns {Object}
     */
    getDadosParaScoring() {
        const metricas = this.dividasManager.getMetricas();

        return {
            dividaTotal: metricas.total,
            dividaCurtoPrazo: metricas.curtoPrazo,
            dividaLongoPrazo: metricas.longoPrazo,
            percentualCurtoPrazo: metricas.percentualCP,
            percentualLongoPrazo: metricas.percentualLP,
            numeroDividas: metricas.numeroDividas,
            statusCounts: metricas.statusCounts,
            percentualEmDia: metricas.percentualEmDia,
            dividas: this.dividasManager.getData()
        };
    }

    /**
     * Salva dados no IndexedDB
     */
    async salvar() {
        await this.dividasManager.saveToIndexedDB();
    }

    /**
     * Força recálculo manual dos índices
     * Útil para debugging ou recálculo após mudanças no Módulo 2
     */
    async forcarRecalculo() {
        await this.recalcularIndices();
    }
}

// Exportar como ES6 module
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { EndividamentoIntegration };
}

// Exportar para uso global (retrocompatibilidade)
if (typeof window !== 'undefined') {
    window.EndividamentoIntegration = EndividamentoIntegration;
}

console.log('✅ EndividamentoIntegration carregado');
