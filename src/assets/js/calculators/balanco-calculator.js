/**
 * balanco-calculator.js
 * Calculador de Análises de Balanços Históricos
 *
 * Adaptado para CreditScore Pro a partir do mapeador-projetos
 *
 * Implementa:
 * - Análise Horizontal (AH): variações período a período + CAGR
 * - Análise Vertical (AV): composição % sobre total ativo
 * - Indicadores Financeiros: 11 indicadores × 4 períodos
 * - Sistema de Alertas: validações e warnings
 *
 * Princípios:
 * - NO FALLBACKS: throw error se dados críticos ausentes
 * - NO HARDCODED DATA: thresholds carregados de config
 * - EXPLICIT VALIDATION: validações rigorosas
 * - TODAS AS CONTAS: 68 contas analisadas (40 inputs + 28 calculadas)
 *
 * @version 1.0.0
 * @date 2025-10-22
 */

class CalculadorAnaliseBalancos {
    constructor(config = null) {
        console.log('📊 CalculadorAnaliseBalancos inicializado');

        // Estrutura completa de 68 contas
        this.estruturaContas = this.definirEstruturaContas();

        // Config externa (parâmetros + thresholds)
        this.config = config;
        this.parametros = null;
        this.thresholds = null;
    }

    /**
     * Carrega configurações de arquivo JSON
     *
     * @param {string} configPath - Caminho para arquivo config
     * @returns {Promise<void>}
     */
    async carregarConfig(configPath = '/config/analise-balancos-config.json') {
        try {
            const response = await fetch(configPath);
            if (!response.ok) {
                throw new Error(`Erro ao carregar config: ${response.statusText}`);
            }

            const config = await response.json();
            this.config = config;
            this.parametros = config.parametros;
            this.thresholds = config.thresholds;

            console.log('✓ Config carregada:', configPath);
            console.log('  - Parâmetros de indicadores:', Object.keys(this.parametros).length);
            console.log('  - Thresholds de tendências:', Object.keys(this.thresholds).length);
        } catch (error) {
            console.error('✗ Erro ao carregar config:', error);
            throw new Error(
                'CalculadorAnaliseBalancos requer arquivo de configuração. ' +
                `Esperado em: ${configPath}`
            );
        }
    }

    /**
     * Define configurações manualmente (alternativa ao carregarConfig)
     *
     * @param {Object} parametros - Parâmetros de indicadores
     * @param {Object} thresholds - Thresholds de tendências
     */
    definirConfig(parametros, thresholds) {
        if (!parametros || typeof parametros !== 'object') {
            throw new Error('CalculadorAnaliseBalancos: parametros é obrigatório');
        }

        if (!thresholds || typeof thresholds !== 'object') {
            throw new Error('CalculadorAnaliseBalancos: thresholds é obrigatório');
        }

        this.parametros = parametros;
        this.thresholds = thresholds;

        console.log('✓ Config definida manualmente');
    }

    /**
     * Valida que configurações foram carregadas
     *
     * @throws {Error} Se config não definida
     */
    validarConfig() {
        if (!this.parametros || !this.thresholds) {
            throw new Error(
                'CalculadorAnaliseBalancos: configurações não carregadas. ' +
                'Execute carregarConfig() ou definirConfig() antes de usar.'
            );
        }
    }

    // ========================================
    // 1. ESTRUTURA DE CONTAS (68 contas)
    // ========================================

