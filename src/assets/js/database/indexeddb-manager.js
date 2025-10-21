/* =====================================
   INDEXEDDB-MANAGER.JS
   Gerenciador IndexedDB com controle de acesso para analistas
   NO FALLBACKS - NO MOCK DATA - SOLID PRINCIPLES
   ===================================== */

class IndexedDBManager {
  constructor() {
    this.db = null;
    this.isAnalyst = this.detectAnalystMode();
    this.restrictedStores = this.getRestrictedStores();
  }

  /**
   * Detecta se está em modo analista via query params
   * IMPORTANTE: Esta é a única forma de acesso ao módulo analista
   */
  detectAnalystMode() {
    const urlParams = new URLSearchParams(window.location.search);
    const hasAnalystMode = urlParams.get('_analyst_mode') === 'true';
    const hasValidKey = urlParams.get('_analyst_key') === this.getAnalystKey();

    return hasAnalystMode && hasValidKey;
  }

  /**
   * Retorna chave de autenticação do analista
   * IMPORTANTE: Em produção, usar sistema de autenticação real
   */
  getAnalystKey() {
    // Hash SHA-256 conhecido apenas pelo analista
    // Em produção: implementar autenticação JWT ou similar
    return 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
  }

  /**
   * Retorna lista de stores restritas
   */
  getRestrictedStores() {
    return ['analises', 'scores', 'recomendacoes', 'flags_analise'];
  }

  /**
   * Verifica se uma store é restrita a analistas
   */
  isAnalystStore(storeName) {
    return this.restrictedStores.includes(storeName);
  }

  /**
   * Inicializa conexão com IndexedDB
   * Single Responsibility: apenas inicialização
   */
  async init() {
    return new Promise((resolve, reject) => {
      if (!window.indexedDB) {
        reject(new Error('IndexedDB não suportado neste navegador'));
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        reject(new Error(`Erro ao abrir banco de dados: ${request.error}`));
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('✓ IndexedDB inicializado:', DB_NAME);
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        console.log('🔧 Criando/atualizando schema IndexedDB...');
        this.createStores(event.target.result);
      };
    });
  }

  /**
   * Cria todas as stores definidas no schema
   * Open/Closed Principle: extensível via STORES
   */
  createStores(db) {
    Object.values(STORES).forEach(storeConfig => {
      if (!db.objectStoreNames.contains(storeConfig.name)) {
        console.log(`  → Criando store: ${storeConfig.name}`);

        const objectStore = db.createObjectStore(storeConfig.name, {
          keyPath: storeConfig.keyPath,
          autoIncrement: storeConfig.autoIncrement
        });

        // Criar indexes
        storeConfig.indexes.forEach(index => {
          objectStore.createIndex(index.name, index.keyPath, {
            unique: index.unique
          });
        });
      }
    });
  }

  /**
   * Valida acesso a uma store
   * Interface Segregation: validação separada
   */
  validateAccess(storeName) {
    if (!this.db) {
      throw new Error('IndexedDB não inicializado. Execute init() primeiro.');
    }

    if (!isValidStore(storeName)) {
      throw new Error(`Store inválida: ${storeName}`);
    }

    if (this.isAnalystStore(storeName) && !this.isAnalyst) {
      throw new Error(`Acesso negado: ${storeName} é restrita a analistas`);
    }
  }

  /**
   * Salva dados em uma store
   * Single Responsibility: apenas operação de save
   */
  async save(storeName, data) {
    this.validateAccess(storeName);

    return new Promise((resolve, reject) => {
      try {
        const tx = this.db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const request = store.put(data);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Recupera um registro por chave
   */
  async get(storeName, key) {
    this.validateAccess(storeName);

    return new Promise((resolve, reject) => {
      try {
        const tx = this.db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const request = store.get(key);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Recupera todos os registros de uma store
   * Opcionalmente filtra por index
   */
  async getAll(storeName, indexName = null, value = null) {
    this.validateAccess(storeName);

    return new Promise((resolve, reject) => {
      try {
        const tx = this.db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);

        let request;
        if (indexName && value) {
          const index = store.index(indexName);
          request = index.getAll(value);
        } else {
          request = store.getAll();
        }

        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Deleta um registro
   */
  async delete(storeName, key) {
    this.validateAccess(storeName);

    return new Promise((resolve, reject) => {
      try {
        const tx = this.db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const request = store.delete(key);

        request.onsuccess = () => resolve(true);
        request.onerror = () => reject(request.error);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Conta registros em uma store
   */
  async count(storeName, indexName = null, value = null) {
    this.validateAccess(storeName);

    return new Promise((resolve, reject) => {
      try {
        const tx = this.db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);

        let request;
        if (indexName && value) {
          const index = store.index(indexName);
          request = index.count(value);
        } else {
          request = store.count();
        }

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Limpa todos os dados de uma store
   * CUIDADO: operação destrutiva
   */
  async clear(storeName) {
    this.validateAccess(storeName);

    const confirmacao = confirm(
      `⚠️ ATENÇÃO: Deseja realmente limpar todos os dados de ${storeName}? Esta ação não pode ser desfeita.`
    );

    if (!confirmacao) {
      throw new Error('Operação cancelada pelo usuário');
    }

    return new Promise((resolve, reject) => {
      try {
        const tx = this.db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const request = store.clear();

        request.onsuccess = () => resolve(true);
        request.onerror = () => reject(request.error);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Busca registros com cursor (para grandes volumes)
   */
  async query(storeName, filter = null, limit = null) {
    this.validateAccess(storeName);

    return new Promise((resolve, reject) => {
      try {
        const tx = this.db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const request = store.openCursor();
        const results = [];
        let count = 0;

        request.onsuccess = (event) => {
          const cursor = event.target.result;

          if (cursor) {
            const record = cursor.value;

            // Aplicar filtro se fornecido
            if (!filter || filter(record)) {
              results.push(record);
              count++;
            }

            // Verificar limite
            if (limit && count >= limit) {
              resolve(results);
              return;
            }

            cursor.continue();
          } else {
            resolve(results);
          }
        };

        request.onerror = () => reject(request.error);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Fecha conexão com o banco
   */
  close() {
    if (this.db) {
      this.db.close();
      this.db = null;
      console.log('✓ IndexedDB fechado');
    }
  }

  /**
   * Retorna estatísticas do banco
   * Útil para debugging e monitoramento
   */
  async getStats() {
    const stats = {
      isAnalyst: this.isAnalyst,
      stores: {}
    };

    for (const storeConfig of Object.values(STORES)) {
      try {
        const count = await this.count(storeConfig.name);
        stats.stores[storeConfig.name] = {
          count: count,
          restricted: storeConfig.restricted || false,
          description: storeConfig.description
        };
      } catch (error) {
        stats.stores[storeConfig.name] = {
          error: error.message
        };
      }
    }

    return stats;
  }
}

// Exportar para uso global
if (typeof window !== 'undefined') {
  window.IndexedDBManager = IndexedDBManager;
}
