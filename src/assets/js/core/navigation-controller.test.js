/**
 * NAVIGATION-CONTROLLER.TEST.JS
 * TDD Test Suite for NavigationController
 *
 * Tests:
 * 1. Constructor validation
 * 2. Module completion validation
 * 3. Navigation validation (forward/backward)
 * 4. Progress tracking
 * 5. State persistence
 */

// Mock configuration for testing
const mockConfig = {
    systemName: "CreditScore Pro Test",
    version: "1.0.0",
    totalSteps: 8,
    modules: [
        { id: 1, name: "cadastro", title: "Cadastro", required: true, enabled: true },
        { id: 2, name: "demonstracoes", title: "Demonstrações", required: true, enabled: true },
        { id: 3, name: "endividamento", title: "Endividamento", required: true, enabled: true },
        { id: 4, name: "indices", title: "Índices", required: false, computed: true, enabled: true },
        { id: 5, name: "scoring", title: "Scoring", required: false, computed: true, enabled: true },
        { id: 6, name: "compliance", title: "Compliance", required: true, enabled: true },
        { id: 7, name: "recursos-humanos", title: "RH", required: false, enabled: true },
        { id: 8, name: "relatorios", title: "Relatórios", required: false, computed: true, enabled: true }
    ],
    requiredFields: {
        "cadastro": ["razaoSocial", "cnpj", "endereco"],
        "demonstracoes": ["balanco", "dre"],
        "endividamento": ["dividasBancarias"],
        "compliance": ["situacaoCadastral"]
    },
    validationRules: {}
};

// Mock tabs.js integration
const mockTabsInstance = {
    currentTab: 1,
    switchToTab: function(tabNumber) {
        this.currentTab = tabNumber;
        console.log(`Mock: switched to tab ${tabNumber}`);
    },
    markTabAsCompleted: function(tabNumber) {
        console.log(`Mock: marked tab ${tabNumber} as completed`);
    }
};

// Test runner
class NavigationControllerTest {
    constructor() {
        this.tests = [];
        this.passed = 0;
        this.failed = 0;
    }

    test(name, fn) {
        this.tests.push({ name, fn });
    }

    async run() {
        console.log('🧪 Starting NavigationController Tests...\n');

        for (const { name, fn } of this.tests) {
            try {
                await fn();
                this.passed++;
                console.log(`✅ PASS: ${name}`);
            } catch (error) {
                this.failed++;
                console.error(`❌ FAIL: ${name}`);
                console.error(`   Error: ${error.message}`);
            }
        }

        console.log('\n' + '='.repeat(50));
        console.log(`📊 Test Results: ${this.passed} passed, ${this.failed} failed`);
        console.log('='.repeat(50));

        return this.failed === 0;
    }
}

// Assertion helpers
function assert(condition, message) {
    if (!condition) {
        throw new Error(message || 'Assertion failed');
    }
}

function assertEquals(actual, expected, message) {
    if (actual !== expected) {
        throw new Error(message || `Expected ${expected}, got ${actual}`);
    }
}

// Initialize test suite
const testSuite = new NavigationControllerTest();

// TEST 1: Constructor should validate config
testSuite.test('Constructor validates config object', () => {
    try {
        new NavigationController();
        throw new Error('Should have thrown error for missing config');
    } catch (error) {
        assert(error.message.includes('config obrigatória'), 'Should throw config error');
    }

    try {
        new NavigationController({});
        throw new Error('Should have thrown error for invalid config.modules');
    } catch (error) {
        assert(error.message.includes('config.modules'), 'Should throw modules error');
    }

    try {
        new NavigationController({ modules: [] });
        throw new Error('Should have thrown error for missing totalSteps');
    } catch (error) {
        assert(error.message.includes('config.totalSteps'), 'Should throw totalSteps error');
    }

    // Should succeed with valid config
    const controller = new NavigationController(mockConfig);
    assert(controller !== null, 'Should create instance with valid config');
});

// TEST 2: Module completion check
testSuite.test('isModuleComplete validates required fields', () => {
    const controller = new NavigationController(mockConfig, mockTabsInstance);

    // Computed modules should always be complete
    assert(controller.isModuleComplete(4), 'Computed module should be complete');
    assert(controller.isModuleComplete(5), 'Computed module should be complete');

    // Optional modules should be complete
    assert(controller.isModuleComplete(7), 'Optional module should be complete');

    // Required modules with missing fields should be incomplete
    // (no DOM fields, so should be incomplete)
    assert(!controller.isModuleComplete(1), 'Required module without fields should be incomplete');
});

// TEST 3: Backward navigation should always be allowed
testSuite.test('Backward navigation is always allowed', async () => {
    const controller = new NavigationController(mockConfig, mockTabsInstance);
    controller.currentModule = 5;

    const canNavigate = await controller.validateNavigation(5, 3);
    assert(canNavigate, 'Should allow backward navigation');
});

