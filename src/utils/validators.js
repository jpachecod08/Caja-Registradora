/**
 * Utilidades de validación para la aplicación de caja registradora
 */

/**
 * Valida un correo electrónico
 * @param {string} email - Email a validar
 * @returns {boolean} - True si es válido
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Valida una contraseña (mínimo 6 caracteres)
 * @param {string} password - Contraseña a validar
 * @returns {boolean} - True si es válido
 */
export const isValidPassword = (password) => {
  return password && password.length >= 6;
};

/**
 * Valida un nombre (solo letras, espacios y algunos caracteres especiales)
 * @param {string} name - Nombre a validar
 * @returns {boolean} - True si es válido
 */
export const isValidName = (name) => {
  const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s.'-]+$/;
  return name && nameRegex.test(name) && name.length >= 2;
};

/**
 * Valida un precio (número positivo con máximo 2 decimales)
 * @param {string|number} price - Precio a validar
 * @returns {boolean} - True si es válido
 */
export const isValidPrice = (price) => {
  if (!price && price !== 0) return false;
  
  const priceStr = price.toString();
  const priceRegex = /^\d+(\.\d{1,2})?$/;
  const isValid = priceRegex.test(priceStr);
  const isPositive = parseFloat(price) > 0;
  
  return isValid && isPositive;
};

/**
 * Valida una cantidad de stock (entero positivo)
 * @param {string|number} stock - Stock a validar
 * @returns {boolean} - True si es válido
 */
export const isValidStock = (stock) => {
  if (!stock && stock !== 0) return false;
  
  const stockNum = parseInt(stock);
  return Number.isInteger(stockNum) && stockNum >= 0;
};

/**
 * Valida un código de barras (EAN-13 básico)
 * @param {string} barcode - Código de barras a validar
 * @returns {boolean} - True si es válido
 */
export const isValidBarcode = (barcode) => {
  if (!barcode) return true; // Opcional
  
  // EAN-13 debe tener 13 dígitos
  if (barcode.length !== 13) return false;
  
  // Solo números
  if (!/^\d+$/.test(barcode)) return false;
  
  // Validar dígito de control
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const digit = parseInt(barcode[i]);
    sum += (i % 2 === 0) ? digit : digit * 3;
  }
  const checkDigit = (10 - (sum % 10)) % 10;
  
  return checkDigit === parseInt(barcode[12]);
};

/**
 * Valida un SKU (formato alfanumérico con guiones opcionales)
 * @param {string} sku - SKU a validar
 * @returns {boolean} - True si es válido
 */
export const isValidSKU = (sku) => {
  if (!sku) return true; // Opcional
  
  const skuRegex = /^[A-Za-z0-9\-_]+$/;
  return skuRegex.test(sku) && sku.length >= 3 && sku.length <= 50;
};

/**
 * Valida un número de teléfono
 * @param {string} phone - Teléfono a validar
 * @returns {boolean} - True si es válido
 */
export const isValidPhone = (phone) => {
  if (!phone) return true; // Opcional
  
  const phoneRegex = /^[\+]?[0-9\s\-\(\)]{8,}$/;
  return phoneRegex.test(phone);
};

/**
 * Valida un RUC/DNI/Cédula (formato básico)
 * @param {string} idNumber - Número de identificación
 * @returns {boolean} - True si es válido
 */
export const isValidIdNumber = (idNumber) => {
  if (!idNumber) return true; // Opcional
  
  const idRegex = /^[0-9]{8,20}$/;
  return idRegex.test(idNumber);
};

/**
 * Valida que una fecha sea válida y no sea futura
 * @param {string|Date} date - Fecha a validar
 * @returns {boolean} - True si es válido
 */
export const isValidDate = (date) => {
  if (!date) return false;
  
  const dateObj = new Date(date);
  const today = new Date();
  
  return dateObj instanceof Date && !isNaN(dateObj) && dateObj <= today;
};

/**
 * Valida un rango de fechas
 * @param {string} startDate - Fecha de inicio
 * @param {string} endDate - Fecha de fin
 * @returns {boolean} - True si es válido
 */
