import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { toast } from 'react-hot-toast';
import { 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff, 
  Package, 
  AlertTriangle,
  MoreVertical,
  Download
} from 'lucide-react';

const ProductManager = ({ viewMode = 'grid' }) => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [categories, setCategories] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showActionsMenu, setShowActionsMenu] = useState(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [products, searchTerm, selectedCategory]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      setProducts(data || []);
      extractCategories(data || []);
    } catch (error) {
      console.error('Error loading products:', error);
      toast.error('Error al cargar productos');
    } finally {
      setLoading(false);
    }
  };

  const extractCategories = (products) => {
    const uniqueCategories = [...new Set(products.map(p => p.category).filter(Boolean))];
    setCategories(uniqueCategories);
  };

  const filterProducts = () => {
    let filtered = [...products];
    
    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.barcode?.includes(searchTerm)
      );
    }
    
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(product => product.category === selectedCategory);
    }
    
    setFilteredProducts(filtered);
  };

  const toggleProductStatus = async (productId, currentStatus) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_active: !currentStatus })
        .eq('id', productId);
      
      if (error) throw error;
      
      toast.success(`Producto ${!currentStatus ? 'activado' : 'desactivado'}`);
      fetchProducts();
    } catch (error) {
      console.error('Error changing status:', error);
      toast.error('Error al cambiar estado');
    }
  };

  const deleteProduct = async (productId) => {
    if (!window.confirm('¿Estás seguro de eliminar este producto?')) return;
    
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);
      
      if (error) throw error;
      
      toast.success('Producto eliminado');
      fetchProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Error al eliminar producto');
    }
  };

  const updateStock = async (productId, newStock) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ stock: newStock })
        .eq('id', productId);
      
      if (error) throw error;
      
      toast.success('Stock actualizado');
      fetchProducts();
    } catch (error) {
      console.error('Error updating stock:', error);
      toast.error('Error al actualizar stock');
    }
  };

  const exportProducts = () => {
    // Implementar exportación a Excel
    toast.success('Exportación en desarrollo');
  };

  const getStockStatus = (product) => {
    if (product.stock <= 0) return 'out-of-stock';
    if (product.stock <= product.min_stock) return 'low-stock';
    return 'in-stock';
  };

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
      {/* Filtros */}
      <div className="card">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Buscar productos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="h-5 w-5 text-gray-500" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Todas las categorías</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            
            <button
              onClick={exportProducts}
              className="btn-secondary flex items-center"
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </button>
          </div>
        </div>
      </div>

      {/* Vista de productos */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => {
            const stockStatus = getStockStatus(product);
            
            return (
              <div key={product.id} className="card group hover:shadow-lg transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 text-lg">{product.name}</h3>
                    {product.description && (
                      <p className="text-gray-500 text-sm mt-1 line-clamp-2">
                        {product.description}
                      </p>
                    )}
                  </div>
                  
                  <div className="relative">
                    <button
                      onClick={() => setShowActionsMenu(showActionsMenu === product.id ? null : product.id)}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      <MoreVertical className="h-4 w-4 text-gray-500" />
                    </button>
                    
                    {showActionsMenu === product.id && (
                      <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                        <button
                          onClick={() => toggleProductStatus(product.id, product.is_active)}
                          className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                        >
                          {product.is_active ? 'Desactivar' : 'Activar'}
                        </button>
                        <button
                          onClick={() => deleteProduct(product.id)}
                          className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
                          Eliminar
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-2xl font-bold text-blue-600">
                        ${product.price.toFixed(2)}
                      </div>
                      {product.cost && (
                        <div className="text-sm text-gray-500">
                          Costo: ${product.cost.toFixed(2)}
                        </div>
                      )}
                    </div>
                    
                    <div className="text-right">
                      <div className={`font-medium px-3 py-1 rounded-full text-sm ${
                        stockStatus === 'out-of-stock' ? 'bg-red-100 text-red-800' :
                        stockStatus === 'low-stock' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        Stock: {product.stock}
                      </div>
                      {stockStatus === 'low-stock' && (
                        <div className="text-xs text-yellow-600 mt-1 flex items-center">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Mínimo: {product.min_stock}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>{product.category || 'Sin categoría'}</span>
                    <span className={`flex items-center ${product.is_active ? 'text-green-600' : 'text-gray-400'}`}>
                      {product.is_active ? (
                        <>
                          <Eye className="h-3 w-3 mr-1" />
                          Activo
                        </>
                      ) : (
                        <>
                          <EyeOff className="h-3 w-3 mr-1" />
                          Inactivo
                        </>
                      )}
                    </span>
                  </div>
                  
                  {product.sku && (
                    <div className="text-xs text-gray-400">
                      SKU: {product.sku}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Producto</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Precio</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Stock</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Categoría</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Estado</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => {
                  const stockStatus = getStockStatus(product);
                  
                  return (
                    <tr key={product.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-4">
                        <div>
                          <div className="font-medium text-gray-900">{product.name}</div>
                          <div className="text-sm text-gray-500">{product.description}</div>
                        </div>
                      </td>
                      
                      <td className="py-4 px-4">
                        <div className="font-bold text-gray-900">
                          ${product.price.toFixed(2)}
                        </div>
                      </td>
                      
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-3">
                          <span className={`font-medium px-3 py-1 rounded-full text-sm ${
                            stockStatus === 'out-of-stock' ? 'bg-red-100 text-red-800' :
                            stockStatus === 'low-stock' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {product.stock}
                          </span>
                          
                          {stockStatus === 'low-stock' && product.stock > 0 && (
                            <button
                              onClick={() => updateStock(product.id, product.stock + 10)}
                              className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200"
                            >
                              +10
                            </button>
                          )}
                        </div>
                      </td>
                      
                      <td className="py-4 px-4">
                        <span className="inline-block bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm">
                          {product.category || 'General'}
                        </span>
                      </td>
                      
                      <td className="py-4 px-4">
                        <button
                          onClick={() => toggleProductStatus(product.id, product.is_active)}
                          className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
                            product.is_active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {product.is_active ? (
                            <>
                              <Eye className="h-3 w-3" />
                              <span>Activo</span>
                            </>
                          ) : (
                            <>
                              <EyeOff className="h-3 w-3" />
                              <span>Inactivo</span>
                            </>
                          )}
                        </button>
                      </td>
                      
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {/* Editar */}}
                            className="p-1 text-blue-600 hover:text-blue-800"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          
                          <button
                            onClick={() => deleteProduct(product.id)}
                            className="p-1 text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {filteredProducts.length === 0 && !loading && (
        <div className="text-center py-12">
          <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-900">No hay productos</h4>
          <p className="text-gray-500 mt-2">
            {searchTerm 
              ? 'No se encontraron productos con esos criterios' 
              : 'Comienza agregando productos'
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default ProductManager;