    /**
     * Define estrutura completa do balanço patrimonial
     *
     * @returns {Object} Estrutura hierárquica de 68 contas
     */
    definirEstruturaContas() {
        return {
            ativoCirculante: {
                nome: 'ATIVO CIRCULANTE',
                contas: [
                    { id: 'caixa', nome: 'Caixa', grupo: 'disponibilidades' },
                    { id: 'bancos', nome: 'Bancos', grupo: 'disponibilidades' },
                    { id: 'aplicacoes', nome: 'Aplicações Financeiras', grupo: 'disponibilidades' },
                    { id: 'disponibilidadesTotal', nome: 'Total Disponibilidades', tipo: 'subtotal', grupo: 'disponibilidades' },

                    { id: 'contasReceber', nome: 'Contas a Receber', grupo: 'contasReceber' },
                    { id: 'pdd', nome: '(-) Provisão Devedores Duvidosos', grupo: 'contasReceber' },
                    { id: 'contasReceberLiquido', nome: 'Contas a Receber Líquido', tipo: 'subtotal', grupo: 'contasReceber' },

                    { id: 'estoqueMP', nome: 'Estoque Matéria-Prima', grupo: 'estoques' },
                    { id: 'estoqueWIP', nome: 'Estoque WIP (Em Processamento)', grupo: 'estoques' },
                    { id: 'estoqueProdAcabados', nome: 'Estoque Produtos Acabados', grupo: 'estoques' },
                    { id: 'estoquePecasReposicao', nome: 'Estoque Peças Reposição', grupo: 'estoques' },
                    { id: 'estoquesTotal', nome: 'Total Estoques', tipo: 'subtotal', grupo: 'estoques' },

                    { id: 'impostosRecuperar', nome: 'Impostos a Recuperar', grupo: 'outros' },
                    { id: 'adiantamentosFornecedores', nome: 'Adiantamentos a Fornecedores', grupo: 'outros' },
                    { id: 'outrosAC', nome: 'Outros Ativos Circulantes', grupo: 'outros' },

                    { id: 'ativoCirculanteTotal', nome: 'TOTAL ATIVO CIRCULANTE', tipo: 'total' }
                ]
            },

            ativoNaoCirculante: {
                nome: 'ATIVO NÃO CIRCULANTE',
                grupos: {
                    realizavelLP: {
                        nome: 'Realizável Longo Prazo',
                        contas: [
                            { id: 'titulosReceberLP', nome: 'Títulos a Receber LP' },
                            { id: 'depositosJudiciais', nome: 'Depósitos Judiciais' },
                            { id: 'outrosCreditosLP', nome: 'Outros Créditos LP' },
                            { id: 'realizavelLPTotal', nome: 'Total Realizável LP', tipo: 'subtotal' }
                        ]
                    },
                    investimentos: {
                        nome: 'Investimentos',
                        contas: [
                            { id: 'participacoesSocietarias', nome: 'Participações Societárias' },
                            { id: 'outrosInvestimentos', nome: 'Outros Investimentos' },
                            { id: 'investimentosTotal', nome: 'Total Investimentos', tipo: 'subtotal' }
                        ]
                    },
                    imobilizado: {
                        nome: 'Imobilizado',
                        contas: [
                            { id: 'terrenos', nome: 'Terrenos' },
                            { id: 'edificacoes', nome: 'Edificações' },
                            { id: 'maquinasEquipamentos', nome: 'Máquinas e Equipamentos' },
                            { id: 'veiculos', nome: 'Veículos' },
                            { id: 'moveisUtensilios', nome: 'Móveis e Utensílios' },
                            { id: 'equipamentosInformatica', nome: 'Equipamentos de Informática' },
                            { id: 'imobilizadoAndamento', nome: 'Imobilizado em Andamento' },
                            { id: 'imobilizadoBruto', nome: 'Imobilizado Bruto', tipo: 'subtotal' },
                            { id: 'depreciacaoAcumulada', nome: '(-) Depreciação Acumulada' },
                            { id: 'imobilizadoLiquido', nome: 'Imobilizado Líquido', tipo: 'subtotal' }
                        ]
                    },
                    intangivel: {
                        nome: 'Intangível',
                        contas: [
                            { id: 'software', nome: 'Software' },
                            { id: 'marcasPatentes', nome: 'Marcas e Patentes' },
                            { id: 'goodwill', nome: 'Goodwill' },
                            { id: 'intangivelBruto', nome: 'Intangível Bruto', tipo: 'subtotal' },
                            { id: 'amortizacaoAcumulada', nome: '(-) Amortização Acumulada' },
                            { id: 'intangivelLiquido', nome: 'Intangível Líquido', tipo: 'subtotal' }
                        ]
                    }
                },
                total: { id: 'ativoNaoCirculanteTotal', nome: 'TOTAL ATIVO NÃO CIRCULANTE', tipo: 'total' }
            },

            passivoCirculante: {
                nome: 'PASSIVO CIRCULANTE',
                contas: [
                    { id: 'fornecedores', nome: 'Fornecedores' },
                    { id: 'emprestimosCP', nome: 'Empréstimos Curto Prazo' },
                    { id: 'financiamentosCP', nome: 'Financiamentos Curto Prazo' },
                    { id: 'salariosPagar', nome: 'Salários a Pagar' },
                    { id: 'encargosSociaisPagar', nome: 'Encargos Sociais a Pagar' },
                    { id: 'impostosPagar', nome: 'Impostos a Pagar' },
                    { id: 'dividendosPagar', nome: 'Dividendos a Pagar' },
                    { id: 'adiantamentosClientes', nome: 'Adiantamentos de Clientes' },
                    { id: 'provisoesDiversas', nome: 'Provisões Diversas' },
                    { id: 'outrosPC', nome: 'Outros Passivos Circulantes' },
                    { id: 'passivoCirculanteTotal', nome: 'TOTAL PASSIVO CIRCULANTE', tipo: 'total' }
                ]
            },

            passivoNaoCirculante: {
                nome: 'PASSIVO NÃO CIRCULANTE',
                contas: [
                    { id: 'emprestimosLP', nome: 'Empréstimos Longo Prazo' },
                    { id: 'financiamentosLP', nome: 'Financiamentos Longo Prazo' },
                    { id: 'debentures', nome: 'Debêntures' },
                    { id: 'provisoesTrabalhistas', nome: 'Provisões Trabalhistas' },
                    { id: 'provisoesFiscais', nome: 'Provisões Fiscais' },
                    { id: 'outrosPNC', nome: 'Outros Passivos Não Circulantes' },
                    { id: 'passivoNaoCirculanteTotal', nome: 'TOTAL PASSIVO NÃO CIRCULANTE', tipo: 'total' }
                ]
            },

            patrimonioLiquido: {
                nome: 'PATRIMÔNIO LÍQUIDO',
                contas: [
                    { id: 'capitalSocial', nome: 'Capital Social' },
                    { id: 'reservaCapital', nome: 'Reserva de Capital' },
                    { id: 'reservaLucros', nome: 'Reserva de Lucros' },
                    { id: 'reservaLegal', nome: 'Reserva Legal' },
                    { id: 'lucrosAcumulados', nome: 'Lucros Acumulados' },
                    { id: 'acoesTesouraria', nome: '(-) Ações em Tesouraria' },
                    { id: 'patrimonioLiquidoTotal', nome: 'TOTAL PATRIMÔNIO LÍQUIDO', tipo: 'total' }
                ]
            },

            totais: {
                nome: 'TOTAIS',
                contas: [
                    { id: 'ativoTotal', nome: 'TOTAL ATIVO', tipo: 'total_principal' },
                    { id: 'passivoTotal', nome: 'TOTAL PASSIVO', tipo: 'total_principal' },
                    { id: 'passivoPLTotal', nome: 'TOTAL PASSIVO + PL', tipo: 'total_principal' }
                ]
            }
        };
    }

