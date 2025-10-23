/**
 * =====================================
 * CALCULADOR-ANALISE-DRE.JS
 * Sistema de Análise de DRE Histórica
 * =====================================
 *
 * Responsabilidades:
 * - Definir estrutura de 30 contas de DRE
 * - Calcular 14 totais intermediários
 * - Análise Horizontal (variações + CAGR)
 * - Análise Vertical (% sobre Receita Líquida)
 * - 10 Indicadores de Performance
 * - Anualização de períodos parciais
 *
 * Arquitetura: NO FALLBACKS
 * Config: analise-dre-config.json (externo)
 * Expertzy © 2025
 */

class CalculadorAnaliseDRE {
    constructor(config = null) {
        this.estruturaContas = this.definirEstruturaContas();
        this.config = config;
        this.parametros = null;
        this.thresholds = null;
    }

    /**
     * Carrega configuração externa de parâmetros
     * @param {string} configPath - Caminho do JSON de configuração
     * @throws {Error} Se config não puder ser carregado
     */
    async carregarConfig(configPath = '/config/analise-dre-config.json') {
        try {
            const response = await fetch(configPath);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            this.config = await response.json();
            this.parametros = this.config.parametros;
            this.thresholds = this.config.thresholds;
            console.log('[CalculadorAnaliseDRE] Config carregada:', this.config.versao);
        } catch (error) {
            throw new Error(`CalculadorAnaliseDRE: Config obrigatória não disponível em ${configPath} - ${error.message}`);
        }
    }

