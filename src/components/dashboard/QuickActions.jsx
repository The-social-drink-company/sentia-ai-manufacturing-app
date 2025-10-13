import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, Download, Settings } from 'lucide-react'
import ReportConfigModal from '@/components/reports/ReportConfigModal'

const QuickActions = () => {
  const [reportModalOpen, setReportModalOpen] = useState(false)

  const handleGenerateReport = () => {
    setReportModalOpen(true)
  }

  return (
    <>
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Quick Actions
          </CardTitle>
          <CardDescription>
            Generate reports and perform common dashboard operations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={handleGenerateReport}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white min-w-[160px]"
              size="lg"
            >
              <FileText className="h-4 w-4" />
              Generate Reports
            </Button>
            
            {/* Placeholder for future quick actions */}
            <Button
              variant="outline"
              className="flex items-center gap-2 min-w-[160px]"
              size="lg"
              disabled
            >
              <Download className="h-4 w-4" />
              Export Data
            </Button>
          </div>
          
          <p className="text-sm text-muted-foreground mt-4 text-center">
            Create customizable reports with your dashboard data and export as PDF
          </p>
        </CardContent>
      </Card>

      <ReportConfigModal
        open={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
      />
    </>
  )
}

export default QuickActions