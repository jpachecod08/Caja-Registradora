import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { toast } from 'react-hot-toast';
import ProductList from '../components/sales/ProductList';
import Cart from '../components/sales/Cart';
import Checkout from '../components/sales/Checkout';
import { Search, Filter, RefreshCw } from 'lucide-react';

const Register = () => {
  const [cart, setCart] = useState([]);
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [categories, setCategories] = useState([]);

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
        .eq('is_active', true)
        .order('name');

      if (error) throw error;

      setProducts(data || []);
      extractCategories(data || []);
      toast.success('Productos cargados');
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

  const filterProducts = () => {
    let filtered = [...products];
    
    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.barcode?.includes(searchTerm)
      );
    }
    
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(product => product.category === selectedCategory);
    }
    
    setFilteredProducts(filtered);
  };

  const addToCart = (product) => {
    if (product.stock <= 0) {
      toast.error('Producto sin stock');
      return;
    }

    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);
      
      if (existingItem) {
        if (existingItem.quantity >= product.stock) {
          toast.error('Stock insuficiente');
          return prevCart;
        }
        
        return prevCart.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        return [...prevCart, { 
          ...product, 
          quantity: 1 
        }];
      }
    });
    
    toast.success(`${product.name} agregado al carrito`);
  };

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity < 1) {
      removeFromCart(productId);
      return;
    }
    
    const product = products.find(p => p.id === productId);
    if (product && newQuantity > product.stock) {
      toast.error('Stock insuficiente');
      return;
    }
    
    setCart(prevCart =>
      prevCart.map(item =>
        item.id === productId
          ? { ...item, quantity: newQuantity }
          : item
      )
    );
  };

  const removeFromCart = (productId) => {
    setCart(prevCart => prevCart.filter(item => item.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    toast.success('Carrito vaciado');
  };

  const handleSaleComplete = () => {
    clearCart();
    fetchProducts();
  };

  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Caja Registradora</h1>
          <p className="text-gray-600 mt-1">Procesa ventas rápidamente</p>
        </div>
        
        <div className="flex items-center space-x-4 mt-4 lg:mt-0">
          <div className="text-lg font-bold bg-blue-50 text-blue-700 px-4 py-2 rounded-lg">
            Total: <span className="text-2xl">${total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="card">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Buscar productos por nombre o código de barras..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <Filter className="h-5 w-5 text-gray-500" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Todas las categorías</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            
            <button
              onClick={fetchProducts}
              className="p-3 border border-gray-300 rounded-lg hover:bg-gray-50"
              title="Actualizar productos"
            >
              <RefreshCw className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de productos */}
        <div className="lg:col-span-2">
          <ProductList
            products={filteredProducts}
            loading={loading}
            onAddToCart={addToCart}
          />
        </div>

        {/* Carrito y checkout */}
        <div className="space-y-6">
          <Cart
            cart={cart}
            onUpdateQuantity={updateQuantity}
            onRemoveItem={removeFromCart}
            onClearCart={clearCart}
          />
          
          <Checkout
            cart={cart}
            total={total}
            onSaleComplete={handleSaleComplete}
          />
        </div>
      </div>
    </div>
  );
};

export default Register;