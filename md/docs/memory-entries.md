# Memory Entries: Features & Mistakes — Quick Guide

Purpose: Keep knowledge current and reusable by documenting resolved errors and implemented features in a concise, consistent format.

## Mistakes (Distributed Error Documentation)
- When: Any time an incorrect/suboptimal output is detected and corrected, or a significant error is resolved.
- Where: mistakes/[error-category].md (one file per category, e.g., database-errors.md, authentication-issues.md, ui-bugs.md)
- Naming: Use descriptive, kebab-case filenames per error domain.
- Minimal template:

```markdown
# [Error Category] — Common Issues and Solutions

## [Specific Error Name] — [Date/Version]

Problem Description:
[Short, precise description]

Wrong Approach:
```[language]
[Incorrect code/logic]
```

Correct Solution:
```[language]
[Corrected code/logic]
```

Root Cause: [Why it happened]
Prevention: [How to avoid it]
Related Files: [Impacted/modified files]
```

## Features (Feature Documentation)
- When: New features, changes to existing features, or clarifications to feature behavior.
- Where: features/[feature-name].md
- Naming: kebab-case, one file per major feature (e.g., chat-system.md, image-generation.md, user-authentication.md)
- Minimal template:

```markdown
# [Feature Name] — Implementation Guide

Overview
[What it does and why]

Architecture
[High-level architecture and data flow]

Key Components
- Component 1: [Path + purpose]
- Component 2: [Path + purpose]

API Endpoints
[Relevant routes and purpose]

Database Schema
[Relevant tables/relationships]

Configuration
[Env vars, settings]

Common Issues
[Links to related mistakes]

Testing Strategy
[How to test]

Last Updated
[Date + short note]
```

## References
- Testing standards and workflow: docs/ttd-flow.md
- API documentation: docs/apis.md
- Database schema: docs/database-schema.md