    /**
     * Define estrutura completa de 30 contas de DRE
     * Hierarquia: Receita → Deduções → Custos → Despesas → Resultado
     */
    definirEstruturaContas() {
        return {
            // ========== RECEITA BRUTA (3 contas) ==========
            receitaBruta: {
                vendasProdutos: { label: 'Vendas de Produtos', tipo: 'input' },
                vendasServicos: { label: 'Vendas de Serviços', tipo: 'input' },
                outrasReceitas: { label: 'Outras Receitas Operacionais', tipo: 'input' },
                total: { label: 'TOTAL RECEITA BRUTA', tipo: 'calculado', formula: 'vendasProdutos + vendasServicos + outrasReceitas' }
            },

            // ========== DEDUÇÕES DA RECEITA (6 contas) ==========
            deducoes: {
                icms: { label: '(-) ICMS sobre Vendas', tipo: 'input', natureza: 'dedutora' },
                pis: { label: '(-) PIS sobre Vendas', tipo: 'input', natureza: 'dedutora' },
                cofins: { label: '(-) COFINS sobre Vendas', tipo: 'input', natureza: 'dedutora' },
                iss: { label: '(-) ISS sobre Serviços', tipo: 'input', natureza: 'dedutora' },
                devolucoes: { label: '(-) Devoluções e Cancelamentos', tipo: 'input', natureza: 'dedutora' },
                abatimentos: { label: '(-) Abatimentos Concedidos', tipo: 'input', natureza: 'dedutora' },
                total: { label: 'TOTAL DEDUÇÕES', tipo: 'calculado', formula: 'icms + pis + cofins + iss + devolucoes + abatimentos' }
            },

            // ========== RECEITA OPERACIONAL LÍQUIDA ==========
            receitaLiquida: {
                label: 'RECEITA OPERACIONAL LÍQUIDA',
                tipo: 'calculado',
                formula: 'receitaBruta.total - deducoes.total',
                isBase: true  // Base para Análise Vertical (100%)
            },

            // ========== CUSTOS OPERACIONAIS (3 contas) ==========
            custos: {
                cmvCpv: { label: '(-) CMV / CPV', tipo: 'input', natureza: 'custo' },
                custosServicos: { label: '(-) Custos dos Serviços Prestados', tipo: 'input', natureza: 'custo' },
                maoObraProducao: { label: '(-) Mão-de-Obra de Produção', tipo: 'input', natureza: 'custo' },
                total: { label: 'TOTAL CUSTOS OPERACIONAIS', tipo: 'calculado', formula: 'cmvCpv + custosServicos + maoObraProducao' }
            },

            // ========== LUCRO BRUTO ==========
            lucroBruto: {
                valor: { label: 'LUCRO BRUTO', tipo: 'calculado', formula: 'receitaLiquida - custos.total' },
                margem: { label: 'Margem Bruta (%)', tipo: 'percentual', formula: '(lucroBruto.valor / receitaLiquida) * 100' }
            },

            // ========== DESPESAS OPERACIONAIS - VENDAS (4 contas) ==========
            despesasVendas: {
                comissoes: { label: '(-) Comissões sobre Vendas', tipo: 'input', natureza: 'despesa' },
                marketing: { label: '(-) Marketing e Publicidade', tipo: 'input', natureza: 'despesa' },
                frete: { label: '(-) Fretes e Entregas', tipo: 'input', natureza: 'despesa' },
                outras: { label: '(-) Outras Despesas de Vendas', tipo: 'input', natureza: 'despesa' },
                total: { label: 'Subtotal Despesas de Vendas', tipo: 'calculado', formula: 'comissoes + marketing + frete + outras' }
            },

            // ========== DESPESAS OPERACIONAIS - ADMINISTRATIVAS (5 contas) ==========
            despesasAdmin: {
                salarios: { label: '(-) Salários Administrativos', tipo: 'input', natureza: 'despesa' },
                encargos: { label: '(-) Encargos Sociais', tipo: 'input', natureza: 'despesa' },
                alugueis: { label: '(-) Aluguéis e Condomínios', tipo: 'input', natureza: 'despesa' },
                servicosTerceiros: { label: '(-) Serviços de Terceiros', tipo: 'input', natureza: 'despesa' },
                outras: { label: '(-) Outras Despesas Administrativas', tipo: 'input', natureza: 'despesa' },
                total: { label: 'Subtotal Despesas Administrativas', tipo: 'calculado', formula: 'salarios + encargos + alugueis + servicosTerceiros + outras' }
            },

            // ========== OUTRAS DESPESAS OPERACIONAIS (1 conta) ==========
            outrasDespesasOp: {
                valor: { label: '(-) Outras Despesas Operacionais', tipo: 'input', natureza: 'despesa' }
            },

            // ========== TOTAL DESPESAS OPERACIONAIS ==========
            despesasOperacionais: {
                total: {
                    label: 'TOTAL DESPESAS OPERACIONAIS',
                    tipo: 'calculado',
                    formula: 'despesasVendas.total + despesasAdmin.total + outrasDespesasOp.valor'
                }
            },

            // ========== EBITDA ==========
            ebitda: {
                valor: {
                    label: 'EBITDA',
                    tipo: 'calculado',
                    formula: 'lucroBruto.valor - despesasOperacionais.total'
                },
                margem: {
                    label: 'Margem EBITDA (%)',
                    tipo: 'percentual',
                    formula: '(ebitda.valor / receitaLiquida) * 100'
                }
            },

            // ========== DEPRECIAÇÃO E AMORTIZAÇÃO (2 contas) ==========
            depreciacaoAmortizacao: {
                depreciacao: { label: '(-) Depreciação de Ativos', tipo: 'input', natureza: 'despesa' },
                amortizacao: { label: '(-) Amortização de Intangíveis', tipo: 'input', natureza: 'despesa' },
                total: { label: 'Total Deprec. e Amortiz.', tipo: 'calculado', formula: 'depreciacao + amortizacao' }
            },

            // ========== EBIT (LUCRO OPERACIONAL) ==========
            ebit: {
                valor: {
                    label: 'EBIT (Lucro Operacional)',
                    tipo: 'calculado',
                    formula: 'ebitda.valor - depreciacaoAmortizacao.total'
                },
                margem: {
                    label: 'Margem Operacional (%)',
                    tipo: 'percentual',
                    formula: '(ebit.valor / receitaLiquida) * 100'
                }
            },

            // ========== RESULTADO FINANCEIRO (2 contas) ==========
            resultadoFinanceiro: {
                receitasFinanceiras: { label: '(+) Receitas Financeiras', tipo: 'input', natureza: 'receita' },
                despesasFinanceiras: { label: '(-) Despesas Financeiras', tipo: 'input', natureza: 'despesa' },
                liquido: {
                    label: 'Resultado Financeiro Líquido',
                    tipo: 'calculado',
                    formula: 'receitasFinanceiras - despesasFinanceiras'
                }
            },

            // ========== OUTRAS RECEITAS/DESPESAS (2 contas) ==========
            outrasReceitasDespesas: {
                outrasReceitas: { label: '(+) Outras Receitas Não-Operacionais', tipo: 'input', natureza: 'receita' },
                outrasDespesas: { label: '(-) Outras Despesas Não-Operacionais', tipo: 'input', natureza: 'despesa' },
                liquido: {
                    label: 'Outras Receitas/Despesas Líquidas',
                    tipo: 'calculado',
                    formula: 'outrasReceitas - outrasDespesas'
                }
            },

            // ========== LAIR (LUCRO ANTES DO IMPOSTO DE RENDA) ==========
            lair: {
                valor: {
                    label: 'LAIR (Lucro Antes do IR)',
                    tipo: 'calculado',
                    formula: 'ebit.valor + resultadoFinanceiro.liquido + outrasReceitasDespesas.liquido'
                }
            },

            // ========== IMPOSTOS SOBRE LUCRO (2 contas) ==========
            impostosSobreLucro: {
                irpj: { label: '(-) IRPJ', tipo: 'input', natureza: 'imposto' },
                csll: { label: '(-) CSLL', tipo: 'input', natureza: 'imposto' },
                total: { label: 'Total Impostos sobre Lucro', tipo: 'calculado', formula: 'irpj + csll' }
            },

            // ========== LUCRO LÍQUIDO ==========
            lucroLiquido: {
                valor: {
                    label: 'LUCRO LÍQUIDO DO EXERCÍCIO',
                    tipo: 'calculado',
                    formula: 'lair.valor - impostosSobreLucro.total'
                },
                margem: {
                    label: 'Margem Líquida (%)',
                    tipo: 'percentual',
                    formula: '(lucroLiquido.valor / receitaLiquida) * 100'
                }
            }
        };
    }

