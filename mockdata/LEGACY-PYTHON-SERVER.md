# Legacy Python Mock Server

This document describes the mock data backend used when running with `?env=mockdata` (or `?env=mockserver`). 

- Entrypoint: `mockdata/mockserver.py`
- Proxy: dev server rewrites `/mockdata` to `http://[::1]:8010` (see `fec.config.js`)
- Config: `src/config/mockdata.json` sets API base to `/mockdata`
- Data: JSON files under `mockdata/api/**` map one-to-one to API endpoints
- Features supported by the server:
  - Multiple responses per file via `_meta_.match` (e.g., method, request_body)
  - Injected behavior via `_meta_.inject` (e.g., `delay`, `ams_error`)
  - Special cases (e.g., logs polling with `offset`)

Recording scripts (what they do):
- `mockdata/record-real-cluster.sh`: fetches a real cluster and related endpoints from a live environment and writes the raw JSON under `mockdata/api/**`. Useful to capture a specific cluster state.
- `mockdata/record-global-data.sh`: captures global collections (e.g., versions, machine_types, products, feature toggles) to keep reference data in sync.
- `mockdata/regenerate-clusters.json.sh`: rebuilds the top-level `clusters.json` list by collating individual cluster JSONs; keeps the list consistent with per-cluster files.
- `mockdata/replace-id.sh`: renames a cluster id across file paths and JSON content to avoid id collisions and keep cross-references consistent.

Notes and limitations:
- The system stores many snapshot JSON files; cross-references rely on matching ids across files, which can drift when editing by hand.
- Adding a new “cluster type” requires recording or hand-editing multiple files (list + details + subresources).
- Error/delay behavior is driven by `_meta_` blocks inside JSON, which can be non-obvious to maintain.

Migration guidance:
- During transition to MSW, you can import some of these JSONs to seed typed fixtures.
- Prefer consolidating data into a single in-memory dataset keyed by `cluster_id`, with small factories to create variations (Ready, Installing, OSD, ROSA, Limited Support, etc.).
- Use MSW handlers to simulate errors/delays programmatically instead of `_meta_` JSON blocks.

Tip:
- Running `mockdata/regenerate-clusters.json.sh` before and after editing `subscriptions` is helpful to validate consistency against `clusters.json` and reveal anything that needs fixing.

