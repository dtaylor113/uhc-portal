# Recorded Cluster Fixtures

This directory contains **production cluster fixtures** recorded from real OCM clusters.

## ✨ Auto-Discovery

Fixtures in this directory are **automatically discovered** and loaded!

- No manual imports required
- No array management needed
- Just add/remove files and rebuild

## 🚀 Quick Start

### Add a new cluster:
```bash
# Record from a real cluster
./mockdata/msw/scripts/record-cluster.sh <subscription-id> my-cluster-name

# Restart (auto-discovers the new fixture!)
yarn start:msw
```

### Remove a cluster:
```bash
# Delete the fixture
./mockdata/msw/scripts/delete-cluster.sh my-cluster-name

# Restart (auto-removes from index!)
yarn start:msw
```

### Rename a cluster:
```bash
# Rename the fixture
./mockdata/msw/scripts/rename-cluster.sh old-name new-name

# Restart (auto-updates index!)
yarn start:msw
```

## 📁 File Structure

```
clusters/
├── README.md                  # This file
├── index.ts                   # Auto-generated - DO NOT EDIT!
├── rosa-hcp-public.ts        # Example: ROSA HCP cluster
├── osd-gcp-private.ts        # Example: OSD GCP cluster
└── aws-classic-multiaz.ts    # Example: ROSA Classic cluster
```

## ⚠️ Do Not Edit `index.ts`

The `index.ts` file is **auto-generated** by `generate-fixture-indexes.mjs`.

It automatically exports all `.ts` files in this directory (except itself).

## 🔧 How It Works

1. `record-cluster.sh` creates a new `.ts` file here
2. `yarn msw:fixtures:build` runs `generate-fixture-indexes.mjs`
3. The script scans this directory and generates `index.ts`
4. TypeScript compiles everything to `dist/`
5. `clusters.ts` imports from `./clusters/index.js` and auto-populates `mockClusters`

## 📖 See Also

- `../README.md` - Main MSW documentation
- `../../scripts/README.md` - Script documentation
- `../../ROADMAP.md` - Project roadmap

