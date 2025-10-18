/**
 * Export Utilities
 *
 * Helper functions for exporting data in various formats:
 * - CSV export
 * - Excel export (XLSX)
 * - JSON export
 * - PDF export
 * - PNG chart export
 */

/**
 * Export data to CSV format
 *
 * @param {Object[]} data - Array of data objects
 * @param {string} filename - Output filename
 * @param {string[]} columns - Optional column order
 */
export function exportToCSV(data, filename = 'export.csv', columns = null) {
  if (!data || data.length === 0) {
    throw new Error('No data to export');
  }

  // Determine columns
  const headers = columns || Object.keys(data[0]);

  // Create CSV content
  const csvContent = [
    // Header row
    headers.join(','),
    // Data rows
    ...data.map((row) =>
      headers.map((header) => {
        const value = row[header];
        // Escape values containing commas or quotes
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value ?? '';
      }).join(',')
    ),
  ].join('\n');

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, filename);
}

/**
 * Export data to Excel format (requires XLSX library)
 *
 * @param {Object[]} data - Array of data objects
 * @param {string} filename - Output filename
 * @param {string} sheetName - Sheet name
 */
export async function exportToExcel(data, filename = 'export.xlsx', sheetName = 'Data') {
  if (!data || data.length === 0) {
    throw new Error('No data to export');
  }

  try {
    // Dynamically import XLSX library
    const XLSX = await import('xlsx');

    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(data);

    // Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);

    // Generate Excel file
    XLSX.writeFile(wb, filename);
  } catch (error) {
    console.error('Excel export failed:', error);
    throw new Error('Excel export requires XLSX library. Falling back to CSV.');
  }
}

/**
 * Export data to JSON format
 *
 * @param {any} data - Data to export
 * @param {string} filename - Output filename
 * @param {boolean} pretty - Whether to pretty-print JSON
 */
export function exportToJSON(data, filename = 'export.json', pretty = true) {
  if (data === undefined || data === null) {
    throw new Error('No data to export');
  }

  const jsonContent = pretty ? JSON.stringify(data, null, 2) : JSON.stringify(data);

  const blob = new Blob([jsonContent], { type: 'application/json' });
  downloadBlob(blob, filename);
}

/**
 * Export chart to PNG format
 *
 * @param {string|HTMLElement} chartElement - Chart element or selector
 * @param {string} filename - Output filename
 */
export async function exportChartToPNG(chartElement, filename = 'chart.png') {
  try {
    // Dynamically import html2canvas
    const html2canvas = (await import('html2canvas')).default;

    const element =
      typeof chartElement === 'string'
        ? document.querySelector(chartElement)
        : chartElement;

    if (!element) {
      throw new Error('Chart element not found');
    }

    // Render to canvas
    const canvas = await html2canvas(element, {
      backgroundColor: '#ffffff',
      scale: 2, // Higher resolution
    });

    // Convert to blob and download
    canvas.toBlob((blob) => {
      downloadBlob(blob, filename);
    });
  } catch (error) {
    console.error('PNG export failed:', error);
    throw new Error('PNG export requires html2canvas library');
  }
}

/**
 * Export report to PDF format
 *
 * @param {Object} reportData - Report data including title, charts, tables
 * @param {string} filename - Output filename
 */
