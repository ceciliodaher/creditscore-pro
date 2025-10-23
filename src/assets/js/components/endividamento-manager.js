/* =====================================
   ENDIVIDAMENTO-MANAGER.JS
   Gerenciador de múltiplas dívidas bancárias
   NO FALLBACKS - NO MOCK DATA - SOLID PRINCIPLES
   HYBRID APPROACH: Default values for initial states, explicit errors for critical operations
   ===================================== */

class EndividamentoManager {
    constructor(config, messages, dbManager) {
        // Validação de dependências obrigatórias
        if (!config) {
            throw new Error('EndividamentoManager: config obrigatória');
        }
        if (!messages) {
            throw new Error('EndividamentoManager: messages obrigatória');
        }
        if (!dbManager) {
            throw new Error('EndividamentoManager: dbManager obrigatório');
        }

        this.config = config;
        this.messages = messages;
        this.dbManager = dbManager;
        this.dividas = [];
        this.dividaIdCounter = 1;
        this.empresaId = null;
    }

    /**
     * Inicializa o gerenciador
     * Two-phase initialization
     */
    async init(empresaId = null) {
        this.empresaId = empresaId;

        // Carregar dívidas do localStorage
        this.loadFromLocalStorage();

        // Se empresaId fornecida, carregar do IndexedDB
        if (empresaId) {
            await this.loadFromIndexedDB(empresaId);
        }

        // Configurar event listeners
        this.setupEventListeners();

        console.log('✓ EndividamentoManager inicializado');
        return true;
    }

    /**
     * Configura event listeners
     */
    setupEventListeners() {
        const addBtn = document.getElementById('addDividaBtn');
        if (addBtn) {
            addBtn.addEventListener('click', () => this.addDivida());
        }
    }

    /**
     * Adiciona nova dívida
     * CONTEXTO: Estado inicial vazio é válido (valores default legítimos)
     * @param {Object} data - Dados iniciais da dívida (opcional)
     */
    addDivida(data = null) {
        const dividaId = `divida_${this.dividaIdCounter++}`;

        // Valores default para ESTADO INICIAL VAZIO (legítimo)
        const divida = {
            id: dividaId,
            empresaId: this.empresaId,
            instituicao: data?.instituicao ?? '', // Estado inicial vazio válido
            tipo: data?.tipo ?? '',
            valorOriginal: data?.valorOriginal ?? 0,
            saldoDevedor: data?.saldoDevedor ?? 0,
            taxaJuros: data?.taxaJuros ?? 0,
            dataVencimento: data?.dataVencimento ?? '',
            status: data?.status ?? 'em_dia',
            garantias: data?.garantias ?? '',
            timestamp: new Date().toISOString()
        };

        this.dividas.push(divida);
        this.renderDivida(divida);
        this.updateResumo();
        this.saveToLocalStorage();

        return divida;
    }

