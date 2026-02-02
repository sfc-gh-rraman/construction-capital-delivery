import { useState } from 'react'
import type { NavigationContext } from '../App'
import { 
  Search, 
  FileText, 
  Filter,
  ChevronRight,
  Calendar,
  Building2,
  Tag
} from 'lucide-react'

interface SearchResult {
  co_id: string
  project_name: string
  vendor_name: string
  reason_text: string
  approved_amount: number
  ml_category: string
  approval_date: string
  relevance_score?: number
}

export function KnowledgeBase(_props: NavigationContext) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null)
  const [filter, setFilter] = useState<string>('all')

  const searchCOs = async () => {
    if (!query.trim()) return
    
    setLoading(true)
    try {
      const res = await fetch('/api/change-orders/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: query.trim(), limit: 20 })
      })
      
      if (res.ok) {
        const data = await res.json()
        setResults(data)
      }
    } catch (error) {
      console.error('Search failed:', error)
      // Mock results
      setResults([
        { co_id: 'CO-00001', project_name: 'Downtown Transit Hub', vendor_name: 'Apex Electrical', reason_text: 'Grounding not specified in original drawings. Additional ground rods and conductors required per NEC 250.', approved_amount: 3200, ml_category: 'SCOPE_GAP', approval_date: '2024-03-15' },
        { co_id: 'CO-00012', project_name: 'Airport Terminal', vendor_name: 'Apex Electrical', reason_text: 'Equipment grounding per NEC Article 250 not included in contract scope. Install grounding system for all panels.', approved_amount: 2850, ml_category: 'SCOPE_GAP', approval_date: '2024-04-02' },
        { co_id: 'CO-00023', project_name: 'Metro Blue Line', vendor_name: 'Apex Electrical', reason_text: 'Ground wire installation missing from electrical specifications. Add grounding conductors to all circuits.', approved_amount: 4100, ml_category: 'SCOPE_GAP', approval_date: '2024-04-18' },
        { co_id: 'CO-00078', project_name: 'Downtown Transit Hub', vendor_name: 'Delta Mechanical', reason_text: 'Unforeseen rock encountered during excavation for ductbank. Additional equipment and labor required.', approved_amount: 45000, ml_category: 'FIELD_CONDITION', approval_date: '2024-05-01' },
        { co_id: 'CO-00089', project_name: 'Rail Yard Expansion', vendor_name: 'Steel Dynamics', reason_text: 'Structural calculations require revision due to updated seismic requirements. Additional steel members needed.', approved_amount: 125000, ml_category: 'DESIGN_ERROR', approval_date: '2024-05-15' },
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    searchCOs()
  }

  const filteredResults = filter === 'all' 
    ? results 
    : results.filter(r => r.ml_category === filter)

  const categories = ['all', 'SCOPE_GAP', 'DESIGN_ERROR', 'FIELD_CONDITION', 'OWNER_REQUEST']

  return (
    <div className="h-full flex">
      {/* Search Panel */}
      <div className="w-[500px] flex-shrink-0 border-r border-navy-700/50 flex flex-col">
        {/* Search Header */}
        <div className="p-6 border-b border-navy-700/50">
          <h2 className="text-lg font-semibold text-white mb-4">Search Knowledge Base</h2>
          
          <form onSubmit={handleSearch}>
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search COs, contracts, specs..."
                className="input pl-10 pr-20"
              />
              <button
                type="submit"
                disabled={loading || !query.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 btn-primary py-1.5 px-3 text-sm disabled:opacity-50"
              >
                {loading ? '...' : 'Search'}
              </button>
            </div>
          </form>

          {/* Quick searches */}
          <div className="mt-4 flex flex-wrap gap-2">
            {['grounding', 'electrical', 'excavation', 'structural'].map((term) => (
              <button
                key={term}
                onClick={() => {
                  setQuery(term)
                  searchCOs()
                }}
                className="px-3 py-1 bg-navy-700/50 hover:bg-navy-600/50 rounded-full text-xs text-slate-400 hover:text-white transition-colors"
              >
                {term}
              </button>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-navy-700/50">
          <div className="flex items-center gap-2 mb-3">
            <Filter size={14} className="text-slate-500" />
            <span className="text-xs text-slate-500">Filter by category</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`px-3 py-1 rounded-full text-xs transition-colors ${
                  filter === cat
                    ? 'bg-atlas-blue text-white'
                    : 'bg-navy-700/50 text-slate-400 hover:text-white'
                }`}
              >
                {cat === 'all' ? 'All' : cat.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto">
          {filteredResults.length > 0 ? (
            <div className="divide-y divide-navy-700/50">
              {filteredResults.map((result) => (
                <button
                  key={result.co_id}
                  onClick={() => setSelectedResult(result)}
                  className={`w-full text-left p-4 hover:bg-navy-700/30 transition-colors ${
                    selectedResult?.co_id === result.co_id ? 'bg-navy-700/50' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-sm text-atlas-blue">{result.co_id}</span>
                        <span className={`badge ${
                          result.ml_category === 'SCOPE_GAP' ? 'badge-red' :
                          result.ml_category === 'DESIGN_ERROR' ? 'badge-yellow' :
                          result.ml_category === 'FIELD_CONDITION' ? 'badge-blue' :
                          'badge-purple'
                        }`}>
                          {result.ml_category?.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="text-sm text-white mb-1">{result.project_name}</div>
                      <p className="text-xs text-slate-400 line-clamp-2">
                        {result.reason_text}
                      </p>
                    </div>
                    <ChevronRight size={16} className="text-slate-600 flex-shrink-0 mt-1" />
                  </div>
                </button>
              ))}
            </div>
          ) : query && !loading ? (
            <div className="p-8 text-center">
              <FileText size={48} className="mx-auto text-slate-600 mb-4" />
              <p className="text-slate-400">No results found for "{query}"</p>
              <p className="text-sm text-slate-500 mt-2">Try different keywords</p>
            </div>
          ) : (
            <div className="p-8 text-center">
              <Search size={48} className="mx-auto text-slate-600 mb-4" />
              <p className="text-slate-400">Search change orders and contracts</p>
              <p className="text-sm text-slate-500 mt-2">
                Use semantic search to find related documents
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Detail Panel */}
      <div className="flex-1 overflow-y-auto">
        {selectedResult ? (
          <div className="p-6">
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="font-mono text-xl text-atlas-blue">{selectedResult.co_id}</span>
                  <span className={`badge ${
                    selectedResult.ml_category === 'SCOPE_GAP' ? 'badge-red' :
                    selectedResult.ml_category === 'DESIGN_ERROR' ? 'badge-yellow' :
                    selectedResult.ml_category === 'FIELD_CONDITION' ? 'badge-blue' :
                    'badge-purple'
                  }`}>
                    {selectedResult.ml_category?.replace('_', ' ')}
                  </span>
                </div>
                <h2 className="text-lg font-semibold text-white">{selectedResult.project_name}</h2>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-white">
                  ${selectedResult.approved_amount.toLocaleString()}
                </div>
                <div className="text-xs text-slate-500">Approved Amount</div>
              </div>
            </div>

            {/* Metadata */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="card p-4">
                <div className="flex items-center gap-2 text-slate-500 mb-1">
                  <Building2 size={14} />
                  <span className="text-xs">Vendor</span>
                </div>
                <div className="font-medium text-white">{selectedResult.vendor_name}</div>
              </div>
              <div className="card p-4">
                <div className="flex items-center gap-2 text-slate-500 mb-1">
                  <Calendar size={14} />
                  <span className="text-xs">Approval Date</span>
                </div>
                <div className="font-medium text-white">{selectedResult.approval_date}</div>
              </div>
              <div className="card p-4">
                <div className="flex items-center gap-2 text-slate-500 mb-1">
                  <Tag size={14} />
                  <span className="text-xs">ML Classification</span>
                </div>
                <div className="font-medium text-white">{selectedResult.ml_category?.replace('_', ' ')}</div>
              </div>
            </div>

            {/* Reason Text */}
            <div className="card p-6 mb-6">
              <h3 className="font-semibold text-white mb-3">Reason for Change</h3>
              <p className="text-slate-300 leading-relaxed">
                {selectedResult.reason_text}
              </p>
              
              {/* Highlight keywords */}
              {selectedResult.ml_category === 'SCOPE_GAP' && selectedResult.reason_text.toLowerCase().includes('ground') && (
                <div className="mt-4 p-3 bg-atlas-red/10 border border-atlas-red/30 rounded-lg">
                  <div className="flex items-center gap-2 text-atlas-red text-sm">
                    <Tag size={14} />
                    <span>Part of "Missing Grounding Specifications" pattern</span>
                  </div>
                </div>
              )}
            </div>

            {/* Similar COs */}
            <div className="card p-6">
              <h3 className="font-semibold text-white mb-4">Related Change Orders</h3>
              <div className="space-y-3">
                {results.filter(r => r.co_id !== selectedResult.co_id && r.ml_category === selectedResult.ml_category).slice(0, 3).map((r) => (
                  <button
                    key={r.co_id}
                    onClick={() => setSelectedResult(r)}
                    className="w-full text-left p-3 bg-navy-700/30 hover:bg-navy-700/50 rounded-lg transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-mono text-sm text-atlas-blue">{r.co_id}</span>
                        <span className="text-sm text-slate-400 ml-2">{r.project_name}</span>
                      </div>
                      <span className="text-sm text-slate-400">${r.approved_amount.toLocaleString()}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <FileText size={64} className="mx-auto text-slate-600 mb-4" />
              <h3 className="text-lg font-medium text-slate-300 mb-2">Select a Document</h3>
              <p className="text-slate-500">
                Search and click on a result to view details
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
