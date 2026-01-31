import React from 'react';
import { TrendingUp } from 'lucide-react';

function CGEnvelopeChart({ cgAnalysis }) {
  const { computedCG, forwardLimit, aftLimit, cgStatus, isSafe } = cgAnalysis;

  // Calculate positions for visualization (as percentages)
  const totalRange = aftLimit - forwardLimit;
  const forwardPos = 0;
  const aftPos = 100;
  const cgPos = ((computedCG - forwardLimit) / totalRange) * 100;
  
  // Ensure CG position is visible even if out of bounds
  const displayCgPos = Math.max(0, Math.min(100, cgPos));

  return (
    <div className="space-y-6">
      {/* CG Values Grid */}
      <div className="grid grid-cols-3 gap-4">
        <ValueBox
          label="Computed CG"
          value={`${computedCG.toFixed(2)} m`}
          highlight
          status={isSafe ? 'safe' : 'danger'}
        />
        <ValueBox
          label="Forward Limit"
          value={`${forwardLimit.toFixed(2)} m`}
        />
        <ValueBox
          label="Aft Limit"
          value={`${aftLimit.toFixed(2)} m`}
        />
      </div>

      {/* CG Envelope Visualization */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-6 border border-gray-300">
        <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center">
          <TrendingUp className="w-4 h-4 mr-2" />
          CG ENVELOPE VISUALIZATION
        </h3>

        {/* Envelope Bar */}
        <div className="relative h-24 mb-8">
          {/* Safe Zone Background */}
          <div className="absolute inset-0 flex">
            {/* Out of bounds - Left */}
            <div className="h-full bg-red-200 opacity-50" style={{ width: '0%' }} />
            
            {/* Safe Zone */}
            <div className="h-full bg-green-200 border-l-4 border-r-4 border-green-500" style={{ width: '100%' }}>
              <div className="h-full flex items-center justify-center">
                <span className="text-xs font-bold text-green-700 opacity-75">SAFE ENVELOPE</span>
              </div>
            </div>
            
            {/* Out of bounds - Right */}
            <div className="h-full bg-red-200 opacity-50" style={{ width: '0%' }} />
          </div>

          {/* CG Marker */}
          <div 
            className="absolute top-0 bottom-0 flex flex-col items-center justify-center transition-all duration-500"
            style={{ left: `${displayCgPos}%`, transform: 'translateX(-50%)' }}
          >
            {/* Marker Line */}
            <div className={`w-1 h-full ${isSafe ? 'bg-blue-600' : 'bg-red-600'}`} />
            
            {/* Marker Arrow */}
            <div className={`
              absolute top-0 -translate-y-full
              w-0 h-0 border-l-8 border-r-8 border-t-8
              ${isSafe ? 'border-blue-600' : 'border-red-600'}
              border-l-transparent border-r-transparent
            `} />
            
            {/* CG Value Label */}
            <div className={`
              absolute top-0 -translate-y-full -mt-10
              px-3 py-1 rounded shadow-lg font-bold text-sm whitespace-nowrap
              ${isSafe ? 'bg-blue-600 text-white' : 'bg-red-600 text-white'}
            `}>
              CG: {computedCG.toFixed(2)}m
            </div>
          </div>
        </div>

        {/* Scale */}
        <div className="relative flex justify-between text-xs font-semibold text-gray-600 border-t-2 border-gray-300 pt-2">
          <div className="flex flex-col items-start">
            <span className="text-red-600">◀ FORWARD</span>
            <span>{forwardLimit.toFixed(1)}m</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-green-600">● CENTER</span>
            <span>{((forwardLimit + aftLimit) / 2).toFixed(1)}m</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-red-600">AFT ▶</span>
            <span>{aftLimit.toFixed(1)}m</span>
          </div>
        </div>
      </div>

      {/* CG Status */}
      <div className={`
        p-4 rounded-lg border-2 font-bold text-center
        ${isSafe 
          ? 'bg-green-50 border-green-400 text-green-700' 
          : 'bg-red-50 border-red-400 text-red-700'
        }
      `}>
        {cgStatus}
      </div>

      {/* Technical Data */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-bold text-blue-900 mb-3">Technical Data</h4>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <TechDataRow 
            label="Total Weight" 
            value={`${cgAnalysis.totalWeight.toLocaleString()} kg`} 
          />
          <TechDataRow 
            label="Total Moment" 
            value={`${cgAnalysis.totalMoment.toLocaleString()} kg·m`} 
          />
          <TechDataRow 
            label="CG Formula" 
            value="Moment ÷ Weight" 
          />
          <TechDataRow 
            label="CG Result" 
            value={`${computedCG.toFixed(2)} m`} 
          />
        </div>
      </div>

      {/* Warning Messages */}
      {!isSafe && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-semibold text-red-800">
                ⚠️ CRITICAL: Aircraft CG is outside safe operating envelope
              </p>
              <p className="text-xs text-red-700 mt-1">
                Flight operations not permitted until load is redistributed
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ValueBox({ label, value, highlight, status }) {
  return (
    <div className={`
      p-4 rounded-lg border-2 text-center
      ${highlight 
        ? status === 'safe'
          ? 'bg-green-50 border-green-400'
          : 'bg-red-50 border-red-400'
        : 'bg-gray-50 border-gray-300'
      }
    `}>
      <p className="text-xs text-gray-600 font-semibold mb-1">{label}</p>
      <p className={`
        text-xl font-bold
        ${highlight 
          ? status === 'safe' ? 'text-green-700' : 'text-red-700'
          : 'text-gray-800'
        }
      `}>
        {value}
      </p>
    </div>
  );
}

function TechDataRow({ label, value }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-blue-700 font-medium">{label}:</span>
      <span className="text-blue-900 font-bold">{value}</span>
    </div>
  );
}

export default CGEnvelopeChart;
