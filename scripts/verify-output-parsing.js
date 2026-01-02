import { postToolEdit } from '../dist/hooks/postToolEdit.js';

const passEvent = {
    toolName: 'Bash',
    filePath: 'test.ts',
    testOutput: 'Test Suites: 1 passed, 1 total\nTests:       1 passed, 1 total'
};

const failEvent = {
    toolName: 'Bash',
    filePath: 'test.ts',
    testOutput: 'Test Suites: 1 failed, 1 total\nTests:       1 failed, 1 total'
};

console.log('Pass Result:', JSON.stringify(postToolEdit(passEvent), null, 2));
console.log('Fail Result:', JSON.stringify(postToolEdit(failEvent), null, 2));
