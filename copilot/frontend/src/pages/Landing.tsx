import { useState, useEffect } from 'react'
import { 
  Brain, 
  Search, 
  BarChart3, 
  Shield, 
  ArrowRight,
  FileText,
  Map,
  Sparkles,
  ChevronRight,
  Building2,
  TrendingUp,
  AlertTriangle,
  Calendar
} from 'lucide-react'

const COPILOT_NAME = "ATLAS"

const features = [
  {
    icon: Brain,
    title: 'Multi-Agent Intelligence',
    description: '4 specialized AI agents analyzing portfolio risk, scope gaps, schedule slippage, and vendor performance.',
    color: 'purple'
  },
  {
    icon: Search,
    title: 'Hidden Discovery Engine',
    description: 'Uncover patterns in change orders that manual review misses - like 156 small COs sharing common root cause.',
    color: 'green'
  },
  {
    icon: BarChart3,
    title: '$3.3B Portfolio Intelligence',
    description: 'Real-time visibility across 12 major infrastructure projects with predictive analytics.',
    color: 'blue'
  },
  {
    icon: Shield,
    title: 'Proactive Risk Detection',
    description: 'ML-powered early warning system identifies at-risk activities before they impact schedule.',
    color: 'red'
  }
]

const stats = [
  { value: '12', label: 'Active Projects', suffix: '' },
  { value: '3.3', label: 'Portfolio Value', suffix: 'B' },
  { value: '156', label: 'Hidden Pattern COs', suffix: '' },
  { value: '4', label: 'AI Agents', suffix: '' },
]

type Page = 'landing' | 'mission' | 'map' | 'project' | 'scope' | 'brief' | 'knowledge' | 'architecture'

interface LandingProps {
  onNavigate: (page: Page) => void
}

