/* =====================================
   IMPORT.JS
   Sistema unificado de importação para CEI e ProGoiás
   NO FALLBACKS - NO MOCK DATA
   ===================================== */

class FormImporter {
    constructor(config) {
        if (!config) {
            throw new Error('FormImporter: configuração obrigatória não fornecida');
        }
        
        if (!config.programType) {
            throw new Error('FormImporter: tipo de programa (programType) é obrigatório');
        }
        
        this.config = config;
    }
    
    importFromJSON(file) {
        if (!file) {
            throw new Error('FormImporter: arquivo obrigatório não fornecido');
        }
        
        if (file.type !== 'application/json') {
            throw new Error('FormImporter: arquivo deve ser do tipo JSON');
        }
        
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const jsonData = JSON.parse(e.target.result);
                    const processedData = this.processJSONData(jsonData);
                    resolve(processedData);
                } catch (error) {
                    reject(new Error(`Erro ao processar JSON: ${error.message}`));
                }
            };
            
            reader.onerror = () => {
                reject(new Error('Erro ao ler arquivo'));
            };
            
            reader.readAsText(file);
        });
    }
    
    processJSONData(jsonData) {
        if (!jsonData) {
            throw new Error('Dados JSON vazios');
        }
        
        // Verificar se é um arquivo exportado do sistema
        if (jsonData.metadata && jsonData.formData) {
            return this.processExportedData(jsonData);
        }
        
        // Verificar se é dados brutos do formulário
        if (jsonData.razaoSocial || jsonData.cnpj) {
            return this.processRawFormData(jsonData);
        }
        
        throw new Error('Formato de JSON não reconhecido');
    }
    
    processExportedData(exportedData) {
        if (!exportedData.metadata) {
            throw new Error('Metadados obrigatórios não encontrados');
        }
        
        if (!exportedData.metadata.programType) {
            throw new Error('Tipo de programa não encontrado nos metadados');
        }
        
        if (exportedData.metadata.programType !== this.config.programType) {
            throw new Error(`Arquivo é do programa ${exportedData.metadata.programType}, mas sistema está configurado para ${this.config.programType}`);
        }
        
        if (!exportedData.formData) {
            throw new Error('Dados do formulário não encontrados');
        }
        
        return {
            formData: exportedData.formData,
            metadata: exportedData.metadata,
            isValid: true
        };
    }
    
    processRawFormData(rawData) {
        if (!rawData.razaoSocial) {
            throw new Error('razaoSocial é obrigatória nos dados');
        }
        
        if (!rawData.cnpj) {
            throw new Error('CNPJ é obrigatório nos dados');
        }
        
        return {
            formData: rawData,
            metadata: {
                programType: this.config.programType,
                importedAt: new Date().toISOString(),
                source: 'raw_data'
            },
            isValid: true
        };
    }
    
    populateForm(processedData) {
        if (!processedData) {
            throw new Error('Dados processados obrigatórios não fornecidos');
        }
        
        if (!processedData.formData) {
            throw new Error('formData obrigatório não encontrado');
        }
        
        const form = document.getElementById('projectForm');
        if (!form) {
            throw new Error('Formulário não encontrado no DOM');
        }
        
        const populatedFields = [];
        const failedFields = [];
        
        Object.entries(processedData.formData).forEach(([fieldName, value]) => {
            if (fieldName.startsWith('_')) {
                return; // Ignorar metadados
            }
            
            const field = this.findFormField(fieldName);
            if (!field) {
                failedFields.push(fieldName);
                return;
            }
            
            try {
                this.setFieldValue(field, value);
                populatedFields.push(fieldName);
            } catch (error) {
                failedFields.push(`${fieldName}: ${error.message}`);
            }
        });
        
        if (failedFields.length > 0) {
            console.warn('Campos que falharam ao popular:', failedFields);
        }

        // CRITICAL FIX: Normalizar navegação após importação
        // Extrai currentStep do metadata e normaliza visualização de seções
        if (processedData.formData._metadata && processedData.formData._metadata.currentStep) {
            const savedStep = processedData.formData._metadata.currentStep;

            // Atualizar currentStep no módulo ProGoiás
            if (window.progoiasForm) {
                window.progoiasForm.currentStep = savedStep;
                // Normalizar estado (esconder todas exceto savedStep)
                window.progoiasForm.ensureSingleActiveSection();
                console.log(`✓ [Import] Navegação restaurada para seção ${savedStep}`);
            }
        } else {
            // Se não há metadata, garantir que apenas seção 1 está visível
            if (window.progoiasForm) {
                window.progoiasForm.currentStep = 1;
                window.progoiasForm.ensureSingleActiveSection();
                console.log(`✓ [Import] Estado normalizado para seção 1 (padrão)`);
            }
        }

        return {
            populatedCount: populatedFields.length,
            failedCount: failedFields.length,
            populatedFields,
            failedFields
        };
    }
    
    findFormField(fieldName) {
        // Tentar por name primeiro
        let field = document.querySelector(`[name="${fieldName}"]`);
        if (field) return field;
        
        // Tentar por id
        field = document.getElementById(fieldName);
        if (field) return field;
        
        // Campo não encontrado
        return null;
    }
    
    setFieldValue(field, value) {
        if (!field) {
            throw new Error('Campo não fornecido');
        }
        
        if (value === null || value === undefined) {
            return; // Não definir valores nulos
        }
        
        switch (field.type) {
            case 'checkbox':
                if (Array.isArray(value)) {
                    field.checked = value.includes(field.value);
                } else {
                    field.checked = Boolean(value);
                }
                break;
                
            case 'radio':
                field.checked = (field.value === String(value));
                break;
                
            case 'file':
                // Não é possível definir valor para campos de arquivo
                console.warn(`Campo de arquivo ${field.name} não pode ser populado automaticamente`);
                break;
                
            default:
                field.value = String(value);
                break;
        }
        
        // Disparar evento de mudança para triggers de validação/formatação
        field.dispatchEvent(new Event('change', { bubbles: true }));
        field.dispatchEvent(new Event('input', { bubbles: true }));
    }
    
    validateImportedData(processedData, mode = 'strict') {
        if (!processedData) {
            throw new Error('Dados para validação não fornecidos');
        }

        if (!processedData.formData) {
            throw new Error('formData obrigatório para validação');
        }

        // Validação flexível: apenas campos básicos (para importação parcial/edição)
        if (mode === 'flexible') {
            const baseFields = ['razaoSocial', 'cnpj'];
            const missingFields = baseFields.filter(f => !processedData.formData[f]);

            if (missingFields.length > 0) {
                throw new Error(`Campos essenciais ausentes: ${missingFields.join(', ')}`);
            }

            console.warn('[Import] Modo flexível: campos opcionais podem estar ausentes');
            return true;
        }

        // Validação estrita: todos campos obrigatórios (para envio final)
        const requiredFields = this.getRequiredFields();
        const missingFields = requiredFields.filter(f => !processedData.formData[f]);

        if (missingFields.length > 0) {
            throw new Error(`Campos obrigatórios ausentes: ${missingFields.join(', ')}`);
        }

        // Validações específicas por programa
        this.validateProgramSpecificData(processedData.formData);

        return true;
    }
    
    getRequiredFields() {
        const baseFields = ['razaoSocial', 'cnpj'];
        
        if (this.config.programType === 'CEI') {
            return [...baseFields, 'valorTotalInvestimento', 'dataInicio'];
        }
        
        if (this.config.programType === 'ProGoiás') {
            return [...baseFields, 'valorTotalInvestimento', 'empregosDiretos'];
        }
        
        return baseFields;
    }
    
    validateProgramSpecificData(formData) {
        if (this.config.programType === 'CEI') {
            this.validateCEIData(formData);
        } else if (this.config.programType === 'ProGoiás') {
            this.validateProGoiasData(formData);
        }
    }
    
    validateCEIData(formData) {
        if (formData.valorTotalInvestimento) {
            const valor = parseFloat(formData.valorTotalInvestimento.replace(/[^\d.,]/g, '').replace(',', '.'));
            if (valor < 500000) {
                throw new Error('CEI: Valor mínimo de investimento é R$ 500.000,00');
            }
        }
        
        if (formData.prazoExecucao) {
            const prazo = parseInt(formData.prazoExecucao);
            if (prazo > 36) {
                throw new Error('CEI: Prazo máximo é 36 meses');
            }
        }
    }
    
    validateProGoiasData(formData) {
        if (formData.empregosDiretos) {
            const empregos = parseInt(formData.empregosDiretos);
            if (empregos < 10) {
                throw new Error('ProGoiás: Mínimo de 10 empregos diretos');
            }
        }
    }
}

