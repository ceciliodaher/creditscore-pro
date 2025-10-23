import { test, expect } from '@playwright/test';

test.describe('Debug: Tab Visibility Issue', () => {
    test.beforeEach(async ({ page }) => {
        // Capturar console logs
        page.on('console', msg => console.log(`BROWSER: ${msg.text()}`));
        await page.goto('http://localhost:3002/src/pages/analise-credito.html');
        await page.waitForLoadState('networkidle');
    });

    test('investigate section visibility', async ({ page }) => {
        // 1. Screenshot inicial
        await page.screenshot({ 
            path: 'test-results/debug-tabs/01-initial-state.png',
            fullPage: true 
        });

        // 2. Contar seções
        const sectionCount = await page.locator('.form-section').count();
        console.log(`\n📊 Total de seções: ${sectionCount}`);

        // 3. Inspecionar cada seção
        for (let i = 0; i < sectionCount; i++) {
            const section = page.locator('.form-section').nth(i);
            const module = await section.getAttribute('data-module');
            const classes = await section.getAttribute('class');
            const computedDisplay = await section.evaluate(el => 
                window.getComputedStyle(el).display
            );
            const inlineDisplay = await section.evaluate(el => el.style.display);
            const isVisible = await section.isVisible();
            const height = await section.evaluate(el => el.offsetHeight);

            console.log(`\n📋 Seção ${i + 1}: ${module}`);
            console.log(`   Classes: ${classes}`);
            console.log(`   Computed Display: ${computedDisplay}`);
            console.log(`   Inline Display: ${inlineDisplay || '(nenhum)'}`);
            console.log(`   isVisible(): ${isVisible}`);
            console.log(`   offsetHeight: ${height}px`);
        }

        // 4. Clicar na segunda tab
        console.log('\n🖱️  Clicando na segunda tab...');
        await page.locator('.tab-item[data-tab="2"]').click();
        await page.waitForTimeout(500);

        // 5. Screenshot após click
        await page.screenshot({ 
            path: 'test-results/debug-tabs/02-after-click.png',
            fullPage: true 
        });

        // 6. Re-inspecionar seções
        console.log('\n📊 Estado após click na tab 2:');
        for (let i = 0; i < sectionCount; i++) {
            const section = page.locator('.form-section').nth(i);
            const module = await section.getAttribute('data-module');
            const isVisible = await section.isVisible();
            const display = await section.evaluate(el => 
                window.getComputedStyle(el).display
            );
            console.log(`   ${module}: visible=${isVisible}, display=${display}`);
        }

        // 7. Verificar CSS conflicts
        console.log('\n🔍 Verificando conflitos CSS...');
        const cssConflicts = await page.evaluate(() => {
            const section = document.querySelector('.form-section');
            const styles = window.getComputedStyle(section);
            const sheets = Array.from(document.styleSheets);
            
            return {
                computedDisplay: styles.display,
                computedOpacity: styles.opacity,
                appliedRules: sheets.map(sheet => {
                    try {
                        const rules = Array.from(sheet.cssRules || []);
                        return rules
                            .filter(rule => rule.selectorText?.includes('.form-section'))
                            .map(rule => ({
                                selector: rule.selectorText,
                                display: rule.style.display,
                                opacity: rule.style.opacity,
                                href: sheet.href
                            }));
                    } catch (e) {
                        return [];
                    }
                }).flat()
            };
        });
        
        console.log('CSS Rules aplicadas:', JSON.stringify(cssConflicts, null, 2));
    });
});
