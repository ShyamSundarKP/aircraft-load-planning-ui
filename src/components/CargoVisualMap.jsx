import React, { useState } from 'react';
import { Info } from 'lucide-react';
import { buildCargoGridLayout } from "../utils/excelParser";

/**
 * ENHANCED Multi-Aircraft Cargo Visual Map
 * Adapts layout dynamically for A320, B737, B777
 */
function CargoVisualMapMultiAircraft({ positions, visualStatus, uldSpecs, aircraftParams, aircraftType }) {
  const [hoveredPosition, setHoveredPosition] = useState(null);
// 
  const getLayoutConfig = () => {
    switch (aircraftType) {
      case "B737":
        return { rows: 2, cols: 2 };

      case "B777":
        return { rows: 6, cols: 2 };

      default:
        return { rows: 6, cols: 2 }; // A320
    }
  };


const layout = getLayoutConfig();


  const filteredPositions = positions.filter(pos => {

    if (aircraftType === "A320") {
      return /^[A-F][1-2]$/.test(pos.position);
    }

    if (aircraftType === "B737") {
      return ["FWD1","FWD2","AFT1","AFT2"].includes(pos.position);
    }

    if (aircraftType === "B777") {
      return /^([ML])[1-6]$/.test(pos.position);
    }

    return true;
  });



  // DYNAMIC: Build grid based on aircraft type and actual positions
  const gridLayout = buildCargoGridLayout(positions, aircraftParams);
  
  // Aircraft-specific styling
  const aircraftInfo = getAircraftInfo(aircraftParams.type);

  return (
    <div className="relative">
      {/* Aircraft Type Badge */}
      <div className="flex justify-center mb-2">
        <div className={`px-4 py-1 rounded-full text-sm font-bold ${aircraftInfo.badgeColor}`}>
          {aircraftParams.type} - {positions.length} Cargo Positions
        </div>
      </div>

      {/* Aircraft Nose */}
      <div className="flex justify-center mb-4">
        <div className="bg-gray-300 text-gray-700 font-bold py-2 px-8 rounded-t-full border-2 border-gray-400">
          ▲ NOSE
        </div>
      </div>

      {/* DYNAMIC CARGO GRID */}
      <div className="space-y-3">
        {gridLayout.map((row, rowIndex) => {
          // Handle deck separator for B777
          if (row === 'DECK_SEPARATOR') {
            return (
              <div key={`separator-${rowIndex}`} className="flex justify-center py-2">
                <div className="w-full border-t-2 border-dashed border-gray-400 relative">
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white px-4 py-1">
                    <span className="text-xs font-bold text-gray-600">
                      ━━━ MAIN DECK / LOWER DECK ━━━
                    </span>
                  </div>
                </div>
              </div>
            );
          }

          return (
            <div 
              key={rowIndex} 
              className="grid gap-4"
              style={{ 
                gridTemplateColumns: `repeat(${layout.cols}, 1fr)`,
                maxWidth: aircraftParams.type === 'B737' ? '600px' : '100%',
                margin: aircraftParams.type === 'B737' ? '0 auto' : '0'
              }}
            >
              {row.map(positionId => {
                const cargo = positions.find(p => p.position === positionId);
                const status = visualStatus[positionId];
                const spec = cargo ? uldSpecs[cargo.uldType] : null;

                return (
                  <CargoCell
                    key={positionId}
                    positionId={positionId}
                    cargo={cargo}
                    status={status}
                    spec={spec}
                    aircraftType={aircraftParams.type}
                    onHover={setHoveredPosition}
                    isHovered={hoveredPosition === positionId}
                  />
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Aircraft Tail */}
      <div className="flex justify-center mt-4">
        <div className="bg-gray-300 text-gray-700 font-bold py-2 px-8 rounded-b-full border-2 border-gray-400">
          ▼ TAIL
        </div>
      </div>

      {/* Legend */}
      <div className="mt-6 flex justify-center space-x-4 text-sm">
        <LegendItem color="bg-green-100 border-green-400" label="Safe" />
        <LegendItem color="bg-yellow-100 border-yellow-400" label="Near Limit" />
        <LegendItem color="bg-red-100 border-red-400" label="Overload" />
      </div>
    </div>
  );
}

function CargoCell({ positionId, cargo, status, spec, aircraftType, onHover, isHovered }) {
  if (!cargo || !cargo.position) {
    return (
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 bg-gray-50 text-center">
        <p className="text-gray-400 font-semibold text-sm">EMPTY</p>
      </div>
    );
  }

  // Determine color based on status
  const getStatusColor = () => {
    if (!status) return 'bg-gray-100 border-gray-300';
    
    switch (status.status) {
      case 'OVERLOAD':
        return 'bg-red-100 border-red-400 shadow-red-200';
      case 'NEAR LIMIT':
        return 'bg-yellow-100 border-yellow-400 shadow-yellow-200';
      case 'SAFE':
        return 'bg-green-100 border-green-400 shadow-green-200';
      default:
        return 'bg-gray-100 border-gray-300';
    }
  };

  const statusColor = getStatusColor();

  // Aircraft-specific cell sizing
  const cellSize = aircraftType === 'B737' ? 'p-4' : 'p-3';

  return (
    <div
      className={`
        relative border-2 rounded-lg ${cellSize} transition-all duration-200 cursor-pointer
        ${statusColor}
        ${isHovered ? 'shadow-lg scale-105 z-10' : 'shadow'}
      `}
      onMouseEnter={() => onHover(positionId)}
      onMouseLeave={() => onHover(null)}
    >
      {/* Position Label */}
      <div className="bg-gray-200 rounded px-2 py-1 mb-2 text-center">
        <span className="text-xs font-bold text-gray-700">
          {getDeckBadge(spec)} {positionId}
        </span>
      </div>

      {/* ULD Type and Weight */}
      <div className="text-center">
        <p className="font-bold text-lg text-gray-800">{cargo.uldType}</p>
        <p className="text-sm font-semibold text-gray-600">
          {cargo.weight.toLocaleString()} kg
        </p>
      </div>

      {/* Utilization Bar */}
      {status && spec && (
        <div className="mt-2">
          <div className="w-full bg-gray-300 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full transition-all ${
                status.status === 'OVERLOAD' ? 'bg-red-500' :
                status.status === 'NEAR LIMIT' ? 'bg-yellow-500' :
                'bg-green-500'
              }`}
              style={{ width: `${Math.min(status.utilization * 100, 100)}%` }}
            />
          </div>
          <p className="text-xs text-center mt-1 text-gray-600">
            {(status.utilization * 100).toFixed(1)}% capacity
          </p>
        </div>
      )}

      {/* Hover Tooltip */}
      {isHovered && (
        <div className="absolute left-full ml-2 top-0 bg-gray-900 text-white p-3 rounded-lg shadow-xl z-20 w-64 text-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="font-bold">Position {positionId}</span>
            <Info className="w-4 h-4" />
          </div>
          <div className="space-y-1">
            <InfoLine label="Aircraft" value={aircraftType} />
            <InfoLine label="ULD Type" value={cargo.uldType} />
            <InfoLine label="Actual Weight" value={`${cargo.weight.toLocaleString()} kg`} />
            {spec && (
              <>
                <InfoLine label="Max Capacity" value={`${spec.maxWeight.toLocaleString()} kg`} />
                <InfoLine label="Deck" value={spec.deck} />
              </>
            )}
            {status && (
              <>
                <InfoLine label="Utilization" value={`${(status.utilization * 100).toFixed(1)}%`} />
                <div className="pt-2 border-t border-gray-700 mt-2">
                  <span className={`
                    font-bold px-2 py-1 rounded text-xs
                    ${status.status === 'OVERLOAD' ? 'bg-red-500' :
                      status.status === 'NEAR LIMIT' ? 'bg-yellow-500 text-gray-900' :
                      'bg-green-500'}
                  `}>
                    {status.status}
                  </span>
                </div>
              </>
            )}
            <InfoLine label="Destination" value={cargo.destination} />
          </div>
        </div>
      )}
    </div>
  );
}

function InfoLine({ label, value }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-400">{label}:</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}

function LegendItem({ color, label }) {
  return (
    <div className="flex items-center space-x-2">
      <div className={`w-4 h-4 border-2 rounded ${color}`} />
      <span className="text-gray-700 font-medium">{label}</span>
    </div>
  );
}

function getDeckBadge(spec) {
  if (!spec) return '';
  if (spec.deck === 'Main') return '🔵';  // Blue circle for main deck
  if (spec.deck === 'Lower') return '🟠';  // Orange circle for lower deck
  return '';
}

function getAircraftInfo(type) {
  const info = {
    'A320': {
      badgeColor: 'bg-blue-100 text-blue-800 border border-blue-300',
      name: 'Airbus A320'
    },
    'B737': {
      badgeColor: 'bg-green-100 text-green-800 border border-green-300',
      name: 'Boeing 737-800'
    },
    'B777': {
      badgeColor: 'bg-purple-100 text-purple-800 border border-purple-300',
      name: 'Boeing 777-300ER'
    }
  };
  
  return info[type] || info['A320'];
}

export default CargoVisualMapMultiAircraft;
