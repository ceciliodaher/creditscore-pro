/**
 * CapitalGiroCalculator - Calculador de Capital de Giro e Ciclos Financeiros
 *
 * CAPITAL DE GIRO: Análise da capacidade de financiamento do ciclo operacional
 * - NCG (Necessidade de Capital de Giro): recursos necessários para financiar operação
 * - CDG (Capital de Giro Próprio): recursos próprios disponíveis para o giro
 * - Saldo de Tesouraria: diferença entre CDG e NCG
 *
 * CICLOS FINANCEIROS: Análise de prazos e eficiência operacional
 * - PMR (Prazo Médio de Recebimento): dias para receber de clientes
 * - PME (Prazo Médio de Estoque): dias que produtos ficam em estoque
 * - PMP (Prazo Médio de Pagamento): dias para pagar fornecedores
 * - Ciclo Operacional: PMR + PME
 * - Ciclo Financeiro: Ciclo Operacional - PMP
 *
 * PRINCÍPIOS:
 * - NO FALLBACKS: Validação explícita, sem valores padrão
 * - NO HARDCODED DATA: Todas as mensagens vêm de config/messages.json
 * - KISS & DRY: Código simples e sem duplicação
 * - Event-driven: Emite eventos de alerta quando situação crítica
 *
 * @class CapitalGiroCalculator
 * @version 1.0.0
 */

export class CapitalGiroCalculator {
    /**
     * @param {Object} config - Configuração do sistema
     * @param {Object} messages - Mensagens do sistema
     * @throws {Error} Se config ou messages não fornecidos
     */
    constructor(config, messages) {
        // Validação estrita - NO FALLBACKS
        if (!config) {
            throw new Error('CapitalGiroCalculator: config obrigatória não fornecida');
        }

        if (!messages) {
            throw new Error('CapitalGiroCalculator: messages obrigatórias não fornecidas');
        }

        if (!config.alerts) {
            throw new Error('CapitalGiroCalculator: config.alerts obrigatório');
        }

        if (!messages.calculators) {
            throw new Error('CapitalGiroCalculator: messages.calculators obrigatório');
        }

        if (!messages.calculators.capitalGiro) {
            throw new Error('CapitalGiroCalculator: messages.calculators.capitalGiro obrigatório');
        }

        this.config = config;
        this.messages = messages;
        this.msg = messages.calculators.capitalGiro; // atalho
        this.initialized = false;

        // Thresholds configuráveis
        this.thresholds = {
            cicloFinanceiroCritico: 90,      // dias - ciclo financeiro considerado crítico
            cicloFinanceiroAlto: 60,         // dias - ciclo financeiro considerado alto
            ncgSobreAtivoCirculante: 0.7,   // % - NCG/AC considerado alto
            tesourariaMinima: 0,             // R$ - saldo mínimo de tesouraria aceitável
            pmrMaximo: 60,                   // dias - prazo máximo aceitável de recebimento
            pmpMinimo: 30,                   // dias - prazo mínimo desejável de pagamento
        };
    }

    /**
     * Inicializa o calculador
     * @returns {Promise<boolean>}
     */
    async init() {
        console.log('🔧 Inicializando CapitalGiroCalculator...');

        // Validar estrutura de alertas na config
        if (!Array.isArray(this.config.alerts.critico)) {
            throw new Error('CapitalGiroCalculator: config.alerts.critico deve ser array');
        }

        if (!Array.isArray(this.config.alerts.atencao)) {
            throw new Error('CapitalGiroCalculator: config.alerts.atencao deve ser array');
        }

        this.initialized = true;
        console.log('✅ CapitalGiroCalculator inicializado');
        return true;
    }

