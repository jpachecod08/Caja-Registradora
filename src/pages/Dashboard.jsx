import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { 
  DollarSign, 
  ShoppingBag, 
  Package, 
  AlertTriangle,
  Search,
  Filter,
  User,
  Calendar,
  CreditCard,
  Wallet,
  ChevronDown,
  ChevronUp,
  Eye,
  X,
  CheckCircle,
  Clock,
  Printer  // Agregado: Icono para imprimir recibo
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    todayRevenue: 0,
    todaySales: 0,
    activeProducts: 0,
    lowStockProducts: 0,
    totalSales: 0,
    totalRevenue: 0
  });
  
  const [sales, setSales] = useState([]);
  const [filteredSales, setFilteredSales] = useState([]);
  const [selectedSale, setSelectedSale] = useState(null);
  const [selectedSaleItems, setSelectedSaleItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    accountType: 'all',
    paymentMethod: 'all',
    productState: 'all',
    status: 'all'
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [sortField, setSortField] = useState('created_at');
  const [sortDirection, setSortDirection] = useState('desc');

  useEffect(() => {
    loadDashboard();
  }, []);

  useEffect(() => {
    applyFiltersAndSearch();
  }, [sales, searchTerm, filters, sortField, sortDirection]);

  const loadDashboard = async () => {
    try {
      setLoading(true);

      const today = new Date();
      const start = new Date(today.setHours(0, 0, 0, 0)).toISOString();
      const end = new Date(today.setHours(23, 59, 59, 999)).toISOString();

      const [
        productsRes,
        todaySalesRes,
        allSalesRes,
        salesRes
      ] = await Promise.all([
        supabase.from('products').select('stock, min_stock, is_active'),
        supabase
          .from('sales')
          .select('total_amount')
          .gte('created_at', start)
          .lte('created_at', end),
        supabase.from('sales').select('*'),
        supabase
          .from('sales')
          .select('*')
          .order('created_at', { ascending: false })
      ]);

      const products = productsRes.data || [];
      const salesToday = todaySalesRes.data || [];
      const allSales = allSalesRes.data || [];
      const salesData = salesRes.data || [];

      setStats({
        todaySales: salesToday.length,
        todayRevenue: salesToday.reduce((sum, s) => sum + s.total_amount, 0),
        activeProducts: products.filter(p => p.is_active).length,
        lowStockProducts: products.filter(
          p => p.stock <= p.min_stock && p.stock > 0
        ).length,
        totalSales: allSales.length,
        totalRevenue: allSales.reduce((sum, s) => sum + s.total_amount, 0)
      });

      setSales(salesData);
      setFilteredSales(salesData);

    } catch (error) {
      console.error(error);
      toast.error('Error al cargar el dashboard');
    } finally {
      setLoading(false);
    }
  };

  // Función para imprimir recibo de una venta
  const printSaleReceipt = async (sale) => {
    try {
      // 1. Cargar los items de la venta
      const { data: saleItems, error } = await supabase
        .from('sale_items')
        .select('*')
        .eq('sale_id', sale.id);
      
      if (error) throw error;
      
      // 2. Calcular totales
      const subtotal = saleItems.reduce((sum, item) => sum + item.subtotal, 0);
      const totalWithDelivery = subtotal + (sale.delivery_fee || 0);
      
      // 3. Crear el HTML del recibo
      const receiptWindow = window.open('', '_blank');
      
      const receiptHTML = `
        <html>
          <head>
            <title>Recibo #${sale.sale_number}</title>
            <style>
              body { 
                font-family: 'Courier New', monospace; 
                width: 80mm;
                padding: 10px;
                margin: 0;
              }
              .header { 
                text-align: center; 
                margin-bottom: 15px;
                padding-bottom: 10px;
                border-bottom: 1px dashed #000;
              }
              .item { 
                display: flex; 
                justify-content: space-between; 
                margin: 5px 0;
                font-size: 12px;
              }
              .item-detail {
                display: flex;
                flex-direction: column;
              }
              .subtotal { 
                border-top: 1px solid #000; 
                margin-top: 10px; 
                padding-top: 10px;
              }
              .total { 
                border-top: 2px solid #000; 
                margin-top: 10px; 
                padding-top: 10px;
                font-weight: bold;
              }
              .footer {
                text-align: center;
                margin-top: 20px;
                font-size: 10px;
                color: #666;
              }
              .separator {
                border-top: 1px dashed #ccc;
                margin: 10px 0;
              }
              .badge {
                display: inline-block;
                padding: 2px 6px;
                border-radius: 4px;
                font-size: 10px;
                font-weight: bold;
                margin-left: 5px;
              }
              .badge-credito {
                background: #fef3c7;
                color: #92400e;
              }
              .badge-frito {
                background: #fee2e2;
                color: #991b1b;
              }
              .badge-congelado {
                background: #dbeafe;
                color: #1e40af;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h2 style="margin: 0">CAJA REGISTRADORA</h2>
              <p style="margin: 5px 0">Recibo #${sale.sale_number}</p>
              <p style="margin: 5px 0">${new Date(sale.created_at).toLocaleString('es-CO')}</p>
            </div>
            
            <div class="separator"></div>
            
            ${saleItems.map(item => `
              <div class="item">
                <div class="item-detail">
                  <div>${item.product_name}</div>
                  <div>${item.quantity} x $${item.unit_price.toFixed(2)}</div>
                  <div>
                    <span class="badge badge-${sale.product_state}">${sale.product_state === 'frito' ? 'FRITO' : 'CONGELADO'}</span>
                  </div>
                </div>
                <div>$${item.subtotal.toFixed(2)}</div>
              </div>
            `).join('')}
            
            <div class="separator"></div>
            
            <div class="item subtotal">
              <div>Subtotal</div>
              <div>$${subtotal.toFixed(2)}</div>
            </div>
            
            ${sale.delivery_fee > 0 ? `
              <div class="item">
                <div>Domicilio</div>
                <div>$${parseFloat(sale.delivery_fee).toFixed(2)}</div>
              </div>
            ` : ''}
            
            <div class="item total">
              <div>TOTAL</div>
              <div>$${totalWithDelivery.toFixed(2)}</div>
            </div>
            
            <div class="separator"></div>
            
            <div class="item">
              <div>Método de pago:</div>
              <div>${sale.payment_method === 'cash' ? 'Efectivo' : 'Transferencia'}</div>
            </div>
            
            <div class="item">
              <div>Tipo de cuenta:</div>
              <div>
                ${sale.account_type === 'credito' ? 'Crédito' : 'Contado'}
                ${sale.account_type === 'credito' ? '<span class="badge badge-credito">CRÉDITO</span>' : ''}
              </div>
            </div>
            
            ${sale.customer_name ? `
              <div class="item">
                <div>Cliente:</div>
                <div>${sale.customer_name}</div>
              </div>
            ` : ''}
            
            ${sale.phone ? `
              <div class="item">
                <div>Teléfono:</div>
                <div>${sale.phone}</div>
              </div>
            ` : ''}
            
            ${sale.address ? `
              <div class="item">
                <div>Dirección:</div>
                <div>${sale.address}</div>
              </div>
            ` : ''}
            
            <div class="footer">
              <p>¡Gracias por su compra!</p>
              <p>Vuelva pronto</p>
              <p>${new Date().getFullYear()} © Caja Registradora</p>
            </div>
          </body>
        </html>
      `;
      
      receiptWindow.document.write(receiptHTML);
      receiptWindow.document.close();
      
      // Mostrar mensaje de éxito
      toast.success(`Recibo #${sale.sale_number} generado. Se abrirá en una nueva ventana.`);
      
    } catch (error) {
      console.error('Error generando recibo:', error);
      toast.error('Error al generar el recibo: ' + error.message);
    }
  };

  const loadSaleItems = async (saleId) => {
    try {
      console.log('🔍 Buscando items para sale_id:', saleId);
      
      const { data: items, error } = await supabase
        .from('sale_items')
        .select('*')
        .eq('sale_id', saleId);

      if (error) {
        console.error('❌ Error en consulta de items:', error);
        throw error;
      }
      
      console.log('✅ Items encontrados:', items);
      return items || [];
      
    } catch (error) {
      console.error('❌ Error cargando items:', error);
      toast.error('Error al cargar productos de la venta');
      return [];
    }
  };

  const showSaleDetails = async (sale) => {
    console.log('🔄 Mostrando detalles de venta:', sale.id);
    setSelectedSale(sale);
    
    // Cargar los items de la venta
    const items = await loadSaleItems(sale.id);
    console.log('📦 Items cargados para modal:', items);
    setSelectedSaleItems(items);
  };

  const applyFiltersAndSearch = () => {
    let result = [...sales];

    // Aplicar búsqueda
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(sale => 
        sale.customer_name?.toLowerCase().includes(term) ||
        sale.sale_number?.toString().includes(term) ||
        sale.phone?.toLowerCase().includes(term)
      );
    }

    // Aplicar filtros
    if (filters.accountType !== 'all') {
      result = result.filter(sale => sale.account_type === filters.accountType);
    }
    
    if (filters.paymentMethod !== 'all') {
      result = result.filter(sale => sale.payment_method === filters.paymentMethod);
    }
    
    if (filters.productState !== 'all') {
      result = result.filter(sale => sale.product_state === filters.productState);
    }
    
    if (filters.status !== 'all') {
      result = result.filter(sale => sale.status === filters.status);
    }

    // Aplicar ordenamiento
    result.sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];
      
      // Manejar fechas
      if (sortField.includes('date') || sortField === 'created_at') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }
      
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredSales(result);
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const AccountTypeBadge = ({ type }) => {
    const config = {
      contado: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      credito: { color: 'bg-yellow-100 text-yellow-800', icon: Clock }
    };
    
    const configItem = config[type] || { color: 'bg-gray-100 text-gray-800', icon: CreditCard };
    const Icon = configItem.icon || CreditCard;
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${configItem.color}`}>
        <Icon className="h-3 w-3" />
        {type === 'contado' ? 'Contado' : type === 'credito' ? 'Crédito' : type || 'No especificado'}
      </span>
    );
  };

  const PaymentMethodBadge = ({ method }) => {
    const config = {
      cash: { color: 'bg-green-100 text-green-800', label: 'Efectivo', icon: DollarSign },
      transfer: { color: 'bg-purple-100 text-purple-800', label: 'Transferencia', icon: Wallet }
    };
    
    const configItem = config[method] || { color: 'bg-gray-100 text-gray-800', label: method || 'No especificado', icon: CreditCard };
    const Icon = configItem.icon || CreditCard;
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${configItem.color}`}>
        <Icon className="h-3 w-3" />
        {configItem.label}
      </span>
    );
  };

  const ProductStateBadge = ({ state }) => {
    const config = {
      frito: { color: 'bg-red-100 text-red-800', label: 'Frito' },
      congelado: { color: 'bg-blue-100 text-blue-800', label: 'Congelado' }
    };
    
    const configItem = config[state] || { color: 'bg-gray-100 text-gray-800', label: state || 'No especificado' };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${configItem.color}`}>
        {configItem.label}
      </span>
    );
  };

  // Paginación
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredSales.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredSales.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Cargando dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Resumen general y gestión de ventas</p>
      </header>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Ingresos hoy" 
          value={formatCurrency(stats.todayRevenue)} 
          icon={DollarSign}
          trend="daily"
        />
        <StatCard 
          title="Ventas hoy" 
          value={stats.todaySales} 
          icon={ShoppingBag}
          subtitle={`Total: ${stats.totalSales}`}
        />
        <StatCard 
          title="Productos activos" 
          value={stats.activeProducts} 
          icon={Package}
        />
        <StatCard 
          title="Bajo stock" 
          value={stats.lowStockProducts} 
          icon={AlertTriangle}
          alert={stats.lowStockProducts > 0}
        />
      </div>

      {/* Panel de filtros y búsqueda */}
      <div className="card space-y-4">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
          <h3 className="text-lg font-semibold">Registro de Ventas</h3>
          
          <div className="flex gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por cliente, teléfono o # venta..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <button 
              className="px-4 py-2 border rounded-lg flex items-center gap-2 hover:bg-gray-50"
              onClick={() => {
                setFilters({
                  accountType: 'all',
                  paymentMethod: 'all',
                  productState: 'all',
                  status: 'all'
                });
                setSearchTerm('');
              }}
            >
              <Filter className="h-4 w-4" />
              Limpiar filtros
            </button>
          </div>
        </div>

        {/* Filtros rápidos */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de cuenta</label>
            <select
              value={filters.accountType}
              onChange={(e) => setFilters({...filters, accountType: e.target.value})}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todos</option>
              <option value="contado">Contado</option>
              <option value="credito">Crédito</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Método de pago</label>
            <select
              value={filters.paymentMethod}
              onChange={(e) => setFilters({...filters, paymentMethod: e.target.value})}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todos</option>
              <option value="cash">Efectivo</option>
              <option value="transfer">Transferencia</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estado producto</label>
            <select
              value={filters.productState}
              onChange={(e) => setFilters({...filters, productState: e.target.value})}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todos</option>
              <option value="congelado">Congelado</option>
              <option value="frito">Frito</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estado venta</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({...filters, status: e.target.value})}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todos</option>
              <option value="completed">Completada</option>
              <option value="pending">Pendiente</option>
              <option value="cancelled">Cancelada</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabla de ventas */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('sale_number')}>
                  <div className="flex items-center gap-1">
                    # Venta
                    {sortField === 'sale_number' && (
                      sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                    )}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('customer_name')}>
                  <div className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    Cliente
                    {sortField === 'customer_name' && (
                      sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                    )}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('phone')}>
                  Teléfono
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo Cuenta
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('total_amount')}>
                  <div className="flex items-center gap-1">
                    Total
                    {sortField === 'total_amount' && (
                      sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                    )}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('created_at')}>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Fecha
                    {sortField === 'created_at' && (
                      sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                    )}
                  </div>
                </th>
                {/* NUEVA COLUMNA: Recibo */}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Recibo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentItems.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-6 py-8 text-center text-gray-500">
                    No se encontraron ventas
                  </td>
                </tr>
              ) : (
                currentItems.map((sale) => (
                  <tr key={sale.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        #{sale.sale_number}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {sale.customer_name || 'Cliente ocasional'}
                          </div>
                          {sale.address && (
                            <div className="text-xs text-gray-500 truncate max-w-xs">
                              {sale.address}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {sale.phone || 'No especificado'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <AccountTypeBadge type={sale.account_type} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        <PaymentMethodBadge method={sale.payment_method} />
                        <ProductStateBadge state={sale.product_state} />
                        {sale.delivery_fee > 0 && (
                          <div className="text-xs text-gray-500">
                            Domicilio: {formatCurrency(sale.delivery_fee)}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-gray-900">
                        {formatCurrency(sale.total_amount)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatDate(sale.created_at)}
                      </div>
                    </td>
                    {/* NUEVA CELDA: Botón para imprimir recibo */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => printSaleReceipt(sale)}
                        className="text-green-600 hover:text-green-900 flex items-center gap-1 px-3 py-1 border border-green-200 rounded-lg hover:bg-green-50 transition-colors"
                        title="Imprimir recibo de esta venta"
                      >
                        <Printer className="h-4 w-4" />
                        <span className="text-sm font-medium">Imprimir</span>
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => showSaleDetails(sale)}
                        className="text-blue-600 hover:text-blue-900 flex items-center gap-1 px-3 py-1 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
                      >
                        <Eye className="h-4 w-4" />
                        <span className="text-sm font-medium">Detalles</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-700">
                Mostrando {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredSales.length)} de {filteredSales.length} ventas
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => paginate(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border rounded disabled:opacity-50"
                >
                  Anterior
                </button>
                
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => paginate(i + 1)}
                    className={`px-3 py-1 border rounded ${
                      currentPage === i + 1 ? 'bg-blue-600 text-white' : 'hover:bg-gray-50'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                
                <button
                  onClick={() => paginate(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 border rounded disabled:opacity-50"
                >
                  Siguiente
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal de detalles de venta */}
      {selectedSale && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">
                  Detalles de Venta #{selectedSale.sale_number}
                </h3>
                <button
                  onClick={() => {
                    setSelectedSale(null);
                    setSelectedSaleItems([]);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* Información del cliente */}
                <div className="card">
                  <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Información del Cliente
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm text-gray-500">Nombre</label>
                      <p className="font-medium">{selectedSale.customer_name || 'Cliente ocasional'}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-500">Teléfono</label>
                      <p className="font-medium">{selectedSale.phone || 'No especificado'}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-500">Dirección</label>
                      <p className="font-medium">{selectedSale.address || 'No especificada'}</p>
                    </div>
                  </div>
                </div>

                {/* Información de la venta */}
                <div className="card">
                  <h4 className="text-lg font-semibold mb-4">Detalles de la Venta</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tipo de cuenta:</span>
                      <AccountTypeBadge type={selectedSale.account_type} />
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Método de pago:</span>
                      <PaymentMethodBadge method={selectedSale.payment_method} />
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Estado producto:</span>
                      <ProductStateBadge state={selectedSale.product_state} />
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Domicilio:</span>
                      <span className="font-medium">{formatCurrency(selectedSale.delivery_fee)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Fecha:</span>
                      <span className="font-medium">{formatDate(selectedSale.created_at)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Estado:</span>
                      <span className={`font-medium ${
                        selectedSale.status === 'completed' ? 'text-green-600' :
                        selectedSale.status === 'pending' ? 'text-yellow-600' :
                        selectedSale.status === 'cancelled' ? 'text-red-600' :
                        'text-gray-600'
                      }`}>
                        {selectedSale.status === 'completed' ? 'Completada' :
                         selectedSale.status === 'pending' ? 'Pendiente' :
                         selectedSale.status === 'cancelled' ? 'Cancelada' :
                         selectedSale.status || 'No especificado'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Productos de la venta */}
              <div className="card">
                <h4 className="text-lg font-semibold mb-4">Productos Vendidos</h4>
                {selectedSaleItems.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Cantidad</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Precio Unitario</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {selectedSaleItems.map((item, index) => (
                          <tr key={index}>
                            <td className="px-4 py-3">{item.product_name}</td>
                            <td className="px-4 py-3">{item.quantity}</td>
                            <td className="px-4 py-3">{formatCurrency(item.unit_price)}</td>
                            <td className="px-4 py-3 font-medium">{formatCurrency(item.subtotal)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-gray-50">
                        <tr>
                          <td colSpan="3" className="px-4 py-3 text-right font-semibold">Subtotal:</td>
                          <td className="px-4 py-3 font-bold">
                            {formatCurrency(selectedSale.total_amount - (selectedSale.delivery_fee || 0))}
                          </td>
                        </tr>
                        <tr>
                          <td colSpan="3" className="px-4 py-3 text-right font-semibold">Domicilio:</td>
                          <td className="px-4 py-3 font-bold">
                            {formatCurrency(selectedSale.delivery_fee || 0)}
                          </td>
                        </tr>
                        <tr>
                          <td colSpan="3" className="px-4 py-3 text-right font-semibold text-lg">TOTAL:</td>
                          <td className="px-4 py-3 font-bold text-lg text-blue-600">
                            {formatCurrency(selectedSale.total_amount)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500 mb-2">Cargando productos...</p>
                    <p className="text-sm text-gray-400">
                      Buscando productos para venta #{selectedSale.sale_number}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const StatCard = ({ title, value, icon: Icon, subtitle, alert, trend }) => {
  if (!Icon) {
    Icon = DollarSign; // Icono por defecto
  }
  
  return (
    <div className={`card ${alert ? 'border-red-200 bg-red-50' : ''}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className={`text-2xl font-bold ${alert ? 'text-red-600' : 'text-gray-900'}`}>
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`p-3 rounded-xl ${
          alert ? 'bg-red-100' : 
          trend === 'daily' ? 'bg-green-100' : 
          'bg-blue-100'
        }`}>
          <Icon className={`h-6 w-6 ${
            alert ? 'text-red-600' : 
            trend === 'daily' ? 'text-green-600' : 
            'text-blue-600'
          }`} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;