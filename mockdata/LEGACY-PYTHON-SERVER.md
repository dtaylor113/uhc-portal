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

Recording scripts (kept during transition):
- `mockdata/record-real-cluster.sh`
- `mockdata/record-global-data.sh`
- `mockdata/regenerate-clusters.json.sh`
- `mockdata/replace-id.sh`

For the original detailed guide, see the previous README contents which have been moved into this file.
