/**
 * FormDataAdapter
 *
 * Extrai dados de formulários HTML de forma completamente dinâmica.
 * NÃO possui dados hardcoded - tudo é descoberto dinamicamente via DOM.
 *
 * Arquitetura:
 * - Extração 100% dinâmica baseada em padrões de nomenclatura
 * - Conversão automática de valores monetários formatados → number
 * - Validação com warnings (não bloqueia cálculo)
 * - Zero dependências de listas de campos específicos
 */

export class FormDataAdapter {
    /**
     * Extrai dados de Balanço Patrimonial do HTML
     * @returns {Object} { periodos: [{nomeConta: valor}, ...] }
     */
    static extractBalancoData() {
        console.log('[FormDataAdapter] Extraindo dados de Balanço...');
        return this._extractDemonstrativoData('balanco');
    }

    /**
     * Extrai dados de DRE do HTML
     * @returns {Object} { periodos: [{nomeConta: valor}, ...] }
     */
    static extractDREData() {
        console.log('[FormDataAdapter] Extraindo dados de DRE...');
        return this._extractDemonstrativoData('dre');
    }

    /**
     * Extrai dados de um demonstrativo completo (4 períodos)
     * @private
     * @param {string} tipo - 'balanco' ou 'dre'
     * @returns {Object} { periodos: Array<Object> }
     */
    static _extractDemonstrativoData(tipo) {
        const periodos = [];

        for (let p = 1; p <= 4; p++) {
            const dadosPeriodo = this._extractPeriodoData(p, tipo);
            periodos.push({
                numero: p,
                ...dadosPeriodo
            });
        }

        console.log(`[FormDataAdapter] ${tipo} extraído:`, periodos);
        return { periodos };
    }

    /**
     * Extrai TODOS os campos de um período específico (inputs + elementos calculados)
     * @private
     * @param {number} periodo - Número do período (1-4)
     * @param {string} tipo - 'balanco' ou 'dre'
     * @returns {Object} Objeto com todas as contas do período
     */
    static _extractPeriodoData(periodo, tipo) {
        const dados = {};
        const sufixo = `_p${periodo}`;

        // Determinar container baseado no tipo
        const containerId = tipo === 'balanco' ? '#balanco' : '#dre';
        const container = document.querySelector(containerId);

        if (!container) {
            console.warn(`[FormDataAdapter] Container ${containerId} não encontrado`);
            return dados;
        }

        // 1. Extrair INPUTS (campos editáveis) dentro do container
        const inputs = container.querySelectorAll(`input[name$="${sufixo}"]`);

        inputs.forEach(input => {
            const nomeCompleto = input.name.replace(sufixo, '');

            // Remover qualquer prefixo 'dre_' se existir (compatibilidade)
            const nomeCampo = nomeCompleto.replace(/^dre_/, '');

            // Converter valor
            const valorNumerico = this._parseValorMonetario(input.value);
            dados[nomeCampo] = valorNumerico;
        });

        // 2. Extrair ELEMENTOS CALCULADOS (spans/divs com id={campo}_p{periodo}) dentro do container
        const elementosCalculados = container.querySelectorAll(`[id$="${sufixo}"]`);

        elementosCalculados.forEach(elemento => {
            const idCompleto = elemento.id.replace(sufixo, '');

            // Remover qualquer prefixo 'dre_' se existir (compatibilidade)
            const nomeCampo = idCompleto.replace(/^dre_/, '');

            // Evitar duplicatas (input já adicionado)
            if (dados[nomeCampo] === undefined) {
                const valorTexto = elemento.textContent.trim();
                const valorNumerico = this._parseValorMonetario(valorTexto);
                dados[nomeCampo] = valorNumerico;
            }
        });

        return dados;
    }

