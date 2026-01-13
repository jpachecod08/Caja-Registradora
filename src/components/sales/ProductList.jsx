import React from 'react';
import { Plus, Package, TrendingDown, CheckCircle } from 'lucide-react';

const ProductList = ({ products, loading, onAddToCart }) => {
  if (loading) {
    return (
      <div className="card">
        <div className="animate-pulse space-y-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  // Función para obtener el color del stock
  const getStockColor = (stock, minStock) => {
    if (stock === 0) return 'bg-red-100 text-red-800';
    if (stock <= minStock) return 'bg-yellow-100 text-yellow-800';
    if (stock <= minStock * 2) return 'bg-orange-100 text-orange-800';
    return 'bg-green-100 text-green-800';
  };

  // Función para obtener el texto de estado del stock
  const getStockStatus = (stock, minStock) => {
    if (stock === 0) return 'AGOTADO';
    if (stock <= minStock) return 'BAJO STOCK';
    if (stock <= minStock * 2) return 'MEDIO STOCK';
    return 'DISPONIBLE';
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">Inventario de Productos</h3>
          <p className="text-sm text-gray-500">Control de entradas y salidas</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <span className="text-sm text-gray-500">
              Total productos: 
            </span>
            <span className="text-lg font-bold text-gray-900 ml-2">
              {products.length}
            </span>
          </div>
          <div className="h-8 w-px bg-gray-300"></div>
          <div className="text-right">
            <span className="text-sm text-gray-500">
              Disponibles: 
            </span>
            <span className="text-lg font-bold text-green-600 ml-2">
              {products.filter(p => p.stock > 0).length}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.map((product) => {
          const stockColor = getStockColor(product.stock, product.min_stock || 5);
          const stockStatus = getStockStatus(product.stock, product.min_stock || 5);
          const isLowStock = product.stock <= (product.min_stock || 5) && product.stock > 0;
          const isOutOfStock = product.stock === 0;
          
          return (
            <div
              key={product.id}
              className={`border rounded-xl p-4 transition-all ${
                isOutOfStock 
                  ? 'border-red-200 bg-red-50' 
                  : isLowStock 
                  ? 'border-yellow-200 bg-yellow-50' 
                  : 'border-gray-200 hover:border-blue-300 hover:shadow-md'
              }`}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">
                    {product.name}
                  </h4>
                  {product.category && (
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded mt-1 inline-block">
                      {product.category}
                    </span>
                  )}
                </div>
                
                <div className={`text-xs font-bold px-2 py-1 rounded ${stockColor}`}>
                  {stockStatus}
                </div>
              </div>

              <div className="space-y-3">
                {/* Información de stock */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Package className={`h-4 w-4 ${
                      isOutOfStock ? 'text-red-500' : 
                      isLowStock ? 'text-yellow-500' : 
                      'text-green-500'
                    }`} />
                    <div>
                      <div className="font-bold text-lg">
                        {product.stock} unidades
                      </div>
                      {product.min_stock && (
                        <div className="text-xs text-gray-500">
                          Mínimo: {product.min_stock} unidades
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Indicador de nivel de stock */}
                  {!isOutOfStock && (
                    <div className="w-24">
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${
                            isLowStock 
                              ? 'bg-yellow-500' 
                              : product.stock <= (product.min_stock || 5) * 2
                              ? 'bg-orange-500'
                              : 'bg-green-500'
                          }`}
                          style={{ 
                            width: `${Math.min((product.stock / ((product.min_stock || 5) * 4)) * 100, 100)}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Botones de acción */}
                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <div className="flex items-center space-x-2">
                    {isLowStock && (
                      <div className="flex items-center text-xs text-yellow-600">
                        <TrendingDown className="h-3 w-3 mr-1" />
                        Reabastecer
                      </div>
                    )}
                    {isOutOfStock && (
                      <div className="flex items-center text-xs text-red-600">
                        <span className="h-2 w-2 bg-red-500 rounded-full mr-1"></span>
                        Sin stock
                      </div>
                    )}
                    {!isLowStock && !isOutOfStock && (
                      <div className="flex items-center text-xs text-green-600">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Disponible
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => onAddToCart(product)}
                    disabled={isOutOfStock}
                    className={`p-2 rounded-lg transition-all ${
                      isOutOfStock
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-blue-100 text-blue-600 hover:bg-blue-200 hover:scale-105'
                    }`}
                    title={isOutOfStock ? 'Producto agotado' : 'Registrar salida'}
                  >
                    <Plus className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {products.length === 0 && !loading && (
        <div className="text-center py-12">
          <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-900">No hay productos en inventario</h4>
          <p className="text-gray-500 mt-2">
            Agrega productos para comenzar a controlar el inventario
          </p>
        </div>
      )}

      {/* Resumen de stock */}
      {products.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Resumen de inventario</h4>
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {products.filter(p => p.stock > (p.min_stock || 5) * 2).length}
              </div>
              <div className="text-xs text-gray-500">Disponible</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {products.filter(p => p.stock <= (p.min_stock || 5) * 2 && p.stock > (p.min_stock || 5)).length}
              </div>
              <div className="text-xs text-gray-500">Medio</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {products.filter(p => p.stock <= (p.min_stock || 5) && p.stock > 0).length}
              </div>
              <div className="text-xs text-gray-500">Bajo</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {products.filter(p => p.stock === 0).length}
              </div>
              <div className="text-xs text-gray-500">Agotado</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductList;