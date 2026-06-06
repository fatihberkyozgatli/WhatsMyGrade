import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { LandingPage } from './pages/LandingPage';
import { RegisterPage } from './pages/RegisterPage';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { AddCoursePage } from './pages/AddCoursePage';
import { CourseDetailPage } from './pages/CourseDetailPage';
import { AuthProvider, useAuth } from './AuthContext';

function AppContent() {
  const { isAuthenticated, logout } = useAuth();

  return (
    <Router>
      <div className="h-screen flex flex-col overflow-hidden bg-white dark:bg-slate-900">
        <Header isAuthenticated={isAuthenticated} onLogout={() => {
          logout();
          window.location.href = '/';
        }} />
        <main className="flex-1 min-h-0 overflow-y-auto flex flex-col">
          <Routes>
            <Route path="/" element={<LandingPage />} />
        <Route
          path="/register"
          element={
            isAuthenticated ? <Navigate to="/dashboard" /> : <RegisterPage />
          }
        />
        <Route
          path="/login"
          element={
            isAuthenticated ? <Navigate to="/dashboard" /> : <LoginPage />
          }
        />
        <Route
          path="/dashboard"
          element={isAuthenticated ? <DashboardPage /> : <Navigate to="/login" />}
        />
        <Route
          path="/add-course"
          element={isAuthenticated ? <AddCoursePage /> : <Navigate to="/login" />}
        />
        <Route
          path="/course/:courseId"
          element={isAuthenticated ? <CourseDetailPage /> : <Navigate to="/login" />}
        />
            <Route path="*" element={<Navigate to={isAuthenticated ? '/dashboard' : '/'} replace />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
