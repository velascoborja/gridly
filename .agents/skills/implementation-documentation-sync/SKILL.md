---
name: implementation-documentation-sync
description: Ensure feature documentation stays in sync with code implementations. Use this skill immediately after finishing any code modification or implementation to verify if related .md files in docs/features/ need updates.
---

# Implementation Documentation Sync

This skill ensures that the technical documentation in `docs/features/` accurately reflects the current state of the codebase after any implementation.

## Workflow

After completing an implementation, follow these steps:

### 1. Identify Changes
- Review the files you just modified or created.
- Summarize the key functional changes, new logic, or architectural shifts.

### 2. Map to Features
- Determine which existing feature documents in `docs/features/` are affected by these changes.
- If the implementation introduces a completely new feature, identify that a new document is required.

### 3. Update or Create Documentation
- **For existing features:** Update the corresponding `.md` file. Ensure that:
    - Implementation details (file paths, logic flows) are accurate.
    - Configuration fields or API endpoints are updated.
    - Any new side effects or domain rules are documented.
- **For new features:** Create a new `.md` file in `docs/features/` following the established template:
    - `## Overview`: High-level purpose.
    - `## Key Components/Fields`: Structured breakdown of technical elements.
    - `## Implementation Details`: Specific logic, file paths, and integration points.

### 4. Verification
- Ensure the documentation remains technical, concise, and written in English (following existing project documentation).
- Verify that all internal links between documentation files are still valid.
