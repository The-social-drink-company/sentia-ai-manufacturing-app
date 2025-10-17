// Minimal test component for Financial Reports
const MinimalFinancialReports = () => {
  console.log('[DEBUG] MinimalFinancialReports component rendering...')

  return (
    <div className="p-6 space-y-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <h1 className="text-2xl font-bold text-green-800 mb-4">
            Financial Reports - Test Component
          </h1>
          <div className="space-y-3 text-green-700">
            <p>✅ Minimal component loaded successfully</p>
            <p>✅ Route navigation is working</p>
            <p>✅ Component is rendering without errors</p>
            <p className="text-sm text-green-600 mt-4">
              This is a minimal test component to verify the route is working correctly. If you can
              see this message, the routing and lazy loading are functioning properly.
            </p>
          </div>

          <div className="mt-6 p-4 bg-white border border-green-300 rounded">
            <h3 className="font-medium text-green-800 mb-2">Debug Information:</h3>
            <ul className="text-sm text-green-600 space-y-1">
              <li>• Component: MinimalFinancialReports</li>
              <li>• Route: /app/reports</li>
              <li>• Status: Loaded successfully</li>
              <li>• Time: {new Date().toLocaleString()}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MinimalFinancialReports
