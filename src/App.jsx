import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { Upload, AlertCircle, CheckCircle, Plane } from 'lucide-react';
import TrimSheetDashboard from './components/TrimSheetDashboard';
import { parseExcelData } from './utils/excelParser';
import './App.css';

function App() {
  const [loadData, setLoadData] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('idle'); // idle, processing, success, error
  const [errorMessage, setErrorMessage] = useState('');

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadStatus('processing');
    setErrorMessage('');

    try {
      // Read Excel file
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });

      // Validate required sheets
      const requiredSheets = ['ULD LOAD INPUT', 'ULD MASTER TABLE', 'CARGO HOLD VISUAL LAYOUT', 
                              'ARM & MOMENT COMPUTATION', 'CG & BALANCE DECISION ENGINE'];
      
      const missingSheets = requiredSheets.filter(
        sheet => !workbook.SheetNames.includes(sheet)
      );

      if (missingSheets.length > 0) {
        throw new Error(`Missing required sheets: ${missingSheets.join(', ')}`);
      }

      // Parse data from Excel
      const parsedData = parseExcelData(workbook);
      
      setLoadData(parsedData);
      setUploadStatus('success');
      
      // Auto-scroll to dashboard
      setTimeout(() => {
        document.getElementById('dashboard')?.scrollIntoView({ behavior: 'smooth' });
      }, 500);

    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus('error');
      setErrorMessage(error.message || 'Failed to process Excel file');
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith('.xlsx')) {
      const event = { target: { files: [file] } };
      handleFileUpload(event);
    } else {
      setUploadStatus('error');
      setErrorMessage('Please upload a valid .xlsx file');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Header */}
      <header className="bg-slate-900/50 backdrop-blur-md border-b border-blue-500/20">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Plane className="w-8 h-8 text-blue-400" />
              <div>
                <h1 className="text-2xl font-bold text-white">Aircraft Load Planning System</h1>
                <p className="text-sm text-blue-300">AI-Powered Weight & Balance Operations</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 text-sm text-blue-300">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span>System Online</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-12">
        {/* Upload Section */}
        <div className="max-w-4xl mx-auto mb-12">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white mb-2">Load Planning Dashboard</h2>
            <p className="text-blue-200">Upload your AI-generated load planning Excel file to begin analysis</p>
          </div>

          {/* Upload Zone */}
          <div
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className={`
              relative border-2 border-dashed rounded-xl p-12 transition-all duration-300
              ${uploadStatus === 'processing' ? 'border-yellow-400 bg-yellow-400/5' : ''}
              ${uploadStatus === 'success' ? 'border-green-400 bg-green-400/5' : ''}
              ${uploadStatus === 'error' ? 'border-red-400 bg-red-400/5' : ''}
              ${uploadStatus === 'idle' ? 'border-blue-400/50 bg-blue-500/5 hover:border-blue-400 hover:bg-blue-500/10' : ''}
            `}
          >
            <input
              type="file"
              accept=".xlsx"
              onChange={handleFileUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              id="file-upload"
            />
            
            <div className="text-center">
              {uploadStatus === 'idle' && (
                <>
                  <Upload className="w-16 h-16 mx-auto mb-4 text-blue-400" />
                  <p className="text-xl font-semibold text-white mb-2">
                    Drop Excel file here or click to upload
                  </p>
                  <p className="text-sm text-blue-300">
                    Supported format: .xlsx (AI Load Planning Workbook)
                  </p>
                </>
              )}

              {uploadStatus === 'processing' && (
                <>
                  <div className="w-16 h-16 mx-auto mb-4 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
                  <p className="text-xl font-semibold text-yellow-300 mb-2">
                    Processing Excel file...
                  </p>
                  <p className="text-sm text-yellow-200">
                    Parsing data and running AI analysis
                  </p>
                </>
              )}

              {uploadStatus === 'success' && (
                <>
                  <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-400" />
                  <p className="text-xl font-semibold text-green-300 mb-2">
                    File loaded successfully!
                  </p>
                  <p className="text-sm text-green-200">
                    Aircraft load data processed. Scroll down to view Trim Sheet.
                  </p>
                </>
              )}

              {uploadStatus === 'error' && (
                <>
                  <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-400" />
                  <p className="text-xl font-semibold text-red-300 mb-2">
                    Upload failed
                  </p>
                  <p className="text-sm text-red-200 mb-4">
                    {errorMessage}
                  </p>
                  <button
                    onClick={() => setUploadStatus('idle')}
                    className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                  >
                    Try Again
                  </button>
                </>
              )}
            </div>
          </div>

          {/* File Requirements */}
          <div className="mt-6 p-4 bg-blue-500/10 border border-blue-400/30 rounded-lg">
            <h3 className="text-sm font-semibold text-blue-300 mb-2">Required Excel Sheets:</h3>
            <div className="grid grid-cols-2 gap-2 text-xs text-blue-200">
              <div>✓ ULD LOAD INPUT</div>
              <div>✓ ULD MASTER TABLE</div>
              <div>✓ CARGO HOLD VISUAL LAYOUT</div>
              <div>✓ ARM & MOMENT COMPUTATION</div>
              <div>✓ CG & BALANCE DECISION ENGINE</div>
            </div>
          </div>
        </div>

        {/* Dashboard Section */}
        {loadData && (
          <div id="dashboard" className="animate-fade-in">
            <TrimSheetDashboard data={loadData} />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900/50 border-t border-blue-500/20 mt-20">
        <div className="container mx-auto px-6 py-6 text-center text-sm text-blue-300">
          <p>AI-Powered Aircraft Load Planning System v1.0 | Rule-Based Expert System</p>
          <p className="mt-1 text-xs text-blue-400">
            For demonstration and educational purposes. Not certified for actual flight operations.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
