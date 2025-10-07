import jsPDF from 'jspdf'
import { format } from 'date-fns'

/**
 * Generate and download a PDF report
 * @param {Object} reportData - Complete report data
 */
export const generatePDF = async (reportData) => {
  try {
    const pdf = new jsPDF('p', 'mm', 'a4')
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const margin = 20
    const contentWidth = pageWidth - (margin * 2)
    let currentY = margin

    // Company branding and header
    addHeader(pdf, pageWidth, margin)
    currentY += 30

    // Report title and metadata
    pdf.setFontSize(24)
    pdf.setFont(undefined, 'bold')
    pdf.text('Manufacturing Dashboard Report', margin, currentY)
    currentY += 15

    pdf.setFontSize(12)
    pdf.setFont(undefined, 'normal')
    pdf.setTextColor(100, 100, 100)
    pdf.text(`Generated: ${format(new Date(), 'MMMM d, yyyy \'at\' h:mm a')}`, margin, currentY)
    currentY += 8
    pdf.text(`Report Period: ${reportData.metadata.reportPeriod.formatted}`, margin, currentY)
    currentY += 20

    // Executive Summary
    if (reportData.executiveSummary) {
      currentY = addExecutiveSummary(pdf, reportData.executiveSummary, margin, currentY, contentWidth, pageHeight)
    }

    // Add each selected section
    for (const [, sectionData] of Object.entries(reportData.sections)) {
      // Check if we need a new page before starting section
      const estimatedSectionHeight = 80 // Estimate section header + some content
      if (currentY + estimatedSectionHeight > pageHeight - 40) {
        pdf.addPage()
        addHeader(pdf, pageWidth, margin)
        currentY = margin + 30
      }

      currentY = addSection(pdf, sectionData, margin, currentY, contentWidth, pageHeight)
      currentY += 15
    }

    // Footer
    addFooter(pdf, pageWidth, pageHeight, margin)

    // Generate filename with timestamp
    const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm')
    const filename = `Sentia_Manufacturing_Report_${timestamp}.pdf`

    // Save the PDF
    pdf.save(filename)
    
    return { success: true, filename }
  } catch (error) {
    console.error('Error generating PDF:', error)
    throw new Error(`Failed to generate PDF: ${error.message}`)
  }
}

/**
 * Add company header to PDF
 */
const addHeader = (pdf, pageWidth, margin) => {
  // Company logo area (placeholder)
  pdf.setFillColor(59, 130, 246) // Blue color
  pdf.roundedRect(margin, margin, 30, 15, 2, 2, 'F')
  
  // Company logo text
  pdf.setFontSize(14)
  pdf.setFont(undefined, 'bold')
  pdf.setTextColor(255, 255, 255)
  pdf.text('S', margin + 12, margin + 10)
  
  // Company name
  pdf.setFontSize(16)
  pdf.setFont(undefined, 'bold')
  pdf.setTextColor(0, 0, 0)
  pdf.text('Sentia Manufacturing', margin + 35, margin + 8)
  
  pdf.setFontSize(12)
  pdf.setFont(undefined, 'normal')
  pdf.setTextColor(100, 100, 100)
  pdf.text('Enterprise Manufacturing Intelligence', margin + 35, margin + 16)
  
  // Horizontal line
  pdf.setDrawColor(200, 200, 200)
  pdf.line(margin, margin + 25, pageWidth - margin, margin + 25)
}

/**
 * Add executive summary section
 */
