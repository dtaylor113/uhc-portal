# MSW Documentation

This directory contains documentation for the MSW Mock Server system.

## 📚 Documentation Files

### For Users
**[MSW-SERVER.md](MSW-SERVER.md)** - Complete user guide
- Quick start instructions
- What gets mocked
- Troubleshooting
- Testing tips

### For Developers & AI
**[MOCK_FLOWS.md](MOCK_FLOWS.md)** - API call sequences and data flows ⭐ NEW!
- Detailed Cluster List page flow
- Detailed Cluster Details page flow
- What APIs are mocked and in what order
- Debugging tips for developers and AI
- How to add new mocked pages

### For Developers & Architects
**[MSW-IMPLEMENTATION-SUMMARY.md](MSW-IMPLEMENTATION-SUMMARY.md)** - Technical documentation
- System architecture
- Implementation details
- File structure
- Known technical debt
- Customization guide
- Problem solving history
- AI debugging guide

## 🚀 Quick Reference

```bash
# Start MSW server
yarn start:msw

# Stop MSW server
yarn stop:msw

# Access in browser
https://prod.foo.redhat.com:1337/openshift?env=msw-mockdata
```

## 📁 What's in This Directory?

```
mockdata/msw/
├── msw-middleware.js              ← Core implementation (Express middleware)
├── MSW-SERVER.md                  ← User guide (how to use)
├── MOCK_FLOWS.md                  ← API sequences & data flows (for devs/AI)
├── MSW-IMPLEMENTATION-SUMMARY.md  ← Technical docs (architecture, AI guide)
└── README.md                      ← This file
```

All MSW-related files are now consolidated in this directory.

---

**Need Help?** Start with [MSW-SERVER.md](MSW-SERVER.md)

