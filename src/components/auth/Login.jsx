import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Lock, Mail, Eye, EyeOff, Store } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';


const Login = () => {
  const { signIn } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();


  const handleSubmit = async (e) => {
  e.preventDefault();

  if (!formData.email || !formData.password) {
    toast.error('Por favor completa todos los campos');
    return;
  }

  setIsLoading(true);

  const result = await signIn(formData.email, formData.password);

  if (result.success) {
    toast.success('Login exitoso');
    navigate('/dashboard'); // 👈 REDIRECCIÓN
  } else {
    setIsLoading(false);
  }
};


  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Credenciales por defecto para desarrollo
  const loadDemoCredentials = () => {
    setFormData({
      email: 'admin@caja.com',
      password: 'admin123'
    });
    toast.success('Credenciales de demo cargadas');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4">
            <Store className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Caja Registradora Pro</h1>
          <p className="text-gray-600 mt-2">Inicia sesión para acceder al sistema</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Correo electrónico
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="usuario@ejemplo.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="remember"
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="remember" className="ml-2 text-sm text-gray-600">
                  Recordar sesión
                </label>
              </div>
              
              <button
                type="button"
                onClick={loadDemoCredentials}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Usar credenciales demo
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200 ${
                isLoading ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Iniciando sesión...
                </div>
              ) : (
                'Iniciar Sesión'
              )}
            </button>

            <div className="text-center">
              <p className="text-sm text-gray-600">
                Para desarrollo: admin@caja.com / admin123
              </p>
            </div>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600 text-center">
              ¿Necesitas ayuda?{' '}
              <a href="#" className="text-blue-600 hover:text-blue-800 font-medium">
                Contacta al administrador
              </a>
            </p>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Sistema de caja registradora v1.0 © {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;