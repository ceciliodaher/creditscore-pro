/* =====================================
   UI-COMPONENTS.JS
   Componentes UI inspirados no shadcn/ui para vanilla JavaScript
   ===================================== */

/**
 * UIComponents - Factory de componentes UI
 */
export class UIComponents {
    /**
     * Cria um spinner de loading
     * @param {string} size - Tamanho: 'sm' | 'md' | 'lg'
     * @returns {HTMLElement}
     */
    static createSpinner(size = 'md') {
        const spinner = document.createElement('div');

        const sizeClasses = {
            sm: 'w-4 h-4 border-2',
            md: 'w-6 h-6 border-4',
            lg: 'w-8 h-8 border-4'
        };

        spinner.className = `spinner ${sizeClasses[size]}`;
        spinner.setAttribute('role', 'status');
        spinner.setAttribute('aria-label', 'Carregando');

        return spinner;
    }

    /**
     * Cria um badge de status
     * @param {string} text - Texto do badge
     * @param {string} variant - 'pending' | 'in-progress' | 'completed' | 'auto' | 'error'
     * @returns {HTMLElement}
     */
    static createBadge(text, variant = 'pending') {
        const badge = document.createElement('span');
        badge.className = `badge badge-${variant}`;
        badge.textContent = text;
        badge.setAttribute('role', 'status');

        return badge;
    }

    /**
     * Cria uma barra de progresso
     * @param {number} progress - Progresso de 0-100
     * @param {string} label - Label acessível
     * @returns {HTMLElement}
     */
    static createProgressBar(progress, label = 'Progresso') {
        const container = document.createElement('div');
        container.className = 'progress-container';
        container.setAttribute('role', 'progressbar');
        container.setAttribute('aria-label', label);
        container.setAttribute('aria-valuenow', progress);
        container.setAttribute('aria-valuemin', '0');
        container.setAttribute('aria-valuemax', '100');

        const bar = document.createElement('div');
        bar.className = 'progress-bar';
        bar.style.width = `${progress}%`;

        container.appendChild(bar);

        return container;
    }

    /**
     * Atualiza uma barra de progresso existente
     * @param {HTMLElement} progressBar - Elemento da barra
     * @param {number} progress - Novo progresso 0-100
     */
    static updateProgressBar(progressBar, progress) {
        const bar = progressBar.querySelector('.progress-bar');
        if (bar) {
            bar.style.width = `${progress}%`;
            progressBar.setAttribute('aria-valuenow', progress);
        }
    }

    /**
     * Cria um skeleton loader
     * @param {string} type - 'text' | 'title' | 'button'
     * @param {string} width - Largura custom (opcional)
     * @returns {HTMLElement}
     */
    static createSkeleton(type = 'text', width = null) {
        const skeleton = document.createElement('div');

        const typeClasses = {
            text: 'skeleton-text',
            title: 'skeleton-title',
            button: 'skeleton-button'
        };

        skeleton.className = typeClasses[type];

        if (width) {
            skeleton.style.width = width;
        }

        skeleton.setAttribute('aria-hidden', 'true');

        return skeleton;
    }

    /**
     * Cria um ícone de status de módulo
     * @param {string} status - 'pending' | 'in-progress' | 'completed' | 'auto'
     * @param {string} icon - Emoji do ícone
     * @returns {HTMLElement}
     */
    static createModuleStatus(status, icon = '') {
        const statusIcon = document.createElement('span');
        statusIcon.className = `module-status module-${status}`;
        statusIcon.textContent = icon;
        statusIcon.setAttribute('role', 'img');
        statusIcon.setAttribute('aria-label', `Status: ${status}`);

        return statusIcon;
    }

    /**
     * Cria um card container
     * @param {string} title - Título do card
     * @param {HTMLElement} content - Conteúdo do card
     * @returns {HTMLElement}
     */
    static createCard(title, content) {
        const card = document.createElement('div');
        card.className = 'card';

        const header = document.createElement('div');
        header.className = 'card-header';

        const titleEl = document.createElement('h3');
        titleEl.className = 'card-title';
        titleEl.textContent = title;

        header.appendChild(titleEl);

        const body = document.createElement('div');
        body.className = 'card-body';
        body.appendChild(content);

        card.appendChild(header);
        card.appendChild(body);

        return card;
    }

    /**
     * Cria um toast notification
     * @param {string} message - Mensagem
     * @param {string} type - 'success' | 'error' | 'warning' | 'info'
     * @param {number} duration - Duração em ms (0 = permanente)
     * @returns {HTMLElement}
     */
    static createToast(message, type = 'info', duration = 3000) {
        const toast = document.createElement('div');

        const typeClasses = {
            success: 'bg-success-50 text-success-900 border-success-200',
            error: 'bg-danger-50 text-danger-900 border-danger-200',
            warning: 'bg-warning-50 text-warning-900 border-warning-200',
            info: 'bg-primary-50 text-primary-900 border-primary-200'
        };

        toast.className = `fixed bottom-4 right-4 p-4 rounded-lg border shadow-lg animate-fade-in ${typeClasses[type]}`;
        toast.textContent = message;
        toast.setAttribute('role', 'alert');
        toast.setAttribute('aria-live', 'polite');

        // Auto-remove após duration
        if (duration > 0) {
            setTimeout(() => {
                toast.classList.add('opacity-0', 'transition-opacity');
                setTimeout(() => toast.remove(), 300);
            }, duration);
        }

        return toast;
    }

    /**
     * Mostra um toast na página
     * @param {string} message - Mensagem
     * @param {string} type - 'success' | 'error' | 'warning' | 'info'
     * @param {number} duration - Duração em ms
     */
    static showToast(message, type = 'info', duration = 3000) {
        const toast = this.createToast(message, type, duration);
        document.body.appendChild(toast);
    }

    /**
     * Cria um botão
     * @param {string} text - Texto do botão
     * @param {string} variant - 'primary' | 'secondary' | 'success' | 'danger'
     * @param {Function} onClick - Callback de click
     * @returns {HTMLElement}
     */
    static createButton(text, variant = 'primary', onClick = null) {
        const button = document.createElement('button');
        button.className = `btn btn-${variant} focus-visible`;
        button.textContent = text;
        button.type = 'button';

        if (onClick) {
            button.addEventListener('click', onClick);
        }

        return button;
    }

    /**
     * Adiciona loading state a um botão
     * @param {HTMLElement} button - Botão
     * @param {boolean} loading - Estado de loading
     */
    static setButtonLoading(button, loading) {
        if (loading) {
            button.disabled = true;
            button.dataset.originalText = button.textContent;
            button.textContent = '';

            const spinner = this.createSpinner('sm');
            spinner.classList.add('mx-auto');
            button.appendChild(spinner);
        } else {
            button.disabled = false;
            button.innerHTML = '';
            button.textContent = button.dataset.originalText || 'Button';
        }
    }
}

// Exportação global para compatibilidade
if (typeof window !== 'undefined') {
    window.UIComponents = UIComponents;
}

console.log('✅ UIComponents carregado');
