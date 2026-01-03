/**
 * Tests for Workflow Middleware
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import fs from "fs/promises";

// Mock fs/promises
vi.mock("fs/promises", () => ({
    default: {
        readFile: vi.fn(),
        writeFile: vi.fn(),
        mkdir: vi.fn(),
    },
}));

import {
    WorkflowMiddleware,
    getWorkflowConfig,
    phaseFromCommand,
} from "../lib/workflow-middleware.js";

describe("WorkflowMiddleware", () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    afterEach(() => {
        vi.resetAllMocks();
    });

    describe("getCurrentPhase", () => {
        it("should return 'unknown' when no state file exists", async () => {
            vi.mocked(fs.readFile).mockRejectedValue(new Error("ENOENT"));

            const middleware = new WorkflowMiddleware();
            const phase = await middleware.getCurrentPhase();

            expect(phase).toBe("unknown");
        });

        it("should return stored phase from state file", async () => {
            vi.mocked(fs.readFile).mockResolvedValue(
                JSON.stringify({
                    currentPhase: "implement",
                    startedAt: "2024-01-01T00:00:00Z",
                    changedAt: "2024-01-01T00:00:00Z",
                })
            );

            const middleware = new WorkflowMiddleware();
            const phase = await middleware.getCurrentPhase();

            expect(phase).toBe("implement");
        });
    });

    describe("setPhase", () => {
        it("should persist new phase to state file", async () => {
            vi.mocked(fs.readFile).mockRejectedValue(new Error("ENOENT"));
            vi.mocked(fs.mkdir).mockResolvedValue(undefined);
            vi.mocked(fs.writeFile).mockResolvedValue(undefined);

            const middleware = new WorkflowMiddleware();
            await middleware.setPhase("executing-plans");

            expect(fs.writeFile).toHaveBeenCalledWith(
                expect.stringContaining("workflow-state.json"),
                expect.stringContaining('"currentPhase": "executing-plans"'),
                "utf-8"
            );
        });
    });

    describe("shouldEnforceTdd", () => {
        it("should return true for 'implement' phase", async () => {
            vi.mocked(fs.readFile).mockResolvedValue(
                JSON.stringify({ currentPhase: "implement" })
            );

            const middleware = new WorkflowMiddleware();
            const enforce = await middleware.shouldEnforceTdd();

            expect(enforce).toBe(true);
        });

        it("should return false for 'brainstorming' phase", async () => {
            vi.mocked(fs.readFile).mockResolvedValue(
                JSON.stringify({ currentPhase: "brainstorming" })
            );

            const middleware = new WorkflowMiddleware();
            const enforce = await middleware.shouldEnforceTdd();

            expect(enforce).toBe(false);
        });
    });

    describe("shouldBlockOnFailure", () => {
        it("should return true for 'executing-plans' phase", async () => {
            vi.mocked(fs.readFile).mockResolvedValue(
                JSON.stringify({ currentPhase: "executing-plans" })
            );

            const middleware = new WorkflowMiddleware();
            const block = await middleware.shouldBlockOnFailure();

            expect(block).toBe(true);
        });

        it("should return false for 'verification' phase", async () => {
            vi.mocked(fs.readFile).mockResolvedValue(
                JSON.stringify({ currentPhase: "verification" })
            );

            const middleware = new WorkflowMiddleware();
            const block = await middleware.shouldBlockOnFailure();

            expect(block).toBe(false);
        });
    });
});

describe("getWorkflowConfig", () => {
    it("should return correct config for 'implement' phase", () => {
        const config = getWorkflowConfig("implement");

        expect(config.tddRequired).toBe(true);
        expect(config.blockOnFailure).toBe(true);
        expect(config.minEnforceTier).toBe(2);
    });

    it("should return correct config for 'brainstorming' phase", () => {
        const config = getWorkflowConfig("brainstorming");

        expect(config.tddRequired).toBe(false);
        expect(config.blockOnFailure).toBe(false);
        expect(config.minEnforceTier).toBe(4);
    });
});

describe("phaseFromCommand", () => {
    it("should detect 'implement' from command", () => {
        expect(phaseFromCommand("/implement")).toBe("implement");
        expect(phaseFromCommand("implement task")).toBe("implement");
    });

    it("should detect 'brainstorming' from command", () => {
        expect(phaseFromCommand("/brainstorm")).toBe("brainstorming");
    });

    it("should detect 'executing-plans' from command", () => {
        expect(phaseFromCommand("/execute-plan")).toBe("executing-plans");
    });

    it("should detect 'subagent-driven-development'", () => {
        expect(phaseFromCommand("/subagent-dev")).toBe("subagent-driven-development");
    });

    it("should return 'unknown' for unrecognized commands", () => {
        expect(phaseFromCommand("random command")).toBe("unknown");
    });
});
