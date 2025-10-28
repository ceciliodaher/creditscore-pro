/* =====================================
   INDEXEDDB-RETRY.JS
   Utility para retry automático de operações IndexedDB
   NO FALLBACKS - Retry com exponential backoff
   ===================================== */

/**
 * Executa operação com retry automático (exponential backoff)
 * @param {Function} operation - Função assíncrona a ser executada
 * @param {Object} options - Opções de retry
 * @param {number} options.maxAttempts - Número máximo de tentativas (padrão: 3)
 * @param {number} options.baseDelay - Delay base em ms (padrão: 1000)
 * @param {number} options.maxDelay - Delay máximo em ms (padrão: 10000)
 * @param {string} options.operationName - Nome da operação para logs
 * @returns {Promise<any>}
 * @throws {Error} Se todas as tentativas falharem
 */
export async function retryIndexedDBOperation(operation, options = {}) {
    const {
        maxAttempts = 3,
        baseDelay = 1000,
        maxDelay = 10000,
        operationName = 'IndexedDB operation'
    } = options;

    let lastError;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            console.log(`🔄 [IndexedDB Retry] ${operationName} - Tentativa ${attempt}/${maxAttempts}`);

            const result = await operation();

            if (attempt > 1) {
                console.log(`✅ [IndexedDB Retry] ${operationName} bem-sucedido na tentativa ${attempt}`);
            }

            return result;

        } catch (error) {
            lastError = error;
            console.warn(`⚠️ [IndexedDB Retry] ${operationName} falhou na tentativa ${attempt}:`, error.message);

            // Se não é a última tentativa, aguardar antes de tentar novamente
            if (attempt < maxAttempts) {
                // Exponential backoff: 1s, 2s, 4s, 8s, ...
                const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);
                console.log(`⏳ [IndexedDB Retry] Aguardando ${delay}ms antes de tentar novamente...`);
                await sleep(delay);
            }
        }
    }

    // Todas as tentativas falharam - lançar erro explícito (NO FALLBACKS)
    const errorMessage = `${operationName} falhou após ${maxAttempts} tentativas: ${lastError.message}`;
    console.error(`❌ [IndexedDB Retry] ${errorMessage}`);
    throw new Error(errorMessage);
}

/**
 * Helper para aguardar delay
 * @param {number} ms - Milissegundos
 * @returns {Promise<void>}
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Valida se operação IndexedDB está disponível
 * @throws {Error} Se IndexedDB não está disponível
 */
export function validateIndexedDBAvailable() {
    if (!window.indexedDB) {
        throw new Error('IndexedDB não está disponível neste navegador - operação não pode ser realizada');
    }
}

console.log('✅ IndexedDB Retry Utility carregado');