    /**
     * Renderiza uma dívida na tabela
     * @param {Object} divida - Objeto dívida
     */
    renderDivida(divida) {
        const tbody = document.getElementById('dividasTableBody');
        if (!tbody) {
            throw new Error('EndividamentoManager: elemento dividasTableBody não encontrado - obrigatório para renderização');
        }

        const emptyState = document.getElementById('emptyState');
        if (emptyState) {
            emptyState.remove();
        }

        const row = document.createElement('tr');
        row.id = divida.id;
        row.style.borderBottom = '1px solid #e0e0e0';
        row.innerHTML = `
            <td style="padding: 12px;">
                <input type="text"
                       class="input-table"
                       data-field="instituicao"
                       value="${divida.instituicao}"
                       placeholder="Nome da instituição"
                       style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
            </td>
            <td style="padding: 12px;">
                <select class="input-table"
                        data-field="tipo"
                        style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                    <option value="">Selecione</option>
                    <option value="emprestimo" ${divida.tipo === 'emprestimo' ? 'selected' : ''}>Empréstimo</option>
                    <option value="financiamento" ${divida.tipo === 'financiamento' ? 'selected' : ''}>Financiamento</option>
                    <option value="leasing" ${divida.tipo === 'leasing' ? 'selected' : ''}>Leasing</option>
                    <option value="debentures" ${divida.tipo === 'debentures' ? 'selected' : ''}>Debêntures</option>
                    <option value="capital_giro" ${divida.tipo === 'capital_giro' ? 'selected' : ''}>Capital de Giro</option>
                    <option value="cheque_especial" ${divida.tipo === 'cheque_especial' ? 'selected' : ''}>Cheque Especial</option>
                    <option value="outro" ${divida.tipo === 'outro' ? 'selected' : ''}>Outro</option>
                </select>
            </td>
            <td style="padding: 12px;">
                <input type="text"
                       class="input-table"
                       data-field="valorOriginal"
                       data-mask="currency"
                       value="${this.formatCurrency(divida.valorOriginal)}"
                       style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; text-align: right;">
            </td>
            <td style="padding: 12px;">
                <input type="text"
                       class="input-table"
                       data-field="saldoDevedor"
                       data-mask="currency"
                       value="${this.formatCurrency(divida.saldoDevedor)}"
                       style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; text-align: right;">
            </td>
            <td style="padding: 12px;">
                <input type="text"
                       class="input-table"
                       data-field="taxaJuros"
                       data-mask="percentage"
                       value="${divida.taxaJuros}"
                       style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; text-align: center;">
            </td>
            <td style="padding: 12px;">
                <input type="date"
                       class="input-table"
                       data-field="dataVencimento"
                       value="${divida.dataVencimento}"
                       style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
            </td>
            <td style="padding: 12px;">
                <select class="input-table"
                        data-field="status"
                        style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                    <option value="em_dia" ${divida.status === 'em_dia' ? 'selected' : ''}>Em Dia</option>
                    <option value="atraso_leve" ${divida.status === 'atraso_leve' ? 'selected' : ''}>Atraso Leve (<30d)</option>
                    <option value="atraso_moderado" ${divida.status === 'atraso_moderado' ? 'selected' : ''}>Atraso Moderado (30-60d)</option>
                    <option value="inadimplente" ${divida.status === 'inadimplente' ? 'selected' : ''}>Inadimplente</option>
                </select>
            </td>
            <td style="padding: 12px;">
                <input type="text"
                       class="input-table"
                       data-field="garantias"
                       value="${divida.garantias}"
                       placeholder="Ex: Imóvel, veículo..."
                       style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
            </td>
            <td style="padding: 12px; text-align: center;">
                <button type="button"
                        class="btn-delete"
                        data-divida-id="${divida.id}"
                        style="background: #F44336; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer;">
                    🗑️
                </button>
            </td>
        `;

        tbody.appendChild(row);

        // Adicionar listeners para atualização automática
        row.querySelectorAll('.input-table').forEach(input => {
            input.addEventListener('change', (e) => this.updateDivida(divida.id, e.target));
            input.addEventListener('input', (e) => {
                if (e.target.dataset.field === 'saldoDevedor') {
                    this.updateResumo();
                }
            });
        });

        // Listener para botão delete
        row.querySelector('.btn-delete').addEventListener('click', (e) => {
            const dividaId = e.target.dataset.dividaId;
            this.removeDivida(dividaId);
        });

        // Aplicar máscaras
        this.applyMasks(row);
    }

    /**
     * Atualiza dados de uma dívida
     * @param {string} dividaId - ID da dívida
     * @param {HTMLElement} input - Elemento input modificado
     */
    updateDivida(dividaId, input) {
        const divida = this.dividas.find(d => d.id === dividaId);
        if (!divida) {
            throw new Error(`Dívida ${dividaId} não encontrada - impossível atualizar`);
        }

        const field = input.dataset.field;
        let value = input.value;

        // Parse de valores monetários com validação
        if (field === 'valorOriginal' || field === 'saldoDevedor') {
            value = this.parseCurrency(value, field, false); // Não obrigatório durante edição
        } else if (field === 'taxaJuros') {
            const parsed = parseFloat(value);
            if (isNaN(parsed) && value !== '') {
                throw new Error(`Taxa de juros inválida: esperado número, recebido "${value}"`);
            }
            value = isNaN(parsed) ? 0 : parsed;
        }

        divida[field] = value;
        divida.timestamp = new Date().toISOString();

        this.updateResumo();
        this.saveToLocalStorage();
    }