export async function exportToPDF(reportData, filename = 'report.pdf') {
  try {
    // Dynamically import jsPDF
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF();

    let yPosition = 20;

    // Title
    if (reportData.title) {
      doc.setFontSize(20);
      doc.text(reportData.title, 20, yPosition);
      yPosition += 15;
    }

    // Subtitle
    if (reportData.subtitle) {
      doc.setFontSize(12);
      doc.setTextColor(100);
      doc.text(reportData.subtitle, 20, yPosition);
      yPosition += 10;
    }

    // Timestamp
    doc.setFontSize(10);
    doc.setTextColor(150);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 20, yPosition);
    yPosition += 15;

    // Summary metrics
    if (reportData.metrics && Array.isArray(reportData.metrics)) {
      doc.setFontSize(14);
      doc.setTextColor(0);
      doc.text('Key Metrics', 20, yPosition);
      yPosition += 10;

      reportData.metrics.forEach((metric) => {
        doc.setFontSize(10);
        doc.text(`${metric.label}: ${metric.value}`, 30, yPosition);
        yPosition += 7;
      });

      yPosition += 10;
    }

    // Data table
    if (reportData.data && Array.isArray(reportData.data) && reportData.data.length > 0) {
      doc.setFontSize(14);
      doc.setTextColor(0);
      doc.text('Data', 20, yPosition);
      yPosition += 10;

      // Use autoTable plugin if available
      if (doc.autoTable) {
        doc.autoTable({
          startY: yPosition,
          head: [Object.keys(reportData.data[0])],
          body: reportData.data.map((row) => Object.values(row)),
          theme: 'grid',
          styles: { fontSize: 8 },
        });
      } else {
        // Fallback: simple text output
        const headers = Object.keys(reportData.data[0]);
        doc.setFontSize(8);
        doc.text(headers.join(' | '), 20, yPosition);
        yPosition += 5;

        reportData.data.slice(0, 30).forEach((row) => {
          // Limit to 30 rows
          const values = Object.values(row).map((v) =>
            typeof v === 'number' ? v.toFixed(2) : v
          );
          doc.text(values.join(' | '), 20, yPosition);
          yPosition += 5;

          if (yPosition > 280) {
            // New page if needed
            doc.addPage();
            yPosition = 20;
          }
        });
      }
    }

    // Save PDF
    doc.save(filename);
  } catch (error) {
    console.error('PDF export failed:', error);
    throw new Error('PDF export requires jsPDF library');
  }
}

/**
 * Helper function to download blob
 *
 * @param {Blob} blob - Blob to download
 * @param {string} filename - Output filename
 */
function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Clean up
  setTimeout(() => URL.revokeObjectURL(url), 100);
}

/**
 * Format data for export
 *
 * @param {Object[]} data - Raw data
 * @param {Object} options - Formatting options
 * @returns {Object[]} Formatted data
 */
export function formatDataForExport(data, options = {}) {
  const {
    dateFormat = 'locale', // 'locale', 'iso', 'custom'
    numberFormat = 'locale', // 'locale', 'fixed', 'comma'
    includeCalculations = false,
  } = options;

  return data.map((row) => {
    const formatted = {};

    for (const [key, value] of Object.entries(row)) {
      // Format dates
      if (value instanceof Date) {
        if (dateFormat === 'iso') {
          formatted[key] = value.toISOString();
        } else if (dateFormat === 'locale') {
          formatted[key] = value.toLocaleDateString();
        } else {
          formatted[key] = value;
        }
      }
      // Format numbers
      else if (typeof value === 'number') {
        if (numberFormat === 'fixed') {
          formatted[key] = value.toFixed(2);
        } else if (numberFormat === 'comma') {
          formatted[key] = value.toLocaleString();
        } else {
          formatted[key] = value;
        }
      }
      // Keep other values as-is
      else {
        formatted[key] = value;
      }
    }

    // Add calculated fields if requested
    if (includeCalculations && row.revenue && row.cost) {
      formatted.profit = row.revenue - row.cost;
      formatted.margin = ((row.revenue - row.cost) / row.revenue) * 100;
    }

    return formatted;
  });
}

/**
 * Batch export multiple datasets
 *
 * @param {Object} datasets - Object with dataset names as keys
 * @param {string} format - Export format
 * @param {string} filename - Base filename
 */
export async function batchExport(datasets, format = 'excel', filename = 'export') {
  if (format === 'excel') {
    try {
      const XLSX = await import('xlsx');
      const wb = XLSX.utils.book_new();

      // Add each dataset as a separate sheet
      for (const [name, data] of Object.entries(datasets)) {
        const ws = XLSX.utils.json_to_sheet(data);
        XLSX.utils.book_append_sheet(wb, ws, name.substring(0, 31)); // Sheet name max 31 chars
      }

      XLSX.writeFile(wb, `${filename}.xlsx`);
    } catch (error) {
      console.error('Batch Excel export failed:', error);
      throw error;
    }
  } else if (format === 'csv') {
    // Export each dataset as separate CSV
    for (const [name, data] of Object.entries(datasets)) {
      exportToCSV(data, `${filename}-${name}.csv`);
    }
  } else {
    throw new Error(`Unsupported format for batch export: ${format}`);
  }
}

export default {
  exportToCSV,
  exportToExcel,
  exportToJSON,
  exportChartToPNG,
  exportToPDF,
  formatDataForExport,
  batchExport,
};