const addExecutiveSummary = (pdf, summary, margin, startY, contentWidth, pageHeight) => {
  let currentY = startY
  
  // Section header
  pdf.setFontSize(18)
  pdf.setFont(undefined, 'bold')
  pdf.setTextColor(0, 0, 0)
  pdf.text('Executive Summary', margin, currentY)
  currentY += 12

  // Status
  pdf.setFontSize(12)
  pdf.setFont(undefined, 'bold')
  pdf.text('Status:', margin, currentY)
  pdf.setFont(undefined, 'normal')
  pdf.text(summary.status, margin + 20, currentY)
  currentY += 10

  // Report Period
  pdf.setFont(undefined, 'bold')
  pdf.text('Period:', margin, currentY)
  pdf.setFont(undefined, 'normal')
  pdf.text(summary.reportPeriod, margin + 20, currentY)
  currentY += 15

  // Key Insights
  if (summary.keyInsights && summary.keyInsights.length > 0) {
    pdf.setFont(undefined, 'bold')
    pdf.text('Key Insights:', margin, currentY)
    currentY += 8

    pdf.setFont(undefined, 'normal')
    summary.keyInsights.forEach((insight) => {
      const lines = pdf.splitTextToSize(`• ${insight}`, contentWidth - 10)
      lines.forEach(line => {
        if (currentY > pageHeight - 30) {
          pdf.addPage()
          addHeader(pdf, pdf.internal.pageSize.getWidth(), margin)
          currentY = margin + 40
        }
        pdf.text(line, margin + 5, currentY)
        currentY += 6
      })
      currentY += 2
    })
  }

  // Recommendation
  if (summary.recommendation) {
    currentY += 5
    pdf.setFont(undefined, 'bold')
    pdf.text('Recommendation:', margin, currentY)
    currentY += 8
    
    pdf.setFont(undefined, 'normal')
    const recLines = pdf.splitTextToSize(summary.recommendation, contentWidth)
    recLines.forEach(line => {
      if (currentY > pageHeight - 30) {
        pdf.addPage()
        addHeader(pdf, pdf.internal.pageSize.getWidth(), margin)
        currentY = margin + 40
      }
      pdf.text(line, margin, currentY)
      currentY += 6
    })
  }

  return currentY + 20
}

/**
 * Add a data section to the PDF
 */
const addSection = (pdf, sectionData, margin, startY, contentWidth, pageHeight) => {
  let currentY = startY
  
  // Section header
  pdf.setFontSize(16)
  pdf.setFont(undefined, 'bold')
  pdf.setTextColor(0, 0, 0)
  pdf.text(sectionData.title, margin, currentY)
  currentY += 10

  // Section description
  if (sectionData.description) {
    pdf.setFontSize(11)
    pdf.setFont(undefined, 'normal')
    pdf.setTextColor(100, 100, 100)
    const descLines = pdf.splitTextToSize(sectionData.description, contentWidth)
    descLines.forEach(line => {
      pdf.text(line, margin, currentY)
      currentY += 6
    })
    currentY += 10
  }

  // Add section data based on type
  if (sectionData.data && Array.isArray(sectionData.data)) {
    // Check if we have enough space for the table, if not break to new page
    if (currentY > pageHeight - 120) {
      pdf.addPage()
      addHeader(pdf, pdf.internal.pageSize.getWidth(), margin)
      currentY = margin + 30
      
      // Re-add section header on new page
      pdf.setFontSize(16)
      pdf.setFont(undefined, 'bold')
      pdf.setTextColor(0, 0, 0)
      pdf.text(sectionData.title, margin, currentY)
      currentY += 15
    }
    
    if (sectionData.title === 'Capital Position' || sectionData.title === 'Performance Metrics') {
      // KPI format
      currentY = addKPITable(pdf, sectionData.data, margin, currentY, contentWidth)
    } else if (sectionData.title === 'Regional Performance') {
      // Regional table format
      currentY = addRegionalTable(pdf, sectionData.data, margin, currentY, contentWidth)
    } else if (sectionData.title === 'P&L Analysis') {
      // P&L table format
      currentY = addPLTable(pdf, sectionData.data, margin, currentY, contentWidth)
    } else if (sectionData.title === 'Product Sales Performance') {
      // Product Sales table format
      currentY = addProductSalesTable(pdf, sectionData.data, margin, currentY, contentWidth)
    } else {
      // Generic data format
      currentY = addGenericTable(pdf, sectionData.data, margin, currentY, contentWidth)
    }
  }

  // Add summary if available
  if (sectionData.summary && typeof sectionData.summary === 'object') {
    // Check if summary box fits, if not move to new page
    if (currentY > pageHeight - 60) {
      pdf.addPage()
      addHeader(pdf, pdf.internal.pageSize.getWidth(), margin)
      currentY = margin + 30
    }
    currentY += 10
    currentY = addSummaryBox(pdf, sectionData.summary, margin, currentY, contentWidth)
  }

  return currentY
}

/**
 * Add KPI table
 */
