/**
 * Task Parser
 *
 * Parses tasks.md files and extracts parallel group markers.
 * Supports `<!-- parallel: groupId -->` annotations for parallel task execution.
 */
import fs from "node:fs";

// ============================================================================
// Types
// ============================================================================

export interface ParsedTask {
    /** Task ID (e.g., "1.1", "2.3.4") */
    id: string;
    /** Task title/description */
    title: string;
    /** Whether the task is completed */
    completed: boolean;
    /** Whether the task is in progress */
    inProgress: boolean;
    /** Parallel group ID if marked for parallel execution */
    parallelGroup?: string;
    /** Raw task line for debugging */
    raw: string;
}

export interface ParallelGroup {
    id: string;
    tasks: ParsedTask[];
}

export interface ParsedTasksResult {
    tasks: ParsedTask[];
    parallelGroups: ParallelGroup[];
}

// ============================================================================
// Patterns
// ============================================================================

const TASK_LINE_PATTERN = /^\s*-\s\[( |x|X|\/)\]\s*(.+)$/;
const TASK_ID_PATTERN = /^(\d+(?:\.\d+)*)(?:\s*[-:：]\s*)?(.*)$/;
export const PARALLEL_MARKER = /<!--\s*parallel:\s*([a-zA-Z0-9._-]+)\s*-->/i;

// ============================================================================
// Public API
// ============================================================================

/**
 * Parse a tasks.md file from disk.
 */
export function parseTasksFile(tasksPath: string): ParsedTasksResult {
    if (!fs.existsSync(tasksPath)) {
        return { tasks: [], parallelGroups: [] };
    }

    const content = fs.readFileSync(tasksPath, "utf8");
    return parseTasks(content);
}

/**
 * Parse tasks.md content and extract parallel group mappings.
 *
 * Markers can be:
 * - Inline with a task: `- [ ] 1.1 Do something <!-- parallel: groupA -->`
 * - On the line before: `<!-- parallel: groupA -->\n- [ ] 1.1 Do something`
 */
export function parseTasks(content: string): ParsedTasksResult {
    const lines = content.split(/\r?\n/);
    const tasks: ParsedTask[] = [];
    const groups = new Map<string, ParallelGroup>();

    let pendingGroup: string | null = null;

    for (const line of lines) {
        // Check for parallel marker (can be standalone or inline)
        const marker = extractParallelMarker(line);
        const taskMatch = line.match(TASK_LINE_PATTERN);

        if (!taskMatch) {
            // Not a task line - check if it's a standalone parallel marker
            if (marker) {
                pendingGroup = marker;
            }
            continue;
        }

        // Parse task
        const statusChar = taskMatch[1];
        const completed = statusChar.toLowerCase() === "x";
        const inProgress = statusChar === "/";
        const rawContent = taskMatch[2].trim();

        // Extract ID and title
        const idMatch = rawContent.match(TASK_ID_PATTERN);
        const id = idMatch ? idMatch[1] : generateId(tasks.length);
        const title = idMatch
            ? idMatch[2].replace(PARALLEL_MARKER, "").trim()
            : rawContent.replace(PARALLEL_MARKER, "").trim();

        // Determine parallel group (inline marker takes precedence)
        const inlineMarker = extractParallelMarker(rawContent);
        const parallelGroup = inlineMarker ?? pendingGroup ?? undefined;

        const task: ParsedTask = {
            id,
            title,
            completed,
            inProgress,
            parallelGroup,
            raw: line,
        };

        tasks.push(task);

        // Add to parallel group if applicable
        if (parallelGroup) {
            if (!groups.has(parallelGroup)) {
                groups.set(parallelGroup, { id: parallelGroup, tasks: [] });
            }
            groups.get(parallelGroup)!.tasks.push(task);
        }

        // Clear pending group after use
        pendingGroup = null;
    }

    return {
        tasks,
        parallelGroups: Array.from(groups.values()),
    };
}

/**
 * Get tasks that are ready for parallel execution (not completed, not in progress).
 */
export function getParallelReadyTasks(result: ParsedTasksResult): ParsedTask[] {
    return result.tasks.filter(
        (task) => task.parallelGroup && !task.completed && !task.inProgress
    );
}

// ============================================================================
// Internal Helpers
// ============================================================================

function extractParallelMarker(text: string): string | null {
    const match = text.match(PARALLEL_MARKER);
    return match ? match[1] : null;
}

function generateId(index: number): string {
    return `task-${index + 1}`;
}
