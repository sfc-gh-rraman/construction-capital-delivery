import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet'
import { DollarSign, Building2, AlertTriangle, ArrowLeft, ExternalLink } from 'lucide-react'
import type { NavigationContext } from '../App'
import 'leaflet/dist/leaflet.css'

interface Project {
  id: string
  name: string
  type: string
  city: string
  state: string
  lat: number
  lng: number
  budget: number
  cpi: number
  spi: number
  riskLevel: string
}

// Component to fit map bounds to markers
function FitBounds({ projects }: { projects: Project[] }) {
  const map = useMap()
  
  useEffect(() => {
    if (projects.length > 0) {
      const bounds = projects.map(p => [p.lat, p.lng] as [number, number])
      map.fitBounds(bounds, { padding: [50, 50] })
    }
  }, [projects, map])
  
  return null
}

export function PortfolioMap({ onNavigate, setSelectedProjectId }: NavigationContext) {
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/projects/map')
      if (res.ok) {
        const data = await res.json()
        setProjects(data)
      }
    } catch (error) {
      console.error('Failed to fetch map data:', error)
      // Fallback data with real US coordinates
      setProjects([
        { id: 'PRJ-001', name: 'Downtown Transit Hub', type: 'TRANSIT', city: 'San Francisco', state: 'CA', lat: 37.7749, lng: -122.4194, budget: 450000000, cpi: 0.89, spi: 0.92, riskLevel: 'critical' },
        { id: 'PRJ-002', name: 'Riverside Substation', type: 'UTILITY', city: 'Portland', state: 'OR', lat: 45.5152, lng: -122.6784, budget: 125000000, cpi: 1.02, spi: 0.98, riskLevel: 'low' },
        { id: 'PRJ-003', name: 'Airport Terminal Expansion', type: 'FACILITY', city: 'Seattle', state: 'WA', lat: 47.4502, lng: -122.3088, budget: 380000000, cpi: 0.94, spi: 0.96, riskLevel: 'medium' },
        { id: 'PRJ-004', name: 'Highway 101 Widening', type: 'HIGHWAY', city: 'San Jose', state: 'CA', lat: 37.3382, lng: -121.8863, budget: 290000000, cpi: 0.97, spi: 1.01, riskLevel: 'low' },
        { id: 'PRJ-005', name: 'Metro Blue Line Extension', type: 'TRANSIT', city: 'Los Angeles', state: 'CA', lat: 34.0522, lng: -118.2437, budget: 520000000, cpi: 0.91, spi: 0.88, riskLevel: 'critical' },
      ])
    } finally {
      setLoading(false)
    }
  }

  const riskColors: Record<string, string> = {
    critical: '#f85149',
    high: '#d29922',
    medium: '#58a6ff',
    low: '#3fb950'
  }

  const totalBudget = projects.reduce((sum, p) => sum + p.budget, 0)
  const criticalCount = projects.filter(p => p.riskLevel === 'critical').length

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="w-12 h-12 border-2 border-atlas-blue border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="h-full flex" style={{ minHeight: 'calc(100vh - 120px)' }}>
      {/* Map Container */}
      <div className="flex-1 relative" style={{ minHeight: '500px' }}>
        {/* Summary stats overlay */}
        <div className="absolute top-4 left-4 right-80 flex gap-4 z-[1000]">
          <div className="card p-3 flex items-center gap-3">
            <Building2 size={20} className="text-atlas-blue" />
            <div>
              <div className="text-lg font-bold text-white">{projects.length}</div>
              <div className="text-xs text-slate-500">Projects</div>
            </div>
          </div>
          <div className="card p-3 flex items-center gap-3">
            <DollarSign size={20} className="text-atlas-green" />
            <div>
              <div className="text-lg font-bold text-white">${(totalBudget / 1e9).toFixed(1)}B</div>
              <div className="text-xs text-slate-500">Total Value</div>
            </div>
          </div>
          <div className="card p-3 flex items-center gap-3">
            <AlertTriangle size={20} className="text-atlas-red" />
            <div>
              <div className="text-lg font-bold text-white">{criticalCount}</div>
              <div className="text-xs text-slate-500">Critical</div>
            </div>
          </div>
        </div>

        {/* Leaflet Map */}
        <MapContainer
          center={[39.8283, -98.5795]} // Center of USA
          zoom={4}
          className="absolute inset-0"
          style={{ background: '#0d1117', height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <FitBounds projects={projects} />
          
          {projects.map((project) => (
            <CircleMarker
              key={project.id}
              center={[project.lat, project.lng]}
              radius={Math.max(8, Math.min(20, project.budget / 50000000))}
              pathOptions={{
                color: riskColors[project.riskLevel] || '#58a6ff',
                fillColor: riskColors[project.riskLevel] || '#58a6ff',
                fillOpacity: 0.7,
                weight: selectedProject?.id === project.id ? 3 : 1
              }}
              eventHandlers={{
                click: () => setSelectedProject(project)
              }}
            >
              <Popup className="custom-popup">
                <div className="text-sm">
                  <div className="font-bold text-navy-900">{project.name}</div>
                  <div className="text-slate-600">{project.city}, {project.state}</div>
                  <div className="mt-1 font-medium">${(project.budget / 1e6).toFixed(0)}M</div>
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>

        {/* Legend */}
        <div className="absolute bottom-4 left-4 card p-4 z-[1000]">
          <h4 className="text-xs font-semibold text-slate-400 mb-3">Risk Level</h4>
          <div className="space-y-2">
            {Object.entries(riskColors).map(([level, color]) => (
              <div key={level} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ background: color }} />
                <span className="text-xs text-slate-300 capitalize">{level}</span>
                <span className="text-xs text-slate-500">
                  ({projects.filter(p => p.riskLevel === level).length})
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Project Detail Panel */}
      <div className="w-80 border-l border-navy-700/50 bg-navy-900/50 overflow-y-auto">
        {selectedProject ? (
          <div className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="font-semibold text-white text-lg">{selectedProject.name}</h2>
                <p className="text-sm text-slate-500">{selectedProject.city}, {selectedProject.state}</p>
              </div>
              <span className={`badge ${
                selectedProject.riskLevel === 'critical' ? 'badge-red' :
                selectedProject.riskLevel === 'high' ? 'badge-yellow' :
                selectedProject.riskLevel === 'medium' ? 'badge-blue' :
                'badge-green'
              }`}>
                {selectedProject.riskLevel}
              </span>
            </div>

            <div className="space-y-4">
              <div className="card p-4">
                <div className="text-xs text-slate-500 mb-1">Project Type</div>
                <div className="font-medium text-white">{selectedProject.type}</div>
              </div>

              <div className="card p-4">
                <div className="text-xs text-slate-500 mb-1">Budget</div>
                <div className="text-2xl font-bold text-white">
                  ${(selectedProject.budget / 1e6).toFixed(0)}M
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="card p-4 text-center">
                  <div className="text-xs text-slate-500 mb-1">CPI</div>
                  <div className={`text-xl font-bold ${
                    selectedProject.cpi >= 1 ? 'text-atlas-green' :
                    selectedProject.cpi >= 0.95 ? 'text-atlas-blue' :
                    selectedProject.cpi >= 0.9 ? 'text-atlas-yellow' :
                    'text-atlas-red'
                  }`}>
                    {selectedProject.cpi.toFixed(2)}
                  </div>
                </div>
                <div className="card p-4 text-center">
                  <div className="text-xs text-slate-500 mb-1">SPI</div>
                  <div className={`text-xl font-bold ${
                    selectedProject.spi >= 1 ? 'text-atlas-green' :
                    selectedProject.spi >= 0.95 ? 'text-atlas-blue' :
                    selectedProject.spi >= 0.9 ? 'text-atlas-yellow' :
                    'text-atlas-red'
                  }`}>
                    {selectedProject.spi.toFixed(2)}
                  </div>
                </div>
              </div>

              <button 
                onClick={() => {
                  setSelectedProjectId(selectedProject.id)
                  onNavigate('project')
                }}
                className="btn-primary w-full justify-center"
              >
                <ExternalLink size={16} />
                View Full Details
              </button>
              
              <button 
                onClick={() => setSelectedProject(null)}
                className="w-full py-2 text-sm text-slate-400 hover:text-white flex items-center justify-center gap-2 transition-colors"
              >
                <ArrowLeft size={14} />
                Back to List
              </button>
            </div>
          </div>
        ) : (
          <div className="p-6">
            <div className="text-center py-8">
              <Building2 size={48} className="mx-auto text-slate-600 mb-4" />
              <h3 className="font-medium text-slate-300 mb-2">Select a Project</h3>
              <p className="text-sm text-slate-500">
                Click on a marker to view project details
              </p>
            </div>

            {/* Project list */}
            <div className="space-y-2 mt-4">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                All Projects
              </h4>
              {projects.map((project) => (
                <div
                  key={project.id}
                  onClick={() => setSelectedProject(project)}
                  className="card-hover p-3 cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ background: riskColors[project.riskLevel] }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-white truncate">
                        {project.name}
                      </div>
                      <div className="text-xs text-slate-500">
                        {project.city}, {project.state}
                      </div>
                    </div>
                    <div className="text-sm text-slate-400">
                      ${(project.budget / 1e6).toFixed(0)}M
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