    // ==========================================
    // SEÇÃO 1: ANÁLISE HORIZONTAL
    // ==========================================

    /**
     * Calcula Análise Horizontal para múltiplos períodos de DRE
     * @param {Array<Object>} dres - Array de DREs (mín. 2 períodos)
     * @returns {Object} Análise Horizontal com variações e tendências
     */
    calcularAnaliseHorizontal(dres) {
        if (!dres || dres.length < 2) {
            throw new Error('Análise Horizontal requer no mínimo 2 períodos de DRE');
        }

        const ah = {
            periodos: dres.map(dre => ({
                numeroPeriodo: dre.numeroPeriodo,
                data: dre.data,
                isParcial: dre.isParcial || false,
                mesesDecorridos: dre.mesesDecorridos || 12
            })),
            contas: {}
        };

        // Iterar sobre todas as contas da estrutura
        const processarContas = (estrutura, prefixo = '') => {
            for (const [key, conta] of Object.entries(estrutura)) {
                if (typeof conta === 'object' && conta.label) {
                    const nomeConta = prefixo ? `${prefixo}.${key}` : key;

                    // Extrair valores de cada período
                    const valores = dres.map(dre => {
                        const valor = this.obterValorConta(dre, nomeConta);
                        if (valor === null || valor === undefined) {
                            throw new Error(`Conta '${nomeConta}' não encontrada em período ${dre.numeroPeriodo}`);
                        }
                        return valor;
                    });

                    // Calcular variações entre períodos consecutivos
                    const variacoes = [];
                    for (let i = 1; i < valores.length; i++) {
                        variacoes.push(this.calcularVariacao(valores[i - 1], valores[i]));
                    }

                    // Calcular CAGR (do primeiro ao último período)
                    const anos = valores.length - 1;
                    const cagr = this.calcularCAGR(valores[0], valores[valores.length - 1], anos);

                    // Determinar tendência geral
                    const tendencia = this.determinarTendencia(variacoes);

                    ah.contas[nomeConta] = {
                        label: conta.label,
                        valores,
                        variacoes,
                        cagr,
                        tendencia
                    };
                } else if (typeof conta === 'object') {
                    // Recursivo para subgrupos
                    processarContas(conta, prefixo ? `${prefixo}.${key}` : key);
                }
            }
        };

        processarContas(this.estruturaContas);

        return ah;
    }

    /**
     * Calcula variação percentual entre dois valores
     * @param {number} valorAnterior - Valor do período anterior
     * @param {number} valorAtual - Valor do período atual
     * @returns {Object} { variacao, status, emoji }
     */
    calcularVariacao(valorAnterior, valorAtual) {
        // Casos especiais
        if (valorAnterior === 0 && valorAtual === 0) {
            return { variacao: 0, status: 'Estável', emoji: '→' };
        }
        if (valorAnterior === 0 && valorAtual !== 0) {
            return { variacao: Infinity, status: 'Novo', emoji: '🆕' };
        }
        if (valorAnterior !== 0 && valorAtual === 0) {
            return { variacao: -100, status: 'Eliminado', emoji: '❌' };
        }

        const variacao = ((valorAtual - valorAnterior) / Math.abs(valorAnterior)) * 100;

        if (!this.thresholds) {
            throw new Error('Thresholds não carregados - execute carregarConfig() primeiro');
        }

        const minVariacao = this.thresholds.minimaVariacaoAH;

        let status, emoji;
        if (Math.abs(variacao) < minVariacao) {
            status = 'Estável';
            emoji = '→';
        } else if (variacao > 0) {
            status = 'Crescimento';
            emoji = '↗';
        } else {
            status = 'Redução';
            emoji = '↘';
        }

        return {
            variacao: parseFloat(variacao.toFixed(2)),
            status,
            emoji
        };
    }

    /**
     * Calcula CAGR (Compound Annual Growth Rate)
     * @param {number} valorInicial - Valor do primeiro período
     * @param {number} valorFinal - Valor do último período
     * @param {number} anos - Número de anos entre períodos
     * @returns {number} CAGR em percentual
     */
    calcularCAGR(valorInicial, valorFinal, anos) {
        if (valorInicial <= 0 || valorFinal <= 0 || anos <= 0) {
            return 0;
        }

        const cagr = (Math.pow(valorFinal / valorInicial, 1 / anos) - 1) * 100;
        return parseFloat(cagr.toFixed(2));
    }

