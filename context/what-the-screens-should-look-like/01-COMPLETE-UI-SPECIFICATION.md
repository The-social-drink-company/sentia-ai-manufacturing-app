# Sentia Manufacturing Dashboard - Complete UI Specification

## 🎨 User Interface Overview

The Sentia Manufacturing Dashboard is a world-class, enterprise-level manufacturing intelligence platform with comprehensive AI/ML capabilities and MCP (Model Context Protocol) integration. The interface features a modern, responsive design with dark/light theme support, real-time data updates, and intuitive navigation.

---

## 🏗️ Application Architecture

### **Technology Stack:**
- **Frontend:** React 18 + Vite + Tailwind CSS
- **UI Components:** Heroicons, Radix UI, shadcn/ui
- **Charts:** Recharts for data visualization
- **State Management:** Zustand + TanStack Query
- **Authentication:** Clerk with RBAC
- **Real-time:** Server-Sent Events (SSE)
- **AI/ML:** OpenAI GPT-4, Claude 3, Custom ML Models
- **MCP:** Anthropic's Model Context Protocol for data integration

### **Color Scheme:**
- **Primary:** Blue (#3B82F6)
- **Success:** Green (#10B981)
- **Warning:** Yellow (#F59E0B)
- **Danger:** Red (#EF4444)
- **Background:** Light (#F9FAFB) / Dark (#111827)
- **Text:** Dark (#1F2937) / Light (#F3F4F6)

---

## 📱 Responsive Design Breakpoints

- **Mobile:** < 640px (sm)
- **Tablet:** 640px - 1024px (md)
- **Desktop:** 1024px - 1280px (lg)
- **Wide:** > 1280px (xl)
- **Ultra-wide:** > 1536px (2xl)

---

## 🎯 Core UI Components

### 1. **Navigation Header**
- Fixed top position with glass morphism effect
- Company logo and brand name
- User profile dropdown with avatar
- Theme toggle (dark/light mode)
- Notification bell with badge
- Quick actions menu

### 2. **Sidebar Navigation**
- Collapsible sidebar with icons and labels
- Hierarchical menu structure
- Active state indicators
- Role-based menu visibility
- Keyboard shortcuts displayed

### 3. **Main Content Area**
- Breadcrumb navigation
- Page title and description
- Action buttons toolbar
- Content grid/cards layout
- Footer with version info

---

## 🖥️ Main Application Screens

### **1. Landing Page (/)**
**Purpose:** Entry point with company branding and login

**Visual Design:**
- Full-screen hero section with gradient background
- Animated botanical ingredient particles
- Glass morphism login card
- Company mission statement
- Feature highlights with icons

**Key Elements:**
```
┌─────────────────────────────────────────────────┐
│  SENTIA                              🌙 □ ─ ✕   │
├─────────────────────────────────────────────────┤
│                                                  │
│     Welcome to Sentia Manufacturing             │
│     ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━             │
│                                                  │
│     🌿 Functional Botanical Beverages           │
│                                                  │
│     ┌─────────────────────────────┐            │
│     │  Email: ________________     │            │
│     │  Password: _____________     │            │
│     │                              │            │
│     │  [Sign In with Clerk]  🔐   │            │
│     │  [SSO Login]           🌐   │            │
│     └─────────────────────────────┘            │
│                                                  │
│     • AI-Powered Manufacturing                  │
│     • Real-time Quality Control                 │
│     • Predictive Maintenance                    │
│                                                  │
└─────────────────────────────────────────────────┘
```

---

### **2. Main Dashboard (/dashboard)**
**Purpose:** Central command center with KPI overview

**Visual Layout:**
```
┌─────────────────────────────────────────────────────────┐
│  🏭 Sentia Dashboard    👤 John Doe  🔔 3  ⚙️  🌙       │
├────┬────────────────────────────────────────────────────┤
│ 📊 │  Good Morning, John! Here's your facility overview │
│ 🤖 ├────────────────────────────────────────────────────┤
│ 📈 │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐│
│ 🏭 │  │Production│ │ Quality  │ │Inventory │ │ Orders  ││
│ 💰 │  │  94.5%   │ │  98.7%   │ │ 2,450    │ │  156    ││
│ ⚡ │  │    ↑2.3% │ │    ↑1.2% │ │   units  │ │  today  ││
│ 📦 │  └──────────┘ └──────────┘ └──────────┘ └────────┘│
│ ⚙️ ├────────────────────────────────────────────────────┤
│ 💬 │  ┌─────────────────────┐  ┌──────────────────────┐│
│ ❓ │  │ Production Timeline │  │ Quality Metrics      ││
│    │  │ ▁▃▅▇█▇▅▃▁         │  │ ●───●───●───●       ││
│    │  │ 6AM      12PM   6PM│  │ Pass Rate: 98.7%    ││
│    │  └─────────────────────┘  └──────────────────────┘│
│    │  ┌─────────────────────┐  ┌──────────────────────┐│
│    │  │ AI Predictions  🤖  │  │ Maintenance Alerts  ││
│    │  │ Next 7 days: ↑15%  │  │ ⚠️ Tank #3 in 48hrs  ││
│    │  │ Confidence: 92.8%   │  │ ✓ Line A: Healthy   ││
│    │  └─────────────────────┘  └──────────────────────┘│
└────┴────────────────────────────────────────────────────┘
```

**Interactive Features:**
- Drag-and-drop widget customization
- Real-time data updates via SSE
- Click-through to detailed views
- Export data to CSV/PDF
- Customizable date ranges

---

### **3. AI-Enhanced Dashboard (/ai-dashboard)**
**Purpose:** Advanced AI/ML features and MCP integration

**Visual Design:**
```
┌──────────────────────────────────────────────────────────┐
│  🤖 AI Manufacturing Intelligence     [MCP: Connected]   │
├──────────────────────────────────────────────────────────┤
│ Tabs: [Overview] [Forecasting] [MCP] [Digital Twin] [Chat]│
├──────────────────────────────────────────────────────────┤
│                                                           │
│  MCP Connection Status                                   │
│  ┌────────────────────────────────────────────────────┐ │
│  │ 🟢 Unleashed ERP     Connected  2.3M records       │ │
│  │ 🟢 Xero Financial    Connected  890K records       │ │
│  │ 🟢 Vector Database   Connected  15.7M vectors      │ │
│  │ 🟡 IoT Sensors       Connecting 1.2M datapoints    │ │
│  └────────────────────────────────────────────────────┘ │
│                                                           │
│  ML Ensemble Forecasting                                 │
│  ┌────────────────────────────────────────────────────┐ │
│  │ Model Selection: [✓ GPT-4] [✓ Claude] [✓ ARIMA]   │ │
│  │                                                     │ │
│  │         Demand Forecast - GABA Red                  │ │
│  │         ╱╲    ┌─────────────────┐                  │ │
│  │        ╱  ╲   │ Accuracy: 94.3%  │                 │ │
│  │    ___╱    ╲  │ MAPE: 5.7%       │                 │ │
│  │   ╱         ╲ │ Confidence: 92.8%│                 │ │
│  │  ╱           ╲└─────────────────┘                  │ │
│  │ ╱                                                   │ │
│  │ Day 1    7    14    21    30                       │ │
│  └────────────────────────────────────────────────────┘ │
│                                                           │
│  Digital Twin 3D Visualization                           │
│  ┌────────────────────────────────────────────────────┐ │
│  │     [▶ Start Simulation] [⏸ Pause] [↻ Reset]      │ │
│  │                                                     │ │
│  │    ┌─┐ ┌─┐ ┌─┐   Mixing Tanks (Active)           │ │
│  │    │█│ │▒│ │ │   75% | 100% | 0%                  │ │
│  │    └─┘ └─┘ └─┘                                    │ │
│  │         ↓                                          │ │
│  │    ═══════════   Bottling Lines                   │ │
│  │    [=====>   ]   Line A: 850 units/hr             │ │
│  │    [==       ]   Line B: Maintenance              │ │
│  │         ↓                                          │ │
│  │    ┌───────┐     Warehouse                        │ │
│  │    │  82%  │     Finished Goods                   │ │
│  │    └───────┘                                       │ │
│  └────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

**AI/ML Features Available:**
1. **Multi-Model Ensemble Forecasting**
   - GPT-4, Claude 3, ARIMA, Prophet, Facebook Prophet
   - Confidence intervals and model comparison
   - 7/14/30/90 day predictions

2. **MCP Protocol Integration**
   - Real-time data from 8+ manufacturing systems
   - Vector database with 15.7M embeddings
   - Semantic search across all data
   - Cross-system intelligent querying

3. **Digital Twin Simulation**
   - 3D facility visualization
   - Real-time equipment monitoring
   - What-if scenario analysis
   - Predictive maintenance scheduling

4. **Computer Vision Quality Control**
   - Botanical ingredient inspection
   - Defect detection with 99.7% accuracy
   - Real-time quality scoring
   - Automated alert generation

5. **Conversational AI Agent**
   - Natural language queries
   - Context-aware responses
   - Manufacturing expertise
   - Action recommendations

---

### **4. Working Capital Dashboard (/working-capital)**
**Purpose:** Financial management and cash flow optimization

**Visual Layout:**
```
┌──────────────────────────────────────────────────────────┐
│  💰 Working Capital Management         Period: This Month│
├──────────────────────────────────────────────────────────┤
│                                                           │
│  Key Metrics                                             │
│  ┌─────────┬─────────┬─────────┬─────────┐            │
│  │ Cash    │ AR      │ AP      │ DPO     │            │
│  │ $2.4M   │ $1.8M   │ $0.9M   │ 45 days │            │
│  │ ↑12%    │ ↓5%     │ ↑3%     │ ↑2 days │            │
│  └─────────┴─────────┴─────────┴─────────┘            │
│                                                           │
│  Cash Flow Forecast (AI-Powered)                        │
│  ┌────────────────────────────────────────────────────┐ │
│  │     $3M ┤                    ╱────                 │ │
│  │         │              ╱────╱                      │ │
│  │     $2M ┤        ╱────╱                           │ │
│  │         │  ╱────╱                                  │ │
│  │     $1M ┤─╱                                        │ │
│  │         │                                           │ │
│  │      $0 └────┬────┬────┬────┬────┬────┬────┬────  │ │
│  │           W1   W2   W3   W4   W5   W6   W7   W8    │ │
│  └────────────────────────────────────────────────────┘ │
│                                                           │
│  Optimization Recommendations (ML-Generated)             │
│  ┌────────────────────────────────────────────────────┐ │
│  │ 🎯 Extend payment terms with Supplier A by 10 days │ │
│  │ 📈 Accelerate collection from Customer B           │ │
│  │ 💡 Optimize inventory levels for GABA Gold         │ │
│  │ ⚡ Refinance short-term debt at 2.3% lower rate    │ │
│  └────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

---

### **5. Admin Portal (/admin)**
**Purpose:** User management and system configuration

**Visual Design:**
```
┌──────────────────────────────────────────────────────────┐
│  ⚙️ Administration Panel              👤 Admin User      │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  [Users] [Roles] [Permissions] [Settings] [Audit Logs]   │
│                                                           │
│  User Management                                         │
│  ┌────────────────────────────────────────────────────┐ │
│  │ Search: [_______________] [+ Add User]             │ │
│  ├────────────────────────────────────────────────────┤ │
│  │ Name          Email              Role      Status  │ │
│  │ John Doe      john@sentia.com    Admin     Active  │ │
│  │ Jane Smith    jane@sentia.com    Manager   Active  │ │
│  │ Bob Wilson    bob@sentia.com     Operator  Active  │ │
│  │ Alice Brown   alice@sentia.com   Viewer    Pending │ │
│  └────────────────────────────────────────────────────┘ │
│                                                           │
│  Role-Based Access Control (RBAC)                       │
│  ┌────────────────────────────────────────────────────┐ │
│  │ Role: Manager                                      │ │
│  │ Permissions:                                       │ │
│  │ ☑ View Dashboard    ☑ Edit Production             │ │
│  │ ☑ View Reports     ☐ Manage Users                │ │
│  │ ☑ Export Data      ☐ System Settings              │ │
│  └────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

---

## 🤖 AI/ML/MCP Features Integration

### **1. MCP (Model Context Protocol) Features**

**Available MCP Servers:**
```javascript
// MCP Server Connections
const mcpServers = {
  unleashed: {
    name: "Unleashed ERP",
    status: "connected",
    dataTypes: ["production", "inventory", "BOM", "orders"],
    records: "2.3M",
    capabilities: ["query", "update", "subscribe"]
  },
  xero: {
    name: "Xero Financial",
    status: "connected",
    dataTypes: ["invoices", "payments", "accounts"],
    records: "890K",
    capabilities: ["query", "sync"]
  },
  vectorDB: {
    name: "Vector Database",
    status: "connected",
    dataTypes: ["embeddings", "semantic-search"],
    vectors: "15.7M",
    capabilities: ["search", "similarity", "clustering"]
  },
  iotSensors: {
    name: "IoT Sensor Network",
    status: "connected",
    dataTypes: ["temperature", "pressure", "vibration"],
    dataPoints: "1.2M/day",
    capabilities: ["stream", "alert", "predict"]
  }
};
```

**MCP Query Interface:**
```
┌─────────────────────────────────────────────────────┐
│  MCP Intelligent Query                              │
│  ┌─────────────────────────────────────────────────┐│
│  │ Query: "Show me production bottlenecks"         ││
│  └─────────────────────────────────────────────────┘│
│                                                      │
│  Results from 4 MCP servers:                        │
│  • Unleashed: Line B showing 23% lower throughput   │
│  • IoT Sensors: Temperature spike at Station 3      │
│  • Vector DB: Similar issue found 14 days ago       │
│  • AI Analysis: Recommend maintenance in 24 hours   │
└─────────────────────────────────────────────────────┘
```

### **2. Machine Learning Models**

**Ensemble Forecasting Models:**
```javascript
const mlModels = {
  gpt4: {
    name: "GPT-4 Predictor",
    accuracy: 91.2,
    features: ["Natural language patterns", "Context awareness"],
    color: "#10b981"
  },
  claude: {
    name: "Claude Analytics",
    accuracy: 92.8,
    features: ["Analytical reasoning", "Risk assessment"],
    color: "#f59e0b"
  },
  ensemble: {
    name: "AI Ensemble",
    accuracy: 94.3,
    features: ["Multi-model fusion", "Adaptive weighting"],
    color: "#8b5cf6"
  },
  arima: {
    name: "ARIMA Classic",
    accuracy: 87.5,
    features: ["Time series", "Seasonal decomposition"],
    color: "#6366f1"
  },
  prophet: {
    name: "Facebook Prophet",
    accuracy: 89.3,
    features: ["Holiday effects", "Trend changes"],
    color: "#ef4444"
  }
};
```

### **3. Real-time AI Features**

**Server-Sent Events (SSE) Streams:**
```javascript
// Real-time data streams
const sseStreams = {
  'ai-status': 'Overall AI system health',
  'mcp-update': 'MCP server status changes',
  'forecast-update': 'New predictions available',
  'maintenance-alert': 'Equipment maintenance needed',
  'quality-inspection': 'Quality check results',
  'supply-chain-update': 'Inventory changes',
  'digital-twin-sync': 'Simulation updates',
  'analytics-update': 'KPI changes',
  'agent-metrics': 'AI agent performance'
};
```

### **4. 24/7 AI Agent Monitoring**

**Agent Status Panel:**
```
┌─────────────────────────────────────────────────────┐
│  24/7 AI Agent Monitoring                          │
│  ┌─────────────────────────────────────────────────┐│
│  │ Agent          Status    Uptime   Last Check   ││
│  │ MCP            🟢 Active  99.9%    2 sec ago   ││
│  │ Forecasting    🟢 Active  99.8%    5 sec ago   ││
│  │ Maintenance    🟢 Active  99.7%    8 sec ago   ││
│  │ Quality        🟢 Active  99.9%    3 sec ago   ││
│  │ Supply Chain   🟢 Active  99.6%    7 sec ago   ││
│  │ Digital Twin   🟢 Active  99.5%    4 sec ago   ││
│  │ Execution      🟢 Active  99.8%    6 sec ago   ││
│  │ Analytics      🟢 Active  99.9%    2 sec ago   ││
│  └─────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────┘
```

---

## 🎨 UI Component Library

### **Buttons:**
```html
<!-- Primary Button -->
<button class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 
               transition-colors duration-200 flex items-center gap-2">
  <svg class="w-5 h-5">...</svg>
  Primary Action
</button>

<!-- Secondary Button -->
<button class="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg 
               hover:bg-gray-300 transition-colors duration-200">
  Secondary Action
</button>

<!-- Danger Button -->
<button class="px-4 py-2 bg-red-600 text-white rounded-lg 
               hover:bg-red-700 transition-colors duration-200">
  Delete
</button>
```

### **Cards:**
```html
<!-- KPI Card -->
<div class="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
  <div class="flex items-start justify-between">
    <div>
      <p class="text-sm text-gray-500">Metric Label</p>
      <p class="text-2xl font-bold mt-1">94.5%</p>
      <p class="text-sm text-green-600 mt-1">↑ 2.3%</p>
    </div>
    <div class="p-3 bg-blue-100 rounded-lg">
      <svg class="w-6 h-6 text-blue-600">...</svg>
    </div>
  </div>
</div>
```

### **Data Tables:**
```html
<!-- Responsive Table -->
<div class="overflow-x-auto">
  <table class="min-w-full divide-y divide-gray-200">
    <thead class="bg-gray-50">
      <tr>
        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 
                   uppercase tracking-wider">Column 1</th>
        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 
                   uppercase tracking-wider">Column 2</th>
      </tr>
    </thead>
    <tbody class="bg-white divide-y divide-gray-200">
      <tr class="hover:bg-gray-50">
        <td class="px-6 py-4 whitespace-nowrap">Data 1</td>
        <td class="px-6 py-4 whitespace-nowrap">Data 2</td>
      </tr>
    </tbody>
  </table>
</div>
```

### **Modal Dialogs:**
```html
<!-- Modal Container -->
<div class="fixed inset-0 z-50 overflow-y-auto">
  <div class="flex items-center justify-center min-h-screen p-4">
    <!-- Backdrop -->
    <div class="fixed inset-0 bg-black bg-opacity-50 transition-opacity"></div>
    
    <!-- Modal Content -->
    <div class="relative bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
      <h3 class="text-lg font-semibold mb-4">Modal Title</h3>
      <p class="text-gray-600 mb-6">Modal content goes here...</p>
      <div class="flex justify-end gap-3">
        <button class="px-4 py-2 bg-gray-200 rounded-lg">Cancel</button>
        <button class="px-4 py-2 bg-blue-600 text-white rounded-lg">Confirm</button>
      </div>
    </div>
  </div>
</div>
```

---

## 🎯 User Interactions

### **Keyboard Shortcuts:**
- `Ctrl/Cmd + K` - Quick search
- `Ctrl/Cmd + /` - Command palette
- `G then D` - Go to dashboard
- `G then A` - Go to AI dashboard
- `G then W` - Go to working capital
- `Esc` - Close modals
- `?` - Show help

### **Drag & Drop:**
- Dashboard widgets can be rearranged
- Files can be dropped for import
- Production schedule items draggable

### **Real-time Updates:**
- Live data refresh every 5 seconds
- Push notifications for critical alerts
- WebSocket connections for chat
- SSE for dashboard metrics

---

## 📱 Mobile Responsive Design

### **Mobile Navigation:**
```
┌─────────────────────────┐
│ ☰ Sentia          👤 🔔 │ <- Hamburger menu
├─────────────────────────┤
│ Good Morning!           │
│                         │
│ ┌─────────┬─────────┐  │
│ │ Prod.   │ Quality │  │ <- Stacked cards
│ │ 94.5%   │ 98.7%   │  │
│ └─────────┴─────────┘  │
│                         │
│ ┌─────────────────────┐│
│ │ Production Timeline ││ <- Full width
│ │ ▁▃▅▇█▇▅▃▁         ││
│ └─────────────────────┘│
└─────────────────────────┘
```

### **Touch Gestures:**
- Swipe left/right for tab navigation
- Pull down to refresh
- Pinch to zoom charts
- Long press for context menu

---

## 🔒 Security & Permissions UI

### **Role-Based UI Elements:**
```javascript
// Component visibility based on role
const UIPermissions = {
  admin: {
    canSeeAdminPanel: true,
    canEditUsers: true,
    canViewFinancials: true,
    canManageAI: true
  },
  manager: {
    canSeeAdminPanel: false,
    canEditUsers: false,
    canViewFinancials: true,
    canManageAI: true
  },
  operator: {
    canSeeAdminPanel: false,
    canEditUsers: false,
    canViewFinancials: false,
    canManageAI: false
  }
};
```

---

## 🌈 Theme System

### **Light Theme:**
```css
:root {
  --bg-primary: #FFFFFF;
  --bg-secondary: #F9FAFB;
  --text-primary: #1F2937;
  --text-secondary: #6B7280;
  --border: #E5E7EB;
}
```

### **Dark Theme:**
```css
[data-theme="dark"] {
  --bg-primary: #1F2937;
  --bg-secondary: #111827;
  --text-primary: #F3F4F6;
  --text-secondary: #9CA3AF;
  --border: #374151;
}
```

---

## 🚀 Performance Indicators

### **Loading States:**
```html
<!-- Skeleton Loader -->
<div class="animate-pulse">
  <div class="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
  <div class="h-4 bg-gray-200 rounded w-1/2"></div>
</div>

<!-- Spinner -->
<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
```

### **Error States:**
```html
<!-- Error Message -->
<div class="bg-red-50 border border-red-200 rounded-lg p-4">
  <div class="flex items-center">
    <svg class="w-5 h-5 text-red-600 mr-2">...</svg>
    <p class="text-red-800">Error message here</p>
  </div>
</div>
```

---

## 📊 Data Visualization

### **Chart Types:**
1. **Line Charts** - Production trends
2. **Bar Charts** - Comparative metrics
3. **Pie Charts** - Distribution analysis
4. **Area Charts** - Cumulative data
5. **Scatter Plots** - Correlation analysis
6. **Heatmaps** - Quality inspection results
7. **Gantt Charts** - Production scheduling
8. **3D Visualizations** - Digital twin

---

## 🎉 Success Indicators

### **Success Messages:**
```html
<!-- Success Toast -->
<div class="fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 
            rounded-lg shadow-lg flex items-center gap-2 animate-slide-in">
  <svg class="w-5 h-5">✓</svg>
  <span>Operation completed successfully!</span>
</div>
```

---

This comprehensive UI specification ensures your Sentia Manufacturing Dashboard delivers a world-class user experience with advanced AI/ML capabilities and seamless MCP integration.