# Kitesurf browser evaluation

Independent, preliminary comparison of [Cloudflare Kitesurf](https://github.com/cloudflare/kitesurf) and Chromium through Puppeteer/CDP. Not affiliated with Cloudflare. This repository is an evaluation harness, not a browser fork or performance recommendation.

## Initial ARM64 smoke

Kitesurf revision: `4a2903813a22b08d4f3cc64a4b35339d0293a5d1`. Hardware: NVIDIA GB10, Linux ARM64. Local Wrangler execution, no cloud deployment. Dependencies installed project-locally; native build succeeded after two interrupted build invocations resumed from cache. Four Bazel jobs; resource scheduler hints, not a hard memory cap.

| Task | Kitesurf | Chromium |
|---|---:|---:|
| JS mutation, typing, click, form | 1.121 s | 0.333 s |
| example.com | 2.191 s | 0.320 s |
| Python JSON documentation | 2.123 s | 0.509 s |
| GitHub repository | 19.313 s | 2.091 s |

These single-run times include page creation, navigation or fixture setup, extraction and screenshot. Kitesurf ran first; network/cache/order effects were uncontrolled. Both browsers passed the interaction fixture and basic Python/GitHub text markers, and saved screenshots. Both failed the same stale `Example Domain` assertion on example.com while returning identical 917-character text; this is not candidate-specific evidence of a browser defect. Screenshots were not visually adjudicated. Initial Chromium profile creation failed; an isolated explicit userDataDir fixed the rerun. Raw measurement projection: [initial-smoke.json](results/initial-smoke.json), including failed attempts. Full retrieved pages/private paths are not redistributed.

**No measured memory advantage, statistical speed conclusion, semantic answer-quality comparison or production recommendation follows.** The current harness below is a subsequent expanded implementation, not the exact historical smoke generator.

## Run the expanded evaluation

Requires Node.js >=22, a separately built running local Kitesurf endpoint and installed Chromium. We do not install or start either browser engine for you. Kitesurf retains its upstream Apache-2.0 licensing; only this harness is MIT licensed.

```sh
npm ci
export KITESURF_WS=ws://127.0.0.1:18787/devtools/browser
export CHROMIUM_PATH=/path/to/chromium
export KITESURF_REVISION=4a2903813a22b08d4f3cc64a4b35339d0293a5d1
ROUNDS=2 npm test
```

Useful overrides: `CASES=fixture,python`, `OUTPUT=results/my-run.json`, `SCREENSHOTS=1`. Run within an external bounded timeout. Existing logged-in profiles are never used. Profiles and full extraction artifacts remain local and gitignored. Do not expose unauthenticated Kitesurf publicly. Inspect output before publishing; caller-provided URLs/errors may need additional privacy review.

For the tested Kitesurf build, follow upstream setup with pinned source, pnpm 9.15.4 and Bazelisk. Build `//packages/engine:dev_build`, then run the engine package's documented Wrangler local configuration (including its fixture-worker config) on loopback with distinct ports. No cloud deployment is required for this local experiment. A source pin is not a promise of byte-identical builds.

### What is measured

- Fixed synthetic JS/form/async/details/table/code/link checks.
- Public Python, GitHub, Cloudflare, arXiv, Wikipedia, MDN and NVIDIA forum pages.
- Predeclared case-insensitive text markers, structured extraction counts, response status and challenge hints.
- Two rounds alternating browser order, fresh pages but **not guaranteed cold browser/server/network caches**.
- Time through extraction, with optional screenshot time reported separately.

A successful HTTP response is not successful content access. Marker matches are only coarse evidence of target content; structural counts and text length are not quality scores. A challenge heuristic is not authoritative. Public pages can change, local fixtures provide stronger ground truth. No bypass of authentication, paywalls, CAPTCHAs or rate limits is attempted. We do not score whether an LLM produces a better final answer.

## Status

Expanded screen complete: **32 observations**, with two rounds across seven public pages plus an interactive fixture. Chromium passed public-page markers in 14/14 attempts; Kitesurf passed 12/14, returning an unsupported-browser notice on the NVIDIA forum. Both passed all fixture checks twice. See [FINDINGS.md](FINDINGS.md), including a shadow-DOM follow-up that explains why longer extracted text is not necessarily higher quality.

Recompute counts with `python3 scripts/summarize.py`. Optional diagnostics: `node scripts/forum-followup.cjs` (KITESURF_WS) and `node scripts/mdn-followup.cjs` (both browser environment variables); run after the primary harness creates artifacts directories. These follow-ups do not retroactively change the primary marker scores.

No process-tree RSS measurements yet. Existing production browser unchanged. Preliminary upstream report: https://github.com/cloudflare/kitesurf/issues/132 .
