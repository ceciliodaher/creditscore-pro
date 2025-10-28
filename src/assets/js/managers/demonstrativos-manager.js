/**
 * demonstrativos-manager.js
 * Gerenciador centralizado de Demonstrativos Financeiros (Balanço e DRE)
 *
 * FASE 0: Multi-empresa com isolamento de dados
 * - Singleton pattern para garantir única instância
 * - Validação obrigatória de empresaId em todos os saves/loads
 * - Chaves compostas: ${tipo}_${empresaId}
 * - NO FALLBACKS: Exceções explícitas quando empresaId não disponível
 *
 * @version 1.0.0
 * @date 2025-10-28
 */

class DemonstrativosManager {
    static #instance = null;

    /**
     * @param {Object} dbManager - Instância do CreditscoreIndexedDB
     */
    constructor(dbManager) {
        // Impedir criação direta (usar getInstance)
        if (DemonstrativosManager.#instance) {
            throw new Error(
                'DemonstrativosManager: Use DemonstrativosManager.getInstance() para obter a instância'
            );
        }

        // Validação obrigatória - NO FALLBACKS
        if (!dbManager) {
            throw new Error('DemonstrativosManager: dbManager obrigatório não fornecido');
        }

        // Validar que dbManager tem a API esperada
        if (typeof dbManager.save !== 'function' || typeof dbManager.get !== 'function') {
            throw new Error('DemonstrativosManager: dbManager não possui API esperada (save, get)');
        }

        this.db = dbManager;
        console.log('✅ DemonstrativosManager instanciado');
    }

    /**
     * Obtém a instância singleton
     * @param {Object} dbManager - Instância do CreditscoreIndexedDB (obrigatório na primeira chamada)
     * @returns {DemonstrativosManager}
     */
    static getInstance(dbManager = null) {
        if (!DemonstrativosManager.#instance) {
            if (!dbManager) {
                throw new Error(
                    'DemonstrativosManager: dbManager obrigatório na primeira chamada de getInstance()'
                );
            }
            DemonstrativosManager.#instance = new DemonstrativosManager(dbManager);
        }

        return DemonstrativosManager.#instance;
    }

    /**
     * FASE 0: Obtém empresaId do EmpresaAccessManager
     * @private
     * @returns {number} ID da empresa ativa
     * @throws {Error} Se empresaId não disponível
     */
    #getEmpresaId() {
        const empresaId = window.EmpresaAccessManager?.getContext()?.empresaId;

        if (!empresaId) {
            throw new Error(
                'empresaId não disponível - ' +
                'Nenhuma empresa selecionada. Use CompanySelector para selecionar uma empresa.'
            );
        }