    /**
     * Determina tendência geral baseada em múltiplas variações
     * @param {Array<Object>} variacoes - Array de objetos de variação
     * @returns {Object} { tendencia, emoji }
     */
    determinarTendencia(variacoes) {
        if (!variacoes || variacoes.length === 0) {
            throw new Error('Variações obrigatórias para determinar tendência');
        }

        const crescimentos = variacoes.filter(v => v.status === 'Crescimento').length;
        const reducoes = variacoes.filter(v => v.status === 'Redução').length;
        const total = variacoes.length;

        if (crescimentos === total) {
            return { tendencia: 'Crescimento Consistente', emoji: '📈' };
        } else if (reducoes === total) {
            return { tendencia: 'Redução Consistente', emoji: '📉' };
        } else if (crescimentos > reducoes) {
            return { tendencia: 'Tendência de Crescimento', emoji: '↗' };
        } else if (reducoes > crescimentos) {
            return { tendencia: 'Tendência de Redução', emoji: '↘' };
        } else {
            return { tendencia: 'Oscilante', emoji: '↔' };
        }
    }

    // ==========================================
    // SEÇÃO 2: ANÁLISE VERTICAL
    // ==========================================

    /**
     * Calcula Análise Vertical (% sobre Receita Líquida = 100%)
     * @param {Array<Object>} dres - Array de DREs
     * @returns {Object} Análise Vertical com percentuais
     */
    calcularAnaliseVertical(dres) {
        if (!dres || dres.length === 0) {
            throw new Error('Análise Vertical requer ao menos 1 período de DRE');
        }

        const av = {
            periodos: dres.map(dre => {
                const receitaLiquida = this.obterValorConta(dre, 'receitaLiquida');
                if (receitaLiquida === null || receitaLiquida === undefined) {
                    throw new Error(`Receita Líquida obrigatória para Análise Vertical - período ${dre.numeroPeriodo}`);
                }
                return {
                    numeroPeriodo: dre.numeroPeriodo,
                    data: dre.data,
                    receitaLiquidaBase: receitaLiquida
                };
            }),
            contas: {}
        };

        // Processar todas as contas
        const processarContas = (estrutura, prefixo = '') => {
            for (const [key, conta] of Object.entries(estrutura)) {
                if (typeof conta === 'object' && conta.label) {
                    const nomeConta = prefixo ? `${prefixo}.${key}` : key;

                    // Calcular % para cada período
                    const percentuais = dres.map(dre => {
                        const valor = this.obterValorConta(dre, nomeConta);
                        const receitaLiquida = this.obterValorConta(dre, 'receitaLiquida');

                        if (valor === null || valor === undefined) {
                            throw new Error(`Conta '${nomeConta}' não encontrada em período ${dre.numeroPeriodo}`);
                        }
                        if (receitaLiquida === null || receitaLiquida === undefined) {
                            throw new Error(`Receita Líquida não encontrada em período ${dre.numeroPeriodo}`);
                        }

                        return this.calcularPercentualVertical(valor, receitaLiquida);
                    });

                    // Média dos percentuais
                    const media = percentuais.reduce((sum, p) => sum + p, 0) / percentuais.length;

                    av.contas[nomeConta] = {
                        label: conta.label,
                        percentuais,
                        media: parseFloat(media.toFixed(2))
                    };
                } else if (typeof conta === 'object') {
                    processarContas(conta, prefixo ? `${prefixo}.${key}` : key);
                }
            }
        };

        processarContas(this.estruturaContas);

        return av;
    }

    /**
     * Calcula percentual vertical de uma conta sobre a Receita Líquida
     * @param {number} valorConta - Valor da conta
     * @param {number} receitaLiquida - Receita Líquida (base = 100%)
     * @returns {number} Percentual (pode ser negativo para contas dedutoras)
     */
    calcularPercentualVertical(valorConta, receitaLiquida) {
        if (receitaLiquida === 0) {
            throw new Error('Receita Líquida = 0 - impossível calcular percentual vertical');
        }

        const percentual = (valorConta / receitaLiquida) * 100;
        return parseFloat(percentual.toFixed(2));
    }

    // ==========================================
    // SEÇÃO 3: INDICADORES DE PERFORMANCE
    // ==========================================

    /**
     * Calcula todos os 10 indicadores de performance
     * @param {Array<Object>} dres - Array de DREs
     * @returns {Object} Indicadores com classificações
     */
    calcularIndicadores(dres) {
        if (!dres || dres.length === 0) {
            throw new Error('Cálculo de indicadores requer ao menos 1 período de DRE');
        }

        if (!this.parametros) {
            throw new Error('Parâmetros de config não carregados - execute carregarConfig() primeiro');
        }

        const indicadores = {
            periodos: dres.map(dre => ({
                numeroPeriodo: dre.numeroPeriodo,
                data: dre.data
            })),
            margens: [],
            estruturaCustos: [],
            breakeven: [],
            alavancagem: []
        };

        // Calcular indicadores para cada período
        dres.forEach(dre => {
            indicadores.margens.push(this.calcularMargens(dre));
            indicadores.estruturaCustos.push(this.calcularEstruturaCustos(dre));
            indicadores.breakeven.push(this.calcularBreakeven(dre));
            indicadores.alavancagem.push(this.calcularAlavancagem(dre));
        });

        return indicadores;
    }

