import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Documents from './Pages/Documents'
import Announcement from './Pages/Announcement'
import UsersPage from './Pages/UserPage'
import LoginPage from './Pages/Login'
import TendersPage from './Pages/Tenders'
import { useEffect } from 'react'
import useAuthStore from './stores/useAuthStore'
import PartnersPage from './Pages/CreatePartner'
import DeveloperDocumentsPage from './Pages/DeveloperDocs'

// Protected Route wrapper component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const token = localStorage.getItem('token');
  
  // Check both the auth state and token
  if (!isAuthenticated || !token) {
    // Clear any lingering auth data
    localStorage.clear();
    return <Navigate to="/login" replace />;
  }

  return <Layout>{children}</Layout>;
}

function App() {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      localStorage.clear();
    }
  }, [isAuthenticated]);

  return (
    <Router>
      <Routes>
        <Route path="/login" element={
          isAuthenticated ? <Navigate to="/announcements" replace /> : <LoginPage />
        } />
        
        <Route path="/" element={<Navigate to="/announcements" replace />} />
        
        <Route path="/announcements" element={
          <ProtectedRoute>
            <Announcement />
          </ProtectedRoute>
        } />
        
        <Route path="/documents" element={
          <ProtectedRoute>
            <Documents />
          </ProtectedRoute>
        } />
        
        <Route path="/users" element={
          <ProtectedRoute>
            <UsersPage />
          </ProtectedRoute>
        } />

        <Route path="/tenders" element={
          <ProtectedRoute>
            <TendersPage />
          </ProtectedRoute>
        } />

        <Route path="/developer" element={
          <ProtectedRoute>
            <PartnersPage />
          </ProtectedRoute>
        } />

        <Route path="/developersdocs" element={
          <ProtectedRoute>
            <DeveloperDocumentsPage />
          </ProtectedRoute>
        } />

        {/* Catch all route - redirect to login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App
