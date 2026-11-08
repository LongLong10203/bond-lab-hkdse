"""Refresh licensing in both PDF guides and synchronize public downloads.

Run with Python plus pypdf and reportlab after replacing or recompiling a guide.
Existing project footer text is removed, not covered with an opaque rectangle.
Third-party notices and all chemistry content are preserved.
"""
from io import BytesIO
from pathlib import Path
from shutil import copyfile
from pypdf import PdfReader, PdfWriter
from pypdf.generic import TextStringObject
from reportlab.pdfgen import canvas

ROOT = Path(__file__).resolve().parents[1]
GUIDES = [
    ROOT / 'output/pdf/Bond-Lab-Visual-Reaction-Guide.pdf',
    ROOT / 'output/pdf/Bond-Lab-Reaction-Methods.pdf',
]
SOURCE_URL = 'https://github.com/LongLong10203/bond-lab-hkdse'
NOTICE = '© 2026 Long (LongLong10203) | AGPL-3.0-only'
LINK_TEXT = 'License & source: github.com/LongLong10203/bond-lab-hkdse'
LICENSE = (ROOT / 'LICENSE').read_bytes()


def is_project_notice(text):
    return '2026 Long (LongLong10203)' in text


def stamp_guide(path):
    reader = PdfReader(path)
    writer = PdfWriter()
    writer.clone_document_from_reader(reader)
    for page in writer.pages:
        # Remove older project footers even if a current footer already exists.
        contents = page.get_contents()
        if contents is not None:
            operations = contents.operations
            for operands, operator in operations:
                if operator in (b'Tj', b"'", b'"'):
                    text = str(operands[-1])
                    if is_project_notice(text) and NOTICE not in text:
                        operands[-1] = TextStringObject('')
                elif operator == b'TJ':
                    combined = ''.join(str(item) for item in operands[0] if isinstance(item, str))
                    if is_project_notice(combined) and NOTICE not in combined:
                        operands[0].clear()
            # Explicitly invalidate the serialized stream after editing operands.
            contents.operations = operations
            page.replace_contents(contents)
        if NOTICE not in (page.extract_text() or ''):
            overlay = BytesIO()
            drawing = canvas.Canvas(overlay, pagesize=(float(page.mediabox.width), float(page.mediabox.height)))
            drawing.setFont('Helvetica', 6.5)
            drawing.setFillColorRGB(0.36, 0.42, 0.39)
            drawing.drawString(35, 10, NOTICE)
            link_x = 35 + drawing.stringWidth(NOTICE, 'Helvetica', 6.5) + 12
            drawing.drawString(link_x, 10, LINK_TEXT)
            drawing.linkURL(SOURCE_URL, (link_x, 8, link_x + drawing.stringWidth(LINK_TEXT, 'Helvetica', 6.5), 18), relative=0)
            drawing.save()
            page.merge_page(PdfReader(overlay).pages[0])
        page.compress_content_streams()
    # Replace our attachment without duplicating it on successive runs.
    for attachment in list(writer.attachment_list):
        if attachment.name == 'LICENSE.txt':
            attachment.delete()
    writer.add_attachment('LICENSE.txt', LICENSE)
    writer.add_metadata({'/Author': 'Long (LongLong10203)', '/Subject': f'{NOTICE}. GNU Affero General Public License, version 3 only. {SOURCE_URL}'})
    writer.compress_identical_objects(remove_duplicates=True, remove_unreferenced=True)
    with path.open('wb') as output:
        writer.write(output)
    checked = PdfReader(path)
    assert len(checked.pages) == len(reader.pages)
    assert all((page.extract_text() or '').count(NOTICE) == 1 for page in checked.pages)
    assert all('MIT License' not in (page.extract_text() or '') for page in checked.pages)
    assert list(checked.attachments['LICENSE.txt']) == [LICENSE]
    print(f'{path.name}: AGPL notice and source link verified on {len(checked.pages)} pages; full license embedded.')


for guide in GUIDES:
    stamp_guide(guide)
public_copy = ROOT / 'public/guides/bond-lab-reactions.pdf'
public_copy.parent.mkdir(parents=True, exist_ok=True)
copyfile(GUIDES[0], public_copy)
copyfile(ROOT / 'LICENSE', ROOT / 'public/license.txt')
assert public_copy.read_bytes() == GUIDES[0].read_bytes()
print('Downloadable visual guide and license text synchronized.')
