/**
 * Superpowers Fusion - Main Entry Point
 *
 * Exports all hooks, commands, and utilities for Claude Code plugin integration.
 */

// Hooks
export { preToolEdit, hasExemptionComment } from "./src/hooks/preToolEdit.js";
export { postToolEdit, recordTaskCompletion } from "./src/hooks/postToolEdit.js";
export {
    loadSession,
    saveSession,
    deleteSession,
    getSessionsByPurpose,
    createCodexSession,
    cleanupOldSessions,
    type SessionRecord,
} from "./src/hooks/sessionHandler.js";

// Configuration
export {
    loadConfig,
    hasApiKey,
    type Provider,
    type ProviderConfig,
    type TddConfig,
    type RuntimeConfig,
} from "./lib/config-loader.js";

// Risk Validation
export {
    determineRiskTier,
    shouldBlockEdit,
    type RiskTier,
    type RiskTierResult,
} from "./lib/risk-validator.js";

// Language Support
export {
    detectLanguage,
    isTestFile,
    getAssertionPatterns,
    hasAssertions,
    type SupportedLanguage,
} from "./lib/language-adapter.js";

// Test Quality
export {
    checkTestQuality,
    type TestQualityResult,
    type TestQualityOptions,
} from "./lib/test-quality-checker.js";

// API Client
export { validateWithAI, type ValidationRequest, type ValidationResult } from "./lib/api-client.js";

// Archive Management
export {
    archiveChange,
    listArchivedChanges,
    loadArchiveMetadata,
    type ArchiveMetadata,
    type PhaseMetadata,
    type TaskMetadata,
    type CommitInfo,
} from "./lib/archive-manager.js";

// Revert Handling
export {
    revertChange,
    checkGhostCommits,
    type RevertLevel,
    type RevertResult,
} from "./lib/revert-handler.js";

// Task Status Tracking
export {
    loadStatus,
    saveStatus,
    initializeStatus,
    startTask,
    completeTask,
    recordCodexSession,
    getCodexSession,
    allTasksComplete,
    resetStatus,
    type TaskStatus,
    type StatusData,
} from "./lib/task-status-tracker.js";

// Codex Session Management
export {
    getOrCreateSession,
    recordSession,
    buildAnalysisPrompt,
    buildPrototypePrompt,
    buildReviewPrompt,
    cleanupSessionsForChange,
    getActiveSessionsSummary,
    type CodexPurpose,
    type CodexCallParams,
    type CodexCallResult,
} from "./lib/codex-session.js";
