import { useEffect, useState } from 'react'
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Calendar,
  Users,
  ChevronDown,
  AlertTriangle,
  ArrowLeft
} from 'lucide-react'
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend,
  AreaChart,
  Area
} from 'recharts'
import { MetricGauge } from '../components/MetricGauge'
import type { NavigationContext } from '../App'

interface Project {
  PROJECT_ID: string
  PROJECT_NAME: string
  PROJECT_TYPE: string
  STATUS: string
  CITY: string
  STATE: string
  ORIGINAL_BUDGET: number
  CURRENT_BUDGET: number
  CONTINGENCY_BUDGET: number
  CONTINGENCY_USED: number
  CPI: number
  SPI: number
  PRIME_CONTRACTOR: string
  RISK_LEVEL: string
}

export function ProjectDeepDive({ onNavigate, selectedProjectId, setSelectedProjectId }: NavigationContext) {
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [showDropdown, setShowDropdown] = useState(false)

  useEffect(() => {
    fetchProjects()
  }, [selectedProjectId])

  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/projects')
      if (res.ok) {
        const data = await res.json()
        setProjects(data)
        // Select project based on selectedProjectId if provided
        if (selectedProjectId) {
          const found = data.find((p: Project) => p.PROJECT_ID === selectedProjectId)
          if (found) {
            setSelectedProject(found)
          } else if (data.length > 0) {
            setSelectedProject(data[0])
          }
        } else if (data.length > 0) {
          setSelectedProject(data[0])
        }
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error)
      // Mock data
      const mockProjects: Project[] = [
        { PROJECT_ID: 'PRJ-001', PROJECT_NAME: 'Downtown Transit Hub', PROJECT_TYPE: 'TRANSIT', STATUS: 'ACTIVE', CITY: 'San Francisco', STATE: 'CA', ORIGINAL_BUDGET: 450000000, CURRENT_BUDGET: 472500000, CONTINGENCY_BUDGET: 45000000, CONTINGENCY_USED: 27000000, CPI: 0.89, SPI: 0.92, PRIME_CONTRACTOR: 'Walsh Construction', RISK_LEVEL: 'critical' },
        { PROJECT_ID: 'PRJ-003', PROJECT_NAME: 'Airport Terminal Expansion', PROJECT_TYPE: 'FACILITY', STATUS: 'ACTIVE', CITY: 'Seattle', STATE: 'WA', ORIGINAL_BUDGET: 380000000, CURRENT_BUDGET: 395000000, CONTINGENCY_BUDGET: 38000000, CONTINGENCY_USED: 19000000, CPI: 0.94, SPI: 0.96, PRIME_CONTRACTOR: 'Turner Construction', RISK_LEVEL: 'medium' },
        { PROJECT_ID: 'PRJ-005', PROJECT_NAME: 'Metro Blue Line Extension', PROJECT_TYPE: 'TRANSIT', STATUS: 'ACTIVE', CITY: 'Los Angeles', STATE: 'CA', ORIGINAL_BUDGET: 520000000, CURRENT_BUDGET: 546000000, CONTINGENCY_BUDGET: 52000000, CONTINGENCY_USED: 36400000, CPI: 0.91, SPI: 0.88, PRIME_CONTRACTOR: 'Skanska USA', RISK_LEVEL: 'critical' },
      ]
      setProjects(mockProjects)
      const found = mockProjects.find(p => p.PROJECT_ID === selectedProjectId)
      setSelectedProject(found || mockProjects[0])
    } finally {
      setLoading(false)
    }
  }

  // S-Curve data
  const scurveData = [
    { month: 'Jan', planned: 5, earned: 4, actual: 5 },
    { month: 'Feb', planned: 12, earned: 10, actual: 13 },
    { month: 'Mar', planned: 22, earned: 18, actual: 24 },
    { month: 'Apr', planned: 35, earned: 30, actual: 38 },
    { month: 'May', planned: 48, earned: 42, actual: 52 },
    { month: 'Jun', planned: 58, earned: 52, actual: 62 },
    { month: 'Jul', planned: 68, earned: 60, actual: 72 },
    { month: 'Aug', planned: 76, earned: 68, actual: 80 },
    { month: 'Sep', planned: 84, earned: 75, actual: 88 },
    { month: 'Oct', planned: 90, earned: 82, actual: 94 },
    { month: 'Nov', planned: 95, earned: 88, actual: 98 },
    { month: 'Dec', planned: 100, earned: 93, actual: 105 },
  ]

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="w-12 h-12 border-2 border-atlas-blue border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto p-6">
      {/* Back to Map + Project Selector */}
      <div className="mb-6">
        <button
          onClick={() => {
            setSelectedProjectId(null)
            onNavigate('map')
          }}
          className="mb-4 flex items-center gap-2 text-sm text-slate-400 hover:text-atlas-blue transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Portfolio Map
        </button>
        
        {/* Project Selector */}
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="card p-4 w-full flex items-center justify-between hover:border-atlas-blue/30 transition-colors"
          >
          <div className="flex items-center gap-4">
            <div className={`w-3 h-3 rounded-full ${
              selectedProject?.RISK_LEVEL === 'critical' ? 'bg-atlas-red' :
              selectedProject?.RISK_LEVEL === 'high' ? 'bg-atlas-yellow' :
              selectedProject?.RISK_LEVEL === 'medium' ? 'bg-atlas-blue' :
              'bg-atlas-green'
            }`} />
            <div>
              <div className="font-semibold text-white">{selectedProject?.PROJECT_NAME}</div>
              <div className="text-sm text-slate-500">
                {selectedProject?.CITY}, {selectedProject?.STATE} • {selectedProject?.PROJECT_TYPE}
              </div>
            </div>
          </div>
          <ChevronDown size={20} className="text-slate-400" />
        </button>

        {showDropdown && (
          <div className="absolute top-full left-0 right-0 mt-2 card p-2 z-50 max-h-64 overflow-y-auto">
            {projects.map((project) => (
              <button
                key={project.PROJECT_ID}
                onClick={() => {
                  setSelectedProject(project)
                  setShowDropdown(false)
                }}
                className={`w-full text-left p-3 rounded-lg flex items-center gap-3 hover:bg-navy-700/50 transition-colors ${
                  selectedProject?.PROJECT_ID === project.PROJECT_ID ? 'bg-navy-700/50' : ''
                }`}
              >
                <div className={`w-2 h-2 rounded-full ${
                  project.RISK_LEVEL === 'critical' ? 'bg-atlas-red' :
                  project.RISK_LEVEL === 'high' ? 'bg-atlas-yellow' :
                  project.RISK_LEVEL === 'medium' ? 'bg-atlas-blue' :
                  'bg-atlas-green'
                }`} />
                <div>
                  <div className="text-sm font-medium text-white">{project.PROJECT_NAME}</div>
                  <div className="text-xs text-slate-500">{project.PROJECT_TYPE}</div>
                </div>
              </button>
            ))}
          </div>
        )}
        </div>
      </div>

      {selectedProject && (
        <>
          {/* KPI Row */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <div className="card p-4 flex items-center gap-3">
              <div className="p-2 bg-atlas-blue/20 rounded-lg">
                <DollarSign size={20} className="text-atlas-blue" />
              </div>
              <div>
                <div className="text-xs text-slate-500">Original Budget</div>
                <div className="text-lg font-bold text-white">
                  ${(selectedProject.ORIGINAL_BUDGET / 1e6).toFixed(0)}M
                </div>
              </div>
            </div>

            <div className="card p-4 flex items-center gap-3">
              <div className="p-2 bg-atlas-yellow/20 rounded-lg">
                <TrendingUp size={20} className="text-atlas-yellow" />
              </div>
              <div>
                <div className="text-xs text-slate-500">Current Budget</div>
                <div className="text-lg font-bold text-white">
                  ${(selectedProject.CURRENT_BUDGET / 1e6).toFixed(0)}M
                </div>
              </div>
            </div>

            <div className="card p-4 flex items-center gap-3">
              <div className={`p-2 rounded-lg ${
                selectedProject.CONTINGENCY_USED / selectedProject.CONTINGENCY_BUDGET > 0.7 
                  ? 'bg-atlas-red/20' 
                  : 'bg-atlas-green/20'
              }`}>
                <TrendingDown size={20} className={
                  selectedProject.CONTINGENCY_USED / selectedProject.CONTINGENCY_BUDGET > 0.7 
                    ? 'text-atlas-red' 
                    : 'text-atlas-green'
                } />
              </div>
              <div>
                <div className="text-xs text-slate-500">Contingency Used</div>
                <div className="text-lg font-bold text-white">
                  {((selectedProject.CONTINGENCY_USED / selectedProject.CONTINGENCY_BUDGET) * 100).toFixed(0)}%
                </div>
              </div>
            </div>

            <div className="card p-4 flex items-center gap-3">
              <div className="p-2 bg-atlas-purple/20 rounded-lg">
                <Users size={20} className="text-atlas-purple" />
              </div>
              <div>
                <div className="text-xs text-slate-500">Prime Contractor</div>
                <div className="text-sm font-medium text-white truncate max-w-[120px]">
                  {selectedProject.PRIME_CONTRACTOR}
                </div>
              </div>
            </div>

            <div className="card p-4 flex items-center gap-3">
              <div className="p-2 bg-atlas-cyan/20 rounded-lg">
                <Calendar size={20} className="text-atlas-cyan" />
              </div>
              <div>
                <div className="text-xs text-slate-500">Status</div>
                <div className="text-sm font-medium text-white">
                  {selectedProject.STATUS}
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Performance Gauges */}
            <div className="card p-6">
              <h3 className="font-semibold text-white mb-6">Performance Indices</h3>
              <div className="flex justify-center gap-8">
                <MetricGauge
                  label="CPI"
                  value={selectedProject.CPI}
                  target={1.0}
                  size="lg"
                  showTrend
                  trend={selectedProject.CPI >= 1 ? 'up' : 'down'}
                />
                <MetricGauge
                  label="SPI"
                  value={selectedProject.SPI}
                  target={1.0}
                  size="lg"
                  showTrend
                  trend={selectedProject.SPI >= 1 ? 'up' : 'down'}
                />
              </div>
              
              {(selectedProject.CPI < 0.95 || selectedProject.SPI < 0.95) && (
                <div className="mt-6 p-3 bg-atlas-red/10 border border-atlas-red/30 rounded-lg">
                  <div className="flex items-center gap-2 text-atlas-red text-sm">
                    <AlertTriangle size={16} />
                    <span>Project requires intervention</span>
                  </div>
                </div>
              )}
            </div>

            {/* S-Curve Chart */}
            <div className="card p-6 lg:col-span-2">
              <h3 className="font-semibold text-white mb-4">Earned Value S-Curve</h3>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={scurveData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#30363d" />
                  <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ 
                      background: '#161b22', 
                      border: '1px solid #30363d',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="planned" 
                    name="Planned Value"
                    stroke="#58a6ff" 
                    fill="#58a6ff" 
                    fillOpacity={0.1}
                    strokeWidth={2}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="earned" 
                    name="Earned Value"
                    stroke="#3fb950" 
                    fill="#3fb950" 
                    fillOpacity={0.1}
                    strokeWidth={2}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="actual" 
                    name="Actual Cost"
                    stroke="#f85149" 
                    fill="#f85149" 
                    fillOpacity={0.1}
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Cost Breakdown */}
          <div className="mt-6 card p-6">
            <h3 className="font-semibold text-white mb-4">Budget Breakdown</h3>
            <div className="space-y-4">
              {[
                { label: 'Labor', original: 135, current: 142, pct: 30 },
                { label: 'Materials', original: 157.5, current: 165, pct: 35 },
                { label: 'Equipment', original: 67.5, current: 71, pct: 15 },
                { label: 'Subcontracts', original: 90, current: 94.5, pct: 20 },
              ].map((item, i) => (
                <div key={i}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-300">{item.label}</span>
                    <span className="text-sm text-slate-400">
                      ${item.current}M / ${item.original}M
                    </span>
                  </div>
                  <div className="h-2 bg-navy-700 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        item.current > item.original * 1.05 ? 'bg-atlas-red' :
                        item.current > item.original ? 'bg-atlas-yellow' :
                        'bg-atlas-green'
                      }`}
                      style={{ width: `${Math.min((item.current / item.original) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
