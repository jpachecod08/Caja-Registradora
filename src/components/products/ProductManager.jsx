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
  Download,
  X,
  Save,
  TrendingDown,
  CheckCircle,
  BarChart3
} from 'lucide-react';

const ProductManager = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [categories, setCategories] = useState([]);
  const [showActionsMenu, setShowActionsMenu] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    stock: 0,
    min_stock: 5,
    category: '',
    is_active: true
  });

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
      console.error('Error cargando productos:', error);
      toast.error('Error al cargar productos');
    } finally {
      setLoading(false);
    }
  };

  const extractCategories = (products) => {
    const uniqueCategories = [...new Set(products
      .map(p => p.category)
      .filter(Boolean)
      .sort())];
    setCategories(uniqueCategories);
  };

  const filterProducts = () => {
    let filtered = [...products];
    
    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(product => product.category === selectedCategory);
    }
    
    setFilteredProducts(filtered);
  };

  const handleEditClick = (product) => {
    setEditingProduct(product.id);
    setEditForm({
      name: product.name || '',
      description: product.description || '',
      stock: product.stock || 0,
      min_stock: product.min_stock || 5,
      category: product.category || '',
      is_active: product.is_active
    });
  };

  const handleEditFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : 
              (type === 'number' ? (value === '' ? '' : Number(value)) : value)
    }));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    
    if (!editingProduct) return;
    
    try {
      const { error } = await supabase
        .from('products')
        .update({
          ...editForm,
          // Mantener precio y costo en 0
          price: 0,
          cost: 0
        })
        .eq('id', editingProduct);
      
      if (error) throw error;
      
      toast.success('✅ Producto actualizado exitosamente');
      setEditingProduct(null);
      fetchProducts();
    } catch (error) {
      console.error('Error actualizando producto:', error);
      toast.error('Error al actualizar producto');
    }
  };

  const cancelEdit = () => {
    setEditingProduct(null);
    setEditForm({
      name: '',
      description: '',
      stock: 0,
      min_stock: 5,
      category: '',
      is_active: true
    });
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
      console.error('Error cambiando estado:', error);
      toast.error('Error al cambiar estado');
    }
  };

  const deleteProduct = async (productId) => {
    if (!window.confirm('¿Estás seguro de eliminar este producto? Esta acción no se puede deshacer.')) return;
    
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);
      
      if (error) throw error;
      
      toast.success('✅ Producto eliminado');
      fetchProducts();
    } catch (error) {
      console.error('Error eliminando producto:', error);
      toast.error('Error al eliminar producto');
    }
  };

  const updateStock = async (productId, newStock) => {
    if (newStock < 0) {
      toast.error('El stock no puede ser negativo');
      return;
    }
    
    try {
      const { error } = await supabase
        .from('products')
        .update({ stock: newStock })
        .eq('id', productId);
      
      if (error) throw error;
      
      toast.success('✅ Stock actualizado');
      fetchProducts();
    } catch (error) {
      console.error('Error actualizando stock:', error);
      toast.error('Error al actualizar stock');
    }
  };

  const exportProducts = () => {
    toast.success('📊 Exportación en desarrollo...');
  };

  const getStockStatus = (product) => {
    if (!product.is_active) return 'inactive';
    if (product.stock <= 0) return 'out-of-stock';
    if (product.stock <= product.min_stock) return 'low-stock';
    return 'in-stock';
  };

  const getStockColor = (stock, minStock) => {
    if (stock === 0) return 'bg-red-100 text-red-800';
    if (stock <= minStock) return 'bg-yellow-100 text-yellow-800';
    if (stock <= minStock * 2) return 'bg-orange-100 text-orange-800';
    return 'bg-green-100 text-green-800';
  };

  const getStockStatusText = (stock, minStock) => {
    if (stock === 0) return 'AGOTADO';
    if (stock <= minStock) return 'BAJO STOCK';
    if (stock <= minStock * 2) return 'MEDIO STOCK';
    return 'DISPONIBLE';
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

  // Estadísticas del inventario
  const stats = {
    totalProducts: products.length,
    activeProducts: products.filter(p => p.is_active).length,
    outOfStock: products.filter(p => p.is_active && p.stock === 0).length,
    lowStock: products.filter(p => p.is_active && p.stock > 0 && p.stock <= (p.min_stock || 5)).length,
    inStock: products.filter(p => p.is_active && p.stock > (p.min_stock || 5)).length
  };

  return (
    <div className="space-y-6">
      {/* Modal de edición */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">Editar Producto</h2>
              <button
                onClick={cancelEdit}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleEditSubmit} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={editForm.name}
                    onChange={handleEditFormChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción
                  </label>
                  <textarea
                    name="description"
                    value={editForm.description}
                    onChange={handleEditFormChange}
                    rows="2"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Categoría
                  </label>
                  <input
                    type="text"
                    name="category"
                    value={editForm.category}
                    onChange={handleEditFormChange}
                    list="categories-list"
                    placeholder="Ej: Congelados, Fritos..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                  <datalist id="categories-list">
                    {categories.map(category => (
                      <option key={category} value={category} />
                    ))}
                  </datalist>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Stock actual *
                  </label>
                  <input
                    type="number"
                    name="stock"
                    value={editForm.stock}
                    onChange={handleEditFormChange}
                    required
                    min="0"
                    step="1"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Stock mínimo de alerta *
                  </label>
                  <input
                    type="number"
                    name="min_stock"
                    value={editForm.min_stock}
                    onChange={handleEditFormChange}
                    required
                    min="0"
                    step="1"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
                
                <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                  <input
                    type="checkbox"
                    id="edit_is_active"
                    name="is_active"
                    checked={editForm.is_active}
                    onChange={handleEditFormChange}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="edit_is_active" className="ml-2 text-sm text-gray-700">
                    Producto activo
                  </label>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-8 pt-6 border-t">
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Resumen de inventario */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Productos totales</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalProducts}</p>
            </div>
            <div className="p-2 bg-blue-100 rounded-lg">
              <Package className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">En stock</p>
              <p className="text-2xl font-bold text-green-600">{stats.inStock}</p>
            </div>
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Bajo stock</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.lowStock}</p>
            </div>
            <div className="p-2 bg-yellow-100 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Agotados</p>
              <p className="text-2xl font-bold text-red-600">{stats.outOfStock}</p>
            </div>
            <div className="p-2 bg-red-100 rounded-lg">
              <TrendingDown className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="card">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Buscar productos por nombre o categoría..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="h-5 w-5 text-gray-500" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                <option value="all">Todas las categorías</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            
            <button
              onClick={exportProducts}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors flex items-center"
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </button>
          </div>
        </div>
      </div>

      {/* Vista de productos en grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.map((product) => {
          const stockStatus = getStockStatus(product);
          const stockColor = getStockColor(product.stock, product.min_stock || 5);
          const stockStatusText = getStockStatusText(product.stock, product.min_stock || 5);
          const isOutOfStock = product.stock === 0;
          const isLowStock = product.stock > 0 && product.stock <= (product.min_stock || 5);
          
          return (
            <div key={product.id} className={`card group hover:shadow-lg transition-all duration-300 ${
              !product.is_active ? 'opacity-60' : ''
            }`}>
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900 text-lg">{product.name}</h3>
                      {product.description && (
                        <p className="text-gray-500 text-sm mt-1 line-clamp-2">
                          {product.description}
                        </p>
                      )}
                    </div>
                    
                    {/* Badge de estado del stock */}
                    <div className={`px-2 py-1 rounded-full text-xs font-bold ${stockColor} ml-2`}>
                      {stockStatusText}
                    </div>
                  </div>
                  
                  {product.category && (
                    <span className="inline-block mt-2 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      {product.category}
                    </span>
                  )}
                </div>
                
                {/* Menú de acciones */}
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
                        onClick={() => {
                          handleEditClick(product);
                          setShowActionsMenu(null);
                        }}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center gap-2"
                      >
                        <Edit className="h-3 w-3" />
                        Editar producto
                      </button>
                      <button
                        onClick={() => {
                          toggleProductStatus(product.id, product.is_active);
                          setShowActionsMenu(null);
                        }}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center gap-2"
                      >
                        {product.is_active ? (
                          <>
                            <EyeOff className="h-3 w-3" />
                            Desactivar
                          </>
                        ) : (
                          <>
                            <Eye className="h-3 w-3" />
                            Activar
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => {
                          deleteProduct(product.id);
                          setShowActionsMenu(null);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                      >
                        <Trash2 className="h-3 w-3" />
                        Eliminar
                      </button>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="space-y-4">
                {/* Información de stock */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="text-3xl font-bold text-gray-900">
                      {product.stock}
                    </div>
                    <div className="text-sm text-gray-500">
                      unidades
                    </div>
                  </div>
                  
                  {/* Indicador visual de nivel de stock */}
                  {product.is_active && product.stock > 0 && (
                    <div className="w-24">
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${
                            isLowStock ? 'bg-yellow-500' : 'bg-green-500'
                          }`}
                          style={{ 
                            width: `${Math.min((product.stock / ((product.min_stock || 5) * 3)) * 100, 100)}%` 
                          }}
                        ></div>
                      </div>
                      <div className="text-xs text-gray-500 text-right mt-1">
                        Mín: {product.min_stock || 5}
                      </div>
                    </div>
                  )}
                </div>

                {/* Botones de acción rápida de stock */}
                {product.is_active && (
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <div className="flex items-center space-x-2">
                      {isLowStock && !isOutOfStock && (
                        <div className="flex items-center text-xs text-yellow-600">
                          <AlertTriangle className="h-3 w-3 mr-1" />
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

                    <div className="flex space-x-2">
                      <button
                        onClick={() => updateStock(product.id, product.stock + 5)}
                        className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200 transition-colors"
                        title="Añadir 5 unidades"
                      >
                        +5
                      </button>
                      <button
                        onClick={() => {
                          const newStock = Math.max(0, product.stock - 1);
                          updateStock(product.id, newStock);
                        }}
                        className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200 transition-colors"
                        title="Reducir 1 unidad"
                        disabled={isOutOfStock}
                      >
                        -1
                      </button>
                    </div>
                  </div>
                )}

                {/* Estado activo/inactivo */}
                <div className={`flex items-center justify-between text-sm ${product.is_active ? 'text-green-600' : 'text-gray-400'}`}>
                  <span className="flex items-center">
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
                  <span className="text-xs text-gray-500">
                    Actualizado: {new Date(product.created_at).toLocaleDateString('es-ES')}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredProducts.length === 0 && !loading && (
        <div className="text-center py-12">
          <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-900">No hay productos</h4>
          <p className="text-gray-500 mt-2">
            {searchTerm 
              ? 'No se encontraron productos con esos criterios' 
              : 'Comienza agregando productos a tu inventario'
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default ProductManager;