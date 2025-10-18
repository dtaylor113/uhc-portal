# Recorded Subscription Fixtures

This directory contains **production subscription fixtures** recorded from real OCM subscriptions.

## ✨ Auto-Discovery

Fixtures in this directory are **automatically discovered** and loaded!

- No manual imports required
- No array management needed
- Just add/remove files and rebuild

## 🚀 Quick Start

Subscriptions are recorded **automatically** alongside clusters!

When you run:
```bash
./mockdata/msw/scripts/record-cluster.sh <subscription-id> my-cluster
```

It creates **both**:
- `../clusters/my-cluster.ts` - The cluster fixture
- `./my-cluster.ts` - The subscription fixture (this directory!)

## 📁 File Structure

```
subscriptions/
├── README.md                  # This file
├── index.ts                   # Auto-generated - DO NOT EDIT!
├── rosa-hcp-public.ts        # Subscription for rosa-hcp-public cluster
├── osd-gcp-private.ts        # Subscription for osd-gcp-private cluster
└── aws-classic-multiaz.ts    # Subscription for aws-classic-multiaz cluster
```

**Note:** Each subscription file should have a matching cluster file with the same name!

## ⚠️ Do Not Edit `index.ts`

The `index.ts` file is **auto-generated** by `generate-fixture-indexes.mjs`.

It automatically exports all `.ts` files in this directory (except itself).

## 🔧 How It Works

1. `record-cluster.sh` creates both cluster AND subscription fixtures
2. `yarn msw:fixtures:build` runs `generate-fixture-indexes.mjs`
3. The script scans this directory and generates `index.ts`
4. TypeScript compiles everything to `dist/`
5. `subscriptions.ts` imports from `./subscriptions/index.js` and auto-populates `mockSubscriptions`

## 📖 See Also

- `../README.md` - Main MSW documentation
- `../../scripts/README.md` - Script documentation
- `../../ROADMAP.md` - Project roadmap

