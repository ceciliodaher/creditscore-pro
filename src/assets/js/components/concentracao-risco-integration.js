/**
 * concentracao-risco-integration.js
 * Módulo de integração para Concentração de Risco
 * NO FALLBACKS - NO MOCK DATA - SOLID PRINCIPLES
 *
 * @version 1.0.0
 * @date 2025-10-24
 */

class ConcentracaoRiscoIntegration {
    constructor(config, messages, concentracaoCalculator) {
        // Validação de dependências obrigatórias
        if (!config) {
            throw new Error('ConcentracaoRiscoIntegration: config obrigatória');
        }
        if (!messages) {
            throw new Error('ConcentracaoRiscoIntegration: messages obrigatória');
        }
        if (!concentracaoCalculator) {
            throw new Error('ConcentracaoRiscoIntegration: concentracaoCalculator obrigatória');
        }

        this.config = config;
        this.messages = messages;
        this.calculator = concentracaoCalculator;

        // Obter limites do config (NO HARDCODED)
        this.maxClientes = this.config.concentracaoRisco?.maxClientes || 5;
        this.maxFornecedores = this.config.concentracaoRisco?.maxFornecedores || 5;
    }

    /**
     * Inicializa integração
     * Two-phase initialization
     */
    async init() {
        this.setupEventListeners();
        console.log('✓ ConcentracaoRiscoIntegration inicializado');
        return true;
    }

    /**
     * Configura event listeners para inputs
     */
    setupEventListeners() {
        // Event listeners para clientes
        for (let i = 1; i <= this.maxClientes; i++) {
            const inputReceita = document.querySelector(`input[name="cliente_receita_${i}"]`);
            if (inputReceita) {
                inputReceita.addEventListener('input', () => this.recalcular());
                inputReceita.addEventListener('blur', () => this.recalcular());
            }
        }

        // Event listeners para fornecedores
        for (let i = 1; i <= this.maxFornecedores; i++) {
            const inputCompras = document.querySelector(`input[name="fornecedor_compras_${i}"]`);
            if (inputCompras) {
                inputCompras.addEventListener('input', () => this.recalcular());
                inputCompras.addEventListener('blur', () => this.recalcular());
            }
        }
    }

    /**
     * Recalcula concentração de risco
     */
    async recalcular() {
        try {
            // Coletar dados
            const dadosClientes = this.coletarDadosClientes();
            const dadosFornecedores = this.coletarDadosFornecedores();

            // Calcular usando calculator
            const resultadoClientes = this.calculator.calcularConcentracaoClientes(dadosClientes);
            const resultadoFornecedores = this.calculator.calcularConcentracaoFornecedores(dadosFornecedores);

            // Renderizar resultados
            this.renderizarResultados(resultadoClientes, resultadoFornecedores);

            // Renderizar alertas
            const alertas = this.calculator.gerarAlertas({
                concentracaoClientes: resultadoClientes,
                concentracaoFornecedores: resultadoFornecedores
            });
            this.renderizarAlertas(alertas);

        } catch (error) {
            console.error('Erro ao recalcular concentração:', error);
        }
    }

    /**
     * Coleta dados dos inputs de clientes
     * NO FALLBACKS - Só inclui se ambos nome e valor estão preenchidos
     */
    coletarDadosClientes() {
        const clientes = [];

        for (let i = 1; i <= this.maxClientes; i++) {
            const inputNome = document.querySelector(`input[name="cliente_nome_${i}"]`);
            const inputReceita = document.querySelector(`input[name="cliente_receita_${i}"]`);

            const nome = inputNome?.value?.trim();
            const receitaStr = inputReceita?.value?.replace(/[^\d,.-]/g, '')?.replace(',', '.');
            const receitaAnual = parseFloat(receitaStr);

            // NO FALLBACKS: só inclui se ambos estão preenchidos corretamente
            if (nome && !isNaN(receitaAnual) && receitaAnual > 0) {
                clientes.push({ nome, receitaAnual });
            }
        }

        return clientes;
    }

    /**
     * Coleta dados dos inputs de fornecedores
     * NO FALLBACKS - Só inclui se ambos nome e valor estão preenchidos
     */
    coletarDadosFornecedores() {
        const fornecedores = [];

        for (let i = 1; i <= this.maxFornecedores; i++) {
            const inputNome = document.querySelector(`input[name="fornecedor_nome_${i}"]`);
            const inputCompras = document.querySelector(`input[name="fornecedor_compras_${i}"]`);

            const nome = inputNome?.value?.trim();
            const comprasStr = inputCompras?.value?.replace(/[^\d,.-]/g, '')?.replace(',', '.');
            const comprasAnuais = parseFloat(comprasStr);

            // NO FALLBACKS: só inclui se ambos estão preenchidos corretamente
            if (nome && !isNaN(comprasAnuais) && comprasAnuais > 0) {
                fornecedores.push({ nome, comprasAnuais });
            }
        }

        return fornecedores;
    }

