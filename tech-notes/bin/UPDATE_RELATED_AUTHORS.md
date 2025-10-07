---
id: update-related-authors
title: UPDATE_RELATED_AUTHORS
---

This document describes how to update the "Related Source Code" sections in TECH_NOTES using the updater script.

It supports:
- Expanding wildcards using git ls-files (limit via `--max`)
- Adding the last 3 commits per file, formatted as:
  - `src/path/File.tsx`
    - Last updated: YYYY-MM-DD by Author (hash)
    - Prev: YYYY-MM-DD by Author (hash)
    - Prev: YYYY-MM-DD by Author (hash)

Usage (simple)
```bash
# From repo root
node tech-notes/bin/update-related-authors.mjs   # expands globs, rewrites blocks, limits to 10 per glob

# Dry run (show which files would change, no writes)
node tech-notes/bin/update-related-authors.mjs --dry

# Update frontmatter last_reviewed to today for changed notes
node tech-notes/bin/update-related-authors.mjs --update-last-reviewed

# Disable defaults if needed
node tech-notes/bin/update-related-authors.mjs --no-expand-globs --no-force-multiline

# If run from elsewhere, pass the repo root
node tech-notes/bin/update-related-authors.mjs --root /path/to/uhc-portal
```

Rules
- Only updates bullets in sections titled exactly `## Related Source Code`.
- Rewrites the block between `<!-- related-start -->` and `<!-- related-end -->`.
- Bullets must be backticked paths like `- `src/path/file.tsx``. Globs are expanded when `--expand-globs` is used.
- Skips non-existent paths; use `--verbose` to see why items are skipped.

Tips
- Run with `--dry` in PRs to see which notes need updates.
- Add a CI job that runs `--dry` + `--validate-only` (if enabled) and fails if changes are needed.


