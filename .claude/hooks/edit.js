/**
 * Superpowers-Fusion TDD Edit Hook
 *
 * This hook enforces TDD based on risk tier configuration.
 * It runs before code edits to verify tests exist.
 */

export default {
    name: 'superpowers-fusion-tdd',

    // Hook into file edits
    async beforeEdit({ filePath, action }) {
        // Skip non-source files
        if (!isSourceFile(filePath)) {
            return { proceed: true };
        }

        // Check if TDD is enabled
        const config = loadConfig();
        if (!config.tddEnabled) {
            return { proceed: true };
        }

        // Determine risk tier
        const tier = determineRiskTier(filePath, config);

        // For Tier 0, always allow
        if (tier === 0) {
            return { proceed: true };
        }

        // For higher tiers, check for corresponding tests
        const hasTests = await checkTestsExist(filePath);

        if (!hasTests && tier >= 2) {
            return {
                proceed: false,
                message: `TDD Required: No tests found for ${filePath}. Risk tier: ${tier}`
            };
        }

        return { proceed: true, tier };
    }
};

function isSourceFile(path) {
    const sourceExts = ['.ts', '.tsx', '.js', '.jsx', '.py', '.go', '.rs'];
    return sourceExts.some(ext => path.endsWith(ext));
}

function loadConfig() {
    // Load from .env or default
    return {
        tddEnabled: process.env.TDD_VALIDATION_ENABLED !== 'false',
        defaultTier: parseInt(process.env.TDD_DEFAULT_TIER || '1')
    };
}

function determineRiskTier(filePath, config) {
    // Tier 0: Config, docs, tests
    if (/\.(md|json|ya?ml|config\.\w+)$/.test(filePath)) return 0;
    if (/\.(test|spec)\.(ts|tsx|js|jsx)$/.test(filePath)) return 0;

    // Tier 3: Critical paths
    if (/auth|security|payment|crypto/i.test(filePath)) return 3;

    // Default tier
    return config.defaultTier;
}

async function checkTestsExist(filePath) {
    const testPatterns = [
        filePath.replace(/\.(ts|tsx|js|jsx)$/, '.test.$1'),
        filePath.replace(/\.(ts|tsx|js|jsx)$/, '.spec.$1'),
        filePath.replace(/src\//, '__tests__/')
    ];

    const fs = await import('fs');
    return testPatterns.some(p => fs.existsSync(p));
}
