import { parse } from "@babel/parser";
import type { Node, Statement } from "@babel/types";
import { detectLanguage, type SupportedLanguage } from "./language-adapter.js";

export interface TestQualityResult {
    ok: boolean;
    errors: string[];
    warnings: string[];
}

export interface TestQualityOptions {
    rejectEmptyTests: boolean;
    rejectMissingAssertions: boolean;
    rejectTrivialAssertions: boolean;
}

// Trivial assertions to detect
const TRIVIAL_ASSERTIONS = [
    /expect\s*\(\s*true\s*\)\s*\.toBe\s*\(\s*true\s*\)/,
    /expect\s*\(\s*false\s*\)\s*\.toBe\s*\(\s*false\s*\)/,
    /expect\s*\(\s*1\s*\)\s*\.toBe\s*\(\s*1\s*\)/,
    /expect\s*\(\s*['"].*['"]\s*\)\s*\.toBe\s*\(\s*['"].*['"]\s*\)/,
    /assert\s+True\b/,
    /assert\s+False\b/,
];

// Assertion patterns by language
const ASSERTION_PATTERNS: Record<string, RegExp[]> = {
    typescript: [/expect\s*\(/, /assert\s*\(/, /\.toBe\(/, /\.toEqual\(/, /\.toThrow\(/],
    javascript: [/expect\s*\(/, /assert\s*\(/, /\.toBe\(/, /\.toEqual\(/, /\.toThrow\(/],
    python: [/assert\s/, /self\.assert/, /pytest\.raises/],
    go: [/t\.Error/, /t\.Fatal/, /require\./, /assert\./],
};

/**
 * Check test quality using AST analysis for JS/TS
 * Falls back to regex for other languages
 */
export function checkTestQuality(
    content: string,
    filePath: string,
    options: TestQualityOptions
): TestQualityResult {
    const lang = detectLanguage(filePath);

    // Use AST for TypeScript/JavaScript
    if (lang === "typescript" || lang === "javascript") {
        return checkTestQualityAST(content, options);
    }

    // Use regex for other languages
    return checkTestQualityRegex(content, lang, options);
}

/**
 * AST-based quality check for TypeScript/JavaScript
 */
function checkTestQualityAST(
    content: string,
    options: TestQualityOptions
): TestQualityResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
        const ast = parse(content, {
            sourceType: "module",
            plugins: ["typescript", "jsx"],
            errorRecovery: true,
        });

        // Find test functions (it, test, describe blocks)
        const testCalls = findTestCalls(ast.program.body);

        for (const test of testCalls) {
            // Check for empty test body
            if (options.rejectEmptyTests && isEmptyBody(test.body)) {
                errors.push(`Empty test body: "${test.name}"`);
            }

            // Check for missing assertions
            if (options.rejectMissingAssertions && !hasAssertionsInBody(test.body)) {
                errors.push(`Missing assertions in test: "${test.name}"`);
            }
        }

        // Check for trivial assertions
        if (options.rejectTrivialAssertions) {
            for (const pattern of TRIVIAL_ASSERTIONS) {
                if (pattern.test(content)) {
                    errors.push("Trivial assertion detected (e.g., expect(true).toBe(true))");
                    break;
                }
            }
        }
    } catch (parseError) {
        warnings.push(`AST parse warning: ${String(parseError)}`);
        // Fall back to regex
        return checkTestQualityRegex(content, "typescript", options);
    }

    return {
        ok: errors.length === 0,
        errors,
        warnings,
    };
}

/**
 * Regex-based quality check for non-JS languages
 */
function checkTestQualityRegex(
    content: string,
    lang: SupportedLanguage,
    options: TestQualityOptions
): TestQualityResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    const patterns = ASSERTION_PATTERNS[lang] ?? [];

    // Check for assertions
    if (options.rejectMissingAssertions && patterns.length > 0) {
        const hasAssertion = patterns.some((p) => p.test(content));
        if (!hasAssertion) {
            errors.push("No assertions found in test file");
        }
    }

    // Check trivial assertions
    if (options.rejectTrivialAssertions) {
        for (const pattern of TRIVIAL_ASSERTIONS) {
            if (pattern.test(content)) {
                errors.push("Trivial assertion detected");
                break;
            }
        }
    }

    // Simple empty check (very basic for non-JS)
    if (options.rejectEmptyTests) {
        // Check for test/it functions with just pass or empty
        if (/def\s+test_\w+\([^)]*\):\s*pass\s*$/m.test(content)) {
            errors.push("Empty test body (pass only)");
        }
    }

    return {
        ok: errors.length === 0,
        errors,
        warnings,
    };
}

// Helper types for AST traversal
interface TestCall {
    name: string;
    body: Statement[];
}

function findTestCalls(body: Statement[]): TestCall[] {
    const tests: TestCall[] = [];

    function traverse(node: Node): void {
        if (node.type === "ExpressionStatement" && node.expression.type === "CallExpression") {
            const call = node.expression;
            if (call.callee.type === "Identifier") {
                const name = call.callee.name;
                if (name === "it" || name === "test") {
                    // Get the callback body
                    const callback = call.arguments[1];
                    if (
                        callback &&
                        (callback.type === "ArrowFunctionExpression" || callback.type === "FunctionExpression")
                    ) {
                        const testName =
                            call.arguments[0]?.type === "StringLiteral" ? call.arguments[0].value : "anonymous";
                        const bodyStatements =
                            callback.body.type === "BlockStatement" ? callback.body.body : [];
                        tests.push({ name: testName, body: bodyStatements });
                    }
                }
            }
        }

        // Recurse into child nodes
        for (const key of Object.keys(node)) {
            const child = (node as Record<string, unknown>)[key];
            if (Array.isArray(child)) {
                child.forEach((c) => {
                    if (c && typeof c === "object" && "type" in c) traverse(c as Node);
                });
            } else if (child && typeof child === "object" && "type" in child) {
                traverse(child as Node);
            }
        }
    }

    body.forEach(traverse);
    return tests;
}

function isEmptyBody(statements: Statement[]): boolean {
    return (
        statements.length === 0 ||
        (statements.length === 1 && statements[0].type === "EmptyStatement")
    );
}

function hasAssertionsInBody(statements: Statement[]): boolean {
    const code = JSON.stringify(statements);
    return ASSERTION_PATTERNS.typescript.some((p) => p.test(code));
}
