# CI Overview — uhc-portal

## Big picture

Our CI/CD pipeline spans **multiple systems** working together. When you open a PR, several things happen in parallel:

| System | What it does |
|--------|--------------|
| **GitHub Actions** | Fast feedback: lint, build, unit tests |
| **Konflux** | Container build, security scans, Playwright E2E |
| **Konflux Integration Tests** | Policy validation (Enterprise Contract) after build |

After merge, Konflux publishes the production image. Jenkins handles legacy QA workflows (being migrated).

### CI landscape (sequence)

```mermaid
sequenceDiagram
  participant Dev as Developer
  participant GH as GitHub
  participant GHA as GitHub Actions
  participant Konflux as Konflux
  participant Quay as Quay.io
  participant IT as Konflux Integration Tests

  Note over Dev,IT: main branch — ocm-ui application

  Dev->>GH: PR opened/updated → pull_request event
  
  par [These run in parallel] GitHub Actions
    GH->>GHA: CI workflow triggered
    GHA->>GHA: lint, build, unit tests, circular deps
    GHA->>GH: PR status checks
  and [Konflux]
    GH->>Konflux: pull_request event
    Konflux->>Konflux: Match repo, fetch .tekton/
    Konflux->>Konflux: Run pull-request.yaml (uses docker-build-run-all-tests-v2)
    Konflux->>Konflux: build → security scans → unit tests → e2e
    Konflux->>Quay: Push PR image (temporary)
    Konflux->>GH: PR status checks
  end
  
  Konflux->>IT: Snapshot created (image ready)
  IT->>IT: Enterprise Contract (consoledot-frontend-standard)
  IT->>GH: PR status checks

  Dev->>GH: PR merged → push event to main

  par GitHub Actions
    GH->>GHA: e2e-ci-playwright.yml triggered
    GHA->>GHA: Playwright @ci tests
    GHA->>GH: Commit status
  and Konflux
    GH->>Konflux: push event to main
    Konflux->>Konflux: Run push.yaml (uses docker-build-run-unit-tests)
    Konflux->>Konflux: build → unit tests
    Konflux->>Quay: Push ocm-ui/uhc-portal:{sha}
    Konflux->>IT: Snapshot created (image ready)
    IT->>IT: Enterprise Contract validation
    IT->>GH: Commit status
  end

  Note over Dev,IT: security-compliance branch — ocm-ui-sc application

  Dev->>GH: PR to security-compliance branch
  GH->>Konflux: pull_request event
  Konflux->>Konflux: Run uhc-portal-sc-pull-request.yaml (inline docker-build-oci-ta)
  Konflux->>Konflux: build → security scans only (no unit tests, no e2e)
  Konflux->>Quay: Push ocm-ui-sc/uhc-portal-sc:on-pr-{sha} (expires 5d)
  Konflux->>GH: PR status checks

  Dev->>GH: PR merged → push to security-compliance
  GH->>Konflux: push event to security-compliance
  Konflux->>Konflux: Run uhc-portal-sc-push.yaml (inline docker-build-oci-ta)
  Konflux->>Konflux: build → security scans only
  Konflux->>Quay: Push ocm-ui-sc/uhc-portal-sc:{sha}
  Konflux->>IT: Snapshot created (image ready)
  IT->>IT: Enterprise Contract validation
  IT->>GH: Commit status
```

### CI landscape (sequence2)

> **Alternative view — phases left-to-right.** The chart below shows the same pipeline organized by *what happens when* rather than *which system does it*. Nodes indicate the responsible system; labels note when a step is skipped for the `security-compliance` branch.

