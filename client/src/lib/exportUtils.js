/**
 * exportUtils.js
 * Shared PDF and Excel export helpers for Everest Textile Mills reports.
 *
 * Usage:
 *   import { exportPDF, exportExcel } from '../../lib/exportUtils'
 *
 *   exportPDF({
 *     title: 'Wage Sheet',
 *     subtitle: 'September 2026',
 *     columns: ['Name', 'Role', 'Days', 'Net Pay'],
 *     rows: [['Ravi', 'Weaver', 26, '₹12,000'], ...],
 *   })
 *
 *   exportExcel({
 *     filename: 'WageSheet_Sep2026',
 *     sheetName: 'Wages',
 *     columns: ['Name', 'Role', 'Days', 'Net Pay'],
 *     rows: [['Ravi', 'Weaver', 26, 12000], ...],
 *   })
 */

// ─── PDF ────────────────────────────────────────────────────────────────────

export async function exportPDF({ title, subtitle = '', columns, rows, filename }) {
  // Lazy-load to avoid adding to the main bundle unless actually used
  const { default: jsPDF }    = await import('jspdf')
  const { default: autoTable } = await import('jspdf-autotable')

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })

  // Header bar
  doc.setFillColor(99, 102, 241) // indigo-500
  doc.rect(0, 0, 297, 18, 'F')

  // Company name
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('Everest Textile Mills', 14, 7)

  // Report title
  doc.setFontSize(14)
  doc.text(title, 14, 14)

  // Subtitle + date on right
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  const dateStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  doc.text(`${subtitle}   •   Generated: ${dateStr}`, 297 - 14, 14, { align: 'right' })

  // Table
  autoTable(doc, {
    startY: 22,
    head: [columns],
    body: rows,
    styles: {
      fontSize: 8,
      cellPadding: 3,
      textColor: [30, 30, 30],
      overflow: 'linebreak',
    },
    headStyles: {
      fillColor: [39, 39, 42],   // zinc-800
      textColor: [161, 161, 170], // zinc-400
      fontStyle: 'bold',
      fontSize: 7.5,
    },
    alternateRowStyles: { fillColor: [250, 250, 250] },
    tableLineColor: [228, 228, 231],
    tableLineWidth: 0.1,
    margin: { left: 14, right: 14 },
  })

  // Page numbers
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(7)
    doc.setTextColor(161, 161, 170)
    doc.text(`Page ${i} of ${pageCount}`, 297 - 14, 207, { align: 'right' })
  }

  doc.save(`${filename || title.replace(/\s+/g, '_')}.pdf`)
}


// ─── Excel ──────────────────────────────────────────────────────────────────

export async function exportExcel({ filename, sheetName = 'Sheet1', columns, rows }) {
  const XLSX = await import('xlsx')

  const wsData = [columns, ...rows]
  const ws     = XLSX.utils.aoa_to_sheet(wsData)

  // Auto-fit column widths
  const colWidths = columns.map((col, i) => ({
    wch: Math.max(
      col.length,
      ...rows.map(r => String(r[i] ?? '').length),
    ) + 2,
  }))
  ws['!cols'] = colWidths

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, sheetName)
  XLSX.writeFile(wb, `${filename || sheetName}.xlsx`)
}
