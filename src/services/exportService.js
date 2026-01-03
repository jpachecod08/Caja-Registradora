import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { supabase } from './supabase';

export const exportSalesToExcel = async (startDate, endDate) => {
  try {
    let query = supabase
      .from('sales')
      .select(`
        id,
        sale_number,
        created_at,
        customer_name,
        customer_email,
        payment_method,
        total_amount,
        status,
        sale_items (
          product_name,
          quantity,
          unit_price,
          subtotal
        )
      `)
      .order('created_at', { ascending: false });

    if (startDate) {
      query = query.gte('created_at', `${startDate}T00:00:00`);
    }

    if (endDate) {
      query = query.lte('created_at', `${endDate}T23:59:59`);
    }

    const { data: sales, error } = await query;
    if (error) throw error;
    if (!sales || sales.length === 0) throw new Error('No hay ventas');

    /* =========================
       HOJA 1: VENTAS
    ========================= */
    const salesData = sales.map(sale => ({
      'Número': sale.sale_number,
      'Fecha': new Date(sale.created_at).toLocaleDateString(),
      'Hora': new Date(sale.created_at).toLocaleTimeString(),
      'Cliente': sale.customer_name || 'Cliente ocasional',
      'Email': sale.customer_email || '',
      'Método de Pago': sale.payment_method,
      'Total': sale.total_amount,
      'Estado': sale.status
    }));

    /* =========================
       HOJA 2: ITEMS (CLAVE)
    ========================= */
    const itemsData = [];

    sales.forEach(sale => {
      (sale.sale_items || []).forEach(item => {
        itemsData.push({
          'Venta': sale.sale_number,
          'Producto': item.product_name,
          'Cantidad': item.quantity,
          'Precio Unitario': item.unit_price,
          'Subtotal': item.subtotal,
          'Fecha': new Date(sale.created_at).toLocaleDateString()
        });
      });
    });

    /* =========================
       HOJA 3: RESUMEN
    ========================= */
    const totalRevenue = sales.reduce(
      (sum, sale) => sum + (sale.total_amount || 0),
      0
    );

    const summaryData = [{
      'Total de Ventas': sales.length,
      'Ingreso Total': totalRevenue,
      'Período': `${startDate || 'Inicio'} - ${endDate || 'Hoy'}`,
      'Exportado el': new Date().toLocaleString()
    }];

    /* =========================
       CREAR EXCEL
    ========================= */
    const wb = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(salesData),
      'Ventas'
    );

    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(itemsData),
      'Items Vendidos'
    );

    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(summaryData),
      'Resumen'
    );

    const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([buffer], { type: 'application/octet-stream' });

    saveAs(blob, `ventas_${new Date().toISOString().split('T')[0]}.xlsx`);

    return { success: true, count: sales.length };

  } catch (error) {
    console.error('Error exporting sales:', error);
    throw error;
  }
};

/* =========================
   PRODUCTOS (OK)
========================= */
export const exportProductsToExcel = async () => {
  try {
    const { data: products, error } = await supabase
      .from('products')
      .select('*')
      .order('name');

    if (error) throw error;

    const productsData = products.map(product => ({
      'Nombre': product.name,
      'Descripción': product.description,
      'Precio': product.price,
      'Costo': product.cost,
      'Stock': product.stock,
      'Stock Mínimo': product.min_stock,
      'Código': product.barcode,
      'SKU': product.sku,
      'Categoría': product.category,
      'Estado': product.is_active ? 'Activo' : 'Inactivo',
      'Creado': new Date(product.created_at).toLocaleDateString()
    }));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(productsData),
      'Productos'
    );

    const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([buffer], { type: 'application/octet-stream' });

    saveAs(blob, `productos_${new Date().toISOString().split('T')[0]}.xlsx`);

    return { success: true, count: products.length };
  } catch (error) {
    console.error('Error exporting products:', error);
    throw error;
  }
};
