import { useState } from 'react'
import { 
  Database, 
  Brain, 
  MessageSquare, 
  Shield,
  Zap,
  Server,
  Sparkles,
  X,
  Activity,
  Search
} from 'lucide-react'
import type { NavigationContext } from '../App'

interface ComponentInfo {
  id: string
  name: string
  shortName: string
  description: string
  tech: string[]
  stats?: string
  color: string
}

const components: Record<string, ComponentInfo> = {
  frontend: {
    id: 'frontend',
    name: 'React Frontend',
    shortName: 'UI',
    description: 'Modern, real-time UI built with React, TypeScript, and Tailwind CSS. Features interactive chat interface, portfolio map with Leaflet, animated visualizations, and the mission control dashboard.',
    tech: ['React 18', 'TypeScript', 'Tailwind CSS', 'Vite', 'Recharts', 'Leaflet'],
    stats: '8 pages, real-time updates',
    color: 'cyan',
  },
  backend: {
    id: 'backend',
    name: 'FastAPI Backend',
    shortName: 'API',
    description: 'Python middleware handling API requests, WebSocket connections, and agent orchestration. Routes queries to appropriate agents based on intent classification.',
    tech: ['Python 3.11', 'FastAPI', 'Uvicorn', 'Pydantic'],
    stats: '15 endpoints',
    color: 'blue',
  },
  orchestrator: {
    id: 'orchestrator',
    name: 'Agent Orchestrator',
    shortName: 'Brain',
    description: 'Intelligent router that classifies user intent (analytical, search, hidden discovery) and delegates to specialized agents. Aggregates responses for coherent output.',
    tech: ['Intent Classification', 'Multi-Agent Coordination', 'Context Management'],
    stats: '4 intent types',
    color: 'purple',
  },
  scopeAgent: {
    id: 'scopeAgent',
    name: 'Scope Analyst Agent',
    shortName: 'Search',
    description: 'Analyzes change orders to detect scope gaps and pattern anomalies. Uses ML classification to identify hidden patterns like the "Missing Grounding Specifications" discovery.',
    tech: ['Cortex Search', 'ML Classification', 'Pattern Detection'],
    stats: '156 patterns found',
    color: 'green',
  },
  riskAgent: {
    id: 'riskAgent',
    name: 'Risk Predictor Agent',
    shortName: 'Advisor',
    description: 'Provides risk assessments and recommendations based on historical project data. Uses XGBoost models to predict schedule slips and cost overruns.',
    tech: ['XGBoost', 'SHAP Explanations', 'Cortex LLM'],
    stats: '4 ML models',
    color: 'yellow',
  },
  watchdog: {
    id: 'watchdog',
    name: 'Portfolio Watchdog Agent',
    shortName: 'Monitor',
    description: 'Monitors portfolio-wide KPIs for anomalies. Pattern matches against historical incidents for proactive alerting and risk detection across all 12 projects.',
    tech: ['Anomaly Detection', 'KPI Monitoring', 'Real-time Alerts'],
    stats: '$3.3B watched',
    color: 'red',
  },
  snowflake: {
    id: 'snowflake',
    name: 'Snowflake Data Cloud',
    shortName: 'Data',
    description: 'Cloud data platform storing project data, change orders, vendor information, and schedule activities. Powers all analytical queries with ATOMIC and CAPITAL_PROJECTS schemas.',
    tech: ['CAPITAL_PROJECTS_DB', 'ATOMIC Schema', 'Parquet Data'],
    stats: '12 projects, 600+ COs',
    color: 'blue',
  },
  cortex: {
    id: 'cortex',
    name: 'Cortex AI Services',
    shortName: 'AI',
    description: 'Snowflake\'s AI services including Cortex Agents for orchestration, Cortex Search for semantic document retrieval, and Cortex Complete (LLM) for reasoning.',
    tech: ['Cortex Agents', 'Cortex Search', 'Cortex Analyst', 'Mistral Large'],
    stats: '3 AI services',
    color: 'purple',
  },
}

