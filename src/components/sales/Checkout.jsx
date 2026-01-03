import React, { useState } from 'react';
import { supabase } from '../../services/supabase';
import { toast } from 'react-hot-toast';
import { 
  CreditCard, 
  Wallet, 
  Banknote, 
  QrCode, 
  Loader,
  Receipt,
  User,
  Mail
} from 'lucide-react';

const Checkout = ({ cart, total, onSaleComplete }) => {
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const paymentMethods = [
    { id: 'cash', label: 'Efectivo', icon: Banknote, color: 'bg-green-500' },
    { id: 'card', label: 'Tarjeta', icon: CreditCard, color: 'bg-blue-500' },
    { id: 'transfer', label: 'Transferencia', icon: Wallet, color: 'bg-purple-500' },
    { id: 'qr', label: 'QR', icon: QrCode, color: 'bg-yellow-500' },
  ];

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
      // 1. Crear la venta
      const { data: sale, error: saleError } = await supabase
        .from('sales')
        .insert({
          customer_name: customerName || 'Cliente ocasional',
          customer_email: customerEmail || null,
          total_amount: total,
          payment_method: paymentMethod,
          status: 'completed',
        })
        .select()
        .single();

      if (saleError) throw saleError;

      // 2. Crear los items de venta
      const saleItems = cart.map(item => ({
        sale_id: sale.id,
        product_id: item.id,
        product_name: item.name,
        quantity: item.quantity,
        unit_price: item.price,
        subtotal: item.price * item.quantity,
      }));

      const { error: itemsError } = await supabase
        .from('sale_items')
        .insert(saleItems);

      if (itemsError) throw itemsError;

      // 3. Actualizar stock de productos
      for (const item of cart) {
        const { error: stockError } = await supabase
          .from('products')
          .update({ stock: item.stock - item.quantity })
          .eq('id', item.id);

        if (stockError) throw stockError;
      }

      // 4. Éxito
      toast.success(`Venta #${sale.sale_number} procesada exitosamente`);
      
      // 5. Imprimir recibo
      printReceipt(sale, cart);
      
      // 6. Resetear y llamar callback
      setCustomerName('');
      setCustomerEmail('');
      onSaleComplete();

    } catch (error) {
      console.error('Error processing sale:', error);
      toast.error('Error al procesar la venta: ' + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const printReceipt = (sale, cartItems) => {
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
              <div>
                <div>${item.name}</div>
                <div>${item.quantity} x $${item.price.toFixed(2)}</div>
              </div>
              <div>$${(item.price * item.quantity).toFixed(2)}</div>
            </div>
          `).join('')}
          
          <div class="separator"></div>
          
          <div class="item total">
            <div>TOTAL</div>
            <div>$${total.toFixed(2)}</div>
          </div>
          
          <div class="item">
            <div>Método de pago:</div>
            <div>${paymentMethod === 'cash' ? 'Efectivo' : 
                 paymentMethod === 'card' ? 'Tarjeta' :
                 paymentMethod === 'transfer' ? 'Transferencia' : 'QR'}</div>
          </div>
          
          ${customerName ? `
            <div class="item">
              <div>Cliente:</div>
              <div>${customerName}</div>
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
              <Mail className="h-4 w-4 mr-2" />
              Email del cliente (opcional)
            </label>
            <input
              type="email"
              placeholder="cliente@email.com"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              className="input-field"
            />
          </div>
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

        {/* Total y botón */}
        <div className="bg-gray-50 rounded-xl p-4">
          <div className="flex justify-between items-center mb-4">
            <span className="text-lg font-bold text-gray-900">Total a pagar:</span>
            <span className="text-2xl font-bold text-blue-600">
              $${total.toFixed(2)}
            </span>
          </div>
          
          <button
            onClick={handleCheckout}
            disabled={cart.length === 0 || isProcessing}
            className={`w-full py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center ${
              cart.length === 0 || isProcessing
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg hover:shadow-xl'
            }`}
          >
            {isProcessing ? (
              <>
                <Loader className="h-5 w-5 animate-spin mr-2" />
                Procesando...
              </>
            ) : (
              <>
                <Receipt className="h-5 w-5 mr-2" />
                Finalizar Venta
              </>
            )}
          </button>
          
          {cart.length === 0 && (
            <p className="text-center text-sm text-gray-500 mt-2">
              Agrega productos al carrito para continuar
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Checkout;