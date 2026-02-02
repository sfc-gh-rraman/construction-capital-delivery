import { useState, useEffect } from 'react'
import { 
  ArrowRight, 
  Building2, 
  DollarSign, 
  TrendingUp, 
  AlertTriangle,
  Sparkles,
  Cpu,
  Database,
  Search
} from 'lucide-react'
import type { Page } from '../App'

interface LandingProps {
  onNavigate: (page: Page) => void
}

export function Landing({ onNavigate }: LandingProps) {
  const [typedText, setTypedText] = useState('')
  const fullText = 'Capital Delivery Intelligence Platform'

  useEffect(() => {
    let index = 0
    const timer = setInterval(() => {
      if (index < fullText.length) {
        setTypedText(fullText.slice(0, index + 1))
        index++
      } else {
        clearInterval(timer)
      }
    }, 50)
    return () => clearInterval(timer)
  }, [])

  const stats = [
    { label: 'Portfolio Value', value: '$2.3B', icon: DollarSign },
    { label: 'Active Projects', value: '12', icon: Building2 },
    { label: 'Avg CPI', value: '0.97', icon: TrendingUp },
    { label: 'ML Models', value: '4', icon: Cpu },
  ]

  const features = [
    {
      icon: AlertTriangle,
      title: 'Hidden Discovery',
      description: 'AI detects systemic patterns in change orders that human reviewers miss'
    },
    {
      icon: Search,
      title: 'Scope Forensics',
      description: 'Semantic search across contracts and CO narratives'
    },
    {
      icon: Database,
      title: 'Snowflake Native',
      description: 'Built on Cortex AI with Text-to-SQL and RAG'
    },
    {
      icon: Sparkles,
      title: 'Multi-Agent AI',
      description: '4 specialized agents for portfolio intelligence'
    },
  ]

  return (
    <div className="min-h-screen bg-navy-950 animated-grid-bg">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-atlas-blue/5 via-transparent to-transparent pointer-events-none" />
      
      {/* Content */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Header */}
        <header className="p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-atlas-blue to-atlas-purple flex items-center justify-center">
              <span className="text-white font-bold text-lg">A</span>
            </div>
            <div>
              <span className="font-display font-bold text-xl text-white">ATLAS</span>
              <span className="text-xs text-slate-500 block -mt-1">Automated Total Lifecycle Analysis System</span>
            </div>
          </div>
        </header>

        {/* Hero */}
        <main className="flex-1 flex items-center justify-center px-8 pb-20">
          <div className="max-w-5xl mx-auto text-center">
            {/* Tagline */}
            <div className="mb-6 inline-flex items-center gap-2 px-4 py-2 bg-atlas-blue/10 border border-atlas-blue/20 rounded-full">
              <Sparkles size={16} className="text-atlas-blue" />
              <span className="text-sm text-atlas-blue">Powered by Snowflake Cortex AI</span>
            </div>

            {/* Main title */}
            <h1 className="text-5xl md:text-6xl font-display font-bold text-white mb-4">
              <span className="text-atlas-blue">{typedText}</span>
              <span className="animate-pulse">|</span>
            </h1>

            <p className="text-xl text-slate-400 mb-12 max-w-2xl mx-auto">
              Surface hidden patterns in your capital portfolio. Predict cost overruns before they happen. 
              Deliver projects on time and on budget.
            </p>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
              {stats.map((stat, i) => (
                <div 
                  key={i}
                  className="card-glow p-6 animate-fade-in"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <stat.icon className="w-6 h-6 text-atlas-blue mx-auto mb-2" />
                  <div className="text-2xl font-bold text-white">{stat.value}</div>
                  <div className="text-xs text-slate-500">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* CTA */}
            <button
              onClick={() => onNavigate('mission')}
              className="btn-primary text-lg px-8 py-4 animate-glow"
            >
              Enter Mission Control
              <ArrowRight size={20} />
            </button>
          </div>
        </main>

        {/* Features */}
        <section className="border-t border-navy-700/50 bg-navy-900/50 py-16 px-8">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-center text-2xl font-display font-bold text-white mb-12">
              Intelligence at Every Level
            </h2>
            <div className="grid md:grid-cols-4 gap-6">
              {features.map((feature, i) => (
                <div 
                  key={i}
                  className="card p-6 animate-slide-up"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <div className="w-12 h-12 rounded-lg bg-atlas-blue/10 flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-atlas-blue" />
                  </div>
                  <h3 className="font-semibold text-white mb-2">{feature.title}</h3>
                  <p className="text-sm text-slate-400">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-navy-700/50 py-6 px-8">
          <div className="max-w-5xl mx-auto flex items-center justify-between text-sm text-slate-500">
            <span>Built on Snowflake • Cortex AI • React</span>
            <span>Part of the Snowflake Solutions Demo Suite</span>
          </div>
        </footer>
      </div>
    </div>
  )
}