    /**
     * Remove uma dívida
     * @param {string} dividaId - ID da dívida
     */
    removeDivida(dividaId) {
        if (!confirm('Tem certeza que deseja remover esta dívida?')) {
            return;
        }

        this.dividas = this.dividas.filter(d => d.id !== dividaId);
        const row = document.getElementById(dividaId);
        if (row) {
            row.remove();
        }

        // Restaurar empty state se necessário
        if (this.dividas.length === 0) {
            const tbody = document.getElementById('dividasTableBody');
            if (tbody) {
                tbody.innerHTML = `
                    <tr id="emptyState">
                        <td colspan="9" style="padding: 3rem; text-align: center; color: #999;">
                            Nenhuma dívida cadastrada. Clique em "Adicionar Dívida" para começar.
                        </td>
                    </tr>
                `;
            }
        }

        this.updateResumo();
        this.saveToLocalStorage();
    }

    /**
     * Atualiza resumo consolidado
     * CONTEXTO: Cálculo não exige validação rigorosa (display apenas)
     */
    updateResumo() {
        // Estado vazio é válido (retorna 0)
        if (!this.dividas || this.dividas.length === 0) {
            this.updateElement('dividaTotal', this.formatCurrency(0));
            this.updateElement('dividaCurtoPrazo', this.formatCurrency(0));
            this.updateElement('dividaLongoPrazo', this.formatCurrency(0));
            this.updateElement('percentualCP', '0%');
            this.updateElement('percentualLP', '0%');
            this.updateElement('numeroDividas', '0');
            this.updateElement('statusGeral', '-');
            return;
        }

        // Soma tolerante para display (não é operação crítica)
        const total = this.dividas.reduce((sum, d) => {
            const valor = parseFloat(d.saldoDevedor);
            return sum + (isNaN(valor) ? 0 : valor);
        }, 0);

        // Calcular curto/longo prazo
        const hoje = new Date();
        const umAnoFrente = new Date();
        umAnoFrente.setFullYear(hoje.getFullYear() + 1);

        const curtoPrazo = this.dividas
            .filter(d => d.dataVencimento && new Date(d.dataVencimento) <= umAnoFrente)
            .reduce((sum, d) => {
                const valor = parseFloat(d.saldoDevedor);
                return sum + (isNaN(valor) ? 0 : valor);
            }, 0);

        const longoPrazo = total - curtoPrazo;

        // Atualizar elementos do DOM
        this.updateElement('dividaTotal', this.formatCurrency(total));
        this.updateElement('dividaCurtoPrazo', this.formatCurrency(curtoPrazo));
        this.updateElement('dividaLongoPrazo', this.formatCurrency(longoPrazo));
        this.updateElement('percentualCP', total > 0 ? `${((curtoPrazo/total)*100).toFixed(1)}%` : '0%');
        this.updateElement('percentualLP', total > 0 ? `${((longoPrazo/total)*100).toFixed(1)}%` : '0%');
        this.updateElement('numeroDividas', this.dividas.length.toString());

        // Contador de dívidas
        const totalDividas = document.getElementById('totalDividas');
        if (totalDividas) {
            totalDividas.innerHTML = `Total de dívidas cadastradas: <strong>${this.dividas.length}</strong>`;
        }

        // Status geral
        const emDia = this.dividas.filter(d => d.status === 'em_dia').length;
        const percentualEmDia = this.dividas.length > 0 ? ((emDia/this.dividas.length)*100).toFixed(0) : 0;
        this.updateElement('statusGeral', `${percentualEmDia}% em dia`);
    }

    /**
     * Helper para atualizar elemento do DOM
     */
    updateElement(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    }

    /**
     * Aplica máscaras aos inputs
     * @param {HTMLElement} row - Linha da tabela
     */
    applyMasks(row) {
        const currencyInputs = row.querySelectorAll('[data-mask="currency"]');
        const percentageInputs = row.querySelectorAll('[data-mask="percentage"]');

        // Integração com sistema de máscaras existente
        if (window.CurrencyMask) {
            currencyInputs.forEach(input => {
                window.CurrencyMask.apply(input);
            });
        }

        if (window.PercentageMask) {
            percentageInputs.forEach(input => {
                window.PercentageMask.apply(input);
            });
        }
    }

