/**
 * Company Selector Component (V3 - Multi-Empresa Security)
 * Sistema de Financiamento - Portal Expertzy
 *
 * @description Componente para seleção e troca de empresas no formulário de financiamento.
 *              Gerencia múltiplas empresas cadastradas com persistência em IndexedDB.
 *
 * @features
 * - Dropdown de seleção com busca em tempo real
 * - Auto-save e detecção de dados não salvos
 * - Modal de confirmação ao trocar empresa
 * - Loading states para operações assíncronas
 * - Responsive e acessível (WCAG 2.1 AA)
 * - **V3**: Integração com EmpresaAccessManager (SecureContext)
 * - **V3**: Validação CNPJ com CNPJValidator
 * - **V3**: Dispatch de evento empresaAlterada
 *
 * @author Claude (Anthropic)
 * @version 3.0.0
 * @license MIT
 */

class CompanySelector {
  /**
   * @param {Object} options - Opções de configuração
   * @param {string} options.dbName - Nome do banco IndexedDB (default: 'financiamento')
   * @param {number} options.dbVersion - Versão do banco (default: 1)
   * @param {boolean} options.autoSave - Ativar auto-save (default: true)
   * @param {number} options.autoSaveInterval - Intervalo auto-save periódico em ms (default: 30000)
   * @param {number} options.autoSaveDebounce - Debounce auto-save em ms (default: 3000)
   * @param {Function} options.onCompanyChange - Callback ao trocar empresa
   * @param {Function} options.onError - Callback de erro
   */
  constructor(options = {}) {
    // Configuração
    this.config = {
      dbName: options.dbName || 'financiamento',
      dbVersion: options.dbVersion || 1,
      autoSave: options.autoSave !== false,
      autoSaveInterval: options.autoSaveInterval || 30000,
      autoSaveDebounce: options.autoSaveDebounce || 3000,
      onCompanyChange: options.onCompanyChange || null,
      onError: options.onError || this.defaultErrorHandler.bind(this)
    };

    // Estado
    this.state = {
      db: null,
      companies: [],
      selectedCompany: null,
      hasUnsavedChanges: false,
      pendingCompanyChange: null,
      isLoading: false,
      dropdownOpen: false
    };

    // Auto-save timers
    this.autoSaveTimer = null;
    this.autoSaveDebounceTimer = null;

    // DOM elements (inicializados em init)
    this.elements = {};

    // Bind methods
    this.handleCompanySelect = this.handleCompanySelect.bind(this);
    this.handleSearch = this.handleSearch.bind(this);
    this.handleNewCompany = this.handleNewCompany.bind(this);
    this.toggleDropdown = this.toggleDropdown.bind(this);
    this.closeDropdown = this.closeDropdown.bind(this);
    this.confirmCompanyChange = this.confirmCompanyChange.bind(this);
    this.closeConfirmationModal = this.closeConfirmationModal.bind(this);
    this.handleOutsideClick = this.handleOutsideClick.bind(this);
    this.handleKeydown = this.handleKeydown.bind(this);
  }

  /**
   * Inicializa o componente
   */
  async init() {
    try {
      // Cache DOM elements
      this.cacheElements();

      // Inicializar IndexedDB
      this.state.db = await this.initDB();

      // Carregar empresas
      this.state.companies = await this.loadCompanies();

      // FASE 0: Recuperar empresa ativa do localStorage (se existir)
      const savedEmpresaId = this.getActiveCompanyFromLocalStorage();
      if (savedEmpresaId) {
        const savedCompany = this.state.companies.find(c => c.id === savedEmpresaId);
        if (savedCompany) {
          this.state.selectedCompany = savedCompany;
          // Garantir que está marcada como ativa
          savedCompany.active = true;
          console.log(`[CompanySelector] Restaurado empresa do localStorage: ${savedCompany.razaoSocial} (ID: ${savedEmpresaId})`);
        } else {
          // Empresa não encontrada, usar primeira disponível
          this.state.selectedCompany = this.state.companies.find(c => c.active) || this.state.companies[0];
        }
      } else {
        // Identificar empresa ativa (comportamento original)
        this.state.selectedCompany = this.state.companies.find(c => c.active) || this.state.companies[0];
      }

      // Renderizar UI
      this.render();

      // Bind events
      this.bindEvents();

      // Iniciar auto-save se habilitado
      if (this.config.autoSave) {
        this.startAutoSave();
      }

      console.log('[CompanySelector] Initialized successfully');
    } catch (error) {
      this.config.onError(error);
    }
  }