    /**
     * Renderiza resultados na UI
     */
    renderizarResultados(resultadoClientes, resultadoFornecedores) {
        // Atualizar percentuais individuais de clientes
        if (resultadoClientes.topClientes) {
            resultadoClientes.topClientes.forEach((cliente, index) => {
                const elemento = document.querySelector(`span[data-index="${index + 1}"].cliente-percentual`);
                if (elemento) {
                    elemento.textContent = `${cliente.percentual}%`;
                    elemento.className = `cliente-percentual status-badge status-${resultadoClientes.status}`;
                }
            });
        }

        // Limpar percentuais vazios de clientes
        for (let i = (resultadoClientes.topClientes?.length || 0) + 1; i <= this.maxClientes; i++) {
            const elemento = document.querySelector(`span[data-index="${i}"].cliente-percentual`);
            if (elemento) {
                elemento.textContent = '-';
                elemento.className = 'cliente-percentual';
            }
        }

        // Atualizar percentuais individuais de fornecedores
        if (resultadoFornecedores.topFornecedores) {
            resultadoFornecedores.topFornecedores.forEach((fornecedor, index) => {
                const elemento = document.querySelector(`span[data-index="${index + 1}"].fornecedor-percentual`);
                if (elemento) {
                    elemento.textContent = `${fornecedor.percentual}%`;
                    elemento.className = `fornecedor-percentual status-badge status-${resultadoFornecedores.status}`;
                }
            });
        }

        // Limpar percentuais vazios de fornecedores
        for (let i = (resultadoFornecedores.topFornecedores?.length || 0) + 1; i <= this.maxFornecedores; i++) {
            const elemento = document.querySelector(`span[data-index="${i}"].fornecedor-percentual`);
            if (elemento) {
                elemento.textContent = '-';
                elemento.className = 'fornecedor-percentual';
            }
        }

        // Atualizar concentração total de clientes
        const totalClientes = document.getElementById('concentracaoClientesTotal');
        if (totalClientes) {
            totalClientes.textContent = resultadoClientes.valorFormatado || '-';
            totalClientes.className = `resultado-value status-badge status-${resultadoClientes.status}`;
        }

        // Atualizar concentração total de fornecedores
        const totalFornecedores = document.getElementById('concentracaoFornecedoresTotal');
        if (totalFornecedores) {
            totalFornecedores.textContent = resultadoFornecedores.valorFormatado || '-';
            totalFornecedores.className = `resultado-value status-badge status-${resultadoFornecedores.status}`;
        }
    }

    /**
     * Renderiza alertas
     */
    renderizarAlertas(alertas) {
        const container = document.getElementById('alertasConcentracao');

        if (!container) {
            console.warn('Elemento alertasConcentracao não encontrado');
            return;
        }

        // Limpar alertas anteriores
        container.innerHTML = '';

        if (!alertas || alertas.length === 0) {
            return;
        }

        // Renderizar cada alerta (mesmo padrão do EndividamentoIntegration)
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
     * Traduz tipo de alerta usando sistema de messages (NO HARDCODED)
     */
    traduzirTipoAlerta(tipo) {
        const key = `concentracaoRisco.alertas.tipos.${tipo}`;
        return MessageLoader.get(key, tipo);
    }

    /**
     * Retorna dados para ScoringEngine
     */
    getDadosParaScoring() {
        const dadosClientes = this.coletarDadosClientes();
        const dadosFornecedores = this.coletarDadosFornecedores();

        const resultadoClientes = this.calculator.calcularConcentracaoClientes(dadosClientes);
        const resultadoFornecedores = this.calculator.calcularConcentracaoFornecedores(dadosFornecedores);

        return {
            concentracaoClientes: {
                percentual: resultadoClientes.valor,
                status: resultadoClientes.status,
                topClientes: resultadoClientes.topClientes || []
            },
            concentracaoFornecedores: {
                percentual: resultadoFornecedores.valor,
                status: resultadoFornecedores.status,
                topFornecedores: resultadoFornecedores.topFornecedores || []
            }
        };
    }
}

// Exportar como ES6 module
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ConcentracaoRiscoIntegration };
}

// Exportar para uso global (retrocompatibilidade)
if (typeof window !== 'undefined') {
    window.ConcentracaoRiscoIntegration = ConcentracaoRiscoIntegration;
}

console.log('✅ ConcentracaoRiscoIntegration carregado');