    /**
     * Parse de valor monetário
     * CONTEXTO: Operação crítica - validação rigorosa quando isRequired=true
     * @param {string|number} value - Valor a parsear
     * @param {string} fieldName - Nome do campo (para mensagem de erro)
     * @param {boolean} isRequired - Se true, lança erro em valor inválido
     * @returns {number}
     */
    parseCurrency(value, fieldName, isRequired = true) {
        // Validação de presença
        if (isRequired && (value === null || value === undefined || value === '')) {
            throw new Error(`Campo obrigatório "${fieldName}" está ausente ou vazio`);
        }

        // Permitir vazio se não obrigatório
        if (!isRequired && (value === null || value === undefined || value === '')) {
            return 0;
        }

        // Converter para número se já for
        if (typeof value === 'number') {
            if (isRequired && isNaN(value)) {
                throw new Error(`Campo "${fieldName}" contém valor numérico inválido (NaN)`);
            }
            return value;
        }

        // Parse de string
        const cleaned = value.toString().replace(/[^\d,-]/g, '').replace(',', '.');
        const parsed = parseFloat(cleaned);

        if (isRequired && isNaN(parsed)) {
            throw new Error(`Valor inválido em "${fieldName}": esperado número, recebido "${value}"`);
        }

        return isNaN(parsed) ? 0 : parsed;
    }

    /**
     * Formata valor como moeda BRL
     * @param {number} value - Valor numérico
     * @returns {string}
     */
    formatCurrency(value) {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    }

    /**
     * Valida dívida antes de persistência
     * CONTEXTO: Operação crítica - validação rigorosa obrigatória
     * @param {Object} divida - Objeto dívida
     * @throws {Error} Se dados obrigatórios ausentes
     */
    validateDividaForPersistence(divida) {
        const camposObrigatorios = [
            { campo: 'instituicao', label: 'Instituição Financeira' },
            { campo: 'tipo', label: 'Tipo de Dívida' },
            { campo: 'saldoDevedor', label: 'Saldo Devedor' }
        ];

        for (const { campo, label } of camposObrigatorios) {
            if (!divida[campo] && divida[campo] !== 0) {
                throw new Error(
                    `Não é possível salvar: campo obrigatório "${label}" está ausente. ` +
                    `Preencha os dados da dívida antes de salvar.`
                );
            }
        }

        // Validação de valores numéricos
        if (typeof divida.saldoDevedor !== 'number' || isNaN(divida.saldoDevedor)) {
            throw new Error(
                `Saldo Devedor da instituição "${divida.instituicao}" é inválido. ` +
                `Corrija o valor antes de salvar.`
            );
        }

        return true;
    }

    /**
     * Salva dívidas no localStorage
     * CONTEXTO: Validação não rigorosa (auto-save de trabalho em andamento)
     */
    saveToLocalStorage() {
        try {
            const key = `creditscore_dividas_${this.empresaId ?? 'temp'}`;
            localStorage.setItem(key, JSON.stringify(this.dividas));
        } catch (error) {
            console.error('Erro ao salvar no localStorage:', error);
            throw new Error(`EndividamentoManager: falha ao salvar no localStorage - ${error.message}`);
        }
    }

    /**
     * Carrega dívidas do localStorage
     */
    loadFromLocalStorage() {
        try {
            const key = `creditscore_dividas_${this.empresaId ?? 'temp'}`;
            const stored = localStorage.getItem(key);

            if (stored) {
                const dividas = JSON.parse(stored);
                dividas.forEach(d => this.addDivida(d));
            }
        } catch (error) {
            console.error('Erro ao carregar do localStorage:', error);
            throw new Error(`EndividamentoManager: falha ao carregar do localStorage - ${error.message}`);
        }
    }

    /**
     * Salva dívidas no IndexedDB
     * CONTEXTO: Persistência final - validação rigorosa obrigatória
     */
    async saveToIndexedDB() {
        if (!this.empresaId) {
            throw new Error('EndividamentoManager: empresaId não definida - obrigatória para salvar no IndexedDB');
        }

        try {
            // Validar cada dívida antes de salvar
            for (const divida of this.dividas) {
                this.validateDividaForPersistence(divida);
                await this.dbManager.save('endividamento', divida);
            }
            console.log('✓ Dívidas salvas no IndexedDB');
        } catch (error) {
            console.error('Erro ao salvar no IndexedDB:', error);
            throw new Error(`EndividamentoManager: falha ao salvar no IndexedDB - ${error.message}`);
        }
    }

