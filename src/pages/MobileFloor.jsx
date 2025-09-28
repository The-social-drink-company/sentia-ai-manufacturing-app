import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const CELL_STATUS = [
  { cell: 'Line A', status: 'Running', output: '68 units/hr', issue: 'None' },
  { cell: 'Line B', status: 'Changeover', output: '—', issue: 'Setup in progress' },
  { cell: 'Line C', status: 'Running', output: '72 units/hr', issue: 'Monitoring fill variance' }
]

const MobileFloor = () => (
  <main className="mx-auto flex max-w-md flex-col gap-4 p-6">
    <header className="text-left">
      <h1 className="text-2xl font-semibold tracking-tight">Shop floor overview</h1>
      <p className="text-sm text-muted-foreground">Status summary for each bottling line.</p>
    </header>

    {CELL_STATUS.map((cell) => (
      <Card key={cell.cell}>
        <CardHeader>
          <CardTitle className="text-lg">{cell.cell}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          <p className="text-muted-foreground">Status: <span className="text-foreground">{cell.status}</span></p>
          <p className="text-muted-foreground">Output: <span className="text-foreground">{cell.output}</span></p>
          <p className="text-muted-foreground">Issue: <span className="text-foreground">{cell.issue}</span></p>
        </CardContent>
      </Card>
    ))}
  </main>
)

export default MobileFloor