export const isValidDateRange = (startDate, endDate) => {
  if (!startDate || !endDate) return false;
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  return start <= end;
};

/**
 * Valida que un archivo sea una imagen
 * @param {File} file - Archivo a validar
 * @returns {boolean} - True si es válido
 */
export const isValidImageFile = (file) => {
  if (!file) return true; // Opcional
  
  const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  const maxSize = 2 * 1024 * 1024; // 2MB
  
  return validTypes.includes(file.type) && file.size <= maxSize;
};

/**
 * Valida que un archivo sea un Excel válido
 * @param {File} file - Archivo a validar
 * @returns {boolean} - True si es válido
 */
export const isValidExcelFile = (file) => {
  if (!file) return false;
  
  const validTypes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'text/csv'
  ];
  
  const validExtensions = ['.xlsx', '.xls', '.csv'];
  const hasValidExtension = validExtensions.some(ext => 
    file.name.toLowerCase().endsWith(ext)
  );
  
  return hasValidExtension || validTypes.includes(file.type);
};

/**
 * Sanitiza un string para prevenir XSS
 * @param {string} input - String a sanitizar
 * @returns {string} - String sanitizado
 */
export const sanitizeInput = (input) => {
  if (!input) return '';
  
  return input
    .toString()
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

/**
 * Formatea un número como moneda
 * @param {number} amount - Cantidad a formatear
 * @param {string} currency - Código de moneda (default: 'USD')
 * @returns {string} - Cantidad formateada
 */
export const formatCurrency = (amount, currency = 'USD') => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '$0.00';
  }
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

/**
 * Formatea una fecha legible
 * @param {string|Date} date - Fecha a formatear
 * @returns {string} - Fecha formateada
 */
export const formatDate = (date) => {
  if (!date) return '';
  
  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) return '';
  
  return new Intl.DateTimeFormat('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(dateObj);
};

/**
 * Formatea una fecha corta (solo fecha)
 * @param {string|Date} date - Fecha a formatear
 * @returns {string} - Fecha formateada
 */
export const formatShortDate = (date) => {
  if (!date) return '';
  
  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) return '';
  
  return new Intl.DateTimeFormat('es-ES', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(dateObj);
};

/**
 * Calcula el total de una venta
 * @param {Array} items - Items de la venta
 * @returns {number} - Total calculado
 */
export const calculateTotal = (items) => {
  if (!items || !Array.isArray(items)) return 0;
  
  return items.reduce((total, item) => {
    const quantity = item.quantity || 0;
    const price = item.price || 0;
    return total + (quantity * price);
  }, 0);
};

/**
 * Calcula el impuesto de una venta
 * @param {number} amount - Monto base
 * @param {number} taxRate - Tasa de impuesto (porcentaje)
 * @returns {number} - Impuesto calculado
 */
export const calculateTax = (amount, taxRate = 0) => {
  if (!amount || amount <= 0) return 0;
  
  return (amount * taxRate) / 100;
};

/**
 * Valida los datos de un producto
 * @param {Object} product - Producto a validar
 * @returns {Object} - { isValid: boolean, errors: Array }
 */
