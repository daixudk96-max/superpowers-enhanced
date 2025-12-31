#!/usr/bin/env node
import { initCommand } from './init.js';
import { verifyTddCommand } from './verify-tdd.js';

const args = process.argv.slice(2);
const command = args[0];

switch (command) {
    case 'init':
        initCommand(args.slice(1));
        break;
    case 'verify-tdd':
        verifyTddCommand(args.slice(1));
        break;
    default:
        console.log('Superpowers-Fusion CLI');
        console.log('');
        console.log('Usage:');
        console.log('  superpowers-fusion init        Initialize project with TDD hooks');
        console.log('  superpowers-fusion verify-tdd  Run TDD verification (used by hooks)');
        process.exit(1);
}
