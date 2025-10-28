/* =====================================
   IMPORT.JS (Refatorado para CreditScore Pro)
   Sistema de importação de dados de análise via JSON.
   NO FALLBACKS - NO MOCK DATA
   ===================================== */

class ImportManager {
    constructor(config, creditScoreModule) {
        if (!config) {
            throw new Error('ImportManager: configuração obrigatória');
        }
        this.config = config;
        this.creditScoreModule = creditScoreModule; // Injeta o módulo principal

        if (creditScoreModule) {
            this.creditScoreModule = creditScoreModule;
        } else {
            console.warn('ImportManager: creditScoreModule não injetado. Recálculo automático após importação não funcionará.');
        }

        this.setupFileInput();
    }
    
    setupFileInput() {
        const fileInput = document.getElementById('importJsonFileHeader');
        if (!fileInput) {
            console.error('Input de arquivo #importJsonFileHeader não encontrado.');
            return;
        }
        
        const importButton = document.getElementById('importBtnHeader');
        if (!importButton) {
            console.error('Botão de importação #importBtnHeader não encontrado.');
            return;
        }

        // Conecta o clique no botão à abertura do seletor de arquivos
        importButton.addEventListener('click', () => fileInput.click());

        // Processa o arquivo selecionado
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.handleFileSelection(e.target.files[0]);
            }
        });
    }
    
    handleFileSelection(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const jsonData = JSON.parse(e.target.result);
                // Suporta JSON com { formData: {...} } ou apenas {...}
                const formData = jsonData.formData || jsonData; 
                this.populateForm(formData);
            } catch (error) {
                this.showToast(`Erro ao processar JSON: ${error.message}`, 'error');
            }
        };
        reader.onerror = () => this.showToast('Erro ao ler o arquivo.', 'error');
        reader.readAsText(file);
    }

    populateForm(formData) {
        const form = document.getElementById('creditScoreForm');
        if (!form) {
            this.showToast('Erro: Formulário principal #creditScoreForm não encontrado.', 'error');
            return;
        }

        let populatedCount = 0;
        Object.entries(formData).forEach(([fieldName, value]) => {
            const field = form.elements[fieldName]; // Use form.elements para acessar campos por name ou id
            if (field) {
                // Handle radio buttons (field is a RadioNodeList)
                if (field instanceof RadioNodeList) {
                    field.forEach(radio => radio.checked = (radio.value === String(value)));
                    // RadioNodeList não tem dispatchEvent, mas podemos disparar no elemento selecionado
                    const checkedRadio = Array.from(field).find(r => r.checked);
                    if (checkedRadio) {
                        checkedRadio.dispatchEvent(new Event('change', { bubbles: true }));
                    }
                } else if (field.type === 'checkbox') {
                    field.checked = Boolean(value);
                    field.dispatchEvent(new Event('input', { bubbles: true }));
                    field.dispatchEvent(new Event('change', { bubbles: true }));
                } else {
                    field.value = value;
                    // Dispara evento para que máscaras e outros listeners reajam
                    field.dispatchEvent(new Event('input', { bubbles: true }));
                    field.dispatchEvent(new Event('change', { bubbles: true }));
                }
                populatedCount++;
            }
        });

        this.showToast(`Importação concluída! ${populatedCount} campos preenchidos.`, 'success');

        // NOVA LÓGICA: Transforma dados flat para estrutura hierárquica antes do recálculo
        if (this.creditScoreModule?.recalcularAnaliseCompleta) {
            console.log('🔄 Transformando dados flat para calculadores...');
            const dadosHierarquicos = this.transformarParaCalculadores(formData);
            console.log('🔄 Solicitando recálculo completo da análise...');
            this.creditScoreModule.recalcularAnaliseCompleta(dadosHierarquicos);
        }

        // Leva o usuário de volta ao primeiro módulo
        if (this.creditScoreModule?.navigationController) {
            this.creditScoreModule.navigationController.navigateToModule(1);
        }
    }

    /**
     * DATA TRANSFORMER LAYER
     * Transforma dados flat (formData) para estrutura hierárquica (calculadores)
     *
     * @param {Object} formDataFlat - Dados flat do formulário (caixa_p1, bancos_p2, etc)
     * @returns {Object} Dados estruturados para calculadores
     */
    transformarParaCalculadores(formDataFlat) {
        console.log('🔧 [Transformer] Iniciando transformação flat → hierárquico');

        // Helper: converte string para número
        const toNumber = (val) => {
            if (val === null || val === undefined || val === '') return 0;
            // Preserva o sinal original (positivo ou negativo).
            // Usado para: contas retificadoras (PDD, Depreciação, Ações em Tesouraria) que vêm negativas,
            // e contas como Lucros/Prejuízos Acumulados que podem ser positivas ou negativas.
            const num = typeof val === 'string' ? parseFloat(val.replace(/[^0-9.-]/g, '')) : val;
            return isNaN(num) ? 0 : num;
        };
        const toPositiveNumber = (val) => {
            if (val === null || val === undefined || val === '') return 0;
            const num = typeof val === 'string' ? parseFloat(String(val).replace(/[^0-9.-]/g, '')) : val;
            if (isNaN(num)) return 0;
            return Math.abs(toNumber(val));
        };

        // Extrai dados dos 4 períodos
        const periodos = ['p1', 'p2', 'p3', 'p4'].map(p => {
            // ATIVO CIRCULANTE
            const caixa = toPositiveNumber(formDataFlat[`caixa_${p}`]);
            const bancos = toPositiveNumber(formDataFlat[`bancos_${p}`]);
            const aplicacoes = toPositiveNumber(formDataFlat[`aplicacoes_${p}`]);
            const disponibilidadesTotal = caixa + bancos + aplicacoes;

            const contasReceber = toPositiveNumber(formDataFlat[`contasReceber_${p}`]);
            const pdd = toNumber(formDataFlat[`pdd_${p}`]); // PDD é conta retificadora (vem negativa do formulário)
            const contasReceberLiquido = contasReceber + pdd; // Soma (pdd já é negativo)

            const estoqueMP = toPositiveNumber(formDataFlat[`estoqueMP_${p}`]);
            const estoqueWIP = toPositiveNumber(formDataFlat[`estoqueWIP_${p}`]);
            const estoqueProdAcabados = toPositiveNumber(formDataFlat[`estoqueProdAcabados_${p}`]);
            const estoquePecasReposicao = toPositiveNumber(formDataFlat[`estoquePecasReposicao_${p}`]);
            const estoquesTotal = estoqueMP + estoqueWIP + estoqueProdAcabados + estoquePecasReposicao;

            const impostosRecuperar = toPositiveNumber(formDataFlat[`impostosRecuperar_${p}`]);
            const adiantamentosFornecedores = toPositiveNumber(formDataFlat[`adiantamentosFornecedores_${p}`]);
            const outrosAC = toPositiveNumber(formDataFlat[`outrosAC_${p}`]);

            const ativoCirculanteTotal = disponibilidadesTotal + contasReceberLiquido + estoquesTotal +
                                        impostosRecuperar + adiantamentosFornecedores + outrosAC;

            // ATIVO NÃO CIRCULANTE
            const titulosReceberLP = toPositiveNumber(formDataFlat[`titulosReceberLP_${p}`]);
            const depositosJudiciais = toPositiveNumber(formDataFlat[`depositosJudiciais_${p}`]);
            const outrosCreditosLP = toPositiveNumber(formDataFlat[`outrosCreditosLP_${p}`]);
            const realizavelLPTotal = titulosReceberLP + depositosJudiciais + outrosCreditosLP;

            const participacoesSocietarias = toPositiveNumber(formDataFlat[`participacoesSocietarias_${p}`]);
            const outrosInvestimentos = toPositiveNumber(formDataFlat[`outrosInvestimentos_${p}`]);
            const investimentosTotal = participacoesSocietarias + outrosInvestimentos;

            const terrenos = toPositiveNumber(formDataFlat[`terrenos_${p}`]);
            const edificacoes = toPositiveNumber(formDataFlat[`edificacoes_${p}`]);
            const maquinasEquipamentos = toPositiveNumber(formDataFlat[`maquinasEquipamentos_${p}`]);
            const veiculos = toPositiveNumber(formDataFlat[`veiculos_${p}`]);
            const moveisUtensilios = toPositiveNumber(formDataFlat[`moveisUtensilios_${p}`]);
            const equipamentosInformatica = toPositiveNumber(formDataFlat[`equipamentosInformatica_${p}`]);
            const imobilizadoAndamento = toPositiveNumber(formDataFlat[`imobilizadoAndamento_${p}`]);
            const imobilizadoBruto = terrenos + edificacoes + maquinasEquipamentos + veiculos +
                                   moveisUtensilios + equipamentosInformatica + imobilizadoAndamento;
            const depreciacaoAcumulada = toNumber(formDataFlat[`depreciacaoAcumulada_${p}`]); // Conta retificadora (vem negativa)
            const imobilizadoLiquido = imobilizadoBruto + depreciacaoAcumulada; // Soma (já é negativo)

            const software = toPositiveNumber(formDataFlat[`software_${p}`]);
            const marcasPatentes = toPositiveNumber(formDataFlat[`marcasPatentes_${p}`]);
            const goodwill = toPositiveNumber(formDataFlat[`goodwill_${p}`]);
            const intangivelBruto = software + marcasPatentes + goodwill;
            const amortizacaoAcumulada = toNumber(formDataFlat[`amortizacaoAcumulada_${p}`]); // Conta retificadora (vem negativa)
            const intangivelLiquido = intangivelBruto + amortizacaoAcumulada; // Soma (já é negativo)

            const ativoNaoCirculanteTotal = realizavelLPTotal + investimentosTotal + imobilizadoLiquido + intangivelLiquido;

            const ativoTotal = ativoCirculanteTotal + ativoNaoCirculanteTotal;

            // PASSIVO CIRCULANTE
            const fornecedores = toPositiveNumber(formDataFlat[`fornecedores_${p}`]);
            const emprestimosCP = toPositiveNumber(formDataFlat[`emprestimosCP_${p}`]);
            const salariosPagar = toPositiveNumber(formDataFlat[`salariosPagar_${p}`]);
            const encargosSociaisPagar = toPositiveNumber(formDataFlat[`encargosSociaisPagar_${p}`]);
            const impostosRecolher = toPositiveNumber(formDataFlat[`impostosRecolher_${p}`]);
            const dividendosPagar = toPositiveNumber(formDataFlat[`dividendosPagar_${p}`]);
            const adiantamentosClientes = toPositiveNumber(formDataFlat[`adiantamentosClientes_${p}`]);
            const obrigacoesFiscais = toPositiveNumber(formDataFlat[`obrigacoesFiscais_${p}`]);
            const outrosPC = toPositiveNumber(formDataFlat[`outrosPC_${p}`]);

            const passivoCirculanteTotal = fornecedores + emprestimosCP + salariosPagar +
                                          encargosSociaisPagar + impostosRecolher + dividendosPagar +
                                          adiantamentosClientes + obrigacoesFiscais + outrosPC;

            // PASSIVO NÃO CIRCULANTE
            const emprestimosLP = toPositiveNumber(formDataFlat[`emprestimosLP_${p}`]);
            const financiamentosImobiliarios = toPositiveNumber(formDataFlat[`financiamentosImobiliarios_${p}`]);
            const debentures = toPositiveNumber(formDataFlat[`debentures_${p}`]);
            const provisoesTrabalhistas = toPositiveNumber(formDataFlat[`provisoesTrabalhistas_${p}`]);
            const provisoesFiscais = toPositiveNumber(formDataFlat[`provisoesFiscais_${p}`]);
            const outrosPNC = toPositiveNumber(formDataFlat[`outrosPNC_${p}`]);

            const passivoNaoCirculanteTotal = emprestimosLP + financiamentosImobiliarios + debentures +
                                             provisoesTrabalhistas + provisoesFiscais + outrosPNC;

            // PATRIMÔNIO LÍQUIDO
            const capitalSocial = toPositiveNumber(formDataFlat[`capitalSocial_${p}`]);
            const reservaCapital = toPositiveNumber(formDataFlat[`reservaCapital_${p}`]);
            const reservaLucros = toPositiveNumber(formDataFlat[`reservaLucros_${p}`]);
            const reservaLegal = toPositiveNumber(formDataFlat[`reservaLegal_${p}`]);
            const lucrosPrejuizosAcumulados = toNumber(formDataFlat[`lucrosPrejuizosAcumulados_${p}`]);

            const ajustesAvaliacaoPatrimonial = toPositiveNumber(formDataFlat[`ajustesAvaliacaoPatrimonial_${p}`]);
            const acoesTesouraria = toNumber(formDataFlat[`acoesTesouraria_${p}`]); // Conta retificadora do PL (vem negativa)

            const patrimonioLiquidoTotal = capitalSocial + reservaCapital + reservaLucros + reservaLegal + lucrosPrejuizosAcumulados + ajustesAvaliacaoPatrimonial + acoesTesouraria; // Soma (já é negativo)
            const passivoTotal = passivoCirculanteTotal + passivoNaoCirculanteTotal;
            const passivoPLTotal = passivoTotal + patrimonioLiquidoTotal;

            // Retorna estrutura hierárquica do período
            return {
                ativoCirculanteTotal,
                passivoCirculanteTotal,
                ativoNaoCirculanteTotal,
                passivoNaoCirculanteTotal,
                patrimonioLiquidoTotal,
                ativoTotal,
                passivoTotal,
                passivoPLTotal,
                disponibilidadesTotal,
                estoquesTotal,
                ativo: {
                    circulante: {
                        disponibilidades: disponibilidadesTotal,
                        contasReceber: contasReceberLiquido,
                        estoques: estoquesTotal
                    }
                },
                passivo: {
                    circulante: {
                        fornecedores
                    }
                },
                // Adiciona o objeto 'patrimonioLiquido' que estava faltando
                patrimonioLiquido: {
                    capitalSocial,
                    reservaCapital,
                    reservaLucros,
                    reservaLegal,
                    lucrosPrejuizosAcumulados,
                    ajustesAvaliacaoPatrimonial,
                    acoesTesouraria,
                    total: patrimonioLiquidoTotal
                }
            };
        });

        // DRE (4 períodos - mesma lógica do Balanço)
        const periodosDRE = ['p1', 'p2', 'p3', 'p4'].map(p => {
            // RECEITA BRUTA
            const vendasProdutos = toNumber(formDataFlat[`vendasProdutos_${p}`]);
            const vendasServicos = toNumber(formDataFlat[`vendasServicos_${p}`]);
            const outrasReceitas = toNumber(formDataFlat[`outrasReceitas_${p}`]);
            const receitaBruta = vendasProdutos + vendasServicos + outrasReceitas;

            // DEDUÇÕES DA RECEITA
            const icms = toNumber(formDataFlat[`icms_${p}`]);
            const pis = toNumber(formDataFlat[`pis_${p}`]);
            const cofins = toNumber(formDataFlat[`cofins_${p}`]);
            const iss = toNumber(formDataFlat[`iss_${p}`]);
            const devolucoesVendas = toNumber(formDataFlat[`devolucoesVendas_${p}`]);
            const abatimentos = toNumber(formDataFlat[`abatimentos_${p}`]);
            const deducoesReceita = icms + pis + cofins + iss + devolucoesVendas + abatimentos; // valores negativos

            const receitaLiquida = receitaBruta + deducoesReceita;

            // CUSTOS DOS PRODUTOS/SERVIÇOS
            // Lendo os novos IDs do HTML refatorado
            const cmv = toNumber(formDataFlat[`cmv_${p}`]); // Custo da Mercadoria Vendida
            const materiaPrima = toNumber(formDataFlat[`materiaPrima_${p}`]);
            const maoObraDireta = toNumber(formDataFlat[`maoObraDireta_${p}`]);
            const cif = toNumber(formDataFlat[`cif_${p}`]); // Custo Indireto de Fabricação
            const csp = toNumber(formDataFlat[`csp_${p}`]); // Custo do Serviço Prestado
            const cpvTotal = materiaPrima + maoObraDireta + cif;
            const custosProdutos = cmv + cpvTotal + csp;

            const lucroBruto = receitaLiquida + custosProdutos; // custos são negativos

            // DESPESAS COMERCIAIS/VENDAS
            const comissoes = toNumber(formDataFlat[`comissoes_${p}`]);
            const vendasMarketing = toNumber(formDataFlat[`vendasMarketing_${p}`]);
            const frete = toNumber(formDataFlat[`frete_${p}`]);
            const outrasDespVendas = toNumber(formDataFlat[`outrasDespVendas_${p}`]);
            const despesasVendas = comissoes + vendasMarketing + frete + outrasDespVendas;

            // DESPESAS ADMINISTRATIVAS
            const pessoal = toNumber(formDataFlat[`pessoal_${p}`]);
            const alugueis = toNumber(formDataFlat[`alugueis_${p}`]);
            const utilidades = toNumber(formDataFlat[`utilidades_${p}`]);
            const seguros = toNumber(formDataFlat[`seguros_${p}`]);
            const manutencao = toNumber(formDataFlat[`manutencao_${p}`] ?? '0');
            const tecnologiaInformacao = toNumber(formDataFlat[`tecnologiaInformacao_${p}`] ?? '0');
            const servicosProfissionais = toNumber(formDataFlat[`servicosProfissionais_${p}`] ?? '0');
            const administrativas = toNumber(formDataFlat[`administrativas_${p}`] ?? '0');
            const outrasDespesas = toNumber(formDataFlat[`outrasDespesas_${p}`] ?? '0');
            const despesasAdministrativas = pessoal + alugueis + utilidades + seguros + manutencao + tecnologiaInformacao + servicosProfissionais + administrativas;
            const lucroOperacional = lucroBruto + despesasVendas + despesasAdministrativas + outrasDespesas; // Despesas já são negativas
            // RESULTADO FINANCEIRO E NÃO OPERACIONAL
            const receitasFinanceiras = toNumber(formDataFlat[`receitasFinanceiras_${p}`]);
            const despesasFinanceiras = toNumber(formDataFlat[`despesasFinanceiras_${p}`]);
            const receitasNaoOperacionais = toNumber(formDataFlat[`receitasNaoOperacionais_${p}`]);
            const despesasNaoOperacionais = toNumber(formDataFlat[`despesasNaoOperacionais_${p}`]);
            const resultadoFinanceiro = receitasFinanceiras + despesasFinanceiras;
            const resultadoNaoOperacional = receitasNaoOperacionais + despesasNaoOperacionais;

            const lajir = lucroOperacional + resultadoFinanceiro + resultadoNaoOperacional;

            // IMPOSTOS
            const ir = toNumber(formDataFlat[`ir_${p}`]);
            const csll = toNumber(formDataFlat[`csll_${p}`]);

            const lucroLiquido = lajir + ir + csll;

            // Calcular despesas operacionais totais (exigido pela análise vertical/horizontal)
            const despesasOperacionais = despesasVendas + despesasAdministrativas + outrasDespesas;

            // Retorna estrutura hierárquica do período
            return {
                receitaBruta,
                deducoes: deducoesReceita, // Renomeado para compatibilidade com análise vertical/horizontal
                deducoesReceita, // Mantido para compatibilidade com código existente
                receitaLiquida,
                custosProdutos,
                lucroBruto,
                despesasOperacionais, // Campo obrigatório para análise vertical/horizontal
                despesasVendas,
                despesasAdministrativas,
                depreciacaoAmortizacao: toNumber(formDataFlat[`depreciacaoAmortizacao_${p}`] ?? '0'), // Lendo o campo separadamente
                lucroOperacional,
                resultadoFinanceiro,
                lajir,
                lucroLiquido
            };
        });

        console.log('✅ [Transformer] Transformação concluída');
        console.log('   - Períodos Balanço processados: 4');
        console.log('   - Períodos DRE processados: 4');
        console.log('   - Estrutura: HIERÁRQUICA (ativo.circulante, passivo.circulante)');
        console.log('   - Ativo Total (p4):', periodos[3].ativoTotal);
        console.log('   - Receita Líquida (p4):', periodosDRE[3].receitaLiquida);

        // Estrutura de balanco hierárquica (compatível com IndicesFinanceirosCalculator)
        const balancoTransformado = {
            // Períodos individuais (estrutura flat para cada período)
            p1: periodos[0],
            p2: periodos[1],
            p3: periodos[2],
            p4: periodos[3],

            // Estrutura hierárquica para cálculos (usa dados do p4 - último período)
            ativo: {
                circulante: {
                    total: periodos[3].ativoCirculanteTotal,
                    disponibilidades: periodos[3].disponibilidadesTotal,
                    contasReceber: periodos[3].contasReceberLiquido,
                    estoques: periodos[3].estoquesTotal
                },
                naoCirculante: {
                    total: periodos[3].ativoNaoCirculanteTotal,
                    realizavelLP: periodos[3].realizavelLPTotal,
                    investimentos: periodos[3].investimentosTotal,
                    imobilizado: periodos[3].imobilizadoLiquido,
                    intangivel: periodos[3].intangivelLiquido
                },
                total: periodos[3].ativoTotal
            },
            passivo: {
                circulante: {
                    total: periodos[3].passivoCirculanteTotal
                },
                naoCirculante: {
                    total: periodos[3].passivoNaoCirculanteTotal
                },
                total: periodos[3].passivoTotal
            },
            patrimonioLiquido: periodos[3].patrimonioLiquido, // Correção: Usar o objeto completo

            // Valores diretos para retrocompatibilidade (flat)
            ativoTotal: periodos[3].ativoTotal,
            passivoTotal: periodos[3].passivoTotal,
            ativoCirculante: periodos[3].ativoCirculanteTotal,
            passivoCirculante: periodos[3].passivoCirculanteTotal,
            ativoNaoCirculante: periodos[3].ativoNaoCirculanteTotal,
            passivoNaoCirculante: periodos[3].passivoNaoCirculanteTotal,
            disponibilidades: periodos[3].disponibilidadesTotal,
            estoques: periodos[3].estoquesTotal
        };

        // Estrutura de DRE semanticamente correta (SOLID/DRY)
        const dreTransformada = {
            // Períodos individuais
            p1: periodosDRE[0],
            p2: periodosDRE[1],
            p3: periodosDRE[2],
            p4: periodosDRE[3],

            // Valores do último período (p4) para uso direto
            receitaLiquida: periodosDRE[3].receitaLiquida,
            lucroBruto: periodosDRE[3].lucroBruto,
            lucroOperacional: periodosDRE[3].lucroOperacional,
            lajir: periodosDRE[3].lajir,
            lucroLiquido: periodosDRE[3].lucroLiquido,
            // ✅ ADICIONADO: Garante compatibilidade com IndicesFinanceirosCalculator
            custosProdutos: periodosDRE[3].custosProdutos
        };

        // Retorna estrutura compatível com recalcularAnaliseCompleta
        return {
            cadastro: formDataFlat,
            demonstracoes: {
                balanco: balancoTransformado,
                dre: dreTransformada
            },
            balanco: balancoTransformado,
            dre: dreTransformada,
            endividamento: formDataFlat,
            compliance: formDataFlat,
            clientes: formDataFlat,
            fornecedores: formDataFlat
        };
    }

    showToast(message, type = 'info') {
        if (window.Toast && typeof window.Toast.show === 'function') {
            window.Toast.show(message, 'success');
        } else {
            alert(message);
        }
    }
}

// Disponibilizar globalmente para que o CreditScoreProApp possa instanciá-lo
if (typeof window !== 'undefined') {
    window.ImportManager = ImportManager;
}