import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import ReportEmergency from './pages/ReportEmergency';
import HospitalDashboard from './pages/HospitalDashboard';
import AdminDashboard from './pages/AdminDashboard';
import LiveMap from './pages/LiveMap';
import Login from './pages/Login';
import Register from './pages/Register';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <Router>
          <div className="min-h-screen bg-surface-bg text-surface-text transition-human">
            <Navbar />
            <main className="container mx-auto px-6 py-10">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/report" element={<ReportEmergency />} />
                <Route 
                  path="/hospitals" 
                  element={<ProtectedRoute><HospitalDashboard /></ProtectedRoute>} 
                />
                <Route 
                  path="/admin" 
                  element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} 
                />
                <Route path="/map" element={<LiveMap />} />
              </Routes>
            </main>
          </div>
        </Router>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