    /**
     * Converte string monetária formatada para número
     * @private
     * @param {string} valorString - Valor formatado (ex: "R$ 1.000,00" ou "1.000,00")
     * @returns {number|null} Valor numérico ou null se inválido/vazio
     */
    static _parseValorMonetario(valorString) {
        if (!valorString || valorString.trim() === '' || valorString.trim() === '-') {
            return null;
        }

        try {
            // Remover símbolos de moeda, espaços e pontos (milhares)
            let valorLimpo = valorString
                .replace(/R\$/g, '')
                .replace(/\s/g, '')
                .replace(/\./g, '');

            // Substituir vírgula decimal por ponto
            valorLimpo = valorLimpo.replace(',', '.');

            // Converter para número
            const numero = parseFloat(valorLimpo);

            return isNaN(numero) ? null : numero;
        } catch (error) {
            console.warn(`[FormDataAdapter] Erro ao converter: "${valorString}"`, error);
            return null;
        }
    }

    /**
     * Valida presença de campos obrigatórios
     * @param {Object} dados - Dados extraídos (formato: { periodos: [...] })
     * @param {string} tipo - 'balanco' ou 'dre'
     * @returns {Object} { valido: boolean, warnings: string[] }
     */
    static validateRequiredFields(dados, tipo) {
        const warnings = [];

        if (!dados || !dados.periodos || dados.periodos.length === 0) {
            warnings.push(`Nenhum período encontrado para ${tipo}`);
            return { valido: false, warnings };
        }

        // Validações básicas (genéricas)
        dados.periodos.forEach((periodo, index) => {
            const numCampos = Object.keys(periodo).filter(k => k !== 'numero').length;

            if (numCampos === 0) {
                warnings.push(`Período ${index + 1}: Nenhum campo encontrado`);
            }

            // Para Balanço: validar equação contábil se campos existirem
            if (tipo === 'balanco' && periodo.ativoTotal && periodo.patrimonioLiquidoTotal) {
                const ativo = periodo.ativoTotal;
                const passivo = (periodo.passivoCirculanteTotal || 0) + (periodo.passivoNaoCirculanteTotal || 0);
                const pl = periodo.patrimonioLiquidoTotal;
                const totalPassivoPL = passivo + pl;

                const diferenca = Math.abs(ativo - totalPassivoPL);
                const tolerancia = ativo * 0.01; // 1%

                if (diferenca > tolerancia) {
                    warnings.push(
                        `Período ${index + 1}: Equação contábil desbalanceada ` +
                        `(Ativo: ${ativo.toFixed(2)} ≠ Passivo+PL: ${totalPassivoPL.toFixed(2)})`
                    );
                }
            }
        });

        // Log warnings (não bloqueia)
        if (warnings.length > 0) {
            console.warn(`[FormDataAdapter] Validação ${tipo}:`, warnings);
        } else {
            console.log(`[FormDataAdapter] Validação ${tipo}: ✅ OK`);
        }

        return { valido: warnings.length === 0, warnings };
    }

    /**
     * Extrai metadados do período 4 (balancete parcial)
     * @returns {Object} { parcial: boolean, meses: number|null }
     */
    static extractPeriodo4Metadata() {
        const checkbox = document.getElementById('periodo4Parcial');
        const input = document.getElementById('periodo4Meses');

        return {
            parcial: checkbox ? checkbox.checked : false,
            meses: checkbox?.checked && input ? parseInt(input.value) : null
        };
    }

    /**
     * Extrai datas dos períodos
     * @returns {Array<string|null>} Array com 4 datas ou nulls
     */
    static extractPeriodoDatas() {
        const datas = [];

        for (let p = 1; p <= 4; p++) {
            const input = document.querySelector(`input[name="periodo${p}Data"]`);
            datas.push(input?.value || null);
        }

        return datas;
    }

    /**
     * Extrai TODOS os dados necessários (Balanço + DRE + Metadados)
     * @returns {Object} Objeto consolidado completo
     */
    static extractAllData() {
        const balanco = this.extractBalancoData();
        const dre = this.extractDREData();
        const periodo4Meta = this.extractPeriodo4Metadata();
        const datas = this.extractPeriodoDatas();

        // Validações
        const validacaoBalanco = this.validateRequiredFields(balanco, 'balanco');
        const validacaoDRE = this.validateRequiredFields(dre, 'dre');

        return {
            balanco,
            dre,
            metadata: {
                periodo4: periodo4Meta,
                datas,
                validacoes: {
                    balanco: validacaoBalanco,
                    dre: validacaoDRE
                }
            },
            timestamp: Date.now()
        };
    }
}

export default FormDataAdapter;