    /**
     * Calcula 4 indicadores de margem
     * @param {Object} dre - DRE de um período
     * @returns {Object} Margens com classificações
     */
    calcularMargens(dre) {
        const receitaLiquida = this.obterValorConta(dre, 'receitaLiquida');
        const lucroBruto = this.obterValorConta(dre, 'lucroBruto.valor');
        const ebitda = this.obterValorConta(dre, 'ebitda.valor');
        const ebit = this.obterValorConta(dre, 'ebit.valor');
        const lucroLiquido = this.obterValorConta(dre, 'lucroLiquido.valor');

        if (receitaLiquida === null) throw new Error('Receita Líquida obrigatória para cálculo de margens');
        if (lucroBruto === null) throw new Error('Lucro Bruto obrigatório para cálculo de margens');
        if (ebitda === null) throw new Error('EBITDA obrigatório para cálculo de margens');
        if (ebit === null) throw new Error('EBIT obrigatório para cálculo de margens');
        if (lucroLiquido === null) throw new Error('Lucro Líquido obrigatório para cálculo de margens');

        const margens = {
            bruta: this.calcularIndicador(lucroBruto, receitaLiquida, 'margemBruta'),
            ebitda: this.calcularIndicador(ebitda, receitaLiquida, 'margemEBITDA'),
            operacional: this.calcularIndicador(ebit, receitaLiquida, 'margemOperacional'),
            liquida: this.calcularIndicador(lucroLiquido, receitaLiquida, 'margemLiquida')
        };

        return margens;
    }

    /**
     * Calcula 3 indicadores de estrutura de custos
     * @param {Object} dre - DRE de um período
     * @returns {Object} Estrutura de custos
     */
    calcularEstruturaCustos(dre) {
        const receitaLiquida = this.obterValorConta(dre, 'receitaLiquida');
        const custosTotal = this.obterValorConta(dre, 'custos.total');
        const despesasOp = this.obterValorConta(dre, 'despesasOperacionais.total');
        const lucroBruto = this.obterValorConta(dre, 'lucroBruto.valor');

        if (receitaLiquida === null) throw new Error('Receita Líquida obrigatória para estrutura de custos');
        if (custosTotal === null) throw new Error('Custos Total obrigatório para estrutura de custos');
        if (despesasOp === null) throw new Error('Despesas Operacionais obrigatórias para estrutura de custos');
        if (lucroBruto === null) throw new Error('Lucro Bruto obrigatório para estrutura de custos');

        const estrutura = {
            custosVariaveis: this.calcularIndicador(custosTotal, receitaLiquida, 'custosVariaveis'),
            custosFixos: this.calcularIndicador(despesasOp, receitaLiquida, 'custosFixos'),
            margemContribuicao: this.calcularIndicador(lucroBruto, receitaLiquida, 'margemContribuicao')
        };

        return estrutura;
    }

    /**
     * Calcula 2 indicadores de break-even
     * @param {Object} dre - DRE de um período
     * @returns {Object} Indicadores de break-even
     */
    calcularBreakeven(dre) {
        const receitaLiquida = this.obterValorConta(dre, 'receitaLiquida');
        const lucroBruto = this.obterValorConta(dre, 'lucroBruto.valor');
        const despesasOp = this.obterValorConta(dre, 'despesasOperacionais.total');

        if (receitaLiquida === null) throw new Error('Receita Líquida obrigatória para break-even');
        if (lucroBruto === null) throw new Error('Lucro Bruto obrigatório para break-even');
        if (despesasOp === null) throw new Error('Despesas Operacionais obrigatórias para break-even');

        // Margem de Contribuição (decimal)
        if (receitaLiquida === 0) {
            throw new Error('Receita Líquida = 0 - impossível calcular break-even');
        }
        const margemContribDecimal = lucroBruto / receitaLiquida;

        // Ponto de Equilíbrio = Despesas Fixas / Margem Contribuição
        if (margemContribDecimal === 0) {
            throw new Error('Margem de Contribuição = 0 - impossível calcular ponto de equilíbrio');
        }
        const pontoEquilibrio = despesasOp / margemContribDecimal;

        // Margem de Segurança = (Receita Real - Break-even) / Receita Real * 100
        const margemSeguranca = ((receitaLiquida - pontoEquilibrio) / receitaLiquida) * 100;

        return {
            pontoEquilibrio: {
                valor: parseFloat(pontoEquilibrio.toFixed(2)),
                label: 'Ponto de Equilíbrio (R$)',
                classificacao: this.classificarValor(receitaLiquida - pontoEquilibrio, 'pontoEquilibrio')
            },
            margemSeguranca: this.calcularIndicador(margemSeguranca, 100, 'margemSeguranca', true)
        };
    }