    /**
     * Carrega dívidas do IndexedDB
     * @param {number} empresaId - ID da empresa
     */
    async loadFromIndexedDB(empresaId) {
        if (!empresaId) {
            throw new Error('EndividamentoManager: empresaId obrigatória para carregar do IndexedDB');
        }

        try {
            const dividas = await this.dbManager.getAll('endividamento', 'empresaId', empresaId);

            if (dividas && dividas.length > 0) {
                // Limpar dívidas atuais
                this.dividas = [];

                // Adicionar dívidas carregadas
                dividas.forEach(d => this.addDivida(d));

                console.log(`✓ ${dividas.length} dívidas carregadas do IndexedDB`);
            }
        } catch (error) {
            console.error('Erro ao carregar do IndexedDB:', error);
            throw new Error(`EndividamentoManager: falha ao carregar do IndexedDB - ${error.message}`);
        }
    }

    /**
     * Retorna dados das dívidas
     * @returns {Array}
     */
    getData() {
        return this.dividas;
    }

    /**
     * Retorna métricas consolidadas para cálculos críticos
     * CONTEXTO: Operação crítica - validação rigorosa
     * @returns {Object}
     */
    getMetricas() {
        // Estado vazio é válido
        if (!this.dividas || this.dividas.length === 0) {
            return {
                total: 0,
                curtoPrazo: 0,
                longoPrazo: 0,
                percentualCP: 0,
                percentualLP: 0,
                numeroDividas: 0,
                statusCounts: {
                    em_dia: 0,
                    atraso_leve: 0,
                    atraso_moderado: 0,
                    inadimplente: 0
                },
                percentualEmDia: 0
            };
        }

        // Calcular total com validação rigorosa
        const total = this.dividas.reduce((sum, divida) => {
            if (divida.saldoDevedor === null || divida.saldoDevedor === undefined) {
                throw new Error(
                    `Dívida da instituição "${divida.instituicao}" sem saldo devedor válido. ` +
                    `Corrija os dados antes de calcular métricas.`
                );
            }
            const valor = parseFloat(divida.saldoDevedor);
            if (isNaN(valor)) {
                throw new Error(
                    `Saldo devedor inválido na instituição "${divida.instituicao}": "${divida.saldoDevedor}"`
                );
            }
            return sum + valor;
        }, 0);

        // Calcular curto/longo prazo
        const hoje = new Date();
        const umAnoFrente = new Date();
        umAnoFrente.setFullYear(hoje.getFullYear() + 1);

        const curtoPrazo = this.dividas
            .filter(d => d.dataVencimento && new Date(d.dataVencimento) <= umAnoFrente)
            .reduce((sum, d) => {
                const valor = parseFloat(d.saldoDevedor);
                return sum + valor;
            }, 0);

        const longoPrazo = total - curtoPrazo;

        const statusCounts = {
            em_dia: this.dividas.filter(d => d.status === 'em_dia').length,
            atraso_leve: this.dividas.filter(d => d.status === 'atraso_leve').length,
            atraso_moderado: this.dividas.filter(d => d.status === 'atraso_moderado').length,
            inadimplente: this.dividas.filter(d => d.status === 'inadimplente').length
        };

        return {
            total,
            curtoPrazo,
            longoPrazo,
            percentualCP: total > 0 ? (curtoPrazo / total) * 100 : 0,
            percentualLP: total > 0 ? (longoPrazo / total) * 100 : 0,
            numeroDividas: this.dividas.length,
            statusCounts,
            percentualEmDia: this.dividas.length > 0 ? (statusCounts.em_dia / this.dividas.length) * 100 : 0
        };
    }
}

// Exportar como ES6 module
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { EndividamentoManager };
}

// Exportar para uso global (retrocompatibilidade)
if (typeof window !== 'undefined') {
    window.EndividamentoManager = EndividamentoManager;
}

console.log('✅ EndividamentoManager carregado');
