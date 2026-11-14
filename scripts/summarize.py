#!/usr/bin/env python3
"""Validate completeness and summarize recorded expanded measurements."""
import json
from pathlib import Path
from statistics import median

root = Path(__file__).resolve().parents[1]
data = json.loads((root / 'results/expanded.json').read_text())
rows = data['rows']
engines = ['kitesurf', 'chromium']
cases = ['fixture', 'python', 'github', 'cloudflare', 'arxiv', 'wikipedia', 'mdn', 'nvidia']
expected = {(e, r, c) for e in engines for r in (1, 2) for c in cases}
actual = [(x['engine'], x['round'], x.get('case')) for x in rows]
assert len(actual) == len(expected) and set(actual) == expected, 'Missing, duplicate or unexpected rows'
summary = {'rows': len(rows), 'engines': {}, 'median_ms': {}}
for e in engines:
    public = [x for x in rows if x['engine'] == e and x['case'] != 'fixture']
    fixtures = [x for x in rows if x['engine'] == e and x['case'] == 'fixture']
    summary['engines'][e] = {'public_attempts': len(public), 'all_markers_passed': sum(x.get('all_markers', False) for x in public), 'fixture_attempts': len(fixtures), 'fixture_passed': sum(x.get('fixture_pass', False) for x in fixtures)}
for c in cases:
    summary['median_ms'][c] = {e: median(x['elapsed_ms'] for x in rows if x['engine'] == e and x['case'] == c) for e in engines}
(root / 'results/summary.json').write_text(json.dumps(summary, indent=2) + '\n')
print(json.dumps(summary, indent=2))
