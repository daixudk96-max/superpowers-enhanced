/**
 * TDD Toggle CLI Command - Control TDD guard at runtime
 *
 * Provides CLI interface for enabling/disabling TDD enforcement.
 * Usage: superpowers-fusion tdd-toggle on|off|status
 */

import { GuardManager } from "../../lib/guard-manager.js";

export async function tddToggleCommand(args: string[]): Promise<void> {
    const action = args[0]?.toLowerCase();
    const guard = new GuardManager();

    switch (action) {
        case "on":
        case "enable":
            await guard.enable();
            console.log("✅ TDD Guard enabled");
            console.log("   Test-first development is now enforced.");
            break;

        case "off":
        case "disable":
            await guard.disable();
            console.log("⚠️  TDD Guard disabled");
            console.log("   Warning: Edits will not require tests.");
            break;

        case "status":
        case undefined:
            const enabled = await guard.isEnabled();
            console.log(`TDD Guard: ${enabled ? "✅ ENABLED" : "⚠️  DISABLED"}`);
            break;

        case "toggle":
            const newState = await guard.toggle();
            console.log(`TDD Guard: ${newState ? "✅ ENABLED" : "⚠️  DISABLED"}`);
            break;

        default:
            console.log("Usage: superpowers-fusion tdd-toggle [on|off|status|toggle]");
            console.log("");
            console.log("Commands:");
            console.log("  on, enable   Enable TDD enforcement");
            console.log("  off, disable Disable TDD enforcement");
            console.log("  status       Show current TDD status (default)");
            console.log("  toggle       Toggle TDD state");
            process.exit(1);
    }
}

// CLI handler
const isCLI = import.meta.url === `file://${process.argv[1]}` ||
    process.argv[1]?.endsWith("tdd-toggle.ts") ||
    process.argv[1]?.endsWith("tdd-toggle.js");

if (isCLI) {
    const args = process.argv.slice(2);
    tddToggleCommand(args).catch((error) => {
        console.error("Error:", error.message);
        process.exit(1);
    });
}