    // ========================================
    // 2. ANÁLISE HORIZONTAL (TODAS AS 68 CONTAS)
    // ========================================

    /**
     * Calcula Análise Horizontal para TODAS as contas
     *
     * @param {Array<Object>} balancos - 4 períodos de balanço
     * @returns {Object} Análise horizontal completa
     * @throws {Error} Se balancos.length !== 4
     */
    calcularAnaliseHorizontal(balancos) {
        // Validar 4 períodos
        if (!balancos || balancos.length !== 4) {
            throw new Error(
                `CalculadorAnaliseBalancos: esperado 4 períodos, recebido ${balancos?.length || 0}`
            );
        }

        console.log('[AH] Calculando análise horizontal para 68 contas...');

        const ah = {};
        let contasProcessadas = 0;

        // Iterar por TODAS as categorias e contas
        this.iterarTodasContas((conta, categoria, subcategoria) => {
            ah[conta.id] = this.calcularVariacoesConta(balancos, conta.id, conta.nome);
            contasProcessadas++;
        });

        console.log(`✓ [AH] ${contasProcessadas} contas processadas`);
        return ah;
    }

    /**
     * Calcula variações para uma conta específica
     *
     * @param {Array<Object>} balancos - 4 períodos
     * @param {string} contaId - ID da conta
     * @param {string} contaNome - Nome da conta
     * @returns {Object} Variações e CAGR
     */
    calcularVariacoesConta(balancos, contaId, contaNome) {
        const valores = balancos.map(b => {
            const valor = b[contaId];

            // NO FALLBACKS: retornar exatamente o que está no objeto
            // null/undefined são valores válidos (conta sem saldo)
            if (valor === undefined) {
                return null;
            }

            return valor;
        });

        return {
            nome: contaNome,
            valores: valores,
            p2_vs_p1: this.calcularVariacao(valores[0], valores[1]),
            p3_vs_p2: this.calcularVariacao(valores[1], valores[2]),
            p4_vs_p3: this.calcularVariacao(valores[2], valores[3]),
            cagr: this.calcularCAGR(valores[0], valores[2], 2) // 2 anos (p1 → p3)
        };
    }

    /**
     * Calcula variação entre dois períodos
     *
     * @param {number} valorBase - Valor período base
     * @param {number} valorNovo - Valor período novo
     * @returns {Object} { valor, percentual }
     */
    calcularVariacao(valorBase, valorNovo) {
        // NO FALLBACKS: se qualquer valor for null/undefined, retornar null
        if (valorBase === null || valorBase === undefined ||
            valorNovo === null || valorNovo === undefined) {
            return { valor: null, percentual: null };
        }

        // Se base é zero, retornar null (divisão por zero)
        if (valorBase === 0) {
            return { valor: null, percentual: null };
        }

        const valor = valorNovo - valorBase;
        const percentual = ((valorNovo / valorBase) - 1) * 100;

        return {
            valor: valor,
            percentual: percentual
        };
    }

    /**
     * Calcula CAGR (Compound Annual Growth Rate)
     *
     * @param {number} valorInicial - Valor inicial
     * @param {number} valorFinal - Valor final
     * @param {number} anos - Número de anos
     * @returns {number|null} CAGR em %
     */
    calcularCAGR(valorInicial, valorFinal, anos) {
        // NO FALLBACKS: validar todos os inputs
        if (valorInicial === null || valorInicial === undefined ||
            valorFinal === null || valorFinal === undefined) {
            return null;
        }

        if (valorInicial === 0) {
            return null; // Divisão por zero
        }

        // Ambos negativos: calcular sobre valores absolutos
        if (valorInicial < 0 && valorFinal < 0) {
            const cagrAbs = (Math.pow(Math.abs(valorFinal) / Math.abs(valorInicial), 1 / anos) - 1) * 100;
            return valorFinal > valorInicial ? cagrAbs : -cagrAbs;
        }

        // Um positivo, outro negativo: sem sentido matemático
        if (valorInicial < 0 || valorFinal < 0) {
            return null;
        }

        return (Math.pow(valorFinal / valorInicial, 1 / anos) - 1) * 100;
    }

    // ========================================
    // 3. ANÁLISE VERTICAL (TODAS AS 68 CONTAS)
    // ========================================

    /**
     * Calcula Análise Vertical para TODAS as contas
     *
     * @param {Array<Object>} balancos - 4 períodos de balanço
     * @returns {Array<Object>} Análise vertical por período
     */
    calcularAnaliseVertical(balancos) {
        if (!balancos || balancos.length !== 4) {
            throw new Error(
                `CalculadorAnaliseBalancos: esperado 4 períodos, recebido ${balancos?.length || 0}`
            );
        }

        console.log('[AV] Calculando análise vertical para 68 contas...');

        const av = balancos.map((balanco, index) => {
            const ativoTotal = balanco.ativoTotal;

            // NO FALLBACKS: se ativoTotal ausente, throw error
            if (ativoTotal === null || ativoTotal === undefined) {
                throw new Error(
                    `[AV] Período ${index + 1}: ativoTotal é obrigatório para análise vertical`
                );
            }

            if (ativoTotal === 0) {
                throw new Error(
                    `[AV] Período ${index + 1}: ativoTotal não pode ser zero`
                );
            }

            const periodo = {
                numeroPeriodo: index + 1,
                data: balanco.data,
                totalAtivo: ativoTotal
            };

            let contasProcessadas = 0;

            // Para cada conta, calcular % sobre total ativo
            this.iterarTodasContas((conta) => {
                periodo[conta.id] = this.calcularPercentualVertical(
                    balanco[conta.id],
                    ativoTotal
                );
                contasProcessadas++;
            });

            if (index === 0) {
                console.log(`✓ [AV] ${contasProcessadas} contas por período`);
            }

            // Aliases para compatibilidade (ponteiros, não duplicam dados)
            periodo.ativoCirculante = periodo.ativoCirculanteTotal;
            periodo.ativoNaoCirculante = periodo.ativoNaoCirculanteTotal;
            periodo.passivoCirculante = periodo.passivoCirculanteTotal;
            periodo.passivoNaoCirculante = periodo.passivoNaoCirculanteTotal;
            periodo.patrimonioLiquido = periodo.patrimonioLiquidoTotal;

            return periodo;
        });

        console.log(`✓ [AV] 4 períodos processados`);
        return av;
    }

