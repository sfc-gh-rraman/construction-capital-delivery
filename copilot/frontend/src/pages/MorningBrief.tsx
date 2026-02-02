import { useEffect, useState } from 'react'
import type { NavigationContext } from '../App'
import { 
  Coffee, 
  Sun, 
  AlertTriangle, 
  TrendingDown,
  Calendar,
  CheckCircle,
  Clock,
  Sparkles
} from 'lucide-react'

interface BriefData {
  date: string
  portfolio: {
    total_projects: number
    total_budget: number
    avg_cpi: number
    avg_spi: number
    projects_over_budget: number
    projects_behind_schedule: number
  }
  alerts: Array<{
    level: string
    type: string
    project: string
    message: string
  }>
  critical_alert_count: number
  hidden_pattern: {
    pattern_name: string
    co_count: number
    total_amount: number
  } | null
  schedule_risk_count: number
  narrative: string
}

export function MorningBrief(_props: NavigationContext) {
  const [brief, setBrief] = useState<BriefData | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    fetchBrief()
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const fetchBrief = async () => {
    try {
      const res = await fetch('/api/morning-brief')
      if (res.ok) {
        const data = await res.json()
        setBrief(data)
      }
    } catch (error) {
      console.error('Failed to fetch morning brief:', error)
      // Mock data
      setBrief({
        date: new Date().toISOString().split('T')[0],
        portfolio: {
          total_projects: 12,
          total_budget: 2300000000,
          avg_cpi: 0.968,
          avg_spi: 0.975,
          projects_over_budget: 3,
          projects_behind_schedule: 2
        },
        alerts: [
          { level: 'critical', type: 'scope', project: 'Hidden Pattern', message: '156 COs share common root cause' },
          { level: 'critical', type: 'cost', project: 'Downtown Transit', message: 'CPI at 0.89' },
          { level: 'warning', type: 'schedule', project: 'Metro Blue Line', message: 'SPI at 0.88' }
        ],
        critical_alert_count: 2,
        hidden_pattern: {
          pattern_name: 'Missing Grounding Specifications',
          co_count: 156,
          total_amount: 487500
        },
        schedule_risk_count: 7,
        narrative: 'Portfolio showing moderate stress with 3 projects over budget...'
      })
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    })
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const greeting = () => {
    const hour = currentTime.getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <Coffee size={48} className="mx-auto text-atlas-blue mb-4 animate-bounce" />
          <p className="text-slate-400">Preparing your morning brief...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-navy-800 via-navy-900 to-navy-950 px-8 py-12">
        <div className="absolute inset-0 bg-grid-pattern bg-grid opacity-10" />
        
        <div className="relative max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <Sun size={24} className="text-atlas-yellow" />
            <span className="text-atlas-yellow font-medium">{greeting()}</span>
          </div>
          
          <h1 className="text-4xl font-display font-bold text-white mb-2">
            Portfolio Morning Brief
          </h1>
          
          <div className="flex items-center gap-6 text-slate-400">
            <div className="flex items-center gap-2">
              <Calendar size={16} />
              <span>{formatDate(currentTime)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock size={16} />
              <span>{formatTime(currentTime)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-8 py-8 space-y-8">
        {/* Executive Summary */}
        <section className="card p-6">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <Sparkles size={20} className="text-atlas-blue" />
            Executive Summary
          </h2>
          
          <div className="grid md:grid-cols-4 gap-4 mb-6">
            <div className="bg-navy-700/50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-white">{brief?.portfolio.total_projects}</div>
              <div className="text-xs text-slate-500">Active Projects</div>
            </div>
            <div className="bg-navy-700/50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-white">
                ${((brief?.portfolio.total_budget || 0) / 1e9).toFixed(1)}B
              </div>
              <div className="text-xs text-slate-500">Portfolio Value</div>
            </div>
            <div className="bg-navy-700/50 rounded-lg p-4 text-center">
              <div className={`text-2xl font-bold ${
                (brief?.portfolio.avg_cpi || 0) >= 0.95 ? 'text-atlas-green' : 'text-atlas-red'
              }`}>
                {brief?.portfolio.avg_cpi?.toFixed(3)}
              </div>
              <div className="text-xs text-slate-500">Average CPI</div>
            </div>
            <div className="bg-navy-700/50 rounded-lg p-4 text-center">
              <div className={`text-2xl font-bold ${
                (brief?.portfolio.avg_spi || 0) >= 0.95 ? 'text-atlas-green' : 'text-atlas-yellow'
              }`}>
                {brief?.portfolio.avg_spi?.toFixed(3)}
              </div>
              <div className="text-xs text-slate-500">Average SPI</div>
            </div>
          </div>

          <p className="text-slate-300">
            Today's portfolio shows <strong className="text-white">{brief?.portfolio.projects_over_budget} projects</strong> trending 
            over budget and <strong className="text-white">{brief?.portfolio.projects_behind_schedule} projects</strong> behind 
            schedule. {brief?.critical_alert_count && brief.critical_alert_count > 0 && (
              <span className="text-atlas-red">
                There are {brief.critical_alert_count} critical alerts requiring immediate attention.
              </span>
            )}
          </p>
        </section>

        {/* Hidden Pattern Alert */}
        {brief?.hidden_pattern && (
          <section className="alert-banner-critical">
            <div className="flex-shrink-0">
              <AlertTriangle size={24} className="text-atlas-red" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-white mb-1">Hidden Pattern Detected</h3>
              <p className="text-sm text-slate-300">
                ATLAS identified <strong>{brief.hidden_pattern.co_count} change orders</strong> related to "{brief.hidden_pattern.pattern_name}" 
                with aggregate impact of <strong>${brief.hidden_pattern.total_amount.toLocaleString()}</strong>.
              </p>
            </div>
            <button className="btn-danger text-sm">
              View Details
            </button>
          </section>
        )}

        {/* Today's Priorities */}
        <section className="card p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Today's Priorities</h2>
          
          <div className="space-y-4">
            {brief?.alerts.slice(0, 5).map((alert, i) => (
              <div 
                key={i}
                className={`flex items-start gap-4 p-4 rounded-lg ${
                  alert.level === 'critical' ? 'bg-atlas-red/10 border border-atlas-red/30' :
                  alert.level === 'warning' ? 'bg-atlas-yellow/10 border border-atlas-yellow/30' :
                  'bg-atlas-blue/10 border border-atlas-blue/30'
                }`}
              >
                <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  alert.level === 'critical' ? 'bg-atlas-red text-white' :
                  alert.level === 'warning' ? 'bg-atlas-yellow text-navy-900' :
                  'bg-atlas-blue text-white'
                }`}>
                  {i + 1}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-white">{alert.project}</div>
                  <div className="text-sm text-slate-400">{alert.message}</div>
                </div>
                <span className={`badge ${
                  alert.level === 'critical' ? 'badge-red' :
                  alert.level === 'warning' ? 'badge-yellow' :
                  'badge-blue'
                }`}>
                  {alert.type}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Quick Stats */}
        <section className="grid md:grid-cols-2 gap-6">
          <div className="card p-6">
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
              <TrendingDown size={18} className="text-atlas-red" />
              Cost Concerns
            </h3>
            <div className="space-y-3">
              {[
                { name: 'Downtown Transit Hub', cpi: 0.89, trend: -0.02 },
                { name: 'Metro Blue Line', cpi: 0.91, trend: -0.01 },
                { name: 'Rail Yard Expansion', cpi: 0.93, trend: 0.01 },
              ].map((p, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-sm text-slate-300">{p.name}</span>
                  <div className="flex items-center gap-2">
                    <span className={`font-mono text-sm ${p.cpi < 0.95 ? 'text-atlas-red' : 'text-atlas-yellow'}`}>
                      {p.cpi.toFixed(2)}
                    </span>
                    <span className={`text-xs ${p.trend < 0 ? 'text-atlas-red' : 'text-atlas-green'}`}>
                      {p.trend > 0 ? '+' : ''}{p.trend.toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-6">
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
              <CheckCircle size={18} className="text-atlas-green" />
              On Track
            </h3>
            <div className="space-y-3">
              {[
                { name: 'Central Utility Plant', cpi: 1.05, spi: 1.03 },
                { name: 'Power Substation North', cpi: 1.01, spi: 1.00 },
                { name: 'Harbor Bridge', cpi: 0.99, spi: 1.02 },
              ].map((p, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-sm text-slate-300">{p.name}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-500">CPI</span>
                    <span className="font-mono text-sm text-atlas-green">{p.cpi.toFixed(2)}</span>
                    <span className="text-xs text-slate-500">SPI</span>
                    <span className="font-mono text-sm text-atlas-green">{p.spi.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* AI Recommendations */}
        <section className="card p-6 border-atlas-blue/30">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <Sparkles size={20} className="text-atlas-blue" />
            AI Recommendations
          </h2>
          
          <ul className="space-y-3 text-slate-300">
            <li className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-atlas-blue mt-2" />
              <span>
                <strong className="text-white">Immediate:</strong> Review Downtown Transit Hub's electrical subcontractor performance. 
                CPI drop accelerating over past 3 weeks.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-atlas-yellow mt-2" />
              <span>
                <strong className="text-white">This Week:</strong> Schedule root cause analysis for the grounding specification 
                pattern. 156 COs require design update decision.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-atlas-green mt-2" />
              <span>
                <strong className="text-white">Opportunity:</strong> Central Utility Plant is 5% under budget. Consider 
                accelerating to capture savings.
              </span>
            </li>
          </ul>
        </section>
      </div>
    </div>
  )
}