        return empresaId;
    }

    /**
     * FASE 0: Gera chave composta para demonstrativo
     * @private
     * @param {string} tipo - 'balanco' ou 'dre'
     * @returns {string} Chave no formato "{tipo}_{empresaId}"
     */
    #getCompositeKey(tipo) {
        const empresaId = this.#getEmpresaId();
        return `${tipo}_${empresaId}`;
    }

    /**
     * Salva dados de Balanço Patrimonial
     * @param {Object} dadosBalanco - Dados do balanço (68 contas)
     * @returns {Promise<void>}
     */
    async saveBalanco(dadosBalanco) {
        if (!dadosBalanco || typeof dadosBalanco !== 'object') {
            throw new Error('DemonstrativosManager: dadosBalanco deve ser um objeto válido');
        }

        try {
            const empresaId = this.#getEmpresaId();
            const key = this.#getCompositeKey('balanco');

            const data = {
                key: key,
                empresaId: empresaId,
                tipo: 'balanco',
                dados: dadosBalanco,
                timestamp: Date.now()
            };

            await this.db.save('calculation_data', data);

            console.log(`💾 Balanço salvo (empresa ${empresaId})`);
        } catch (error) {
            console.error('❌ Erro ao salvar Balanço:', error);
            throw new Error(`Falha ao salvar Balanço: ${error.message}`);
        }
    }

    /**
     * Carrega dados de Balanço Patrimonial
     * @returns {Promise<Object|null>} Dados do balanço ou null se não existir
     */
    async loadBalanco() {
        try {
            const empresaId = this.#getEmpresaId();
            const key = this.#getCompositeKey('balanco');

            const data = await this.db.get('calculation_data', key);

            if (!data) {
                console.log(`ℹ️ Nenhum dado de Balanço encontrado para empresa ${empresaId}`);
                return null;
            }

            console.log(`📥 Balanço carregado (empresa ${empresaId})`);
            return data.dados;
        } catch (error) {
            console.error('❌ Erro ao carregar Balanço:', error);
            throw new Error(`Falha ao carregar Balanço: ${error.message}`);
        }
    }

    /**
     * Salva dados de DRE (Demonstração do Resultado do Exercício)
     * @param {Object} dadosDRE - Dados da DRE (30 contas)
     * @returns {Promise<void>}
     */
    async saveDRE(dadosDRE) {
        if (!dadosDRE || typeof dadosDRE !== 'object') {
            throw new Error('DemonstrativosManager: dadosDRE deve ser um objeto válido');
        }

        try {
            const empresaId = this.#getEmpresaId();
            const key = this.#getCompositeKey('dre');

            const data = {
                key: key,
                empresaId: empresaId,
                tipo: 'dre',
                dados: dadosDRE,
                timestamp: Date.now()
            };

            await this.db.save('calculation_data', data);

            console.log(`💾 DRE salva (empresa ${empresaId})`);
        } catch (error) {
            console.error('❌ Erro ao salvar DRE:', error);
            throw new Error(`Falha ao salvar DRE: ${error.message}`);
        }
    }

    /**
     * Carrega dados de DRE
     * @returns {Promise<Object|null>} Dados da DRE ou null se não existir
     */
    async loadDRE() {
        try {
            const empresaId = this.#getEmpresaId();
            const key = this.#getCompositeKey('dre');

            const data = await this.db.get('calculation_data', key);

            if (!data) {
                console.log(`ℹ️ Nenhum dado de DRE encontrado para empresa ${empresaId}`);
                return null;
            }

            console.log(`📥 DRE carregada (empresa ${empresaId})`);
            return data.dados;
        } catch (error) {
            console.error('❌ Erro ao carregar DRE:', error);
            throw new Error(`Falha ao carregar DRE: ${error.message}`);
        }
    }

    /**
     * Salva análises financeiras (AH, AV, Indicadores)
     * @param {string} tipo - 'balanco' ou 'dre'
     * @param {Object} analises - Objeto com { ah, av, indicadores }
     * @returns {Promise<void>}
     */
    async saveAnalises(tipo, analises) {
        if (!tipo || !['balanco', 'dre'].includes(tipo)) {
            throw new Error('DemonstrativosManager: tipo deve ser "balanco" ou "dre"');
        }

        if (!analises || typeof analises !== 'object') {
            throw new Error('DemonstrativosManager: analises deve ser um objeto válido');
        }

        try {
            const empresaId = this.#getEmpresaId();
            const key = this.#getCompositeKey(`analises_${tipo}`);

            const data = {
                key: key,
                empresaId: empresaId,
                tipo: `analises_${tipo}`,
                dados: analises,
                timestamp: Date.now()
            };

            await this.db.save('calculation_data', data);

            console.log(`💾 Análises de ${tipo} salvas (empresa ${empresaId})`);
        } catch (error) {
            console.error(`❌ Erro ao salvar análises de ${tipo}:`, error);
            throw new Error(`Falha ao salvar análises de ${tipo}: ${error.message}`);
        }
    }

    /**
     * Carrega análises financeiras
     * @param {string} tipo - 'balanco' ou 'dre'
     * @returns {Promise<Object|null>} Análises ou null se não existir
     */
    async loadAnalises(tipo) {
        if (!tipo || !['balanco', 'dre'].includes(tipo)) {
            throw new Error('DemonstrativosManager: tipo deve ser "balanco" ou "dre"');
        }

        try {
            const empresaId = this.#getEmpresaId();
            const key = this.#getCompositeKey(`analises_${tipo}`);

            const data = await this.db.get('calculation_data', key);

            if (!data) {
                console.log(`ℹ️ Nenhuma análise de ${tipo} encontrada para empresa ${empresaId}`);
                return null;
            }

            console.log(`📥 Análises de ${tipo} carregadas (empresa ${empresaId})`);
            return data.dados;
        } catch (error) {
            console.error(`❌ Erro ao carregar análises de ${tipo}:`, error);
            throw new Error(`Falha ao carregar análises de ${tipo}: ${error.message}`);
        }
    }

    /**
     * Limpa todos os dados da empresa ativa (Balanço, DRE, Análises)
     * @returns {Promise<void>}
     */
    async clearAll() {
        try {
            const empresaId = this.#getEmpresaId();

            // Limpar todos os demonstrativos
            const keys = [
                this.#getCompositeKey('balanco'),
                this.#getCompositeKey('dre'),
                this.#getCompositeKey('analises_balanco'),
                this.#getCompositeKey('analises_dre')
            ];

            for (const key of keys) {
                try {
                    await this.db.delete('calculation_data', key);
                    console.log(`🗑️ Removido: ${key}`);
                } catch (error) {
                    // Se não existir, apenas logar warning
                    console.warn(`⚠️ Não foi possível remover ${key}:`, error.message);
                }
            }

            console.log(`✅ Todos os demonstrativos da empresa ${empresaId} foram limpos`);
        } catch (error) {
            console.error('❌ Erro ao limpar demonstrativos:', error);
            throw new Error(`Falha ao limpar demonstrativos: ${error.message}`);
        }
    }

    /**
     * Verifica se existem dados salvos para a empresa ativa
     * @returns {Promise<Object>} Status de existência { balanco: boolean, dre: boolean }
     */
    async checkDataExists() {
        try {
            const empresaId = this.#getEmpresaId();

            const balanco = await this.loadBalanco();
            const dre = await this.loadDRE();

            return {
                empresaId: empresaId,
                balanco: balanco !== null,
                dre: dre !== null
            };
        } catch (error) {
            console.error('❌ Erro ao verificar existência de dados:', error);
            throw new Error(`Falha ao verificar dados: ${error.message}`);
        }
    }
}

// Disponibilizar globalmente
if (typeof window !== 'undefined') {
    window.DemonstrativosManager = DemonstrativosManager;
}

// Export para ES6 modules
export default DemonstrativosManager;

console.log('✅ DemonstrativosManager carregado');