export function Architecture(_props: NavigationContext) {
  const [selectedComponent, setSelectedComponent] = useState<string | null>(null)
  const [hoveredFlow, setHoveredFlow] = useState<string | null>(null)

  const selectedInfo = selectedComponent ? components[selectedComponent] : null

  const getColorClasses = (color: string, isActive: boolean) => {
    const colors: Record<string, { bg: string; border: string; glow: string }> = {
      cyan: { 
        bg: isActive ? 'bg-cyan-500/20' : 'bg-cyan-500/10', 
        border: isActive ? 'border-cyan-400' : 'border-cyan-500/30',
        glow: 'shadow-cyan-500/50'
      },
      blue: { 
        bg: isActive ? 'bg-blue-500/20' : 'bg-blue-500/10', 
        border: isActive ? 'border-blue-400' : 'border-blue-500/30',
        glow: 'shadow-blue-500/50'
      },
      purple: { 
        bg: isActive ? 'bg-purple-500/20' : 'bg-purple-500/10', 
        border: isActive ? 'border-purple-400' : 'border-purple-500/30',
        glow: 'shadow-purple-500/50'
      },
      green: { 
        bg: isActive ? 'bg-emerald-500/20' : 'bg-emerald-500/10', 
        border: isActive ? 'border-emerald-400' : 'border-emerald-500/30',
        glow: 'shadow-emerald-500/50'
      },
      yellow: { 
        bg: isActive ? 'bg-amber-500/20' : 'bg-amber-500/10', 
        border: isActive ? 'border-amber-400' : 'border-amber-500/30',
        glow: 'shadow-amber-500/50'
      },
      red: { 
        bg: isActive ? 'bg-red-500/20' : 'bg-red-500/10', 
        border: isActive ? 'border-red-400' : 'border-red-500/30',
        glow: 'shadow-red-500/50'
      },
    }
    return colors[color] || colors.blue
  }

  const ComponentNode = ({ id, x, y }: { id: string; x: number; y: number }) => {
    const comp = components[id]
    const isActive = selectedComponent === id
    const colors = getColorClasses(comp.color, isActive)
    
    const icons: Record<string, any> = {
      frontend: MessageSquare,
      backend: Server,
      orchestrator: Brain,
      scopeAgent: Search,
      riskAgent: Sparkles,
      watchdog: Shield,
      snowflake: Database,
      cortex: Zap,
    }
    const Icon = icons[id] || Activity

    return (
      <g 
        transform={`translate(${x}, ${y})`}
        onClick={() => setSelectedComponent(isActive ? null : id)}
        className="cursor-pointer"
      >
        {/* Glow effect when active */}
        {isActive && (
          <circle
            cx="40"
            cy="40"
            r="50"
            className={`fill-current text-${comp.color}-500 opacity-20`}
            style={{ filter: 'blur(15px)' }}
          />
        )}
        
        {/* Main node */}
        <rect
          x="0"
          y="0"
          width="80"
          height="80"
          rx="12"
          className={`${colors.bg} ${colors.border} border-2 transition-all duration-300 ${isActive ? `shadow-lg ${colors.glow}` : ''}`}
          style={{ 
            filter: isActive ? 'drop-shadow(0 0 10px currentColor)' : 'none'
          }}
        />
        
        {/* Icon */}
        <foreignObject x="20" y="15" width="40" height="40">
          <div className="flex items-center justify-center w-full h-full">
            <Icon size={28} className={`text-${comp.color}-400`} />
          </div>
        </foreignObject>
        
        {/* Label */}
        <text
          x="40"
          y="68"
          textAnchor="middle"
          className="text-xs font-medium fill-slate-300"
        >
          {comp.shortName}
        </text>
        
        {/* Status indicator */}
        <circle
          cx="70"
          cy="10"
          r="5"
          className="fill-emerald-400"
          style={{ filter: 'drop-shadow(0 0 4px #10b981)' }}
        >
          <animate
            attributeName="opacity"
            values="1;0.5;1"
            dur="2s"
            repeatCount="indefinite"
          />
        </circle>
      </g>
    )
  }

  const FlowLine = ({ 
    from, 
    to, 
    label,
    curved = false 
  }: { 
    from: { x: number; y: number }
    to: { x: number; y: number }
    label?: string
    curved?: boolean
  }) => {
    const isActive = hoveredFlow === label
    
    // Calculate path
    let path: string
    if (curved) {
      const midX = (from.x + to.x) / 2
      const midY = Math.min(from.y, to.y) - 30
      path = `M ${from.x} ${from.y} Q ${midX} ${midY} ${to.x} ${to.y}`
    } else {
      path = `M ${from.x} ${from.y} L ${to.x} ${to.y}`
    }

    return (
      <g 
        onMouseEnter={() => setHoveredFlow(label || null)}
        onMouseLeave={() => setHoveredFlow(null)}
      >
        {/* Glow path */}
        <path
          d={path}
          fill="none"
          stroke={isActive ? '#58a6ff' : '#58a6ff'}
          strokeWidth={isActive ? 4 : 2}
          strokeOpacity={isActive ? 0.5 : 0.2}
          style={{ filter: isActive ? 'blur(4px)' : 'none' }}
        />
        
        {/* Main path with animation */}
        <path
          d={path}
          fill="none"
          stroke="#58a6ff"
          strokeWidth="2"
          strokeDasharray="8 4"
          strokeOpacity={isActive ? 1 : 0.6}
        >
          <animate
            attributeName="stroke-dashoffset"
            values="0;-12"
            dur="1s"
            repeatCount="indefinite"
          />
        </path>
        
        {/* Arrow head */}
        <circle
          cx={to.x}
          cy={to.y}
          r="4"
          className="fill-atlas-blue"
        >
          <animate
            attributeName="r"
            values="3;5;3"
            dur="1.5s"
            repeatCount="indefinite"
          />
        </circle>
        
        {/* Label */}
        {label && (
          <text
            x={(from.x + to.x) / 2}
            y={(from.y + to.y) / 2 - 8}
            textAnchor="middle"
            className={`text-[10px] fill-slate-400 ${isActive ? 'fill-blue-300' : ''}`}
          >
            {label}
          </text>
        )}
      </g>
    )
  }

  return (
    <div className="p-6 min-h-screen overflow-y-auto">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-200 flex items-center gap-3">
            <div className="relative">
              <Zap className="text-atlas-blue" />
              <div className="absolute inset-0 text-atlas-blue animate-ping opacity-30">
                <Zap />
              </div>
            </div>
            System Architecture
          </h1>
          <p className="text-slate-400 mt-2">
            Interactive blueprint of the ATLAS Capital Delivery system. Click any component to learn more.
          </p>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-5 gap-4 mb-8">
          {[
            { label: 'AI Agents', value: '4', color: 'purple' },
            { label: 'Change Orders', value: '600+', color: 'green' },
            { label: 'Portfolio Value', value: '$3.3B', color: 'blue' },
            { label: 'Projects', value: '12', color: 'cyan' },
            { label: 'API Endpoints', value: '15', color: 'yellow' },
          ].map((stat, i) => (
            <div 
              key={i}
              className={`card card-glow text-center py-4`}
            >
              <p className={`text-2xl font-mono font-bold text-atlas-blue`}>
                {stat.value}
              </p>
              <p className="text-xs text-slate-500 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Architecture Diagram */}
        <div className="card p-8 relative overflow-hidden">
          {/* Scanning line effect */}
          <div className="absolute inset-0 scan-line pointer-events-none" />
          
          <svg 
            viewBox="0 0 1000 400" 
            className="w-full h-auto"
            style={{ minHeight: '350px' }}
          >
            {/* Background grid */}
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path 
                  d="M 40 0 L 0 0 0 40" 
                  fill="none" 
                  stroke="rgba(88, 166, 255, 0.05)" 
                  strokeWidth="1"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />

            {/* Layer labels */}
            <text x="50" y="30" className="text-xs fill-slate-500 uppercase tracking-wider">Presentation</text>
            <text x="250" y="30" className="text-xs fill-slate-500 uppercase tracking-wider">API Layer</text>
            <text x="420" y="30" className="text-xs fill-slate-500 uppercase tracking-wider">Intelligence</text>
            <text x="650" y="30" className="text-xs fill-slate-500 uppercase tracking-wider">Data Layer</text>
            <text x="850" y="30" className="text-xs fill-slate-500 uppercase tracking-wider">AI Services</text>

            {/* Flow Lines - Left to Right */}
            <FlowLine from={{ x: 120, y: 200 }} to={{ x: 220, y: 200 }} label="HTTP/WS" />
            <FlowLine from={{ x: 320, y: 200 }} to={{ x: 420, y: 160 }} label="Route" />
            <FlowLine from={{ x: 320, y: 200 }} to={{ x: 420, y: 200 }} />
            <FlowLine from={{ x: 320, y: 200 }} to={{ x: 420, y: 240 }} />
            
            {/* Agents to Data */}
            <FlowLine from={{ x: 520, y: 160 }} to={{ x: 650, y: 200 }} label="Query" />
            <FlowLine from={{ x: 520, y: 200 }} to={{ x: 650, y: 200 }} />
            <FlowLine from={{ x: 520, y: 240 }} to={{ x: 650, y: 200 }} />
            
            {/* Data to Cortex */}
            <FlowLine from={{ x: 750, y: 200 }} to={{ x: 850, y: 200 }} label="AI" />
            
            {/* Feedback loops */}
            <FlowLine from={{ x: 890, y: 140 }} to={{ x: 460, y: 120 }} curved label="LLM Response" />

            {/* Component Nodes - Horizontal Layout */}
            <ComponentNode id="frontend" x={40} y={160} />
            <ComponentNode id="backend" x={220} y={160} />
            <ComponentNode id="orchestrator" x={420} y={160} />
            
            {/* Agents row */}
            <ComponentNode id="scopeAgent" x={420} y={50} />
            <ComponentNode id="riskAgent" x={420} y={270} />
            <ComponentNode id="watchdog" x={520} y={160} />
            
            {/* Data layer */}
            <ComponentNode id="snowflake" x={650} y={160} />
            <ComponentNode id="cortex" x={850} y={160} />

            {/* Data flow particles */}
            {[...Array(5)].map((_, i) => (
              <circle
                key={i}
                r="2"
                className="fill-atlas-blue"
              >
                <animateMotion
                  dur={`${3 + i * 0.5}s`}
                  repeatCount="indefinite"
                  path="M 120 200 L 320 200 L 460 200 L 690 200 L 850 200"
                />
                <animate
                  attributeName="opacity"
                  values="0;1;1;0"
                  dur={`${3 + i * 0.5}s`}
                  repeatCount="indefinite"
                />
              </circle>
            ))}
          </svg>

          {/* Legend */}
          <div className="flex items-center justify-center gap-6 mt-4 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <div className="w-8 h-0.5 bg-atlas-blue" style={{ backgroundImage: 'repeating-linear-gradient(90deg, #58a6ff 0, #58a6ff 8px, transparent 8px, transparent 12px)' }} />
              <span>Data Flow</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-400 rounded-full" style={{ boxShadow: '0 0 8px #10b981' }} />
              <span>Active</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 border-2 border-atlas-blue/30 rounded" />
              <span>Click for details</span>
            </div>
          </div>
        </div>

        {/* Modal for component details */}
        {selectedInfo && (
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setSelectedComponent(null)}
          >
            <div 
              className="card max-w-lg w-full relative animate-scale-in"
              onClick={e => e.stopPropagation()}
            >
              <button
                onClick={() => setSelectedComponent(null)}
                className="absolute top-4 right-4 p-2 rounded-lg hover:bg-navy-700 transition-colors"
              >
                <X size={20} className="text-slate-400" />
              </button>

              <div className="flex items-start gap-4 mb-6 p-6 pb-0">
                <div className={`w-14 h-14 rounded-xl bg-navy-700 flex items-center justify-center`}>
                  {selectedInfo.id === 'frontend' && <MessageSquare className="text-cyan-400" size={28} />}
                  {selectedInfo.id === 'backend' && <Server className="text-blue-400" size={28} />}
                  {selectedInfo.id === 'orchestrator' && <Brain className="text-purple-400" size={28} />}
                  {selectedInfo.id === 'scopeAgent' && <Search className="text-emerald-400" size={28} />}
                  {selectedInfo.id === 'riskAgent' && <Sparkles className="text-amber-400" size={28} />}
                  {selectedInfo.id === 'watchdog' && <Shield className="text-red-400" size={28} />}
                  {selectedInfo.id === 'snowflake' && <Database className="text-blue-400" size={28} />}
                  {selectedInfo.id === 'cortex' && <Zap className="text-purple-400" size={28} />}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-200">{selectedInfo.name}</h3>
                  {selectedInfo.stats && (
                    <p className="text-sm text-atlas-blue font-mono">{selectedInfo.stats}</p>
                  )}
                </div>
              </div>

              <div className="px-6">
                <p className="text-slate-300 mb-6">{selectedInfo.description}</p>

                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Technologies</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedInfo.tech.map((tech, i) => (
                      <span
                        key={i}
                        className="text-xs px-3 py-1.5 bg-atlas-blue/10 text-atlas-blue rounded-full border border-atlas-blue/20"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6 mx-6 mb-6 pt-4 border-t border-navy-700 flex items-center justify-between">
                <span className="text-xs text-slate-500">Component ID: {selectedInfo.id}</span>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                  <span className="text-xs text-emerald-400">Online</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
