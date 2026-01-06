// En tu archivo de Netlify Function (/netlify/functions/google-sheets.js)
const fetch = require('node-fetch');

exports.handler = async function(event, context) {
  // Configuración CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Método no permitido' })
    };
  }

  try {
    const body = JSON.parse(event.body);
    
    // URL de tu Google Apps Script
    const scriptUrl = "https://script.google.com/macros/s/AKfycbw5tkztcys8csgarVe8uuu6vicQQJM4y5W4mloL-jOdXDX2eRJd5NzKtHtjC99f7KZf9A/exec"; // <-- REEMPLAZA CON TU URL
    
    console.log('📤 Enviando a Google Apps Script:', body);
    
    // Enviar datos al Google Apps Script
    const response = await fetch(scriptUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body)
    });
    
    const result = await response.json();
    
    console.log('📥 Respuesta de Google Apps Script:', result);
    
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: true,
        message: 'Datos enviados a Google Sheets',
        googleSheetsResponse: result
      })
    };

  } catch (error) {
    console.error('❌ Error en Netlify Function:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: false,
        error: error.message,
        details: error.toString()
      })
    };
  }
};