/* =====================================
   ENDIVIDAMENTO-CALCULATOR.JS
   Calculador de índices de endividamento integrado ao Balanço Patrimonial
   NO FALLBACKS - NO MOCK DATA - SOLID PRINCIPLES
   ===================================== */

class EndividamentoCalculator {
    constructor(config, messages) {
        // Validação de dependências obrigatórias
        if (!config) {
            throw new Error('EndividamentoCalculator: config obrigatória');
        }
        if (!messages) {
            throw new Error('EndividamentoCalculator: messages obrigatória');
        }

        this.config = config;
        this.messages = messages;
    }

    /**
     * Inicializa o calculador
     * Two-phase initialization
     */
    async init() {
        console.log('✓ EndividamentoCalculator inicializado');
        return true;
    }

    /**
     * Calcula todos os índices de endividamento
     * CONTEXTO: Operação crítica - validação rigorosa obrigatória
     * @param {Object} dadosBalanco - Dados do Balanço Patrimonial
     * @param {Object} dadosDividas - Dados das dívidas (do EndividamentoManager)
     * @returns {Object}
     */
    async calcularIndices(dadosBalanco, dadosDividas) {
        // Validação de entrada
        if (!dadosBalanco) {
            throw new Error('EndividamentoCalculator: dadosBalanco obrigatório para cálculo de índices');
        }

        // Validar presença de dados do balanço
        this.validarDadosBalanco(dadosBalanco);

        // Calcular índices
        const indiceEndividamentoGeral = this.calcularIndiceEndividamentoGeral(dadosBalanco);
        const composicaoEndividamento = this.calcularComposicaoEndividamento(dadosBalanco);
        const grauEndividamento = this.calcularGrauEndividamento(dadosBalanco);

        // Cobertura de juros requer dados da DRE e das dívidas
        let coberturaJuros = null;
        if (dadosBalanco.ebitda && dadosDividas?.total) {
            coberturaJuros = this.calcularCoberturaJuros(dadosBalanco, dadosDividas);
        }

        return {
            indiceEndividamentoGeral,
            composicaoEndividamento,
            grauEndividamento,
            coberturaJuros,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Valida dados do Balanço Patrimonial
     * @param {Object} dados - Dados do balanço
     * @throws {Error} Se dados obrigatórios ausentes
     */
    validarDadosBalanco(dados) {
        const camposObrigatorios = [
            { campo: 'passivoCirculante', label: 'Passivo Circulante' },
            { campo: 'passivoNaoCirculante', label: 'Passivo Não Circulante' },
            { campo: 'patrimonioLiquido', label: 'Patrimônio Líquido' },
            { campo: 'ativoTotal', label: 'Ativo Total' }
        ];

        for (const { campo, label } of camposObrigatorios) {
            if (dados[campo] === null || dados[campo] === undefined) {
                throw new Error(
                    `Dados do Balanço Patrimonial incompletos: "${label}" ausente. ` +
                    `Complete o Módulo 2 (Demonstrações Financeiras) antes de calcular índices de endividamento.`
                );
            }

            const valor = parseFloat(dados[campo]);
            if (isNaN(valor)) {
                throw new Error(
                    `Valor inválido em "${label}": esperado número, recebido "${dados[campo]}"`
                );
            }
        }
    }

    /**
     * 1. Índice de Endividamento Geral
     * Fórmula: (Passivo Circulante + Passivo Não Circulante) / Patrimônio Líquido
     * Interpretação: Quanto de capital de terceiros para cada R$ 1 de capital próprio
     * @param {Object} dadosBalanco - Dados do balanço
     * @returns {Object}
     */
    calcularIndiceEndividamentoGeral(dadosBalanco) {
        const pc = parseFloat(dadosBalanco.passivoCirculante);
        const pnc = parseFloat(dadosBalanco.passivoNaoCirculante);
        const pl = parseFloat(dadosBalanco.patrimonioLiquido);

        // Validação específica (PL não pode ser zero)
        if (pl === 0) {
            return {
                valor: null,
                status: 'indefinido',
                mensagem: 'Patrimônio Líquido zerado - índice indefinido',
                cor: '#999'
            };
        }

        const indice = (pc + pnc) / pl;

        // Classificação baseada em scoring-criteria.json (thresholds.endividamento.endividamentoSobrePL)
        let status, cor;
        if (indice <= 0.50) {
            status = 'excelente';
            cor = '#4CAF50'; // Verde
        } else if (indice <= 1.0) {
            status = 'bom';
            cor = '#8BC34A'; // Verde claro
        } else if (indice <= 2.0) {
            status = 'adequado';
            cor = '#FF9800'; // Laranja
        } else if (indice <= 3.0) {
            status = 'baixo';
            cor = '#FF5722'; // Laranja escuro
        } else {
            status = 'crítico';
            cor = '#F44336'; // Vermelho
        }

        return {
            valor: indice,
            valorFormatado: indice.toFixed(2),
            status,
            cor,
            interpretacao: `${indice.toFixed(2)} de capital de terceiros para cada R$ 1 de capital próprio`
        };
    }

    /**
     * 2. Composição do Endividamento
     * Fórmula: Passivo Circulante / (Passivo Circulante + Passivo Não Circulante) × 100
     * Interpretação: Percentual de dívidas de curto prazo
     * @param {Object} dadosBalanco - Dados do balanço
     * @returns {Object}
     */
    calcularComposicaoEndividamento(dadosBalanco) {
        const pc = parseFloat(dadosBalanco.passivoCirculante);
        const pnc = parseFloat(dadosBalanco.passivoNaoCirculante);

        const passivoTotal = pc + pnc;

        // Validação específica
        if (passivoTotal === 0) {
            return {
                valor: 0,
                valorFormatado: '0%',
                status: 'excelente',
                cor: '#4CAF50',
                interpretacao: 'Sem endividamento'
            };
        }

        const percentual = (pc / passivoTotal) * 100;

        // Classificação baseada em scoring-criteria.json (thresholds.endividamento.dividaCPSobreTotal)
        let status, cor;
        if (percentual <= 30) {
            status = 'excelente';
            cor = '#4CAF50';
        } else if (percentual <= 50) {
            status = 'bom';
            cor = '#8BC34A';
        } else if (percentual <= 70) {
            status = 'adequado';
            cor = '#FF9800';
        } else if (percentual <= 85) {
            status = 'baixo';
            cor = '#FF5722';
        } else {
            status = 'crítico';
            cor = '#F44336';
        }

        return {
            valor: percentual,
            valorFormatado: `${percentual.toFixed(1)}%`,
            status,
            cor,
            interpretacao: `${percentual.toFixed(1)}% das dívidas são de curto prazo`
        };
    }

    /**
     * 3. Grau de Endividamento
     * Fórmula: Passivo Total / Ativo Total × 100
     * Interpretação: Percentual dos ativos financiados por terceiros
     * @param {Object} dadosBalanco - Dados do balanço
     * @returns {Object}
     */
    calcularGrauEndividamento(dadosBalanco) {
        const pc = parseFloat(dadosBalanco.passivoCirculante);
        const pnc = parseFloat(dadosBalanco.passivoNaoCirculante);
        const ativoTotal = parseFloat(dadosBalanco.ativoTotal);

        // Validação específica
        if (ativoTotal === 0) {
            throw new Error(
                'Ativo Total zerado - impossível calcular Grau de Endividamento. ' +
                'Verifique os dados do Balanço Patrimonial.'
            );
        }

        const passivoTotal = pc + pnc;
        const percentual = (passivoTotal / ativoTotal) * 100;

        // Classificação (regra geral: quanto menor, melhor)
        let status, cor;
        if (percentual <= 30) {
            status = 'excelente';
            cor = '#4CAF50';
        } else if (percentual <= 50) {
            status = 'bom';
            cor = '#8BC34A';
        } else if (percentual <= 70) {
            status = 'adequado';
            cor = '#FF9800';
        } else if (percentual <= 85) {
            status = 'baixo';
            cor = '#FF5722';
        } else {
            status = 'crítico';
            cor = '#F44336';
        }

        return {
            valor: percentual,
            valorFormatado: `${percentual.toFixed(1)}%`,
            status,
            cor,
            interpretacao: `${percentual.toFixed(1)}% dos ativos financiados por capital de terceiros`
        };
    }

    /**
     * 4. Índice de Cobertura de Juros
     * Fórmula: EBITDA / Despesas Financeiras
     * Interpretação: Capacidade de pagar juros com o lucro operacional
     * @param {Object} dadosBalanco - Dados do balanço (com EBITDA da DRE)
     * @param {Object} dadosDividas - Métricas das dívidas
     * @returns {Object}
     */
    calcularCoberturaJuros(dadosBalanco, dadosDividas) {
        const ebitda = parseFloat(dadosBalanco.ebitda);

        // Calcular despesas financeiras totais das dívidas
        // (simplificação: taxa média × saldo total / 12 para mensal)
        const despesasFinanceiras = this.calcularDespesasFinanceiras(dadosDividas);

        // Validação
        if (!despesasFinanceiras || despesasFinanceiras === 0) {
            return {
                valor: null,
                valorFormatado: '-',
                status: 'indefinido',
                cor: '#999',
                interpretacao: 'Sem despesas financeiras para calcular cobertura'
            };
        }

        const indice = ebitda / despesasFinanceiras;

        // Classificação baseada em scoring-criteria.json (thresholds.capacidadePagamento.coberturaJuros)
        let status, cor;
        if (indice >= 5) {
            status = 'excelente';
            cor = '#4CAF50';
        } else if (indice >= 3) {
            status = 'bom';
            cor = '#8BC34A';
        } else if (indice >= 2) {
            status = 'adequado';
            cor = '#FF9800';
        } else if (indice >= 1) {
            status = 'baixo';
            cor = '#FF5722';
        } else {
            status = 'crítico';
            cor = '#F44336';
        }

        return {
            valor: indice,
            valorFormatado: `${indice.toFixed(2)}x`,
            status,
            cor,
            interpretacao: `EBITDA cobre ${indice.toFixed(2)}x as despesas financeiras`
        };
    }

    /**
     * Calcula despesas financeiras estimadas
     * (simplificação: soma de juros anuais / 12)
     * @param {Object} dadosDividas - Métricas das dívidas
     * @returns {number}
     */
    calcularDespesasFinanceiras(dadosDividas) {
        if (!dadosDividas || !dadosDividas.dividas || dadosDividas.dividas.length === 0) {
            return 0;
        }

        let totalJurosAnual = 0;

        for (const divida of dadosDividas.dividas) {
            const saldo = parseFloat(divida.saldoDevedor);
            const taxa = parseFloat(divida.taxaJuros);

            if (!isNaN(saldo) && !isNaN(taxa)) {
                totalJurosAnual += (saldo * taxa / 100);
            }
        }

        // Retornar despesa mensal
        return totalJurosAnual / 12;
    }

    /**
     * Formata índices para exibição
     * @param {Object} indices - Objeto com todos os índices
     * @returns {Array}
     */
    /**
     * 5. Inadimplência Histórica (Adaptado do Sicoob GRC)
     * Calcula percentual de inadimplência de fornecedores e clientes (> 90 dias)
     * Interpretação: Quanto maior, pior o histórico de pagamento/recebimento
     * @param {Object} dadosInadimplencia - Dados de inadimplência
     * @param {Object} dadosInadimplencia.fornecedores - {contasPagarTotal, contasPagar90Dias}
     * @param {Object} dadosInadimplencia.clientes - {contasReceberTotal, contasReceber90Dias}
     * @returns {Object}
     */
    calcularInadimplencia(dadosInadimplencia) {
        // Validação de entrada
        if (!dadosInadimplencia) {
            return {
                inadimplenciaFornecedores: this.retornarIndefinido('Inadimplência Fornecedores'),
                inadimplenciaClientes: this.retornarIndefinido('Inadimplência Clientes'),
                statusGeral: 'indefinido'
            };
        }

        // Inadimplência de Fornecedores
        const inadimplenciaFornecedores = this.calcularInadimplenciaFornecedores(
            dadosInadimplencia.fornecedores
        );

        // Inadimplência de Clientes
        const inadimplenciaClientes = this.calcularInadimplenciaClientes(
            dadosInadimplencia.clientes
        );

        // Status geral (pior dos dois)
        const statusGeral = this.determinarPiorStatus([
            inadimplenciaFornecedores.status,
            inadimplenciaClientes.status
        ]);

        return {
            inadimplenciaFornecedores,
            inadimplenciaClientes,
            statusGeral
        };
    }

    /**
     * Inadimplência de Fornecedores
     * Fórmula: (Contas a Pagar > 90 dias / Total Contas a Pagar) × 100
     * @param {Object} dados - {contasPagarTotal, contasPagar90Dias}
     * @returns {Object}
     */
    calcularInadimplenciaFornecedores(dados) {
        // Validação de entrada
        if (!dados) {
            return this.retornarIndefinido('Inadimplência Fornecedores');
        }

        const contasPagarTotal = parseFloat(dados.contasPagarTotal);
        const contasPagar90Dias = parseFloat(dados.contasPagar90Dias);

        // Validação rigorosa
        if (isNaN(contasPagarTotal) || contasPagarTotal === 0) {
            return {
                valor: null,
                valorFormatado: '-',
                status: 'indefinido',
                cor: '#999',
                interpretacao: 'Total de contas a pagar ausente ou zerado'
            };
        }

        if (isNaN(contasPagar90Dias)) {
            return {
                valor: null,
                valorFormatado: '-',
                status: 'indefinido',
                cor: '#999',
                interpretacao: 'Contas a pagar > 90 dias não informado'
            };
        }

        const percentual = (contasPagar90Dias / contasPagarTotal) * 100;

        // Classificação baseada em scoring-criteria.json (thresholds.endividamento.inadimplenciaHistorica)
        // excelente: <= 2.5%, bom: <= 3.5%, adequado: <= 4.5%, critico: > 5%
        let status, cor;
        if (percentual <= 2.5) {
            status = 'excelente';
            cor = '#4CAF50'; // Verde
        } else if (percentual <= 3.5) {
            status = 'bom';
            cor = '#8BC34A'; // Verde claro
        } else if (percentual <= 4.5) {
            status = 'adequado';
            cor = '#FF9800'; // Laranja
        } else if (percentual <= 5.0) {
            status = 'baixo';
            cor = '#FF5722'; // Laranja escuro
        } else {
            status = 'crítico';
            cor = '#F44336'; // Vermelho
        }

        return {
            valor: percentual,
            valorFormatado: `${percentual.toFixed(1)}%`,
            status,
            cor,
            interpretacao: percentual === 0
                ? 'Sem inadimplência com fornecedores'
                : `${percentual.toFixed(1)}% das contas a pagar com mais de 90 dias de atraso`
        };
    }

    /**
     * Inadimplência de Clientes
     * Fórmula: (Contas a Receber > 90 dias / Total Contas a Receber) × 100
     * @param {Object} dados - {contasReceberTotal, contasReceber90Dias}
     * @returns {Object}
     */
    calcularInadimplenciaClientes(dados) {
        // Validação de entrada
        if (!dados) {
            return this.retornarIndefinido('Inadimplência Clientes');
        }

        const contasReceberTotal = parseFloat(dados.contasReceberTotal);
        const contasReceber90Dias = parseFloat(dados.contasReceber90Dias);

        // Validação rigorosa
        if (isNaN(contasReceberTotal) || contasReceberTotal === 0) {
            return {
                valor: null,
                valorFormatado: '-',
                status: 'indefinido',
                cor: '#999',
                interpretacao: 'Total de contas a receber ausente ou zerado'
            };
        }

        if (isNaN(contasReceber90Dias)) {
            return {
                valor: null,
                valorFormatado: '-',
                status: 'indefinido',
                cor: '#999',
                interpretacao: 'Contas a receber > 90 dias não informado'
            };
        }

        const percentual = (contasReceber90Dias / contasReceberTotal) * 100;

        // Classificação (mesmos thresholds)
        let status, cor;
        if (percentual <= 2.5) {
            status = 'excelente';
            cor = '#4CAF50';
        } else if (percentual <= 3.5) {
            status = 'bom';
            cor = '#8BC34A';
        } else if (percentual <= 4.5) {
            status = 'adequado';
            cor = '#FF9800';
        } else if (percentual <= 5.0) {
            status = 'baixo';
            cor = '#FF5722';
        } else {
            status = 'crítico';
            cor = '#F44336';
        }

        return {
            valor: percentual,
            valorFormatado: `${percentual.toFixed(1)}%`,
            status,
            cor,
            interpretacao: percentual === 0
                ? 'Sem inadimplência de clientes'
                : `${percentual.toFixed(1)}% das contas a receber com mais de 90 dias de atraso`
        };
    }

    /**
     * Retorna objeto indefinido padrão
     * @param {string} nome - Nome do indicador
     * @returns {Object}
     */
    retornarIndefinido(nome) {
        return {
            valor: null,
            valorFormatado: '-',
            status: 'indefinido',
            cor: '#999',
            interpretacao: `Dados de ${nome} não disponíveis`
        };
    }

    /**
     * Determina o pior status entre uma lista
     * @param {Array} statuses - Lista de status
     * @returns {string}
     */
    determinarPiorStatus(statuses) {
        const prioridade = {
            'crítico': 5,
            'baixo': 4,
            'adequado': 3,
            'bom': 2,
            'excelente': 1,
            'indefinido': 0
        };

        let piorStatus = 'indefinido';
        let piorPrioridade = 0;

        for (const status of statuses) {
            const prioridadeAtual = prioridade[status] ?? 0;
            if (prioridadeAtual > piorPrioridade) {
                piorPrioridade = prioridadeAtual;
                piorStatus = status;
            }
        }

        return piorStatus;
    }

    formatarParaExibicao(indices) {
        const resultado = [];

        if (indices.indiceEndividamentoGeral) {
            resultado.push({
                nome: 'Índice de Endividamento Geral',
                valor: indices.indiceEndividamentoGeral.valorFormatado,
                status: indices.indiceEndividamentoGeral.status,
                cor: indices.indiceEndividamentoGeral.cor,
                interpretacao: indices.indiceEndividamentoGeral.interpretacao
            });
        }

        if (indices.composicaoEndividamento) {
            resultado.push({
                nome: 'Composição do Endividamento',
                valor: indices.composicaoEndividamento.valorFormatado,
                status: indices.composicaoEndividamento.status,
                cor: indices.composicaoEndividamento.cor,
                interpretacao: indices.composicaoEndividamento.interpretacao
            });
        }

        if (indices.grauEndividamento) {
            resultado.push({
                nome: 'Grau de Endividamento',
                valor: indices.grauEndividamento.valorFormatado,
                status: indices.grauEndividamento.status,
                cor: indices.grauEndividamento.cor,
                interpretacao: indices.grauEndividamento.interpretacao
            });
        }

        if (indices.coberturaJuros) {
            resultado.push({
                nome: 'Cobertura de Juros',
                valor: indices.coberturaJuros.valorFormatado,
                status: indices.coberturaJuros.status,
                cor: indices.coberturaJuros.cor,
                interpretacao: indices.coberturaJuros.interpretacao
            });
        }

        return resultado;
    }

    /**
     * Retorna alertas baseados nos índices calculados
     * @param {Object} indices - Índices calculados
     * @returns {Array}
     */
    gerarAlertas(indices) {
        const alertas = [];

        // Endividamento Geral crítico
        if (indices.indiceEndividamentoGeral?.status === 'crítico') {
            alertas.push({
                tipo: 'critico',
                mensagem: 'Índice de Endividamento Geral crítico (>3.0x PL)',
                recomendacao: 'Reduzir endividamento urgentemente ou aumentar capital próprio'
            });
        }

        // Composição crítica (muito curto prazo)
        if (indices.composicaoEndividamento?.status === 'crítico') {
            alertas.push({
                tipo: 'critico',
                mensagem: 'Mais de 85% das dívidas vencem em curto prazo',
                recomendacao: 'Renegociar prazos ou buscar alongamento das dívidas'
            });
        }

        // Cobertura de juros crítica
        if (indices.coberturaJuros?.status === 'crítico') {
            alertas.push({
                tipo: 'critico',
                mensagem: 'EBITDA não cobre adequadamente as despesas financeiras',
                recomendacao: 'Melhorar rentabilidade operacional ou renegociar taxas'
            });
        }

        // Alertas de atenção (baixo)
        if (indices.indiceEndividamentoGeral?.status === 'baixo') {
            alertas.push({
                tipo: 'atencao',
                mensagem: 'Índice de Endividamento Geral elevado (2.0-3.0x PL)',
                recomendacao: 'Monitorar evolução e planejar redução gradual'
            });
        }

        if (indices.composicaoEndividamento?.status === 'baixo') {
            alertas.push({
                tipo: 'atencao',
                mensagem: '70-85% das dívidas são de curto prazo',
                recomendacao: 'Buscar alongamento de prazos quando possível'
            });
        }

        return alertas;
    }
}

// Exportar como ES6 module
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { EndividamentoCalculator };
}

// Exportar para uso global (retrocompatibilidade)
if (typeof window !== 'undefined') {
    window.EndividamentoCalculator = EndividamentoCalculator;
}

console.log('✅ EndividamentoCalculator carregado');