class ImportManager {
    constructor(config) {
        if (!config) {
            throw new Error('ImportManager: configuração obrigatória');
        }
        
        this.importer = new FormImporter(config);
        this.setupFileInput();
    }
    
    setupFileInput() {
        const fileInput = document.getElementById('importJsonFile') || document.getElementById('importJsonFileHeader');
        if (!fileInput) {
            throw new Error('Input de arquivo para importação não encontrado');
        }
        
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.handleFileSelection(e.target.files[0]);
            }
        });
    }
    
    handleFileSelection(file) {
        this.importer.importFromJSON(file)
            .then(processedData => {
                // Modo flexível para importação/edição (permite dados parciais)
                this.importer.validateImportedData(processedData, 'flexible');
                const result = this.importer.populateForm(processedData);
                this.showImportSuccess(result);
            })
            .catch(error => {
                this.showImportError(error.message);
            });
    }
    
    showImportSuccess(result) {
        const message = `Importação concluída!\n` +
                       `Campos populados: ${result.populatedCount}\n` +
                       `Campos com falha: ${result.failedCount}`;
        
        alert(message);
        
        if (result.failedCount > 0) {
            console.warn('Campos que falharam:', result.failedFields);
        }
    }
    
    showImportError(errorMessage) {
        alert(`Erro na importação: ${errorMessage}`);
        console.error('Erro na importação:', errorMessage);
    }
    
    importFromFile(file) {
        if (!file) {
            throw new Error('Arquivo obrigatório para importação');
        }

        return this.importer.importFromJSON(file)
            .then(processedData => {
                // Modo flexível para importação/edição (permite dados parciais)
                this.importer.validateImportedData(processedData, 'flexible');
                return this.importer.populateForm(processedData);
            });
    }
}