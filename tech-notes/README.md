Tech Notes Portal

This folder contains the documentation (`areas/**`) and a local docs portal (`portal/`) to browse them. It is isolated from product code and not bundled.

Prereqs
- Node 18+
- Yarn (via Corepack)

Install
```bash
cd tech-notes/portal
corepack enable && corepack prepare yarn@4.3.1 --activate
yarn install
```

Run (dev server)
```bash
cd tech-notes/portal
yarn start
```

Build static site
```bash
cd tech-notes/portal
yarn build
yarn serve
```

Add dependencies (scoped to the portal)
```bash
cd tech-notes/portal
yarn add <package>@<version>      # runtime dep
yarn add -D <package>@<version>   # dev dep
```

Notes
- The sidebar auto-discovers markdown from `tech-notes/`.
- Docs live alongside code but remain separate from the product app.