    /**
     * Calcula percentual vertical de uma conta
     *
     * @param {number} valorConta - Valor da conta
     * @param {number} totalAtivo - Total do ativo
     * @returns {Object} { valor, percentual }
     */
    calcularPercentualVertical(valorConta, totalAtivo) {
        // NO FALLBACKS: totalAtivo já validado no método pai
        // valorConta pode ser null/undefined (conta sem saldo)

        if (valorConta === null || valorConta === undefined) {
            return { valor: null, percentual: null };
        }

        return {
            valor: valorConta,
            percentual: (valorConta / totalAtivo) * 100
        };
    }

    // ========================================
    // 4. INDICADORES FINANCEIROS (11 indicadores × 4 períodos)
    // ========================================

    /**
     * Calcula 11 indicadores financeiros para 4 períodos
     *
     * @param {Array<Object>} balancos - 4 períodos de balanço
     * @returns {Object} Indicadores por tipo
     */
    calcularIndicadores(balancos) {
        // Validar config carregada
        this.validarConfig();

        if (!balancos || balancos.length !== 4) {
            throw new Error(
                `CalculadorAnaliseBalancos: esperado 4 períodos, recebido ${balancos?.length || 0}`
            );
        }

        console.log('[Indicadores] Calculando 11 indicadores para 4 períodos...');

        const indicadores = {
            // Liquidez (4 indicadores)
            liquidezCorrente: [],
            liquidezSeca: [],
            liquidezImediata: [],
            liquidezGeral: [],

            // Endividamento (4 indicadores)
            endividamentoGeral: [],
            endividamentoLP: [],
            composicaoEndiv: [],
            garantiaCapitalProprio: [],

            // Estrutura (3 indicadores)
            participacaoCapitalTerceiros: [],
            imobilizacaoPatrimonio: [],
            imobilizacaoRecursos: [],

            // Novos Indicadores (Fase 1 - Melhorias)
            inadimplenciaClientes: [],
            inadimplenciaFornecedores: [],
            evolucaoPatrimonial: [],

        };

        balancos.forEach((balanco, index) => {
            // LIQUIDEZ
            indicadores.liquidezCorrente.push(
                this.calcularIndicadorComStatus(
                    'liquidezCorrente',
                    this.calcularLiquidezCorrente(balanco),
                    index === 3
                )
            );

            indicadores.liquidezSeca.push(
                this.calcularIndicadorComStatus(
                    'liquidezSeca',
                    this.calcularLiquidezSeca(balanco),
                    index === 3
                )
            );

            indicadores.liquidezImediata.push(
                this.calcularIndicadorComStatus(
                    'liquidezImediata',
                    this.calcularLiquidezImediata(balanco),
                    index === 3
                )
            );

            indicadores.liquidezGeral.push(
                this.calcularIndicadorComStatus(
                    'liquidezGeral',
                    this.calcularLiquidezGeral(balanco),
                    index === 3
                )
            );

            // ENDIVIDAMENTO
            indicadores.endividamentoGeral.push(
                this.calcularIndicadorComStatus(
                    'endividamentoGeral',
                    this.calcularEndividamentoGeral(balanco),
                    index === 3
                )
            );

            indicadores.endividamentoLP.push(
                this.calcularIndicadorComStatus(
                    'endividamentoLP',
                    this.calcularEndividamentoLP(balanco),
                    index === 3
                )
            );

            indicadores.composicaoEndiv.push(
                this.calcularIndicadorComStatus(
                    'composicaoEndiv',
                    this.calcularComposicaoEndividamento(balanco),
                    index === 3
                )
            );

            indicadores.garantiaCapitalProprio.push(
                this.calcularIndicadorComStatus(
                    'garantiaCapitalProprio',
                    this.calcularGarantiaCapitalProprio(balanco),
                    index === 3
                )
            );

            // ESTRUTURA
            indicadores.participacaoCapitalTerceiros.push(
                this.calcularIndicadorComStatus(
                    'participacaoCapitalTerceiros',
                    this.calcularParticipacaoCapitalTerceiros(balanco),
                    index === 3
                )
            );

            indicadores.imobilizacaoPatrimonio.push(
                this.calcularIndicadorComStatus(
                    'imobilizacaoPatrimonio',
                    this.calcularImobilizacaoPatrimonio(balanco),
                    index === 3
                )
            );

            indicadores.imobilizacaoRecursos.push(
                this.calcularIndicadorComStatus(
                    'imobilizacaoRecursos',
                    this.calcularImobilizacaoRecursos(balanco),
                    index === 3
                )
            );

            // NOVOS INDICADORES
            indicadores.inadimplenciaClientes.push(
                this.calcularIndicadorComStatus(
                    'inadimplenciaClientes',
                    this.calcularInadimplencia(balanco.contasReceber90d, balanco.contasReceber),
                    index === 3
                )
            );

            indicadores.inadimplenciaFornecedores.push(
                this.calcularIndicadorComStatus(
                    'inadimplenciaFornecedores',
                    this.calcularInadimplencia(balanco.contasPagar90d, balanco.fornecedores),
                    index === 3
                )
            );

            if (index > 0) {
                indicadores.evolucaoPatrimonial.push(
                    this.calcularIndicadorComStatus(
                        'evolucaoPatrimonial',
                        this.calcularEvolucaoPatrimonial(balancos[index - 1].patrimonioLiquidoTotal, balanco.patrimonioLiquidoTotal),
                        index === 3
                    )
                );
            }
        });

        // Adicionar tendências ao último período
        Object.keys(indicadores).forEach(tipo => {
            const valores = indicadores[tipo].map(ind => ind.valor);
            indicadores[tipo][3].tendencia = this.identificarTendencia(valores, tipo);
        });

        console.log('✓ [Indicadores] 14 indicadores × 4 períodos calculados');
        return indicadores;
    }

