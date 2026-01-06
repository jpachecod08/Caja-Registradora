import React, { useState } from 'react';
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
  ChefHat
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

  // Métodos de pago modificados (solo efectivo y transferencia)
  const paymentMethods = [
    { id: 'cash', label: 'Efectivo', icon: Banknote, color: 'bg-green-500' },
    { id: 'transfer', label: 'Transferencia', icon: Wallet, color: 'bg-purple-500' },
  ];

  // Tipos de cuenta
  const accountTypes = [
    { id: 'contado', label: 'Contado' },
    { id: 'credito', label: 'Crédito' }
  ];

  // Estados del producto
  const productStates = [
    { id: 'congelado', label: 'Congelado', icon: Package },
    { id: 'frito', label: 'Frito', icon: ChefHat }
  ];

  const agregarVenta = async (venta) => {
    try {
      const netlifyFunctionUrl = '/.netlify/functions/google-sheets';
      
      console.log("📤 Enviando a Google Sheets:", venta);
      
      const response = await fetch(netlifyFunctionUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(venta)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log("✅ Respuesta de Netlify Function:", result);
      return result;
      
    } catch (error) {
      console.error("❌ Error en Netlify Function:", error);
      return { 
        success: false, 
        error: error.message,
        warning: "Venta guardada en Supabase pero falló Google Sheets"
      };
    }
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast.error('El carrito está vacío');
      return;
    }

    if (total <= 0) {
      toast.error('El total debe ser mayor a cero');
      return;
    }

    setIsProcessing(true);

    try {
      // Calcular total con domicilio
      const totalWithDelivery = total + parseFloat(deliveryFee || 0);

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
          total_amount: totalWithDelivery,
          payment_method: paymentMethod,
          status: accountType === 'credito' ? 'pending' : 'completed',
        })
        .select()
        .single();

      if (saleError) throw saleError;

      // 2. Crear los items de venta en Supabase - CORREGIDO: quitar product_state
      const saleItems = cart.map(item => ({
        sale_id: sale.id,
        product_id: item.id,
        product_name: item.name,
        quantity: item.quantity,
        unit_price: item.price,
        subtotal: item.price * item.quantity,
        // NOTA: product_state está en la tabla sales, no en sale_items
      }));

      const { error: itemsError } = await supabase
        .from('sale_items')
        .insert(saleItems);

      if (itemsError) throw itemsError;

      // 3. Actualizar stock de productos solo si es contado
      if (accountType === 'contado') {
        for (const item of cart) {
          const { error: stockError } = await supabase
            .from('products')
            .update({ stock: item.stock - item.quantity })
            .eq('id', item.id);

          if (stockError) throw stockError;
        }
      }

      // 4. Enviar venta a Google Sheets
      const sheetsData = {
        saleId: sale.id,
        saleNumber: sale.sale_number || `V-${sale.id}`,
        customerName: customerName || 'Cliente ocasional',
        customerPhone: customerPhone || '',
        customerAddress: customerAddress || '',
        accountType: accountType,
        productState: productState,
        deliveryFee: parseFloat(deliveryFee || 0),
        subtotal: total,
        total: totalWithDelivery,
        paymentMethod: paymentMethod,
        items: cart.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          state: productState, // Esto sigue siendo para Google Sheets
          subtotal: item.price * item.quantity
        }))
      };

      setTimeout(() => {
        agregarVenta(sheetsData)
          .then(result => {
            if (result && result.success) {
              console.log("✅ Google Sheets: Venta registrada");
            }
          })
          .catch(err => {
            console.warn("⚠️ Error Google Sheets:", err);
          });
      }, 100);

      // 5. Éxito
      toast.success(`Venta #${sale.sale_number} procesada exitosamente`);
      if (accountType === 'credito') {
        toast.success('Venta registrada como CRÉDITO');
      }

      // 6. Imprimir recibo
      printReceipt(sale, cart, totalWithDelivery);

      // 7. Resetear y llamar callback
      resetForm();
      onSaleComplete();

    } catch (error) {
      console.error('Error processing sale:', error);
      toast.error('Error al procesar la venta: ' + error.message);
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
  };

  const printReceipt = (sale, cartItems, totalWithDelivery) => {
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
            <p style="margin: 5px 0">${new Date().toLocaleString()}</p>
          </div>
          
          <div class="separator"></div>
          
          ${cartItems.map(item => `
            <div class="item">
              <div class="item-detail">
                <div>${item.name}</div>
                <div>${item.quantity} x $${item.price.toFixed(2)}</div>
                <div>
                  <span class="badge badge-${productState}">${productState === 'frito' ? 'FRITO' : 'CONGELADO'}</span>
                </div>
              </div>
              <div>$${(item.price * item.quantity).toFixed(2)}</div>
            </div>
          `).join('')}
          
          <div class="separator"></div>
          
          <div class="item subtotal">
            <div>Subtotal</div>
            <div>$${total.toFixed(2)}</div>
          </div>
          
          ${deliveryFee > 0 ? `
            <div class="item">
              <div>Domicilio</div>
              <div>$${parseFloat(deliveryFee).toFixed(2)}</div>
            </div>
          ` : ''}
          
          <div class="item total">
            <div>TOTAL</div>
            <div>$${totalWithDelivery.toFixed(2)}</div>
          </div>
          
          <div class="separator"></div>
          
          <div class="item">
            <div>Método de pago:</div>
            <div>${paymentMethod === 'cash' ? 'Efectivo' : 'Transferencia'}</div>
          </div>
          
          <div class="item">
            <div>Tipo de cuenta:</div>
            <div>
              ${accountType === 'credito' ? 'Crédito' : 'Contado'}
              ${accountType === 'credito' ? '<span class="badge badge-credito">CRÉDITO</span>' : ''}
            </div>
          </div>
          
          ${customerName ? `
            <div class="item">
              <div>Cliente:</div>
              <div>${customerName}</div>
            </div>
          ` : ''}
          
          ${customerPhone ? `
            <div class="item">
              <div>Teléfono:</div>
              <div>${customerPhone}</div>
            </div>
          ` : ''}
          
          ${customerAddress ? `
            <div class="item">
              <div>Dirección:</div>
              <div>${customerAddress}</div>
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
    receiptWindow.print();
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
        {/* Información del cliente */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
              <User className="h-4 w-4 mr-2" />
              Nombre del cliente (opcional)
            </label>
            <input
              type="text"
              placeholder="Nombre del cliente"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="input-field"
            />
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
              className="input-field"
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
              className="input-field min-h-[80px]"
              rows="3"
            />
          </div>
        </div>

        {/* Tipo de cuenta */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Tipo de cuenta
          </label>
          <div className="grid grid-cols-2 gap-3">
            {accountTypes.map((type) => (
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
              >
                <span className="text-sm font-medium">{type.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Estado del producto */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Estado del producto
          </label>
          <div className="grid grid-cols-2 gap-3">
            {productStates.map((state) => {
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
                  <Icon className="h-5 w-5 mb-2" />
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
              className="input-field flex-1"
            />
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Ingresa el valor del domicilio. Deja en 0 si no hay domicilio.
          </p>
        </div>

        {/* Método de pago */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Método de pago
          </label>
          <div className="grid grid-cols-2 gap-3">
            {paymentMethods.map((method) => {
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
              <span className="font-medium">$${total.toFixed(2)}</span>
            </div>
            
            {deliveryFee > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Domicilio:</span>
                <span className="font-medium">$${parseFloat(deliveryFee).toFixed(2)}</span>
              </div>
            )}
            
            <div className="flex justify-between pt-2 border-t border-gray-200">
              <span className="text-lg font-bold text-gray-900">Total a pagar:</span>
              <span className="text-2xl font-bold text-blue-600">
                $${(total + parseFloat(deliveryFee || 0)).toFixed(2)}
              </span>
            </div>
          </div>
          
          <button
            onClick={handleCheckout}
            disabled={cart.length === 0 || isProcessing}
            className={`w-full py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center ${
              cart.length === 0 || isProcessing
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
          
          {accountType === 'credito' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-2">
              <p className="text-yellow-800 text-sm text-center">
                ⚠️ Esta venta se registrará como <strong>CRÉDITO</strong>. El stock no se descontará automáticamente.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Checkout;