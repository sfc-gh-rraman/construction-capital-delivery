import { useEffect, useState } from 'react'
import type { NavigationContext } from '../App'
import { 
  Search, 
  AlertTriangle, 
  TrendingUp, 
  FileText,
  Building2,
  Sparkles,
  Brain,
  Cpu,
  Zap
} from 'lucide-react'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts'

interface HiddenPattern {
  pattern_name: string
  co_count: number
  project_count: number
  total_amount: number
  avg_amount: number
  common_vendor: string
  change_orders: Array<{
    CO_ID: string
    PROJECT_NAME: string
    REASON_TEXT: string
    APPROVED_AMOUNT: number
  }>
}

interface MLClassification {
  category: string
  co_count: number
  total_amount: number
  avg_confidence: number
  avg_co_amount: number
}

interface MLHiddenAnalysis {
  pattern_name: string
  description: string
  summary: {
    total_cos: number
    total_amount: number
    avg_ml_confidence: number
    projects_affected: number
  }
  category_distribution: Record<string, { count: number; amount: number }>
  sample_cos: Array<{
    co_id: string
    project_name: string
    vendor_name: string
    reason_text: string
    approved_amount: number
    ml_category: string
    ml_confidence: number
    scope_gap_prob: number
  }>
  insight: string
}

const COLORS = ['#f85149', '#d29922', '#58a6ff', '#3fb950', '#a371f7', '#7ee787']

