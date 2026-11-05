"""Rebuild bundled scan backgrounds from the supplied packet (requires PyMuPDF).

Run from the repository root: python scripts/prepare_scan_template.py
The app uses only the resulting JPEGs, with no Python runtime dependency.
"""
import hashlib
import json
from pathlib import Path

import pymupdf

source = Path('.ref/Assessment Master Packet.pdf')
target = Path('public/assessment-packet')
target.mkdir(parents=True, exist_ok=True)
document = pymupdf.open(source)
if len(document) != 15:
    raise ValueError('The scan layout requires the original 15-page packet. Update the field map before using another template.')
pages = []
for index, page in enumerate(document):
    expected = (792, 612) if index == 8 else (612, 792)
    if (page.rect.width, page.rect.height) != expected:
        raise ValueError(f'Unexpected dimensions on page {index + 1}; update the scan field map first.')
    filename = f'page-{index + 1:02}.jpg'
    page.get_pixmap(matrix=pymupdf.Matrix(2, 2), colorspace=pymupdf.csGRAY).save(
        str(target / filename), jpg_quality=92
    )
    pages.append({'file': filename, 'width': page.rect.width, 'height': page.rect.height})
(target / 'manifest.json').write_text(json.dumps({
    'source': source.name,
    'sha256': hashlib.sha256(source.read_bytes()).hexdigest(),
    'dpi': 144,
    'pages': pages,
}, indent=2) + '\n', encoding='utf-8')
print(f'Prepared {len(pages)} packet pages in {target}')
