/**
 * Workflow Middleware - Track workflow phases for TDD enforcement
 *
 * Determines which workflow phase is currently active and adjusts TDD
 * enforcement accordingly. Some phases (like brainstorming) disable TDD,
 * while others (like implement) require strict enforcement.
 */

import path from "path";
import fs from "fs/promises";

/** Workflow phases and their TDD requirements */
export type WorkflowPhase =
    | "brainstorming"
    | "writing-plans"
    | "implement"
    | "executing-plans"
    | "subagent-driven-development"
    | "dispatching-parallel-agents"
    | "systematic-debugging"
    | "verification"
    | "finishing-branch"
    | "archive"
    | "unknown";

export interface WorkflowConfig {
    /** Whether TDD is required in this phase */
    tddRequired: boolean;
    /** Whether to block on failures or just log */
    blockOnFailure: boolean;
    /** Minimum tier for enforcement (0-3) */
    minEnforceTier: number;
}

/** Default TDD configuration per workflow phase */
const WORKFLOW_TDD_CONFIG: Record<WorkflowPhase, WorkflowConfig> = {
    // Planning phases - no TDD enforcement
    brainstorming: { tddRequired: false, blockOnFailure: false, minEnforceTier: 4 },
    "writing-plans": { tddRequired: false, blockOnFailure: false, minEnforceTier: 4 },

    // Implementation phases - strict TDD enforcement
    implement: { tddRequired: true, blockOnFailure: true, minEnforceTier: 2 },
    "executing-plans": { tddRequired: true, blockOnFailure: true, minEnforceTier: 2 },
    "subagent-driven-development": { tddRequired: true, blockOnFailure: true, minEnforceTier: 2 },
    "dispatching-parallel-agents": { tddRequired: true, blockOnFailure: true, minEnforceTier: 2 },
    "systematic-debugging": { tddRequired: true, blockOnFailure: true, minEnforceTier: 2 },

    // Verification phases - check but don't block
    verification: { tddRequired: false, blockOnFailure: false, minEnforceTier: 2 },
    "finishing-branch": { tddRequired: false, blockOnFailure: false, minEnforceTier: 2 },

    // Archive - just record
    archive: { tddRequired: false, blockOnFailure: false, minEnforceTier: 4 },

    // Unknown - default behavior
    unknown: { tddRequired: true, blockOnFailure: true, minEnforceTier: 2 },
};

/** State file for tracking current workflow */
const WORKFLOW_STATE_FILE = "workflow-state.json";

interface WorkflowState {
    currentPhase: WorkflowPhase;
    startedAt: string;
    changedAt: string;
}

/**
 * WorkflowMiddleware - Track and query current workflow phase
 */
export class WorkflowMiddleware {
    private readonly stateDir: string;
    private readonly statePath: string;

    constructor(stateDir = ".fusion") {
        this.stateDir = path.resolve(stateDir);
        this.statePath = path.join(this.stateDir, WORKFLOW_STATE_FILE);
    }

    /**
     * Get current workflow phase
     */
    async getCurrentPhase(): Promise<WorkflowPhase> {
        const state = await this.readState();
        return state?.currentPhase ?? "unknown";
    }

    /**
     * Set current workflow phase
     */
    async setPhase(phase: WorkflowPhase): Promise<void> {
        const now = new Date().toISOString();
        const current = await this.readState();

        const state: WorkflowState = {
            currentPhase: phase,
            startedAt: current?.startedAt ?? now,
            changedAt: now,
        };

        await fs.mkdir(this.stateDir, { recursive: true });
        await fs.writeFile(this.statePath, JSON.stringify(state, null, 2), "utf-8");
        console.log(`[WorkflowMiddleware] Phase set to: ${phase}`);
    }

    /**
     * Get TDD configuration for current phase
     */
    async getTddConfig(): Promise<WorkflowConfig> {
        const phase = await this.getCurrentPhase();
        return WORKFLOW_TDD_CONFIG[phase];
    }

    /**
     * Check if TDD should be enforced for current phase
     */
    async shouldEnforceTdd(): Promise<boolean> {
        const config = await this.getTddConfig();
        return config.tddRequired;
    }

    /**
     * Check if failures should block in current phase
     */
    async shouldBlockOnFailure(): Promise<boolean> {
        const config = await this.getTddConfig();
        return config.blockOnFailure;
    }

    /**
     * Get minimum enforcement tier for current phase
     */
    async getMinEnforceTier(): Promise<number> {
        const config = await this.getTddConfig();
        return config.minEnforceTier;
    }

    // --- Private helpers ---

    private async readState(): Promise<WorkflowState | null> {
        try {
            const content = await fs.readFile(this.statePath, "utf-8");
            return JSON.parse(content);
        } catch {
            return null;
        }
    }
}

/**
 * Get workflow config for a specific phase
 */
export function getWorkflowConfig(phase: WorkflowPhase): WorkflowConfig {
    return WORKFLOW_TDD_CONFIG[phase];
}

/**
 * Determine workflow phase from command name
 */
export function phaseFromCommand(command: string): WorkflowPhase {
    const normalized = command.toLowerCase().replace(/[^a-z-]/g, "");

    if (normalized.includes("brainstorm")) return "brainstorming";
    if (normalized.includes("plan") && !normalized.includes("execute")) return "writing-plans";
    if (normalized.includes("implement")) return "implement";
    if (normalized.includes("execute") && normalized.includes("plan")) return "executing-plans";
    if (normalized.includes("subagent")) return "subagent-driven-development";
    if (normalized.includes("parallel")) return "dispatching-parallel-agents";
    if (normalized.includes("debug")) return "systematic-debugging";
    if (normalized.includes("verif")) return "verification";
    if (normalized.includes("finish")) return "finishing-branch";
    if (normalized.includes("archive")) return "archive";

    return "unknown";
}