export function ScopeForensics(_props: NavigationContext) {
  const [pattern, setPattern] = useState<HiddenPattern | null>(null)
  const [mlClassifications, setMlClassifications] = useState<MLClassification[]>([])
  const [mlHiddenAnalysis, setMlHiddenAnalysis] = useState<MLHiddenAnalysis | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<'discovery' | 'ml'>('discovery')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      // Fetch all data in parallel
      const [patternRes, mlClassRes, mlHiddenRes] = await Promise.all([
        fetch('/api/change-orders/hidden-pattern'),
        fetch('/api/ml/classification-summary'),
        fetch('/api/ml/hidden-pattern-analysis')
      ])
      
      if (patternRes.ok) {
        setPattern(await patternRes.json())
      }
      if (mlClassRes.ok) {
        setMlClassifications(await mlClassRes.json())
      }
      if (mlHiddenRes.ok) {
        setMlHiddenAnalysis(await mlHiddenRes.json())
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
      // Mock data for demo
      setPattern({
        pattern_name: 'Missing Grounding Specifications',
        co_count: 156,
        project_count: 12,
        total_amount: 487500,
        avg_amount: 3125,
        common_vendor: 'Apex Electrical Services',
        change_orders: [
          { CO_ID: 'CO-00001', PROJECT_NAME: 'Downtown Transit Hub', REASON_TEXT: 'Grounding not specified in original drawings', APPROVED_AMOUNT: 3200 },
          { CO_ID: 'CO-00012', PROJECT_NAME: 'Airport Terminal', REASON_TEXT: 'Equipment grounding per NEC not in contract', APPROVED_AMOUNT: 2850 },
        ]
      })
      setMlClassifications([
        { category: 'SCOPE_GAP', co_count: 220, total_amount: 2850000, avg_confidence: 0.91, avg_co_amount: 12955 },
        { category: 'DESIGN_ERROR', co_count: 85, total_amount: 1240000, avg_confidence: 0.87, avg_co_amount: 14588 },
        { category: 'FIELD_CONDITION', co_count: 112, total_amount: 980000, avg_confidence: 0.82, avg_co_amount: 8750 },
        { category: 'OWNER_REQUEST', co_count: 45, total_amount: 1850000, avg_confidence: 0.95, avg_co_amount: 41111 },
      ])
    } finally {
      setLoading(false)
    }
  }

  // Radar chart data for ML confidence by category
  const radarData = mlClassifications.map(c => ({
    category: c.category.replace('_', ' '),
    confidence: c.avg_confidence * 100,
    count: c.co_count
  }))

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-atlas-blue border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Analyzing change order patterns with ML...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto p-6">
      {/* Tab Navigation */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setActiveTab('discovery')}
          className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
            activeTab === 'discovery' 
              ? 'bg-atlas-red/20 text-atlas-red border border-atlas-red/30' 
              : 'bg-navy-800 text-slate-400 hover:text-white'
          }`}
        >
          <Sparkles size={16} />
          Hidden Discovery
        </button>
        <button
          onClick={() => setActiveTab('ml')}
          className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
            activeTab === 'ml' 
              ? 'bg-atlas-purple/20 text-atlas-purple border border-atlas-purple/30' 
              : 'bg-navy-800 text-slate-400 hover:text-white'
          }`}
        >
          <Brain size={16} />
          ML Analysis
        </button>
      </div>

      {activeTab === 'discovery' && (
        <>
          {/* Hidden Discovery Alert */}
          {pattern && (
            <div className="alert-banner-critical mb-6 animate-fade-in">
              <div className="flex-shrink-0 p-2 bg-atlas-red/20 rounded-lg">
                <AlertTriangle size={24} className="text-atlas-red" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-atlas-red mb-1 flex items-center gap-2">
                  <Sparkles size={16} />
                  HIDDEN DISCOVERY: Systemic Pattern Detected
                </h3>
                <p className="text-sm text-slate-300">
                  ATLAS has identified <strong>{pattern.co_count} change orders</strong> across{' '}
                  <strong>{pattern.project_count} projects</strong> that share a common root cause:{' '}
                  <span className="text-white font-medium">{pattern.pattern_name}</span>
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-atlas-red">
                  ${pattern.total_amount?.toLocaleString()}
                </div>
                <div className="text-xs text-slate-500">Aggregate Impact</div>
              </div>
            </div>
          )}

          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search change orders by keyword (e.g., 'grounding', 'electrical')..."
                className="input pl-10"
              />
            </div>
          </div>

          {/* Pattern Details */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Pattern Summary Card */}
            <div className="card-glow p-6 lg:col-span-1">
              <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                <AlertTriangle size={18} className="text-atlas-red" />
                Pattern Analysis
              </h3>
              
              <div className="space-y-4">
                <div>
                  <div className="text-xs text-slate-500 mb-1">Pattern Type</div>
                  <div className="font-medium text-atlas-red">{pattern?.pattern_name}</div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-navy-700/50 rounded-lg p-3 text-center">
                    <FileText size={20} className="mx-auto text-atlas-blue mb-1" />
                    <div className="text-xl font-bold text-white">{pattern?.co_count}</div>
                    <div className="text-xs text-slate-500">Change Orders</div>
                  </div>
                  <div className="bg-navy-700/50 rounded-lg p-3 text-center">
                    <Building2 size={20} className="mx-auto text-atlas-purple mb-1" />
                    <div className="text-xl font-bold text-white">{pattern?.project_count}</div>
                    <div className="text-xs text-slate-500">Projects</div>
                  </div>
                </div>
                
                <div className="bg-navy-700/50 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">Average CO Size</span>
                    <span className="font-mono text-white">${pattern?.avg_amount?.toLocaleString()}</span>
                  </div>
                  <div className="text-xs text-slate-500 mt-2">
                    ⚠️ Below $5,000 threshold = Auto-approved
                  </div>
                </div>
                
                <div>
                  <div className="text-xs text-slate-500 mb-1">Primary Vendor</div>
                  <div className="font-medium text-atlas-yellow">{pattern?.common_vendor}</div>
                </div>
              </div>
            </div>

            {/* ML Classification Pie Chart */}
            <div className="card p-6">
              <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                <Cpu size={18} className="text-atlas-purple" />
                ML Classification Distribution
              </h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={mlClassifications}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    dataKey="co_count"
                    nameKey="category"
                    label={({ category, co_count }) => `${category.replace('_', ' ')}: ${co_count}`}
                    labelLine={false}
                  >
                    {mlClassifications.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      background: '#161b22', 
                      border: '1px solid #30363d',
                      borderRadius: '8px'
                    }}
                    formatter={(value: number, _name: string, props: { payload?: MLClassification }) => [
                      <>
                        <div>{value} COs</div>
                        <div className="text-xs text-slate-500">
                          ${(props.payload?.total_amount || 0).toLocaleString()} total
                        </div>
                      </>
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* ML Confidence by Category */}
            <div className="card p-6">
              <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                <Zap size={18} className="text-atlas-yellow" />
                Model Confidence
              </h3>
              <ResponsiveContainer width="100%" height={250}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#30363d" />
                  <PolarAngleAxis dataKey="category" stroke="#64748b" fontSize={11} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#64748b" fontSize={10} />
                  <Radar
                    name="Confidence %"
                    dataKey="confidence"
                    stroke="#a371f7"
                    fill="#a371f7"
                    fillOpacity={0.3}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      background: '#161b22', 
                      border: '1px solid #30363d',
                      borderRadius: '8px'
                    }}
                    formatter={(value: number) => [`${value.toFixed(1)}%`, 'Confidence']}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Sample Change Orders */}
          <div className="card">
            <div className="p-4 border-b border-navy-700/50">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <FileText size={18} className="text-atlas-blue" />
                Sample Change Orders in Pattern
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="table-atlas">
                <thead>
                  <tr>
                    <th>CO #</th>
                    <th>Project</th>
                    <th>Reason</th>
                    <th className="text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {pattern?.change_orders.map((co, i) => (
                    <tr key={i}>
                      <td className="font-mono text-atlas-blue">{co.CO_ID}</td>
                      <td>{co.PROJECT_NAME}</td>
                      <td className="max-w-md">
                        <span className="text-slate-300">{co.REASON_TEXT}</span>
                        {co.REASON_TEXT.toLowerCase().includes('ground') && (
                          <span className="ml-2 px-1.5 py-0.5 bg-atlas-red/20 text-atlas-red text-xs rounded">
                            PATTERN
                          </span>
                        )}
                      </td>
                      <td className="text-right font-mono">${co.APPROVED_AMOUNT.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {activeTab === 'ml' && (
        <>
          {/* ML Model Info Banner */}
          <div className="card-glow border-atlas-purple/30 p-6 mb-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-atlas-purple/20 rounded-xl">
                <Brain size={32} className="text-atlas-purple" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white mb-2">
                  Change Order Classifier - XGBoost Model
                </h3>
                <p className="text-sm text-slate-400 mb-4">
                  Trained on {mlClassifications.reduce((a, b) => a + b.co_count, 0)}+ change orders to automatically classify 
                  root causes. Uses TF-IDF text features from reason narratives combined with cost codes, 
                  amounts, and project context.
                </p>
                <div className="flex gap-6">
                  <div>
                    <div className="text-2xl font-bold text-atlas-purple">
                      {(mlClassifications.reduce((a, b) => a + b.avg_confidence, 0) / mlClassifications.length * 100 || 0).toFixed(1)}%
                    </div>
                    <div className="text-xs text-slate-500">Avg Confidence</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-atlas-green">4</div>
                    <div className="text-xs text-slate-500">Categories</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-atlas-blue">
                      ${(mlClassifications.reduce((a, b) => a + b.total_amount, 0) / 1e6).toFixed(1)}M
                    </div>
                    <div className="text-xs text-slate-500">Classified Value</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ML Classifications Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {mlClassifications.map((cls, i) => (
              <div key={cls.category} className="card p-4">
                <div className="flex items-center justify-between mb-3">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ background: COLORS[i % COLORS.length] }} 
                  />
                  <span className="text-xs px-2 py-1 rounded bg-navy-700 text-slate-300">
                    {(cls.avg_confidence * 100).toFixed(0)}% conf
                  </span>
                </div>
                <div className="text-sm font-medium text-white mb-1">
                  {cls.category.replace('_', ' ')}
                </div>
                <div className="text-2xl font-bold text-white">{cls.co_count}</div>
                <div className="text-xs text-slate-500 mb-2">change orders</div>
                <div className="pt-2 border-t border-navy-700/50">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Total Impact</span>
                    <span className="text-white">${(cls.total_amount / 1e6).toFixed(2)}M</span>
                  </div>
                  <div className="flex justify-between text-xs mt-1">
                    <span className="text-slate-500">Avg CO Size</span>
                    <span className="text-white">${cls.avg_co_amount.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* ML Classification Amount Bar Chart */}
          <div className="card p-6 mb-6">
            <h3 className="font-semibold text-white mb-4">Total Amount by ML Category</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={mlClassifications}>
                <CartesianGrid strokeDasharray="3 3" stroke="#30363d" />
                <XAxis 
                  dataKey="category" 
                  stroke="#64748b" 
                  fontSize={12}
                  tickFormatter={(v: string) => v.replace('_', ' ')}
                />
                <YAxis 
                  stroke="#64748b" 
                  fontSize={12}
                  tickFormatter={(v: number) => `$${(v / 1e6).toFixed(1)}M`}
                />
                <Tooltip 
                  contentStyle={{ 
                    background: '#161b22', 
                    border: '1px solid #30363d',
                    borderRadius: '8px'
                  }}
                  formatter={(value: number) => [`$${value.toLocaleString()}`, 'Total Amount']}
                />
                <Bar dataKey="total_amount" radius={[4, 4, 0, 0]}>
                  {mlClassifications.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* ML Hidden Pattern Analysis */}
          {mlHiddenAnalysis && (
            <div className="card p-6">
              <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                <Sparkles size={18} className="text-atlas-red" />
                ML-Detected Hidden Pattern: {mlHiddenAnalysis.pattern_name}
              </h3>
              
              <div className="bg-atlas-red/10 border border-atlas-red/30 rounded-lg p-4 mb-4">
                <p className="text-sm text-slate-300">{mlHiddenAnalysis.description}</p>
              </div>
              
              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="bg-navy-700/50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-atlas-red">
                    {mlHiddenAnalysis.summary.total_cos}
                  </div>
                  <div className="text-xs text-slate-500">Change Orders</div>
                </div>
                <div className="bg-navy-700/50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-atlas-yellow">
                    ${(mlHiddenAnalysis.summary.total_amount / 1000).toFixed(0)}K
                  </div>
                  <div className="text-xs text-slate-500">Total Impact</div>
                </div>
                <div className="bg-navy-700/50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-atlas-purple">
                    {(mlHiddenAnalysis.summary.avg_ml_confidence * 100).toFixed(0)}%
                  </div>
                  <div className="text-xs text-slate-500">ML Confidence</div>
                </div>
                <div className="bg-navy-700/50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-atlas-blue">
                    {mlHiddenAnalysis.summary.projects_affected}
                  </div>
                  <div className="text-xs text-slate-500">Projects</div>
                </div>
              </div>

              <div className="bg-navy-800/50 rounded-lg p-4">
                <p className="text-sm text-atlas-green">{mlHiddenAnalysis.insight}</p>
              </div>
              
              {/* Sample COs with ML scores */}
              <div className="mt-4 overflow-x-auto">
                <table className="table-atlas">
                  <thead>
                    <tr>
                      <th>CO #</th>
                      <th>Project</th>
                      <th>Vendor</th>
                      <th>ML Category</th>
                      <th className="text-right">Confidence</th>
                      <th className="text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mlHiddenAnalysis.sample_cos.slice(0, 10).map((co) => (
                      <tr key={co.co_id}>
                        <td className="font-mono text-atlas-blue">{co.co_id}</td>
                        <td>{co.project_name}</td>
                        <td className="text-slate-400">{co.vendor_name || '-'}</td>
                        <td>
                          <span className="px-2 py-1 rounded text-xs bg-atlas-purple/20 text-atlas-purple">
                            {co.ml_category}
                          </span>
                        </td>
                        <td className="text-right font-mono">
                          <span className={`${
                            co.ml_confidence > 0.9 ? 'text-atlas-green' :
                            co.ml_confidence > 0.8 ? 'text-atlas-blue' :
                            'text-atlas-yellow'
                          }`}>
                            {(co.ml_confidence * 100).toFixed(0)}%
                          </span>
                        </td>
                        <td className="text-right font-mono">${(co.approved_amount || 0).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Recommendations */}
      <div className="mt-6 card p-6">
        <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
          <TrendingUp size={18} className="text-atlas-green" />
          AI Recommendations
        </h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-atlas-blue/10 border border-atlas-blue/30 rounded-lg p-4">
            <div className="text-xs text-atlas-blue font-semibold mb-2">IMMEDIATE</div>
            <p className="text-sm text-slate-300">
              Issue Global Design Bulletin to add grounding specifications to all active projects
            </p>
          </div>
          <div className="bg-atlas-yellow/10 border border-atlas-yellow/30 rounded-lg p-4">
            <div className="text-xs text-atlas-yellow font-semibold mb-2">PREVENTIVE</div>
            <p className="text-sm text-slate-300">
              Update bid documents to include NEC Article 250 requirements explicitly
            </p>
          </div>
          <div className="bg-atlas-green/10 border border-atlas-green/30 rounded-lg p-4">
            <div className="text-xs text-atlas-green font-semibold mb-2">FINANCIAL</div>
            <p className="text-sm text-slate-300">
              Reserve additional ${((pattern?.total_amount || 0) * 0.1).toLocaleString()} for remaining project phases
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