const addKPITable = (pdf, data, margin, startY, contentWidth) => {
  let currentY = startY
  const baseRowHeight = 12
  const headerHeight = 15
  const col1Width = contentWidth * 0.4  // 40% for metric name
  const col2Width = contentWidth * 0.25 // 25% for value  
  const col3Width = contentWidth * 0.35 // 35% for description

  // Table header
  pdf.setFillColor(245, 245, 245)
  pdf.rect(margin, currentY, contentWidth, headerHeight, 'F')
  pdf.setFontSize(11)
  pdf.setFont(undefined, 'bold')
  pdf.text('Metric', margin + 5, currentY + 10)
  pdf.text('Value', margin + col1Width + 5, currentY + 10)
  pdf.text('Description', margin + col1Width + col2Width + 5, currentY + 10)
  currentY += headerHeight

  // Table rows
  pdf.setFont(undefined, 'normal')
  data.forEach((item, index) => {
    // Calculate required height for this row
    const metricText = pdf.splitTextToSize(item.label, col1Width - 10)
    const helperText = pdf.splitTextToSize(item.helper || '', col3Width - 10)
    const rowHeight = Math.max(baseRowHeight, Math.max(metricText.length, helperText.length) * 6 + 6)
    
    // Check if row fits on current page
    const pageHeight = pdf.internal.pageSize.getHeight()
    if (currentY + rowHeight > pageHeight - 30) {
      pdf.addPage()
      addHeader(pdf, pdf.internal.pageSize.getWidth(), margin)
      currentY = margin + 30
      
      // Re-add table header
      pdf.setFillColor(245, 245, 245)
      pdf.rect(margin, currentY, contentWidth, headerHeight, 'F')
      pdf.setFontSize(11)
      pdf.setFont(undefined, 'bold')
      pdf.text('Metric', margin + 5, currentY + 10)
      pdf.text('Value', margin + col1Width + 5, currentY + 10)
      pdf.text('Description', margin + col1Width + col2Width + 5, currentY + 10)
      currentY += headerHeight
      pdf.setFont(undefined, 'normal')
    }
    
    if (index % 2 === 0) {
      pdf.setFillColor(250, 250, 250)
      pdf.rect(margin, currentY, contentWidth, rowHeight, 'F')
    }
    
    // Draw text with proper wrapping
    pdf.text(metricText, margin + 5, currentY + 8)
    pdf.setFont(undefined, 'bold')
    pdf.text(item.value, margin + col1Width + 5, currentY + 8)
    pdf.setFont(undefined, 'normal')
    pdf.text(helperText, margin + col1Width + col2Width + 5, currentY + 8)
    currentY += rowHeight
  })

  return currentY
}

/**
 * Add regional performance table
 */
const addRegionalTable = (pdf, data, margin, startY, contentWidth) => {
  let currentY = startY
  const rowHeight = 12
  const headerHeight = 15
  const col1Width = contentWidth * 0.33  // 33% for region
  const col2Width = contentWidth * 0.33  // 33% for revenue
  const col3Width = contentWidth * 0.34  // 34% for EBITDA

  // Table header
  pdf.setFillColor(245, 245, 245)
  pdf.rect(margin, currentY, contentWidth, headerHeight, 'F')
  pdf.setFontSize(11)
  pdf.setFont(undefined, 'bold')
  pdf.text('Region', margin + 5, currentY + 10)
  pdf.text('Revenue', margin + col1Width + 5, currentY + 10)
  pdf.text('EBITDA', margin + col1Width + col2Width + 5, currentY + 10)
  currentY += headerHeight

  // Table rows
  pdf.setFont(undefined, 'normal')
  data.forEach((item, index) => {
    if (index % 2 === 0) {
      pdf.setFillColor(250, 250, 250)
      pdf.rect(margin, currentY, contentWidth, rowHeight, 'F')
    }
    
    pdf.text(item.region, margin + 5, currentY + 8)
    pdf.text(`$${(item.revenue / 1000000).toFixed(1)}M`, margin + col1Width + 5, currentY + 8)
    pdf.text(`$${(item.ebitda / 1000000).toFixed(1)}M`, margin + col1Width + col2Width + 5, currentY + 8)
    currentY += rowHeight
  })

  return currentY
}

/**
 * Add P&L table
 */