    // ========================================
    // 4.1 INDICADORES DE LIQUIDEZ
    // ========================================

    calcularLiquidezCorrente(balanco) {
        const ac = balanco.ativoCirculanteTotal;
        const pc = balanco.passivoCirculanteTotal;

        // NO FALLBACKS: validar dados críticos
        if (ac === null || ac === undefined) {
            throw new Error('ativoCirculanteTotal obrigatório para Liquidez Corrente');
        }

        if (pc === null || pc === undefined) {
            throw new Error('passivoCirculanteTotal obrigatório para Liquidez Corrente');
        }

        if (pc === 0) {
            return null; // Divisão por zero
        }

        return ac / pc;
    }

    calcularLiquidezSeca(balanco) {
        const ac = balanco.ativoCirculanteTotal;
        const estoques = balanco.estoquesTotal;
        const pc = balanco.passivoCirculanteTotal;

        if (ac === null || ac === undefined) {
            throw new Error('ativoCirculanteTotal obrigatório para Liquidez Seca');
        }

        if (pc === null || pc === undefined) {
            throw new Error('passivoCirculanteTotal obrigatório para Liquidez Seca');
        }

        if (pc === 0) {
            return null;
        }

        // Estoques pode ser null (sem estoque)
        const estoquesValor = estoques !== null && estoques !== undefined ? estoques : 0;

        return (ac - estoquesValor) / pc;
    }

    calcularLiquidezImediata(balanco) {
        const disponibilidades = balanco.disponibilidadesTotal;
        const pc = balanco.passivoCirculanteTotal;

        if (disponibilidades === null || disponibilidades === undefined) {
            throw new Error('disponibilidadesTotal obrigatório para Liquidez Imediata');
        }

        if (pc === null || pc === undefined) {
            throw new Error('passivoCirculanteTotal obrigatório para Liquidez Imediata');
        }

        if (pc === 0) {
            return null;
        }

        return disponibilidades / pc;
    }

    calcularLiquidezGeral(balanco) {
        const ac = balanco.ativoCirculanteTotal;
        const anc = balanco.ativoNaoCirculanteTotal;
        const pc = balanco.passivoCirculanteTotal;
        const pnc = balanco.passivoNaoCirculanteTotal;

        if (ac === null || ac === undefined) {
            throw new Error('ativoCirculanteTotal obrigatório para Liquidez Geral');
        }

        if (anc === null || anc === undefined) {
            throw new Error('ativoNaoCirculanteTotal obrigatório para Liquidez Geral');
        }

        if (pc === null || pc === undefined) {
            throw new Error('passivoCirculanteTotal obrigatório para Liquidez Geral');
        }

        if (pnc === null || pnc === undefined) {
            throw new Error('passivoNaoCirculanteTotal obrigatório para Liquidez Geral');
        }

        const totalPassivos = pc + pnc;
        if (totalPassivos === 0) {
            return null;
        }

        return (ac + anc) / totalPassivos;
    }

    // ========================================
    // 4.2 INDICADORES DE ENDIVIDAMENTO
    // ========================================

    calcularEndividamentoGeral(balanco) {
        const pc = balanco.passivoCirculanteTotal;
        const pnc = balanco.passivoNaoCirculanteTotal;
        const ativoTotal = balanco.ativoTotal;

        if (pc === null || pc === undefined ||
            pnc === null || pnc === undefined ||
            ativoTotal === null || ativoTotal === undefined) {
            throw new Error('Passivos e ativoTotal obrigatórios para Endividamento Geral');
        }

        if (ativoTotal === 0) {
            return null;
        }

        return ((pc + pnc) / ativoTotal) * 100;
    }

    calcularEndividamentoLP(balanco) {
        const pnc = balanco.passivoNaoCirculanteTotal;
        const ativoTotal = balanco.ativoTotal;

        if (pnc === null || pnc === undefined ||
            ativoTotal === null || ativoTotal === undefined) {
            throw new Error('PNC e ativoTotal obrigatórios para Endividamento LP');
        }

        if (ativoTotal === 0) {
            return null;
        }

        return (pnc / ativoTotal) * 100;
    }

    calcularComposicaoEndividamento(balanco) {
        const pc = balanco.passivoCirculanteTotal;
        const pnc = balanco.passivoNaoCirculanteTotal;

        if (pc === null || pc === undefined ||
            pnc === null || pnc === undefined) {
            throw new Error('PC e PNC obrigatórios para Composição Endividamento');
        }

        const totalPassivos = pc + pnc;
        if (totalPassivos === 0) {
            return null;
        }

        return (pc / totalPassivos) * 100;
    }

    calcularGarantiaCapitalProprio(balanco) {
        const pl = balanco.patrimonioLiquidoTotal;
        const ativoTotal = balanco.ativoTotal;

        if (pl === null || pl === undefined ||
            ativoTotal === null || ativoTotal === undefined) {
            throw new Error('PL e ativoTotal obrigatórios para Garantia Capital Próprio');
        }

        if (ativoTotal === 0) {
            return null;
        }

        return (pl / ativoTotal) * 100;
    }

