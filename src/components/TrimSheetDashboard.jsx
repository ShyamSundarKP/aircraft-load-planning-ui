import React, { useRef } from 'react';
import { Download, Printer, CheckCircle, XCircle } from 'lucide-react';
import CargoVisualMap from './CargoVisualMap';
//import LoadSummaryPanel from './LoadSummaryPanel';
import CGEnvelopeChart from './CGEnvelopeChart';
import SafetyStatusPanel from './SafetyStatusPanel';
import { calculateSummaryStats } from '../utils/excelParser';
import { exportToPDF } from '../utils/pdfExport';

function TrimSheetDashboard({ data }) {
  const dashboardRef = useRef(null);
  const summaryStats = calculateSummaryStats(data);

  const handleExportPDF = () => {
    exportToPDF(dashboardRef.current, 'Aircraft_Load_Trim_Sheet.pdf');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Action Buttons */}
      <div className="flex justify-end space-x-4 print:hidden">
        <button
          onClick={handlePrint}
          className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-lg"
        >
          <Printer className="w-5 h-5" />
          <span>Print</span>
        </button>
        <button
          onClick={handleExportPDF}
          className="flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-lg"
        >
          <Download className="w-5 h-5" />
          <span>Export PDF</span>
        </button>
      </div>

      {/* Main Dashboard */}
      <div ref={dashboardRef} className="bg-white rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 to-blue-700 text-white p-8">
          <div className="text-center mb-6">
            <h1 className="text-4xl font-bold mb-2">AIRCRAFT LOAD & TRIM SHEET</h1>
            <p className="text-blue-200 text-lg">AI-Generated Flight Documentation</p>
          </div>

          {/* Flight Information Grid */}
          <div className="grid grid-cols-2 gap-8 mt-8">
            {/* Left Panel */}
            <div className="space-y-3">
              <div className="bg-blue-800/30 rounded-lg p-4 border border-blue-400/30">
                <h3 className="text-sm font-semibold text-blue-200 mb-3 uppercase tracking-wide">
                  Flight Information
                </h3>
                <div className="space-y-2 text-sm">
                  <InfoRow label="Aircraft Type" value={data.flightInfo.aircraftType} />
                  <InfoRow label="Flight Number" value={data.flightInfo.flightNumber} />
                  <InfoRow label="Route" value={data.flightInfo.route} />
                  <InfoRow label="Date" value={data.flightInfo.date} />
                </div>
              </div>
            </div>

            {/* Right Panel */}
            <div className="space-y-3">
              <div className="bg-blue-800/30 rounded-lg p-4 border border-blue-400/30">
                <h3 className="text-sm font-semibold text-blue-200 mb-3 uppercase tracking-wide">
                  System Information
                </h3>
                <div className="space-y-2 text-sm">
                  <InfoRow label="Load Controller" value={data.flightInfo.loadController} />
                  <InfoRow label="Status" value={data.flightInfo.status} highlight />
                  <InfoRow label="Version" value="v1.0" />
                  <InfoRow label="Time" value={data.flightInfo.time} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="p-8 bg-gradient-to-br from-gray-50 to-gray-100">
          {/* Safety Status - Prominent Display */}
          <SafetyStatusPanel 
            cgAnalysis={data.cgAnalysis} 
            overloadCount={summaryStats.overloadCount}
          />

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
            {/* Left Column */}
            <div className="space-y-8">
              {/* Cargo Visual Map */}
              <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                  <span className="text-2xl mr-2">🛫</span>
                  Aircraft Cargo Hold - Visual Load Distribution
                </h2>
                <CargoVisualMap 
                  positions={data.cargoPositions}
                  visualStatus={data.visualStatus}
                  uldSpecs={data.uldSpecs}
                />
              </div>

              {/* Load Summary */}
              <LoadSummaryPanel 
                totalWeight={data.cgAnalysis.totalWeight}
                summaryStats={summaryStats}
                positions={data.cargoPositions}
                uldSpecs={data.uldSpecs}
              />
            </div>

            {/* Right Column */}
            <div className="space-y-8">
              {/* CG Envelope */}
              <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
                <h2 className="text-xl font-bold text-gray-800 mb-4">
                  Center of Gravity Analysis
                </h2>
                <CGEnvelopeChart cgAnalysis={data.cgAnalysis} />
              </div>

              {/* Detailed Status Checks */}
              <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
                <h2 className="text-xl font-bold text-gray-800 mb-4">
                  Detailed Status Checks
                </h2>
                <DetailedChecks 
                  overloadCount={summaryStats.overloadCount}
                  cgStatus={data.cgAnalysis.cgStatus}
                  totalULDs={summaryStats.totalULDs}
                />
              </div>

              {/* ULD Statistics */}
              <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
                <h2 className="text-xl font-bold text-gray-800 mb-4">
                  ULD Statistics
                </h2>
                <ULDStatistics positions={data.cargoPositions} />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gradient-to-r from-gray-800 to-gray-900 text-white p-6">
          <div className="grid grid-cols-2 gap-8 mb-4">
            <div>
              <p className="text-sm text-gray-400 mb-1">Prepared By:</p>
              <p className="font-semibold">AI Load Planning System v1.0</p>
            </div>
            <div>
              <p className="text-sm text-gray-400 mb-1">Generated:</p>
              <p className="font-semibold">{new Date(data.timestamp).toLocaleString()}</p>
            </div>
          </div>
          <div className="border-t border-gray-700 pt-4">
            <p className="text-xs text-gray-400 text-center">
              This document is auto-generated by AI-powered rule-based load planning system. 
              All calculations are based on aircraft manufacturer specifications and regulatory requirements.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper Components
function InfoRow({ label, value, highlight }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-blue-200 font-medium">{label}:</span>
      <span className={`font-bold ${highlight ? 'text-yellow-300' : 'text-white'}`}>
        {value}
      </span>
    </div>
  );
}

