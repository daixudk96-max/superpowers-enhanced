import fs from 'node:fs';
import path from 'node:path';

export async function verifyTddCommand(files: string[]): Promise<void> {
  // If no files provided, exit success (nothing to check)
  if (!files || files.length === 0) {
    process.exit(0);
  }

  const filePath = files[0]; // Hooks typically pass one file at a time for Edit/Write

  // 1. Skip non-source files (Tier 0)
  if (!isSourceFile(filePath)) {
    process.exit(0);
  }

  // 2. Determine Risk Tier
  const tier = determineRiskTier(filePath);

  // Tier 0: Safe to edit
  if (tier === 0) {
    process.exit(0);
  }

  // 3. Check for tests
  const hasTest = checkTestsExist(filePath);

  // 4. Enforce rules
  if (tier >= 2 && !hasTest) {
    // Check for exemption comment
    if (tier === 2 && hasExemption(filePath)) {
      process.exit(0);
    }

    console.error(`
🛑 **TDD Guard Blocked This Edit** 🛑

File: ${path.basename(filePath)}
Risk Tier: ${tier}

Reason: You are attempting to modify a source file but NO corresponding test file was found.

**Requirement:**
1. Create a test file first (e.g., ${path.basename(filePath).replace(/\.(ts|js|tsx|jsx)$/, '.test.$1')})
2. Implement a failing test (RED state)
3. Then try this edit again

To bypass (Tier 2 only): Add <!-- TDD-EXEMPT --> comment to the file.
`);
    process.exit(1);
  }

  process.exit(0);
}

// --- Helper Functions ---

function isSourceFile(filePath: string): boolean {
  return /\.(ts|tsx|js|jsx|py|go|rs|java|c|cpp)$/i.test(filePath) &&
         !/\.(test|spec)\./i.test(filePath);
}

function determineRiskTier(filePath: string): number {
  // Tier 0: Configs, docs, etc.
  if (/\.(json|md|txt|yaml|yml|css|scss|html)$/i.test(filePath)) return 0;

  // Tier 3: Critical Core Logic
  if (/auth|security|payment|billing|crypto|core\/api/i.test(filePath)) return 3;

  // Tier 2: Default Application Logic
  return 2;
}

function checkTestsExist(filePath: string): boolean {
  const dir = path.dirname(filePath);
  const ext = path.extname(filePath);
  const name = path.basename(filePath, ext);

  const candidates = [
    path.join(dir, `${name}.test${ext}`),
    path.join(dir, `${name}.spec${ext}`),
    path.join(dir, '__tests__', `${name}.test${ext}`),
    path.join(dir, '__tests__', `${name}.spec${ext}`),
    path.join(dir, 'tests', `${name}_test${ext}`),
    path.join(dir, '..', 'tests', `${name}.test${ext}`)
  ];

  return candidates.some(p => fs.existsSync(p));
}

function hasExemption(filePath: string): boolean {
  try {
    if (!fs.existsSync(filePath)) return false;
    const content = fs.readFileSync(filePath, 'utf-8');
    return content.includes('TDD-EXEMPT');
  } catch {
    return false;
  }
}
