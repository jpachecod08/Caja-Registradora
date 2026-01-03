import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { toast } from 'react-hot-toast';
import {
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Package,
  AlertTriangle,
  MoreVertical,
  RefreshCw,
  Search,
  Filter,
  ChevronUp,
  ChevronDown,
  CheckCircle,
  XCircle
} from 'lucide-react';

const ProductTable = ({ 
  products: initialProducts, 
  onEdit, 
  onRefresh,
  viewMode = 'table'
}) => {
  const [products, setProducts] = useState(initialProducts || []);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(!initialProducts);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  const [categories, setCategories] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' });
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [showActionsMenu, setShowActionsMenu] = useState(null);
  const [bulkAction, setBulkAction] = useState('');

  useEffect(() => {
    if (!initialProducts) {
      fetchProducts();
    } else {
      setProducts(initialProducts);
      extractCategories(initialProducts);
    }
  }, [initialProducts]);

  useEffect(() => {
    filterAndSortProducts();
  }, [products, searchTerm, selectedCategory, statusFilter, stockFilter, sortConfig]);

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
      console.error('Error fetching products:', error);
      toast.error('Error al cargar productos');
    } finally {
      setLoading(false);
    }
  };

  const extractCategories = (products) => {
    const uniqueCategories = [...new Set(products.map(p => p.category).filter(Boolean))];
    setCategories(uniqueCategories);
  };

  const filterAndSortProducts = () => {
    let filtered = [...products];
    
    // Filtrar por búsqueda
    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.barcode?.includes(searchTerm)
      );
    }
    
    // Filtrar por categoría
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(product => product.category === selectedCategory);
    }
    
    // Filtrar por estado
    if (statusFilter !== 'all') {
      filtered = filtered.filter(product => 
        statusFilter === 'active' ? product.is_active : !product.is_active
      );
    }
    
    // Filtrar por stock
    if (stockFilter !== 'all') {
      filtered = filtered.filter(product => {
        if (stockFilter === 'in_stock') return product.stock > 0;
        if (stockFilter === 'out_of_stock') return product.stock === 0;
        if (stockFilter === 'low_stock') return product.stock > 0 && product.stock <= product.min_stock;
        return true;
      });
    }
    
    // Ordenar
    filtered.sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];
      
      // Manejar valores nulos
      if (aValue === null || aValue === undefined) aValue = '';
      if (bValue === null || bValue === undefined) bValue = '';
      
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      
      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
    
    setFilteredProducts(filtered);
  };

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) {
      return <ChevronUp className="h-4 w-4 text-gray-300" />;
    }
    return sortConfig.direction === 'asc' 
      ? <ChevronUp className="h-4 w-4 text-blue-600" />
      : <ChevronDown className="h-4 w-4 text-blue-600" />;
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

  const toggleSelectProduct = (productId) => {
    setSelectedProducts(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const selectAllProducts = () => {
    if (selectedProducts.length === filteredProducts.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(filteredProducts.map(p => p.id));
    }
  };

  const handleBulkAction = async () => {
    if (!bulkAction || selectedProducts.length === 0) {
      toast.error('Selecciona una acción y productos');
      return;
    }

    try {
      switch (bulkAction) {
        case 'activate':
          await supabase
            .from('products')
            .update({ is_active: true })
            .in('id', selectedProducts);
          toast.success(`${selectedProducts.length} productos activados`);
          break;
        
        case 'deactivate':
          await supabase
            .from('products')
            .update({ is_active: false })
            .in('id', selectedProducts);
          toast.success(`${selectedProducts.length} productos desactivados`);
          break;
        
        case 'delete':
          if (!window.confirm(`¿Eliminar ${selectedProducts.length} productos?`)) return;
          await supabase
            .from('products')
            .delete()
            .in('id', selectedProducts);
          toast.success(`${selectedProducts.length} productos eliminados`);
          break;
      }

      setSelectedProducts([]);
      setBulkAction('');
      fetchProducts();
    } catch (error) {
      console.error('Error in bulk action:', error);
      toast.error('Error al realizar acción en lote');
    }
  };

  const getStockStatus = (product) => {
    if (product.stock <= 0) return 'out-of-stock';
    if (product.stock <= product.min_stock) return 'low-stock';
    return 'in-stock';
  };

  if (loading && !initialProducts) {
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
      {/* Filtros y búsqueda */}
      <div className="card">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Buscar productos por nombre, SKU o código..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={fetchProducts}
              className="p-3 border border-gray-300 rounded-lg hover:bg-gray-50"
              title="Actualizar productos"
            >
              <RefreshCw className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Categoría
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Todas las categorías</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Estado
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Todos los estados</option>
              <option value="active">Activos</option>
              <option value="inactive">Inactivos</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Stock
            </label>
            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Todo el stock</option>
              <option value="in_stock">En stock</option>
              <option value="out_of_stock">Sin stock</option>
              <option value="low_stock">Bajo stock</option>
            </select>
          </div>
        </div>
      </div>

      {/* Acciones en lote */}
      {selectedProducts.length > 0 && (
        <div className="card bg-blue-50 border border-blue-200">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-blue-600 mr-2" />
              <span className="font-medium text-blue-800">
                {selectedProducts.length} productos seleccionados
              </span>
            </div>
            
            <div className="flex items-center space-x-3">
              <select
                value={bulkAction}
                onChange={(e) => setBulkAction(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Acción en lote</option>
                <option value="activate">Activar</option>
                <option value="deactivate">Desactivar</option>
                <option value="delete">Eliminar</option>
              </select>
              
              <button
                onClick={handleBulkAction}
                disabled={!bulkAction}
                className={`btn-primary ${!bulkAction ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                Aplicar
              </button>
              
              <button
                onClick={() => setSelectedProducts([])}
                className="text-sm text-gray-600 hover:text-gray-800"
              >
                Deseleccionar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tabla de productos */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="py-3 px-4">
                  <input
                    type="checkbox"
                    checked={selectedProducts.length === filteredProducts.length && filteredProducts.length > 0}
                    onChange={selectAllProducts}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                </th>
                <th 
                  className="text-left py-3 px-4 font-medium text-gray-700 cursor-pointer"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center">
                    Producto
                    {getSortIcon('name')}
                  </div>
                </th>
                <th 
                  className="text-left py-3 px-4 font-medium text-gray-700 cursor-pointer"
                  onClick={() => handleSort('price')}
                >
                  <div className="flex items-center">
                    Precio
                    {getSortIcon('price')}
                  </div>
                </th>
                <th 
                  className="text-left py-3 px-4 font-medium text-gray-700 cursor-pointer"
                  onClick={() => handleSort('stock')}
                >
                  <div className="flex items-center">
                    Stock
                    {getSortIcon('stock')}
                  </div>
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">
                  Categoría
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">
                  Estado
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => {
                const stockStatus = getStockStatus(product);
                const isSelected = selectedProducts.includes(product.id);
                
                return (
                  <tr 
                    key={product.id} 
                    className={`border-b border-gray-100 hover:bg-gray-50 ${isSelected ? 'bg-blue-50' : ''}`}
                  >
                    <td className="py-4 px-4">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectProduct(product.id)}
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                    </td>
                    
                    <td className="py-4 px-4">
                      <div>
                        <div className="font-medium text-gray-900">{product.name}</div>
                        <div className="text-sm text-gray-500 mt-1">
                          {product.description && (
                            <div className="truncate max-w-xs">{product.description}</div>
                          )}
                          {(product.sku || product.barcode) && (
                            <div className="flex items-center space-x-3 mt-1">
                              {product.sku && (
                                <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">
                                  SKU: {product.sku}
                                </span>
                              )}
                              {product.barcode && (
                                <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">
                                  Código: {product.barcode}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    
                    <td className="py-4 px-4">
                      <div className="font-bold text-gray-900">
                        $${product.price.toFixed(2)}
                      </div>
                      {product.cost && (
                        <div className="text-sm text-gray-500">
                          Costo: ${product.cost.toFixed(2)}
                        </div>
                      )}
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
                            className="text-xs btn-secondary px-2 py-1"
                            title="Agregar 10 unidades"
                          >
                            +10
                          </button>
                        )}
                      </div>
                      
                      {stockStatus === 'low-stock' && (
                        <div className="text-xs text-yellow-600 mt-1 flex items-center">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Mínimo: {product.min_stock}
                        </div>
                      )}
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
                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
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
                        {onEdit && (
                          <button
                            onClick={() => onEdit(product)}
                            className="p-1 text-blue-600 hover:text-blue-800"
                            title="Editar producto"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                        )}
                        
                        <button
                          onClick={() => updateStock(product.id, product.stock + 1)}
                          className="p-1 text-green-600 hover:text-green-800"
                          title="Incrementar stock"
                        >
                          <Package className="h-4 w-4" />
                        </button>
                        
                        <button
                          onClick={() => deleteProduct(product.id)}
                          className="p-1 text-red-600 hover:text-red-800"
                          title="Eliminar producto"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                        
                        <div className="relative">
                          <button
                            onClick={() => setShowActionsMenu(showActionsMenu === product.id ? null : product.id)}
                            className="p-1 text-gray-600 hover:text-gray-800"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>
                          
                          {showActionsMenu === product.id && (
                            <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(product.sku || product.barcode || product.name);
                                  toast.success('Copiado al portapapeles');
                                  setShowActionsMenu(null);
                                }}
                                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                              >
                                Copiar referencia
                              </button>
                              <button
                                onClick={() => {
                                  updateStock(product.id, product.stock + 50);
                                  setShowActionsMenu(null);
                                }}
                                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                              >
                                Agregar 50 unidades
                              </button>
                              <button
                                onClick={() => {
                                  setShowActionsMenu(null);
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                              >
                                Ver historial
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          
          {filteredProducts.length === 0 && (
            <div className="text-center py-12">
              <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900">No hay productos</h4>
              <p className="text-gray-500 mt-2">
                {searchTerm || selectedCategory !== 'all' || statusFilter !== 'all' || stockFilter !== 'all'
                  ? 'No se encontraron productos con esos filtros'
                  : 'Comienza agregando productos'
                }
              </p>
            </div>
          )}
        </div>

        {/* Resumen */}
        {filteredProducts.length > 0 && (
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
            <div className="flex flex-col md:flex-row md:items-center justify-between">
              <div className="text-sm text-gray-600">
                Mostrando {filteredProducts.length} de {products.length} productos
              </div>
              
              <div className="flex items-center space-x-6 mt-2 md:mt-0">
                <div className="text-sm">
                  <span className="text-green-600 font-medium">
                    {products.filter(p => p.is_active).length} activos
                  </span>
                  <span className="mx-2">•</span>
                  <span className="text-yellow-600 font-medium">
                    {products.filter(p => p.stock > 0 && p.stock <= p.min_stock).length} bajo stock
                  </span>
                  <span className="mx-2">•</span>
                  <span className="text-red-600 font-medium">
                    {products.filter(p => p.stock === 0).length} sin stock
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductTable;