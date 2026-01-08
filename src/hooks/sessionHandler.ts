import fs from "node:fs";
import path from "node:path";
import { loadConfig } from "../../lib/config-loader.js";

export interface SessionRecord {
    id: string;
    purpose: "planning" | "implementation" | "review" | "general";
    changeName?: string;
    updatedAt: number;
    data: Record<string, unknown>;
}

const SESSION_FILE = "codex-sessions.json";

/**
 * Get the path to the sessions file
 */
function getSessionFilePath(): string {
    const config = loadConfig();
    const dir = path.resolve(process.cwd(), config.fusionStateDir);

    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    return path.join(dir, SESSION_FILE);
}

/**
 * Read all sessions from file
 */
function readSessions(): Record<string, SessionRecord> {
    const file = getSessionFilePath();

    if (!fs.existsSync(file)) {
        return {};
    }

    try {
        const raw = fs.readFileSync(file, "utf8");
        return JSON.parse(raw) as Record<string, SessionRecord>;
    } catch {
        return {};
    }
}

/**
 * Write sessions to file
 */
function writeSessions(data: Record<string, SessionRecord>): void {
    const file = getSessionFilePath();
    fs.writeFileSync(file, JSON.stringify(data, null, 2), "utf8");
}

/**
 * Load a session by ID
 */
export function loadSession(id: string): SessionRecord | undefined {
    const sessions = readSessions();
    return sessions[id];
}

/**
 * Save or update a session
 */
export function saveSession(record: SessionRecord): void {
    const sessions = readSessions();
    sessions[record.id] = {
        ...record,
        updatedAt: Date.now(),
    };
    writeSessions(sessions);
}

/**
 * Delete a session
 */
export function deleteSession(id: string): void {
    const sessions = readSessions();

    if (sessions[id]) {
        delete sessions[id];
        writeSessions(sessions);
    }
}

/**
 * Get sessions by purpose
 */
export function getSessionsByPurpose(purpose: SessionRecord["purpose"]): SessionRecord[] {
    const sessions = readSessions();
    return Object.values(sessions).filter((s) => s.purpose === purpose);
}

/**
 * Get sessions for a specific change
 */
export function getSessionsForChange(changeName: string): SessionRecord[] {
    const sessions = readSessions();
    return Object.values(sessions).filter((s) => s.changeName === changeName);
}

/**
 * Clean up sessions older than specified age (in milliseconds)
 */
export function cleanupOldSessions(maxAge: number = 7 * 24 * 60 * 60 * 1000): number {
    const sessions = readSessions();
    const now = Date.now();
    let cleaned = 0;

    for (const [id, session] of Object.entries(sessions)) {
        if (now - session.updatedAt > maxAge) {
            delete sessions[id];
            cleaned++;
        }
    }

    if (cleaned > 0) {
        writeSessions(sessions);
    }

    return cleaned;
}

/**
 * Create a new Codex session with tracking
 */
export function createCodexSession(
    sessionId: string,
    purpose: SessionRecord["purpose"],
    changeName?: string
): SessionRecord {
    const record: SessionRecord = {
        id: sessionId,
        purpose,
        changeName,
        updatedAt: Date.now(),
        data: {},
    };

    saveSession(record);
    return record;
}
