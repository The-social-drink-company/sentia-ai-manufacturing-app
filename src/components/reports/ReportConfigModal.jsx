import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CalendarIcon, FileDown, Eye, Clock } from 'lucide-react'
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns'
import { cn } from '@/lib/utils'
import { generateReport } from '@/services/reportGenerator'
import { generatePDF } from '@/services/pdfService'
import { toast } from 'sonner'

const ReportConfigModal = ({ open, onClose }) => {
  // Default to last month
  const lastMonth = subMonths(new Date(), 1)
  const [dateRange, setDateRange] = useState({
    from: startOfMonth(lastMonth),
    to: endOfMonth(lastMonth),
  })
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [generating, setGenerating] = useState(false)

  // Default report sections - most important KPIs selected by default
  const [selectedSections, setSelectedSections] = useState({
    capitalKpis: true,
    performanceKpis: true,
    plAnalysis: true,
    regionalContribution: true,
    stockLevels: false,
    productSales: false,
  })

  const reportSections = [
    {
      id: 'capitalKpis',
      label: 'Capital Position',
      description: 'Working capital, cash coverage, intercompany exposure',
      recommended: true,
    },
    {
      id: 'performanceKpis',
      label: 'Performance Metrics',
      description: 'Revenue, units sold, gross margin',
      recommended: true,
    },
    {
      id: 'plAnalysis',
      label: 'P&L Analysis',
      description: 'Monthly profit and loss trends chart',
      recommended: true,
    },
    {
      id: 'regionalContribution',
      label: 'Regional Performance',
      description: 'Revenue and EBITDA by region',
      recommended: true,
    },
    {
      id: 'stockLevels',
      label: 'Stock Levels',
      description: 'Current inventory status and levels',
      recommended: false,
    },
    {
      id: 'productSales',
      label: 'Product Sales',
      description: 'Sales performance by product line',
      recommended: false,
    },
  ]

  const handleSectionToggle = (sectionId, checked) => {
    setSelectedSections(prev => ({
      ...prev,
      [sectionId]: checked,
    }))
  }

  const handleSelectAll = (recommended = false) => {
    if (recommended) {
      // Select only recommended sections
      const newSections = {}
      reportSections.forEach(section => {
        newSections[section.id] = section.recommended
      })
      setSelectedSections(newSections)
    } else {
      // Select all sections
      const newSections = {}
      reportSections.forEach(section => {
        newSections[section.id] = true
      })
      setSelectedSections(newSections)
    }
  }

  const handleDeselectAll = () => {
    const newSections = {}
    reportSections.forEach(section => {
      newSections[section.id] = false
    })
    setSelectedSections(newSections)
  }

  const selectedCount = Object.values(selectedSections).filter(Boolean).length

  const handleGenerateReport = async () => {
    if (selectedCount === 0) {
      toast.error('Please select at least one section for your report')
      return
    }

    setGenerating(true)
    try {
      // Generate report data
      const reportData = await generateReport(selectedSections, dateRange)

      // Generate and download PDF
      await generatePDF(reportData, dateRange)

      toast.success('Report generated successfully!')
      onClose()
    } catch (error) {
      console.error('Error generating report:', error)
      toast.error('Failed to generate report. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileDown className="h-5 w-5" />
            Generate Manufacturing Report
          </DialogTitle>
          <DialogDescription>
            Create a customized report with your selected dashboard data and date range
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* Date Range Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Clock className="h-4 w-4" />
                Report Period
              </CardTitle>
              <CardDescription>
                Select the date range for your report (defaults to last month)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !dateRange && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange?.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, 'LLL dd, y')} -{' '}
                          {format(dateRange.to, 'LLL dd, y')}
                        </>
                      ) : (
                        format(dateRange.from, 'LLL dd, y')
                      )
                    ) : (
                      <span>Pick a date range</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </CardContent>
          </Card>

          {/* Report Sections Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Report Sections ({selectedCount} selected)
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleSelectAll(true)}>
                    Recommended
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleSelectAll(false)}>
                    Select All
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleDeselectAll}>
                    Clear All
                  </Button>
                </div>
              </CardTitle>
              <CardDescription>Choose which sections to include in your report</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {reportSections.map(section => (
                  <div
                    key={section.id}
                    className={cn(
                      'rounded-lg border p-4 transition-colors',
                      selectedSections[section.id]
                        ? 'border-blue-200 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300',
                      section.recommended && 'ring-1 ring-orange-200'
                    )}
                  >
                    <div className="flex items-start space-x-3">
                      <Checkbox
                        id={section.id}
                        checked={selectedSections[section.id]}
                        onCheckedChange={checked => handleSectionToggle(section.id, checked)}
                        className="mt-1"
                      />
                      <div className="flex-1 min-w-0">
                        <Label
                          htmlFor={section.id}
                          className="text-sm font-medium cursor-pointer flex items-center gap-2"
                        >
                          {section.label}
                          {section.recommended && (
                            <span className="text-xs bg-orange-100 text-orange-800 px-2 py-0.5 rounded-full">
                              Recommended
                            </span>
                          )}
                        </Label>
                        <p className="text-xs text-muted-foreground mt-1">{section.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Report Preview */}
          {selectedCount > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Report Preview</CardTitle>
                <CardDescription>Your report will include the following sections</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm space-y-2">
                  <p className="font-medium">
                    Report Period: {dateRange?.from && format(dateRange.from, 'MMMM d, yyyy')} -{' '}
                    {dateRange?.to && format(dateRange.to, 'MMMM d, yyyy')}
                  </p>
                  <p className="font-medium">Included Sections:</p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    {reportSections
                      .filter(section => selectedSections[section.id])
                      .map(section => (
                        <li key={section.id} className="text-muted-foreground">
                          {section.label} - {section.description}
                        </li>
                      ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <Separator />

        <div className="flex justify-between items-center">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>

          <Button
            onClick={handleGenerateReport}
            disabled={selectedCount === 0 || generating}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {generating ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Generating...
              </>
            ) : (
              <>
                <FileDown className="w-4 h-4 mr-2" />
                Generate PDF Report
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default ReportConfigModal