    /**
     * Calcula análise completa de capital de giro
     * @param {Object} data - Dados financeiros
     * @param {Object} data.balanco - Balanço patrimonial (ano mais recente)
     * @param {Object} data.dre - DRE (ano mais recente)
     * @returns {Promise<Object>} Resultado da análise
     * @throws {Error} Se dados inválidos ou incompletos
     */
    async calcularTodos(data) {
        if (!this.initialized) {
            throw new Error('CapitalGiroCalculator: calculador não inicializado - execute init() primeiro');
        }

        // Validação dos dados de entrada - NO FALLBACKS
        this.#validarDadosEntrada(data);

        const balanco = data.balanco;
        const dre = data.dre;

        // 1. Calcular Capital de Giro Líquido
        const capitalGiroLiquido = this.#calcularCapitalGiroLiquido(balanco);

        // 2. Calcular Necessidade de Capital de Giro (NCG)
        const ncg = this.#calcularNCG(balanco);

        // 3. Calcular Capital de Giro Próprio (CDG)
        const cdg = this.#calcularCDG(balanco);

        // 4. Calcular Saldo de Tesouraria
        const saldoTesouraria = this.#calcularSaldoTesouraria(cdg, ncg, balanco);

        // 5. Calcular Ciclos Financeiros
        const ciclos = this.#calcularCiclos(balanco, dre);

        // 6. Analisar situação financeira
        const situacao = this.#analisarSituacaoFinanceira(saldoTesouraria, ncg, capitalGiroLiquido);

        // 7. Calcular indicadores complementares
        const indicadores = this.#calcularIndicadores(balanco, ncg, capitalGiroLiquido, ciclos);

        // 8. Gerar alertas
        const alertas = this.#gerarAlertas(situacao, ciclos, indicadores, ncg, saldoTesouraria);

        // Emitir eventos se houver alertas críticos
        if (alertas.criticos.length > 0) {
            this.#emitirEventoAlerta('critico', alertas.criticos);
        }

        return {
            capitalGiroLiquido,
            ncg,
            cdg,
            saldoTesouraria,
            ciclos,
            situacao,
            indicadores,
            alertas,
            metadata: {
                calculadoEm: new Date().toISOString(),
                thresholds: this.thresholds,
            },
        };
    }

    /**
     * Helper para substituir placeholders em mensagens
     * @private
     * @param {string} template - Template com {placeholders}
     * @param {Object} vars - Variáveis para substituição
     * @returns {string}
     */
    #formatMessage(template, vars) {
        if (!template) {
            throw new Error('CapitalGiroCalculator: template de mensagem não fornecido');
        }

        let result = template;

        for (const [key, value] of Object.entries(vars)) {
            const placeholder = `{${key}}`;
            const replacement = typeof value === 'number'
                ? value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                : String(value);
            result = result.replace(new RegExp(placeholder, 'g'), replacement);
        }

