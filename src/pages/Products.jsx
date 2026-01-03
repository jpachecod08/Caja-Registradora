import React, { useState } from 'react';
import ProductManager from '../components/products/ProductManager';
import ProductForm from '../components/products/ProductForm';
import { Plus } from 'lucide-react';

const Products = () => {
  const [showForm, setShowForm] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleSuccess = () => {
    setRefreshKey(prev => prev + 1);
    setShowForm(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Productos
          </h1>
          <p className="text-gray-600">
            Administra tu inventario
          </p>
        </div>

        <button
          onClick={() => setShowForm(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={18} />
          Nuevo producto
        </button>
      </div>

      {/* Contenido */}
      {!showForm ? (
        <ProductManager key={refreshKey} />
      ) : (
        <div className="max-w-3xl bg-white p-6 rounded-xl shadow">
          <ProductForm
            onSuccess={handleSuccess}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}
    </div>
  );
};

export default Products;
