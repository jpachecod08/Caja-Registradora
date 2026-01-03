import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { DollarSign, ShoppingBag, Package, AlertTriangle } from 'lucide-react';
import { toast } from 'react-hot-toast';

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    todayRevenue: 0,
    todaySales: 0,
    activeProducts: 0,
    lowStockProducts: 0,
    recentSales: []
  });

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);

      const today = new Date();
      const start = new Date(today.setHours(0, 0, 0, 0)).toISOString();
      const end = new Date(today.setHours(23, 59, 59, 999)).toISOString();

      const [
        productsRes,
        todaySalesRes,
        recentSalesRes
      ] = await Promise.all([
        supabase.from('products').select('stock, min_stock, is_active'),
        supabase
          .from('sales')
          .select('total_amount')
          .gte('created_at', start)
          .lte('created_at', end),
        supabase
          .from('sales')
          .select('id, sale_number, total_amount, created_at')
          .order('created_at', { ascending: false })
          .limit(5)
      ]);

      const products = productsRes.data || [];
      const salesToday = todaySalesRes.data || [];

      setStats({
        todaySales: salesToday.length,
        todayRevenue: salesToday.reduce((sum, s) => sum + s.total_amount, 0),
        activeProducts: products.filter(p => p.is_active).length,
        lowStockProducts: products.filter(
          p => p.stock <= p.min_stock && p.stock > 0
        ).length,
        recentSales: recentSalesRes.data || []
      });

    } catch (error) {
      console.error(error);
      toast.error('Error al cargar el dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-gray-500">Cargando dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Resumen general del sistema</p>
      </header>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard title="Ingresos hoy" value={`$${stats.todayRevenue.toFixed(2)}`} icon={DollarSign} />
        <StatCard title="Ventas hoy" value={stats.todaySales} icon={ShoppingBag} />
        <StatCard title="Productos activos" value={stats.activeProducts} icon={Package} />
        <StatCard title="Bajo stock" value={stats.lowStockProducts} icon={AlertTriangle} />
      </div>

      {/* Ventas recientes */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Ventas recientes</h3>

        {stats.recentSales.length === 0 ? (
          <p className="text-gray-500">No hay ventas recientes</p>
        ) : (
          <ul className="divide-y">
            {stats.recentSales.map(sale => (
              <li key={sale.id} className="py-3 flex justify-between">
                <span>Venta #{sale.sale_number}</span>
                <span className="font-semibold">
                  ${sale.total_amount.toFixed(2)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon: Icon }) => (
  <div className="card flex items-center justify-between">
    <div>
      <p className="text-sm text-gray-500">{title}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
    <div className="bg-blue-100 p-3 rounded-xl">
      <Icon className="h-6 w-6 text-blue-600" />
    </div>
  </div>
);

export default Dashboard;
