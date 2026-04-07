"""
fix_encoding.py
Fixes CP437 mojibake in index.html and youtubePlayer.js.

Root cause: UTF-8 bytes of Unicode chars (─, —, 🌙, etc.) were
interpreted as CP437 codepoints and written back as UTF-8, producing
garbage like "ΓòÉ" (═), "ΓÇö" (—), "≡ƒîÖ" (🌙), etc.

Fix strategy: ordered string replacement table (longer sequences first
to avoid partial matches), covering every distinct pattern found in the
files.
"""

import re

REPLACEMENTS = [
    # ── 4-char sequences: emoji (F0 9F xx yy, 4-byte UTF-8) ──────────────
    # Country flag pairs must come before their halves
    ('≡ƒç║≡ƒç╕', '🇺🇸'),   # U+1F1FA U+1F1F8
    ('≡ƒç¿≡ƒçª', '🇨🇦'),   # U+1F1E8 U+1F1E6
    # Individual emoji
    ('≡ƒîÖ', '🌙'),         # U+1F319 crescent moon
    ('≡ƒôà', '📅'),         # U+1F4C5 calendar
    ('≡ƒÜÇ', '🚀'),         # U+1F680 rocket
    ('≡ƒöÖ', '🔙'),         # U+1F519 back-arrow (splashdown return)
    ('≡ƒîè', '🌊'),         # U+1F30A wave (just in case)

    # ── 3-char sequences: BMP Unicode (E2 xx yy, 3-byte UTF-8) ───────────
    # Box-drawing used in JS/CSS comment separators
    ('ΓòÉ', '═'),           # U+2550 double horizontal
    ('ΓöÇ', '─'),           # U+2500 light horizontal
    # Symbols used in rendered output
    ('ΓÇö', '—'),           # U+2014 em dash  ← most common
    ('ΓÇô', '—'),           # U+2013 en dash  (used as fallback "—" in timestamps)
    ('ΓÇª', '…'),           # U+2026 ellipsis
    ('ΓùÅ', '●'),           # U+25CF black circle (status badge, Earth bullet)
    ('Γùë', '◉'),           # U+25C9 fisheye (Moon bullet)
    ('Γû▓', '▲'),           # U+25B2 up-triangle (Orion marker)
    ('Γû╢', '▶'),           # U+25B6 right-triangle (play / AROW button)
    ('ΓåÆ', '→'),           # U+2192 rightwards arrow (comments: API → fallback)
    ('Γûá', '✓'),           # U+2713 check mark (just in case)

    # ── 2-char sequences: Latin-1 supplement (C2 xx, 2-byte UTF-8) ───────
    ('┬╖', '·'),            # U+00B7 middle dot  (src-tags: NASA·DONKI etc.)
    ('┬░', '°'),            # U+00B0 degree sign  (attitude angles)
    ('┬╡', 'µ'),            # U+00B5 micro sign (just in case)
]

def fix_file(path):
    with open(path, encoding='utf-8') as f:
        text = f.read()

    original = text
    for bad, good in REPLACEMENTS:
        text = text.replace(bad, good)

    changed = sum(1 for a, b in zip(original, text) if a != b)
    if text != original:
        with open(path, 'w', encoding='utf-8') as f:
            f.write(text)
        print(f'Fixed {path}  ({changed} char positions changed)')
    else:
        print(f'No changes needed: {path}')

if __name__ == '__main__':
    fix_file(r'd:\GT\dev\artemis2\index.html')
    fix_file(r'd:\GT\dev\artemis2\scripts\youtubePlayer.js')
