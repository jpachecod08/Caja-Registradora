import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../services/supabase';
import { toast } from 'react-hot-toast';
import { 
  Banknote, 
  Wallet, 
  Loader,
  Receipt,
  User,
  Phone,
  MapPin,
  Truck,
  Package,
  ChefHat,
  Search,
  CheckCircle,
  Clock,
  History
} from 'lucide-react';

const Checkout = ({ cart, total, onSaleComplete }) => {
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [accountType, setAccountType] = useState('contado');
  const [productState, setProductState] = useState('congelado');
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [manualTotal, setManualTotal] = useState(total);
  const [useManualTotal, setUseManualTotal] = useState(false);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  
  // Refs para manejar el dropdown
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  // Cargar clientes de ventas anteriores
  useEffect(() => {
    loadCustomersFromSales();
  }, []);

  // Actualizar manualTotal cuando cambie el total del carrito
  useEffect(() => {
    if (!useManualTotal) {
      setManualTotal(total);
    }
  }, [total, useManualTotal]);

  // Filtrar clientes al escribir
  useEffect(() => {
    if (customerName.trim().length > 1) {
      const searchTerm = customerName.toLowerCase();
      const filtered = customers.filter(customer =>
        customer.name.toLowerCase().includes(searchTerm) ||
        customer.phone?.toLowerCase().includes(searchTerm) ||
        customer.address?.toLowerCase().includes(searchTerm)
      );
      setFilteredCustomers(filtered);
      setShowCustomerDropdown(filtered.length > 0);
    } else {
      setShowCustomerDropdown(false);
    }
  }, [customerName, customers]);

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target) &&
          inputRef.current && !inputRef.current.contains(event.target)) {
        setShowCustomerDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Cargar clientes desde las ventas anteriores
  const loadCustomersFromSales = async () => {
    try {
      setLoadingCustomers(true);
      console.log('🔄 Cargando clientes de ventas anteriores...');
      
      // Obtener clientes únicos de las ventas
      const { data: salesData, error } = await supabase
        .from('sales')
        .select('customer_name, phone, address')
        .not('customer_name', 'eq', 'Cliente ocasional')
        .not('customer_name', 'eq', '')
        .not('customer_name', 'is', null)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) {
        console.error('❌ Error cargando ventas:', error);
        throw error;
      }

      console.log('📊 Ventas cargadas:', salesData?.length || 0);
      
      // Filtrar y organizar clientes únicos
      const uniqueCustomers = [];
      const seenCustomers = new Set();
      
      if (salesData && salesData.length > 0) {
        salesData.forEach(sale => {
          if (sale.customer_name && !seenCustomers.has(sale.customer_name)) {
            seenCustomers.add(sale.customer_name);
            uniqueCustomers.push({
              id: `sale-${Date.now()}-${uniqueCustomers.length}`,
              name: sale.customer_name,
              phone: sale.phone || '',
              address: sale.address || '',
              source: 'sales_history'
            });
          }
        });
      }
      
      console.log(`✅ Clientes únicos encontrados: ${uniqueCustomers.length}`);
      setCustomers(uniqueCustomers);
      
      // También intentar cargar de la tabla customers por si acaso
      loadCustomersTable();
      
    } catch (error) {
      console.error('Error cargando clientes:', error);
      toast.error('Error al cargar clientes anteriores');
    } finally {
      setLoadingCustomers(false);
    }
  };

  // También cargar de la tabla customers si existe
  const loadCustomersTable = async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('id, name, phone, address')
        .order('name')
        .limit(50);
      
      if (!error && data && data.length > 0) {
        console.log(`📋 Clientes de tabla: ${data.length}`);
        // Combinar con los clientes existentes
        setCustomers(prev => {
          const combined = [...prev];
          data.forEach(customer => {
            if (!combined.some(c => c.name === customer.name)) {
              combined.push({
                ...customer,
                source: 'customers_table'
              });
            }
          });
          return combined;
        });
      }
    } catch (error) {
      console.log('Tabla customers no disponible o vacía');
    }
  };

  const selectCustomer = (customer) => {
    console.log('👤 Cliente seleccionado:', customer);
    setCustomerName(customer.name);
    setCustomerPhone(customer.phone || '');
    setCustomerAddress(customer.address || '');
    setShowCustomerDropdown(false);
    
    // Enfocar el siguiente campo (teléfono)
    setTimeout(() => {
      const phoneInput = document.querySelector('input[type="tel"]');
      if (phoneInput) phoneInput.focus();
    }, 10);
    
    // Guardar automáticamente como cliente frecuente
    saveCustomerAsFrequent(customer);
  };

  const saveCustomerAsFrequent = async (customer) => {
    try {
      // Solo guardar si tiene datos completos
      if (customer.name && (customer.phone || customer.address)) {
        const { error } = await supabase
          .from('customers')
          .upsert({
            name: customer.name,
            phone: customer.phone || '',
            address: customer.address || '',
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'name',
            ignoreDuplicates: false
          });
        
        if (error && !error.message.includes('duplicate')) {
          console.warn('⚠️ Error guardando cliente frecuente:', error);
        } else {
          console.log('✅ Cliente guardado como frecuente:', customer.name);
        }
      }
    } catch (error) {
      console.error('Error guardando cliente:', error);
    }
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast.error('El carrito está vacío');
      return;
    }

    // IMPORTANTE: Calcular el total final
    const baseTotal = useManualTotal ? parseFloat(manualTotal) : total;
    const finalTotal = baseTotal + parseFloat(deliveryFee || 0);
    
    if (finalTotal <= 0) {
      toast.error('El total debe ser mayor a cero');
      return;
    }

    setIsProcessing(true);

    try {
      // Determinar estado de pago
      let paymentStatus = 'pending';
      if (accountType === 'contado') {
        paymentStatus = 'paid';
      } else if (accountType === 'credito') {
        paymentStatus = 'pending';
      }

      console.log('💰 Procesando venta:', {
        customerName,
        baseTotal,
        deliveryFee,
        finalTotal,
        accountType,
        paymentStatus,
        useManualTotal
      });

      // 1. Crear la venta en Supabase
      const { data: sale, error: saleError } = await supabase
        .from('sales')
        .insert({
          customer_name: customerName || 'Cliente ocasional',
          phone: customerPhone || null,
          address: customerAddress || null,
          account_type: accountType,
          product_state: productState,
          delivery_fee: parseFloat(deliveryFee || 0),
          total_amount: finalTotal, // Usar el total final (con domicilio)
          payment_method: paymentMethod,
          payment_status: paymentStatus,
          manual_total: useManualTotal,
          status: 'completed',
        })
        .select()
        .single();

      if (saleError) {
        console.error('❌ Error creando venta:', saleError);
        throw saleError;
      }

      console.log('✅ Venta creada:', sale.id);

      // 2. Crear los items de venta en Supabase - FIX: Agregar unit_price
      // Calcular precio unitario estimado dividiendo el total entre la cantidad total
      const totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);
      const estimatedUnitPrice = totalQuantity > 0 ? (finalTotal / totalQuantity) : 0;
      
      const saleItems = cart.map(item => ({
        sale_id: sale.id,
        product_id: item.id,
        product_name: item.name,
        quantity: item.quantity,
        unit_price: estimatedUnitPrice, // IMPORTANTE: No puede ser null
        subtotal: estimatedUnitPrice * item.quantity, // Calcular subtotal
      }));

      console.log('📦 Items a crear:', saleItems);

      const { error: itemsError } = await supabase
        .from('sale_items')
        .insert(saleItems);

      if (itemsError) {
        console.error('❌ Error creando items:', itemsError);
        throw itemsError;
      }

      console.log('✅ Items de venta creados');

      // 3. Actualizar stock de productos
      for (const item of cart) {
        const { error: stockError } = await supabase
          .from('products')
          .update({ stock: item.stock - item.quantity })
          .eq('id', item.id);

        if (stockError) {
          console.error(`❌ Error actualizando stock de ${item.name}:`, stockError);
          throw stockError;
        }
      }

      console.log('✅ Stock actualizado');

      // 4. Guardar cliente como frecuente si tiene datos
      if (customerName && customerName !== 'Cliente ocasional' && (customerPhone || customerAddress)) {
        try {
          const { error: customerError } = await supabase
            .from('customers')
            .upsert({
              name: customerName,
              phone: customerPhone || '',
              address: customerAddress || '',
              updated_at: new Date().toISOString()
            }, {
              onConflict: 'name',
              ignoreDuplicates: false
            });
          
          if (customerError) {
            console.warn('⚠️ Error guardando cliente:', customerError);
          } else {
            console.log('✅ Cliente guardado en tabla customers');
          }
        } catch (customerErr) {
          console.warn('⚠️ No se pudo guardar cliente, continuando...');
        }
      }

      // 5. Éxito
      toast.success(`✅ Venta #${sale.sale_number || sale.id} procesada exitosamente`);
      if (accountType === 'credito') {
        toast.success('💳 Venta registrada como CRÉDITO - Estado: Pendiente');
      } else {
        toast.success('💰 Venta registrada como CONTADO - Estado: Pagado');
      }

      // 6. Resetear y llamar callback
      resetForm();
      onSaleComplete();

    } catch (error) {
      console.error('❌ Error processing sale:', error);
      toast.error(`Error al procesar la venta: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const resetForm = () => {
    setCustomerName('');
    setCustomerPhone('');
    setCustomerAddress('');
    setAccountType('contado');
    setProductState('congelado');
    setDeliveryFee(0);
    setUseManualTotal(false);
    setManualTotal(total);
  };

  // Función para calcular el total a mostrar
  const calculateDisplayTotal = () => {
    const baseTotal = useManualTotal ? parseFloat(manualTotal) : total;
    return baseTotal + parseFloat(deliveryFee || 0);
  };

  return (
    <div className="card">
      <div className="flex items-center space-x-3 mb-6">
        <div className="bg-green-100 p-2 rounded-lg">
          <Receipt className="h-5 w-5 text-green-600" />
        </div>
        <div>
          <h3 className="text-xl font-semibold text-gray-900">Finalizar Venta</h3>
          <p className="text-sm text-gray-500">Completa los datos del cliente</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Información de clientes cargados */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center text-gray-600">
            <History className="h-4 w-4 mr-2" />
            {loadingCustomers ? (
              <span>Cargando clientes...</span>
            ) : (
              <span>{customers.length} clientes en historial</span>
            )}
          </div>
          <button
            onClick={loadCustomersFromSales}
            className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
            title="Recargar lista de clientes"
          >
            <Search className="h-3 w-3 mr-1" />
            Recargar
          </button>
        </div>

        {/* Campo de búsqueda de cliente con autocompletado */}
        <div className="space-y-4">
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
              <User className="h-4 w-4 mr-2" />
              Nombre del cliente
              {customerName && customerName !== 'Cliente ocasional' && customers.some(c => c.name === customerName) && (
                <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                  Cliente frecuente
                </span>
              )}
            </label>
            
            <div className="relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Buscar cliente o ingresar nuevo..."
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  onFocus={() => {
                    if (customerName.trim().length > 1 && filteredCustomers.length > 0) {
                      setShowCustomerDropdown(true);
                    }
                  }}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  disabled={loadingCustomers}
                />
              </div>
              
              {/* Dropdown de clientes */}
              {showCustomerDropdown && filteredCustomers.length > 0 && (
                <div 
                  ref={dropdownRef}
                  className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto"
                >
                  <div className="px-3 py-2 bg-gray-50 border-b text-xs text-gray-500">
                    {filteredCustomers.length} cliente(s) encontrado(s)
                  </div>
                  {filteredCustomers.map((customer, index) => (
                    <div
                      key={`${customer.id}-${index}`}
                      className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0 transition-colors"
                      onClick={() => selectCustomer(customer)}
                      onMouseDown={(e) => e.preventDefault()} // Previene perder el foco
                    >
                      <div className="font-medium text-gray-900">{customer.name}</div>
                      <div className="flex flex-col gap-1 mt-1">
                        {customer.phone && (
                          <div className="text-sm text-gray-600 flex items-center">
                            <Phone className="h-3 w-3 mr-2 flex-shrink-0" />
                            <span>{customer.phone}</span>
                          </div>
                        )}
                        {customer.address && (
                          <div className="text-sm text-gray-500 flex items-center">
                            <MapPin className="h-3 w-3 mr-2 flex-shrink-0" />
                            <span className="truncate">{customer.address}</span>
                          </div>
                        )}
                        {customer.source === 'sales_history' && (
                          <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded inline-block w-fit mt-1">
                            Historial de compras
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <p className="text-xs text-gray-500 mt-1">
              {customers.length > 0 
                ? `Escribe para buscar entre ${customers.length} clientes anteriores`
                : 'Ingresa el nombre del cliente para comenzar'}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
              <Phone className="h-4 w-4 mr-2" />
              Teléfono (opcional)
            </label>
            <input
              type="tel"
              placeholder="300 123 4567"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              disabled={loadingCustomers}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
              <MapPin className="h-4 w-4 mr-2" />
              Dirección (opcional)
            </label>
            <textarea
              placeholder="Dirección del cliente"
              value={customerAddress}
              onChange={(e) => setCustomerAddress(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all min-h-[80px]"
              rows="3"
              disabled={loadingCustomers}
            />
          </div>
        </div>

        {/* Estado del producto */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Estado del producto
          </label>
          <div className="grid grid-cols-2 gap-3">
            {[
              { id: 'congelado', label: 'Congelado', icon: Package, color: 'text-blue-600' },
              { id: 'frito', label: 'Frito', icon: ChefHat, color: 'text-red-600' }
            ].map((state) => {
              const Icon = state.icon;
              return (
                <button
                  key={state.id}
                  type="button"
                  onClick={() => setProductState(state.id)}
                  className={`flex flex-col items-center justify-center p-4 border rounded-xl transition-all ${
                    productState === state.id
                      ? state.id === 'frito'
                        ? 'border-red-500 bg-red-50 text-red-700'
                        : 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <Icon className={`h-5 w-5 mb-2 ${state.color}`} />
                  <span className="text-sm font-medium">{state.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Valor del domicilio */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
            <Truck className="h-4 w-4 mr-2" />
            Valor del domicilio
          </label>
          <div className="flex items-center">
            <span className="text-gray-500 mr-2">$</span>
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={deliveryFee}
              onChange={(e) => setDeliveryFee(e.target.value)}
              className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Ingresa el valor del domicilio. Deja en 0 si no hay domicilio.
          </p>
        </div>

        {/* Total manual */}
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-gray-700">
              Total de la venta
            </label>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="useManualTotal"
                checked={useManualTotal}
                onChange={(e) => setUseManualTotal(e.target.checked)}
                className="mr-2 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                disabled={loadingCustomers}
              />
              <label htmlFor="useManualTotal" className="text-sm text-gray-600">
                Ingresar manualmente
              </label>
            </div>
          </div>
          
          {useManualTotal ? (
            <div className="space-y-2">
              <div className="flex items-center">
                <span className="text-gray-500 mr-2 text-xl">$</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={manualTotal}
                  onChange={(e) => setManualTotal(e.target.value)}
                  className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-2xl font-bold text-right"
                  placeholder="0.00"
                  disabled={loadingCustomers}
                />
              </div>
              <p className="text-xs text-gray-500">
                Total calculado automáticamente: <span className="font-medium">${total.toFixed(2)}</span>
              </p>
            </div>
          ) : (
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">
                ${total.toFixed(2)}
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Total calculado automáticamente
              </p>
            </div>
          )}
        </div>

        {/* Tipo de cuenta */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Tipo de cuenta
          </label>
          <div className="grid grid-cols-2 gap-3">
            {[
              { id: 'contado', label: 'Contado', icon: CheckCircle, color: 'text-green-600' },
              { id: 'credito', label: 'Crédito', icon: Clock, color: 'text-yellow-600' }
            ].map((type) => {
              const Icon = type.icon;
              return (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => setAccountType(type.id)}
                  className={`flex items-center justify-center p-4 border rounded-xl transition-all ${
                    accountType === type.id
                      ? type.id === 'credito'
                        ? 'border-yellow-500 bg-yellow-50 text-yellow-700'
                        : 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  disabled={loadingCustomers}
                >
                  <Icon className={`h-5 w-5 mr-2 ${type.color}`} />
                  <span className="text-sm font-medium">{type.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Método de pago */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Método de pago
          </label>
          <div className="grid grid-cols-2 gap-3">
            {[
              { id: 'cash', label: 'Efectivo', icon: Banknote, color: 'bg-green-500' },
              { id: 'transfer', label: 'Transferencia', icon: Wallet, color: 'bg-purple-500' }
            ].map((method) => {
              const Icon = method.icon;
              return (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => setPaymentMethod(method.id)}
                  className={`flex flex-col items-center justify-center p-4 border rounded-xl transition-all ${
                    paymentMethod === method.id
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  disabled={loadingCustomers}
                >
                  <div className={`${method.color} p-2 rounded-lg mb-2`}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-sm font-medium">{method.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Resumen y botón */}
        <div className="bg-gray-50 rounded-xl p-4 space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal:</span>
              <span className="font-medium">
                ${useManualTotal ? parseFloat(manualTotal).toFixed(2) : total.toFixed(2)}
              </span>
            </div>
            
            {deliveryFee > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Domicilio:</span>
                <span className="font-medium">${parseFloat(deliveryFee).toFixed(2)}</span>
              </div>
            )}
            
            <div className="flex justify-between pt-2 border-t border-gray-200">
              <span className="text-lg font-bold text-gray-900">Total a pagar:</span>
              <span className="text-2xl font-bold text-blue-600">
                ${calculateDisplayTotal().toFixed(2)}
              </span>
            </div>
          </div>
          
          <button
            onClick={handleCheckout}
            disabled={cart.length === 0 || isProcessing || loadingCustomers}
            className={`w-full py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center ${
              cart.length === 0 || isProcessing || loadingCustomers
                ? 'bg-gray-300 cursor-not-allowed'
                : accountType === 'credito'
                ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white'
                : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white'
            } shadow-lg hover:shadow-xl`}
          >
            {isProcessing ? (
              <>
                <Loader className="h-5 w-5 animate-spin mr-2" />
                Procesando...
              </>
            ) : loadingCustomers ? (
              <>
                <Loader className="h-5 w-5 animate-spin mr-2" />
                Cargando clientes...
              </>
            ) : (
              <>
                <Receipt className="h-5 w-5 mr-2" />
                {accountType === 'credito' ? 'Registrar Crédito' : 'Finalizar Venta'}
              </>
            )}
          </button>
          
          {cart.length === 0 && (
            <p className="text-center text-sm text-gray-500 mt-2">
              Agrega productos al carrito para continuar
            </p>
          )}
          
          {loadingCustomers && (
            <p className="text-center text-sm text-blue-500 mt-2">
              Cargando lista de clientes anteriores...
            </p>
          )}
          
          {accountType === 'credito' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-2">
              <p className="text-yellow-800 text-sm text-center">
                ⚠️ Esta venta se registrará como <strong>CRÉDITO</strong> - Estado: Pendiente
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Checkout;