  /**
   * Cache DOM elements
   */
  cacheElements() {
    this.elements = {
      // Main components
      companySelectorButton: document.getElementById('companySelectorButton'),
      companyDropdown: document.getElementById('companyDropdown'),
      companyList: document.getElementById('companyList'),
      companySearch: document.getElementById('companySearch'),

      // Selected company display
      selectedCompanyName: document.getElementById('selectedCompanyName'),
      selectedCompanyCNPJ: document.getElementById('selectedCompanyCNPJ'),
      companyBadge: document.getElementById('companyBadge'),

      // Loading
      loadingIndicator: document.querySelector('.loading-indicator'),
      companySelector: document.getElementById('companySelector'),

      // Modal
      confirmationModal: document.getElementById('confirmationModal'),
      btnModalCancel: document.getElementById('btnModalCancel'),
      btnModalConfirm: document.getElementById('btnModalConfirm'),

      // New company button
      btnNewCompany: document.getElementById('btnNewCompany')
    };

    // Validate required elements
    const requiredElements = [
      'companySelectorButton',
      'companyDropdown',
      'companyList',
      'selectedCompanyName',
      'selectedCompanyCNPJ',
      'companyBadge'
    ];

    for (const key of requiredElements) {
      if (!this.elements[key]) {
        throw new Error(`Required element #${key} not found in DOM`);
      }
    }
  }

  /**
   * Inicializa IndexedDB (V3 - usa schema centralizado)
   * @returns {Promise<IDBDatabase>}
   */
  async initDB() {
    // V3: Usar FinanciamentoIndexedDB centralizado
    if (!window.FinanciamentoIndexedDB) {
      throw new Error(
        'FinanciamentoIndexedDB não disponível. ' +
        'Carregar /src/assets/js/database/financiamento-indexeddb-schema.js'
      );
    }

    // Garantir que DB está inicializado
    const db = await window.FinanciamentoIndexedDB.openDatabase();
    console.log('[CompanySelector] V3: Usando FinanciamentoIndexedDB centralizado');

    return db;
  }

  /**
   * Carrega empresas do IndexedDB (V3 - usa listEmpresas)
   * @returns {Promise<Array>}
   */
  async loadCompanies() {
    // V3: Usar função centralizada listEmpresas (sorted by razaoSocial)
    const companies = await window.FinanciamentoIndexedDB.listEmpresas();
    console.log(`[CompanySelector] V3: ${companies.length} empresa(s) carregada(s)`);
    return companies;
  }

  /**
   * Renderiza todo o componente
   */
  render() {
    this.renderSelectedCompany();
    this.renderCompanyList(this.state.companies);
  }

  /**
   * Renderiza empresa selecionada no botão
   */
  renderSelectedCompany() {
    const { selectedCompanyName, selectedCompanyCNPJ, companyBadge } = this.elements;
    const { selectedCompany, companies } = this.state;

    if (!selectedCompany) {
      selectedCompanyName.textContent = 'Selecione uma empresa';
      selectedCompanyCNPJ.textContent = '00.000.000/0000-00';
      companyBadge.textContent = '0 cadastradas';

      // Disable button if no companies
      if (this.elements.companySelectorButton) {
        this.elements.companySelectorButton.disabled = companies.length === 0;
      }
      return;
    }

    selectedCompanyName.textContent = selectedCompany.razaoSocial || selectedCompany.name;
    selectedCompanyCNPJ.textContent = this.formatCNPJ(selectedCompany.cnpj);

    const count = companies.length;
    companyBadge.textContent = count === 1 ? '1 cadastrada' : `${count} cadastradas`;

    // Enable button
    if (this.elements.companySelectorButton) {
      this.elements.companySelectorButton.disabled = false;
    }
  }

