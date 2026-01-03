import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { toast } from 'react-hot-toast';
import {
  Calendar,
  Search,
  Filter,
  Eye,
  Receipt,
  Printer,
  Download,
  ChevronLeft,
  ChevronRight,
  User,
  CreditCard,
  Wallet,
  Banknote,
  QrCode
} from 'lucide-react';

const SalesHistory = () => {
  const [sales, setSales] = useState([]);
  const [filteredSales, setFilteredSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedSale, setSelectedSale] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    fetchSales();
    // Establecer fechas por defecto (últimos 30 días)
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    
    setEndDate(end.toISOString().split('T')[0]);
    setStartDate(start.toISOString().split('T')[0]);
  }, []);

  useEffect(() => {
    filterSales();
  }, [sales, searchTerm, startDate, endDate]);

  const fetchSales = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('sales')
        .select(`
          *,
          sale_items (*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setSales(data || []);
    } catch (error) {
      console.error('Error fetching sales:', error);
      toast.error('Error al cargar historial de ventas');
    } finally {
      setLoading(false);
    }
  };

  const filterSales = () => {
    let filtered = [...sales];

    // Filtrar por búsqueda
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(sale =>
        sale.sale_number.toString().includes(search) ||
        sale.customer_name?.toLowerCase().includes(search) ||
        sale.customer_email?.toLowerCase().includes(search)
      );
    }

    // Filtrar por fecha
    if (startDate) {
      filtered = filtered.filter(sale => 
        new Date(sale.created_at) >= new Date(startDate)
      );
    }

    if (endDate) {
      filtered = filtered.filter(sale => 
        new Date(sale.created_at) <= new Date(endDate + 'T23:59:59')
      );
    }

    setFilteredSales(filtered);
    setCurrentPage(1); // Resetear a primera página al filtrar
  };

  const getPaymentMethodIcon = (method) => {
    switch (method) {
      case 'cash':
        return { icon: Banknote, color: 'text-green-600', bg: 'bg-green-100', label: 'Efectivo' };
      case 'card':
        return { icon: CreditCard, color: 'text-blue-600', bg: 'bg-blue-100', label: 'Tarjeta' };
      case 'transfer':
        return { icon: Wallet, color: 'text-purple-600', bg: 'bg-purple-100', label: 'Transferencia' };
      case 'qr':
        return { icon: QrCode, color: 'text-yellow-600', bg: 'bg-yellow-100', label: 'QR' };
      default:
        return { icon: CreditCard, color: 'text-gray-600', bg: 'bg-gray-100', label: method };
    }
  };

  const viewSaleDetails = (sale) => {
    setSelectedSale(sale);
    setShowDetails(true);
  };

  const printReceipt = (sale) => {
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
            .details {
              font-size: 11px;
              margin: 5px 0;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h2 style="margin: 0">CAJA REGISTRADORA</h2>
            <p style="margin: 5px 0">Recibo #${sale.sale_number}</p>
            <p style="margin: 5px 0">${new Date(sale.created_at).toLocaleString()}</p>
          </div>
          
          <div class="separator"></div>
          
          ${sale.sale_items?.map(item => `
            <div class="item">
              <div>
                <div>${item.product_name}</div>
                <div class="details">${item.quantity} x $${item.unit_price.toFixed(2)}</div>
              </div>
              <div>$${item.subtotal.toFixed(2)}</div>
            </div>
          `).join('')}
          
          <div class="separator"></div>
          
          <div class="item total">
            <div>TOTAL</div>
            <div>$${sale.total_amount.toFixed(2)}</div>
          </div>
          
          <div class="details">
            <div>Método de pago: ${getPaymentMethodIcon(sale.payment_method).label}</div>
            ${sale.customer_name ? `<div>Cliente: ${sale.customer_name}</div>` : ''}
            ${sale.customer_email ? `<div>Email: ${sale.customer_email}</div>` : ''}
          </div>
          
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
    receiptWindow.print();
  };

  const exportToCSV = () => {
    const csvContent = [
      ['Número', 'Fecha', 'Hora', 'Cliente', 'Email', 'Método Pago', 'Total', 'Items'],
      ...filteredSales.map(sale => [
        sale.sale_number,
        new Date(sale.created_at).toLocaleDateString(),
        new Date(sale.created_at).toLocaleTimeString(),
        sale.customer_name || 'Cliente ocasional',
        sale.customer_email || '',
        getPaymentMethodIcon(sale.payment_method).label,
        `$${sale.total_amount.toFixed(2)}`,
        sale.sale_items?.length || 0
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `ventas_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Paginación
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentSales = filteredSales.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredSales.length / itemsPerPage);

  if (loading) {
    return (
      <div className="card">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Historial de Ventas</h2>
          <p className="text-gray-600 mt-1">Consulta y gestiona todas las ventas realizadas</p>
        </div>
        
        <div className="flex items-center space-x-3 mt-4 lg:mt-0">
          <button
            onClick={exportToCSV}
            className="btn-secondary flex items-center"
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </button>
          
          <button
            onClick={fetchSales}
            className="btn-primary flex items-center"
          >
            <Calendar className="h-4 w-4 mr-2" />
            Actualizar
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Buscar ventas
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Buscar por número, cliente o email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Desde
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hasta
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            Mostrando {currentSales.length} de {filteredSales.length} ventas
          </div>
          
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <select className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              <option>Todas</option>
              <option>Completadas</option>
              <option>Canceladas</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabla de ventas */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left py-3 px-4 font-medium text-gray-700"># Venta</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Fecha</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Cliente</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Total</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Método</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Items</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {currentSales.map((sale) => {
                const paymentMethod = getPaymentMethodIcon(sale.payment_method);
                const PaymentIcon = paymentMethod.icon;
                
                return (
                  <tr key={sale.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-4 px-4">
                      <div className="font-mono font-bold text-blue-600">
                        #{sale.sale_number}
                      </div>
                    </td>
                    
                    <td className="py-4 px-4">
                      <div className="text-sm">
                        {new Date(sale.created_at).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(sale.created_at).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>
                    </td>
                    
                    <td className="py-4 px-4">
                      <div className="flex items-center">
                        <div className="h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center mr-2">
                          <User className="h-4 w-4 text-gray-600" />
                        </div>
                        <div>
                          <div className="font-medium">
                            {sale.customer_name || 'Cliente ocasional'}
                          </div>
                          {sale.customer_email && (
                            <div className="text-xs text-gray-500">{sale.customer_email}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    
                    <td className="py-4 px-4">
                      <div className="font-bold text-gray-900">
                        $${sale.total_amount.toFixed(2)}
                      </div>
                    </td>
                    
                    <td className="py-4 px-4">
                      <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${paymentMethod.bg} ${paymentMethod.color}`}>
                        <PaymentIcon className="h-3 w-3 mr-1" />
                        {paymentMethod.label}
                      </div>
                    </td>
                    
                    <td className="py-4 px-4">
                      <div className="text-center">
                        <span className="font-medium">{sale.sale_items?.length || 0}</span>
                      </div>
                    </td>
                    
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => viewSaleDetails(sale)}
                          className="p-1 text-blue-600 hover:text-blue-800"
                          title="Ver detalles"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        
                        <button
                          onClick={() => printReceipt(sale)}
                          className="p-1 text-green-600 hover:text-green-800"
                          title="Reimprimir recibo"
                        >
                          <Printer className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          
          {filteredSales.length === 0 && (
            <div className="text-center py-12">
              <Receipt className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900">No hay ventas</h4>
              <p className="text-gray-500 mt-2">
                {searchTerm || startDate || endDate 
                  ? 'No se encontraron ventas con esos filtros' 
                  : 'Aún no hay ventas registradas'
                }
              </p>
            </div>
          )}
        </div>

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
            <div className="text-sm text-gray-700">
              Página {currentPage} de {totalPages}
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className={`p-2 rounded-lg ${currentPage === 1 ? 'text-gray-400' : 'text-gray-700 hover:bg-gray-100'}`}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-8 h-8 rounded-lg ${
                      currentPage === pageNum
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className={`p-2 rounded-lg ${currentPage === totalPages ? 'text-gray-400' : 'text-gray-700 hover:bg-gray-100'}`}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal de detalles de venta */}
      {showDetails && selectedSale && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <Receipt className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      Detalles de Venta #{selectedSale.sale_number}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {new Date(selectedSale.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
                
                <button
                  onClick={() => setShowDetails(false)}
                  className="p-2 text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h4 className="font-medium text-gray-700 mb-3">Información del Cliente</h4>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <User className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-gray-900">
                        {selectedSale.customer_name || 'Cliente ocasional'}
                      </span>
                    </div>
                    {selectedSale.customer_email && (
                      <div className="flex items-center">
                        <Mail className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-gray-900">{selectedSale.customer_email}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-700 mb-3">Información de Pago</h4>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <div className={`h-6 w-6 rounded-full flex items-center justify-center mr-2 ${getPaymentMethodIcon(selectedSale.payment_method).bg}`}>
                        {React.createElement(getPaymentMethodIcon(selectedSale.payment_method).icon, { 
                          className: `h-3 w-3 ${getPaymentMethodIcon(selectedSale.payment_method).color}` 
                        })}
                      </div>
                      <span className="text-gray-900">
                        {getPaymentMethodIcon(selectedSale.payment_method).label}
                      </span>
                    </div>
                    <div className="text-lg font-bold text-blue-600">
                      Total: $${selectedSale.total_amount.toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="border-t border-gray-200 pt-6">
                <h4 className="font-medium text-gray-700 mb-4">Productos Vendidos</h4>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 px-3 text-sm font-medium text-gray-700">Producto</th>
                        <th className="text-left py-2 px-3 text-sm font-medium text-gray-700">Cantidad</th>
                        <th className="text-left py-2 px-3 text-sm font-medium text-gray-700">Precio Unitario</th>
                        <th className="text-left py-2 px-3 text-sm font-medium text-gray-700">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedSale.sale_items?.map((item, index) => (
                        <tr key={index} className="border-b border-gray-100">
                          <td className="py-3 px-3">
                            <div className="font-medium text-gray-900">{item.product_name}</div>
                          </td>
                          <td className="py-3 px-3">
                            <div className="font-medium">{item.quantity}</div>
                          </td>
                          <td className="py-3 px-3">
                            <div className="text-gray-900">$${item.unit_price.toFixed(2)}</div>
                          </td>
                          <td className="py-3 px-3">
                            <div className="font-bold text-gray-900">$${item.subtotal.toFixed(2)}</div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-gray-50">
                        <td colSpan="3" className="py-3 px-3 text-right font-medium">
                          Total:
                        </td>
                        <td className="py-3 px-3 font-bold text-lg text-blue-600">
                          $${selectedSale.total_amount.toFixed(2)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-gray-200">
                <button
                  onClick={() => setShowDetails(false)}
                  className="btn-secondary"
                >
                  Cerrar
                </button>
                
                <button
                  onClick={() => printReceipt(selectedSale)}
                  className="btn-primary flex items-center"
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Imprimir Recibo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesHistory;