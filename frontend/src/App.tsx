import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { LandingPage } from './pages/LandingPage';
import { RegisterPage } from './pages/RegisterPage';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { AddCoursePage } from './pages/AddCoursePage';
import { CourseDetailPage } from './pages/CourseDetailPage';
import { UploadSyllabusPage } from './pages/UploadSyllabusPage';
import { AuthProvider, useAuth } from './AuthContext';
import { ToastProvider } from './ToastContext';
import { SessionTimeout } from './components/SessionTimeout';

function AppShell() {
  const { isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const isAuthRoute = location.pathname === '/login' || location.pathname === '/register';

  return (
    <div className="h-dvh flex flex-col overflow-hidden bg-white dark:bg-slate-900">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:top-2 focus:left-2 focus:px-3 focus:py-2 focus:rounded-lg focus:bg-white focus:text-blue-600 focus:shadow dark:focus:bg-slate-800 dark:focus:text-blue-400"
      >
        Skip to content
      </a>
      {!isAuthRoute && (
        <Header isAuthenticated={isAuthenticated} onLogout={() => {
          logout();
          window.location.href = '/';
        }} />
      )}
      <main id="main" tabIndex={-1} className="flex-1 min-h-0 overflow-y-auto flex flex-col focus:outline-none">
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
          path="/add-course/upload"
          element={isAuthenticated ? <UploadSyllabusPage /> : <Navigate to="/login" />}
        />
        <Route
          path="/course/:courseId"
          element={isAuthenticated ? <CourseDetailPage /> : <Navigate to="/login" />}
        />
            <Route path="*" element={<Navigate to={isAuthenticated ? '/dashboard' : '/'} replace />} />
          </Routes>
          {!isAuthRoute && <Footer />}
      </main>
      {isAuthenticated && <SessionTimeout />}
    </div>
  );
}

function AppContent() {
  return (
    <Router>
      <AppShell />
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
