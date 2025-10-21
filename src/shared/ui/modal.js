/* =====================================
   MODAL.JS
   Componente de modal genérico
   Compartilhado por TODOS os sistemas
   NO FALLBACKS - NO HARDCODED DATA
   ===================================== */

/**
 * Componente de modal reutilizável
 * Classe responsável por exibir, ocultar e gerenciar modals
 */
export class Modal {
    /**
     * @param {string} modalId - ID do elemento modal no DOM
     */
    constructor(modalId) {
        this.modalElement = document.getElementById(modalId);

        if (!this.modalElement) {
            throw new Error(`Modal com ID '${modalId}' não encontrado no DOM`);
        }

        this.contentElement = this.modalElement.querySelector('.modal-content');
        this.closeButton = this.modalElement.querySelector('.modal-close');

        this.#setupEventListeners();
    }

    /**
     * Configura event listeners do modal
     * @private
     */
    #setupEventListeners() {
        // Fecha modal ao clicar no botão close
        if (this.closeButton) {
            this.closeButton.addEventListener('click', () => this.hide());
        }

        // Fecha modal ao clicar fora do conteúdo
        this.modalElement.addEventListener('click', (e) => {
            if (e.target === this.modalElement) {
                this.hide();
            }
        });

        // Fecha modal com ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isVisible()) {
                this.hide();
            }
        });
    }

    /**
     * Exibe o modal
     * @param {string} [content] - Conteúdo HTML opcional para o modal
     */
    show(content) {
        if (content && this.contentElement) {
            this.contentElement.innerHTML = content;
        }

        this.modalElement.classList.add('show');
        document.body.style.overflow = 'hidden'; // Previne scroll do body
    }

    /**
     * Oculta o modal
     */
    hide() {
        this.modalElement.classList.remove('show');
        document.body.style.overflow = ''; // Restaura scroll do body
    }

    /**
     * Alterna visibilidade do modal
     */
    toggle() {
        if (this.isVisible()) {
            this.hide();
        } else {
            this.show();
        }
    }

    /**
     * Verifica se modal está visível
     * @returns {boolean} True se modal visível
     */
    isVisible() {
        return this.modalElement.classList.contains('show');
    }

    /**
     * Define conteúdo do modal
     * @param {string} content - Conteúdo HTML
     */
    setContent(content) {
        if (!this.contentElement) {
            throw new Error('Modal não possui elemento .modal-content');
        }

        this.contentElement.innerHTML = content;
    }

    /**
     * Adiciona classe CSS ao modal
     * @param {string} className - Nome da classe
     */
    addClass(className) {
        this.modalElement.classList.add(className);
    }

    /**
     * Remove classe CSS do modal
     * @param {string} className - Nome da classe
     */
    removeClass(className) {
        this.modalElement.classList.remove(className);
    }

    /**
     * Destrói o modal e remove event listeners
     */
    destroy() {
        this.hide();
        // Event listeners serão removidos pelo garbage collector
    }
}

/**
 * Factory para criar modals de confirmação
 */
export class ConfirmModal {
    /**
     * Exibe modal de confirmação
     * @param {Object} options - Opções do modal
     * @param {string} options.title - Título do modal
     * @param {string} options.message - Mensagem
     * @param {string} [options.confirmText='Confirmar'] - Texto do botão confirmar
     * @param {string} [options.cancelText='Cancelar'] - Texto do botão cancelar
     * @param {Function} options.onConfirm - Callback ao confirmar
     * @param {Function} [options.onCancel] - Callback ao cancelar
     * @returns {Promise<boolean>} Promise que resolve true se confirmado
     */
    static show(options) {
        return new Promise((resolve) => {
            const {
                title,
                message,
                confirmText = 'Confirmar',
                cancelText = 'Cancelar',
                onConfirm,
                onCancel
            } = options;

            const content = `
                <div class="confirm-modal">
                    <h3>${title}</h3>
                    <p>${message}</p>
                    <div class="modal-buttons">
                        <button class="btn-cancel">${cancelText}</button>
                        <button class="btn-confirm">${confirmText}</button>
                    </div>
                </div>
            `;

            // Cria modal temporário
            const modalId = 'confirm-modal-' + Date.now();
            const modalHTML = `
                <div id="${modalId}" class="modal">
                    <div class="modal-content"></div>
                </div>
            `;

            document.body.insertAdjacentHTML('beforeend', modalHTML);

            const modal = new Modal(modalId);
            modal.show(content);

            // Event listeners dos botões
            const confirmBtn = document.querySelector(`#${modalId} .btn-confirm`);
            const cancelBtn = document.querySelector(`#${modalId} .btn-cancel`);

            confirmBtn.addEventListener('click', () => {
                modal.hide();
                if (onConfirm) onConfirm();
                resolve(true);

                // Remove modal do DOM após fechar
                setTimeout(() => document.getElementById(modalId).remove(), 300);
            });

            cancelBtn.addEventListener('click', () => {
                modal.hide();
                if (onCancel) onCancel();
                resolve(false);

                // Remove modal do DOM após fechar
                setTimeout(() => document.getElementById(modalId).remove(), 300);
            });
        });
    }
}
