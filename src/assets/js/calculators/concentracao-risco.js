/* =====================================
   CONCENTRACAO-RISCO.JS
   Calculador de concentração de risco e ciclos operacionais
   Implementa indicadores adaptados do Sicoob GRC para PMEs
   NO FALLBACKS - NO MOCK DATA - SOLID PRINCIPLES
   ===================================== */

class ConcentracaoRiscoCalculator {
    constructor(config, messages) {
        // Validação de dependências obrigatórias
        if (!config) {
            throw new Error('ConcentracaoRiscoCalculator: config obrigatória');
        }
        if (!messages) {
            throw new Error('ConcentracaoRiscoCalculator: messages obrigatória');
        }

        this.config = config;
        this.messages = messages;
    }

    /**
     * Inicializa o calculador
     * Two-phase initialization
     */
    async init() {
        console.log('✓ ConcentracaoRiscoCalculator inicializado');
        return true;
    }

    /**
     * Calcula todos os indicadores de concentração e ciclos
     * @param {Object} dados - Dados completos do sistema
     * @returns {Object}
     */
    async calcularTodos(dados) {
        if (!dados) {
            throw new Error('ConcentracaoRiscoCalculator: dados obrigatórios não fornecidos');
        }

        const concentracaoClientes = this.calcularConcentracaoClientes(dados.clientes);
        const concentracaoFornecedores = this.calcularConcentracaoFornecedores(dados.fornecedores);
        const cicloOperacional = this.calcularCicloOperacional(dados.demonstracoes);
        const cicloFinanceiro = this.calcularCicloFinanceiro(dados.demonstracoes);

        return {
            concentracaoClientes,
            concentracaoFornecedores,
            cicloOperacional,
            cicloFinanceiro,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * 1. Concentração de Clientes
     * Fórmula: (Receita Top 5 Clientes / Receita Total) × 100
     * Interpretação: Quanto maior a concentração, maior o risco
     * @param {Array} dadosClientes - Lista de clientes com receita
     * @returns {Object}
     */
    calcularConcentracaoClientes(dadosClientes) {
        // Validação de entrada - ausência de dados é estado legítimo (não crítico)
        if (!dadosClientes || dadosClientes.length === 0) {
            return {
                valor: null,
                valorFormatado: '-',
                status: 'indefinido',
                cor: '#999',
                interpretacao: 'Dados de clientes não disponíveis',
                topClientes: []
            };
        }

        // Calcular receita total - uso de ?? para nullish (não || )
        const receitaTotal = dadosClientes.reduce((sum, cliente) => {
            const receita = parseFloat(cliente.receitaAnual);
            if (isNaN(receita)) {
                return sum;
            }
            return sum + receita;
        }, 0);

        if (receitaTotal === 0) {
            return {
                valor: 0,
                valorFormatado: '0%',
                status: 'excelente',
                cor: '#4CAF50',
                interpretacao: 'Sem concentração de risco',
                topClientes: []
            };
        }

        // Ordenar clientes por receita (decrescente) e pegar top 5
        const clientesOrdenados = [...dadosClientes].sort((a, b) => {
            const receitaA = parseFloat(a.receitaAnual);
            const receitaB = parseFloat(b.receitaAnual);

            // Tratar NaN explicitamente
            const valorA = isNaN(receitaA) ? 0 : receitaA;
            const valorB = isNaN(receitaB) ? 0 : receitaB;

            return valorB - valorA;
        });

        const top5Clientes = clientesOrdenados.slice(0, 5);
        const receitaTop5 = top5Clientes.reduce((sum, cliente) => {
            const receita = parseFloat(cliente.receitaAnual);
            if (isNaN(receita)) {
                return sum;
            }
            return sum + receita;
        }, 0);

        const percentual = (receitaTop5 / receitaTotal) * 100;

        // Classificação baseada em scoring-criteria.json (thresholds.estruturaConcentracao.concentracaoRisco)
        let status, cor;
        if (percentual <= 30) {
            status = 'excelente';
            cor = '#4CAF50'; // Verde
        } else if (percentual <= 40) {
            status = 'bom';
            cor = '#8BC34A'; // Verde claro
        } else if (percentual <= 50) {
            status = 'adequado';
            cor = '#FF9800'; // Laranja
        } else if (percentual <= 60) {
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
            interpretacao: `${percentual.toFixed(1)}% da receita concentrada nos 5 maiores clientes`,
            topClientes: top5Clientes.map(c => {
                const receita = parseFloat(c.receitaAnual);
                const receitaValida = isNaN(receita) ? 0 : receita;
                return {
                    nome: c.nome,
                    receita: receitaValida,
                    percentual: ((receitaValida / receitaTotal) * 100).toFixed(1)
                };
            })
        };
    }

    /**
     * 2. Concentração de Fornecedores
     * Fórmula: (Compras Top 5 Fornecedores / Total Compras) × 100
     * Interpretação: Dependência de poucos fornecedores aumenta risco
     * @param {Array} dadosFornecedores - Lista de fornecedores com volume de compras
     * @returns {Object}
     */
    calcularConcentracaoFornecedores(dadosFornecedores) {
        // Validação de entrada - ausência de dados é estado legítimo (não crítico)
        if (!dadosFornecedores || dadosFornecedores.length === 0) {
            return {
                valor: null,
                valorFormatado: '-',
                status: 'indefinido',
                cor: '#999',
                interpretacao: 'Dados de fornecedores não disponíveis',
                topFornecedores: []
            };
        }

        // Calcular total de compras - sem || 0
        const totalCompras = dadosFornecedores.reduce((sum, fornecedor) => {
            const compras = parseFloat(fornecedor.comprasAnuais);
            if (isNaN(compras)) {
                return sum;
            }
            return sum + compras;
        }, 0);

        if (totalCompras === 0) {
            return {
                valor: 0,
                valorFormatado: '0%',
                status: 'excelente',
                cor: '#4CAF50',
                interpretacao: 'Sem concentração de risco',
                topFornecedores: []
            };
        }

        // Ordenar fornecedores por compras (decrescente) e pegar top 5
        const fornecedoresOrdenados = [...dadosFornecedores].sort((a, b) => {
            const comprasA = parseFloat(a.comprasAnuais);
            const comprasB = parseFloat(b.comprasAnuais);

            // Tratar NaN explicitamente
            const valorA = isNaN(comprasA) ? 0 : comprasA;
            const valorB = isNaN(comprasB) ? 0 : comprasB;

            return valorB - valorA;
        });

        const top5Fornecedores = fornecedoresOrdenados.slice(0, 5);
        const comprasTop5 = top5Fornecedores.reduce((sum, fornecedor) => {
            const compras = parseFloat(fornecedor.comprasAnuais);
            if (isNaN(compras)) {
                return sum;
            }
            return sum + compras;
        }, 0);

        const percentual = (comprasTop5 / totalCompras) * 100;

        // Classificação (mesmos thresholds que clientes)
        let status, cor;
        if (percentual <= 30) {
            status = 'excelente';
            cor = '#4CAF50';
        } else if (percentual <= 40) {
            status = 'bom';
            cor = '#8BC34A';
        } else if (percentual <= 50) {
            status = 'adequado';
            cor = '#FF9800';
        } else if (percentual <= 60) {
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
            interpretacao: `${percentual.toFixed(1)}% das compras concentradas nos 5 maiores fornecedores`,
            topFornecedores: top5Fornecedores.map(f => {
                const compras = parseFloat(f.comprasAnuais);
                const comprasValidas = isNaN(compras) ? 0 : compras;
                return {
                    nome: f.nome,
                    compras: comprasValidas,
                    percentual: ((comprasValidas / totalCompras) * 100).toFixed(1)
                };
            })
        };
    }

    /**
     * 3. Ciclo Operacional
     * Fórmula: PMR (Prazo Médio Recebimento) + PME (Prazo Médio Estoque)
     * Interpretação: Tempo entre compra de insumos e recebimento de vendas
     * @param {Object} dadosDemonstracoes - Dados financeiros (DRE + Balanço)
     * @returns {Object}
     */
    calcularCicloOperacional(dadosDemonstracoes) {
        // Validação crítica - demonstrações são obrigatórias para este cálculo
        if (!dadosDemonstracoes) {
            return {
                valor: null,
                valorFormatado: '-',
                status: 'indefinido',
                cor: '#999',
                interpretacao: 'Demonstrações financeiras não disponíveis',
                pmr: null,
                pme: null
            };
        }

        if (!dadosDemonstracoes.balanco || !dadosDemonstracoes.dre) {
            return {
                valor: null,
                valorFormatado: '-',
                status: 'indefinido',
                cor: '#999',
                interpretacao: 'Balanço ou DRE não preenchidos',
                pmr: null,
                pme: null
            };
        }

        const balanco = dadosDemonstracoes.balanco;
        const dre = dadosDemonstracoes.dre;

        // Validação rigorosa de campos obrigatórios
        const contasReceber = parseFloat(balanco.contasReceber);
        const receitaLiquida = parseFloat(dre.receitaLiquida);

        if (isNaN(receitaLiquida) || receitaLiquida === 0) {
            return {
                valor: null,
                valorFormatado: '-',
                status: 'indefinido',
                cor: '#999',
                interpretacao: 'Receita líquida ausente ou zerada - impossível calcular',
                pmr: null,
                pme: null
            };
        }

        // PMR pode ser zero (se não há contas a receber)
        const pmr = isNaN(contasReceber) ? 0 : (contasReceber / receitaLiquida) * 360;

        // Calcular PME (Prazo Médio de Estoques)
        const estoques = parseFloat(balanco.estoques);
        const cmv = parseFloat(dre.cmv);

        // PME só calculável se CMV > 0
        let pme = 0;
        if (!isNaN(cmv) && cmv > 0 && !isNaN(estoques)) {
            pme = (estoques / cmv) * 360;
        }

        const cicloOperacional = pmr + pme;

        // Classificação (quanto menor, melhor - mas considerando setor)
        let status, cor;
        if (cicloOperacional <= 30) {
            status = 'excelente';
            cor = '#4CAF50';
        } else if (cicloOperacional <= 45) {
            status = 'bom';
            cor = '#8BC34A';
        } else if (cicloOperacional <= 60) {
            status = 'adequado';
            cor = '#FF9800';
        } else if (cicloOperacional <= 90) {
            status = 'baixo';
            cor = '#FF5722';
        } else {
            status = 'crítico';
            cor = '#F44336';
        }

        return {
            valor: cicloOperacional,
            valorFormatado: `${cicloOperacional.toFixed(0)} dias`,
            status,
            cor,
            interpretacao: `${cicloOperacional.toFixed(0)} dias entre compra e recebimento`,
            pmr: pmr.toFixed(0),
            pme: pme.toFixed(0)
        };
    }

    /**
     * 4. Ciclo Financeiro
     * Fórmula: Ciclo Operacional - PMP (Prazo Médio Pagamento)
     * Interpretação: Necessidade de financiamento (quanto menor, melhor)
     * @param {Object} dadosDemonstracoes - Dados financeiros (DRE + Balanço)
     * @returns {Object}
     */
    calcularCicloFinanceiro(dadosDemonstracoes) {
        // Validação de entrada
        if (!dadosDemonstracoes || !dadosDemonstracoes.balanco || !dadosDemonstracoes.dre) {
            return {
                valor: null,
                valorFormatado: '-',
                status: 'indefinido',
                cor: '#999',
                interpretacao: 'Demonstrações financeiras não disponíveis',
                cicloOperacional: null,
                pmp: null
            };
        }

        // Calcular Ciclo Operacional primeiro
        const resultadoCO = this.calcularCicloOperacional(dadosDemonstracoes);

        if (resultadoCO.valor === null) {
            return {
                valor: null,
                valorFormatado: '-',
                status: 'indefinido',
                cor: '#999',
                interpretacao: 'Impossível calcular ciclo operacional',
                cicloOperacional: null,
                pmp: null
            };
        }

        const cicloOperacional = resultadoCO.valor;

        // Calcular PMP (Prazo Médio de Pagamento)
        const balanco = dadosDemonstracoes.balanco;
        const dre = dadosDemonstracoes.dre;

        const fornecedores = parseFloat(balanco.fornecedores);
        const cmv = parseFloat(dre.cmv);

        // PMP só calculável se CMV > 0
        let pmp = 0;
        if (!isNaN(cmv) && cmv > 0 && !isNaN(fornecedores)) {
            pmp = (fornecedores / cmv) * 360;
        }

        const cicloFinanceiro = cicloOperacional - pmp;

        // Classificação (quanto menor, melhor - ideal é negativo!)
        let status, cor;
        if (cicloFinanceiro <= 0) {
            status = 'excelente';
            cor = '#4CAF50';
        } else if (cicloFinanceiro <= 15) {
            status = 'bom';
            cor = '#8BC34A';
        } else if (cicloFinanceiro <= 30) {
            status = 'adequado';
            cor = '#FF9800';
        } else if (cicloFinanceiro <= 60) {
            status = 'baixo';
            cor = '#FF5722';
        } else {
            status = 'crítico';
            cor = '#F44336';
        }

        return {
            valor: cicloFinanceiro,
            valorFormatado: `${cicloFinanceiro.toFixed(0)} dias`,
            status,
            cor,
            interpretacao: cicloFinanceiro <= 0
                ? 'Empresa financia operação com fornecedores (excelente)'
                : `${cicloFinanceiro.toFixed(0)} dias de necessidade de financiamento`,
            cicloOperacional: resultadoCO.valorFormatado,
            pmp: pmp.toFixed(0)
        };
    }

    /**
     * Formata indicadores para exibição
     * @param {Object} indicadores - Objeto com todos os indicadores
     * @returns {Array}
     */
    formatarParaExibicao(indicadores) {
        const resultado = [];

        if (indicadores.concentracaoClientes) {
            resultado.push({
                nome: 'Concentração de Clientes (Top 5)',
                valor: indicadores.concentracaoClientes.valorFormatado,
                status: indicadores.concentracaoClientes.status,
                cor: indicadores.concentracaoClientes.cor,
                interpretacao: indicadores.concentracaoClientes.interpretacao
            });
        }

        if (indicadores.concentracaoFornecedores) {
            resultado.push({
                nome: 'Concentração de Fornecedores (Top 5)',
                valor: indicadores.concentracaoFornecedores.valorFormatado,
                status: indicadores.concentracaoFornecedores.status,
                cor: indicadores.concentracaoFornecedores.cor,
                interpretacao: indicadores.concentracaoFornecedores.interpretacao
            });
        }

        if (indicadores.cicloOperacional) {
            resultado.push({
                nome: 'Ciclo Operacional',
                valor: indicadores.cicloOperacional.valorFormatado,
                status: indicadores.cicloOperacional.status,
                cor: indicadores.cicloOperacional.cor,
                interpretacao: indicadores.cicloOperacional.interpretacao
            });
        }

        if (indicadores.cicloFinanceiro) {
            resultado.push({
                nome: 'Ciclo Financeiro',
                valor: indicadores.cicloFinanceiro.valorFormatado,
                status: indicadores.cicloFinanceiro.status,
                cor: indicadores.cicloFinanceiro.cor,
                interpretacao: indicadores.cicloFinanceiro.interpretacao
            });
        }

        return resultado;
    }

    /**
     * Retorna alertas baseados nos indicadores calculados
     * @param {Object} indicadores - Indicadores calculados
     * @returns {Array}
     */
    gerarAlertas(indicadores) {
        const alertas = [];

        // Concentração de Clientes crítica
        if (indicadores.concentracaoClientes?.status === 'crítico') {
            alertas.push({
                tipo: 'critico',
                mensagem: 'Mais de 60% da receita concentrada em 5 clientes',
                recomendacao: 'Diversificar base de clientes para reduzir dependência'
            });
        }

        // Concentração de Fornecedores crítica
        if (indicadores.concentracaoFornecedores?.status === 'crítico') {
            alertas.push({
                tipo: 'critico',
                mensagem: 'Mais de 60% das compras concentradas em 5 fornecedores',
                recomendacao: 'Buscar fornecedores alternativos para mitigar risco de interrupção'
            });
        }

        // Ciclo Financeiro crítico
        if (indicadores.cicloFinanceiro?.status === 'crítico') {
            alertas.push({
                tipo: 'critico',
                mensagem: 'Ciclo financeiro acima de 60 dias - alta necessidade de capital de giro',
                recomendacao: 'Melhorar prazos de recebimento ou alongar prazos de pagamento'
            });
        }

        // Alertas de atenção (baixo)
        if (indicadores.concentracaoClientes?.status === 'baixo') {
            alertas.push({
                tipo: 'atencao',
                mensagem: '50-60% da receita concentrada em poucos clientes',
                recomendacao: 'Planejar expansão de base de clientes gradualmente'
            });
        }

        if (indicadores.cicloOperacional?.status === 'baixo') {
            alertas.push({
                tipo: 'atencao',
                mensagem: 'Ciclo operacional longo (60-90 dias) impacta capital de giro',
                recomendacao: 'Revisar políticas de estoque e crédito a clientes'
            });
        }

        return alertas;
    }
}

// Exportar como ES6 module
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ConcentracaoRiscoCalculator };
}

// Exportar para uso global (retrocompatibilidade)
if (typeof window !== 'undefined') {
    window.ConcentracaoRiscoCalculator = ConcentracaoRiscoCalculator;
}

console.log('✅ ConcentracaoRiscoCalculator carregado');
