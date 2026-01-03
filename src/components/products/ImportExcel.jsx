import React, { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { importProductsFromExcel, downloadExcelTemplate } from '../../services/importService';
import { toast } from 'react-hot-toast';
import { 
  Upload, 
  FileSpreadsheet, 
  CheckCircle, 
  XCircle, 
  Download, 
  AlertCircle,
  X
} from 'lucide-react';

const ImportExcel = ({ onImportComplete, onCancel }) => {
  const { user } = useAuth();
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && isExcelFile(droppedFile)) {
      setFile(droppedFile);
    } else {
      toast.error('Por favor, selecciona un archivo Excel (.xlsx, .xls) o CSV');
    }
  };

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && isExcelFile(selectedFile)) {
      setFile(selectedFile);
    }
  };

  const isExcelFile = (file) => {
    return file.name.endsWith('.xlsx') || 
           file.name.endsWith('.xls') ||
           file.name.endsWith('.csv');
  };

  const handleImport = async () => {
    if (!file) {
      toast.error('Por favor, selecciona un archivo');
      return;
    }

    if (!user) {
      toast.error('Debes estar autenticado para importar productos');
      return;
    }

    setIsImporting(true);
    setImportResult(null);

    try {
      const result = await importProductsFromExcel(file, user.id);
      
      setImportResult(result);
      
      if (result.success > 0) {
        toast.success(`${result.success} productos importados exitosamente`);
        if (onImportComplete) onImportComplete();
      }
      
      if (result.failed > 0) {
        toast.error(`${result.failed} productos no pudieron importarse`);
      }
      
    } catch (error) {
      console.error('Error en importación:', error);
      toast.error('Error al importar productos: ' + error.message);
    } finally {
      setIsImporting(false);
    }
  };

  const handleDownloadTemplate = () => {
    downloadExcelTemplate();
    toast.success('Plantilla descargada. Llena los datos y súbela de nuevo.');
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <FileSpreadsheet className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Importar Productos desde Excel</h3>
              <p className="text-sm text-gray-500">Sube un archivo Excel con tus productos</p>
            </div>
          </div>
          
          {onCancel && (
            <button
              onClick={onCancel}
              className="p-2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Instrucciones */}
        <div className="mb-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="font-medium text-blue-800 mb-2 flex items-center">
            <AlertCircle className="h-4 w-4 mr-2" />
            Instrucciones importantes:
          </h4>
          <ul className="text-sm text-blue-700 space-y-1 list-disc pl-5">
            <li><strong>Columnas mínimas requeridas:</strong> nombre, precio</li>
            <li>Puedes usar nombres de columna en español o inglés</li>
            <li>Los valores deben estar en formato correcto (números para precios)</li>
            <li>Máximo recomendado: 1000 productos por archivo</li>
            <li>Formatos soportados: .xlsx, .xls, .csv</li>
          </ul>
        </div>

        {/* Zona de arrastrar y soltar */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current.click()}
          className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all ${
            isDragging
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept=".xlsx,.xls,.csv"
            className="hidden"
          />
          
          {file ? (
            <div>
              <FileSpreadsheet className="h-12 w-12 text-green-500 mx-auto mb-3" />
              <p className="font-medium text-gray-900 text-lg">{file.name}</p>
              <p className="text-sm text-gray-500">{formatFileSize(file.size)}</p>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setFile(null);
                }}
                className="mt-3 text-sm text-red-600 hover:text-red-800 flex items-center justify-center mx-auto"
              >
                <X className="h-3 w-3 mr-1" />
                Cambiar archivo
              </button>
            </div>
          ) : (
            <div>
              <Upload className={`h-12 w-12 mx-auto mb-4 ${
                isDragging ? 'text-blue-500' : 'text-gray-400'
              }`} />
              <p className="text-gray-700 font-medium">Arrastra y suelta tu archivo Excel aquí</p>
              <p className="text-gray-500 mt-2">o haz clic para seleccionar</p>
              <p className="text-sm text-gray-400 mt-4">
                Formatos: .xlsx, .xls, .csv
              </p>
            </div>
          )}
        </div>

        {/* Botones de acción */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-6 gap-4">
          <div className="space-y-3 sm:space-y-0 sm:space-x-3">
            <button
              onClick={handleDownloadTemplate}
              className="w-full sm:w-auto btn-secondary flex items-center justify-center"
            >
              <Download className="h-4 w-4 mr-2" />
              Descargar Plantilla
            </button>
            
            <button
              onClick={() => fileInputRef.current.click()}
              className="w-full sm:w-auto btn-secondary flex items-center justify-center"
            >
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Seleccionar Archivo
            </button>
          </div>
          
          <button
            onClick={handleImport}
            disabled={!file || isImporting}
            className={`btn-primary flex items-center justify-center ${
              (!file || isImporting) ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isImporting ? (
              <>
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Importando...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Importar Productos
              </>
            )}
          </button>
        </div>
      </div>

      {/* Resultados */}
      {importResult && (
        <div className="card">
          <h4 className="text-lg font-semibold text-gray-900 mb-6">Resultados de la Importación</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-green-50 p-6 rounded-xl border border-green-200">
              <div className="flex items-center mb-3">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                <span className="font-medium text-green-800">Exitosos</span>
              </div>
              <p className="text-3xl font-bold text-green-600">
                {importResult.success}
              </p>
              <p className="text-sm text-green-700 mt-2">
                Productos importados correctamente
              </p>
            </div>
            
            <div className="bg-red-50 p-6 rounded-xl border border-red-200">
              <div className="flex items-center mb-3">
                <XCircle className="h-5 w-5 text-red-500 mr-2" />
                <span className="font-medium text-red-800">Fallidos</span>
              </div>
              <p className="text-3xl font-bold text-red-600">
                {importResult.failed}
              </p>
              <p className="text-sm text-red-700 mt-2">
                Productos con errores
              </p>
            </div>
            
            <div className="bg-blue-50 p-6 rounded-xl border border-blue-200">
              <div className="flex items-center mb-3">
                <FileSpreadsheet className="h-5 w-5 text-blue-500 mr-2" />
                <span className="font-medium text-blue-800">Total</span>
              </div>
              <p className="text-3xl font-bold text-blue-600">
                {importResult.total}
              </p>
              <p className="text-sm text-blue-700 mt-2">
                Registros en el archivo
              </p>
            </div>
          </div>

          {/* Errores detallados */}
          {importResult.errors && importResult.errors.length > 0 && (
            <div>
              <h5 className="font-medium text-gray-700 mb-4 flex items-center">
                <AlertCircle className="h-5 w-5 text-yellow-500 mr-2" />
                Errores encontrados (Fila - Error)
              </h5>
              <div className="bg-yellow-50 rounded-lg p-4 max-h-60 overflow-y-auto border border-yellow-200">
                <div className="space-y-2">
                  {importResult.errors.map((error, index) => (
                    <div key={index} className="flex items-start border-b border-yellow-100 pb-2 last:border-0">
                      <span className="font-mono bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-sm mr-3">
                        Fila {error.row}
                      </span>
                      <span className="text-red-600 text-sm flex-1">{error.error}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ImportExcel;