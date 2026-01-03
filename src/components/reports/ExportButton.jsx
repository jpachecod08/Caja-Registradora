import React, { useState } from 'react';
import { exportSalesToExcel, exportProductsToExcel } from '../../services/exportService';
import { toast } from 'react-hot-toast';
import {
  Download,
  FileSpreadsheet,
  FileText,
  BarChart,
  Package,
  Calendar,
  ChevronDown,
  Loader2
} from 'lucide-react';

const ExportButton = ({ 
  type = 'sales', 
  dateRange,
  customData,
  filename,
  children
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [showOptions, setShowOptions] = useState(false);

  const handleExport = async (format = 'excel', dataType = type) => {
    try {
      setIsExporting(true);
      
      if (dataType === 'sales') {
        await exportSalesToExcel(dateRange?.startDate, dateRange?.endDate);
        toast.success('Ventas exportadas exitosamente');
        console.log('VENTAS:', salesData);

      } else if (dataType === 'products') {
        await exportProductsToExcel();
        toast.success('Productos exportados exitosamente');
      } else if (dataType === 'custom' && customData) {
        exportCustomData(customData, filename, format);
      }
      
    } catch (error) {
      console.error('Error exporting:', error);
      toast.error('Error al exportar datos');
    } finally {
      setIsExporting(false);
      setShowOptions(false);
    }
  };

  const exportCustomData = (data, filename, format) => {
    if (format === 'excel') {
      const XLSX = require('xlsx');
      const { saveAs } = require('file-saver');
      
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Datos');
      
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([wbout], { type: 'application/octet-stream' });
      
      saveAs(blob, `${filename || 'export'}_${new Date().toISOString().split('T')[0]}.xlsx`);
    } else if (format === 'csv') {
      const csvContent = [
        Object.keys(data[0] || {}),
        ...data.map(row => Object.values(row))
      ].map(row => row.join(',')).join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `${filename || 'export'}_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (format === 'pdf') {
      toast.info('Exportación a PDF en desarrollo');
    }
  };

  const getButtonIcon = () => {
    switch (type) {
      case 'sales':
        return <BarChart className="h-4 w-4 mr-2" />;
      case 'products':
        return <Package className="h-4 w-4 mr-2" />;
      default:
        return <FileText className="h-4 w-4 mr-2" />;
    }
  };

  const getButtonText = () => {
    if (children) return children;
    
    switch (type) {
      case 'sales':
        return 'Exportar Ventas';
      case 'products':
        return 'Exportar Productos';
      default:
        return 'Exportar Datos';
    }
  };

  const exportOptions = [
    {
      label: 'Exportar a Excel',
      icon: FileSpreadsheet,
      format: 'excel',
      description: 'Formato .xlsx (recomendado)'
    },
    {
      label: 'Exportar a CSV',
      icon: FileText,
      format: 'csv',
      description: 'Formato .csv (texto plano)'
    }
  ];

  const dataTypeOptions = type === 'combined' ? [
    {
      label: 'Ventas',
      icon: BarChart,
      type: 'sales',
      description: 'Historial de ventas e items'
    },
    {
      label: 'Productos',
      icon: Package,
      type: 'products',
      description: 'Catálogo completo de productos'
    }
  ] : [];

  return (
    <div className="relative">
      {type === 'combined' || showOptions ? (
        <button
          onClick={() => setShowOptions(!showOptions)}
          disabled={isExporting}
          className={`btn-primary flex items-center ${isExporting ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isExporting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Exportando...
            </>
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              {getButtonText()}
              <ChevronDown className="h-4 w-4 ml-2" />
            </>
          )}
        </button>
      ) : (
        <button
          onClick={() => handleExport('excel')}
          disabled={isExporting}
          className={`btn-primary flex items-center ${isExporting ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isExporting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Exportando...
            </>
          ) : (
            <>
              {getButtonIcon()}
              {getButtonText()}
            </>
          )}
        </button>
      )}

      {/* Menú desplegable de opciones */}
      {(showOptions || type === 'combined') && !isExporting && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
          <div className="p-2">
            {/* Opciones de tipo de datos (solo para combined) */}
            {dataTypeOptions.length > 0 && (
              <div className="mb-2 pb-2 border-b border-gray-200">
                <p className="text-xs font-medium text-gray-500 px-3 py-1">Exportar:</p>
                {dataTypeOptions.map((option) => {
                  const Icon = option.icon;
                  return (
                    <button
                      key={option.type}
                      onClick={() => handleExport('excel', option.type)}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded flex items-center justify-between"
                    >
                      <div className="flex items-center">
                        <Icon className="h-4 w-4 mr-2 text-gray-500" />
                        <span>{option.label}</span>
                      </div>
                      <span className="text-xs text-gray-400">{option.description}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Opciones de formato */}
            <div>
              <p className="text-xs font-medium text-gray-500 px-3 py-1">Formato:</p>
              {exportOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.format}
                    onClick={() => handleExport(option.format, type)}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded flex items-center justify-between"
                  >
                    <div className="flex items-center">
                      <Icon className="h-4 w-4 mr-2 text-gray-500" />
                      <span>{option.label}</span>
                    </div>
                    <span className="text-xs text-gray-400">{option.description}</span>
                  </button>
                );
              })}
            </div>

            {/* Información adicional */}
            <div className="mt-2 pt-2 border-t border-gray-200">
              <div className="px-3 py-1">
                <div className="flex items-center text-xs text-gray-500">
                  <Calendar className="h-3 w-3 mr-1" />
                  <span>
                    {dateRange?.startDate && dateRange?.endDate
                      ? `${dateRange.startDate} - ${dateRange.endDate}`
                      : 'Todos los datos'
                    }
                  </span>
                </div>
                {type === 'sales' && (
                  <p className="text-xs text-gray-400 mt-1">
                    Incluye ventas e items detallados
                  </p>
                )}
                {type === 'products' && (
                  <p className="text-xs text-gray-400 mt-1">
                    Incluye precios, stock y categorías
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExportButton;