# Expanded access and extraction findings

## Bottom line

No broader-access advantage was observed for Kitesurf in this sample. Chromium passed the predeclared content markers on all seven public pages in both rounds; Kitesurf passed six, with the NVIDIA forum failing both rounds. Both browsers passed the deterministic interactive/structured-content fixture twice. This is a small compatibility screen, not a general web coverage or semantic answer-quality benchmark.

Evidence: [expanded.json](results/expanded.json), [forum follow-up](results/forum-followup.json), [MDN follow-up](results/mdn-followup.json).

## Method

Eight cases per browser per round (seven public pages plus one inline deterministic fixture), two rounds, 32 recorded rows. Round one ran Kitesurf then Chromium; round two reversed that order. Fresh pages, identical viewport and marker lists, DOMContentLoaded then 700 ms settle. The Kitesurf runtime persisted; Chromium used a fresh profile each round. Caches, origin behavior and server warmth were not equalized. This is a disclosed asymmetry, not a controlled causal performance study. No concurrent browsing load was introduced by the harness, but the host was not reserved exclusively. Errors and missing markers remain in the denominator.

Expanded timing includes page creation, viewport setup, navigation, settling and extraction/assertions; screenshots were not enabled. These times are not directly comparable to the initial screenshot-inclusive smoke. Browser-reported strings were Chrome/145.0.0.0 for Kitesurf and Chrome/157.0.8103.38 for Chromium; Kitesurf's compatibility string does not mean it uses Chromium internally. Kitesurf source revision remains `4a2903813a22b08d4f3cc64a4b35339d0293a5d1`, Puppeteer 25.17.0, Node 24.22.2, Linux ARM64 / GB10.

## Access

All public-page navigations returned HTTP 200 in both engines. However, Kitesurf returned only a 120-character unsupported-browser notice from the NVIDIA forum, with no expected thread markers. Chromium returned the thread and passed both markers. A separate Kitesurf follow-up waited five and ten seconds: the unsupported notice persisted; a cookie banner appeared but the thread did not. We did not spoof user agents, evade challenges or attempt login. The exact unsupported feature/root cause remains unisolated.

## Quality: more text was not necessarily better

- The deterministic fixture checks heading, exact table cells, code, link destination, typing/form result, async mutation and details expansion. All seven structural/interaction checks passed on both engines in both rounds.
- On MDN, ordinary light-DOM extraction reported three `pre` blocks in Kitesurf and zero in Chromium. A separate five-second-settle follow-up traversing open shadow roots found **seven code blocks and 1,289 code characters in each**, including CSS.escape. These counts do not prove byte-identical text, but demonstrate that the apparent absence was an extraction-method issue, not proof that Chromium could not access the code.
- Kitesurf's extra MDN text included navigation/menu material; extra Wikipedia text included lengthy navigation boxes. Longer output is not evidence of higher answer quality.
- The primary checks were coarse keyword/structure tests, not complete document fidelity, visual rendering adjudication, or LLM answer correctness. Authenticated, paywalled, interactive SPA and anti-bot-heavy browsing are not qualified by this sample.

## Performance and resource scope

The per-case two-sample median timings are generated in `results/summary.json`. Kitesurf was slower on each case in these observations, including the unsupported forum result, which is not successful-work latency. No statistical significance, generalized speed ratio or memory advantage is claimed. Process-tree RSS, startup cost, energy use and concurrent-session scaling remain unmeasured.

## Recommendation

Keep Chromium as the default. Kitesurf works locally on ARM64 and is worth targeted compatibility investigation, but this screen found no site-access advantage and no established higher-quality return. Improving the extractor to handle shadow DOM is a concrete quality improvement applicable to Chromium without changing browser engines.

Upstream preliminary report: https://github.com/cloudflare/kitesurf/issues/132 . No upstream source patch is proposed. Public payload excludes full retrieved documents, credentials, browser profiles and build caches.
