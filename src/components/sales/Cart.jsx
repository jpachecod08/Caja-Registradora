import React from 'react';
import { Trash2, Minus, Plus, ShoppingCart, X } from 'lucide-react';

const Cart = ({ cart, onUpdateQuantity, onRemoveItem, onClearCart }) => {
  const calculateSubtotal = (item) => item.price * item.quantity;

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = cart.reduce((sum, item) => sum + calculateSubtotal(item), 0);

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="bg-blue-100 p-2 rounded-lg">
            <ShoppingCart className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Carrito</h3>
            <p className="text-sm text-gray-500">
              {totalItems} {totalItems === 1 ? 'producto' : 'productos'}
            </p>
          </div>
        </div>
        
        {cart.length > 0 && (
          <button
            onClick={onClearCart}
            className="text-sm text-red-600 hover:text-red-800 flex items-center"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Vaciar todo
          </button>
        )}
      </div>

      {cart.length === 0 ? (
        <div className="text-center py-8">
          <ShoppingCart className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">El carrito está vacío</p>
          <p className="text-sm text-gray-400 mt-1">Agrega productos para comenzar</p>
        </div>
      ) : (
        <>
          <div className="space-y-4 max-h-80 overflow-y-auto pr-2">
            {cart.map((item) => (
              <div 
                key={item.id} 
                className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:bg-gray-50"
              >
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{item.name}</div>
                  <div className="text-sm text-gray-500">
                    ${item.price.toFixed(2)} c/u
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="flex items-center border border-gray-200 rounded-lg">
                    <button
                      onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                      className="p-2 hover:bg-gray-100"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    
                    <span className="px-3 font-medium min-w-[2.5rem] text-center">
                      {item.quantity}
                    </span>
                    
                    <button
                      onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                      className="p-2 hover:bg-gray-100"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                  
                  <div className="w-20 text-right font-medium">
                    ${calculateSubtotal(item).toFixed(2)}
                  </div>
                  
                  <button
                    onClick={() => onRemoveItem(item.id)}
                    className="p-1 text-gray-400 hover:text-red-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal:</span>
              <span className="font-medium">${totalAmount.toFixed(2)}</span>
            </div>
            
            <div className="flex justify-between text-lg font-bold">
              <span className="text-gray-900">Total:</span>
              <span className="text-blue-600">${totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Cart;