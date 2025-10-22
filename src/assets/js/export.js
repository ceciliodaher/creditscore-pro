/* =====================================
   EXPORT.JS
   Sistema unificado de exportação para CEI e ProGoiás
   NO FALLBACKS - NO MOCK DATA
   ===================================== */

class FormExporter {
    constructor(config, formData) {
        if (!config) {
            throw new Error('FormExporter: configuração obrigatória não fornecida');
        }
        
        if (!config.programType) {
            throw new Error('FormExporter: tipo de programa (programType) é obrigatório');
        }
        
        if (!formData) {
            throw new Error('FormExporter: dados do formulário são obrigatórios');
        }
        
        if (!formData.razaoSocial) {
            throw new Error('FormExporter: razaoSocial é obrigatória nos dados');
        }
        
        this.config = config;
        this.formData = formData;
        this.companyName = formData.razaoSocial.replace(/[^\w\s]/gi, '').trim();
    }
    
    generateFileName(extension) {
        const date = new Date().toISOString().split('T')[0];
        return `Projeto_${this.config.programType}_${this.companyName}_${date}.${extension}`;
    }
    
    exportToJSON() {
        const exportData = {
            metadata: {
                programType: this.config.programType,
                version: this.config.version,
                exportedAt: new Date().toISOString(),
                companyName: this.companyName
            },
            formData: this.formData
        };
        
        const jsonString = JSON.stringify(exportData, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const fileName = this.generateFileName('json');
        
        this.downloadFile(blob, fileName);
        return fileName;
    }
    
    exportToPDF() {
        if (typeof jsPDF === 'undefined') {
            throw new Error('Biblioteca jsPDF não carregada');
        }
        
        const doc = new jsPDF('p', 'mm', 'a4');
        const pageWidth = doc.internal.pageSize.getWidth();
        const margin = 20;
        let yPosition = margin;
        
        // Cabeçalho
        doc.setFontSize(20);
        doc.setFont('helvetica', 'bold');
        doc.text(`PROJETO ${this.config.programType}`, pageWidth / 2, yPosition + 10, { align: 'center' });
        
        doc.setFontSize(14);
        doc.setFont('helvetica', 'normal');
        doc.text(this.companyName, pageWidth / 2, yPosition + 20, { align: 'center' });
        
        doc.setFontSize(10);
        doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, pageWidth / 2, yPosition + 30, { align: 'center' });
        
        yPosition += 50;
        
        // Dados
        this.addPDFData(doc, yPosition, margin);
        
        const fileName = this.generateFileName('pdf');
        doc.save(fileName);
        
        return fileName;
    }
    
    addPDFData(doc, yPosition, margin) {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        
        Object.entries(this.formData).forEach(([key, value]) => {
            if (!key.startsWith('_')) {
                doc.text(`${key}: ${value}`, margin, yPosition);
                yPosition += 7;
                
                if (yPosition > 280) {
                    doc.addPage();
                    yPosition = margin;
                }
            }
        });
    }
    
    exportToExcel() {
        if (typeof XLSX === 'undefined') {
            throw new Error('Biblioteca XLSX não carregada');
        }
        
        const workbook = XLSX.utils.book_new();
        
        const data = [
            [`PROJETO ${this.config.programType}`],
            [this.companyName],
            [''],
            ['Campo', 'Valor']
        ];
        
        Object.entries(this.formData).forEach(([key, value]) => {
            if (!key.startsWith('_')) {
                data.push([key, value]);
            }
        });
        
        const worksheet = XLSX.utils.aoa_to_sheet(data);
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Projeto');
        
        const fileName = this.generateFileName('xlsx');
        XLSX.writeFile(workbook, fileName);
        
        return fileName;
    }
    
    exportToCSV() {
        const data = [
            ['Campo', 'Valor'],
            ['Programa', this.config.programType]
        ];
        
        Object.entries(this.formData).forEach(([key, value]) => {
            if (!key.startsWith('_')) {
                data.push([key, value]);
            }
        });
        
        const csvContent = data.map(row => 
            row.map(field => `"${String(field).replace(/"/g, '""')}"`)
               .join(',')
        ).join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const fileName = this.generateFileName('csv');
        
        this.downloadFile(blob, fileName);
        return fileName;
    }
    
    downloadFile(blob, fileName) {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
    }
}

class ExportManager {
    constructor(config, formData) {
        if (!config) {
            throw new Error('ExportManager: configuração obrigatória');
        }
        
        if (!formData) {
            throw new Error('ExportManager: dados obrigatórios');
        }
        
        this.exporter = new FormExporter(config, formData);
    }
    
    exportSelected(formats) {
        if (!Array.isArray(formats)) {
            throw new Error('Formatos devem ser fornecidos como array');
        }
        
        if (formats.length === 0) {
            throw new Error('Pelo menos um formato deve ser especificado');
        }
        
        const results = [];
        
        formats.forEach(format => {
            switch (format) {
                case 'json':
                    results.push(this.exporter.exportToJSON());
                    break;
                case 'pdf':
                    results.push(this.exporter.exportToPDF());
                    break;
                case 'excel':
                    results.push(this.exporter.exportToExcel());
                    break;
                case 'csv':
                    results.push(this.exporter.exportToCSV());
                    break;
                default:
                    throw new Error(`Formato '${format}' não suportado`);
            }
        });
        
        return results;
    }
}