  /**
   * Renderiza lista de empresas no dropdown
   * @param {Array} companies - Array de empresas a renderizar
   */
  renderCompanyList(companies = []) {
    const { companyList } = this.elements;

    if (!companyList) {
      console.warn('[CompanySelector] companyList element not found');
      return;
    }

    // Empty state
    if (companies.length === 0) {
      companyList.innerHTML = this.renderEmptyState();
      return;
    }

    // Render company items
    companyList.innerHTML = companies.map(company => `
      <div
        class="company-item ${company.active ? 'selected' : ''}"
        role="option"
        aria-selected="${company.active}"
        data-company-id="${company.id}"
        data-company-cnpj="${company.cnpj}"
        tabindex="0"
      >
        <div class="company-item-icon">
          <i class="fas fa-building"></i>
        </div>
        <div class="company-item-info">
          <div class="company-item-name">${this.escapeHtml(company.razaoSocial || company.name)}</div>
          <div class="company-item-cnpj">${this.formatCNPJ(company.cnpj)}</div>
        </div>
        <i class="fas fa-check company-item-check"></i>
      </div>
    `).join('');

    // Bind click events
    companyList.querySelectorAll('.company-item').forEach(item => {
      item.addEventListener('click', this.handleCompanySelect);
      item.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.handleCompanySelect.call(item, e);
        }
      });
    });
  }

  /**
   * Renderiza estado vazio (nenhuma empresa)
   * @returns {string} HTML do empty state
   */
  renderEmptyState() {
    return `
      <div class="company-empty">
        <div class="company-empty-icon">
          <i class="fas fa-building"></i>
        </div>
        <div class="company-empty-title">Nenhuma empresa encontrada</div>
        <div class="company-empty-text">
          Cadastre sua primeira empresa para começar.
        </div>
      </div>
    `;
  }

  /**
   * Handler de seleção de empresa
   * @param {Event} event
   */
  async handleCompanySelect(event) {
    const item = event.currentTarget || this;
    const companyId = parseInt(item.dataset.companyId, 10);
    const company = this.state.companies.find(c => c.id === companyId);

    if (!company) {
      console.warn('[CompanySelector] Company not found:', companyId);
      return;
    }

    // Se já está selecionada, apenas fecha dropdown
    if (company.active) {
      this.closeDropdown();
      return;
    }

    // Verificar dados não salvos
    if (this.state.hasUnsavedChanges) {
      this.state.pendingCompanyChange = company;
      this.openConfirmationModal();
      this.closeDropdown();
      return;
    }

    // Trocar empresa
    await this.switchCompany(company);
    this.closeDropdown();
  }

  /**
   * Troca empresa ativa (V3 - integra EmpresaAccessManager)
   * @param {Object} company - Empresa a ser ativada
   */
  async switchCompany(company) {
    if (!company) {
      throw new Error('Company is required');
    }

    // V3: Validar CNPJ antes de trocar
    if (window.CNPJValidator && !window.CNPJValidator.validate(company.cnpj)) {
      throw new Error(`CNPJ inválido: ${company.cnpj}`);
    }

    try {
      // Show loading
      this.setLoadingState(true);

      // V3: CRITICAL - Atualizar EmpresaAccessManager.setContext()
      if (!window.EmpresaAccessManager) {
        throw new Error(
          'EmpresaAccessManager não disponível. ' +
          'Carregar /src/assets/js/security/empresa-access-control.js'
        );
      }

      window.EmpresaAccessManager.setContext(
        company.id,
        company.cnpj,
        company.razaoSocial || company.name
      );

      console.log(`✓ EmpresaAccessManager.setContext(${company.id})`);

      // Update database
      await this.updateActiveCompany(company.id);

      // FASE 0: Persistir empresa ativa no localStorage
      this.persistActiveCompany(company.id);

      // Update local state
      this.state.companies.forEach(c => {
        c.active = (c.id === company.id);
      });
      this.state.selectedCompany = company;

      // Update UI
      this.render();

      // V3: Dispatch empresaAlterada event (para SecaoBase listeners)
      this.dispatchEmpresaAlterada(company);

      console.log(`[CompanySelector] Switched to company: ${company.razaoSocial || company.name}`);

      // Callback legado (se existir)
      if (this.config.onCompanyChange) {
        const formData = await this.loadCompanyFormData(company.cnpj);
        await this.config.onCompanyChange(company, formData);
      }

    } catch (error) {
      console.error('[CompanySelector] V3: Erro ao trocar empresa', error);
      this.config.onError(error);
    } finally {
      this.setLoadingState(false);
    }
  }

  /**
   * V3: Dispatch custom event empresaAlterada
   * Escutado por SecaoBase para reload de dados
   *
   * @param {Object} company - Empresa ativada
   */
  dispatchEmpresaAlterada(company) {
    const event = new CustomEvent('empresaAlterada', {
      detail: {
        empresaId: company.id,
        cnpj: company.cnpj,
        razaoSocial: company.razaoSocial || company.name
      },
      bubbles: true
    });

    window.dispatchEvent(event);
    console.log(`✓ Event 'empresaAlterada' dispatched (empresaId: ${company.id})`);
  }

  /**
   * Atualiza empresa ativa no IndexedDB (V3 - usa saveEmpresa)
   * @param {number} companyId - ID da empresa
   */
  async updateActiveCompany(companyId) {
    // V3: Carregar todas as empresas
    const allCompanies = await window.FinanciamentoIndexedDB.listEmpresas();

    // Atualizar flag active
    for (const company of allCompanies) {
      company.active = (company.id === companyId);
      company.updatedAt = new Date().toISOString();

      // Salvar usando função centralizada
      await window.FinanciamentoIndexedDB.saveEmpresa(company);
    }

    console.log(`✓ Empresa ${companyId} marcada como ativa no IndexedDB`);
  }

  /**
   * Carrega dados do formulário da empresa (V3 - via empresaId)
   * @param {string} cnpj - CNPJ da empresa (deprecated, usa empresaId)
   * @returns {Promise<Array>}
   */
  async loadCompanyFormData(cnpj) {
    // V3: Buscar empresaId via CNPJ
    const empresa = await window.FinanciamentoIndexedDB.findEmpresaByCNPJ(cnpj);

    if (!empresa) {
      console.warn(`[CompanySelector] V3: Empresa não encontrada (CNPJ: ${cnpj})`);
      return [];
    }

    // V3: Usar IndexedDBQueryValidator para carregar dados filtrados
    if (window.IndexedDBQueryValidator) {
      return await window.IndexedDBQueryValidator.getByCurrentEmpresa('formulario');
    }

    // Fallback: Carregar via índice empresaId
    return await window.FinanciamentoIndexedDB.findByEmpresa('formulario', empresa.id);
  }

  /**
   * Handler de busca em tempo real
   * @param {Event} event
   */
  handleSearch(event) {
    const searchTerm = event.target.value.toLowerCase().trim();

    if (!searchTerm) {
      this.renderCompanyList(this.state.companies);
      return;
    }

    // Filtrar por nome OU CNPJ
    const filtered = this.state.companies.filter(company => {
      const name = (company.razaoSocial || company.name || '').toLowerCase();
      const cnpj = (company.cnpj || '').replace(/\D/g, '');
      const searchCnpj = searchTerm.replace(/\D/g, '');

      return name.includes(searchTerm) || cnpj.includes(searchCnpj);
    });

    this.renderCompanyList(filtered);
  }

  /**
   * Handler do botão "Nova Empresa"
   */
  handleNewCompany() {
    console.log('[CompanySelector] New company button clicked');

    // Fechar dropdown
    this.closeDropdown();

    // TODO: Implementar modal de cadastro de nova empresa
    // Por enquanto, apenas log
    alert('Modal de cadastro de nova empresa será implementado aqui.');

    // Exemplo de como seria:
    // this.openNewCompanyModal();
  }

  /**
   * Toggle dropdown (abre/fecha)
   */
  toggleDropdown() {
    if (this.state.dropdownOpen) {
      this.closeDropdown();
    } else {
      this.openDropdown();
    }
  }

  /**
   * Abre dropdown
   */
  openDropdown() {
    const { companyDropdown, companySelectorButton, companySearch } = this.elements;

    companyDropdown.classList.add('active');
    companySelectorButton.classList.add('active');
    companySelectorButton.setAttribute('aria-expanded', 'true');

    this.state.dropdownOpen = true;

    // Focus no search input
    if (companySearch) {
      setTimeout(() => companySearch.focus(), 100);
    }
  }

  /**
   * Fecha dropdown
   */
  closeDropdown() {
    const { companyDropdown, companySelectorButton, companySearch } = this.elements;

    companyDropdown.classList.remove('active');
    companySelectorButton.classList.remove('active');
    companySelectorButton.setAttribute('aria-expanded', 'false');

    this.state.dropdownOpen = false;

    // Limpar busca
    if (companySearch) {
      companySearch.value = '';
      this.renderCompanyList(this.state.companies);
    }
  }

  /**
   * Abre modal de confirmação
   */
  openConfirmationModal() {
    const { confirmationModal } = this.elements;

    if (confirmationModal) {
      confirmationModal.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  }

  /**
   * Fecha modal de confirmação
   */
  closeConfirmationModal() {
    const { confirmationModal } = this.elements;

    if (confirmationModal) {
      confirmationModal.classList.remove('active');
      document.body.style.overflow = '';
    }

    this.state.pendingCompanyChange = null;
  }

  /**
   * Confirma troca de empresa (perdendo dados não salvos)
   */
  async confirmCompanyChange() {
    if (this.state.pendingCompanyChange) {
      this.state.hasUnsavedChanges = false;
      await this.switchCompany(this.state.pendingCompanyChange);
    }
    this.closeConfirmationModal();
  }

  /**
   * Define estado de loading
   * @param {boolean} isLoading
   */
  setLoadingState(isLoading) {
    const { companySelector, loadingIndicator } = this.elements;

    this.state.isLoading = isLoading;

    if (companySelector) {
      companySelector.classList.toggle('loading', isLoading);
    }

    if (loadingIndicator) {
      loadingIndicator.style.display = isLoading ? 'block' : 'none';
    }
  }

  /**
   * Handler de clique fora do componente
   * @param {Event} event
   */
  handleOutsideClick(event) {
    const { companySelector } = this.elements;

    if (companySelector && !companySelector.contains(event.target)) {
      this.closeDropdown();
    }
  }

  /**
   * Handler de teclado global
   * @param {Event} event
   */
  handleKeydown(event) {
    if (event.key === 'Escape') {
      this.closeDropdown();
      this.closeConfirmationModal();
    }
  }

  /**
   * Bind event listeners
   */
  bindEvents() {
    const {
      companySelectorButton,
      companySearch,
      btnNewCompany,
      btnModalCancel,
      btnModalConfirm,
      confirmationModal
    } = this.elements;

    // Dropdown toggle
    if (companySelectorButton) {
      companySelectorButton.addEventListener('click', this.toggleDropdown);
    }

    // Search
    if (companySearch) {
      companySearch.addEventListener('input', this.handleSearch);
    }

    // New company
    if (btnNewCompany) {
      btnNewCompany.addEventListener('click', this.handleNewCompany);
    }

    // Modal actions
    if (btnModalCancel) {
      btnModalCancel.addEventListener('click', this.closeConfirmationModal);
    }

    if (btnModalConfirm) {
      btnModalConfirm.addEventListener('click', this.confirmCompanyChange);
    }

    // Close modal on overlay click
    if (confirmationModal) {
      confirmationModal.addEventListener('click', (e) => {
        if (e.target === confirmationModal) {
          this.closeConfirmationModal();
        }
      });
    }

    // Global events
    document.addEventListener('click', this.handleOutsideClick);
    document.addEventListener('keydown', this.handleKeydown);
  }

  /**
   * Remove event listeners (cleanup)
   */
  unbindEvents() {
    document.removeEventListener('click', this.handleOutsideClick);
    document.removeEventListener('keydown', this.handleKeydown);
  }

  /**
   * Inicia auto-save periódico e debounce
   */
  startAutoSave() {
    // Auto-save periódico (30s)
    this.autoSaveTimer = setInterval(() => {
      this.performAutoSave();
    }, this.config.autoSaveInterval);

    console.log(`[CompanySelector] Auto-save started (interval: ${this.config.autoSaveInterval}ms)`);
  }

  /**
   * Para auto-save
   */
  stopAutoSave() {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = null;
    }

    if (this.autoSaveDebounceTimer) {
      clearTimeout(this.autoSaveDebounceTimer);
      this.autoSaveDebounceTimer = null;
    }
  }

  /**
   * Trigger auto-save com debounce (chamado ao alterar formulário)
   */
  triggerAutoSaveDebounce() {
    if (this.autoSaveDebounceTimer) {
      clearTimeout(this.autoSaveDebounceTimer);
    }

    this.autoSaveDebounceTimer = setTimeout(() => {
      this.performAutoSave();
    }, this.config.autoSaveDebounce);
  }

  /**
   * Executa auto-save
   */
  async performAutoSave() {
    if (!this.state.selectedCompany) {
      return;
    }

    try {
      // TODO: Implementar lógica de auto-save
      // Por enquanto, apenas simular
      console.log('[CompanySelector] Auto-save triggered');

      // Exemplo:
      // const formData = this.collectFormData();
      // await this.saveToIndexedDB(formData);

    } catch (error) {
      console.error('[CompanySelector] Auto-save error:', error);
    }
  }

  /**
   * Marca como tendo alterações não salvas
   * @param {boolean} hasChanges
   */
  setUnsavedChanges(hasChanges) {
    this.state.hasUnsavedChanges = hasChanges;

    if (hasChanges) {
      this.triggerAutoSaveDebounce();
    }
  }

  /**
   * Formata CNPJ: 00.000.000/0000-00 (V3 - usa CNPJValidator)
   * @param {string} cnpj
   * @returns {string}
   */
  formatCNPJ(cnpj) {
    if (!cnpj) return '00.000.000/0000-00';

    // V3: Usar CNPJValidator se disponível
    if (window.CNPJValidator) {
      try {
        return window.CNPJValidator.format(cnpj);
      } catch (error) {
        console.warn('[CompanySelector] Erro ao formatar CNPJ:', error);
        return cnpj;
      }
    }

    // Fallback: Formatação básica
    const cleaned = cnpj.replace(/\D/g, '');

    if (cleaned.length !== 14) {
      return cnpj;
    }

    return cleaned.replace(
      /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
      '$1.$2.$3/$4-$5'
    );
  }

  /**
   * Escapa HTML para prevenir XSS
   * @param {string} text
   * @returns {string}
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Handler padrão de erro
   * @param {Error} error
   */
  defaultErrorHandler(error) {
    console.error('[CompanySelector] Error:', error);
    alert(`Erro: ${error.message}`);
  }

  /**
   * FASE 0: Persiste empresa ativa no localStorage
   * @param {number} empresaId - ID da empresa ativa
   */
  persistActiveCompany(empresaId) {
    try {
      localStorage.setItem('creditscore_empresaAtiva', empresaId.toString());
      console.log(`✓ Empresa ativa persistida no localStorage: ${empresaId}`);
    } catch (error) {
      console.error('[CompanySelector] Erro ao persistir no localStorage:', error);
    }
  }

  /**
   * FASE 0: Recupera empresa ativa do localStorage
   * @returns {number|null} ID da empresa ativa ou null se não existir
   */
  getActiveCompanyFromLocalStorage() {
    try {
      const empresaId = localStorage.getItem('creditscore_empresaAtiva');
      if (empresaId) {
        return parseInt(empresaId, 10);
      }
      return null;
    } catch (error) {
      console.error('[CompanySelector] Erro ao recuperar do localStorage:', error);
      return null;
    }
  }

  /**
   * Destroy componente (cleanup)
   */
  destroy() {
    this.stopAutoSave();
    this.unbindEvents();

    if (this.state.db) {
      this.state.db.close();
    }

    console.log('[CompanySelector] Destroyed');
  }

  /**
   * API pública: Obtém empresa atualmente selecionada
   * @returns {Object|null}
   */
  getSelectedCompany() {
    return this.state.selectedCompany;
  }

  /**
   * API pública: Obtém todas as empresas cadastradas
   * @returns {Array}
   */
  getCompanies() {
    return this.state.companies;
  }

  /**
   * API pública: Adiciona nova empresa (V3 - com validação CNPJ)
   * @param {Object} company - Dados da empresa
   * @returns {Promise<Object>} Empresa criada com ID
   */
  async addCompany(company) {
    if (!company.cnpj || !company.razaoSocial) {
      throw new Error('CNPJ and Razão Social are required');
    }

    // V3: Validar CNPJ rigorosamente
    if (window.CNPJValidator && !window.CNPJValidator.validate(company.cnpj)) {
      throw new Error(`CNPJ inválido: ${company.cnpj}`);
    }

    // V3: Sanitizar CNPJ (somente dígitos)
    const cnpjSanitized = window.CNPJValidator
      ? window.CNPJValidator.extractDigits(company.cnpj)
      : company.cnpj.replace(/\D/g, '');

    // Verificar se CNPJ já existe
    const existing = await window.FinanciamentoIndexedDB.findEmpresaByCNPJ(cnpjSanitized);
    if (existing) {
      throw new Error(`CNPJ ${cnpjSanitized} já cadastrado (Empresa: ${existing.razaoSocial})`);
    }

    const newCompany = {
      ...company,
      cnpj: cnpjSanitized,
      active: this.state.companies.length === 0, // Primeira empresa é auto-ativa
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // V3: Salvar usando função centralizada
    const savedCompany = await window.FinanciamentoIndexedDB.saveEmpresa(newCompany);

    // Atualizar estado local
    this.state.companies.push(savedCompany);

    // Se é a primeira empresa, selecionar automaticamente
    if (savedCompany.active) {
      this.state.selectedCompany = savedCompany;

      // V3: Atualizar EmpresaAccessManager
      if (window.EmpresaAccessManager) {
        window.EmpresaAccessManager.setContext(
          savedCompany.id,
          savedCompany.cnpj,
          savedCompany.razaoSocial
        );
      }
    }

    this.render();
    console.log(`✓ Empresa adicionada: ${savedCompany.razaoSocial} (ID: ${savedCompany.id})`);

    return savedCompany;
  }

  /**
   * API pública: Atualiza empresa existente (V3 - usa saveEmpresa)
   * @param {number} companyId - ID da empresa
   * @param {Object} updates - Dados a atualizar
   */
  async updateCompany(companyId, updates) {
    // Carregar empresa atual
    const allCompanies = await window.FinanciamentoIndexedDB.listEmpresas();
    const company = allCompanies.find(c => c.id === companyId);

    if (!company) {
      throw new Error(`Empresa não encontrada: ID ${companyId}`);
    }

    // V3: Validar CNPJ se alterado
    if (updates.cnpj && updates.cnpj !== company.cnpj) {
      if (window.CNPJValidator && !window.CNPJValidator.validate(updates.cnpj)) {
        throw new Error(`CNPJ inválido: ${updates.cnpj}`);
      }

      // Sanitizar CNPJ
      updates.cnpj = window.CNPJValidator
        ? window.CNPJValidator.extractDigits(updates.cnpj)
        : updates.cnpj.replace(/\D/g, '');
    }

    const updatedCompany = {
      ...company,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    // V3: Salvar usando função centralizada
    const saved = await window.FinanciamentoIndexedDB.saveEmpresa(updatedCompany);

    // Atualizar estado local
    const index = this.state.companies.findIndex(c => c.id === companyId);
    if (index !== -1) {
      this.state.companies[index] = saved;
    }

    // Atualizar selectedCompany se é a empresa ativa
    if (this.state.selectedCompany && this.state.selectedCompany.id === companyId) {
      this.state.selectedCompany = saved;
    }

    this.render();
    console.log(`✓ Empresa atualizada: ${saved.razaoSocial} (ID: ${saved.id})`);

    return saved;
  }

  /**
   * API pública: Remove empresa (V3 - com limpeza de dados)
   * @param {number} companyId - ID da empresa
   */
  async deleteCompany(companyId) {
    // Buscar empresa para confirmar existência
    const allCompanies = await window.FinanciamentoIndexedDB.listEmpresas();
    const company = allCompanies.find(c => c.id === companyId);

    if (!company) {
      throw new Error(`Empresa não encontrada: ID ${companyId}`);
    }

    // V3: CRITICAL - Limpar TODOS os dados da empresa antes de deletar
    if (window.IndexedDBQueryValidator) {
      console.warn(`⚠️  Limpando todos os dados da empresa: ${company.razaoSocial} (ID: ${companyId})`);
      await window.IndexedDBQueryValidator.clearCurrentEmpresaData();
    }

    // Deletar empresa da store empresas
    await window.FinanciamentoIndexedDB.deleteFromStore('empresas', companyId);

    // Atualizar estado local
    this.state.companies = this.state.companies.filter(c => c.id !== companyId);

    // Se era a empresa ativa, selecionar outra
    if (this.state.selectedCompany && this.state.selectedCompany.id === companyId) {
      this.state.selectedCompany = this.state.companies[0] || null;

      // V3: Atualizar EmpresaAccessManager
      if (this.state.selectedCompany && window.EmpresaAccessManager) {
        window.EmpresaAccessManager.setContext(
          this.state.selectedCompany.id,
          this.state.selectedCompany.cnpj,
          this.state.selectedCompany.razaoSocial
        );
      } else if (window.EmpresaAccessManager) {
        window.EmpresaAccessManager.clearContext();
      }
    }

    this.render();
    console.log(`✓ Empresa deletada: ${company.razaoSocial} (ID: ${companyId})`);
  }
}

// Export para uso em módulos ES6
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CompanySelector;
}

// Export global para uso direto no HTML
if (typeof window !== 'undefined') {
  window.CompanySelector = CompanySelector;
}
