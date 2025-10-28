/**
 * AnalysisRenderer
 *
 * Renderizador 100% dinâmico de análises financeiras.
 * NÃO possui templates hardcoded - tudo é gerado dinamicamente.
 * NÃO possui thresholds hardcoded - carrega de config JSON.
 *
 * Arquitetura:
 * - Inspecciona estruturas de dados recebidas
 * - Gera HTML semântico com Tailwind CSS
 * - Suporta qualquer estrutura de resultado dos calculadores
 * - Emoji classification automática via config
 * - DocumentFragment para performance
 * - Config-driven styling (analysis-renderer-config.json)
 *
 * @version 1.0.0
 * @date 2025-10-28
 */

export class AnalysisRenderer {
    /**
     * Configuração carregada do JSON
     * @private
     */
    static #config = null;

    /**
     * Carrega configuração do arquivo JSON
     * @param {string} configPath - Caminho do arquivo de configuração
     * @throws {Error} Se config não disponível
     */
    static async carregarConfig(configPath = '/config/analysis-renderer-config.json') {
        try {
            const response = await fetch(configPath);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            this.#config = await response.json();
            console.log('[AnalysisRenderer] ✅ Config carregada');
        } catch (error) {
            throw new Error(
                `AnalysisRenderer: Config obrigatória não disponível em ${configPath} - ${error.message}`
            );
        }
    }

