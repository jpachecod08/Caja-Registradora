import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Package, 
  BarChart3, 
  User,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const Sidebar = () => {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const menuItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/register', icon: ShoppingBag, label: 'Caja' },
    { path: '/products', icon: Package, label: 'Productos' },
    { path: '/reports', icon: BarChart3, label: 'Reportes' },
    { path: '/profile', icon: User, label: 'Mi Perfil' },
  ];

  return (
    <aside
      className={`
        ${collapsed ? 'w-20' : 'w-64'}
        bg-white border-r border-gray-200
        min-h-[calc(100vh-64px)]
        transition-all duration-300 hidden lg:block
      `}
    >
      <div className="h-full flex flex-col">
        {/* Botón colapsar */}
        <div className="p-4 border-b border-gray-200 flex justify-end">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4 text-gray-600" />
            ) : (
              <ChevronLeft className="h-4 w-4 text-gray-600" />
            )}
          </button>
        </div>

        {/* Menú */}
        <nav className="flex-1 p-4">
          <ul className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`
                      flex items-center
                      ${collapsed ? 'justify-center' : 'space-x-3'}
                      px-4 py-3 rounded-lg transition-colors relative
                      ${
                        isActive
                          ? 'bg-blue-50 text-blue-600 font-medium'
                          : 'text-gray-700 hover:bg-gray-100'
                      }
                    `}
                    title={collapsed ? item.label : ''}
                  >
                    <Icon className="h-5 w-5" />
                    {!collapsed && <span>{item.label}</span>}

                    {isActive && !collapsed && (
                      <span className="absolute right-4 top-1/2 -translate-y-1/2">
                        <span className="h-2 w-2 bg-blue-600 rounded-full block"></span>
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Versión */}
        {!collapsed && (
          <div className="p-4 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              v1.0.0 • Caja Registradora Pro
            </p>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