function DetailedChecks({ overloadCount, cgStatus, totalULDs }) {
  const weightStatus = overloadCount > 0 
    ? { icon: XCircle, text: '❌ OVERLOAD DETECTED', color: 'text-red-600 bg-red-50' }
    : { icon: CheckCircle, text: '✅ ALL WEIGHTS WITHIN LIMITS', color: 'text-green-600 bg-green-50' };

  const cgCheck = cgStatus.includes('✓') || cgStatus.includes('SAFE')
    ? { icon: CheckCircle, text: cgStatus, color: 'text-green-600 bg-green-50' }
    : { icon: XCircle, text: cgStatus, color: 'text-red-600 bg-red-50' };

  const uldCheck = totalULDs === 12
    ? { icon: CheckCircle, text: '✅ ALL POSITIONS LOADED', color: 'text-green-600 bg-green-50' }
    : { icon: CheckCircle, text: `⚠️ ${totalULDs} POSITIONS LOADED`, color: 'text-yellow-600 bg-yellow-50' };

  return (
    <div className="space-y-3">
      <CheckItem check={weightStatus} label="Weight Distribution" />
      <CheckItem check={cgCheck} label="CG Position" />
      <CheckItem check={uldCheck} label="ULD Compliance" />
    </div>
  );
}

function CheckItem({ check, label }) {
  const Icon = check.icon;
  return (
    <div className={`flex items-center justify-between p-3 rounded-lg ${check.color}`}>
      <span className="font-semibold text-sm">{label}:</span>
      <div className="flex items-center space-x-2">
        <Icon className="w-5 h-5" />
        <span className="font-bold text-sm">{check.text}</span>
      </div>
    </div>
  );
}

function ULDStatistics({ positions }) {
  const counts = positions.reduce((acc, pos) => {
    acc[pos.uldType] = (acc[pos.uldType] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-2">
      <StatRow label="Total ULDs Loaded" value={positions.length} />
      {Object.entries(counts).map(([type, count]) => (
        <StatRow key={type} label={`${type} Units`} value={count} />
      ))}
    </div>
  );
}

function StatRow({ label, value }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-gray-200 last:border-0">
      <span className="text-gray-700 font-medium">{label}:</span>
      <span className="text-gray-900 font-bold text-lg">{value}</span>
    </div>
  );
}

export default TrimSheetDashboard;
