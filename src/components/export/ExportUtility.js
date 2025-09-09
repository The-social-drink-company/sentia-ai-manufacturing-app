// Export utility functions for various formats

export class ExportUtility {
  static async exportToCSV(data, filename = 'export.csv', columns = null) {
    if (!data || data.length === 0) {
      throw new Error('No data to export');
    }

    // Use provided columns or extract from first data item
    const headers = columns || Object.keys(data[0]);
    
    // Create CSV header
    const csvHeader = headers.join(',');
    
    // Create CSV rows
    const csvRows = data.map(row => {
      return headers.map(header => {
        const value = row[header];
        
        // Handle special cases
        if (value === null || value === undefined) {
          return '';
        }
        
        // Escape quotes and wrap in quotes if contains comma, quote, or newline
        const stringValue = String(value);
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        
        return stringValue;
      }).join(',');
    });
    
    const csvContent = [csvHeader, ...csvRows].join('\n');
    
    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    this.downloadBlob(blob, filename);
  }

  static async exportToJSON(data, filename = 'export.json') {
    const jsonContent = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
    this.downloadBlob(blob, filename);
  }

  static async exportToExcel(data, filename = 'export.xlsx', sheetName = 'Sheet1') {
    try {
      // Dynamic import to avoid bundling if not used
      const XLSX = await import('xlsx');
      
      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(data);
      
      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
      
      // Write to buffer
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      
      // Create blob and download
      const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      this.downloadBlob(blob, filename);
      
    } catch (error) {
      console.error('Excel export failed:', error);
      // Fallback to CSV
      this.exportToCSV(data, filename.replace('.xlsx', '.csv'));
    }
  }

  static async exportToPDF(data, filename = 'export.pdf', options = {}) {
    try {
      // Dynamic import to avoid bundling if not used
      const jsPDF = await import('jspdf');
      const autoTable = await import('jspdf-autotable');
      
      const doc = new jsPDF.default(options.orientation || 'portrait');
      
      // Add title if provided
      if (options.title) {
        doc.setFontSize(16);
        doc.text(options.title, 20, 20);
      }
      
      // Prepare table data
      const headers = options.columns || Object.keys(data[0] || {});
      const tableData = data.map(row => 
        headers.map(header => String(row[header] || ''))
      );
      
      // Add table
      doc.autoTable({
        head: [headers],
        body: tableData,
        startY: options.title ? 30 : 20,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [66, 139, 202] },
        ...options.tableOptions
      });
      
      // Add footer if provided
      if (options.footer) {
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
          doc.setPage(i);
          doc.setFontSize(8);
          doc.text(options.footer, 20, doc.internal.pageSize.height - 10);
        }
      }
      
      // Save the PDF
      doc.save(filename);
      
    } catch (error) {
      console.error('PDF export failed:', error);
      // Fallback to CSV
      this.exportToCSV(data, filename.replace('.pdf', '.csv'));
    }
  }

  static downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  static formatDataForExport(data, formatters = {}) {
    return data.map(row => {
      const formattedRow = { ...row };
      
      Object.keys(formatters).forEach(key => {
        if (row[key] !== undefined) {
          formattedRow[key] = formatters[key](row[key]);
        }
      });
      
      return formattedRow;
    });
  }

  static generateFilename(baseName, format, timestamp = true) {
    let filename = baseName;
    
    if (timestamp) {
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');
      filename += `_${dateStr}_${timeStr}`;
    }
    
    return `${filename}.${format}`;
  }

  // Chart export utilities
  static async exportChartAsPNG(chartRef, filename = 'chart.png') {
    if (!chartRef || !chartRef.current) {
      throw new Error('Chart reference not available');
    }

    try {
      // Get the chart canvas
      const canvas = chartRef.current.querySelector('canvas');
      if (!canvas) {
        throw new Error('Chart canvas not found');
      }

      // Convert to blob and download
      canvas.toBlob((blob) => {
        this.downloadBlob(blob, filename);
      });
      
    } catch (error) {
      console.error('Chart PNG export failed:', error);
      throw error;
    }
  }

  static async exportChartAsSVG(chartRef, filename = 'chart.svg') {
    if (!chartRef || !chartRef.current) {
      throw new Error('Chart reference not available');
    }

    try {
      // Get the SVG element
      const svg = chartRef.current.querySelector('svg');
      if (!svg) {
        throw new Error('Chart SVG not found');
      }

      // Serialize SVG
      const serializer = new XMLSerializer();
      const svgString = serializer.serializeToString(svg);
      
      // Create blob and download
      const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      this.downloadBlob(blob, filename);
      
    } catch (error) {
      console.error('Chart SVG export failed:', error);
      throw error;
    }
  }

  // Batch export utilities
  static async exportMultipleSheets(dataSheets, filename = 'export.xlsx') {
    try {
      const XLSX = await import('xlsx');
      
      // Create workbook
      const wb = XLSX.utils.book_new();
      
      // Add each sheet
      dataSheets.forEach(({ data, sheetName }) => {
        const ws = XLSX.utils.json_to_sheet(data);
        XLSX.utils.book_append_sheet(wb, ws, sheetName);
      });
      
      // Write to buffer
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      
      // Create blob and download
      const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      this.downloadBlob(blob, filename);
      
    } catch (error) {
      console.error('Multi-sheet export failed:', error);
      throw error;
    }
  }

  // Report generation utilities
  static generateSummaryReport(data, title, summaryStats = {}) {
    const report = {
      title,
      generatedAt: new Date().toISOString(),
      summary: {
        totalRecords: data.length,
        ...summaryStats
      },
      data
    };

    return report;
  }

  static async exportReport(reportData, format = 'pdf', options = {}) {
    const filename = this.generateFilename(
      options.filename || reportData.title || 'report',
      format
    );

    switch (format.toLowerCase()) {
      case 'csv':
        await this.exportToCSV(reportData.data, filename, options.columns);
        break;
      case 'json':
        await this.exportToJSON(reportData, filename);
        break;
      case 'excel':
      case 'xlsx':
        await this.exportToExcel(reportData.data, filename, options.sheetName);
        break;
      case 'pdf':
        await this.exportToPDF(reportData.data, filename, {
          title: reportData.title,
          footer: `Generated on ${new Date(reportData.generatedAt).toLocaleDateString()}`,
          ...options
        });
        break;
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }
}

export default ExportUtility;