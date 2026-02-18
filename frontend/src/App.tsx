import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import ChatPage from './pages/ChatPage'
import IdentifyPage from './pages/IdentifyPage'
import LocationsPage from './pages/LocationsPage'
import JournalPage from './pages/JournalPage'
import LearnPage from './pages/LearnPage'
import CommunityPage from './pages/CommunityPage'
import LifeListPage from './pages/LifeListPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="chat" element={<ChatPage />} />
        <Route path="chat/:agentType" element={<ChatPage />} />
        <Route path="identify" element={<IdentifyPage />} />
        <Route path="locations" element={<LocationsPage />} />
        <Route path="journal" element={<JournalPage />} />
        <Route path="lifelist" element={<LifeListPage />} />
        <Route path="learn" element={<LearnPage />} />
        <Route path="community" element={<CommunityPage />} />
      </Route>
    </Routes>
  )
}

export default App