export function Landing({ onNavigate }: LandingProps) {
  const [mounted, setMounted] = useState(false)
  const [typedText, setTypedText] = useState('')
  const fullText = `Hello, I'm ${COPILOT_NAME}. Your intelligent Capital Delivery co-pilot.`

  useEffect(() => {
    setMounted(true)
    
    let index = 0
    const interval = setInterval(() => {
      if (index <= fullText.length) {
        setTypedText(fullText.slice(0, index))
        index++
      } else {
        clearInterval(interval)
      }
    }, 40)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen bg-navy-900 overflow-y-auto">
      {/* Hero Section */}
      <div className="relative">
        {/* Animated background gradient */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-atlas-blue/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-atlas-purple/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-navy-900/50 via-transparent to-navy-900" />
        
        <div className="relative max-w-7xl mx-auto px-6 pt-16 pb-24">
          <div className={`text-center transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            {/* Logo */}
            <div className="relative inline-block mb-6">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-atlas-blue to-atlas-purple flex items-center justify-center shadow-2xl shadow-atlas-blue/30">
                <Building2 size={40} className="text-white" />
              </div>
              {/* Glow effect */}
              <div className="absolute inset-0 w-20 h-20 rounded-2xl bg-gradient-to-br from-atlas-blue to-atlas-purple blur-xl opacity-50" />
            </div>

            <h1 className="text-5xl font-bold mb-3">
              <span className="bg-gradient-to-r from-atlas-blue via-cyan-400 to-atlas-purple bg-clip-text text-transparent">
                {COPILOT_NAME}
              </span>
            </h1>
            <p className="text-lg text-slate-400 mb-1">Capital Delivery Intelligence Platform</p>
            <p className="text-sm text-slate-500 mb-6">Powered by Snowflake Cortex AI</p>

            {/* Typing effect intro */}
            <div className="max-w-2xl mx-auto mb-10">
              <div className="bg-navy-800/80 backdrop-blur-sm border border-navy-700 rounded-xl p-5 text-left">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-atlas-blue to-atlas-purple flex items-center justify-center flex-shrink-0">
                    <Sparkles size={20} className="text-white" />
                  </div>
                  <div>
                    <p className="text-lg text-slate-200">
                      {typedText}
                      <span className="inline-block w-0.5 h-5 bg-atlas-blue ml-1 animate-pulse" />
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => onNavigate('mission')}
                className="group flex items-center gap-3 px-7 py-3.5 bg-gradient-to-r from-atlas-blue to-atlas-purple rounded-xl text-white font-semibold text-lg shadow-xl shadow-atlas-blue/25 hover:shadow-atlas-blue/40 hover:scale-105 transition-all"
              >
                Launch Mission Control
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={() => onNavigate('architecture')}
                className="flex items-center gap-2 px-5 py-3.5 bg-navy-700/50 border border-navy-600 rounded-xl text-slate-300 font-medium hover:bg-navy-600/50 hover:border-navy-500 transition-all"
              >
                View Architecture
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className={`bg-navy-800/50 border-y border-navy-700/50 py-6 transition-all duration-1000 delay-300 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <div key={i} className="text-center">
                <p className="text-3xl font-bold text-atlas-blue">
                  {stat.suffix === 'B' ? '$' : ''}{stat.value}<span className="text-xl">{stat.suffix}</span>
                </p>
                <p className="text-sm text-slate-400 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className={`text-center mb-10 transition-all duration-1000 delay-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <h2 className="text-2xl font-bold text-slate-200 mb-3">Intelligent Capital Project Delivery</h2>
          <p className="text-slate-400 max-w-2xl mx-auto">
            Unifying P6 schedules, SAP cost data, and unstructured documents with AI-powered analytics.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-5">
          {features.map((feature, i) => {
            const Icon = feature.icon
            const colorClass = {
              purple: 'from-purple-500/20 to-purple-600/10 border-purple-500/30 text-purple-400',
              green: 'from-green-500/20 to-green-600/10 border-green-500/30 text-green-400',
              blue: 'from-blue-500/20 to-blue-600/10 border-blue-500/30 text-blue-400',
              red: 'from-red-500/20 to-red-600/10 border-red-500/30 text-red-400',
            }[feature.color]
            
            return (
              <div 
                key={i}
                className={`bg-gradient-to-br ${colorClass} border rounded-xl p-6 transition-all duration-500 hover:scale-[1.02] ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
                style={{ transitionDelay: `${600 + i * 100}ms` }}
              >
                <div className="w-11 h-11 rounded-xl bg-navy-800/80 flex items-center justify-center mb-4">
                  <Icon size={22} />
                </div>
                <h3 className="text-lg font-semibold text-slate-200 mb-2">{feature.title}</h3>
                <p className="text-slate-400 text-sm">{feature.description}</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Quick Links */}
      <div className="max-w-7xl mx-auto px-6 pb-16">
        <div className="grid grid-cols-4 gap-3">
          {([
            { icon: TrendingUp, label: 'Mission Control', page: 'mission' as Page, desc: 'Real-time monitoring & AI chat' },
            { icon: Map, label: 'Portfolio Map', page: 'map' as Page, desc: 'Geographic project view' },
            { icon: FileText, label: 'Scope Forensics', page: 'scope' as Page, desc: 'Change order analysis' },
            { icon: Calendar, label: 'Morning Brief', page: 'brief' as Page, desc: 'Daily AI summary' },
          ]).map((link, i) => {
            const Icon = link.icon
            return (
              <button
                key={i}
                onClick={() => onNavigate(link.page)}
                className="bg-navy-800/50 border border-navy-700/50 rounded-xl p-4 text-left group hover:border-atlas-blue/30 hover:bg-navy-800/80 transition-all"
              >
                <div className="flex items-center gap-3 mb-2">
                  <Icon size={18} className="text-atlas-blue" />
                  <span className="font-medium text-slate-200 group-hover:text-atlas-blue transition-colors text-sm">
                    {link.label}
                  </span>
                  <ChevronRight size={14} className="text-slate-500 ml-auto group-hover:translate-x-1 transition-transform" />
                </div>
                <p className="text-xs text-slate-500">{link.desc}</p>
              </button>
            )
          })}
        </div>
      </div>

      {/* Hidden Discovery Highlight */}
      <div className="max-w-7xl mx-auto px-6 pb-16">
        <div className={`bg-gradient-to-r from-atlas-yellow/10 to-atlas-red/10 border border-atlas-yellow/30 rounded-xl p-6 transition-all duration-1000 delay-700 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-atlas-yellow/20 flex items-center justify-center flex-shrink-0">
              <AlertTriangle size={24} className="text-atlas-yellow" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-atlas-yellow mb-2">🔍 Hidden Discovery: Grounding Specification Gap</h3>
              <p className="text-slate-300 text-sm mb-3">
                ATLAS identified <strong className="text-white">156 small change orders</strong> (under $5K each, auto-approved) 
                that share a common root cause: <strong className="text-white">missing grounding specifications</strong> in electrical designs.
              </p>
              <p className="text-slate-400 text-sm">
                Total hidden cost: <strong className="text-atlas-yellow">$780K</strong> across 8 projects • 
                Primary vendor: <strong className="text-white">Apex Electrical Services</strong> • 
                Classification: <strong className="text-white">SCOPE_GAP</strong>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-navy-700/50 py-6">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-sm text-slate-500">
            Built on <span className="text-atlas-blue">Snowflake</span> • Cortex AI • Cortex Agents • SPCS
          </p>
        </div>
      </div>
    </div>
  )
}
