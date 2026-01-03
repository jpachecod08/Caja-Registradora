import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import Login from './components/auth/Login';
import PrivateRoute from './components/auth/PrivateRoute';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import Register from './pages/Register';
import Products from './pages/Products';
import Reports from './pages/Reports';
import Profile from './pages/Profile';

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="App">
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: '#10B981',
                  secondary: '#fff',
                },
              },
              error: {
                duration: 4000,
                iconTheme: {
                  primary: '#EF4444',
                  secondary: '#fff',
                },
              },
            }}
          />
          
          <Routes>
            <Route path="/login" element={<Login />} />
            
            <Route path="/" element={
              <PrivateRoute>
                <Layout />
              </PrivateRoute>
            }>
              <Route index element={<Navigate to="/dashboard" />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="register" element={<Register />} />
              <Route path="products" element={<Products />} />
              <Route path="reports" element={<Reports />} />
              <Route path="profile" element={<Profile />} />
            </Route>
            
            <Route path="*" element={<Navigate to="/login" />} />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;