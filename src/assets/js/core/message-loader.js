/* =====================================
   MESSAGE-LOADER.JS
   Carregador de Mensagens e Strings do Sistema
   NO HARDCODED DATA - Todas as strings vem do messages.json
   SOLID - Single Responsibility Principle
   ===================================== */

class MessageLoader {
    static INSTANCE = null;
    static messages = null;
    static loaded = false;

    /**
     * Carrega mensagens do arquivo JSON
     */
    static async load(messagesPath = '../../config/messages.json') {
        if (MessageLoader.loaded && MessageLoader.messages) {
            return MessageLoader.messages;
        }

        try {
            const response = await fetch(messagesPath);
            
            if (!response.ok) {
                throw new Error(`${response.status}: ${response.statusText}`);
            }
            
            MessageLoader.messages = await response.json();
            MessageLoader.loaded = true;
            
            console.log(`${MessageLoader.messages.icons.success} ${MessageLoader.messages.system.name} - Mensagens carregadas`);
            
            return MessageLoader.messages;
            
        } catch (error) {
            console.error('Erro ao carregar mensagens:', error);
            throw error;
        }
    }

    /**
     * Obtém mensagem por caminho (ex: 'modules.creditScore.initialized')
     */
    static get(path, defaultValue = '') {
        if (!MessageLoader.loaded || !MessageLoader.messages) {
            console.warn('MessageLoader: Mensagens não carregadas ainda');
            return defaultValue;
        }

        const keys = path.split('.');
        let value = MessageLoader.messages;

        for (const key of keys) {
            if (value && typeof value === 'object' && key in value) {
                value = value[key];
            } else {
                return defaultValue;
            }
        }

        return value;
    }

    /**
     * Obtém mensagem com substituições de variáveis
     * Ex: getMessage('validation.fieldType', { field: 'nome', type: 'string' })
     */
    static getMessage(path, replacements = {}) {
        let message = MessageLoader.get(path);
        
        if (typeof message === 'string' && Object.keys(replacements).length > 0) {
            Object.entries(replacements).forEach(([key, value]) => {
                message = message.replace(`{${key}}`, value);
            });
        }
        
        return message;
    }

    /**
     * Formata log com ícone
     */
    static log(iconPath, messagePath, ...args) {
        const icon = MessageLoader.get(iconPath);
        const message = MessageLoader.get(messagePath);
        console.log(`${icon} ${message}`, ...args);
    }

    /**
     * Formata erro com ícone
     */
    static error(messagePath, ...args) {
        const icon = MessageLoader.get('icons.error');
        const message = MessageLoader.get(messagePath);
        console.error(`${icon} ${message}`, ...args);
    }

    /**
     * Formata aviso com ícone
     */
    static warn(messagePath, ...args) {
        const icon = MessageLoader.get('icons.warning');
        const message = MessageLoader.get(messagePath);
        console.warn(`${icon} ${message}`, ...args);
    }

    /**
     * Formata info com ícone
     */
    static info(messagePath, ...args) {
        const icon = MessageLoader.get('icons.info');
        const message = MessageLoader.get(messagePath);
        console.log(`${icon} ${message}`, ...args);
    }

    /**
     * Verifica se mensagens foram carregadas
     */
    static isLoaded() {
        return MessageLoader.loaded;
    }

    /**
     * Obtém todas as mensagens
     */
    static getAll() {
        return MessageLoader.messages;
    }

    /**
     * Obtém seção completa de mensagens
     */
    static getSection(section) {
        return MessageLoader.get(section, {});
    }
}

// Disponibilizar globalmente
window.MessageLoader = MessageLoader;

console.log('MessageLoader carregado');