    // ========================================
    // 4.3 INDICADORES DE ESTRUTURA
    // ========================================

    calcularParticipacaoCapitalTerceiros(balanco) {
        const pc = balanco.passivoCirculanteTotal;
        const pnc = balanco.passivoNaoCirculanteTotal;
        const pl = balanco.patrimonioLiquidoTotal;

        if (pc === null || pc === undefined ||
            pnc === null || pnc === undefined ||
            pl === null || pl === undefined) {
            throw new Error('PC, PNC e PL obrigatórios para Participação Capital Terceiros');
        }

        if (pl === 0) {
            return null;
        }

        return ((pc + pnc) / pl) * 100;
    }

    calcularImobilizacaoPatrimonio(balanco) {
        const anc = balanco.ativoNaoCirculanteTotal;
        const pl = balanco.patrimonioLiquidoTotal;

        if (anc === null || anc === undefined ||
            pl === null || pl === undefined) {
            throw new Error('ANC e PL obrigatórios para Imobilização Patrimônio');
        }

        if (pl === 0) {
            return null;
        }

        return (anc / pl) * 100;
    }

    calcularImobilizacaoRecursos(balanco) {
        const anc = balanco.ativoNaoCirculanteTotal;
        const pl = balanco.patrimonioLiquidoTotal;
        const pnc = balanco.passivoNaoCirculanteTotal;

        if (anc === null || anc === undefined ||
            pl === null || pl === undefined ||
            pnc === null || pnc === undefined) {
            throw new Error('ANC, PL e PNC obrigatórios para Imobilização Recursos');
        }

        const recursosNaoCorrente = pl + pnc;
        if (recursosNaoCorrente === 0) {
            return null;
        }

        return (anc / recursosNaoCorrente) * 100;
    }

    // ========================================
    // 4.3.1 NOVOS INDICADORES (FASE 1)
    // ========================================

    /**
     * Calcula o percentual de inadimplência (> 90 dias).
     * @param {number} valor90d - Valor vencido há mais de 90 dias.
     * @param {number} valorTotal - Valor total da conta (Contas a Receber ou Fornecedores).
     * @returns {number|null} Percentual de inadimplência.
     */
    calcularInadimplencia(valor90d, valorTotal) {
        if (valorTotal === null || valorTotal === undefined || valorTotal === 0 || valor90d === null || valor90d === undefined) {
            return null; // Retorna nulo se não houver dívida ou dados
        }
        return (valor90d / valorTotal) * 100;
    }

    /**
     * Calcula a evolução percentual do Patrimônio Líquido.
     * @param {number} plAnterior - Patrimônio Líquido do período anterior.
     * @param {number} plAtual - Patrimônio Líquido do período atual.
     * @returns {number|null} Variação percentual do PL.
     */
    calcularEvolucaoPatrimonial(plAnterior, plAtual) {
        if (plAnterior === null || plAnterior === undefined || plAnterior === 0 || plAtual === null || plAtual === undefined) {
            return null;
        }

        return ((plAtual / plAnterior) - 1) * 100;
    }

    // ========================================
    // 4.4 CLASSIFICAÇÃO E STATUS
    // ========================================

    /**
     * Calcula indicador com classificação e emoji
     *
     * @param {string} tipo - Tipo do indicador
     * @param {number} valor - Valor calculado
     * @param {boolean} isUltimo - Se é o último período
     * @returns {Object} { valor, status, emoji, classificacao }
     */
    calcularIndicadorComStatus(tipo, valor, isUltimo = false) {
        if (valor === null || valor === undefined) {
            return {
                valor: null,
                status: '⚪',
                emoji: '⚪',
                classificacao: 'Sem dados',
                tendencia: null
            };
        }

        const classificacao = this.classificarIndicador(tipo, valor);

        return {
            valor: valor,
            status: classificacao.emoji,
            emoji: classificacao.emoji,
            classificacao: classificacao.label,
            tendencia: isUltimo ? null : undefined
        };
    }

    /**
     * Classifica indicador conforme parâmetros (CARREGADOS DE CONFIG)
     *
     * @param {string} tipo - Tipo do indicador
     * @param {number} valor - Valor do indicador
     * @returns {Object} { emoji, label }
     */
    classificarIndicador(tipo, valor) {
        const params = this.parametros[tipo];

        if (!params) {
            console.warn(`Parâmetro não definido para: ${tipo}`);
            return { emoji: '⚪', label: 'Sem parâmetro' };
        }

        // Testar em ordem: bom → atenção → crítico
        if (params.bom) {
            if (params.bom.min !== undefined && params.bom.max !== undefined) {
                if (valor >= params.bom.min && valor <= params.bom.max) {
                    return params.bom;
                }
            } else if (params.bom.min !== undefined && valor >= params.bom.min) {
                return params.bom;
            } else if (params.bom.max !== undefined && valor <= params.bom.max) {
                return params.bom;
            }
        }

        if (params.atencao) {
            if (params.atencao.min !== undefined && params.atencao.max !== undefined) {
                if (valor >= params.atencao.min && valor <= params.atencao.max) {
                    return params.atencao;
                }
            } else if (params.atencao.min !== undefined && valor >= params.atencao.min) {
                return params.atencao;
            } else if (params.atencao.max !== undefined && valor <= params.atencao.max) {
                return params.atencao;
            }
        }

        return params.critico ? params.critico : { emoji: '🔴', label: 'Crítico' };
    }

