import React, { useEffect, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import ErrorBoundary from './components/ErrorBoundary';
import { FullPageLoader } from './components/ui/LoadingStates';


const Login = React.lazy(() => import('./pages/Login'));
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const MeetingRoom = React.lazy(() => import('./pages/MeetingRoom'));
const ProjectBoard = React.lazy(() => import('./pages/ProjectBoard'));
const Pricing = React.lazy(() => import('./pages/Pricing'));
const Analytics = React.lazy(() => import('./pages/Analytics'));

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuthStore();
  
  if (isLoading) return <FullPageLoader message="Authenticating..." />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  
  return children;
};

function App() {
  const { initializeAuth } = useAuthStore();

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  return (
    <ErrorBoundary>
      <Router>
        <div className="min-h-screen bg-background font-sans antialiased text-foreground selection:bg-stone-200">
          <Suspense fallback={<FullPageLoader message="Loading application..." />}>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/meeting/:id" 
                element={
                  <ProtectedRoute>
                    <MeetingRoom />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/board" 
                element={
                  <ProtectedRoute>
                    <ProjectBoard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/pricing" 
                element={
                  <ProtectedRoute>
                    <Pricing />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/analytics" 
                element={
                  <ProtectedRoute>
                    <Analytics />
                  </ProtectedRoute>
                } 
              />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </Suspense>
        </div>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