// TEST 4: Forward navigation validates required modules
testSuite.test('Forward navigation validates required modules', async () => {
    const controller = new NavigationController(mockConfig, mockTabsInstance);
    controller.currentModule = 1;

    // Override alert to prevent browser dialogs in tests
    const originalAlert = window.alert;
    window.alert = () => {};

    // Try to navigate forward without completing required module
    const canNavigate = await controller.validateNavigation(1, 2);

    window.alert = originalAlert;

    assert(!canNavigate, 'Should block navigation from incomplete required module');
});

// TEST 5: Mark module as complete
testSuite.test('markModuleComplete adds to completed set', () => {
    const controller = new NavigationController(mockConfig, mockTabsInstance);

    assert(controller.completedModules.size === 0, 'Should start with 0 completed');

    controller.markModuleComplete(1);
    assert(controller.completedModules.has(1), 'Should mark module 1 as complete');
    assert(controller.completedModules.size === 1, 'Should have 1 completed');

    controller.markModuleComplete(2);
    assert(controller.completedModules.size === 2, 'Should have 2 completed');
});

// TEST 6: Progress calculation
testSuite.test('getProgress returns correct statistics', () => {
    const controller = new NavigationController(mockConfig, mockTabsInstance);

    let progress = controller.getProgress();
    assertEquals(progress.completed, 0, 'Should have 0 completed initially');
    assertEquals(progress.percentage, 0, 'Should have 0% initially');

    controller.markModuleComplete(1);
    controller.markModuleComplete(2);

    progress = controller.getProgress();
    assertEquals(progress.completed, 2, 'Should have 2 completed');
    assertEquals(progress.percentage, 25, 'Should have 25% (2/8)');
});

// TEST 7: State persistence
testSuite.test('State persistence saves and restores correctly', () => {
    const controller = new NavigationController(mockConfig, mockTabsInstance);

    controller.currentModule = 3;
    controller.markModuleComplete(1);
    controller.markModuleComplete(2);

    controller.saveNavigationState();

    // Create new instance and restore
    const controller2 = new NavigationController(mockConfig, mockTabsInstance);
    const restored = controller2.restoreNavigationState();

    assert(restored, 'Should restore successfully');
    assertEquals(controller2.currentModule, 3, 'Should restore current module');
    assert(controller2.completedModules.has(1), 'Should restore completed modules');
    assert(controller2.completedModules.has(2), 'Should restore completed modules');
});

// TEST 8: Navigation with tabs integration
testSuite.test('goToModule integrates with tabs.js', async () => {
    const controller = new NavigationController(mockConfig, mockTabsInstance);
    controller.initTabsIntegration();

    // Mark module 1 as complete to allow navigation
    controller.markModuleComplete(1);

    const success = await controller.goToModule(2);
    assert(success, 'Should navigate successfully');
    assertEquals(controller.currentModule, 2, 'Should update current module');
    assertEquals(mockTabsInstance.currentTab, 2, 'Should update tabs instance');
});

// TEST 9: Next/Previous navigation
testSuite.test('next() and previous() navigate correctly', async () => {
    const controller = new NavigationController(mockConfig, mockTabsInstance);
    controller.initTabsIntegration();

    // Mark modules as complete to allow navigation
    controller.markModuleComplete(1);
    controller.markModuleComplete(2);

    await controller.next();
    assertEquals(controller.currentModule, 2, 'Should move to next module');

    await controller.previous();
    assertEquals(controller.currentModule, 1, 'Should move to previous module');
});

// TEST 10: Module helpers return correct data
testSuite.test('Module helper methods return correct data', () => {
    const controller = new NavigationController(mockConfig, mockTabsInstance);

    const config = controller.getModuleConfig(1);
    assert(config !== null, 'Should return config for valid module');
    assertEquals(config.name, 'cadastro', 'Should return correct module config');

    const name = controller.getModuleName(1);
    assertEquals(name, 'cadastro', 'Should return correct module name');

    const title = controller.getModuleTitle(1);
    assertEquals(title, 'Cadastro', 'Should return correct module title');
});

// Run tests if in Node.js environment or when explicitly called
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { NavigationControllerTest, testSuite };
} else if (typeof window !== 'undefined') {
    window.NavigationControllerTest = testSuite;

    // Auto-run tests if NavigationController is loaded
    if (typeof NavigationController !== 'undefined') {
        console.log('🚀 Auto-running NavigationController tests...\n');
        testSuite.run().then(success => {
            if (success) {
                console.log('\n✅ All tests passed!');
            } else {
                console.log('\n❌ Some tests failed!');
            }
        });
    }
}