```mermaid
flowchart LR
  subgraph trigger ["1. Trigger"]
    pr_opened["PR opened / updated"]
    pr_merged["PR merged (push)"]
  end

  subgraph lint_build ["2. Lint & Build"]
    gha_lint["GHA: lint, build, circular deps"]
    konflux_build["Konflux: container image build"]
  end

  subgraph scans ["3. Security Scans"]
    konflux_scans["Konflux: clair, clamav, snyk,<br/>shell-check, unicode, rpms-signature"]
  end

  subgraph tests ["4. Tests"]
    gha_unit["GHA: Jest unit tests (PR only)"]
    konflux_unit["Konflux: unit tests (skip for SC)"]
    konflux_e2e["Konflux: Playwright e2e (PR only, skip for SC)"]
    gha_e2e["GHA: Playwright @ci (push only)"]
  end

  subgraph image ["5. Image Published"]
    quay_pr["Quay: temporary PR image (5d expiry for SC)"]
    quay_prod["Quay: ocm-ui/uhc-portal:{sha}"]
  end

  subgraph ec ["6. Enterprise Contract"]
    ec_check["Integration Tests:<br/>consoledot-frontend-standard policy"]
  end

  subgraph status ["7. Status Reported"]
    gh_checks["GitHub PR / commit status checks"]
  end

  pr_opened --> gha_lint
  pr_opened --> konflux_build
  pr_merged --> konflux_build
  pr_merged --> gha_e2e

  gha_lint --> gha_unit
  gha_unit --> gh_checks

  konflux_build --> konflux_scans
  konflux_scans --> konflux_unit
  konflux_unit --> konflux_e2e
  konflux_e2e --> quay_pr
  konflux_unit -->|"push only"| quay_prod

  quay_pr --> ec_check
  quay_prod --> ec_check
  ec_check --> gh_checks

  gha_e2e --> gh_checks
```

### Where all the CI pieces live

```mermaid
flowchart LR
  subgraph konflux_pipelines["konflux-pipelines (GitHub)"]
    shared_pr["docker-build-run-all-tests-v2.yaml<br/> - build + scans + tests + e2e"]
    shared_push["docker-build-run-unit-tests.yaml<br/> - build + unit tests only"]
  end

  subgraph uhc_portal["uhc-portal (GitHub)"]
    subgraph tekton_main[".tekton/ — main branch"]
      pr_yaml["pull-request.yaml<br/> - PR trigger, extends shared pipeline"]
      push_yaml["push.yaml<br/> - merge trigger, extends shared pipeline"]
    end
    subgraph tekton_sc[".tekton/ — security-compliance"]
      sc_pr_yaml["sc-pull-request.yaml<br/> - PR trigger, inline build + scans"]
      sc_push_yaml["sc-push.yaml<br/> - merge trigger, inline build + scans"]
    end
    subgraph workflows[.github/workflows/]
      ci["ci.yml<br/> - PR checks: lint, build, unit tests"]
      e2e_ci["e2e-ci-playwright.yml<br/> - @ci tests on push to main"]
      smoke["e2e-smoke-playwright.yml<br/> - daily @smoke tests"]
    end
  end

  subgraph konflux_release["konflux-release-data (GitLab)"]
    tenant[tenants-config]
    caddyfiles[Caddyfile ConfigMaps]
  end

  shared_pr -.->|base for| pr_yaml
  shared_push -.->|base for| push_yaml

  click ci href "https://github.com/RedHatInsights/uhc-portal/blob/main/.github/workflows/ci.yml"
  click e2e_ci href "https://github.com/RedHatInsights/uhc-portal/blob/main/.github/workflows/e2e-ci-playwright.yml"
  click smoke href "https://github.com/RedHatInsights/uhc-portal/blob/main/.github/workflows/e2e-smoke-playwright.yml"
  click pr_yaml href "https://github.com/RedHatInsights/uhc-portal/blob/main/.tekton/uhc-portal-pull-request.yaml"
  click push_yaml href "https://github.com/RedHatInsights/uhc-portal/blob/main/.tekton/uhc-portal-push.yaml"
  click sc_pr_yaml href "https://github.com/RedHatInsights/uhc-portal/blob/main/.tekton/uhc-portal-sc-pull-request.yaml"
  click sc_push_yaml href "https://github.com/RedHatInsights/uhc-portal/blob/main/.tekton/uhc-portal-sc-push.yaml"
  click shared_pr href "https://github.com/RedHatInsights/konflux-pipelines/blob/main/pipelines/platform-ui/docker-build-run-all-tests-v2.yaml"
  click shared_push href "https://github.com/RedHatInsights/konflux-pipelines/blob/main/pipelines/platform-ui/docker-build-run-unit-tests.yaml"
  click tenant href "https://gitlab.cee.redhat.com/releng/konflux-release-data/-/tree/main/tenants-config/cluster/stone-prd-rh01/tenants/ocm-ui-tenant"
  click caddyfiles href "https://gitlab.cee.redhat.com/releng/konflux-release-data/-/tree/main/tenants-config/cluster/stone-prd-rh01/tenants/ocm-ui-tenant"
```