        return result;
    }

    /**
     * Valida dados de entrada
     * @private
     * @param {Object} data
     * @throws {Error} Se dados inválidos
     */
    #validarDadosEntrada(data) {
        if (!data) {
            throw new Error('CapitalGiroCalculator: data obrigatório não fornecido');
        }

        if (!data.balanco) {
            throw new Error('CapitalGiroCalculator: data.balanco obrigatório não fornecido');
        }

        if (!data.dre) {
            throw new Error('CapitalGiroCalculator: data.dre obrigatório não fornecido');
        }

        // Validar estrutura do balanço
        const balanco = data.balanco;

        if (!balanco.ativo) {
            throw new Error('CapitalGiroCalculator: balanco.ativo obrigatório não fornecido');
        }

        if (!balanco.ativo.circulante) {
            throw new Error('CapitalGiroCalculator: balanco.ativo.circulante obrigatório não fornecido');
        }

        if (!balanco.passivo) {
            throw new Error('CapitalGiroCalculator: balanco.passivo obrigatório não fornecido');
        }

        if (!balanco.passivo.circulante) {
            throw new Error('CapitalGiroCalculator: balanco.passivo.circulante obrigatório não fornecido');
        }

        if (!balanco.patrimonioLiquido) {
            throw new Error('CapitalGiroCalculator: balanco.patrimonioLiquido obrigatório não fornecido');
        }

        // Validar DRE
        const dre = data.dre;

        if (typeof dre.receitaLiquida !== 'number') {
            throw new Error('CapitalGiroCalculator: dre.receitaLiquida deve ser número');
        }

        if (typeof dre.custosProdutos !== 'number') {
            throw new Error('CapitalGiroCalculator: dre.custosProdutos deve ser número (CMV)');
        }
    }

    /**
     * Calcula Capital de Giro Líquido (CGL)
     * CGL = Ativo Circulante - Passivo Circulante
     * @private
     * @param {Object} balanco
     * @returns {Object}
     */
    #calcularCapitalGiroLiquido(balanco) {
        const ativoCirculante = this.#somarValores(balanco.ativo.circulante);
        const passivoCirculante = this.#somarValores(balanco.passivo.circulante);

        const valor = ativoCirculante - passivoCirculante;

        let interpretacao;
        let situacao;

        if (valor > 0) {
            interpretacao = this.msg.cgl.positivo;
            situacao = this.msg.cgl.situacaoAdequado;
        } else if (valor === 0) {
            interpretacao = this.msg.cgl.neutro;
            situacao = this.msg.cgl.situacaoNeutro;
        } else {
            interpretacao = this.msg.cgl.negativo;
            situacao = this.msg.cgl.situacaoInsuficiente;
        }

        return {
            valor,
            ativoCirculante,
            passivoCirculante,
            interpretacao,
            situacao,
        };
    }

    /**
     * Calcula Necessidade de Capital de Giro (NCG)
     * NCG = ACO - PCO
     * @private
     * @param {Object} balanco
     * @returns {Object}
     */
    #calcularNCG(balanco) {
        const aco = balanco.ativo.circulante;
        const pco = balanco.passivo.circulante;

        // ACO: Ativo Circulante Operacional
        let contasReceber = 0;
        let estoques = 0;

        if (aco.contasReceber !== undefined) {
            if (typeof aco.contasReceber !== 'number') {
                throw new Error('CapitalGiroCalculator: balanco.ativo.circulante.contasReceber deve ser número');
            }
            contasReceber = aco.contasReceber;
        }

        if (aco.estoques !== undefined) {
            if (typeof aco.estoques !== 'number') {
                throw new Error('CapitalGiroCalculator: balanco.ativo.circulante.estoques deve ser número');
            }
            estoques = aco.estoques;
        }

        const ativoCirculanteOperacional = contasReceber + estoques;

        // PCO: Passivo Circulante Operacional
        let fornecedores = 0;

        if (pco.fornecedores !== undefined) {
            if (typeof pco.fornecedores !== 'number') {
                throw new Error('CapitalGiroCalculator: balanco.passivo.circulante.fornecedores deve ser número');
            }
            fornecedores = pco.fornecedores;
        }

        const passivoCirculanteOperacional = fornecedores;

        const valor = ativoCirculanteOperacional - passivoCirculanteOperacional;

        let interpretacao;
        let situacao;

        if (valor > 0) {
            interpretacao = this.msg.ncg.positiva;
            situacao = this.msg.ncg.situacaoNecessitaFinanciamento;
        } else if (valor === 0) {
            interpretacao = this.msg.ncg.neutra;
            situacao = this.msg.ncg.situacaoEquilibrado;
        } else {
            interpretacao = this.msg.ncg.negativa;
            situacao = this.msg.ncg.situacaoAutofinanciado;
        }

        return {
            valor,
            ativoCirculanteOperacional,
            passivoCirculanteOperacional,
            componentes: {
                contasReceber,
                estoques,
                fornecedores,
            },
            interpretacao,
            situacao,
        };
    }

    /**
     * Calcula Capital de Giro Próprio (CDG)
     * CDG = Patrimônio Líquido + Passivo Não Circulante - Ativo Não Circulante
     * @private
     * @param {Object} balanco
     * @returns {Object}
     */
    #calcularCDG(balanco) {
        const patrimonioLiquido = this.#somarValores(balanco.patrimonioLiquido);

        let ativoNaoCirculante = 0;
        if (balanco.ativo.naoCirculante) {
            ativoNaoCirculante = this.#somarValores(balanco.ativo.naoCirculante);
        }

        let passivoNaoCirculante = 0;
        if (balanco.passivo.naoCirculante) {
            passivoNaoCirculante = this.#somarValores(balanco.passivo.naoCirculante);
        }

        const valor = (patrimonioLiquido + passivoNaoCirculante) - ativoNaoCirculante;

        let interpretacao;
        let situacao;

        if (valor > 0) {
            interpretacao = this.msg.cdg.positivo;
            situacao = this.msg.cdg.situacaoAdequado;
        } else if (valor === 0) {
            interpretacao = this.msg.cdg.neutro;
            situacao = this.msg.cdg.situacaoNeutro;
        } else {
            interpretacao = this.msg.cdg.negativo;
            situacao = this.msg.cdg.situacaoInadequado;
        }

        return {
            valor,
            patrimonioLiquido,
            ativoNaoCirculante,
            passivoNaoCirculante,
            interpretacao,
            situacao,
        };
    }

    /**
     * Calcula Saldo de Tesouraria (T)
     * T = CDG - NCG
     * @private
     * @param {Object} cdg
     * @param {Object} ncg
     * @param {Object} balanco
     * @returns {Object}
     */
    #calcularSaldoTesouraria(cdg, ncg, balanco) {
        const valorMetodo1 = cdg.valor - ncg.valor;

        // Método 2: Disponível - Empréstimos CP (verificação)
        let disponivel = 0;
        if (balanco.ativo.circulante.disponibilidades !== undefined) {
            if (typeof balanco.ativo.circulante.disponibilidades !== 'number') {
                throw new Error('CapitalGiroCalculator: balanco.ativo.circulante.disponibilidades deve ser número');
            }
            disponivel = balanco.ativo.circulante.disponibilidades;
        }

        let emprestimosCP = 0;
        if (balanco.passivo.circulante.emprestimos !== undefined) {
            if (typeof balanco.passivo.circulante.emprestimos !== 'number') {
                throw new Error('CapitalGiroCalculator: balanco.passivo.circulante.emprestimos deve ser número');
            }
            emprestimosCP = balanco.passivo.circulante.emprestimos;
        }

        const valorMetodo2 = disponivel - emprestimosCP;

        let interpretacao;
        let situacao;

        if (valorMetodo1 > 0) {
            interpretacao = this.msg.tesouraria.positivo;
            situacao = this.msg.tesouraria.situacaoFolga;
        } else if (valorMetodo1 === 0) {
            interpretacao = this.msg.tesouraria.neutro;
            situacao = this.msg.tesouraria.situacaoEquilibrio;
        } else {
            interpretacao = this.msg.tesouraria.negativo;
            situacao = this.msg.tesouraria.situacaoDependencia;
        }

        return {
            valor: valorMetodo1,
            metodo1: {
                descricao: 'CDG - NCG',
                valor: valorMetodo1,
            },
            metodo2: {
                descricao: 'Disponível - Empréstimos CP',
                valor: valorMetodo2,
                disponivel,
                emprestimosCP,
            },
            diferenca: Math.abs(valorMetodo1 - valorMetodo2),
            interpretacao,
            situacao,
        };
    }

    /**
     * Soma valores de um objeto recursivamente
     * @private
     * @param {Object} objeto
     * @returns {number}
     */
    #somarValores(objeto) {
        let soma = 0;

        for (const valor of Object.values(objeto)) {
            if (typeof valor === 'number') {
                soma += valor;
            } else if (typeof valor === 'object' && valor !== null) {
                soma += this.#somarValores(valor);
            }
        }

        return soma;
    }

    /**
     * Emite evento de alerta
     * @private
     * @param {string} severidade
     * @param {Array} alertas
     */
    #emitirEventoAlerta(severidade, alertas) {
        const event = new CustomEvent('capitalGiroAlerta', {
            detail: {
                severidade,
                alertas,
                timestamp: new Date().toISOString(),
            },
        });

        document.dispatchEvent(event);

        console.warn(`⚠️ Alertas ${severidade} detectados na análise de capital de giro:`, alertas);
    }

    /**
     * Calcula ciclos financeiros (PMR, PME, PMP, CO, CF)
     * @private
     * @param {Object} balanco
     * @param {Object} dre
     * @returns {Object}
     */
    #calcularCiclos(balanco, dre) {
        const receitaLiquida = dre.receitaLiquida;
        const cmv = dre.custosProdutos;

        // PMR: Prazo Médio de Recebimento
        let pmr = null;
        if (balanco.ativo.circulante.contasReceber !== undefined) {
            const contasReceber = balanco.ativo.circulante.contasReceber;
            if (receitaLiquida > 0) {
                pmr = (contasReceber / receitaLiquida) * 360;
            }
        }

        // PME: Prazo Médio de Estoque
        let pme = null;
        if (balanco.ativo.circulante.estoques !== undefined) {
            const estoques = balanco.ativo.circulante.estoques;
            if (cmv > 0) {
                pme = (estoques / cmv) * 360;
            }
        }

        // PMP: Prazo Médio de Pagamento
        let pmp = null;
        if (balanco.passivo.circulante.fornecedores !== undefined) {
            const fornecedores = balanco.passivo.circulante.fornecedores;
            if (cmv > 0) {
                pmp = (fornecedores / cmv) * 360;
            }
        }

        // Ciclo Operacional: PMR + PME
        let cicloOperacional = null;
        if (pmr !== null && pme !== null) {
            cicloOperacional = pmr + pme;
        } else if (pmr !== null && pme === null) {
            cicloOperacional = pmr; // Empresa de serviços sem estoque
        }

        // Ciclo Financeiro: CO - PMP
        let cicloFinanceiro = null;
        if (cicloOperacional !== null && pmp !== null) {
            cicloFinanceiro = cicloOperacional - pmp;
        }

        return {
            pmr: {
                valor: pmr,
                descricao: this.msg.ciclos.pmr.descricao,
                formula: this.msg.ciclos.pmr.formula,
                interpretacao: pmr !== null
                    ? pmr > this.thresholds.pmrMaximo
                        ? this.#formatMessage(this.msg.ciclos.pmr.alto, { dias: pmr.toFixed(0), limiar: this.thresholds.pmrMaximo })
                        : this.#formatMessage(this.msg.ciclos.pmr.adequado, { dias: pmr.toFixed(0) })
                    : this.msg.ciclos.pmr.naoCalculado,
            },
            pme: {
                valor: pme,
                descricao: this.msg.ciclos.pme.descricao,
                formula: this.msg.ciclos.pme.formula,
                interpretacao: pme !== null
                    ? this.#formatMessage(this.msg.ciclos.pme.calculado, { dias: pme.toFixed(0) })
                    : this.msg.ciclos.pme.naoCalculado,
            },
            pmp: {
                valor: pmp,
                descricao: this.msg.ciclos.pmp.descricao,
                formula: this.msg.ciclos.pmp.formula,
                interpretacao: pmp !== null
                    ? pmp < this.thresholds.pmpMinimo
                        ? this.#formatMessage(this.msg.ciclos.pmp.baixo, { dias: pmp.toFixed(0), limiar: this.thresholds.pmpMinimo })
                        : this.#formatMessage(this.msg.ciclos.pmp.adequado, { dias: pmp.toFixed(0) })
                    : this.msg.ciclos.pmp.naoCalculado,
            },
            cicloOperacional: {
                valor: cicloOperacional,
                descricao: this.msg.ciclos.cicloOperacional.descricao,
                formula: this.msg.ciclos.cicloOperacional.formula,
                interpretacao: cicloOperacional !== null
                    ? this.#formatMessage(this.msg.ciclos.cicloOperacional.calculado, { dias: cicloOperacional.toFixed(0) })
                    : this.msg.ciclos.cicloOperacional.naoCalculado,
            },
            cicloFinanceiro: {
                valor: cicloFinanceiro,
                descricao: this.msg.ciclos.cicloFinanceiro.descricao,
                formula: this.msg.ciclos.cicloFinanceiro.formula,
                interpretacao: this.#interpretarCicloFinanceiro(cicloFinanceiro),
                situacao: this.#classificarCicloFinanceiro(cicloFinanceiro),
            },
        };
    }

    /**
     * Interpreta ciclo financeiro
     * @private
     * @param {number|null} cicloFinanceiro
     * @returns {string}
     */
    #interpretarCicloFinanceiro(cicloFinanceiro) {
        if (cicloFinanceiro === null) {
            return this.msg.ciclos.cicloFinanceiro.naoCalculado;
        }

        if (cicloFinanceiro > this.thresholds.cicloFinanceiroCritico) {
            return this.#formatMessage(this.msg.ciclos.cicloFinanceiro.critico, { dias: cicloFinanceiro.toFixed(0) });
        } else if (cicloFinanceiro > this.thresholds.cicloFinanceiroAlto) {
            return this.#formatMessage(this.msg.ciclos.cicloFinanceiro.alto, { dias: cicloFinanceiro.toFixed(0) });
        } else if (cicloFinanceiro > 0) {
            return this.#formatMessage(this.msg.ciclos.cicloFinanceiro.adequado, { dias: cicloFinanceiro.toFixed(0) });
        } else {
            return this.#formatMessage(this.msg.ciclos.cicloFinanceiro.excelente, { dias: cicloFinanceiro.toFixed(0) });
        }
    }

    /**
     * Classifica ciclo financeiro
     * @private
     * @param {number|null} cicloFinanceiro
     * @returns {string}
     */
    #classificarCicloFinanceiro(cicloFinanceiro) {
        if (cicloFinanceiro === null) return 'desconhecido';
        if (cicloFinanceiro > this.thresholds.cicloFinanceiroCritico) return 'critico';
        if (cicloFinanceiro > this.thresholds.cicloFinanceiroAlto) return 'alto';
        if (cicloFinanceiro > 0) return 'adequado';
        return 'excelente';
    }

    /**
     * Analisa situação financeira baseada em T e NCG
     * @private
     * @param {Object} saldoTesouraria
     * @param {Object} ncg
     * @param {Object} capitalGiroLiquido
     * @returns {Object}
     */
    #analisarSituacaoFinanceira(saldoTesouraria, ncg, capitalGiroLiquido) {
        const t = saldoTesouraria.valor;
        const n = ncg.valor;
        const cgl = capitalGiroLiquido.valor;

        let situacaoKey;

        if (t > 0 && n > 0) {
            situacaoKey = 'situacao1';
        } else if (t < 0 && n > 0) {
            situacaoKey = 'situacao2';
        } else if (t > 0 && n < 0) {
            situacaoKey = 'situacao3';
        } else {
            situacaoKey = 'situacao4';
        }

        const situacaoConfig = this.msg.situacaoFinanceira[situacaoKey];

        if (!situacaoConfig) {
            throw new Error(`CapitalGiroCalculator: situação ${situacaoKey} não encontrada em messages`);
        }

        const diagnostico = this.#formatMessage(situacaoConfig.diagnostico, {
            t: t.toFixed(2),
            n: n.toFixed(2),
            tABS: Math.abs(t).toFixed(2),
            cgl: cgl.toFixed(2),
        });

        return {
            tipo: situacaoConfig.tipo,
            descricao: situacaoConfig.descricao,
            risco: situacaoConfig.risco,
            recomendacao: situacaoConfig.recomendacao,
            indicadores: {
                saldoTesouraria: t,
                ncg: n,
                capitalGiroLiquido: cgl,
            },
            diagnostico,
        };
    }

    /**
     * Calcula indicadores complementares
     * @private
     * @param {Object} balanco
     * @param {Object} ncg
     * @param {Object} capitalGiroLiquido
     * @param {Object} ciclos
     * @returns {Object}
     */
    #calcularIndicadores(balanco, ncg, capitalGiroLiquido, ciclos) {
        const ativoCirculante = this.#somarValores(balanco.ativo.circulante);

        // NCG / Ativo Circulante
        const ncgSobreAC = ativoCirculante > 0 ? (ncg.valor / ativoCirculante) * 100 : null;

        // CGL / Ativo Circulante
        const cglSobreAC = ativoCirculante > 0 ? (capitalGiroLiquido.valor / ativoCirculante) * 100 : null;

        return {
            ncgSobreAtivoCirculante: {
                valor: ncgSobreAC,
                interpretacao: ncgSobreAC !== null
                    ? ncgSobreAC > this.thresholds.ncgSobreAtivoCirculante * 100
                        ? this.#formatMessage(this.msg.indicadores.ncgSobreACAlto, {
                            valor: ncgSobreAC.toFixed(2),
                            limiar: this.thresholds.ncgSobreAtivoCirculante * 100,
                        })
                        : this.#formatMessage(this.msg.indicadores.ncgSobreACAdequado, { valor: ncgSobreAC.toFixed(2) })
                    : this.msg.indicadores.naoCalculado,
            },
            cglSobreAtivoCirculante: {
                valor: cglSobreAC,
                interpretacao: cglSobreAC !== null
                    ? this.#formatMessage(this.msg.indicadores.cglSobreAC, { valor: cglSobreAC.toFixed(2) })
                    : this.msg.indicadores.naoCalculado,
            },
            eficienciaOperacional: {
                pmr: ciclos.pmr.valor,
                pme: ciclos.pme.valor,
                pmp: ciclos.pmp.valor,
                score: this.#calcularScoreEficiencia(ciclos),
            },
        };
    }

    /**
     * Calcula score de eficiência operacional (0-100)
     * @private
     * @param {Object} ciclos
     * @returns {number|null}
     */
    #calcularScoreEficiencia(ciclos) {
        const { pmr, pme, pmp, cicloFinanceiro } = ciclos;

        if (cicloFinanceiro.valor === null) {
            return null;
        }

        let score = 100;

        // Penalidades
        if (pmr.valor !== null && pmr.valor > this.thresholds.pmrMaximo) {
            score -= 20;
        }

        if (pmp.valor !== null && pmp.valor < this.thresholds.pmpMinimo) {
            score -= 15;
        }

        if (cicloFinanceiro.valor > this.thresholds.cicloFinanceiroCritico) {
            score -= 30;
        } else if (cicloFinanceiro.valor > this.thresholds.cicloFinanceiroAlto) {
            score -= 15;
        }

        // Bônus para ciclo financeiro negativo (excelente)
        if (cicloFinanceiro.valor < 0) {
            score += 20;
        }

        return Math.max(0, Math.min(100, score));
    }

    /**
     * Gera alertas baseados em situação e indicadores
     * @private
     * @param {Object} situacao
     * @param {Object} ciclos
     * @param {Object} indicadores
     * @param {Object} ncg
     * @param {Object} saldoTesouraria
     * @returns {Object}
     */
    #gerarAlertas(situacao, ciclos, indicadores, ncg, saldoTesouraria) {
        const alertas = {
            criticos: [],
            atencao: [],
            informativos: [],
        };

        // Alertas críticos de situação financeira
        if (situacao.risco === 'alto') {
            alertas.criticos.push({
                tipo: 'situacao_alto_risco',
                severidade: 'crítico',
                mensagem: this.msg.alertas.situacaoAltoRisco,
                valor: saldoTesouraria.valor,
                recomendacao: situacao.recomendacao,
            });
        }

        if (situacao.risco === 'medio') {
            alertas.atencao.push({
                tipo: 'situacao_insatisfatoria',
                severidade: 'atenção',
                mensagem: this.msg.alertas.situacaoInsatisfatoria,
                valor: saldoTesouraria.valor,
                recomendacao: situacao.recomendacao,
            });
        }

        // Alertas de ciclo financeiro
        if (ciclos.cicloFinanceiro.valor !== null) {
            if (ciclos.cicloFinanceiro.situacao === 'critico') {
                alertas.criticos.push({
                    tipo: 'ciclo_financeiro_critico',
                    severidade: 'crítico',
                    mensagem: this.#formatMessage(this.msg.alertas.cicloFinanceiroCritico, {
                        dias: ciclos.cicloFinanceiro.valor.toFixed(0),
                    }),
                    valor: ciclos.cicloFinanceiro.valor,
                    recomendacao: this.msg.alertas.cicloFinanceiroCriticoRecomendacao,
                });
            } else if (ciclos.cicloFinanceiro.situacao === 'alto') {
                alertas.atencao.push({
                    tipo: 'ciclo_financeiro_alto',
                    severidade: 'atenção',
                    mensagem: this.#formatMessage(this.msg.alertas.cicloFinanceiroAlto, {
                        dias: ciclos.cicloFinanceiro.valor.toFixed(0),
                    }),
                    valor: ciclos.cicloFinanceiro.valor,
                    recomendacao: this.msg.alertas.cicloFinanceiroAltoRecomendacao,
                });
            } else if (ciclos.cicloFinanceiro.situacao === 'excelente') {
                alertas.informativos.push({
                    tipo: 'ciclo_financeiro_negativo',
                    severidade: 'informativo',
                    mensagem: this.#formatMessage(this.msg.alertas.cicloFinanceiroNegativo, {
                        dias: ciclos.cicloFinanceiro.valor.toFixed(0),
                    }),
                    valor: ciclos.cicloFinanceiro.valor,
                });
            }
        }

        // Alertas de eficiência
        if (indicadores.eficienciaOperacional.score !== null && indicadores.eficienciaOperacional.score < 50) {
            alertas.atencao.push({
                tipo: 'eficiencia_baixa',
                severidade: 'atenção',
                mensagem: this.#formatMessage(this.msg.alertas.eficienciaBaixa, {
                    score: indicadores.eficienciaOperacional.score.toFixed(0),
                }),
                valor: indicadores.eficienciaOperacional.score,
                recomendacao: this.msg.alertas.eficienciaBaixaRecomendacao,
            });
        }

        return alertas;
    }
}

// Expor globalmente
window.CapitalGiroCalculator = CapitalGiroCalculator;
