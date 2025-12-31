import {
    saveSession,
    loadSession,
    deleteSession,
    getSessionsByPurpose,
    type SessionRecord,
} from "../hooks/sessionHandler.js";

export type CodexPurpose = "planning" | "implementation" | "review" | "general";

export interface CodexCallParams {
    prompt: string;
    workingDir: string;
    sessionId?: string;
    sandbox?: "read-only" | "workspace-write" | "danger-full-access";
    returnAllMessages?: boolean;
}

export interface CodexCallResult {
    success: boolean;
    sessionId?: string;
    response?: string;
    error?: string;
}

/**
 * Get or create a Codex session for a specific purpose
 */
export function getOrCreateSession(
    changeName: string,
    purpose: CodexPurpose
): string | undefined {
    const key = `${changeName}-${purpose}`;
    const existing = loadSession(key);

    if (existing) {
        return existing.id;
    }

    return undefined; // Will be created on first call
}

/**
 * Record a new Codex session
 */
export function recordSession(
    sessionId: string,
    changeName: string,
    purpose: CodexPurpose
): void {
    const record: SessionRecord = {
        id: sessionId,
        purpose,
        changeName,
        updatedAt: Date.now(),
        data: {},
    };

    saveSession(record);
}

/**
 * Build prompt for requirements analysis
 */
export function buildAnalysisPrompt(requirements: string): string {
    return `请分析以下需求，识别边界情况和潜在风险:

${requirements}

请提供:
1. 需求理解确认
2. 边界情况列表
3. 潜在风险
4. 建议的改进`;
}

/**
 * Build prompt for code prototype
 */
export function buildPrototypePrompt(
    taskId: string,
    specification: string
): string {
    return `为 Task ${taskId} 生成 unified diff patch:

规格:
${specification}

要求:
1. 仅输出 unified diff patch
2. 不实际修改任何文件
3. 代码应该是生产级质量
4. 包含必要的错误处理`;
}

/**
 * Build prompt for code review
 */
export function buildReviewPrompt(diff: string, context?: string): string {
    return `请审查以下代码改动:

${context ? `上下文: ${context}\n\n` : ""}变更:
\`\`\`diff
${diff}
\`\`\`

请检查:
1. 逻辑正确性
2. 潜在 bug
3. 边界情况处理
4. 与需求的匹配度`;
}

/**
 * Clean up sessions for a completed change
 */
export function cleanupSessionsForChange(changeName: string): number {
    const purposes: CodexPurpose[] = ["planning", "implementation", "review", "general"];
    let cleaned = 0;

    for (const purpose of purposes) {
        const key = `${changeName}-${purpose}`;
        const session = loadSession(key);
        if (session) {
            deleteSession(key);
            cleaned++;
        }
    }

    return cleaned;
}

/**
 * Get all active sessions summary
 */
export function getActiveSessionsSummary(): {
    planning: number;
    implementation: number;
    review: number;
    general: number;
} {
    return {
        planning: getSessionsByPurpose("planning").length,
        implementation: getSessionsByPurpose("implementation").length,
        review: getSessionsByPurpose("review").length,
        general: getSessionsByPurpose("general").length,
    };
}
