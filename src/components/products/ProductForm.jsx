import React, { useState } from 'react';
import { supabase } from '../../services/supabase';
import { toast } from 'react-hot-toast';
import { Save, X, Package, Layers, Hash, AlertCircle } from 'lucide-react';

const ProductForm = ({ onSuccess, onCancel }) => {
  const [form, setForm] = useState({
    name: '',
    category: '',
    stock: 0,
    min_stock: 5, // Valor por defecto para mínimo stock
    is_active: true,
    description: ''
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : 
              (type === 'number' ? (value === '' ? '' : Number(value)) : value)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name.trim()) {
      toast.error('El nombre del producto es obligatorio');
      return;
    }

    const stock = Number(form.stock);
    if (stock < 0) {
      toast.error('El stock no puede ser negativo');
      return;
    }

    const minStock = Number(form.min_stock);
    if (minStock < 0) {
      toast.error('El stock mínimo no puede ser negativo');
      return;
    }

    setLoading(true);

    const { error, data } = await supabase
      .from('products')
      .insert([{
        name: form.name.trim(),
        description: form.description.trim() || null,
        category: form.category.trim() || 'General',
        stock: stock,
        min_stock: minStock,
        price: 0, // Precio fijo en 0 ya que no se manejan precios
        cost: 0,  // Costo fijo en 0
        is_active: form.is_active
      }])
      .select()
      .single();

    setLoading(false);

    if (error) {
      console.error('Error al crear producto:', error);
      toast.error(`Error al crear el producto: ${error.message}`);
      return;
    }

    toast.success('✅ Producto creado exitosamente');
    onSuccess?.(data);
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow max-w-xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Package size={20} /> Nuevo producto
        </h3>
        <button 
          onClick={onCancel}
          className="p-2 hover:bg-gray-100 rounded-full"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Nombre */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nombre del producto *
          </label>
          <input
            name="name"
            placeholder="Ej: Pollo frito, Papas congeladas..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            value={form.name}
            onChange={handleChange}
            required
          />
        </div>

        {/* Descripción */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Descripción (opcional)
          </label>
          <textarea
            name="description"
            placeholder="Descripción del producto..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all min-h-[80px]"
            value={form.description}
            onChange={handleChange}
            rows="2"
          />
        </div>

        {/* Categoría */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Categoría (opcional)
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400">
              <Layers size={18} />
            </span>
            <input
              name="category"
              placeholder="Ej: Congelados, Fritos, Aperitivos..."
              value={form.category}
              onChange={handleChange}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
        </div>

        {/* Stock inicial */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Stock inicial *
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400">
              <Hash size={18} />
            </span>
            <input
              name="stock"
              type="number"
              min="0"
              step="1"
              placeholder="0"
              value={form.stock}
              onChange={handleChange}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              required
            />
          </div>
        </div>

        {/* Stock mínimo */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Stock mínimo de alerta *
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400">
              <AlertCircle size={18} />
            </span>
            <input
              name="min_stock"
              type="number"
              min="0"
              step="1"
              placeholder="5"
              value={form.min_stock}
              onChange={handleChange}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              required
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Se enviará una alerta cuando el stock llegue a este nivel
          </p>
        </div>

        {/* Estado activo */}
        <div className="flex items-center p-3 bg-gray-50 rounded-lg">
          <input
            type="checkbox"
            id="is_active"
            name="is_active"
            checked={form.is_active}
            onChange={handleChange}
            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label htmlFor="is_active" className="ml-2 text-sm text-gray-700">
            Producto activo (aparecerá en el inventario)
          </label>
        </div>

        {/* Acciones */}
        <div className="flex justify-end gap-2 pt-4 border-t border-gray-200">
          <button 
            type="button" 
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            <Save size={16} />
            {loading ? 'Guardando...' : 'Guardar Producto'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProductForm;