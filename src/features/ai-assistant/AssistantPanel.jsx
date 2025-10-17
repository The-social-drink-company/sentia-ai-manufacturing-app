import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const CONVERSATIONS = [
  {
    user: 'Finance',
    prompt: 'Summarise today’s working capital movement',
    response: 'Net improvement of $320K driven by APAC collections.',
  },
  {
    user: 'Operations',
    prompt: 'Any risks in production supply?',
    response: 'Supplier OTH-421 flagged for lead-time variance.',
  },
  {
    user: 'Treasury',
    prompt: 'What is the 14-day cash outlook?',
    response: 'Projected closing cash $8.1M with 92% model confidence.',
  },
]

const AssistantPanel = () => (
  <Card>
    <CardHeader>
      <CardTitle>AI assistant activity</CardTitle>
    </CardHeader>
    <CardContent className="space-y-3 text-sm">
      {CONVERSATIONS.map((item, index) => (
        <div key={index} className="rounded-lg border border-border bg-muted/30 p-3">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-foreground">{item.user}</p>
            <Badge variant="outline">MCP</Badge>
          </div>
          <p className="text-xs text-muted-foreground">Prompt: {item.prompt}</p>
          <p className="text-xs text-primary mt-1">Response: {item.response}</p>
        </div>
      ))}
    </CardContent>
  </Card>
)

export default AssistantPanel
