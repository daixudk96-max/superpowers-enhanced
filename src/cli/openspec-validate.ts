/**
 * OpenSpec Validate Command
 * 
 * Validates OpenSpec change directories for proper structure and formatting.
 */

import * as fs from 'fs';
import * as path from 'path';

type IssueLevel = 'error' | 'warning';

interface ValidationIssue {
    validator: string;
    message: string;
    file?: string;
    line?: number;
    level: IssueLevel;
}

interface ValidationReport {
    changeId: string;
    strict: boolean;
    errors: ValidationIssue[];
    warnings: ValidationIssue[];
    passed: boolean;
}

interface ValidateOptions {
    strict?: boolean;
    json?: boolean;
}

// Expected proposal sections (Chinese)
const PROPOSAL_SECTIONS = ['为什么', '变更内容', '影响范围'];
// Task checkbox pattern: - [ ] or - [x] or - [~]
const TASK_CHECKBOX_PATTERN = /^-\s*\[[ xX~\/]\]\s+.+/;
// Risk tier comment pattern - TODO: Use in strict mode validation
// const RISK_COMMENT_PATTERN = /<!--\s*风险:\s*Tier-\d+\s*-->/i;

/**
 * Main validation command entry point
 */
export async function openspecValidateCommand(args: string[]): Promise<void> {
    const changeId = args.find(arg => !arg.startsWith('--'));
    const options: ValidateOptions = {
        strict: args.includes('--strict'),
        json: args.includes('--json')
    };

    if (!changeId) {
        console.error('用法: superpowers-fusion openspec validate <changeId> [--strict] [--json]');
        console.error('示例: superpowers-fusion openspec validate integrate-superpowers-parity');
        process.exit(1);
    }

    const openspecRoot = path.resolve(process.cwd(), 'openspec');
    const changeDir = path.join(openspecRoot, 'changes', changeId);

    const report: ValidationReport = {
        changeId,
        strict: Boolean(options.strict),
        errors: [],
        warnings: [],
        passed: false
    };

    // Phase 1: Skeleton Validation
    const skeletonIssues = validateSkeleton(changeDir, changeId);
    report.errors.push(...skeletonIssues.filter(i => i.level === 'error'));
    report.warnings.push(...skeletonIssues.filter(i => i.level === 'warning'));

    // Phase 2: Format Validation (only if skeleton passes)
    if (report.errors.length === 0) {
        const proposalPath = path.join(changeDir, 'proposal.md');
        const tasksPath = path.join(changeDir, 'tasks.md');

        const proposalIssues = validateProposal(proposalPath, changeId);
        report.errors.push(...proposalIssues.filter(i => i.level === 'error'));
        report.warnings.push(...proposalIssues.filter(i => i.level === 'warning'));

        const tasksIssues = validateTasks(tasksPath, changeId);
        report.errors.push(...tasksIssues.filter(i => i.level === 'error'));
        report.warnings.push(...tasksIssues.filter(i => i.level === 'warning'));
    }

    // Phase 3: Semantic Validation (--strict mode)
    if (options.strict) {
        report.warnings.push({
            validator: 'SemanticValidator',
            message: '语义校验尚未实现 (--strict)',
            level: 'warning'
        });
    }

    report.passed = report.errors.length === 0;

    // Output
    printReport(report, Boolean(options.json));
    process.exit(report.passed ? 0 : 1);
}

/**
 * Validate change directory skeleton structure
 */
function validateSkeleton(changeDir: string, changeId: string): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    // Check change directory exists
    if (!fs.existsSync(changeDir)) {
        issues.push({
            validator: 'SkeletonValidator',
            message: `变更目录不存在: openspec/changes/${changeId}/`,
            level: 'error'
        });
        return issues;
    }

    // Check proposal.md exists
    const proposalPath = path.join(changeDir, 'proposal.md');
    if (!fs.existsSync(proposalPath)) {
        issues.push({
            validator: 'SkeletonValidator',
            file: `openspec/changes/${changeId}/proposal.md`,
            message: 'proposal.md 不存在',
            level: 'error'
        });
    }

    // Check tasks.md exists
    const tasksPath = path.join(changeDir, 'tasks.md');
    if (!fs.existsSync(tasksPath)) {
        issues.push({
            validator: 'SkeletonValidator',
            file: `openspec/changes/${changeId}/tasks.md`,
            message: 'tasks.md 不存在',
            level: 'error'
        });
    }

    return issues;
}

/**
 * Validate proposal.md format
 */
function validateProposal(proposalPath: string, changeId: string): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    const content = fs.readFileSync(proposalPath, 'utf8');
    const lines = content.split('\n');

    // Find all h2 sections
    const h2Sections = lines
        .filter(line => line.startsWith('## '))
        .map(line => line.replace('## ', '').trim());

    // Check for required sections
    for (const section of PROPOSAL_SECTIONS) {
        const found = h2Sections.some(s => s.includes(section));
        if (!found) {
            issues.push({
                validator: 'ProposalValidator',
                file: `openspec/changes/${changeId}/proposal.md`,
                message: `缺少必需章节: "## ${section}"`,
                level: 'error'
            });
        }
    }

    return issues;
}

/**
 * Validate tasks.md format
 */
function validateTasks(tasksPath: string, changeId: string): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    const content = fs.readFileSync(tasksPath, 'utf8');
    const lines = content.split('\n');

    lines.forEach((line, index) => {
        const trimmed = line.trim();

        // Skip non-task lines
        if (!trimmed.startsWith('-')) return;
        if (trimmed.startsWith('---')) return; // Skip horizontal rules
        if (!trimmed.includes('[')) return; // Skip regular list items

        // Check checkbox format
        if (!TASK_CHECKBOX_PATTERN.test(trimmed)) {
            issues.push({
                validator: 'TasksValidator',
                file: `openspec/changes/${changeId}/tasks.md`,
                line: index + 1,
                message: `第 ${index + 1} 行: 任务行必须使用 "- [ ]" 复选框格式`,
                level: 'warning'
            });
        }
    });

    return issues;
}

/**
 * Print validation report
 */
function printReport(report: ValidationReport, asJson: boolean): void {
    if (asJson) {
        console.log(JSON.stringify(report, null, 2));
        return;
    }

    console.log(`\nOpenSpec 校验报告: ${report.changeId}`);
    console.log('='.repeat(40));

    if (report.passed) {
        console.log('✓ 所有校验通过\n');
    } else {
        console.log('✗ 发现问题:\n');
        for (const issue of report.errors) {
            const location = issue.file ? `[${issue.file}]` : '';
            console.log(`  ❌ ${issue.validator} ${location}`);
            console.log(`     ${issue.message}\n`);
        }
    }

    if (report.warnings.length > 0) {
        console.log('⚠️ 警告:\n');
        for (const issue of report.warnings) {
            const location = issue.file ? `[${issue.file}]` : '';
            console.log(`  ⚠️ ${issue.validator} ${location}`);
            console.log(`     ${issue.message}\n`);
        }
    }
}
