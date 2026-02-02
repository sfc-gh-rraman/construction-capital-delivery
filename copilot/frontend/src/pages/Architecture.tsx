import { useState } from 'react'
import { 
  Database, 
  Cpu, 
  Globe,
  MessageSquare,
  Search,
  BarChart3,
  Brain,
  Server,
  ArrowRight,
  X
} from 'lucide-react'
import type { NavigationContext } from '../App'

interface Component {
  id: string
  name: string
  description: string
  details: string[]
  technologies: string[]
  color: string
}

const components: Component[] = [
  {
    id: 'frontend',
    name: 'React Frontend',
    description: 'Modern web application with real-time updates',
    details: [
      'React 18 with TypeScript',
      'Tailwind CSS for styling',
      'Recharts for data visualization',
      'WebSocket for live updates',
      '8 specialized views'
    ],
    technologies: ['React', 'TypeScript', 'Tailwind', 'Vite'],
    color: '#58a6ff'
  },
  {
    id: 'api',
    name: 'FastAPI Backend',
    description: 'High-performance Python API server',
    details: [
      'Async request handling',
      'Pydantic validation',
      'CORS middleware',
      'WebSocket support',
      'SPCS-compatible'
    ],
    technologies: ['FastAPI', 'Python', 'Uvicorn', 'Pydantic'],
    color: '#3fb950'
  },
  {
    id: 'agents',
    name: 'Multi-Agent System',
    description: '4 specialized AI agents for different domains',
    details: [
      'Portfolio Watchdog - KPI monitoring',
      'Scope Analyst - CO pattern detection',
      'Schedule Optimizer - Critical path',
      'Risk Predictor - ML forecasts',
      'Orchestrator for routing'
    ],
    technologies: ['Python', 'LangChain-style', 'Cortex LLM'],
    color: '#a371f7'
  },
  {
    id: 'cortex',
    name: 'Snowflake Cortex',
    description: 'AI services for LLM and search',
    details: [
      'Cortex Complete (LLM)',
      'Cortex Search (RAG)',
      'Cortex Analyst (Text-to-SQL)',
      'Vector embeddings',
      'Serverless deployment'
    ],
    technologies: ['Mistral-Large', 'Arctic', 'Snowflake'],
    color: '#39c5cf'
  },
  {
    id: 'ml',
    name: 'ML Models',
    description: 'Predictive models with full explainability',
    details: [
      'EAC Forecaster (Gradient Boosting)',
      'CO Classifier (XGBoost)',
      'Schedule Slip Predictor (RF)',
      'Vendor Risk Scorer (XGBoost)',
      'SHAP explanations'
    ],
    technologies: ['Snowpark ML', 'XGBoost', 'SHAP'],
    color: '#d29922'
  },
  {
    id: 'data',
    name: 'Snowflake Data',
    description: 'Enterprise data platform',
    details: [
      'RAW schema - source data',
      'ATOMIC schema - normalized',
      'CAPITAL_PROJECTS - data mart',
      'ML schema - predictions',
      'DOCS schema - for search'
    ],
    technologies: ['Snowflake', 'SQL', 'Parquet'],
    color: '#f85149'
  }
]