    /**
     * Valida se config foi carregada
     * @private
     * @throws {Error} Se config não disponível
     */
    static #validarConfig() {
        if (!this.#config) {
            throw new Error(
                'AnalysisRenderer: Config não carregada - execute carregarConfig() primeiro'
            );
        }
    }

    /**
     * Renderiza resultados de Análise Horizontal
     * @param {Object} resultado - Resultado do AnaliseHorizontalCalculator
     * @param {string} containerId - ID do container HTML onde renderizar
     */
    static renderAnaliseHorizontal(resultado, containerId = 'ah-results') {
        this.#validarConfig();
        console.log('[AnalysisRenderer] Renderizando Análise Horizontal...');

        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`[AnalysisRenderer] Container #${containerId} não encontrado`);
            return;
        }

        // Limpar container
        container.innerHTML = '';

        // Criar estrutura dinâmica
        const fragment = document.createDocumentFragment();

        // SEÇÃO 1: Alertas (se houver)
        if (resultado.alertas && resultado.alertas.length > 0) {
            const alertasSection = this.#criarSecaoAlertas(resultado.alertas);
            fragment.appendChild(alertasSection);
        }

        // SEÇÃO 2: Variações por Período
        if (resultado.variacoesPeriodos) {
            const variacoesSection = this.#criarSecaoVariacoes(resultado.variacoesPeriodos);
            fragment.appendChild(variacoesSection);
        }

        // SEÇÃO 3: CAGR (Taxa Composta)
        if (resultado.cagr) {
            const cagrSection = this.#criarSecaoCAGR(resultado.cagr);
            fragment.appendChild(cagrSection);
        }

        // SEÇÃO 4: Tendências
        if (resultado.tendencias) {
            const tendenciasSection = this.#criarSecaoTendencias(resultado.tendencias);
            fragment.appendChild(tendenciasSection);
        }

        // Inserir no DOM
        container.appendChild(fragment);
        console.log('[AnalysisRenderer] ✅ Análise Horizontal renderizada');
    }

    /**
     * Renderiza resultados de Análise Vertical
     * @param {Object} resultado - Resultado do AnaliseVerticalCalculator
     * @param {string} containerId - ID do container HTML onde renderizar
     */
    static renderAnaliseVertical(resultado, containerId = 'av-results') {
        this.#validarConfig();
        console.log('[AnalysisRenderer] Renderizando Análise Vertical...');

        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`[AnalysisRenderer] Container #${containerId} não encontrado`);
            return;
        }

        // Limpar container
        container.innerHTML = '';

        const fragment = document.createDocumentFragment();

        // Cabeçalho com base
        if (resultado.base) {
            const baseInfo = document.createElement('div');
            baseInfo.className = 'mb-4 p-4 bg-blue-50 border-l-4 border-blue-500 rounded';
            baseInfo.innerHTML = `
                <p class="text-sm font-semibold text-blue-900">
                    Base de Cálculo: ${resultado.base.label}
                </p>
                <p class="text-xs text-blue-700">
                    Valor: R$ ${this.#formatarValor(resultado.base.valor)}
                </p>
            `;
            fragment.appendChild(baseInfo);
        }

        // SEÇÃO 1: Alertas (se houver)
        if (resultado.alertas && resultado.alertas.length > 0) {
            const alertasSection = this.#criarSecaoAlertas(resultado.alertas);
            fragment.appendChild(alertasSection);
        }

        // SEÇÃO 2: Concentrações
        if (resultado.concentracoes && resultado.concentracoes.length > 0) {
            const concentracoesSection = this.#criarSecaoConcentracoes(resultado.concentracoes);
            fragment.appendChild(concentracoesSection);
        }

        // SEÇÃO 3: Percentuais (Top 10)
        if (resultado.percentuais) {
            const percentuaisSection = this.#criarSecaoPercentuais(resultado.percentuais);
            fragment.appendChild(percentuaisSection);
        }

        // SEÇÃO 4: Validações Hierárquicas
        if (resultado.validacoes && resultado.validacoes.length > 0) {
            const validacoesSection = this.#criarSecaoValidacoes(resultado.validacoes);
            fragment.appendChild(validacoesSection);
        }

        container.appendChild(fragment);
        console.log('[AnalysisRenderer] ✅ Análise Vertical renderizada');
    }

    /**
     * Renderiza resultados de Indicadores Financeiros
     * @param {Object} resultado - Resultado do IndicadoresCalculator
     * @param {string} containerIdPrefix - Prefixo dos containers (ex: 'indicadores')
     */
    static renderIndicadores(resultado, containerIdPrefix = 'indicadores') {
        this.#validarConfig();
        console.log('[AnalysisRenderer] Renderizando Indicadores...');

        // Agrupar indicadores dinamicamente por categoria
        const indicadoresPorCategoria = this.#agruparPorCategoria(resultado);

        // Renderizar cada categoria
        Object.entries(indicadoresPorCategoria).forEach(([categoria, indicadores]) => {
            const containerId = `${containerIdPrefix}-${categoria}`;
            const gridContainer = document.querySelector(`#${containerId} .indicadores-grid`);

            if (!gridContainer) {
                console.warn(`[AnalysisRenderer] Grid #${containerId} .indicadores-grid não encontrado`);
                return;
            }

            // Limpar grid
            gridContainer.innerHTML = '';

            // Criar cards de indicadores
            const fragment = document.createDocumentFragment();
            indicadores.forEach(ind => {
                const card = this.#criarCardIndicador(ind);
                fragment.appendChild(card);
            });

            gridContainer.appendChild(fragment);
        });

        console.log('[AnalysisRenderer] ✅ Indicadores renderizados');
    }

    // ====================================================================
    // Seções - Análise Horizontal
    // ====================================================================

    /**
     * Cria seção de variações entre períodos
     * @private
     */
    static #criarSecaoVariacoes(variacoesPeriodos) {
        const section = document.createElement('div');
        section.className = 'mb-6';

        const title = document.createElement('h5');
        title.className = 'text-lg font-semibold text-gray-800 mb-3';
        title.textContent = '📊 Variações entre Períodos';
        section.appendChild(title);

        const table = this.#criarTabelaVariacoes(variacoesPeriodos);
        section.appendChild(table);

        return section;
    }

    /**
     * Cria tabela de variações
     * @private
     */
    static #criarTabelaVariacoes(variacoesPeriodos) {
        const tableContainer = document.createElement('div');
        tableContainer.className = 'overflow-x-auto';

        const table = document.createElement('table');
        table.className = 'min-w-full divide-y divide-gray-200 border border-gray-300 rounded-lg';

        // Header
        const thead = document.createElement('thead');
        thead.className = 'bg-gray-100';
        thead.innerHTML = `
            <tr>
                <th class="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase">Conta</th>
                <th class="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase">Período</th>
                <th class="px-4 py-2 text-right text-xs font-semibold text-gray-700 uppercase">Valor Anterior</th>
                <th class="px-4 py-2 text-right text-xs font-semibold text-gray-700 uppercase">Valor Atual</th>
                <th class="px-4 py-2 text-right text-xs font-semibold text-gray-700 uppercase">Variação %</th>
                <th class="px-4 py-2 text-right text-xs font-semibold text-gray-700 uppercase">Variação Abs.</th>
            </tr>
        `;
        table.appendChild(thead);

        // Body
        const tbody = document.createElement('tbody');
        tbody.className = 'bg-white divide-y divide-gray-200';

        Object.entries(variacoesPeriodos).forEach(([conta, variacoes]) => {
            variacoes.forEach((v, idx) => {
                const tr = document.createElement('tr');
                tr.className = idx % 2 === 0 ? 'bg-white' : 'bg-gray-50';

                const variacaoPercent = (v.variacao * 100).toFixed(1);
                const emoji = this.#getEmojiVariacao(v.variacao);
                const classeVariacao = this.#getClasseVariacao(v.variacao);

                tr.innerHTML = `
                    <td class="px-4 py-2 text-sm font-medium text-gray-900">${this.#formatarNomeConta(conta)}</td>
                    <td class="px-4 py-2 text-sm text-gray-700">${v.periodo}</td>
                    <td class="px-4 py-2 text-sm text-right text-gray-700">${this.#formatarValor(v.valorAnterior)}</td>
                    <td class="px-4 py-2 text-sm text-right text-gray-700">${this.#formatarValor(v.valorAtual)}</td>
                    <td class="px-4 py-2 text-sm text-right font-semibold ${classeVariacao}">
                        ${emoji} ${variacaoPercent}%
                    </td>
                    <td class="px-4 py-2 text-sm text-right text-gray-700">${this.#formatarValor(v.variacaoAbsoluta)}</td>
                `;

                tbody.appendChild(tr);
            });
        });

        table.appendChild(tbody);
        tableContainer.appendChild(table);

        return tableContainer;
    }

    /**
     * Cria seção CAGR
     * @private
     */
    static #criarSecaoCAGR(cagr) {
        const section = document.createElement('div');
        section.className = 'mb-6';

        const title = document.createElement('h5');
        title.className = 'text-lg font-semibold text-gray-800 mb-3';
        title.textContent = '📈 CAGR (Taxa de Crescimento Composta)';
        section.appendChild(title);

        const grid = document.createElement('div');
        grid.className = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4';

        Object.entries(cagr).forEach(([conta, info]) => {
            const card = document.createElement('div');
            card.className = 'p-4 border border-gray-300 rounded-lg bg-white shadow-sm';

            const cagrPercent = (info.cagr * 100).toFixed(2);
            const emoji = this.#getEmojiVariacao(info.cagr);
            const classeVariacao = this.#getClasseVariacao(info.cagr);

            card.innerHTML = `
                <h6 class="text-sm font-semibold text-gray-800 mb-2">${this.#formatarNomeConta(conta)}</h6>
                <div class="space-y-1 text-xs text-gray-600">
                    <p>Inicial: <span class="font-medium">R$ ${this.#formatarValor(info.valorInicial)}</span></p>
                    <p>Final: <span class="font-medium">R$ ${this.#formatarValor(info.valorFinal)}</span></p>
                    <p>Períodos: <span class="font-medium">${info.periodos}</span></p>
                </div>
                <div class="mt-3 pt-3 border-t border-gray-200">
                    <p class="text-lg font-bold ${classeVariacao}">
                        ${emoji} ${cagrPercent}%
                    </p>
                    <p class="text-xs text-gray-500">${info.metodo}</p>
                </div>
            `;

            grid.appendChild(card);
        });

        section.appendChild(grid);
        return section;
    }

    /**
     * Cria seção de tendências
     * @private
     */
    static #criarSecaoTendencias(tendencias) {
        const section = document.createElement('div');
        section.className = 'mb-6';

        const title = document.createElement('h5');
        title.className = 'text-lg font-semibold text-gray-800 mb-3';
        title.textContent = '🔍 Tendências Identificadas';
        section.appendChild(title);

        const grid = document.createElement('div');
        grid.className = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4';

        Object.entries(tendencias).forEach(([conta, info]) => {
            const card = document.createElement('div');
            card.className = 'p-4 border border-gray-300 rounded-lg bg-white shadow-sm';

            const emojiTendencia = this.#getEmojiTendencia(info.tendencia);
            const corTendencia = this.#getClasseTendencia(info.tendencia);
            const badgeConfianca = this.#getBadgeConfianca(info.confianca);

            card.innerHTML = `
                <h6 class="text-sm font-semibold text-gray-800 mb-2">${this.#formatarNomeConta(conta)}</h6>
                <div class="flex items-center justify-between mb-2">
                    <p class="text-lg font-bold ${corTendencia}">
                        ${emojiTendencia} ${info.tendencia.toUpperCase()}
                    </p>
                    <span class="text-xs px-2 py-1 rounded ${badgeConfianca}">
                        ${info.confianca}
                    </span>
                </div>
                <div class="space-y-1 text-xs text-gray-600">
                    <p>Consistência: <span class="font-medium">${(info.consistencia * 100).toFixed(0)}%</span></p>
                    <p>Média Var.: <span class="font-medium">${(info.mediaVariacoes * 100).toFixed(1)}%</span></p>
                    <div class="flex gap-2 mt-2">
                        <span class="text-green-600">↑ ${info.variacoesPositivas}</span>
                        <span class="text-red-600">↓ ${info.variacoesNegativas}</span>
                        <span class="text-gray-500">→ ${info.variacoesEstaveis}</span>
                    </div>
                </div>
            `;

            grid.appendChild(card);
        });

        section.appendChild(grid);
        return section;
    }

    // ====================================================================
    // Seções - Análise Vertical
    // ====================================================================

    /**
     * Cria seção de concentrações
     * @private
     */
    static #criarSecaoConcentracoes(concentracoes) {
        const section = document.createElement('div');
        section.className = 'mb-6';

        const title = document.createElement('h5');
        title.className = 'text-lg font-semibold text-gray-800 mb-3';
        title.textContent = '⚠️ Concentrações Identificadas';
        section.appendChild(title);

        const grid = document.createElement('div');
        grid.className = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4';

        concentracoes.forEach(conc => {
            const card = document.createElement('div');
            const bgClass = this.#getBgConcentracao(conc.nivel);
            card.className = `p-4 border rounded-lg shadow-sm ${bgClass}`;

            card.innerHTML = `
                <h6 class="text-sm font-semibold text-gray-800 mb-2">${this.#formatarNomeConta(conc.conta)}</h6>
                <p class="text-2xl font-bold text-gray-900">
                    ${(conc.percentual * 100).toFixed(1)}%
                </p>
                <p class="text-xs text-gray-700 mt-1">
                    Concentração ${conc.nivel}
                </p>
                <p class="text-xs text-gray-600 mt-2">
                    R$ ${this.#formatarValor(conc.valor)}
                </p>
            `;

            grid.appendChild(card);
        });

        section.appendChild(grid);
        return section;
    }

    /**
     * Cria seção de percentuais (top N contas)
     * @private
     */
    static #criarSecaoPercentuais(percentuais) {
        const section = document.createElement('div');
        section.className = 'mb-6';

        const limit = this.#config.limites?.top10Contas || 10;

        const title = document.createElement('h5');
        title.className = 'text-lg font-semibold text-gray-800 mb-3';
        title.textContent = `📊 Composição Percentual (Top ${limit})`;
        section.appendChild(title);

        // Ordenar por percentual (maior primeiro) e pegar top N
        const topN = Object.entries(percentuais)
            .sort((a, b) => Math.abs(b[1].percentual) - Math.abs(a[1].percentual))
            .slice(0, limit);

        const table = document.createElement('table');
        table.className = 'min-w-full divide-y divide-gray-200 border border-gray-300 rounded-lg';

        const thead = document.createElement('thead');
        thead.className = 'bg-gray-100';
        thead.innerHTML = `
            <tr>
                <th class="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase">Conta</th>
                <th class="px-4 py-2 text-right text-xs font-semibold text-gray-700 uppercase">Valor</th>
                <th class="px-4 py-2 text-right text-xs font-semibold text-gray-700 uppercase">% Base</th>
                <th class="px-4 py-2 text-center text-xs font-semibold text-gray-700 uppercase">Barra</th>
            </tr>
        `;
        table.appendChild(thead);

        const tbody = document.createElement('tbody');
        tbody.className = 'bg-white divide-y divide-gray-200';

        topN.forEach(([conta, info], idx) => {
            const tr = document.createElement('tr');
            tr.className = idx % 2 === 0 ? 'bg-white' : 'bg-gray-50';

            const percentAbs = Math.abs(info.percentual * 100);
            const barWidth = Math.min(percentAbs, 100);

            tr.innerHTML = `
                <td class="px-4 py-2 text-sm font-medium text-gray-900">${this.#formatarNomeConta(conta)}</td>
                <td class="px-4 py-2 text-sm text-right text-gray-700">R$ ${this.#formatarValor(info.valor)}</td>
                <td class="px-4 py-2 text-sm text-right font-semibold text-gray-900">${info.percentualFormatado}</td>
                <td class="px-4 py-2">
                    <div class="w-full bg-gray-200 rounded-full h-2">
                        <div class="bg-blue-600 h-2 rounded-full" style="width: ${barWidth}%"></div>
                    </div>
                </td>
            `;

            tbody.appendChild(tr);
        });

        table.appendChild(tbody);
        section.appendChild(table);

        return section;
    }

    /**
     * Cria seção de validações hierárquicas
     * @private
     */
    static #criarSecaoValidacoes(validacoes) {
        const section = document.createElement('div');
        section.className = 'mb-6';

        const title = document.createElement('h5');
        title.className = 'text-lg font-semibold text-gray-800 mb-3';
        title.textContent = '✅ Validações Hierárquicas';
        section.appendChild(title);

        const lista = document.createElement('div');
        lista.className = 'space-y-2';

        validacoes.forEach(val => {
            const item = document.createElement('div');
            const bgClass = this.#getBgValidacao(val.tipo);
            const iconClass = this.#getClasseValidacao(val.valido);
            const icon = this.#getIconValidacao(val.valido);

            item.className = `p-3 border rounded ${bgClass}`;
            item.innerHTML = `
                <div class="flex items-start gap-2">
                    <span class="${iconClass} text-lg font-bold">${icon}</span>
                    <div class="flex-1">
                        <p class="text-sm font-medium text-gray-800">${val.descricao || ''}</p>
                        <p class="text-xs text-gray-600 mt-1">${val.mensagem}</p>
                    </div>
                </div>
            `;

            lista.appendChild(item);
        });

        section.appendChild(lista);
        return section;
    }

    // ====================================================================
    // Seções - Indicadores
    // ====================================================================

    /**
     * Agrupa indicadores dinamicamente por categoria
     * @private
     */
    static #agruparPorCategoria(resultado) {
        const grupos = {};

        // Descobrir estrutura dinâmica
        Object.entries(resultado).forEach(([chave, valor]) => {
            if (valor && typeof valor === 'object' && valor.valor !== undefined) {
                // É um indicador
                const categoria = valor.categoria || 'outros';
                const categoriaSlug = categoria
                    .toLowerCase()
                    .normalize('NFD')
                    .replace(/[\u0300-\u036f]/g, '');

                if (!grupos[categoriaSlug]) {
                    grupos[categoriaSlug] = [];
                }

                grupos[categoriaSlug].push({
                    chave,
                    ...valor
                });
            }
        });

        return grupos;
    }

    /**
     * Cria card individual de indicador
     * @private
     */
    static #criarCardIndicador(indicador) {
        const card = document.createElement('div');
        card.className = 'p-4 border border-gray-300 rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow';

        const classificacao = indicador.classificacao || {};
        const emoji = classificacao.emoji || '⚪';
        const descricao = classificacao.descricao || 'Sem classificação';
        const corTexto = this.#getCorClassificacao(descricao);

        const valorFormatado = indicador.formato === 'percentual'
            ? `${(indicador.valor * 100).toFixed(2)}%`
            : indicador.formato === 'dias'
            ? `${indicador.valor.toFixed(0)} dias`
            : indicador.formato === 'vezes'
            ? `${indicador.valor.toFixed(2)}x`
            : indicador.valor.toFixed(2);

        card.innerHTML = `
            <div class="flex items-start justify-between mb-2">
                <h6 class="text-sm font-semibold text-gray-800 flex-1">${indicador.label || indicador.chave}</h6>
                <span class="text-2xl">${emoji}</span>
            </div>
            <p class="text-2xl font-bold ${corTexto} mb-1">${valorFormatado}</p>
            <p class="text-xs text-gray-600">${descricao}</p>
        `;

        return card;
    }

    // ====================================================================
    // Seção de Alertas (comum para AH e AV)
    // ====================================================================

    /**
     * Cria seção de alertas
     * @private
     */
    static #criarSecaoAlertas(alertas) {
        const section = document.createElement('div');
        section.className = 'mb-6';

        const title = document.createElement('h5');
        title.className = 'text-lg font-semibold text-gray-800 mb-3';
        title.textContent = '🚨 Alertas';
        section.appendChild(title);

        const lista = document.createElement('div');
        lista.className = 'space-y-2';

        const maxAlertas = this.#config.limites?.maxAlertasExibir || 50;
        const alertasExibir = alertas.slice(0, maxAlertas);

        alertasExibir.forEach(alerta => {
            const item = document.createElement('div');
            const bgClass = this.#getBgAlerta(alerta.nivel);
            const icon = this.#getIconAlerta(alerta.nivel);

            item.className = `p-3 border rounded ${bgClass}`;
            item.innerHTML = `
                <div class="flex items-start gap-2">
                    <span class="text-lg">${icon}</span>
                    <p class="text-sm text-gray-800">${alerta.mensagem}</p>
                </div>
            `;

            lista.appendChild(item);
        });

        section.appendChild(lista);
        return section;
    }

    // ====================================================================
    // Utilitários de Formatação
    // ====================================================================

    /**
     * Formata valor monetário
     * @private
     */
    static #formatarValor(valor) {
        if (valor === null || valor === undefined) return '—';

        const moedaConfig = this.#config.formatacao?.moeda || {
            locale: 'pt-BR',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        };

        return new Intl.NumberFormat(moedaConfig.locale, {
            minimumFractionDigits: moedaConfig.minimumFractionDigits,
            maximumFractionDigits: moedaConfig.maximumFractionDigits
        }).format(valor);
    }

    /**
     * Formata nome de conta (camelCase → Título)
     * @private
     */
    static #formatarNomeConta(nome) {
        return nome
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, str => str.toUpperCase())
            .trim();
    }

    // ====================================================================
    // Utilitários de Estilo (Emoji e Classes Tailwind via Config)
    // ====================================================================

    /**
     * Retorna emoji para variação (via config)
     * @private
     */
    static #getEmojiVariacao(variacao) {
        const cfg = this.#config.variacoes;

        if (variacao > cfg.thresholds.crescimentoForte) {
            return cfg.emojis.crescimentoForte;
        }
        if (variacao > cfg.thresholds.crescimentoModerado) {
            return cfg.emojis.crescimentoModerado;
        }
        if (variacao < cfg.thresholds.quedaForte) {
            return cfg.emojis.quedaForte;
        }
        if (variacao < cfg.thresholds.crescimentoModerado) {
            return cfg.emojis.quedaModerada;
        }
        return cfg.emojis.estavel;
    }

    /**
     * Retorna classe Tailwind para variação (via config)
     * @private
     */
    static #getClasseVariacao(variacao) {
        const cfg = this.#config.variacoes;

        if (variacao > cfg.thresholds.crescimentoForte) {
            return cfg.classesTailwind.crescimentoForte;
        }
        if (variacao > cfg.thresholds.crescimentoModerado) {
            return cfg.classesTailwind.crescimentoModerado;
        }
        if (variacao < cfg.thresholds.quedaForte) {
            return cfg.classesTailwind.quedaForte;
        }
        if (variacao < cfg.thresholds.crescimentoModerado) {
            return cfg.classesTailwind.quedaModerada;
        }
        return cfg.classesTailwind.estavel;
    }

    /**
     * Retorna emoji para tendência (via config)
     * @private
     */
    static #getEmojiTendencia(tendencia) {
        const cfg = this.#config.tendencias.emojis;
        return cfg[tendencia] || cfg.default;
    }

    /**
     * Retorna classe Tailwind para tendência (via config)
     * @private
     */
    static #getClasseTendencia(tendencia) {
        const cfg = this.#config.tendencias.classesTailwind;
        return cfg[tendencia] || cfg.default;
    }

    /**
     * Retorna classe badge para confiança (via config)
     * @private
     */
    static #getBadgeConfianca(confianca) {
        const cfg = this.#config.confianca.badges;
        return cfg[confianca] || cfg.default;
    }

    /**
     * Retorna classe de background para concentração (via config)
     * @private
     */
    static #getBgConcentracao(nivel) {
        const cfg = this.#config.concentracoes.backgrounds;
        return cfg[nivel] || cfg.default;
    }

    /**
     * Retorna classe de background para alerta (via config)
     * @private
     */
    static #getBgAlerta(nivel) {
        const cfg = this.#config.alertas.backgrounds;
        return cfg[nivel] || cfg.default;
    }

    /**
     * Retorna ícone para alerta (via config)
     * @private
     */
    static #getIconAlerta(nivel) {
        const cfg = this.#config.alertas.icones;
        return cfg[nivel] || cfg.default;
    }

    /**
     * Retorna classe de background para validação (via config)
     * @private
     */
    static #getBgValidacao(tipo) {
        const cfg = this.#config.validacoes.backgrounds;
        return cfg[tipo] || cfg.info;
    }

    /**
     * Retorna ícone para validação (via config)
     * @private
     */
    static #getIconValidacao(valido) {
        const cfg = this.#config.validacoes.icones;
        return valido ? cfg.valido : cfg.invalido;
    }

    /**
     * Retorna classe Tailwind para ícone de validação (via config)
     * @private
     */
    static #getClasseValidacao(valido) {
        const cfg = this.#config.validacoes.classesTailwind;
        return valido ? cfg.valido : cfg.invalido;
    }

    /**
     * Retorna cor para classificação de indicador (via config)
     * @private
     */
    static #getCorClassificacao(descricao) {
        const cfg = this.#config.classificacaoIndicadores;
        const desc = descricao.toLowerCase();

        // Verificar palavras-chave positivas
        if (cfg.palavrasChave.positivo.some(palavra => desc.includes(palavra))) {
            return cfg.classesTailwind.positivo;
        }

        // Verificar palavras-chave de atenção
        if (cfg.palavrasChave.atencao.some(palavra => desc.includes(palavra))) {
            return cfg.classesTailwind.atencao;
        }

        // Verificar palavras-chave negativas
        if (cfg.palavrasChave.negativo.some(palavra => desc.includes(palavra))) {
            return cfg.classesTailwind.negativo;
        }

        return cfg.classesTailwind.default;
    }
}

// Disponibilizar globalmente
if (typeof window !== 'undefined') {
    window.AnalysisRenderer = AnalysisRenderer;
}

export default AnalysisRenderer;

console.log('✅ AnalysisRenderer carregado');
