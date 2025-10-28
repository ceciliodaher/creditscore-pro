/* =====================================
   CREDITSSCORE-INDEXEDDB-SCHEMA.JS
   Schema e Helper de Acesso IndexedDB para CreditScore Pro
   - KISS: Interface simples
   - DRY: Funções reutilizáveis para todas as stores
   - SOLID: SRP (classe única para persistência)
   ===================================== */

/*
    DEPENDÊNCIA ÚNICA:
    window.ConfigLoader deve estar carregado e validado antes deste script.
*/

class CreditscoreIndexedDB {
    static DB_INSTANCE = null;

    /**
     * Abre (ou cria) o banco de dados conforme configuração.
     * Retorna uma Promise que resolve para a instância de IDBDatabase.
     */
    static async openDatabase() {
        if (CreditscoreIndexedDB.DB_INSTANCE) {
            return CreditscoreIndexedDB.DB_INSTANCE;
        }

        // Obtém configuração
        if (!window.configLoader || !window.configLoader.validated) {
            throw new Error('CreditscoreIndexedDB: ConfigLoader não validado');
        }
        const dbConfig = window.configLoader.getDatabaseConfig();

        return new Promise((resolve, reject) => {
            const request = indexedDB.open(dbConfig.name, dbConfig.version);

            request.onerror = () => reject(request.error);

            request.onsuccess = () => {
                CreditscoreIndexedDB.DB_INSTANCE = request.result;
                resolve(request.result);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                const oldVersion = event.oldVersion;
                const transaction = event.target.transaction;

                // Cria stores conforme configuração
                Object.entries(dbConfig.stores).forEach(([storeName, storeCfg]) => {
                    let store;

                    if (!db.objectStoreNames.contains(storeName)) {
                        const opts = {
                            keyPath: storeCfg.keyPath,
                            autoIncrement: !!storeCfg.autoIncrement
                        };
                        store = db.createObjectStore(storeName, opts);
                    } else {
                        store = transaction.objectStore(storeName);
                    }

                    // Adiciona índices que não existem
                    if (storeCfg.indexes) {
                        Object.entries(storeCfg.indexes).forEach(([indexName, indexCfg]) => {
                            if (!store.indexNames.contains(indexName)) {
                                store.createIndex(indexName, indexName, indexCfg);
                            }
                        });
                    }
                });

                // Migration específica v2 → v3: Adicionar empresaId aos índices
                if (oldVersion === 2 && dbConfig.version === 3) {
                    console.log('🔄 Migrando IndexedDB de v2 para v3 (adicionando índices empresaId)');

                    // autosave: adicionar índice empresaId (se não existe)
                    if (db.objectStoreNames.contains('autosave')) {
                        const autosaveStore = transaction.objectStore('autosave');
                        if (!autosaveStore.indexNames.contains('empresaId')) {
                            autosaveStore.createIndex('empresaId', 'empresaId', { unique: false });
                            console.log('✅ Índice empresaId adicionado em autosave');
                        }
                    }

                    // calculation_data: adicionar índice empresaId (se não existe)
                    if (db.objectStoreNames.contains('calculation_data')) {
                        const calcDataStore = transaction.objectStore('calculation_data');
                        if (!calcDataStore.indexNames.contains('empresaId')) {
                            calcDataStore.createIndex('empresaId', 'empresaId', { unique: false });
                            console.log('✅ Índice empresaId adicionado em calculation_data');
                        }
                    }

                    console.log('✅ Migration v2 → v3 concluída');
                }
            };
        });
    }

    /* ==============================================================
       Métodos utilitários para salvar, obter, deletar genericamente
       ============================================================== */

    static async save(storeName, data) {
        const db = await CreditscoreIndexedDB.openDatabase();
        return new Promise((resolve, reject) => {
            const tx = db.transaction([storeName], 'readwrite');
            const store = tx.objectStore(storeName);
            const req = store.put(data);
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });
    }

    static async get(storeName, key) {
        const db = await CreditscoreIndexedDB.openDatabase();
        return new Promise((resolve, reject) => {
            const tx = db.transaction([storeName], 'readonly');
            const store = tx.objectStore(storeName);
            const req = store.get(key);
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });
    }

    static async getAll(storeName, indexName = null) {
        const db = await CreditscoreIndexedDB.openDatabase();
        return new Promise((resolve, reject) => {
            const tx = db.transaction([storeName], 'readonly');
            const store = tx.objectStore(storeName);
            const source = indexName ? store.index(indexName) : store;
            const req = source.getAll();
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });
    }

    /**
     * Obtém todos os registros de uma store filtrando por um índice específico
     * @param {string} storeName - Nome da store
     * @param {string} indexName - Nome do índice
     * @param {any} indexValue - Valor do índice para filtrar
     * @returns {Promise<Array>} Array de registros que correspondem ao filtro
     */
    static async getAllByIndex(storeName, indexName, indexValue) {
        const db = await CreditscoreIndexedDB.openDatabase();
        return new Promise((resolve, reject) => {
            const tx = db.transaction([storeName], 'readonly');
            const store = tx.objectStore(storeName);
            const index = store.index(indexName);
            const req = index.getAll(indexValue);
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });
    }

    static async delete(storeName, key) {
        const db = await CreditscoreIndexedDB.openDatabase();
        return new Promise((resolve, reject) => {
            const tx = db.transaction([storeName], 'readwrite');
            const store = tx.objectStore(storeName);
            const req = store.delete(key);
            req.onsuccess = () => resolve();
            req.onerror = () => reject(req.error);
        });
    }

    static async clear(storeName) {
        const db = await CreditscoreIndexedDB.openDatabase();
        return new Promise((resolve, reject) => {
            const tx = db.transaction([storeName], 'readwrite');
            const store = tx.objectStore(storeName);
            const req = store.clear();
            req.onsuccess = () => resolve();
            req.onerror = () => reject(req.error);
        });
    }
}

// Disponibiliza globalmente
window.CreditscoreIndexedDB = CreditscoreIndexedDB;
console.log('✅ CreditscoreIndexedDB schema carregado');