    /**
     * Calcula 1 indicador de alavancagem operacional
     * @param {Object} dre - DRE de um período
     * @returns {Object} Indicador de alavancagem
     */
    calcularAlavancagem(dre) {
        const lucroBruto = this.obterValorConta(dre, 'lucroBruto.valor');
        const ebit = this.obterValorConta(dre, 'ebit.valor');

        if (lucroBruto === null) throw new Error('Lucro Bruto obrigatório para alavancagem');
        if (ebit === null) throw new Error('EBIT obrigatório para alavancagem');

        // Grau de Alavancagem Operacional = Margem Contribuição / EBIT
        if (ebit === 0) {
            throw new Error('EBIT = 0 - impossível calcular grau de alavancagem operacional');
        }
        const gao = lucroBruto / ebit;

        return {
            grauAlavancagem: {
                valor: parseFloat(gao.toFixed(2)),
                label: 'Grau de Alavancagem Operacional',
                classificacao: this.classificarValor(gao, 'grauAlavancagem')
            }
        };
    }

    /**
     * Calcula um indicador individual com classificação
     * @param {number} numerador - Numerador da fração
     * @param {number} denominador - Denominador da fração
     * @param {string} nomeIndicador - Nome do indicador no config
     * @param {boolean} jaEhPercentual - Se o valor já está em percentual
     * @returns {Object} { valor, label, classificacao }
     */
    calcularIndicador(numerador, denominador, nomeIndicador, jaEhPercentual = false) {
        if (denominador === 0) {
            throw new Error(`Denominador = 0 para indicador '${nomeIndicador}' - impossível calcular`);
        }

        const valor = jaEhPercentual ? numerador : (numerador / denominador) * 100;
        const valorFinal = parseFloat(valor.toFixed(2));
        const classificacao = this.classificarValor(valorFinal, nomeIndicador);

        return {
            valor: valorFinal,
            label: this.parametros[nomeIndicador]?.label || nomeIndicador,
            classificacao
        };
    }

    /**
     * Classifica um valor segundo parâmetros de config
     * @param {number} valor - Valor do indicador
     * @param {string} nomeIndicador - Nome do indicador
     * @returns {Object} { nivel, emoji, label, descricao }
     */
    classificarValor(valor, nomeIndicador) {
        const param = this.parametros[nomeIndicador];
        if (!param) {
            throw new Error(`Parâmetro '${nomeIndicador}' não encontrado em config`);
        }

        // Verificar faixas: bom, atencao, critico
        if (param.bom && this.valorNaFaixa(valor, param.bom)) {
            return {
                nivel: 'Bom',
                emoji: param.bom.emoji,
                label: param.bom.label,
                descricao: param.bom.descricao || ''
            };
        } else if (param.atencao && this.valorNaFaixa(valor, param.atencao)) {
            return {
                nivel: 'Atenção',
                emoji: param.atencao.emoji,
                label: param.atencao.label,
                descricao: param.atencao.descricao || ''
            };
        } else if (param.critico && this.valorNaFaixa(valor, param.critico)) {
            return {
                nivel: 'Crítico',
                emoji: param.critico.emoji,
                label: param.critico.label,
                descricao: param.critico.descricao || ''
            };
        }

        throw new Error(`Valor ${valor} fora dos parâmetros definidos para '${nomeIndicador}'`);
    }

    /**
     * Verifica se valor está dentro de uma faixa
     * @param {number} valor - Valor a verificar
     * @param {Object} faixa - { min?, max? }
     * @returns {boolean}
     */
    valorNaFaixa(valor, faixa) {
        const { min, max } = faixa;

        if (min !== undefined && max !== undefined) {
            return valor >= min && valor < max;
        } else if (min !== undefined) {
            return valor >= min;
        } else if (max !== undefined) {
            return valor < max;
        }

        return false;
    }

    // ==========================================
    // SEÇÃO 4: ANUALIZAÇÃO DE PERÍODO PARCIAL
    // ==========================================

    /**
     * Inicializa contas ausentes com valor 0 (contas opcionais)
     *
     * Nem todas as empresas possuem todas as contas:
     * - ISS: apenas empresas de serviços
     * - Algumas contas podem ser legitimamente ausentes
     *
     * @param {Object} estrutura - Estrutura de contas (this.estruturaContas)
     * @param {Object} dre - Objeto DRE a inicializar
     * @param {string} prefixo - Prefixo para navegação (uso interno recursivo)
     */
    inicializarContasVazias(estrutura, dre, prefixo = '') {
        for (const [key, conta] of Object.entries(estrutura)) {
            if (typeof conta === 'object' && conta.tipo === 'input') {
                // Conta de INPUT (valor monetário)
                const nomeConta = prefixo ? `${prefixo}.${key}` : key;
                const valor = this.obterValorConta(dre, nomeConta);

                if (valor === null || valor === undefined) {
                    this.setarValorConta(dre, nomeConta, 0);
                    console.log(`  • Inicializada: ${nomeConta} = 0 (conta opcional ausente)`);
                }
            } else if (typeof conta === 'object' && !conta.label) {
                // Grupo aninhado - recursão
                this.inicializarContasVazias(conta, dre, prefixo ? `${prefixo}.${key}` : key);
            }
        }
    }

