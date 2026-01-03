import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  ShoppingCart, 
  Bell, 
  Search, 
  Menu, 
  X,
  User,
  LogOut,
  Settings
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const Header = () => {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [showMobileMenu, setShowMobileMenu] = React.useState(false);

  const handleLogout = async () => {
    await signOut();
    toast.success('Sesión cerrada exitosamente');
  };

  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes('/dashboard')) return 'Dashboard';
    if (path.includes('/register')) return 'Caja Registradora';
    if (path.includes('/products')) return 'Gestión de Productos';
    if (path.includes('/reports')) return 'Reportes';
    if (path.includes('/profile')) return 'Mi Perfil';
    return 'Caja Registradora Pro';
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo y título móvil */}
          <div className="flex items-center">
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="lg:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 mr-2"
            >
              {showMobileMenu ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
            
            <Link to="/dashboard" className="flex items-center space-x-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <ShoppingCart className="h-6 w-6 text-white" />
              </div>
              <div className="hidden md:block">
                <h1 className="text-xl font-bold text-gray-900">Caja Registradora</h1>
                <p className="text-xs text-gray-500">Sistema profesional</p>
              </div>
            </Link>
          </div>

          {/* Título de página */}
          <div className="flex-1 max-w-2xl mx-4">
            <h2 className="text-lg font-semibold text-gray-800">{getPageTitle()}</h2>
          </div>

          {/* Barra de búsqueda */}
          <div className="hidden lg:block flex-1 max-w-md mx-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Buscar productos, ventas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Iconos de acción */}
          <div className="flex items-center space-x-4">
            <button className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
            </button>

            {/* Menú de usuario */}
            <div className="relative group">
              <button className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100">
                <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-blue-600" />
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-gray-900">
                    {user?.email?.split('@')[0] || 'Usuario'}
                  </p>
                  <p className="text-xs text-gray-500">Cajero</p>
                </div>
              </button>

              {/* Dropdown menu */}
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                <div className="p-4 border-b border-gray-100">
                  <p className="font-medium text-gray-900">{user?.email}</p>
                  <p className="text-sm text-gray-500">Sesión activa</p>
                </div>
                
                <div className="p-2">
                  <Link
                    to="/profile"
                    className="flex items-center space-x-3 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                  >
                    <User className="h-4 w-4" />
                    <span>Mi Perfil</span>
                  </Link>
                  
                  <Link
                    to="/settings"
                    className="flex items-center space-x-3 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                  >
                    <Settings className="h-4 w-4" />
                    <span>Configuración</span>
                  </Link>
                  
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-3 px-3 py-2 text-red-600 hover:bg-red-50 w-full rounded-lg"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Cerrar Sesión</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;