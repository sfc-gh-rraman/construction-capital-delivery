import { useState } from 'react'
import { Layout } from './components/Layout'
import { 
  Landing,
  MissionControl, 
  PortfolioMap, 
  ProjectDeepDive, 
  ScopeForensics,
  MorningBrief,
  KnowledgeBase,
  Architecture
} from './pages'

export type Page = 'landing' | 'mission' | 'map' | 'project' | 'scope' | 'brief' | 'knowledge' | 'architecture'

export interface NavigationContext {
  onNavigate: (page: Page) => void
  selectedProjectId: string | null
  setSelectedProjectId: (id: string | null) => void
}

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('mission')
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)

  const navContext: NavigationContext = {
    onNavigate: setCurrentPage,
    selectedProjectId,
    setSelectedProjectId
  }

  // Landing page without layout wrapper
  if (currentPage === 'landing') {
    return <Landing onNavigate={setCurrentPage} />
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'mission':
        return <MissionControl {...navContext} />
      case 'map':
        return <PortfolioMap {...navContext} />
      case 'project':
        return <ProjectDeepDive {...navContext} />
      case 'scope':
        return <ScopeForensics {...navContext} />
      case 'brief':
        return <MorningBrief {...navContext} />
      case 'knowledge':
        return <KnowledgeBase {...navContext} />
      case 'architecture':
        return <Architecture {...navContext} />
      default:
        return <MissionControl {...navContext} />
    }
  }

  return (
    <Layout currentPage={currentPage} onNavigate={setCurrentPage}>
      {renderPage()}
    </Layout>
  )
}

export default App
