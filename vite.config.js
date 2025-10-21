import { defineConfig } from 'vite';
import { resolve } from 'path';
import legacy from '@vitejs/plugin-legacy';

/**
 * Configuração Vite para Portal Expertzy
 * Multi-page application com 5 entry points
 *
 * PRINCÍPIOS:
 * - NO HARDCODED DATA: Paths configuráveis
 * - Code Splitting: Otimização automática
 * - Module Aliases: Imports limpos
 */

export default defineConfig({
  // Diretório raiz do projeto
  root: '.',

  // Diretório público para assets estáticos
  publicDir: 'public',

  // Configuração de build
  build: {
    outDir: 'dist',
    assetsDir: 'assets',

    // Source maps para debugging
    sourcemap: true,

    // Rollup options para multi-page
    rollupOptions: {
      input: {
        // Portal principal
        main: resolve(__dirname, 'index.html'),

        // Formulários de incentivos fiscais
        cei: resolve(__dirname, 'src/pages/formulario-cei.html'),
        progoias: resolve(__dirname, 'src/pages/formulario-progoias.html'),

        // Novos módulos (serão criados)
        financiamento: resolve(__dirname, 'src/pages/formulario-financiamento.html'),
        inovacao: resolve(__dirname, 'src/pages/formulario-inovacao.html'),

        // Questionário de mapeamento
        questionario: resolve(__dirname, 'src/pages/questionario-mapeamento.html'),

        // Seletor de programas
        selector: resolve(__dirname, 'src/pages/selector.html')
      },

      // Configuração de code splitting
      output: {
        // Separar vendors (libraries de terceiros)
        manualChunks: {
          'vendor-charts': ['chart.js'],
          'vendor-pdf': ['jspdf'],
          'vendor-excel': ['xlsx'],
        },

        // Naming patterns
        chunkFileNames: 'js/[name]-[hash].js',
        entryFileNames: 'js/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    },

    // Otimizações
    minify: 'esbuild',
    target: 'es2015',

    // Chunk size warnings
    chunkSizeWarningLimit: 1000
  },

  // Configuração de resolve
  resolve: {
    // Module aliases para imports limpos
    // Exemplo: import { validate } from '@core/validation'
    alias: {
      '@core': resolve(__dirname, 'src/assets/js/core'),
      '@database': resolve(__dirname, 'src/assets/js/database'),
      '@shared': resolve(__dirname, 'src/assets/js/shared'),
      '@utils': resolve(__dirname, 'src/assets/js/utils'),
      '@components': resolve(__dirname, 'src/assets/js/components'),
      '@calculators': resolve(__dirname, 'src/assets/js/calculators'),
      '@services': resolve(__dirname, 'src/assets/js/services'),
      '@config': resolve(__dirname, 'config'),
      '@css': resolve(__dirname, 'src/assets/css'),
      '@images': resolve(__dirname, 'src/assets/images')
    },

    // Extensões para resolver automaticamente
    extensions: ['.js', '.json', '.mjs']
  },

  // Plugins
  plugins: [
    // Suporte para navegadores legacy (IE11, etc.)
    legacy({
      targets: ['defaults', 'not IE 11'],
      additionalLegacyPolyfills: ['regenerator-runtime/runtime']
    })
  ],

  // Configuração do servidor de desenvolvimento
  server: {
    port: 3000,
    strictPort: false,
    open: '/index.html',

    // CORS para desenvolvimento
    cors: true,

    // HMR (Hot Module Replacement)
    hmr: {
      overlay: true
    },

    // Watch options
    watch: {
      // Não assistir node_modules
      ignored: ['**/node_modules/**', '**/dist/**']
    }
  },

  // Configuração de preview (build preview)
  preview: {
    port: 4173,
    strictPort: false,
    open: true
  },

  // Otimizações de dependências
  optimizeDeps: {
    include: [
      // Pre-bundle common dependencies
      'chart.js'
    ],
    exclude: [
      // Não pre-bundle módulos internos
    ]
  },

  // Variáveis de ambiente
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0'),
    __BUILD_DATE__: JSON.stringify(new Date().toISOString())
  },

  // Log level
  logLevel: 'info',

  // Clear screen on rebuild
  clearScreen: true
});
