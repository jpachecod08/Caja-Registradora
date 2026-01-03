import React from 'react';
import { Plus, Package, Star } from 'lucide-react';

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

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-gray-900">Productos Disponibles</h3>
        <span className="text-sm text-gray-500">
          {products.length} productos
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {products.map((product) => (
          <div
            key={product.id}
            className="group border border-gray-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-md transition-all"
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold text-gray-900 group-hover:text-blue-600">
                      {product.name}
                    </h4>
                    {product.description && (
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                        {product.description}
                      </p>
                    )}
                  </div>
                  
                  {product.stock <= product.min_stock && product.stock > 0 && (
                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                      Bajo stock
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between mt-4">
                  <div>
                    <div className="text-2xl font-bold text-blue-600">
                      ${product.price.toFixed(2)}
                    </div>
                    <div className="flex items-center space-x-4 mt-1">
                      <span className={`text-sm px-2 py-1 rounded ${
                        product.stock > 0 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        Stock: {product.stock}
                      </span>
                      
                      {product.category && (
                        <span className="text-sm text-gray-500">
                          {product.category}
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => onAddToCart(product)}
                    disabled={product.stock === 0}
                    className={`p-3 rounded-full transition-all ${
                      product.stock === 0
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-blue-100 text-blue-600 hover:bg-blue-200 hover:scale-105'
                    }`}
                    title={product.stock === 0 ? 'Sin stock' : 'Agregar al carrito'}
                  >
                    <Plus className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {products.length === 0 && !loading && (
        <div className="text-center py-12">
          <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-900">No hay productos disponibles</h4>
          <p className="text-gray-500 mt-2">
              Agrega productos para comenzar a vender
         </p>

        </div>
      )}
    </div>
  );
};

export default ProductList;