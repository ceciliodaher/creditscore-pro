/* =====================================
   TOAST.JS
   Sistema de notificações toast
   Compartilhado por TODOS os sistemas
   NO FALLBACKS - NO HARDCODED DATA
   ===================================== */

/**
 * Sistema de notificações toast (snackbar)
 * Classe responsável por exibir notificações temporárias
 */
export class Toast {
    /**
     * Tipos de toast disponíveis
     * @readonly
     * @enum {string}
     */
    static Type = {
        SUCCESS: 'success',
        ERROR: 'error',
        WARNING: 'warning',
        INFO: 'info'
    };

    /**
     * Container de toasts (criado dinamicamente)
     * @private
     * @static
     */
    static #container = null;

    /**
     * Exibe um toast
     * @param {Object} options - Opções do toast
     * @param {string} options.message - Mensagem a exibir
     * @param {string} [options.type='info'] - Tipo do toast (success, error, warning, info)
     * @param {number} [options.duration=3000] - Duração em ms (0 = permanente)
     * @param {boolean} [options.closeable=true] - Se pode ser fechado manualmente
     * @returns {HTMLElement} Elemento do toast criado
     */
    static show(options) {
        const {
            message,
            type = this.Type.INFO,
            duration = 3000,
            closeable = true
        } = options;

        if (!message) {
            throw new Error('Toast: mensagem é obrigatória');
        }

        // Cria container se não existir
        if (!this.#container) {
            this.#createContainer();
        }

        // Cria elemento do toast
        const toastElement = this.#createToastElement(message, type, closeable);

        // Adiciona ao container
        this.#container.appendChild(toastElement);

        // Anima entrada
        setTimeout(() => toastElement.classList.add('show'), 10);

        // Remove automaticamente após duração (se não for permanente)
        if (duration > 0) {
            setTimeout(() => this.#removeToast(toastElement), duration);
        }

        return toastElement;
    }

    /**
     * Exibe toast de sucesso
     * @param {string} message - Mensagem
     * @param {number} [duration=3000] - Duração em ms
     * @returns {HTMLElement} Elemento do toast
     */
    static success(message, duration = 3000) {
        return this.show({
            message,
            type: this.Type.SUCCESS,
            duration
        });
    }

    /**
     * Exibe toast de erro
     * @param {string} message - Mensagem
     * @param {number} [duration=5000] - Duração em ms (erros duram mais)
     * @returns {HTMLElement} Elemento do toast
     */
    static error(message, duration = 5000) {
        return this.show({
            message,
            type: this.Type.ERROR,
            duration
        });
    }

    /**
     * Exibe toast de aviso
     * @param {string} message - Mensagem
     * @param {number} [duration=4000] - Duração em ms
     * @returns {HTMLElement} Elemento do toast
     */
    static warning(message, duration = 4000) {
        return this.show({
            message,
            type: this.Type.WARNING,
            duration
        });
    }

    /**
     * Exibe toast informativo
     * @param {string} message - Mensagem
     * @param {number} [duration=3000] - Duração em ms
     * @returns {HTMLElement} Elemento do toast
     */
    static info(message, duration = 3000) {
        return this.show({
            message,
            type: this.Type.INFO,
            duration
        });
    }

    /**
     * Cria container de toasts
     * @private
     * @static
     */
    static #createContainer() {
        this.#container = document.createElement('div');
        this.#container.className = 'toast-container';
        document.body.appendChild(this.#container);
    }

    /**
     * Cria elemento do toast
     * @private
     * @static
     * @param {string} message - Mensagem
     * @param {string} type - Tipo do toast
     * @param {boolean} closeable - Se pode ser fechado
     * @returns {HTMLElement} Elemento do toast
     */
    static #createToastElement(message, type, closeable) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;

        // Ícone baseado no tipo
        const icon = this.#getIconForType(type);

        toast.innerHTML = `
            <span class="toast-icon">${icon}</span>
            <span class="toast-message">${message}</span>
            ${closeable ? '<button class="toast-close">&times;</button>' : ''}
        `;

        // Event listener para fechar
        if (closeable) {
            const closeBtn = toast.querySelector('.toast-close');
            closeBtn.addEventListener('click', () => this.#removeToast(toast));
        }

        return toast;
    }

    /**
     * Remove toast do DOM
     * @private
     * @static
     * @param {HTMLElement} toastElement - Elemento do toast
     */
    static #removeToast(toastElement) {
        if (!toastElement || !toastElement.parentNode) {
            return;
        }

        // Anima saída
        toastElement.classList.remove('show');

        // Remove após animação
        setTimeout(() => {
            if (toastElement.parentNode) {
                toastElement.parentNode.removeChild(toastElement);
            }
        }, 300);
    }

    /**
     * Retorna ícone para o tipo de toast
     * @private
     * @static
     * @param {string} type - Tipo do toast
     * @returns {string} Emoji ou ícone
     */
    static #getIconForType(type) {
        const icons = {
            success: '✓',
            error: '✗',
            warning: '⚠',
            info: 'ℹ'
        };

        return icons[type] || icons.info;
    }

    /**
     * Limpa todos os toasts
     * @static
     */
    static clearAll() {
        if (this.#container) {
            this.#container.innerHTML = '';
        }
    }
}