    /**
     * =====================================================
     * CORREÇÃO: Funções de Anualização de DRE Parcial
     * =====================================================
     * 
     * Substitua as funções correspondentes no arquivo:
     * calculador-analise-dre.js
     * 
     * PROBLEMA CORRIGIDO:
     * - Erro quando contas opcionais (como deducoes.iss) não existem
     * - Função agora inicializa contas ausentes com 0
     * - Mais flexível e robusta
     */

    /**
     * Garante que grupos de contas calculadas existam como objetos
     * Não seta valores, apenas cria a estrutura de objetos necessária
     */
    inicializarEstruturaCalculada(estrutura, dre, prefixo = '') {
        for (const [key, conta] of Object.entries(estrutura)) {
            const caminho = prefixo ? `${prefixo}.${key}` : key;

            if (typeof conta === 'object' && !conta.label) {
                // É um GRUPO (não uma conta com label)
                // Garantir que o objeto exista
                const partes = caminho.split('.');
                let obj = dre;

                for (const parte of partes) {
                    if (!obj[parte]) {
                        obj[parte] = {};
                    }
                    obj = obj[parte];
                }

                // Recursão para subgrupos
                this.inicializarEstruturaCalculada(conta, dre, caminho);
            }
        }
    }
    
    /**
     * Anualiza DRE de período parcial para 12 meses
     * @param {Object} dre - DRE parcial
     * @param {number} mesesDecorridos - Meses do período (1-12)
     * @returns {Object} DRE anualizada
     */
    anualizarDREparcial(dre, mesesDecorridos = 12) {
        if (mesesDecorridos === 12) {
            console.log('[CalculadorAnaliseDRE] Período completo - não requer anualização');
            return dre;
        }

        if (mesesDecorridos < 1 || mesesDecorridos > 12) {
            throw new Error(`mesesDecorridos inválido: ${mesesDecorridos}. Deve ser entre 1-12`);
        }

        const fator = 12 / mesesDecorridos;
        console.log(`[CalculadorAnaliseDRE] Anualizando DRE parcial: ${mesesDecorridos} meses → fator ${fator.toFixed(2)}`);

        // Anualizar apenas contas de input (contas calculadas serão recalculadas depois)
        console.log('[CalculadorAnaliseDRE] Anualizando contas de input...');
        // 1. anualiza contas de input
        this.anualizarContas(this.estruturaContas, dre, fator);

        // 2. cria objetos calculados  ← ADICIONE ESTA LINHA
        this.inicializarEstruturaCalculada(this.estruturaContas, dre);

        // 3. recalcula totais e margens
        this.recalcularTotais(dre);

        console.log('[CalculadorAnaliseDRE] ✓ Anualização concluída');
        return dre;
    }
    
    /**
     * Anualiza contas de input multiplicando pelo fator (MODIFICADA)
     * @param {Object} estrutura - Estrutura de contas
     * @param {Object} dre - DRE parcial
     * @param {number} fator - Fator de anualização (ex: 2.0 para 6 meses)
     * @param {string} prefixo - Prefixo do caminho (uso interno)
     */
    anualizarContas(estrutura, dre, fator, prefixo = '') {
        for (const [key, conta] of Object.entries(estrutura)) {
            if (typeof conta === 'object' && conta.label) {
                const nomeConta = prefixo ? `${prefixo}.${key}` : key;

                // MUDANÇA: Não lança mais erro se conta não existir
                // (já foi inicializada com 0 pela função inicializarContasVazias)
                const valor = this.obterValorConta(dre, nomeConta);

                // Anualizar apenas contas de input (não calculadas)
                if (conta.tipo === 'input' && valor !== null && valor !== undefined) {
                    const valorAnualizado = valor * fator;
                    this.setarValorConta(dre, nomeConta, valorAnualizado);
                    console.log(`  • ${nomeConta}: ${valor.toFixed(2)} → ${valorAnualizado.toFixed(2)}`);
                }
            } else if (typeof conta === 'object') {
                // Recursivo para subgrupos
                this.anualizarContas(conta, dre, fator, prefixo ? `${prefixo}.${key}` : key);
            }
        }
    }

