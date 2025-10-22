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

                // Cria stores conforme configuração
                Object.entries(dbConfig.stores).forEach(([storeName, storeCfg]) => {
                    if (!db.objectStoreNames.contains(storeName)) {
                        const opts = {
                            keyPath: storeCfg.keyPath,
                            autoIncrement: !!storeCfg.autoIncrement
                        };
                        const store = db.createObjectStore(storeName, opts);

                        if (storeCfg.indexes) {
                            Object.entries(storeCfg.indexes).forEach(([indexName, indexCfg]) => {
                                store.createIndex(indexName, indexName, indexCfg);
                            });
                        }
                    }
                });
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
