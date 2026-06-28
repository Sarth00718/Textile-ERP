const { stringify } = require('csv-stringify/sync');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');

/**
 * Sends `rows` as a downloadable CSV file.
 * columns: [{ key, header }]
 */
function exportCsv(res, filename, columns, rows) {
  const records = rows.map((row) => columns.map((c) => row[c.key] ?? ''));
  const csv = stringify(records, { header: true, columns: columns.map((c) => c.header) });
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
  res.send(csv);
}

/**
 * Sends `rows` as a downloadable Excel (.xlsx) file.
 */
async function exportExcel(res, filename, columns, rows, sheetName = 'Sheet1') {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(sheetName);
  sheet.columns = columns.map((c) => ({ header: c.header, key: c.key, width: c.width || 20 }));
  sheet.getRow(1).font = { bold: true };
  rows.forEach((row) => sheet.addRow(row));

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}.xlsx"`);
  await workbook.xlsx.write(res);
  res.end();
}

/**
 * Sends `rows` as a downloadable PDF table.
 */
function exportPdf(res, filename, title, columns, rows) {
  const doc = new PDFDocument({ margin: 30, size: 'A4', layout: 'landscape' });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}.pdf"`);
  doc.pipe(res);

  doc.fontSize(16).text(title, { align: 'center' });
  doc.moveDown();

  const colWidth = (doc.page.width - 60) / columns.length;
  let y = doc.y;

  doc.fontSize(9).font('Helvetica-Bold');
  columns.forEach((c, i) => {
    doc.text(String(c.header), 30 + i * colWidth, y, { width: colWidth, ellipsis: true });
  });
  doc.moveDown();
  y = doc.y;
  doc.font('Helvetica');

  rows.forEach((row) => {
    if (y > doc.page.height - 50) {
      doc.addPage();
      y = 30;
    }
    columns.forEach((c, i) => {
      const val = row[c.key];
      doc.text(val === null || val === undefined ? '' : String(val), 30 + i * colWidth, y, {
        width: colWidth,
        ellipsis: true,
      });
    });
    y += 18;
  });

  doc.end();
}

module.exports = { exportCsv, exportExcel, exportPdf };