> **Dotted lines** = `.tekton/` files extend shared pipelines. The SC pipelines do **not** extend shared pipelines — they use an **inline** `docker-build-oci-ta` pipeline (build + scans only, no tests). Node links are clickable on GitHub, not in Cursor's preview.

| Where | What lives there | Plain-English role |
|---|---|---|
| **GitHub** — `uhc-portal/.github/workflows/` | `ci.yml`, `e2e-ci-playwright.yml`, `e2e-smoke-playwright.yml` | **GitHub Actions** workflows — `ci.yml`: fast PR checks (lint, build, unit tests). `e2e-ci-playwright.yml`: Playwright `@ci` tests on push to main. `e2e-smoke-playwright.yml`: scheduled daily `@smoke` tests. |
| **GitHub** — `uhc-portal/.tekton/` (main) | `uhc-portal-pull-request.yaml`, `uhc-portal-push.yaml` | The **ocm-ui** entry points Konflux watches for the `main` branch. They extend the shared `konflux-pipelines` repo (full build + tests + e2e). |
| **GitHub** — `uhc-portal/.tekton/` (SC) | `uhc-portal-sc-pull-request.yaml`, `uhc-portal-sc-push.yaml` | The **ocm-ui-sc** entry points for the `security-compliance` branch. These use an **inline** `docker-build-oci-ta` pipeline — build + security scans only, no unit tests or e2e. Added by Lyn M in PR #478 (OCMUI-3677). |
| **GitHub (upstream)** — `RedHatInsights/konflux-pipelines` | [`pipelines/platform-ui/docker-build-run-all-tests-v2.yaml`](https://github.com/RedHatInsights/konflux-pipelines/blob/main/pipelines/platform-ui/docker-build-run-all-tests-v2.yaml) | The **shared Konflux pipeline**, maintained by Platform Experience (Brandon Tweed). Defines the real steps: build image → security scans → unit tests → run app → run Playwright e2e. Every HCC frontend team points at this file. Only used by `main` branch pipelines. |
| **GitLab** — `konflux-release-data` (internal) | YAML under `tenants-config/.../ocm-ui-tenant/` | Cluster-side config: tenant admin permissions, release plans, integration test scenarios, Caddyfile ConfigMaps, Kustomize wiring. |
| **Konflux UI** (one-time, manual) | `ocm-ui-tenant` namespace | The E2E login credentials secret (`ocm-ui-credentials-secret`). Stored in the cluster via the UI, not in git. |
| **GitHub** — `uhc-portal/build-tools/src/Jenkinsfile` | [`Jenkinsfile`](https://github.com/RedHatInsights/uhc-portal/blob/main/build-tools/src/Jenkinsfile) | **Jenkins** *(legacy)* — Deploys static assets to Akamai CDN via rsync, then busts the CDN cache. Runs per environment branch (prod-stable, prod-beta, qa-stable, etc.). |
| **GitHub** — `uhc-portal/cypress-qe-triggers.sh` | [`cypress-qe-triggers.sh`](https://github.com/RedHatInsights/uhc-portal/blob/main/cypress-qe-triggers.sh), `run/cypress-qe-executor.sh` | **Jenkins** *(legacy, migrating)* — Entry point for QE Cypress smoke tests. Jenkins calls this script with environment, browser, and tag params to run daily smoke tests in a podman pod. |

### Konflux Applications and Release Plans

Two Konflux Applications exist in the `ocm-ui-tenant` namespace:

| Application | Component | Branch | Pipeline type | Quay image path | Release plan |
|-------------|-----------|--------|---------------|----------------|-------------|
| **ocm-ui** | `uhc-portal` | `main` | Shared (konflux-pipelines) — build + scans + tests + e2e | `quay.io/.../ocm-ui/uhc-portal:{sha}` | `ocm-ui-release-as-ms` → `rhtap-releng-tenant` |
| **ocm-ui-sc** | `uhc-portal-sc` | `security-compliance` | Inline (docker-build-oci-ta) — build + scans only | `quay.io/.../ocm-ui-sc/uhc-portal-sc:{sha}` | `ocm-ui-sc-release-as-ms` → `rhtap-releng-tenant` |

Both have **auto-release enabled** with **standing attribution** and release to `rhtap-releng-tenant` (Red Hat release engineering).

An `IntegrationTestScenario` named `ocm-ui-enterprise-contract` validates images against the `consoledot-frontend-standard` policy using the Enterprise Contract pipeline from `konflux-ci/build-definitions`.

> **Persistence risk:** The `ocm-ui` application, component, release plan, and integration test are persisted in `konflux-release-data` (GitLab). The `ocm-ui-sc` resources (application, component, release plan) currently exist **only in the Konflux UI** — they were created there but have not been committed to `konflux-release-data`. If the `ocm-ui-tenant` namespace is ever recreated from the Git source of truth, the SC configuration would be lost. Consider adding `ocm-ui-sc_*` YAML files to the tenant's `kustomization.yaml`.

---

## Konflux triggers (Pipelines-as-Code)

> **CEL expression** = Common Expression Language — a lightweight `if` statement that Pipelines-as-Code (PaC) evaluates against the incoming GitHub webhook to decide whether to launch a PipelineRun.

| When | Which `.tekton/` file | CEL expression | Pipeline used | What actually runs |
|---|---|---|---|---|
| PR opened, updated, or `/retest` against `main` | `uhc-portal-pull-request.yaml` | `event == "pull_request" && target_branch == "main"` | Shared: `docker-build-run-all-tests-v2.yaml` | Build → security scans → unit tests → **Playwright e2e** |
| Commit lands on `main` (merge) | `uhc-portal-push.yaml` | `event == "push" && target_branch == "main"` | Shared: `docker-build-run-unit-tests.yaml` | Build → unit tests. Publishes `ocm-ui/uhc-portal:{sha}`. |
| PR against `security-compliance` | `uhc-portal-sc-pull-request.yaml` | `event == "pull_request" && target_branch == "security-compliance"` | Inline: `docker-build-oci-ta` | Build → security scans only. PR image expires in 5 days. |
| Commit lands on `security-compliance` (merge) | `uhc-portal-sc-push.yaml` | `event == "push" && target_branch == "security-compliance"` | Inline: `docker-build-oci-ta` | Build → security scans only. Publishes `ocm-ui-sc/uhc-portal-sc:{sha}`. |

---

## How E2E tests run (main branch only)

> This section only applies to the **main branch** (`ocm-ui` application). The `security-compliance` branch does not run E2E tests.

Playwright E2E tests need a running application to test against. In Konflux, we achieve this using **sidecars** — additional containers that run alongside the main test container within the same pod.

Our E2E setup uses two sidecars:
1. **App sidecar** — Runs the built uhc-portal UI using [Caddy](https://caddyserver.com/), a lightweight web server. Caddy serves the static assets on port 8000 using a ConfigMap-based Caddyfile (`ocm-ui-app-caddy-config`).
2. **Proxy sidecar** — Routes requests so that `/openshift/*` paths go to the app sidecar (our code), while everything else (APIs, auth) proxies to `console.dev.redhat.com` (the staging backend). This is configured via `ocm-ui-dev-proxy-caddyfile`.

```mermaid
flowchart TB
  subgraph pod["Same pod: PR e2e task"]
    main["Task container: Playwright"]
    app["Sidecar: uhc-portal + Caddy :8000"]
    proxy["Sidecar: dev proxy Caddy :1337"]
  end

  main -->|"https://prod.foo.redhat.com:1337/openshift/"| proxy
  proxy -->|"/openshift/* → static app"| app
  proxy -->|"APIs, auth, etc."| stage["console.dev.redhat.com (staging)"]

  ha["hostAliases: prod.foo.redhat.com → 127.0.0.1 (pod-level)"] -.-> pod
```

Both ConfigMaps are defined in [**konflux-release-data**](https://gitlab.cee.redhat.com/releng/konflux-release-data/-/tree/main/tenants-config/cluster/stone-prd-rh01/tenants/ocm-ui-tenant) under the `ocm-ui-tenant` configuration. The `hostAliases` setting maps `prod.foo.redhat.com` → `127.0.0.1`, so traffic stays local to the pod and hits our proxy sidecar. The `prod.foo` hostname is whitelisted in `sso.redhat.com`, allowing SSO login to work during tests.

---

## What our `.tekton/` files actually control

Our `.tekton/` files are **small customization layers**. They don't define the build/test steps — they configure *when* to run, *what image* to build, and *what scripts* to execute.

### main branch (extends shared pipeline)

| What | Our files control | Shared pipeline controls |
|---|---|---|
| **Pipeline type** | `PipelineRun` — a single invocation with inputs | `Pipeline` — the reusable task graph |
| **Trigger** | CEL: `event == "pull_request"` or `event == "push"`, `target_branch == "main"` | — |
| **Task graph** (build → scans → tests → e2e) | — | Entirely defined upstream. We don't add, remove, or reorder tasks. |
| **Per-project inputs** | `git-url`, `revision`, `output-image`, `dockerfile`, e2e params (app port, HCC env, credentials secret) | Declares param signatures only |
| **Script bodies** | `unit-tests-script`, `run-app-script`, `e2e-tests-script` | Just `exec`s whatever we pass |
| **Compute overrides** | `run-unit-tests` → 6 Gi, `run-e2e-tests` → 10 Gi (PR only) | Defaults only |
| **E2E pod wiring** | `hostAliases`, Caddyfile ConfigMap volume, sidecar specs (PR only) | — |
| **Workspaces** | PVC + `git-auth` secret. 10 Gi (PR), 1 Gi (push) | Declares which workspaces tasks need |
| **Behaviors** | `max-keep-runs: 3`. `cancel-in-progress: true` (PR), `false` (push) | — |
| **Service account** | `build-pipeline-uhc-portal` — pushes to Quay, accesses secrets | — |

When the upstream shared pipeline changes, every consumer's CI behavior changes with no commit on our side.

### security-compliance branch (inline pipeline)

The SC files (`uhc-portal-sc-*`) are self-contained — the full pipeline spec is **inlined** in each YAML file (~540 lines each). They use `docker-build-oci-ta` from the Konflux Tekton catalog bundles.

| What | Value |
|---|---|
| **Trigger** | CEL: `target_branch == "security-compliance"` |
| **Tasks** | init → clone → prefetch → build-container → build-image-index → security scans (clair, clamav, snyk, shell-check, unicode-check, ecosystem-cert-preflight, rpms-signature-scan) → apply-tags → push-dockerfile |
| **No tests** | No `run-unit-tests` or `run-e2e-tests` tasks |
| **Compute override** | `build-container` → 10 Gi |
| **Service account** | `build-pipeline-uhc-portal-sc` |
| **PR image expiry** | 5 days |
