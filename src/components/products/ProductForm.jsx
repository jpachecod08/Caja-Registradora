import React, { useState } from 'react';
import { supabase } from '../../services/supabase';
import { toast } from 'react-hot-toast';
import { Save, X, Package, DollarSign, Layers } from 'lucide-react';

const ProductForm = ({ onSuccess, onCancel }) => {
  const [form, setForm] = useState({
    name: '',
    price: '',
    category: '',
    stock: 0,
    is_active: true,
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name.trim()) {
      toast.error('El nombre es obligatorio');
      return;
    }

    const price = Number(form.price);
    if (price <= 0) {
      toast.error('El precio debe ser mayor a 0');
      return;
    }

    setLoading(true);

    const { error, data } = await supabase
      .from('products')
      .insert([{
        name: form.name.trim(),
        price,
        category: form.category || 'General',
        stock: Number(form.stock) || 0,
        is_active: form.is_active
      }])
      .select()
      .single();

    setLoading(false);

    if (error) {
      console.error(error);
      toast.error('Error al crear el producto');
      return;
    }

    toast.success('Producto creado');
    onSuccess?.(data);
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow max-w-xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Package size={20} /> Nuevo producto
        </h3>
        <button onClick={onCancel}>
          <X />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">

        {/* Nombre */}
        <input
          name="name"
          placeholder="Nombre del producto"
          className="input-field"
          value={form.name}
          onChange={handleChange}
        />

        {/* Precio */}
        <div className="relative">
          <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400">
            <DollarSign size={18} />
          </span>
          <input
            name="price"
            type="number"
            step="0.01"
            placeholder="Precio"
            value={form.price}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 pl-12 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Categoría */}
        <div className="relative">
          <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400">
            <Layers size={18} />
          </span>
          <input
            name="category"
            placeholder="Categoría (opcional)"
            value={form.category}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 pl-12 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Stock */}
        <input
          name="stock"
          type="number"
          placeholder="Stock inicial"
          className="input-field"
          value={form.stock}
          onChange={handleChange}
        />

        {/* Activo */}
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="is_active"
            checked={form.is_active}
            onChange={handleChange}
          />
          Producto activo
        </label>

        {/* Acciones */}
        <div className="flex justify-end gap-2 pt-4">
          <button type="button" className="btn-secondary" onClick={onCancel}>
            Cancelar
          </button>
          <button
            type="submit"
            className="btn-primary flex items-center gap-2"
            disabled={loading}
          >
            <Save size={16} />
            {loading ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProductForm;
