import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { exportSalesToExcel, exportProductsToExcel } from '../services/exportService';
import { toast } from 'react-hot-toast';
import { 
  FileSpreadsheet, 
  Calendar, 
  Filter, 
  Download, 
  BarChart3,
  TrendingUp,
  DollarSign,
  ShoppingBag,
  PieChart,
  RefreshCw
} from 'lucide-react';

const Reports = () => {
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [reportData, setReportData] = useState({
    totalSales: 0,
    totalRevenue: 0,
    averageTicket: 0,
    topProducts: [],
    salesByDay: [],
    loading: true
  });
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchReportData();
  }, [dateRange]);

  const fetchReportData = async () => {
    try {
      setReportData(prev => ({ ...prev, loading: true }));

      const { data: sales, error } = await supabase
        .from('sales')
        .select(`
          *,
          sale_items (*)
        `)
        .gte('created_at', dateRange.startDate)
        .lte('created_at', dateRange.endDate + 'T23:59:59')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const salesList = sales || [];
      const totalRevenue = salesList.reduce((sum, sale) => sum + sale.total_amount, 0);
      const averageTicket = salesList.length > 0 ? totalRevenue / salesList.length : 0;

      // Calcular productos más vendidos
      const productSales = {};
      salesList.forEach(sale => {
        sale.sale_items?.forEach(item => {
          if (!productSales[item.product_name]) {
            productSales[item.product_name] = {
              name: item.product_name,
              quantity: 0,
              revenue: 0
            };
          }
          productSales[item.product_name].quantity += item.quantity;
          productSales[item.product_name].revenue += item.subtotal;
        });
      });

      const topProducts = Object.values(productSales)
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5);

      // Ventas por día
      const salesByDay = {};
      salesList.forEach(sale => {
        const date = new Date(sale.created_at).toLocaleDateString();
        if (!salesByDay[date]) {
          salesByDay[date] = {
            date,
            sales: 0,
            revenue: 0
          };
        }
        salesByDay[date].sales += 1;
        salesByDay[date].revenue += sale.total_amount;
      });

      setReportData({
        totalSales: salesList.length,
        totalRevenue,
        averageTicket,
        topProducts,
        salesByDay: Object.values(salesByDay).sort((a, b) => 
          new Date(a.date) - new Date(b.date)
        ),
        loading: false
      });

    } catch (error) {
      console.error('Error fetching report data:', error);
      toast.error('Error al cargar datos del reporte');
      setReportData(prev => ({ ...prev, loading: false }));
    }
  };

  const handleExportSales = async () => {
    try {
      setExporting(true);
      await exportSalesToExcel(dateRange.startDate, dateRange.endDate);
      toast.success('Ventas exportadas exitosamente');
    } catch (error) {
      console.error('Error exporting sales:', error);
      toast.error('Error al exportar ventas');
    } finally {
      setExporting(false);
    }
  };

  const handleExportProducts = async () => {
    try {
      setExporting(true);
      await exportProductsToExcel();
      toast.success('Productos exportados exitosamente');
    } catch (error) {
      console.error('Error exporting products:', error);
      toast.error('Error al exportar productos');
    } finally {
      setExporting(false);
    }
  };

  const stats = [
    {
      title: 'Total Ventas',
      value: reportData.totalSales,
      icon: ShoppingBag,
      color: 'bg-blue-500'
    },
    {
      title: 'Ingreso Total',
      value: `$${reportData.totalRevenue.toFixed(2)}`,
      icon: DollarSign,
      color: 'bg-green-500'
    },
    {
      title: 'Ticket Promedio',
      value: `$${reportData.averageTicket.toFixed(2)}`,
      icon: TrendingUp,
      color: 'bg-purple-500'
    },
    {
      title: 'Período',
      value: `${dateRange.startDate} - ${dateRange.endDate}`,
      icon: Calendar,
      color: 'bg-orange-500'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reportes y Análisis</h1>
          <p className="text-gray-600 mt-1">Estadísticas y exportación de datos</p>
        </div>
        
        <div className="flex items-center space-x-3 mt-4 lg:mt-0">
          <button
            onClick={fetchReportData}
            className="btn-secondary flex items-center"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="card">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rango de fechas
            </label>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex items-center space-x-2 flex-1">
                <Calendar className="h-4 w-4 text-gray-400" />
                <input
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => setDateRange(prev => ({ 
                    ...prev, 
                    startDate: e.target.value 
                  }))}
                  className="input-field"
                />
              </div>
              
              <span className="text-gray-400 hidden sm:block">a</span>
              
              <div className="flex items-center space-x-2 flex-1">
                <Calendar className="h-4 w-4 text-gray-400" />
                <input
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => setDateRange(prev => ({ 
                    ...prev, 
                    endDate: e.target.value 
                  }))}
                  className="input-field"
                />
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <Filter className="h-5 w-5 text-gray-500" />
              <button className="btn-secondary">
                Más filtros
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold mt-2 text-gray-900">
                    {stat.value}
                  </p>
                </div>
                <div className={`${stat.color} p-3 rounded-xl`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Exportación */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <FileSpreadsheet className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Exportar Datos</h3>
              <p className="text-sm text-gray-500">Descarga reportes en Excel</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border border-gray-200 rounded-xl p-6 hover:border-blue-300 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="bg-green-100 p-2 rounded-lg">
                  <ShoppingBag className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Reporte de Ventas</h4>
                  <p className="text-sm text-gray-500">
                    {reportData.totalSales} ventas en el período
                  </p>
                </div>
              </div>
            </div>
            
            <p className="text-gray-600 mb-4">
              Exporta todas las ventas del período seleccionado con detalles completos.
            </p>
            
            <button
              onClick={handleExportSales}
              disabled={exporting || reportData.totalSales === 0}
              className={`w-full btn-primary ${
                (exporting || reportData.totalSales === 0) ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {exporting ? (
                <>
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Exportando...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Exportar Ventas
                </>
              )}
            </button>
          </div>

          <div className="border border-gray-200 rounded-xl p-6 hover:border-blue-300 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Catálogo de Productos</h4>
                  <p className="text-sm text-gray-500">Inventario completo</p>
                </div>
              </div>
            </div>
            
            <p className="text-gray-600 mb-4">
              Exporta todos los productos con precios, stock y categorías.
            </p>
            
            <button
              onClick={handleExportProducts}
              disabled={exporting}
              className={`w-full btn-primary ${
                exporting ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {exporting ? (
                <>
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Exportando...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Exportar Productos
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Productos más vendidos */}
      <div className="card">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">Productos Más Vendidos</h3>
        
        {reportData.topProducts.length > 0 ? (
          <div className="space-y-4">
            {reportData.topProducts.map((product, index) => (
              <div key={index} className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:bg-gray-50">
                <div className="flex items-center space-x-4">
                  <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="font-bold text-blue-600">{index + 1}</span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{product.name}</div>
                    <div className="text-sm text-gray-500">
                      {product.quantity} unidades vendidas
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-gray-900">
                    ${product.revenue.toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-500">Ingreso total</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <PieChart className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No hay datos de ventas en este período</p>
          </div>
        )}
      </div>

      {/* Ventas por día */}
      <div className="card">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">Ventas por Día</h3>
        
        {reportData.salesByDay.length > 0 ? (
          <div className="space-y-4">
            {reportData.salesByDay.map((day, index) => (
              <div key={index} className="flex items-center">
                <div className="w-32 text-sm text-gray-600">
                  {day.date}
                </div>
                <div className="flex-1">
                  <div className="h-8 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-green-500 rounded-full"
                      style={{ 
                        width: `${Math.min(100, (day.revenue / (reportData.salesByDay.reduce((max, d) => Math.max(max, d.revenue), 1)) * 100))}%` 
                      }}
                    ></div>
                  </div>
                </div>
                <div className="w-28 text-right">
                  <div className="font-medium">${day.revenue.toFixed(2)}</div>
                  <div className="text-sm text-gray-500">{day.sales} ventas</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <BarChart3 className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No hay datos de ventas por día</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;