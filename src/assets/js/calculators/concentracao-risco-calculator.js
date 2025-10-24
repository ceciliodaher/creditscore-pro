/**
 * concentracao-risco-calculator.js
 * Calculador para Análise de Concentração de Risco de Clientes e Fornecedores.
 *
 * Implementa as recomendações da Fase 1 de melhorias do sistema de scoring.
 *
 * @version 1.0.0
 * @date 2025-10-23
 */

export class ConcentracaoRiscoCalculator {
    /**
     * @param {object} config - Objeto de configuração com thresholds.
     * @param {object} messages - Objeto com mensagens de log e UI.
     */
    constructor(config, messages) {
        this.config = config;
        this.messages = messages;
        this.thresholds = this.config?.scoring?.thresholds?.concentracaoRisco || {
            clientes: { excelente: 30, critico: 50 },
            fornecedores: { excelente: 30, critico: 50 }
        };
        console.log('📊 ConcentracaoRiscoCalculator inicializado');
    }

    /**
     * Calcula a concentração dos 5 principais clientes.
     * @param {number} faturamentoTop5Clientes - Faturamento total dos 5 maiores clientes.
     * @param {number} receitaTotal - Receita total da empresa.
     * @returns {{percentual: number|null, classificacao: string, mensagem: string}}
     */
    calcularConcentracaoClientes(faturamentoTop5Clientes, receitaTotal) {
        if (receitaTotal === null || receitaTotal === undefined || receitaTotal === 0 || faturamentoTop5Clientes === null || faturamentoTop5Clientes === undefined) {
            return { percentual: null, classificacao: 'Indefinido', mensagem: 'Dados insuficientes para cálculo.' };
        }

        const percentual = (faturamentoTop5Clientes / receitaTotal) * 100;
        const { excelente, critico } = this.thresholds.clientes;

        let classificacao;
        let mensagem;

        if (percentual <= excelente) {
            classificacao = 'Excelente';
            mensagem = `Baixa concentração de clientes (${percentual.toFixed(1)}%). Risco pulverizado.`;
        } else if (percentual > critico) {
            classificacao = 'Crítico';
            mensagem = `Alta concentração de clientes (${percentual.toFixed(1)}%). Elevada dependência dos principais clientes.`;
        } else {
            classificacao = 'Atenção';
            mensagem = `Concentração moderada de clientes (${percentual.toFixed(1)}%). Monitorar dependência.`;
        }

        return { percentual, classificacao, mensagem };
    }

    /**
     * Calcula a concentração dos 5 principais fornecedores.
     * @param {number} comprasTop5Fornecedores - Volume de compras dos 5 maiores fornecedores.
     * @param {number} comprasTotais - Volume total de compras ou CMV.
     * @returns {{percentual: number|null, classificacao: string, mensagem: string}}
     */
    calcularConcentracaoFornecedores(comprasTop5Fornecedores, comprasTotais) {
        if (comprasTotais === null || comprasTotais === undefined || comprasTotais === 0 || comprasTop5Fornecedores === null || comprasTop5Fornecedores === undefined) {
            return { percentual: null, classificacao: 'Indefinido', mensagem: 'Dados insuficientes para cálculo.' };
        }

        const percentual = (comprasTop5Fornecedores / comprasTotais) * 100;
        const { excelente, critico } = this.thresholds.fornecedores;

        let classificacao;
        let mensagem;

        if (percentual <= excelente) {
            classificacao = 'Excelente';
            mensagem = `Baixa concentração de fornecedores (${percentual.toFixed(1)}%). Cadeia de suprimentos diversificada.`;
        } else if (percentual > critico) {
            classificacao = 'Crítico';
            mensagem = `Alta concentração de fornecedores (${percentual.toFixed(1)}%). Risco de ruptura na cadeia de suprimentos.`;
        } else {
            classificacao = 'Atenção';
            mensagem = `Concentração moderada de fornecedores (${percentual.toFixed(1)}%). Avaliar alternativas.`;
        }

        return { percentual, classificacao, mensagem };
    }

    /**
     * Executa a análise completa de concentração de risco.
     * @param {object} dados - Objeto com os dados necessários.
     * @param {number} dados.faturamentoTop5Clientes
     * @param {number} dados.receitaTotal
     * @param {number} dados.comprasTop5Fornecedores
     * @param {number} dados.comprasTotais
     * @returns {{clientes: object, fornecedores: object}}
     */
    analisar(dados) {
        console.log('🔍 Analisando concentração de risco...');
        const analiseClientes = this.calcularConcentracaoClientes(dados.faturamentoTop5Clientes, dados.receitaTotal);
        const analiseFornecedores = this.calcularConcentracaoFornecedores(dados.comprasTop5Fornecedores, dados.comprasTotais);
        console.log('✅ Análise de concentração de risco concluída.');

        return {
            clientes: analiseClientes,
            fornecedores: analiseFornecedores,
        };
    }
}

if (typeof window !== 'undefined') {
    window.ConcentracaoRiscoCalculator = ConcentracaoRiscoCalculator;
}