const addPLTable = (pdf, data, margin, startY, contentWidth) => {
  let currentY = startY
  const rowHeight = 10
  const headerHeight = 12
  const col1Width = contentWidth * 0.25  // 25% for month
  const col2Width = contentWidth * 0.25  // 25% for revenue
  const col3Width = contentWidth * 0.25  // 25% for gross profit
  const col4Width = contentWidth * 0.25  // 25% for EBITDA

  // Show only last 6 months for space
  const recentData = data.slice(-6)

  // Table header
  pdf.setFillColor(245, 245, 245)
  pdf.rect(margin, currentY, contentWidth, headerHeight, 'F')
  pdf.setFontSize(10)
  pdf.setFont(undefined, 'bold')
  pdf.text('Month', margin + 5, currentY + 8)
  pdf.text('Revenue', margin + col1Width + 5, currentY + 8)
  pdf.text('Gross Profit', margin + col1Width + col2Width + 5, currentY + 8)
  pdf.text('EBITDA', margin + col1Width + col2Width + col3Width + 5, currentY + 8)
  currentY += headerHeight

  // Table rows
  pdf.setFont(undefined, 'normal')
  recentData.forEach((item, index) => {
    if (index % 2 === 0) {
      pdf.setFillColor(250, 250, 250)
      pdf.rect(margin, currentY, contentWidth, rowHeight, 'F')
    }
    
    pdf.text(item.month, margin + 5, currentY + 7)
    pdf.text(`$${item.revenue}K`, margin + col1Width + 5, currentY + 7)
    pdf.text(`$${item.grossProfit}K`, margin + col1Width + col2Width + 5, currentY + 7)
    pdf.text(`$${item.ebitda}K`, margin + col1Width + col2Width + col3Width + 5, currentY + 7)
    currentY += rowHeight
  })

  return currentY
}

/**
 * Add product sales performance table
 */
const addProductSalesTable = (pdf, data, margin, startY, contentWidth) => {
  let currentY = startY
  const rowHeight = 12
  const headerHeight = 15
  const col1Width = contentWidth * 0.25  // 25% for product name
  const col2Width = contentWidth * 0.25  // 25% for revenue
  const col3Width = contentWidth * 0.25  // 25% for units
  const col4Width = contentWidth * 0.25  // 25% for growth/market share

  // Table header
  pdf.setFillColor(245, 245, 245)
  pdf.rect(margin, currentY, contentWidth, headerHeight, 'F')
  pdf.setFontSize(11)
  pdf.setFont(undefined, 'bold')
  pdf.text('Product', margin + 5, currentY + 10)
  pdf.text('Revenue', margin + col1Width + 5, currentY + 10)
  pdf.text('Units Sold', margin + col1Width + col2Width + 5, currentY + 10)
  pdf.text('Growth Rate', margin + col1Width + col2Width + col3Width + 5, currentY + 10)
  currentY += headerHeight

  // Table rows
  pdf.setFont(undefined, 'normal')
  data.forEach((item, index) => {
    // Check if row fits on current page
    const pageHeight = pdf.internal.pageSize.getHeight()
    if (currentY + rowHeight > pageHeight - 30) {
      pdf.addPage()
      addHeader(pdf, pdf.internal.pageSize.getWidth(), margin)
      currentY = margin + 30
      
      // Re-add table header
      pdf.setFillColor(245, 245, 245)
      pdf.rect(margin, currentY, contentWidth, headerHeight, 'F')
      pdf.setFontSize(11)
      pdf.setFont(undefined, 'bold')
      pdf.text('Product', margin + 5, currentY + 10)
      pdf.text('Revenue', margin + col1Width + 5, currentY + 10)
      pdf.text('Units Sold', margin + col1Width + col2Width + 5, currentY + 10)
      pdf.text('Growth Rate', margin + col1Width + col2Width + col3Width + 5, currentY + 10)
      currentY += headerHeight
      pdf.setFont(undefined, 'normal')
    }
    
    if (index % 2 === 0) {
      pdf.setFillColor(250, 250, 250)
      pdf.rect(margin, currentY, contentWidth, rowHeight, 'F')
    }
    
    // Extract data from item (handle both object and JSON string formats)
    let product, revenue, units, growthRate
    
    if (typeof item === 'string') {
      try {
        const parsedItem = JSON.parse(item)
        product = parsedItem.product || 'N/A'
        revenue = parsedItem.revenue || 0
        units = parsedItem.units || 0
        growthRate = parsedItem.growthRate || 0
      } catch (e) {
        product = 'Invalid Data'
        revenue = 0
        units = 0
        growthRate = 0
      }
    } else if (typeof item === 'object') {
      product = item.product || item.name || 'N/A'
      revenue = item.revenue || item.sales || 0
      units = item.units || item.unitsSold || 0
      growthRate = item.growthRate || item.growth || 0
    } else {
      product = String(item)
      revenue = 0
      units = 0
      growthRate = 0
    }
    
    // Format the data
    const formattedRevenue = revenue >= 1000000 ? `$${(revenue / 1000000).toFixed(1)}M` : `$${Math.round(revenue / 1000)}K`
    const formattedUnits = units >= 1000 ? `${Math.round(units / 1000)}K` : `${units}`
    const formattedGrowth = `${Number(growthRate).toFixed(1)}%`
    
    pdf.text(product, margin + 5, currentY + 8)
    pdf.text(formattedRevenue, margin + col1Width + 5, currentY + 8)
    pdf.text(formattedUnits, margin + col1Width + col2Width + 5, currentY + 8)
    pdf.text(formattedGrowth, margin + col1Width + col2Width + col3Width + 5, currentY + 8)
    currentY += rowHeight
  })

  return currentY
}

