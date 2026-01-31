import React from 'react';
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

export function SafetyStatusPanel({ cgAnalysis, overloadCount }) {
  const isSafe = cgAnalysis.isSafe && overloadCount === 0;
  const status = cgAnalysis.overallSafetyStatus;

  return (
    <div className={`
      rounded-xl p-8 mb-8 border-4 shadow-2xl
      ${isSafe 
        ? 'bg-gradient-to-r from-green-50 to-green-100 border-green-500' 
        : 'bg-gradient-to-r from-red-50 to-red-100 border-red-500'
      }
    `}>
      <div className="text-center">
        <div className="flex items-center justify-center mb-4">
          {isSafe ? (
            <CheckCircle className="w-16 h-16 text-green-600" />
          ) : (
            <XCircle className="w-16 h-16 text-red-600" />
          )}
        </div>
        
        <h2 className="text-3xl font-bold mb-2 text-gray-800">
          FLIGHT SAFETY STATUS
        </h2>
        
        <div className={`
          inline-block px-8 py-4 rounded-lg text-2xl font-bold mt-4
          ${isSafe 
            ? 'bg-green-600 text-white' 
            : 'bg-red-600 text-white'
          }
        `}>
          {status}
        </div>

        {!isSafe && (
          <div className="mt-6 flex items-center justify-center space-x-2 text-red-700">
            <AlertTriangle className="w-5 h-5" />
            <span className="font-semibold">
              Aircraft not cleared for departure - Load adjustment required
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export function LoadSummaryPanel({ totalWeight, summaryStats, positions, uldSpecs }) {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
      <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
        <span className="text-2xl mr-2">⚖️</span>
        Load Summary
      </h2>
      
      <div className="space-y-4">
        {/* Total Weight - Prominent */}
        <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4">
          <p className="text-sm text-blue-700 font-semibold mb-1">Total Cargo Weight</p>
          <p className="text-3xl font-bold text-blue-900">
            {totalWeight.toLocaleString()} kg
          </p>
        </div>

        {/* Deck Distribution */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 border border-gray-300 rounded-lg p-3">
            <p className="text-xs text-gray-600 font-semibold mb-1">Main Deck</p>
            <p className="text-xl font-bold text-gray-800">
              {summaryStats.mainDeckWeight.toLocaleString()} kg
            </p>
          </div>
          <div className="bg-gray-50 border border-gray-300 rounded-lg p-3">
            <p className="text-xs text-gray-600 font-semibold mb-1">Lower Deck</p>
            <p className="text-xl font-bold text-gray-800">
              {summaryStats.lowerDeckWeight.toLocaleString()} kg
            </p>
          </div>
        </div>

        {/* ULD Count */}
        <SummaryRow 
          label="Total ULD Count" 
          value={summaryStats.totalULDs} 
        />

        {/* Overload Alerts */}
        <div className={`
          p-3 rounded-lg border-2 flex items-center justify-between
          ${summaryStats.overloadCount > 0 
            ? 'bg-red-50 border-red-400' 
            : 'bg-green-50 border-green-400'
          }
        `}>
          <span className="font-semibold text-sm text-gray-700">Overload Alerts:</span>
          <span className={`
            text-2xl font-bold
            ${summaryStats.overloadCount > 0 ? 'text-red-600' : 'text-green-600'}
          `}>
            {summaryStats.overloadCount}
          </span>
        </div>

        {/* Weight Distribution Chart */}
        <div className="pt-4 border-t border-gray-200">
          <p className="text-xs font-semibold text-gray-600 mb-2">Weight Distribution</p>
          <div className="space-y-2">
            <DistributionBar 
              label="Main Deck"
              value={summaryStats.mainDeckWeight}
              total={totalWeight}
              color="bg-blue-500"
            />
            <DistributionBar 
              label="Lower Deck"
              value={summaryStats.lowerDeckWeight}
              total={totalWeight}
              color="bg-purple-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-gray-200">
      <span className="text-gray-700 font-medium">{label}:</span>
      <span className="text-gray-900 font-bold text-lg">{value}</span>
    </div>
  );
}

function DistributionBar({ label, value, total, color }) {
  const percentage = total > 0 ? (value / total) * 100 : 0;
  
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-600 font-medium">{label}</span>
        <span className="text-gray-700 font-semibold">
          {value.toLocaleString()} kg ({percentage.toFixed(1)}%)
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-3">
        <div 
          className={`h-full rounded-full ${color} transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

export default SafetyStatusPanel;
