#!/usr/bin/env node
// Update "Related Source Code" bullets in TECH_NOTES to append last author and date from git log.
//
// - Looks for sections headed by "## Related Source Code" in tech-notes markdown files
// - For bullet lines of the form: - `path/to/file.ext` [— existing text]
//   Rewrites to: - `path/to/file.ext` — Author Name — YYYY-MM-DD
// - Skips bullets that contain wildcards (e.g., ** or *) or directories ending with '/**'
// - Options:
//   --dry                   Do not write changes; print diff summary only
//   --update-last-reviewed  Update frontmatter last_reviewed to today when file is modified
//   --root <path>           Repo root (defaults to process.cwd())

import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';

const args = process.argv.slice(2);
const isFlag = (f) => args.includes(f);
const getFlagValue = (f, def) => {
  const i = args.indexOf(f);
  return i >= 0 && args[i + 1] ? args[i + 1] : def;
};

// Defaults: expand globs, force multiline rewrite, limit matches to 10
const DRY_RUN = isFlag('--dry');
const VERBOSE = isFlag('--verbose');
const EXPAND_GLOBS = !isFlag('--no-expand-globs');
const FORCE_MULTILINE = !isFlag('--no-force-multiline');
const MAX_PER_GLOB = parseInt(getFlagValue('--max', '10'), 10);
const UPDATE_LAST_REVIEWED = isFlag('--update-last-reviewed');
const REPO_ROOT = path.resolve(getFlagValue('--root', process.cwd()));
const TECH_NOTES_ROOT = path.join(REPO_ROOT, 'tech-notes');

const walk = async (dir, files = []) => {
  const entries = await fs.promises.readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      await walk(p, files);
    } else if (e.isFile() && e.name.endsWith('.md')) {
      files.push(p);
    }
  }
  return files;
};

const isConcretePath = (p) => !p.includes('*') && !p.endsWith('/**');

const runGit = (args) => {
  const res = spawnSync('git', args, { cwd: REPO_ROOT, stdio: ['ignore', 'pipe', 'ignore'] });
  if (res.status !== 0) return null;
  return res.stdout.toString().trim();
};

const gitLsFiles = (pattern) => {
  const out = runGit(['ls-files', pattern]);
  return out ? out.split('\n').filter(Boolean) : [];
};

const gitLastAuthorDate = (filePath, n = 1) => {
  const out = runGit(['log', `-${n}`, '--pretty=format:%h|%an|%ad', '--date=short', '--', filePath]);
  if (!out) return null;
  const lines = out.split('\n').map((l) => {
    const [hash, author, date] = l.split('|');
    return { hash: hash?.trim(), author: author?.trim(), date: date?.trim() };
  });
  return lines;
};

const updateRelatedSection = (content, mdPath) => {
  const SECTION_RE = /^## Related Source Code\s*$/m;
  if (!SECTION_RE.test(content)) return { changed: false, updated: content };

  // Find section bounds
  const lines = content.split('\n');
  let headerIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].match(/^## Related Source Code\s*$/)) {
      headerIdx = i;
      break;
    }
  }
  if (headerIdx < 0) return { changed: false, updated: content };

  // Support explicit markers to make script bulletproof
  let startIdx = headerIdx + 1;
  let endIdx = lines.length;
  let hasMarkers = false;
  for (let i = headerIdx + 1; i < lines.length; i++) {
    if (lines[i].includes('<!-- related-start -->')) {
      startIdx = i + 1;
      hasMarkers = true;
      break;
    }
    if (lines[i].startsWith('## ')) {
      endIdx = i;
      break;
    }
  }
  if (hasMarkers) {
    for (let i = startIdx; i < lines.length; i++) {
      if (lines[i].includes('<!-- related-end -->')) {
        endIdx = i;
        break;
      }
    }
  } else {
    for (let i = startIdx; i < lines.length; i++) {
      if (lines[i].startsWith('## ')) {
        endIdx = i;
        break;
      }
    }
  }

  // Collect unique concrete paths (expand globs if requested)
  const collected = [];
  const pushPath = (p) => {
    if (!collected.includes(p)) collected.push(p);
  };
  for (let i = startIdx; i < endIdx; i++) {
    const m = lines[i].match(/^\-\s+`([^`]+)`/);
    if (!m) continue;
    const relPath = m[1];
    if (!isConcretePath(relPath)) {
      if (EXPAND_GLOBS) {
        const matches = gitLsFiles(relPath).slice(0, MAX_PER_GLOB);
        matches.forEach(pushPath);
      }
      continue;
    }
    if (fs.existsSync(path.join(REPO_ROOT, relPath))) pushPath(relPath);
  }

  // Build new standardized block
  const newBlock = [];
  // Sub-note under the section title to guide maintainers
  newBlock.push('_See `tech-notes/bin/UPDATE_RELATED_AUTHORS.md` for how to update this section._');
  newBlock.push('');
  newBlock.push('<!-- related-start -->');
  for (const relPath of collected) {
    const meta = gitLastAuthorDate(relPath, 3) || [];
    newBlock.push(`- \`${relPath}\``);
    if (meta.length === 0) {
      newBlock.push('  - No history found');
    } else {
      const labels = ['Last updated', 'Prev', 'Prev'];
      meta.slice(0, 3).forEach((m, idx) => newBlock.push(`  - ${labels[idx]}: ${m.date} by ${m.author} (${m.hash})`));
    }
  }
  newBlock.push('<!-- related-end -->');

  // If markers existed, drop anything between the section header and old markers,
  // and also drop the old end marker itself
  const before = hasMarkers
    ? lines.slice(0, headerIdx + 1).join('\n')
    : lines.slice(0, startIdx).join('\n');
  const after = hasMarkers
    ? lines.slice(endIdx + 1).join('\n')
    : lines.slice(endIdx).join('\n');
  const updated = [before, ...newBlock, after].join('\n');
  const changed = true;

  // Optionally update frontmatter last_reviewed
  if (changed && UPDATE_LAST_REVIEWED) {
    const today = new Date().toISOString().slice(0, 10);
    // Frontmatter starts at first '---'
    if (lines[0].trim() === '---') {
      let fmEnd = lines.indexOf('---', 1);
      if (fmEnd > 0) {
        let saw = false;
        for (let i = 1; i < fmEnd; i++) {
          if (lines[i].startsWith('last_reviewed:')) {
            lines[i] = `last_reviewed: "${today}"`;
            saw = true;
            break;
          }
        }
        if (!saw) {
          lines.splice(fmEnd, 0, `last_reviewed: "${today}"`);
        }
      }
    }
  }

  return { changed, updated };
};

(async () => {
  const files = await walk(TECH_NOTES_ROOT);
  let changedCount = 0;
  for (const mdPath of files) {
    const content = await fs.promises.readFile(mdPath, 'utf8');
    const { changed, updated } = updateRelatedSection(content, mdPath);
    if (changed) {
      changedCount++;
      if (!DRY_RUN) {
        await fs.promises.writeFile(mdPath, updated, 'utf8');
        console.log(`Updated: ${path.relative(REPO_ROOT, mdPath)}`);
      } else {
        console.log(`Would update: ${path.relative(REPO_ROOT, mdPath)}`);
      }
    }
  }
  if (changedCount === 0) {
    console.log('No changes needed.');
  } else {
    console.log(`${changedCount} file(s) ${DRY_RUN ? 'would be ' : ''}updated.`);
  }
})().catch((err) => {
  console.error(err);
  process.exit(1);
});


