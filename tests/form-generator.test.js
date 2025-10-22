/* =====================================
   FORM-GENERATOR.TEST.JS
   Testes para FormGenerator - TDD Approach
   RED -> GREEN -> REFACTOR
   ===================================== */

import { test, expect } from '@playwright/test';

// Mock config e messages para testes
const mockConfig = {
    modules: [
        {
            id: 1,
            name: 'cadastro',
            title: 'Cadastro e Identificação',
            description: 'Informações cadastrais da empresa',
            icon: '🏢',
            required: true,
            enabled: true,
            computed: false,
            order: 1
        },
        {
            id: 4,
            name: 'indices',
            title: 'Índices Financeiros',
            description: 'Cálculo automático de índices',
            icon: '📈',
            required: false,
            enabled: true,
            computed: true,
            order: 4
        }
    ],
    validationRules: {
        cnpj: {
            pattern: '^\\d{2}\\.\\d{3}\\.\\d{3}/\\d{4}-\\d{2}$',
            required: true
        },
        email: {
            pattern: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$',
            required: false
        },
        percentuais: {
            min: 0,
            max: 100,
            precision: 2
        }
    }
};

const mockMessages = {
    modules: {
        cadastro: {
            loading: 'Carregando módulo de cadastro...',
            ready: '✅ Módulo de cadastro pronto'
        },
        indices: {
            loading: 'Calculando índices financeiros...',
            ready: '✅ Índices financeiros calculados'
        }
    },
    icons: {
        loading: '🔄',
        save: '💾',
        warning: '⚠️'
    },
    buttons: {
        save: 'Salvar',
        cancel: 'Cancelar'
    }
};