    /**
     * Recalcula todos os totais e margens da DRE (JÁ EXISTE - MANTER COMO ESTÁ)
     * @param {Object} dre - Objeto DRE
     */
    recalcularTotais(dre) {
        // Total Receita Bruta
        dre.receitaBruta.total = (dre.receitaBruta.vendasProdutos || 0) + 
                                  (dre.receitaBruta.vendasServicos || 0) + 
                                  (dre.receitaBruta.outrasReceitas || 0);

        // Total Deduções
        dre.deducoes.total = (dre.deducoes.icms || 0) + (dre.deducoes.pis || 0) + 
                             (dre.deducoes.cofins || 0) + (dre.deducoes.iss || 0) +
                             (dre.deducoes.devolucoes || 0) + (dre.deducoes.abatimentos || 0);

        // Receita Líquida
        dre.receitaLiquida = dre.receitaBruta.total - dre.deducoes.total;

        if (dre.receitaLiquida === 0) {
            throw new Error('Receita Líquida = 0 após recálculo - impossível calcular margens');
        }

        // Total Custos
        dre.custos.total = (dre.custos.cmvCpv || 0) + (dre.custos.custosServicos || 0) + 
                           (dre.custos.maoObraProducao || 0);

        // Lucro Bruto
        dre.lucroBruto.valor = dre.receitaLiquida - dre.custos.total;
        dre.lucroBruto.margem = (dre.lucroBruto.valor / dre.receitaLiquida) * 100;

        // Total Despesas Vendas
        dre.despesasVendas.total = (dre.despesasVendas.comissoes || 0) + 
                                    (dre.despesasVendas.marketing || 0) + 
                                    (dre.despesasVendas.frete || 0) + 
                                    (dre.despesasVendas.outras || 0);

        // Total Despesas Admin
        dre.despesasAdmin.total = (dre.despesasAdmin.salarios || 0) + 
                                  (dre.despesasAdmin.encargos || 0) + 
                                  (dre.despesasAdmin.alugueis || 0) +
                                  (dre.despesasAdmin.servicosTerceiros || 0) + 
                                  (dre.despesasAdmin.outras || 0);

        // Total Despesas Operacionais
        dre.despesasOperacionais.total = dre.despesasVendas.total + 
                                          dre.despesasAdmin.total + 
                                          (dre.outrasDespesasOp.valor || 0);

        // EBITDA
        dre.ebitda.valor = dre.lucroBruto.valor - dre.despesasOperacionais.total;
        dre.ebitda.margem = (dre.ebitda.valor / dre.receitaLiquida) * 100;

        // Total Deprec/Amort
        dre.depreciacaoAmortizacao.total = (dre.depreciacaoAmortizacao.depreciacao || 0) + 
                                            (dre.depreciacaoAmortizacao.amortizacao || 0);

        // EBIT
        dre.ebit.valor = dre.ebitda.valor - dre.depreciacaoAmortizacao.total;
        dre.ebit.margem = (dre.ebit.valor / dre.receitaLiquida) * 100;

        // Resultado Financeiro
        dre.resultadoFinanceiro.liquido = (dre.resultadoFinanceiro.receitasFinanceiras || 0) - 
                                           (dre.resultadoFinanceiro.despesasFinanceiras || 0);

        // Outras Receitas/Despesas
        dre.outrasReceitasDespesas.liquido = (dre.outrasReceitasDespesas.outrasReceitas || 0) - 
                                              (dre.outrasReceitasDespesas.outrasDespesas || 0);

        // LAIR
        dre.lair.valor = dre.ebit.valor + dre.resultadoFinanceiro.liquido + 
                         dre.outrasReceitasDespesas.liquido;

        // Total Impostos
        dre.impostosSobreLucro.total = (dre.impostosSobreLucro.irpj || 0) + 
                                        (dre.impostosSobreLucro.csll || 0);

        // Lucro Líquido
        dre.lucroLiquido.valor = dre.lair.valor - dre.impostosSobreLucro.total;
        dre.lucroLiquido.margem = (dre.lucroLiquido.valor / dre.receitaLiquida) * 100;
    }

    // ==========================================
    // SEÇÃO 5: UTILITÁRIOS
    // ==========================================

    /**
     * Obtém valor de uma conta usando notação de ponto
     * @param {Object} dre - Objeto DRE
     * @param {string} caminho - Caminho da conta (ex: 'receitaBruta.vendasProdutos')
     * @returns {number|null}
     */
    obterValorConta(dre, caminho) {
        const partes = caminho.split('.');
        let valor = dre;

        for (const parte of partes) {
            if (valor && typeof valor === 'object') {
                valor = valor[parte];
            } else {
                return null;
            }
        }

        return typeof valor === 'number' ? valor : null;
    }

    /**
     * Define valor de uma conta usando notação de ponto
     * @param {Object} dre - Objeto DRE
     * @param {string} caminho - Caminho da conta
     * @param {number} valor - Novo valor
     */
    setarValorConta(dre, caminho, valor) {
        const partes = caminho.split('.');
        let obj = dre;

        for (let i = 0; i < partes.length - 1; i++) {
            if (!obj[partes[i]]) {
                obj[partes[i]] = {};
            }
            obj = obj[partes[i]];
        }

        obj[partes[partes.length - 1]] = valor;
    }
}

// Exportar para uso global
if (typeof window !== 'undefined') {
    window.CalculadorAnaliseDRE = CalculadorAnaliseDRE;
}