export function Architecture(_props: NavigationContext) {
  const [selectedComponent, setSelectedComponent] = useState<Component | null>(null)

  return (
    <div className="h-full overflow-y-auto p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-display font-bold text-white mb-4">
            ATLAS System Architecture
          </h1>
          <p className="text-slate-400 max-w-2xl mx-auto">
            An agentic AI platform built on Snowflake Cortex, combining multi-agent orchestration
            with ML-powered insights for capital project delivery intelligence.
          </p>
        </div>

        {/* Architecture Diagram */}
        <div className="card p-8 mb-8">
          <div className="relative">
            {/* User Layer */}
            <div className="flex justify-center mb-8">
              <div 
                className="card-hover p-4 cursor-pointer text-center"
                onClick={() => setSelectedComponent(components.find(c => c.id === 'frontend')!)}
              >
                <Globe size={32} className="mx-auto mb-2 text-atlas-blue" />
                <div className="font-medium text-white">React Frontend</div>
                <div className="text-xs text-slate-500">8 Pages • Dark UI</div>
              </div>
            </div>

            {/* Arrow */}
            <div className="flex justify-center mb-4">
              <ArrowRight size={24} className="text-slate-600 rotate-90" />
            </div>

            {/* API Layer */}
            <div className="flex justify-center mb-8">
              <div 
                className="card-hover p-4 cursor-pointer text-center"
                onClick={() => setSelectedComponent(components.find(c => c.id === 'api')!)}
              >
                <Server size={32} className="mx-auto mb-2 text-atlas-green" />
                <div className="font-medium text-white">FastAPI Backend</div>
                <div className="text-xs text-slate-500">REST + WebSocket</div>
              </div>
            </div>

            {/* Arrow */}
            <div className="flex justify-center mb-4">
              <ArrowRight size={24} className="text-slate-600 rotate-90" />
            </div>

            {/* Agent Layer */}
            <div className="flex justify-center gap-6 mb-8">
              <div 
                className="card-hover p-4 cursor-pointer text-center"
                onClick={() => setSelectedComponent(components.find(c => c.id === 'agents')!)}
              >
                <Brain size={32} className="mx-auto mb-2 text-atlas-purple" />
                <div className="font-medium text-white">Multi-Agent System</div>
                <div className="text-xs text-slate-500">4 Specialized Agents</div>
              </div>
            </div>

            {/* Agent Cards */}
            <div className="flex justify-center gap-4 mb-8">
              {['Portfolio', 'Scope', 'Schedule', 'Risk'].map((agent, i) => (
                <div key={i} className="bg-navy-700/50 rounded-lg p-3 text-center">
                  <div className="text-xs text-atlas-purple font-medium">{agent}</div>
                  <div className="text-[10px] text-slate-500">Agent</div>
                </div>
              ))}
            </div>

            {/* Arrow */}
            <div className="flex justify-center mb-4">
              <ArrowRight size={24} className="text-slate-600 rotate-90" />
            </div>

            {/* Snowflake Layer */}
            <div className="bg-navy-800/80 rounded-xl p-6 border border-navy-600/50">
              <div className="text-center mb-6">
                <Database size={32} className="mx-auto mb-2 text-atlas-cyan" />
                <div className="font-medium text-white">Snowflake Platform</div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div 
                  className="card-hover p-4 cursor-pointer text-center"
                  onClick={() => setSelectedComponent(components.find(c => c.id === 'cortex')!)}
                >
                  <MessageSquare size={24} className="mx-auto mb-2 text-atlas-cyan" />
                  <div className="text-sm font-medium text-white">Cortex AI</div>
                  <div className="text-xs text-slate-500">LLM + Search</div>
                </div>

                <div 
                  className="card-hover p-4 cursor-pointer text-center"
                  onClick={() => setSelectedComponent(components.find(c => c.id === 'ml')!)}
                >
                  <BarChart3 size={24} className="mx-auto mb-2 text-atlas-yellow" />
                  <div className="text-sm font-medium text-white">ML Models</div>
                  <div className="text-xs text-slate-500">4 Predictive</div>
                </div>

                <div 
                  className="card-hover p-4 cursor-pointer text-center"
                  onClick={() => setSelectedComponent(components.find(c => c.id === 'data')!)}
                >
                  <Database size={24} className="mx-auto mb-2 text-atlas-red" />
                  <div className="text-sm font-medium text-white">Data Warehouse</div>
                  <div className="text-xs text-slate-500">5 Schemas</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Data Flow */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-atlas-blue/20 rounded-lg">
                <MessageSquare size={20} className="text-atlas-blue" />
              </div>
              <h3 className="font-semibold text-white">Chat Flow</h3>
            </div>
            <ol className="space-y-2 text-sm text-slate-400">
              <li>1. User sends message</li>
              <li>2. Orchestrator classifies intent</li>
              <li>3. Routes to specialized agent</li>
              <li>4. Agent queries Snowflake</li>
              <li>5. Response with sources</li>
            </ol>
          </div>

          <div className="card p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-atlas-green/20 rounded-lg">
                <Search size={20} className="text-atlas-green" />
              </div>
              <h3 className="font-semibold text-white">Search Flow</h3>
            </div>
            <ol className="space-y-2 text-sm text-slate-400">
              <li>1. User enters search query</li>
              <li>2. Query sent to Cortex Search</li>
              <li>3. Semantic matching on CO text</li>
              <li>4. Results ranked by relevance</li>
              <li>5. Display with ML categories</li>
            </ol>
          </div>

          <div className="card p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-atlas-purple/20 rounded-lg">
                <Brain size={20} className="text-atlas-purple" />
              </div>
              <h3 className="font-semibold text-white">Hidden Discovery</h3>
            </div>
            <ol className="space-y-2 text-sm text-slate-400">
              <li>1. ML classifies all COs</li>
              <li>2. Text embeddings generated</li>
              <li>3. Clustering finds patterns</li>
              <li>4. Aggregates small COs</li>
              <li>5. Surfaces systemic issues</li>
            </ol>
          </div>
        </div>

        {/* Tech Stack */}
        <div className="card p-6">
          <h3 className="font-semibold text-white mb-6">Technology Stack</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: 'React 18', category: 'Frontend' },
              { name: 'TypeScript', category: 'Language' },
              { name: 'Tailwind CSS', category: 'Styling' },
              { name: 'FastAPI', category: 'Backend' },
              { name: 'Python 3.11', category: 'Language' },
              { name: 'Snowflake', category: 'Data' },
              { name: 'Cortex AI', category: 'AI/ML' },
              { name: 'SPCS', category: 'Deploy' },
            ].map((tech, i) => (
              <div key={i} className="bg-navy-700/50 rounded-lg p-3">
                <div className="font-medium text-white">{tech.name}</div>
                <div className="text-xs text-slate-500">{tech.category}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedComponent && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-8"
          onClick={() => setSelectedComponent(null)}
        >
          <div 
            className="card max-w-lg w-full p-6 animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div 
                  className="w-12 h-12 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${selectedComponent.color}20` }}
                >
                  <Cpu size={24} style={{ color: selectedComponent.color }} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">{selectedComponent.name}</h3>
                  <p className="text-sm text-slate-400">{selectedComponent.description}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedComponent(null)}
                className="p-1 hover:bg-navy-700 rounded"
              >
                <X size={20} className="text-slate-400" />
              </button>
            </div>

            <div className="mb-4">
              <h4 className="text-sm font-medium text-slate-300 mb-2">Details</h4>
              <ul className="space-y-1">
                {selectedComponent.details.map((detail, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-slate-400">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: selectedComponent.color }} />
                    {detail}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-medium text-slate-300 mb-2">Technologies</h4>
              <div className="flex flex-wrap gap-2">
                {selectedComponent.technologies.map((tech, i) => (
                  <span 
                    key={i}
                    className="px-2 py-1 rounded text-xs"
                    style={{ 
                      backgroundColor: `${selectedComponent.color}20`,
                      color: selectedComponent.color
                    }}
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
