import { AlertTriangle, TrendingDown, Clock, DollarSign } from 'lucide-react'

interface Alert {
  level: 'critical' | 'warning' | 'info'
  type: 'cost' | 'schedule' | 'contingency' | 'scope'
  project: string
  message: string
}

interface AlertCardProps {
  alert: Alert
  onClick?: () => void
}

const typeIcons = {
  cost: DollarSign,
  schedule: Clock,
  contingency: TrendingDown,
  scope: AlertTriangle
}

const levelStyles = {
  critical: 'border-atlas-red/50 bg-atlas-red/5',
  warning: 'border-atlas-yellow/50 bg-atlas-yellow/5',
  info: 'border-atlas-blue/50 bg-atlas-blue/5'
}

const levelColors = {
  critical: 'text-atlas-red',
  warning: 'text-atlas-yellow',
  info: 'text-atlas-blue'
}

export function AlertCard({ alert, onClick }: AlertCardProps) {
  const Icon = typeIcons[alert.type]
  
  return (
    <div 
      className={`
        p-4 rounded-lg border cursor-pointer
        transition-all duration-200 hover:scale-[1.02]
        ${levelStyles[alert.level]}
      `}
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg ${alert.level === 'critical' ? 'bg-atlas-red/20' : alert.level === 'warning' ? 'bg-atlas-yellow/20' : 'bg-atlas-blue/20'}`}>
          <Icon size={18} className={levelColors[alert.level]} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`badge ${
              alert.level === 'critical' ? 'badge-red' : 
              alert.level === 'warning' ? 'badge-yellow' : 
              'badge-blue'
            }`}>
              {alert.level}
            </span>
            <span className="text-xs text-slate-500 capitalize">{alert.type}</span>
          </div>
          <h4 className="font-medium text-white text-sm truncate">
            {alert.project}
          </h4>
          <p className="text-xs text-slate-400 mt-1">
            {alert.message}
          </p>
        </div>
        {alert.level === 'critical' && (
          <div className="relative">
            <div className="w-2 h-2 rounded-full bg-atlas-red" />
            <div className="w-2 h-2 rounded-full bg-atlas-red absolute inset-0 pulse-ring" />
          </div>
        )}
      </div>
    </div>
  )
}
