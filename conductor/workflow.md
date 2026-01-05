# Workflow

## Overview
This workflow enforces a disciplined, test-driven approach to development. It is designed to ensure high code quality, maintainability, and clear progress tracking.

## Core Principles
1.  **Test-Driven Development (TDD):** Tests are written *before* implementation. No code is written without a failing test.
2.  **Atomic Commits:** Changes are committed frequently, at the task level, ensuring a clean and revertible history.
3.  **Phase-Based Verification:** Each major phase of work concludes with a mandatory verification step to ensure stability before moving forward.

## Protocol
The following protocol must be followed for every task in the plan.

### 1. Task Initiation
- **Select Task:** Pick the next pending task from `plan.md`.
- **Contextualize:** Read the `spec.md` and relevant code files to understand the requirements.

### 2. TDD Cycle (Red-Green-Refactor)
- **RED (Write Test):**
    - Create or update a test file to assert the expected behavior of the new feature or fix.
    - Run the test to confirm it fails (compilation error or assertion failure).
- **GREEN (Implement):**
    - Write the minimum amount of code necessary to make the test pass.
    - Run the test again to confirm it passes.
- **REFACTOR (Clean Up):**
    - Review the code for clarity, duplication, and adherence to style guides.
    - Refactor as needed, ensuring tests still pass.

### 3. Verification & Commit
- **Run All Tests:** Execute the full test suite to ensure no regressions.
- **Commit:**
    - Stage the changes.
    - Commit with a descriptive message following the Conventional Commits specification (e.g., `feat: add user login`).
    - **Note:** Do not push yet (unless the task specifically requires it).

### 4. Task Completion
- **Update Plan:** Mark the task as `[x]` in `plan.md`.
- **Status Update:** Update the status in `tracks.md` if necessary.

## Phase Completion
At the end of each phase (a group of related tasks):
1.  **Manual Verification:** Trigger the "User Manual Verification" task. This requires you to explicitly ask the user to verify the changes in the actual environment (e.g., run the app, check the UI).
2.  **Checkpoint:** If verification is successful, create a git tag or a significant commit to mark the stable state.
