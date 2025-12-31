export type SupportedLanguage = "typescript" | "javascript" | "python" | "go" | "rust" | "unknown";

export interface TestFilePattern {
    extension: string[];
    testPatterns: RegExp[];
    assertionPatterns: RegExp[];
}

const LANGUAGE_PATTERNS: Record<SupportedLanguage, TestFilePattern> = {
    typescript: {
        extension: [".ts", ".tsx"],
        testPatterns: [/\.test\.tsx?$/, /\.spec\.tsx?$/, /__tests__\/.+\.tsx?$/],
        assertionPatterns: [/expect\s*\(/, /assert\s*\(/, /\.toBe\(/, /\.toEqual\(/],
    },
    javascript: {
        extension: [".js", ".jsx", ".mjs", ".cjs"],
        testPatterns: [/\.test\.jsx?$/, /\.spec\.jsx?$/, /__tests__\/.+\.jsx?$/],
        assertionPatterns: [/expect\s*\(/, /assert\s*\(/, /\.toBe\(/, /\.toEqual\(/],
    },
    python: {
        extension: [".py"],
        testPatterns: [/^test_.+\.py$/, /_test\.py$/, /tests\/.+\.py$/],
        assertionPatterns: [/assert /, /self\.assert/, /pytest\.raises/],
    },
    go: {
        extension: [".go"],
        testPatterns: [/_test\.go$/],
        assertionPatterns: [
            /t\.Error/, /t\.Errorf/, /t\.Fatal/, /t\.Fatalf/,
            /require\./, /assert\./, /is\./,
        ],
    },
    rust: {
        extension: [".rs"],
        testPatterns: [/#\[cfg\(test\)\]/, /#\[test\]/],
        assertionPatterns: [/assert!/, /assert_eq!/, /assert_ne!/, /panic!/],
    },
    unknown: {
        extension: [],
        testPatterns: [],
        assertionPatterns: [],
    },
};

/**
 * Detect language from file path
 */
export function detectLanguage(filePath: string): SupportedLanguage {
    const lower = filePath.toLowerCase();

    for (const [lang, patterns] of Object.entries(LANGUAGE_PATTERNS)) {
        if (lang === "unknown") continue;
        if (patterns.extension.some((ext) => lower.endsWith(ext))) {
            return lang as SupportedLanguage;
        }
    }

    return "unknown";
}

/**
 * Check if file is a test file
 */
export function isTestFile(filePath: string, language?: SupportedLanguage): boolean {
    const lang = language ?? detectLanguage(filePath);
    const patterns = LANGUAGE_PATTERNS[lang];

    if (!patterns || patterns.testPatterns.length === 0) {
        return false;
    }

    // Check file path against test patterns
    const fileName = filePath.split(/[/\\]/).pop() ?? "";
    return patterns.testPatterns.some((p) => p.test(fileName) || p.test(filePath));
}

/**
 * Get assertion patterns for a language
 */
export function getAssertionPatterns(language: SupportedLanguage): RegExp[] {
    return LANGUAGE_PATTERNS[language]?.assertionPatterns ?? [];
}

/**
 * Check if content contains assertions
 */
export function hasAssertions(content: string, language: SupportedLanguage): boolean {
    const patterns = getAssertionPatterns(language);
    return patterns.some((p) => p.test(content));
}
