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
            const num = typeof val === 'string' ? parseFloat(val.replace(/[^0-9.-]/g, '')) : val;
            return isNaN(num) ? 0 : num;
        };

        // Extrai dados dos 4 períodos
        const periodos = ['p1', 'p2', 'p3', 'p4'].map(p => {
            // ATIVO CIRCULANTE
            const caixa = toNumber(formDataFlat[`caixa_${p}`]);
            const bancos = toNumber(formDataFlat[`bancos_${p}`]);
            const aplicacoes = toNumber(formDataFlat[`aplicacoes_${p}`]);
            const disponibilidadesTotal = caixa + bancos + aplicacoes;

            const contasReceber = toNumber(formDataFlat[`contasReceber_${p}`]);
            const pdd = toNumber(formDataFlat[`pdd_${p}`]);
            const contasReceberLiquido = contasReceber + pdd; // pdd é negativo

            const estoqueMP = toNumber(formDataFlat[`estoqueMP_${p}`]);
            const estoqueWIP = toNumber(formDataFlat[`estoqueWIP_${p}`]);
            const estoqueProdAcabados = toNumber(formDataFlat[`estoqueProdAcabados_${p}`]);
            const estoquePecasReposicao = toNumber(formDataFlat[`estoquePecasReposicao_${p}`]);
            const estoquesTotal = estoqueMP + estoqueWIP + estoqueProdAcabados + estoquePecasReposicao;

            const impostosRecuperar = toNumber(formDataFlat[`impostosRecuperar_${p}`]);
            const adiantamentosFornecedores = toNumber(formDataFlat[`adiantamentosFornecedores_${p}`]);
            const outrosAC = toNumber(formDataFlat[`outrosAC_${p}`]);

            const ativoCirculanteTotal = disponibilidadesTotal + contasReceberLiquido + estoquesTotal +
                                        impostosRecuperar + adiantamentosFornecedores + outrosAC;

            // ATIVO NÃO CIRCULANTE
            const titulosReceberLP = toNumber(formDataFlat[`titulosReceberLP_${p}`]);
            const depositosJudiciais = toNumber(formDataFlat[`depositosJudiciais_${p}`]);
            const outrosCreditosLP = toNumber(formDataFlat[`outrosCreditosLP_${p}`]);
            const realizavelLPTotal = titulosReceberLP + depositosJudiciais + outrosCreditosLP;

            const participacoesSocietarias = toNumber(formDataFlat[`participacoesSocietarias_${p}`]);
            const outrosInvestimentos = toNumber(formDataFlat[`outrosInvestimentos_${p}`]);
            const investimentosTotal = participacoesSocietarias + outrosInvestimentos;

            const terrenos = toNumber(formDataFlat[`terrenos_${p}`]);
            const edificacoes = toNumber(formDataFlat[`edificacoes_${p}`]);
            const maquinasEquipamentos = toNumber(formDataFlat[`maquinasEquipamentos_${p}`]);
            const veiculos = toNumber(formDataFlat[`veiculos_${p}`]);
            const moveisUtensilios = toNumber(formDataFlat[`moveisUtensilios_${p}`]);
            const equipamentosInformatica = toNumber(formDataFlat[`equipamentosInformatica_${p}`]);
            const imobilizadoAndamento = toNumber(formDataFlat[`imobilizadoAndamento_${p}`]);
            const imobilizadoBruto = terrenos + edificacoes + maquinasEquipamentos + veiculos +
                                   moveisUtensilios + equipamentosInformatica + imobilizadoAndamento;
            const depreciacaoAcumulada = toNumber(formDataFlat[`depreciacaoAcumulada_${p}`]);
            const imobilizadoLiquido = imobilizadoBruto + depreciacaoAcumulada; // depreciação é negativa

            const software = toNumber(formDataFlat[`software_${p}`]);
            const marcasPatentes = toNumber(formDataFlat[`marcasPatentes_${p}`]);
            const goodwill = toNumber(formDataFlat[`goodwill_${p}`]);
            const intangivelBruto = software + marcasPatentes + goodwill;
            const amortizacaoAcumulada = toNumber(formDataFlat[`amortizacaoAcumulada_${p}`]);
            const intangivelLiquido = intangivelBruto + amortizacaoAcumulada; // amortização é negativa

            const ativoNaoCirculanteTotal = realizavelLPTotal + investimentosTotal + imobilizadoLiquido + intangivelLiquido;

            const ativoTotal = ativoCirculanteTotal + ativoNaoCirculanteTotal;

            // PASSIVO CIRCULANTE
            const fornecedores = toNumber(formDataFlat[`fornecedores_${p}`]);
            const emprestimosCP = toNumber(formDataFlat[`emprestimosCP_${p}`]);
            const salariosPagar = toNumber(formDataFlat[`salariosPagar_${p}`]);
            const encargosSociaisPagar = toNumber(formDataFlat[`encargosSociaisPagar_${p}`]);
            const impostosRecolher = toNumber(formDataFlat[`impostosRecolher_${p}`]);
            const dividendosPagar = toNumber(formDataFlat[`dividendosPagar_${p}`]);
            const adiantamentosClientes = toNumber(formDataFlat[`adiantamentosClientes_${p}`]);
            const obrigacoesFiscais = toNumber(formDataFlat[`obrigacoesFiscais_${p}`]);
            const outrosPC = toNumber(formDataFlat[`outrosPC_${p}`]);

            const passivoCirculanteTotal = fornecedores + emprestimosCP + salariosPagar +
                                          encargosSociaisPagar + impostosRecolher + dividendosPagar +
                                          adiantamentosClientes + obrigacoesFiscais + outrosPC;

            // PASSIVO NÃO CIRCULANTE
            const emprestimosLP = toNumber(formDataFlat[`emprestimosLP_${p}`]);
            const financiamentosImobiliarios = toNumber(formDataFlat[`financiamentosImobiliarios_${p}`]);
            const debentures = toNumber(formDataFlat[`debentures_${p}`]);
            const provisoesTrabalhistas = toNumber(formDataFlat[`provisoesTrabalhistas_${p}`]);
            const provisoesFiscais = toNumber(formDataFlat[`provisoesFiscais_${p}`]);
            const outrosPNC = toNumber(formDataFlat[`outrosPNC_${p}`]);

            const passivoNaoCirculanteTotal = emprestimosLP + financiamentosImobiliarios + debentures +
                                             provisoesTrabalhistas + provisoesFiscais + outrosPNC;

            // PATRIMÔNIO LÍQUIDO
            const capitalSocial = toNumber(formDataFlat[`capitalSocial_${p}`]);
            const reservaCapital = toNumber(formDataFlat[`reservaCapital_${p}`]);
            const reservaLucros = toNumber(formDataFlat[`reservaLucros_${p}`]);
            const reservaLegal = toNumber(formDataFlat[`reservaLegal_${p}`]);
            const lucrosPrejuizosAcumulados = toNumber(formDataFlat[`lucrosPrejuizosAcumulados_${p}`]);
            const ajustesAvaliacaoPatrimonial = toNumber(formDataFlat[`ajustesAvaliacaoPatrimonial_${p}`]);
            const acoesTesouraria = toNumber(formDataFlat[`acoesTesouraria_${p}`]);

            const patrimonioLiquidoTotal = capitalSocial + reservaCapital + reservaLucros + reservaLegal +
                                          lucrosPrejuizosAcumulados + ajustesAvaliacaoPatrimonial + acoesTesouraria;

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
                }
            };
        });

        // DRE (usando período mais recente - p4)
        const p = 'p4';
        const vendasProdutos = toNumber(formDataFlat[`vendasProdutos_${p}`]);
        const vendasServicos = toNumber(formDataFlat[`vendasServicos_${p}`]);
        const outrasReceitas = toNumber(formDataFlat[`outrasReceitas_${p}`]);
        const icms = toNumber(formDataFlat[`icms_${p}`]);
        const pis = toNumber(formDataFlat[`pis_${p}`]);
        const cofins = toNumber(formDataFlat[`cofins_${p}`]);
        const iss = toNumber(formDataFlat[`iss_${p}`]);
        const devolucoesVendas = toNumber(formDataFlat[`devolucoesVendas_${p}`]);
        const abatimentos = toNumber(formDataFlat[`abatimentos_${p}`]);

        const receitaBruta = vendasProdutos + vendasServicos + outrasReceitas;
        const deducoesReceita = icms + pis + cofins + iss + devolucoesVendas + abatimentos; // valores negativos
        const receitaLiquida = receitaBruta + deducoesReceita;

        const materiaPrima = toNumber(formDataFlat[`materiaPrima_${p}`]);
        const embalagens = toNumber(formDataFlat[`embalagens_${p}`]);
        const maoObraDireta = toNumber(formDataFlat[`maoObraDireta_${p}`]);
        const terceirizacaoProducao = toNumber(formDataFlat[`terceirizacaoProducao_${p}`]);
        const outrosCustosVariaveis = toNumber(formDataFlat[`outrosCustosVariaveis_${p}`]);

        const custosProdutos = materiaPrima + embalagens + maoObraDireta + terceirizacaoProducao + outrosCustosVariaveis;
        const lucroBruto = receitaLiquida + custosProdutos; // custos são negativos

        const comissoes = toNumber(formDataFlat[`comissoes_${p}`]);
        const vendasMarketing = toNumber(formDataFlat[`vendasMarketing_${p}`]);
        const frete = toNumber(formDataFlat[`frete_${p}`]);
        const outrasDespVendas = toNumber(formDataFlat[`outrasDespVendas_${p}`]);

        const despesasVendas = comissoes + vendasMarketing + frete + outrasDespVendas;

        const pessoal = toNumber(formDataFlat[`pessoal_${p}`]);
        const alugueis = toNumber(formDataFlat[`alugueis_${p}`]);
        const utilidades = toNumber(formDataFlat[`utilidades_${p}`]);
        const seguros = toNumber(formDataFlat[`seguros_${p}`]);
        const manutencao = toNumber(formDataFlat[`manutencao_${p}`]);
        const tecnologiaInformacao = toNumber(formDataFlat[`tecnologiaInformacao_${p}`]);
        const servicosProfissionais = toNumber(formDataFlat[`servicosProfissionais_${p}`]);
        const administrativas = toNumber(formDataFlat[`administrativas_${p}`]);
        const outrasDespesas = toNumber(formDataFlat[`outrasDespesas_${p}`]);
        const depreciacaoAmortizacao = toNumber(formDataFlat[`depreciacaoAmortizacao_${p}`]);

        const despesasAdministrativas = pessoal + alugueis + utilidades + seguros + manutencao +
                                       tecnologiaInformacao + servicosProfissionais + administrativas +
                                       outrasDespesas + depreciacaoAmortizacao;

        const lucroOperacional = lucroBruto + despesasVendas + despesasAdministrativas;

        const receitasFinanceiras = toNumber(formDataFlat[`receitasFinanceiras_${p}`]);
        const despesasFinanceiras = toNumber(formDataFlat[`despesasFinanceiras_${p}`]);
        const receitasNaoOperacionais = toNumber(formDataFlat[`receitasNaoOperacionais_${p}`]);
        const despesasNaoOperacionais = toNumber(formDataFlat[`despesasNaoOperacionais_${p}`]);

        const resultadoFinanceiro = receitasFinanceiras + despesasFinanceiras;
        const resultadoNaoOperacional = receitasNaoOperacionais + despesasNaoOperacionais;

        const lajir = lucroOperacional + resultadoFinanceiro + resultadoNaoOperacional;

        const ir = toNumber(formDataFlat[`ir_${p}`]);
        const csll = toNumber(formDataFlat[`csll_${p}`]);

        const lucroLiquido = lajir + ir + csll;

        const dre = {
            receitaLiquida,
            custosProdutos,
            lucroBruto,
            despesasVendas,
            despesasAdministrativas,
            lucroOperacional,
            resultadoFinanceiro,
            lajir,
            lucroLiquido
        };

        console.log('✅ [Transformer] Transformação concluída');
        console.log('   - Períodos processados: 4');
        console.log('   - Ativo Total (p4):', periodos[3].ativoTotal);
        console.log('   - Receita Líquida:', dre.receitaLiquida);

        // Estrutura de balanco semanticamente correta (SOLID/DRY)
        const balancoTransformado = {
            // Períodos individuais
            p1: periodos[0],
            p2: periodos[1],
            p3: periodos[2],
            p4: periodos[3],

            // Valores do último período (p4) para uso direto
            patrimonioLiquido: periodos[3].patrimonioLiquidoTotal,
            ativoTotal: periodos[3].ativoTotal,
            passivoTotal: periodos[3].passivoTotal,
            ativoCirculante: periodos[3].ativoCirculanteTotal,
            passivoCirculante: periodos[3].passivoCirculanteTotal,
            ativoNaoCirculante: periodos[3].ativoNaoCirculanteTotal,
            passivoNaoCirculante: periodos[3].passivoNaoCirculanteTotal,
            disponibilidades: periodos[3].disponibilidadesTotal,
            estoques: periodos[3].estoquesTotal
        };

        // Retorna estrutura compatível com recalcularAnaliseCompleta
        return {
            cadastro: formDataFlat,
            demonstracoes: {
                balanco: balancoTransformado,
                dre: dre
            },
            balanco: balancoTransformado,
            dre: dre,
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