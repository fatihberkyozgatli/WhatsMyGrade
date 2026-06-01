import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Header } from './components/Header';
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
      <Header isAuthenticated={isAuthenticated} onLogout={() => {
        logout();
        window.location.href = '/';
      }} />
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
      </Routes>
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
