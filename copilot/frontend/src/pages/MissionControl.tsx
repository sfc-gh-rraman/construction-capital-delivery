import { useEffect, useState } from 'react'
import { 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  AlertTriangle,
  Activity,
  Building2
} from 'lucide-react'
import { Chat } from '../components/Chat'
import { MetricGauge } from '../components/MetricGauge'
import { AlertCard } from '../components/AlertCard'
import type { NavigationContext } from '../App'

interface PortfolioSummary {
  total_projects: number
  total_budget: number
  current_budget: number
  total_contingency: number
  contingency_used: number
  avg_cpi: number
  avg_spi: number
  projects_over_budget: number
  projects_behind_schedule: number
}

interface Alert {
  level: 'critical' | 'warning' | 'info'
  type: 'cost' | 'schedule' | 'contingency' | 'scope'
  project: string
  message: string
}

export function MissionControl(_props: NavigationContext) {
  const [summary, setSummary] = useState<PortfolioSummary | null>(null)
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const res = await fetch('/api/portfolio/summary')
      if (res.ok) {
        const data = await res.json()
        setSummary(data)
        
        // Generate alerts from data
        const newAlerts: Alert[] = []
        if (data.avg_cpi < 0.95) {
          newAlerts.push({
            level: 'critical',
            type: 'cost',
            project: 'Portfolio-Wide',
            message: `Average CPI at ${data.avg_cpi?.toFixed(3)} indicates cost pressure`
          })
        }
        if (data.projects_behind_schedule > 0) {
          newAlerts.push({
            level: 'warning',
            type: 'schedule',
            project: 'Multiple Projects',
            message: `${data.projects_behind_schedule} projects behind schedule`
          })
        }
        // Add hidden discovery alert
        newAlerts.push({
          level: 'critical',
          type: 'scope',
          project: 'Hidden Pattern Detected',
          message: '150+ small COs share common root cause - grounding specs'
        })
        setAlerts(newAlerts)
      }
    } catch (error) {
      console.error('Failed to fetch portfolio data:', error)
      // Use mock data for demo
      setSummary({
        total_projects: 12,
        total_budget: 2300000000,
        current_budget: 2415000000,
        total_contingency: 230000000,
        contingency_used: 115000000,
        avg_cpi: 0.968,
        avg_spi: 0.975,
        projects_over_budget: 3,
        projects_behind_schedule: 2
      })
      setAlerts([
        { level: 'critical', type: 'scope', project: 'Hidden Pattern Detected', message: '150+ small COs share common root cause - grounding specs' },
        { level: 'critical', type: 'cost', project: 'Downtown Transit Hub', message: 'CPI at 0.89 - severe cost overrun' },
        { level: 'warning', type: 'schedule', project: 'Airport Terminal', message: 'SPI at 0.92 - schedule slipping' }
      ])
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-atlas-blue border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading Mission Control...</p>
        </div>
      </div>
    )
  }

  const contingencyPct = summary ? (summary.contingency_used / summary.total_contingency) * 100 : 0

  return (
    <div className="h-full flex">
      {/* Left side - Metrics and Alerts */}
      <div className="w-[400px] flex-shrink-0 border-r border-navy-700/50 flex flex-col overflow-hidden">
        {/* Portfolio KPIs */}
        <div className="p-6 border-b border-navy-700/50">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-4 flex items-center gap-2">
            <Activity size={14} />
            Portfolio Health
          </h2>
          
          <div className="grid grid-cols-2 gap-6">
            <MetricGauge 
              label="CPI" 
              value={summary?.avg_cpi || 0} 
              target={1.0}
              showTrend
              trend={summary?.avg_cpi && summary.avg_cpi >= 1 ? 'up' : 'down'}
            />
            <MetricGauge 
              label="SPI" 
              value={summary?.avg_spi || 0} 
              target={1.0}
              showTrend
              trend={summary?.avg_spi && summary.avg_spi >= 1 ? 'up' : 'down'}
            />
          </div>
        </div>

        {/* Quick Stats */}
        <div className="p-6 border-b border-navy-700/50">
          <div className="grid grid-cols-2 gap-4">
            <div className="card p-4">
              <div className="flex items-center gap-2 mb-2">
                <Building2 size={16} className="text-atlas-blue" />
                <span className="text-xs text-slate-500">Projects</span>
              </div>
              <div className="text-2xl font-bold text-white">
                {summary?.total_projects || 12}
              </div>
              <div className="text-xs text-slate-500">Active</div>
            </div>
            
            <div className="card p-4">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign size={16} className="text-atlas-green" />
                <span className="text-xs text-slate-500">Budget</span>
              </div>
              <div className="text-2xl font-bold text-white">
                ${((summary?.total_budget || 0) / 1e9).toFixed(1)}B
              </div>
              <div className="text-xs text-slate-500">Total Value</div>
            </div>
            
            <div className="card p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown size={16} className="text-atlas-yellow" />
                <span className="text-xs text-slate-500">Contingency</span>
              </div>
              <div className="text-2xl font-bold text-white">
                {contingencyPct.toFixed(0)}%
              </div>
              <div className="text-xs text-slate-500">Used</div>
            </div>
            
            <div className="card p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp size={16} className={summary?.projects_over_budget ? 'text-atlas-red' : 'text-atlas-green'} />
                <span className="text-xs text-slate-500">At Risk</span>
              </div>
              <div className="text-2xl font-bold text-white">
                {(summary?.projects_over_budget || 0) + (summary?.projects_behind_schedule || 0)}
              </div>
              <div className="text-xs text-slate-500">Projects</div>
            </div>
          </div>
        </div>

        {/* Alerts */}
        <div className="flex-1 overflow-y-auto p-6">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-4 flex items-center gap-2">
            <AlertTriangle size={14} />
            Active Alerts ({alerts.length})
          </h2>
          
          <div className="space-y-3">
            {alerts.map((alert, i) => (
              <AlertCard key={i} alert={alert} />
            ))}
          </div>
        </div>
      </div>

      {/* Right side - Chat */}
      <div className="flex-1 flex flex-col">
        <div className="p-4 border-b border-navy-700/50 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-white">ATLAS Co-Pilot</h2>
            <p className="text-xs text-slate-500">Ask about portfolio, change orders, risk, and more</p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="w-2 h-2 rounded-full bg-atlas-green animate-pulse" />
            <span className="text-slate-500">4 Agents Ready</span>
          </div>
        </div>
        <Chat />
      </div>
    </div>
  )
}
