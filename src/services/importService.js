import * as XLSX from 'xlsx';
import { supabase } from './supabase';
import { toast } from 'react-hot-toast';

export const importProductsFromExcel = async (file, userId) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Convertir a JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        if (jsonData.length === 0) {
          throw new Error('El archivo Excel está vacío');
        }

        // Procesar productos
        const processedProducts = [];
        const errors = [];

        for (let i = 0; i < jsonData.length; i++) {
          const row = jsonData[i];
          
          try {
            // Buscar nombre y precio (aceptar diferentes nombres de columna)
            let productName = row.nombre || row.name || row.producto || row.product;
            let productPrice = row.precio || row.price || row.valor;
            
            if (!productName || !productPrice) {
              throw new Error('Nombre y precio son requeridos');
            }

            const price = parseFloat(productPrice);
            if (isNaN(price) || price <= 0) {
              throw new Error('Precio inválido');
            }

            const product = {
              name: productName.toString().trim(),
              description: row.descripcion || row.description || '',
              price: price,
              cost: row.costo || row.cost || null,
              stock: parseInt(row.stock || row.cantidad || row.inventario || 0),
              barcode: row.codigo_barras || row.barcode || row.codigo || '',
              sku: row.sku || row.codigo || '',
              category: row.categoria || row.category || 'General',
              min_stock: parseInt(row.stock_minimo || row.min_stock || 5),
              is_active: true,
              created_by: userId
            };

            processedProducts.push(product);
          } catch (error) {
            errors.push({
              row: i + 2,
              error: error.message,
              data: row
            });
          }
        }

        if (processedProducts.length === 0) {
          throw new Error('No se pudieron procesar productos del archivo');
        }

        // Insertar productos en lotes
        const batchSize = 50;
        const successfulInserts = [];
        const failedInserts = [];

        for (let i = 0; i < processedProducts.length; i += batchSize) {
          const batch = processedProducts.slice(i, i + batchSize);
          
          const { data, error } = await supabase
            .from('products')
            .insert(batch)
            .select();

          if (error) {
            failedInserts.push(...batch);
            console.error('Error en lote:', error);
          } else {
            successfulInserts.push(...(data || []));
          }
        }

        resolve({
          total: jsonData.length,
          success: successfulInserts.length,
          failed: failedInserts.length + errors.length,
          errors: errors,
          products: successfulInserts
        });

      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Error al leer el archivo'));
    };
    
    reader.readAsArrayBuffer(file);
  });
};

export const downloadExcelTemplate = () => {
  const templateData = [
    {
      'nombre': 'Café Americano',
      'descripcion': 'Café negro americano',
      'precio': 2.50,
      'costo': 1.00,
      'stock': 100,
      'codigo_barras': '1234567890123',
      'sku': 'CAF-001',
      'categoria': 'Bebidas',
      'stock_minimo': 10
    },
    {
      'nombre': 'Sandwich de Jamón',
      'descripcion': 'Sandwich de jamón y queso',
      'precio': 5.00,
      'costo': 2.50,
      'stock': 50,
      'codigo_barras': '1234567890124',
      'sku': 'SAN-001',
      'categoria': 'Comida',
      'stock_minimo': 5
    }
  ];
  
  const ws = XLSX.utils.json_to_sheet(templateData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Productos');
  
  const wscols = [
    {wch: 20}, // nombre
    {wch: 25}, // descripcion
    {wch: 10}, // precio
    {wch: 10}, // costo
    {wch: 8},  // stock
    {wch: 15}, // codigo_barras
    {wch: 10}, // sku
    {wch: 12}, // categoria
    {wch: 12}, // stock_minimo
  ];
  ws['!cols'] = wscols;
  
  XLSX.writeFile(wb, 'plantilla_productos.xlsx');
};