/**
 * Add generic table for other data types
 */
const addGenericTable = (pdf, data, margin, startY, contentWidth) => {
  let currentY = startY
  
  // Simple list format for generic data
  pdf.setFontSize(11)
  pdf.setFont(undefined, 'normal')
  
  data.forEach(item => {
    const text = typeof item === 'object' ? JSON.stringify(item) : String(item)
    const lines = pdf.splitTextToSize(`• ${text}`, contentWidth)
    lines.forEach(line => {
      pdf.text(line, margin + 5, currentY)
      currentY += 6
    })
    currentY += 2
  })

  return currentY
}

/**
 * Add summary box
 */
const addSummaryBox = (pdf, summary, margin, startY, contentWidth) => {
  // Check if summary exists and has content
  if (!summary || typeof summary !== 'object') {
    return startY
  }
  
  let currentY = startY
  let contentHeight = 0
  
  // Calculate required height based on content
  pdf.setFontSize(10)
  let summaryLines = []
  
  if (summary.status) {
    summaryLines.push(`Status: ${summary.status}`)
  }
  if (summary.keyInsight) {
    const insightLines = pdf.splitTextToSize(summary.keyInsight, contentWidth - 10)
    summaryLines = summaryLines.concat(insightLines)
  }
  
  // Additional summary fields
  if (summary.totalRevenue) {
    summaryLines.push(`Total Revenue: ${summary.totalRevenue}`)
  }
  if (summary.avgGrossMargin) {
    summaryLines.push(`Average Gross Margin: ${summary.avgGrossMargin}`)
  }
  if (summary.bestMonth) {
    summaryLines.push(`Best performing month: ${summary.bestMonth}`)
  }
  if (summary.topRegion) {
    summaryLines.push(`Top performing region: ${summary.topRegion}`)
  }
  
  // If no content, don't draw the box
  if (summaryLines.length === 0) {
    return startY
  }
  
  contentHeight = summaryLines.length * 5 + 15 // 5px per line + padding
  
  // Summary box background
  pdf.setFillColor(249, 250, 251)
  pdf.setDrawColor(200, 200, 200)
  pdf.roundedRect(margin, currentY, contentWidth, contentHeight, 2, 2, 'FD')
  
  currentY += 8
  pdf.setFontSize(10)
  pdf.setFont(undefined, 'bold')
  pdf.text('Summary:', margin + 5, currentY)
  currentY += 6
  
  // Add summary content
  pdf.setFont(undefined, 'normal')
  summaryLines.forEach(line => {
    pdf.text(line, margin + 5, currentY)
    currentY += 5
  })
  
  return startY + contentHeight + 5
}

/**
 * Add footer to PDF
 */
const addFooter = (pdf, pageWidth, pageHeight, margin) => {
  const footerY = pageHeight - 15
  
  // Footer line
  pdf.setDrawColor(200, 200, 200)
  pdf.line(margin, footerY - 5, pageWidth - margin, footerY - 5)
  
  // Footer text
  pdf.setFontSize(9)
  pdf.setTextColor(100, 100, 100)
  pdf.text('Sentia Manufacturing Dashboard Report', margin, footerY)
  
  // Page number
  const pageNum = pdf.internal.getCurrentPageInfo().pageNumber
  pdf.text(`Page ${pageNum}`, pageWidth - margin - 20, footerY)
  
  // Generation timestamp
  pdf.text(`Generated: ${format(new Date(), 'yyyy-MM-dd HH:mm')}`, pageWidth - margin - 70, footerY + 5)
}

export default generatePDF