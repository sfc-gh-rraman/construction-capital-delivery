import { useEffect, useState } from 'react'

interface MetricGaugeProps {
  label: string
  value: number
  target?: number
  min?: number
  max?: number
  format?: 'percent' | 'currency' | 'number' | 'decimal'
  size?: 'sm' | 'md' | 'lg'
  showTrend?: boolean
  trend?: 'up' | 'down' | 'stable'
}

export function MetricGauge({
  label,
  value,
  target = 1,
  min = 0,
  max = 1.2,
  format = 'decimal',
  size = 'md',
  showTrend = false,
  trend = 'stable'
}: MetricGaugeProps) {
  const [animatedValue, setAnimatedValue] = useState(0)

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedValue(value), 100)
    return () => clearTimeout(timer)
  }, [value])

  // Calculate percentage for gauge
  const percentage = Math.min(Math.max((animatedValue - min) / (max - min), 0), 1)
  
  // Determine color based on value vs target
  const getColor = () => {
    const ratio = animatedValue / target
    if (ratio >= 1) return '#3fb950'  // Green - on/above target
    if (ratio >= 0.95) return '#58a6ff'  // Blue - slightly below
    if (ratio >= 0.9) return '#d29922'  // Yellow - warning
    return '#f85149'  // Red - critical
  }

  // Format the display value
  const formatValue = (val: number) => {
    switch (format) {
      case 'percent':
        return `${(val * 100).toFixed(0)}%`
      case 'currency':
        return `$${(val / 1e6).toFixed(1)}M`
      case 'number':
        return val.toLocaleString()
      case 'decimal':
      default:
        return val.toFixed(3)
    }
  }

  // Size configurations
  const sizes = {
    sm: { container: 80, stroke: 6, font: 'text-lg', label: 'text-[10px]' },
    md: { container: 120, stroke: 8, font: 'text-2xl', label: 'text-xs' },
    lg: { container: 160, stroke: 10, font: 'text-3xl', label: 'text-sm' }
  }

  const config = sizes[size]
  const radius = (config.container - config.stroke) / 2
  const circumference = 2 * Math.PI * radius

  return (
    <div className="flex flex-col items-center">
      <div 
        className="metric-gauge relative"
        style={{ width: config.container, height: config.container }}
      >
        <svg 
          className="metric-gauge-circle"
          width={config.container}
          height={config.container}
        >
          {/* Background circle */}
          <circle
            className="metric-gauge-bg"
            cx={config.container / 2}
            cy={config.container / 2}
            r={radius}
            strokeWidth={config.stroke}
          />
          
          {/* Progress circle */}
          <circle
            className="metric-gauge-fill"
            cx={config.container / 2}
            cy={config.container / 2}
            r={radius}
            strokeWidth={config.stroke}
            stroke={getColor()}
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - percentage)}
            style={{ transition: 'stroke-dashoffset 1s ease-out, stroke 0.3s ease' }}
          />
        </svg>

        {/* Center value */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span 
            className={`font-mono font-bold ${config.font}`}
            style={{ color: getColor() }}
          >
            {formatValue(animatedValue)}
          </span>
          {showTrend && (
            <span className={`text-xs ${
              trend === 'up' ? 'text-atlas-green' : 
              trend === 'down' ? 'text-atlas-red' : 
              'text-slate-500'
            }`}>
              {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}
            </span>
          )}
        </div>
      </div>
      
      {/* Label */}
      <span className={`mt-2 ${config.label} text-slate-400 font-medium uppercase tracking-wide`}>
        {label}
      </span>
      
      {/* Target indicator */}
      {target && (
        <span className="text-[10px] text-slate-500">
          Target: {formatValue(target)}
        </span>
      )}
    </div>
  )
}