    /**
     * Identifica tendência comparando últimos 2 períodos
     * Threshold carregado de config
     *
     * @param {Array<number>} valores - Array com 4 valores
     * @param {string} tipo - Tipo do indicador
     * @returns {string} '↗' | '→' | '↘'
     */
    identificarTendencia(valores, tipo) {
        const penultimo = valores[2];
        const ultimo = valores[3];

        if (penultimo === null || ultimo === null) {
            return '→';
        }

        const variacao = ultimo - penultimo;
        const threshold = this.obterThresholdTendencia(tipo);

        if (Math.abs(variacao) < threshold) {
            return '→'; // Estável
        }

        // Tipos onde crescimento é positivo
        const tiposLiquidez = [
            'liquidezCorrente', 'liquidezSeca', 'liquidezImediata',
            'liquidezGeral', 'garantiaCapitalProprio',
            'evolucaoPatrimonial'
        ];

        if (tiposLiquidez.includes(tipo)) {
            return variacao > 0 ? '↗' : '↘';
        } else {
            // Endividamento e estrutura: crescimento é negativo
            return variacao > 0 ? '↘' : '↗';
        }
    }

    /**
     * Obtém threshold de config (NÃO HARDCODED)
     *
     * @param {string} tipo - Tipo do indicador
     * @returns {number} Threshold
     * @throws {Error} Se threshold não definido em config
     */
    obterThresholdTendencia(tipo) {
        if (!this.thresholds || !this.thresholds[tipo]) {
            throw new Error(
                `Threshold não definido em config para: ${tipo}. ` +
                `Adicionar em config.thresholds.${tipo}`
            );
        }

        return this.thresholds[tipo];
    }

    // ========================================
    // 5. SISTEMA DE ALERTAS E VALIDAÇÕES
    // ========================================

    /**
     * Valida equilíbrio contábil para cada período
     *
     * @param {Array<Object>} balancos - 4 períodos
     * @throws {Error} Se algum período desequilibrado
     */
    validarEquilibrioPorPeriodo(balancos) {
        console.log('[Validação] Verificando equilíbrio contábil de 4 períodos...');

        balancos.forEach((balanco, index) => {
            const ativoTotal = balanco.ativoTotal;
            const passivoPLTotal = balanco.passivoPLTotal;

            // NO FALLBACKS: exigir valores
            if (ativoTotal === null || ativoTotal === undefined) {
                throw new Error(`Período ${index + 1}: ativoTotal ausente`);
            }

            if (passivoPLTotal === null || passivoPLTotal === undefined) {
                throw new Error(`Período ${index + 1}: passivoPLTotal ausente`);
            }

            const diferenca = Math.abs(ativoTotal - passivoPLTotal);

            // Tolerância de R$ 0,01
            if (diferenca > 0.01) {
                throw new Error(
                    `Período ${index + 1} (${balanco.data || 'sem data'}) desequilibrado:\n` +
                    `Ativo Total: R$ ${ativoTotal.toFixed(2)}\n` +
                    `Passivo + PL: R$ ${passivoPLTotal.toFixed(2)}\n` +
                    `Diferença: R$ ${diferenca.toFixed(2)}`
                );
            }
        });

        console.log('✓ [Validação] Todos os 4 períodos equilibrados');
    }

    /**
     * Gera alertas baseados em indicadores críticos
     *
     * @param {Object} indicadores - Indicadores calculados
     * @returns {Array<Object>} Lista de alertas
     */
    gerarAlertas(indicadores) {
        console.log('[Alertas] Gerando alertas de indicadores críticos...');

        const alertas = [];

        Object.keys(indicadores).forEach(tipo => {
            indicadores[tipo].forEach((ind, periodo) => {
                // Alerta se crítico
                if (ind.emoji === '🔴') {
                    alertas.push({
                        tipo: 'critico',
                        indicador: this.getNomeIndicador(tipo),
                        periodo: periodo + 1,
                        valor: ind.valor,
                        classificacao: ind.classificacao,
                        mensagem: this.gerarMensagemAlerta(tipo, ind.valor, periodo + 1)
                    });
                }

                // Alerta se tendência negativa persistente
                if (periodo === 3 && ind.tendencia === '↘') {
                    const tendencias = indicadores[tipo].map((i, idx) =>
                        idx > 0 ? this.identificarTendencia(
                            indicadores[tipo].map(x => x.valor).slice(0, idx + 1),
                            tipo
                        ) : null
                    ).filter(t => t);

                    const piorasConsecutivas = tendencias.filter(t => t === '↘').length;

                    if (piorasConsecutivas >= 2) {
                        alertas.push({
                            tipo: 'tendencia',
                            indicador: this.getNomeIndicador(tipo),
                            mensagem: `Deterioração persistente: ${piorasConsecutivas + 1} períodos consecutivos com piora`
                        });
                    }
                }
            });
        });

        console.log(`✓ [Alertas] ${alertas.length} alertas gerados`);
        return alertas;
    }

    /**
     * Obtém nome amigável do indicador
     */
    getNomeIndicador(tipo) {
        const nomes = {
            liquidezCorrente: 'Liquidez Corrente',
            liquidezSeca: 'Liquidez Seca',
            liquidezImediata: 'Liquidez Imediata',
            liquidezGeral: 'Liquidez Geral',
            endividamentoGeral: 'Endividamento Geral',
            endividamentoLP: 'Endividamento Longo Prazo',
            composicaoEndiv: 'Composição do Endividamento',
            garantiaCapitalProprio: 'Garantia do Capital Próprio',
            participacaoCapitalTerceiros: 'Participação de Capital de Terceiros',
            imobilizacaoPatrimonio: 'Imobilização do Patrimônio',
            imobilizacaoRecursos: 'Imobilização de Recursos Não Correntes',
            inadimplenciaClientes: 'Inadimplência de Clientes (> 90d)',
            inadimplenciaFornecedores: 'Inadimplência com Fornecedores (> 90d)',
            evolucaoPatrimonial: 'Evolução do Patrimônio Líquido',
        };

        return nomes[tipo] || tipo;
    }