test.describe('FormGenerator - TDD Tests', () => {

    test.describe('RED PHASE - Constructor Validation', () => {

        test('deve lançar erro se config não fornecida', async ({ page }) => {
            await page.goto('http://localhost:3000');

            const errorThrown = await page.evaluate(() => {
                try {
                    new window.FormGenerator();
                    return false;
                } catch (e) {
                    return e.message.includes('configuração obrigatória');
                }
            });

            expect(errorThrown).toBe(true);
        });

        test('deve lançar erro se messages não fornecidas', async ({ page }) => {
            await page.goto('http://localhost:3000');

            const errorThrown = await page.evaluate((config) => {
                try {
                    new window.FormGenerator(config);
                    return false;
                } catch (e) {
                    return e.message.includes('messages obrigatório');
                }
            }, mockConfig);

            expect(errorThrown).toBe(true);
        });

        test('deve lançar erro se config.modules não for array', async ({ page }) => {
            await page.goto('http://localhost:3000');

            const errorThrown = await page.evaluate((messages) => {
                try {
                    new window.FormGenerator({ modules: 'invalid', validationRules: {} }, messages);
                    return false;
                } catch (e) {
                    return e.message.includes('modules deve ser um array');
                }
            }, mockMessages);

            expect(errorThrown).toBe(true);
        });
    });

    test.describe('GREEN PHASE - Basic Instantiation', () => {

        test('deve instanciar com config e messages válidos', async ({ page }) => {
            await page.goto('http://localhost:3000');

            const instantiated = await page.evaluate((config, messages) => {
                try {
                    const generator = new window.FormGenerator(config, messages);
                    return generator !== null;
                } catch (e) {
                    return false;
                }
            }, mockConfig, mockMessages);

            expect(instantiated).toBe(true);
        });

        test('deve inicializar com sucesso', async ({ page }) => {
            await page.goto('http://localhost:3000');

            const initialized = await page.evaluate(async (config, messages) => {
                try {
                    const generator = new window.FormGenerator(config, messages);
                    const result = await generator.init();
                    return result === true;
                } catch (e) {
                    return false;
                }
            }, mockConfig, mockMessages);

            expect(initialized).toBe(true);
        });
    });

    test.describe('GREEN PHASE - Module HTML Generation', () => {

        test('deve gerar HTML para módulo computed', async ({ page }) => {
            await page.goto('http://localhost:3000');

            const html = await page.evaluate(async (config, messages) => {
                const generator = new window.FormGenerator(config, messages);
                await generator.init();
                return generator.generateModuleHTML(4); // indices (computed)
            }, mockConfig, mockMessages);

            expect(html).toContain('computed-module');
            expect(html).toContain('data-module="indices"');
            expect(html).toContain('📈');
            expect(html).toContain('Índices Financeiros');
        });

        test('deve gerar HTML para módulo de input', async ({ page }) => {
            await page.goto('http://localhost:3000');

            const html = await page.evaluate(async (config, messages) => {
                const generator = new window.FormGenerator(config, messages);
                await generator.init();
                return generator.generateModuleHTML(1); // cadastro (input)
            }, mockConfig, mockMessages);

            expect(html).toContain('input-module');
            expect(html).toContain('data-module="cadastro"');
            expect(html).toContain('🏢');
            expect(html).toContain('Cadastro e Identificação');
        });

        test('deve lançar erro se módulo não existir', async ({ page }) => {
            await page.goto('http://localhost:3000');

            const errorThrown = await page.evaluate(async (config, messages) => {
                try {
                    const generator = new window.FormGenerator(config, messages);
                    await generator.init();
                    generator.generateModuleHTML(999); // módulo inexistente
                    return false;
                } catch (e) {
                    return e.message.includes('não encontrado');
                }
            }, mockConfig, mockMessages);

            expect(errorThrown).toBe(true);
        });
    });

    test.describe('GREEN PHASE - Field Generation', () => {

        test('deve gerar campo de texto', async ({ page }) => {
            await page.goto('http://localhost:3000');

            const html = await page.evaluate(async (config, messages) => {
                const generator = new window.FormGenerator(config, messages);
                await generator.init();
                return generator.generateFormField({
                    type: 'text',
                    name: 'razaoSocial',
                    label: 'Razão Social',
                    required: true
                });
            }, mockConfig, mockMessages);

            expect(html).toContain('type="text"');
            expect(html).toContain('name="razaoSocial"');
            expect(html).toContain('Razão Social');
            expect(html).toContain('required');
            expect(html).toContain('required-asterisk');
        });

        test('deve gerar campo de CNPJ com validação', async ({ page }) => {
            await page.goto('http://localhost:3000');

            const html = await page.evaluate(async (config, messages) => {
                const generator = new window.FormGenerator(config, messages);
                await generator.init();
                return generator.generateFormField({
                    type: 'cnpj',
                    name: 'cnpj',
                    label: 'CNPJ',
                    required: true
                });
            }, mockConfig, mockMessages);

            expect(html).toContain('data-validation="cnpj"');
            expect(html).toContain('maxlength="18"');
            expect(html).toContain('placeholder="00.000.000/0000-00"');
        });

        test('deve gerar campo de currency', async ({ page }) => {
            await page.goto('http://localhost:3000');

            const html = await page.evaluate(async (config, messages) => {
                const generator = new window.FormGenerator(config, messages);
                await generator.init();
                return generator.generateFormField({
                    type: 'currency',
                    name: 'capitalSocial',
                    label: 'Capital Social'
                });
            }, mockConfig, mockMessages);

            expect(html).toContain('data-mask="currency"');
            expect(html).toContain('placeholder="R$ 0,00"');
        });

        test('deve gerar campo select com options', async ({ page }) => {
            await page.goto('http://localhost:3000');

            const html = await page.evaluate(async (config, messages) => {
                const generator = new window.FormGenerator(config, messages);
                await generator.init();
                return generator.generateFormField({
                    type: 'select',
                    name: 'regimeTributario',
                    label: 'Regime Tributário',
                    options: ['Simples Nacional', 'Lucro Presumido', 'Lucro Real']
                });
            }, mockConfig, mockMessages);

            expect(html).toContain('<select');
            expect(html).toContain('Simples Nacional');
            expect(html).toContain('Lucro Presumido');
            expect(html).toContain('Lucro Real');
        });

        test('deve lançar erro se fieldConfig inválido', async ({ page }) => {
            await page.goto('http://localhost:3000');

            const errorThrown = await page.evaluate(async (config, messages) => {
                try {
                    const generator = new window.FormGenerator(config, messages);
                    await generator.init();
                    generator.generateFormField(null);
                    return false;
                } catch (e) {
                    return e.message.includes('deve ser um objeto');
                }
            }, mockConfig, mockMessages);

            expect(errorThrown).toBe(true);
        });

        test('deve lançar erro se type ausente', async ({ page }) => {
            await page.goto('http://localhost:3000');

            const errorThrown = await page.evaluate(async (config, messages) => {
                try {
                    const generator = new window.FormGenerator(config, messages);
                    await generator.init();
                    generator.generateFormField({ name: 'test' });
                    return false;
                } catch (e) {
                    return e.message.includes('type é obrigatório');
                }
            }, mockConfig, mockMessages);

            expect(errorThrown).toBe(true);
        });
    });

    test.describe('GREEN PHASE - DOM Injection', () => {

        test('deve injetar HTML no container', async ({ page }) => {
            await page.goto('http://localhost:3000');

            await page.evaluate(() => {
                const container = document.createElement('div');
                container.id = 'test-container';
                document.body.appendChild(container);
            });

            const injected = await page.evaluate(async (config, messages) => {
                try {
                    const generator = new window.FormGenerator(config, messages);
                    await generator.init();
                    const html = '<div>Test HTML</div>';
                    generator.injectIntoDOM('test-container', html);

                    const container = document.getElementById('test-container');
                    return container.innerHTML === html;
                } catch (e) {
                    return false;
                }
            }, mockConfig, mockMessages);

            expect(injected).toBe(true);
        });

        test('deve lançar erro se container não existir', async ({ page }) => {
            await page.goto('http://localhost:3000');

            const errorThrown = await page.evaluate(async (config, messages) => {
                try {
                    const generator = new window.FormGenerator(config, messages);
                    await generator.init();
                    generator.injectIntoDOM('nonexistent-container', '<div>Test</div>');
                    return false;
                } catch (e) {
                    return e.message.includes('não encontrado no DOM');
                }
            }, mockConfig, mockMessages);

            expect(errorThrown).toBe(true);
        });
    });
});
