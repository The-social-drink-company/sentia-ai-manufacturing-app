import { BrowserRouter, Route, Routes } from 'react-router-dom'
import PureLandingPage from '@/components/PureLandingPage'

// Pure marketing site - NO CLERK
const AppNoClerk = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<PureLandingPage />} />
      <Route path="/landing" element={<PureLandingPage />} />
      <Route path="*" element={<PureLandingPage />} />
    </Routes>
  </BrowserRouter>
)

export default AppNoClerk
