import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ChartBarIcon,
  CubeIcon,
  BanknotesIcon,
  PresentationChartLineIcon,
  TruckIcon,
  BeakerIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline'

const FEATURES = [
  {
    icon: BanknotesIcon,
    title: 'Working Capital Intelligence',
    description:
      'Real-time liquidity management with AI-powered cash flow forecasting and optimization.',
  },
  {
    icon: PresentationChartLineIcon,
    title: 'Demand Forecasting & Analytics',
    description:
      'Advanced predictive models for demand planning, inventory optimization, and production scheduling.',
  },
  {
    icon: ChartBarIcon,
    title: 'Executive Dashboard',
    description:
      'Comprehensive KPI monitoring with drill-down capabilities and executive-ready reporting.',
  },
  {
    icon: CubeIcon,
    title: 'Inventory Management',
    description:
      'Smart inventory tracking with automated reorder points and supplier performance metrics.',
  },
  {
    icon: TruckIcon,
    title: 'Production Tracking',
    description:
      'Real-time production monitoring with efficiency metrics and bottleneck identification.',
  },
  {
    icon: BeakerIcon,
    title: 'Quality Control',
    description:
      'Integrated quality management with defect tracking and continuous improvement analytics.',
  },
]

const STATS = [
  { label: 'Monthly Revenue', value: '$2.54M', change: '+12.3%', positive: true },
  { label: 'Production Efficiency', value: '94.2%', change: '+2.1%', positive: true },
  { label: 'Working Capital Ratio', value: '2.76', change: '+0.15', positive: true },
  { label: 'Order Fulfillment', value: '98.5%', change: '+1.2%', positive: true },
]

const PureLandingPage = () => {
  const handleGetStarted = () => {
    // Navigate to app with Clerk
    window.location.href = '/app'
  }

  const handleViewDemo = () => {
    // Navigate to app with Clerk
    window.location.href = '/app'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Header */}
      <header className="relative z-10 px-6 py-4">
        <nav className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 p-2">
              <div className="h-full w-full rounded bg-white/20" />
            </div>
            <span className="text-xl font-bold text-white">Sentia Manufacturing</span>
          </div>
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              className="text-white hover:bg-white/10"
              onClick={handleGetStarted}
            >
              Sign In
            </Button>
            <Button
              className="bg-gradient-to-r from-blue-500 to-cyan-400"
              onClick={handleGetStarted}
            >
              Launch App
            </Button>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="relative">
        <div className="mx-auto max-w-7xl px-6 py-16 sm:py-24">
          <div className="text-center">
            <Badge
              variant="secondary"
              className="mb-6 bg-blue-500/20 text-blue-200 border-blue-400/30"
            >
              Enterprise Manufacturing Intelligence
            </Badge>
            <h1 className="text-5xl font-bold tracking-tight text-white sm:text-6xl lg:text-7xl">
              Manufacturing
              <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
                {' '}
                Intelligence
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-300">
              Transform your manufacturing operations with AI-powered analytics, real-time
              monitoring, and intelligent forecasting. Make data-driven decisions that optimize
              efficiency and profitability.
            </p>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Button
                size="lg"
                className="bg-gradient-to-r from-blue-500 to-cyan-400 text-white shadow-xl hover:shadow-blue-500/25"
                onClick={handleGetStarted}
              >
                Get Started
                <ArrowRightIcon className="ml-2 h-4 w-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10"
                onClick={handleViewDemo}
              >
                View Live Demo
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="mx-auto max-w-7xl px-6 py-12">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {STATS.map(stat => (
              <div
                key={stat.label}
                className="rounded-xl bg-white/5 p-6 backdrop-blur-sm border border-white/10"
              >
                <div className="text-sm font-medium text-slate-400">{stat.label}</div>
                <div className="mt-2 text-3xl font-bold text-white">{stat.value}</div>
                <div
                  className={`mt-1 text-sm ${stat.positive ? 'text-green-400' : 'text-red-400'}`}
                >
                  {stat.change} vs last month
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Features Section */}
        <div className="mx-auto max-w-7xl px-6 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white sm:text-4xl">
              Comprehensive Manufacturing Suite
            </h2>
            <p className="mt-4 text-lg text-slate-300">
              Everything you need to optimize your manufacturing operations
            </p>
          </div>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(feature => (
              <div
                key={feature.title}
                className="rounded-xl bg-white/5 p-8 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-colors"
              >
                <div className="flex items-center space-x-3 mb-4">
                  <div className="rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 p-2">
                    <feature.icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-white">{feature.title}</h3>
                </div>
                <p className="text-slate-300">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="mx-auto max-w-7xl px-6 py-16">
          <div className="rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 p-8 text-center">
            <h2 className="text-3xl font-bold text-white">
              Ready to Transform Your Manufacturing?
            </h2>
            <p className="mt-4 text-lg text-blue-100">
              Join leading manufacturers who trust Sentia for their operations intelligence
            </p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Button
                size="lg"
                className="bg-white text-blue-600 hover:bg-slate-100"
                onClick={handleGetStarted}
              >
                Start Free Trial
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white/30 text-white hover:bg-white/10"
                onClick={handleViewDemo}
              >
                Explore Dashboard
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default PureLandingPage
