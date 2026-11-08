"""Add the project's copyright notice to the visual guide, then publish its copy.

Run with Python plus pypdf and reportlab. Existing copyright footers are preserved.
"""
from io import BytesIO
from pathlib import Path
from shutil import copyfile
from pypdf import PdfReader, PdfWriter
from reportlab.pdfgen import canvas

ROOT = Path(__file__).resolve().parents[1]
guide = ROOT / 'output/pdf/Bond-Lab-Visual-Reaction-Guide.pdf'
notice = '© 2026 Long (LongLong10203). Licensed under the MIT License.'
reader = PdfReader(guide)
writer = PdfWriter()
writer.clone_document_from_reader(reader)
for page in writer.pages:
    if notice in (page.extract_text() or ''):
        continue
    overlay = BytesIO()
    drawing = canvas.Canvas(overlay, pagesize=(float(page.mediabox.width), float(page.mediabox.height)))
    drawing.setFont('Helvetica', 6.5)
    drawing.setFillColorRGB(0.36, 0.42, 0.39)
    drawing.drawString(35, 10, notice)
    drawing.save()
    page.merge_page(PdfReader(overlay).pages[0])
writer.add_metadata({'/Author': 'Long (LongLong10203)', '/Subject': notice})
with guide.open('wb') as output:
    writer.write(output)
public_copy = ROOT / 'public/guides/bond-lab-reactions.pdf'
public_copy.parent.mkdir(parents=True, exist_ok=True)
copyfile(guide, public_copy)
checked = PdfReader(guide)
assert len(checked.pages) == len(reader.pages)
assert all(notice in page.extract_text() for page in checked.pages)
assert public_copy.read_bytes() == guide.read_bytes()
print(f'Copyright verified on all {len(checked.pages)} pages; download copy synchronized.')