export const validateProduct = (product) => {
  const errors = [];
  
  if (!product.name || product.name.trim().length < 2) {
    errors.push('El nombre del producto es requerido (mínimo 2 caracteres)');
  }
  
  if (!isValidPrice(product.price)) {
    errors.push('El precio debe ser un número positivo con máximo 2 decimales');
  }
  
  if (product.cost && !isValidPrice(product.cost)) {
    errors.push('El costo debe ser un número positivo con máximo 2 decimales');
  }
  
  if (!isValidStock(product.stock)) {
    errors.push('El stock debe ser un número entero positivo');
  }
  
  if (!isValidStock(product.min_stock)) {
    errors.push('El stock mínimo debe ser un número entero positivo');
  }
  
  if (product.barcode && !isValidBarcode(product.barcode)) {
    errors.push('El código de barras no es válido (debe ser EAN-13)');
  }
  
  if (product.sku && !isValidSKU(product.sku)) {
    errors.push('El SKU solo puede contener letras, números, guiones y guiones bajos');
  }
  
  if (product.category && product.category.length > 100) {
    errors.push('La categoría no puede exceder los 100 caracteres');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Valida los datos de una venta
 * @param {Object} sale - Venta a validar
 * @returns {Object} - { isValid: boolean, errors: Array }
 */
export const validateSale = (sale) => {
  const errors = [];
  
  if (!sale.items || !Array.isArray(sale.items) || sale.items.length === 0) {
    errors.push('La venta debe contener al menos un producto');
  } else {
    sale.items.forEach((item, index) => {
      if (!item.product_id) {
        errors.push(`El item ${index + 1} no tiene producto asociado`);
      }
      if (!item.quantity || item.quantity <= 0) {
        errors.push(`El item ${index + 1} debe tener una cantidad válida`);
      }
      if (!item.price || item.price <= 0) {
        errors.push(`El item ${index + 1} debe tener un precio válido`);
      }
    });
  }
  
  if (!sale.payment_method) {
    errors.push('Debe seleccionar un método de pago');
  }
  
  if (sale.customer_email && !isValidEmail(sale.customer_email)) {
    errors.push('El email del cliente no es válido');
  }
  
  if (sale.customer_phone && !isValidPhone(sale.customer_phone)) {
    errors.push('El teléfono del cliente no es válido');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Valida los datos de login
 * @param {Object} credentials - Credenciales de login
 * @returns {Object} - { isValid: boolean, errors: Array }
 */
export const validateLogin = (credentials) => {
  const errors = [];
  
  if (!credentials.email || !isValidEmail(credentials.email)) {
    errors.push('Debe ingresar un email válido');
  }
  
  if (!credentials.password || !isValidPassword(credentials.password)) {
    errors.push('La contraseña debe tener al menos 6 caracteres');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Genera un código de venta único
 * @returns {string} - Código de venta generado
 */
export const generateSaleCode = () => {
  const timestamp = Date.now().toString();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `V-${timestamp.slice(-6)}-${random}`;
};

/**
 * Genera un código de barras aleatorio (para testing)
 * @returns {string} - Código de barras generado
 */
export const generateRandomBarcode = () => {
  const prefix = '84';
  const company = Math.floor(10000 + Math.random() * 90000).toString();
  const productCode = Math.floor(10000 + Math.random() * 90000).toString();
  let barcode = prefix + company + productCode;
  
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const digit = parseInt(barcode[i]);
    sum += (i % 2 === 0) ? digit : digit * 3;
  }
  const checkDigit = (10 - (sum % 10)) % 10;
  
  return barcode + checkDigit;
};

/**
 * Genera un SKU único
 * @param {string} productName - Nombre del producto
 * @param {string} category - Categoría del producto
 * @returns {string} - SKU generado
 */
export const generateSKU = (productName, category) => {
  const namePrefix = (productName || 'PROD')
    .substring(0, 3)
    .toUpperCase()
    .replace(/\s/g, '')
    .replace(/[^A-Z]/g, 'X');
  
  const categoryCode = (category || 'GEN')
    .substring(0, 3)
    .toUpperCase()
    .replace(/\s/g, '')
    .replace(/[^A-Z]/g, 'X');
  
  const timestamp = Date.now().toString().slice(-4);
  const random = Math.floor(Math.random() * 100).toString().padStart(2, '0');
  
  return `${categoryCode}-${namePrefix}-${timestamp}${random}`;
};

export default {
  isValidEmail,
  isValidPassword,
  isValidName,
  isValidPrice,
  isValidStock,
  isValidBarcode,
  isValidSKU,
  isValidPhone,
  isValidIdNumber,
  isValidDate,
  isValidDateRange,
  isValidImageFile,
  isValidExcelFile,
  sanitizeInput,
  formatCurrency,
  formatDate,
  formatShortDate,
  calculateTotal,
  calculateTax,
  validateProduct,
  validateSale,
  validateLogin,
  generateSaleCode,
  generateRandomBarcode,
  generateSKU
};