import type { Reporter, File as VitestFile, Task as VitestTask } from "vitest";
import fs from "node:fs";
import path from "node:path";

export interface TestResult {
    name: string;
    status: "pass" | "fail" | "skip";
    duration: number;
    error?: string;
}

export interface TestReport {
    timestamp: string;
    duration: number;
    passed: number;
    failed: number;
    skipped: number;
    tests: TestResult[];
}

/**
 * Superpowers-Fusion Vitest Reporter
 * Outputs test results to .fusion/test-results.json for TDD enforcement hooks.
 *
 * Based on tdd-guard's VitestReporter, adapted for superpowers-fusion.
 */
export default class FusionVitestReporter implements Reporter {
    private results: TestResult[] = [];
    private startTime: number = 0;
    private outputPath: string;

    constructor() {
        // Default output path
        this.outputPath = path.join(process.cwd(), ".fusion", "test-results.json");
    }

    onInit(): void {
        this.startTime = Date.now();
        this.results = [];

        // Ensure .fusion directory exists
        const fusionDir = path.dirname(this.outputPath);
        if (!fs.existsSync(fusionDir)) {
            fs.mkdirSync(fusionDir, { recursive: true });
        }
    }

    onFinished(files?: VitestFile[]): void {
        if (!files) return;

        for (const file of files) {
            this.processFile(file);
        }

        const duration = Date.now() - this.startTime;
        const passed = this.results.filter((t) => t.status === "pass").length;
        const failed = this.results.filter((t) => t.status === "fail").length;
        const skipped = this.results.filter((t) => t.status === "skip").length;

        const report: TestReport = {
            timestamp: new Date().toISOString(),
            duration,
            passed,
            failed,
            skipped,
            tests: this.results,
        };

        // Write to .fusion/test-results.json
        try {
            fs.writeFileSync(this.outputPath, JSON.stringify(report, null, 2), "utf-8");
        } catch (error) {
            console.error(`[FusionReporter] Failed to write test results: ${error}`);
        }

        // Also output summary to console
        console.log(`\n[FusionReporter] ${passed} passed, ${failed} failed, ${skipped} skipped (${duration}ms)`);
    }

    private processFile(file: VitestFile): void {
        for (const task of file.tasks) {
            this.processTask(task, file.name);
        }
    }

    private processTask(task: VitestTask, fileName: string): void {
        // Handle suite vs test
        if (task.type === "suite" && "tasks" in task) {
            for (const subtask of task.tasks) {
                this.processTask(subtask, fileName);
            }
            return;
        }

        // Handle test
        const result = task.result;
        const status =
            result?.state === "pass"
                ? "pass"
                : result?.state === "fail"
                    ? "fail"
                    : "skip";

        this.results.push({
            name: `${fileName} > ${task.name}`,
            status,
            duration: result?.duration ?? 0,
            error: result?.errors?.[0]?.message,
        });
    }
}
