import { fileNameFor } from './exportPptx.js';
import { STAGE_COLUMNS, footerRows, headerRows, stageRows, toLines } from './kspLayout.js';

const FONT = 'Times New Roman';
const SIZE = 22; // 11 pt, в полупунктах
// Альбомный A4 с полями 1,5 см: ширина текста в twips.
const PAGE_WIDTH = 16838 - 850 * 2;
const STAGE_WIDTHS = [2300, 4600, 3200, 2900, 2138];
const LABEL_WIDTH = 4200;

export async function exportKsp(ksp, meta) {
  const {
    AlignmentType, BorderStyle, Document, Packer, PageOrientation, Paragraph, ShadingType,
    Table, TableCell, TableRow, TextRun, WidthType,
  } = await import('docx');

  const border = { style: BorderStyle.SINGLE, size: 4, color: '808080' };
  const borders = { top: border, bottom: border, left: border, right: border };
  const margins = { top: 60, bottom: 60, left: 100, right: 100 };

  const paragraphs = (value, { bold = false, align } = {}) =>
    toLines(value).map(
      (line) =>
        new Paragraph({
          alignment: align,
          spacing: { after: 40 },
          children: [new TextRun({ text: line, bold, font: FONT, size: SIZE })],
        }),
    );

  const cell = (children, width, { shade = false, span } = {}) =>
    new TableCell({
      children,
      borders,
      margins,
      columnSpan: span,
      width: { size: width, type: WidthType.DXA },
      shading: shade ? { type: ShadingType.CLEAR, color: 'auto', fill: 'EDEDED' } : undefined,
    });

  const labelTable = (rows) =>
    new Table({
      width: { size: PAGE_WIDTH, type: WidthType.DXA },
      columnWidths: [LABEL_WIDTH, PAGE_WIDTH - LABEL_WIDTH],
      rows: rows.map(
        ([label, value]) =>
          new TableRow({
            cantSplit: true,
            children: [
              cell(paragraphs(label, { bold: true }), LABEL_WIDTH, { shade: true }),
              cell(paragraphs(value), PAGE_WIDTH - LABEL_WIDTH),
            ],
          }),
      ),
    });

  const stagesTable = new Table({
    width: { size: PAGE_WIDTH, type: WidthType.DXA },
    columnWidths: STAGE_WIDTHS,
    rows: [
      new TableRow({
        tableHeader: true,
        children: STAGE_COLUMNS.map((col, i) =>
          cell(paragraphs(col.label, { bold: true, align: AlignmentType.CENTER }), STAGE_WIDTHS[i], { shade: true }),
        ),
      }),
      ...stageRows(ksp).map(
        (stage) =>
          new TableRow({
            children: [
              cell(
                [
                  ...(stage.showPhase ? paragraphs(stage.phase, { bold: true }) : []),
                  ...paragraphs(stage.name),
                  ...paragraphs(stage.time, { bold: true }),
                ],
                STAGE_WIDTHS[0],
              ),
              cell(paragraphs(stage.teacher), STAGE_WIDTHS[1]),
              cell(paragraphs(stage.students), STAGE_WIDTHS[2]),
              cell(paragraphs(stage.assessment), STAGE_WIDTHS[3]),
              cell(paragraphs(stage.resources), STAGE_WIDTHS[4]),
            ],
          }),
      ),
    ],
  });

  const heading = (value) =>
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 240, after: 120 },
      children: [new TextRun({ text: value, bold: true, font: FONT, size: 28 })],
    });

  const footer = footerRows(ksp, meta);
  const doc = new Document({
    creator: meta.teacher || 'Помощник учителя',
    title: `КСП: ${ksp.topic}`,
    styles: { default: { document: { run: { font: FONT, size: SIZE } } } },
    sections: [
      {
        properties: {
          page: {
            size: { orientation: PageOrientation.LANDSCAPE, width: 11906, height: 16838 },
            margin: { top: 850, bottom: 850, left: 850, right: 850 },
          },
        },
        children: [
          heading('Краткосрочный (поурочный) план'),
          labelTable(headerRows(ksp, meta)),
          heading('Ход урока'),
          stagesTable,
          ...(footer.length ? [new Paragraph({ text: '' }), labelTable(footer)] : []),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileNameFor(`КСП — ${ksp.topic}`, 'docx');
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