    /**
     * Gera mensagem descritiva para alerta
     */
    gerarMensagemAlerta(tipo, valor, periodo) {
        const mensagens = {
            liquidezCorrente: `Liquidez corrente crítica (${valor.toFixed(2)}) no período ${periodo}. Empresa pode ter dificuldade para honrar compromissos de curto prazo.`,
            liquidezSeca: `Liquidez seca crítica (${valor.toFixed(2)}) no período ${periodo}. Alto risco sem considerar estoques.`,
            liquidezImediata: `Liquidez imediata crítica (${valor.toFixed(2)}) no período ${periodo}. Disponibilidades insuficientes.`,
            liquidezGeral: `Liquidez geral crítica (${valor.toFixed(2)}) no período ${periodo}. Capacidade de pagamento comprometida no médio/longo prazo.`,
            endividamentoGeral: `Endividamento geral elevado (${valor.toFixed(1)}%) no período ${periodo}. Mais de 70% do ativo financiado por terceiros.`,
            endividamentoLP: `Endividamento de longo prazo elevado (${valor.toFixed(1)}%) no período ${periodo}. Alto comprometimento futuro.`,
            garantiaCapitalProprio: `Garantia do capital próprio frágil (${valor.toFixed(1)}%) no período ${periodo}. Patrimônio líquido representa menos de 30% do ativo.`,
            participacaoCapitalTerceiros: `Participação de capital de terceiros elevada (${valor.toFixed(1)}%) no período ${periodo}. Dependência excessiva de financiamento externo.`,
            imobilizacaoPatrimonio: `Imobilização do patrimônio elevada (${valor.toFixed(1)}%) no período ${periodo}. Mais de 150% do PL investido em ativos não circulantes.`,
            imobilizacaoRecursos: `Imobilização de recursos não correntes elevada (${valor.toFixed(1)}%) no período ${periodo}. Mais de 85% dos recursos de longo prazo imobilizados.`,
            inadimplenciaClientes: `Inadimplência de clientes crítica (${valor.toFixed(1)}%) no período ${periodo}. Risco elevado de perdas.`,
            inadimplenciaFornecedores: `Inadimplência com fornecedores crítica (${valor.toFixed(1)}%) no período ${periodo}. Risco de imagem e operacional.`,
            evolucaoPatrimonial: `Evolução patrimonial negativa (${valor.toFixed(1)}%) no período ${periodo}. Empresa está destruindo valor.`,
        };

        return mensagens[tipo] || `Indicador ${this.getNomeIndicador(tipo)} em situação crítica no período ${periodo}.`;
    }

    // ========================================
    // 6. UTILITÁRIOS
    // ========================================

    /**
     * Itera por todas as 68 contas da estrutura
     */
    iterarTodasContas(callback) {
        const estrutura = this.estruturaContas;

        // Ativo Circulante
        if (estrutura.ativoCirculante && estrutura.ativoCirculante.contas) {
            estrutura.ativoCirculante.contas.forEach(conta => {
                callback(conta, 'ativoCirculante', null);
            });
        }

        // Ativo Não Circulante
        if (estrutura.ativoNaoCirculante && estrutura.ativoNaoCirculante.grupos) {
            Object.keys(estrutura.ativoNaoCirculante.grupos).forEach(subgrupoKey => {
                const subgrupo = estrutura.ativoNaoCirculante.grupos[subgrupoKey];
                if (subgrupo.contas) {
                    subgrupo.contas.forEach(conta => {
                        callback(conta, 'ativoNaoCirculante', subgrupoKey);
                    });
                }
            });

            if (estrutura.ativoNaoCirculante.total) {
                callback(estrutura.ativoNaoCirculante.total, 'ativoNaoCirculante', null);
            }
        }

        // Passivo Circulante
        if (estrutura.passivoCirculante && estrutura.passivoCirculante.contas) {
            estrutura.passivoCirculante.contas.forEach(conta => {
                callback(conta, 'passivoCirculante', null);
            });
        }

        // Passivo Não Circulante
        if (estrutura.passivoNaoCirculante && estrutura.passivoNaoCirculante.contas) {
            estrutura.passivoNaoCirculante.contas.forEach(conta => {
                callback(conta, 'passivoNaoCirculante', null);
            });
        }

        // Patrimônio Líquido
        if (estrutura.patrimonioLiquido && estrutura.patrimonioLiquido.contas) {
            estrutura.patrimonioLiquido.contas.forEach(conta => {
                callback(conta, 'patrimonioLiquido', null);
            });
        }

        // Totais
        if (estrutura.totais && estrutura.totais.contas) {
            estrutura.totais.contas.forEach(conta => {
                callback(conta, 'totais', null);
            });
        }
    }

    /**
     * Formata número como moeda BRL
     */
    formatarMoeda(valor) {
        if (valor === null || valor === undefined) return '-';

        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(valor);
    }

    /**
     * Formata percentual com 1 decimal
     */
    formatarPercentual(valor) {
        if (valor === null || valor === undefined) return '-';

        return `${valor.toFixed(1)}%`;
    }
}

// Exportar para uso global - CreditScore Pro
if (typeof window !== 'undefined') {
    window.CalculadorAnaliseBalancos = CalculadorAnaliseBalancos;
    console.log('✓ CalculadorAnaliseBalancos exportado para window');
}

// Export for ES6 modules
export default CalculadorAnaliseBalancos;
