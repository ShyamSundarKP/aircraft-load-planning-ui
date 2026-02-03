import * as XLSX from 'xlsx';

/**
 * ENHANCED Multi-Aircraft Parser
 * Supports A320, B737-800, B777-300ER with dynamic detection
 */
export function parseExcelData(workbook) {
  try {
    // ENHANCED: Parse aircraft models configuration
    const aircraftParams = parseAircraftModels(workbook);
    
    // Extract data from each sheet (existing logic)
    const uldLoadInput = parseULDLoadInput(workbook);
    const uldMasterTable = parseULDMasterTable(workbook);
    const cargoVisualLayout = parseCargoVisualLayout(workbook);
    const armMoment = parseArmMoment(workbook);
    const cgBalance = parseCGBalance(workbook, aircraftParams);

    // ENHANCED: Filter only active positions (non-empty)
    const activePositions = uldLoadInput.filter(pos => 
      pos.position && pos.position.trim() !== ""
    );

    // Structure complete data
    return {
      flightInfo: {
        aircraftType: aircraftParams.type,  // From aircraft selection
        flightNumber: 'CA-8042',
        route: 'PVG → LAX',
        date: new Date().toLocaleDateString('en-US', { 
          day: '2-digit', 
          month: 'short', 
          year: 'numeric' 
        }),
        time: new Date().toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        loadController: 'AI SYSTEM',
        status: 'AUTO-GENERATED'
      },
      aircraftParams: aircraftParams,        // NEW: Aircraft-specific configuration
      cargoPositions: activePositions,       // FILTERED: Only populated positions
      uldSpecs: uldMasterTable,
      visualStatus: cargoVisualLayout,
      physics: armMoment,
      cgAnalysis: cgBalance,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error parsing Excel data:', error);
    throw new Error(`Data parsing failed: ${error.message}`);
  }
}

/**
 * NEW: Parse aircraft models configuration
 */
function parseAircraftModels(workbook) {
  // Get selected aircraft from TRIM SHEET cell I3
  const trimSheet = workbook.Sheets['AIRCRAFT LOAD & TRIM SHEET'];
  const selectedAircraft = getCellValue(trimSheet, 'I3') || 'A320';
  
  // Parse AIRCRAFT MODELS sheet if exists
  if (workbook.Sheets['AIRCRAFT MODELS']) {
    const modelsSheet = workbook.Sheets['AIRCRAFT MODELS'];
    const data = XLSX.utils.sheet_to_json(modelsSheet, { header: 1, defval: null });
    
    // Find matching aircraft
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row[0] === selectedAircraft) {
        return {
          type: row[0],                    // A320, B737, B777
          maxPositions: row[1] || 12,
          mainDeckPositions: row[2] || 0,
          lowerDeckPositions: row[3] || 12,
          cgForward: parseFloat(row[4]) || 14.0,
          cgAft: parseFloat(row[5]) || 28.0,
          maxPayload: parseFloat(row[6]) || 20000
        };
      }
    }
  }
  
  // Default fallback to A320
  return {
    type: selectedAircraft,
    maxPositions: 12,
    mainDeckPositions: 0,
    lowerDeckPositions: 12,
    cgForward: 14.0,
    cgAft: 28.0,
    maxPayload: 20000
  };
}

/**
 * Parse ULD Load Input sheet (UNCHANGED)
 */
function parseULDLoadInput(workbook) {
  const sheet = workbook.Sheets['ULD LOAD INPUT'];
  if (!sheet) throw new Error('ULD LOAD INPUT sheet not found');

  const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });
  const positions = [];

  // Skip header row, process data rows
  for (let i = 1; i < data.length && i <= 13; i++) {  // Max 12 positions + header
    const row = data[i];
    if (!row[0]) continue; // Skip empty rows

    positions.push({
      position: row[0]?.toString() || '',
      uldType: row[1]?.toString() || '',
      weight: parseFloat(row[2]) || 0,
      destination: row[3]?.toString() || ''
    });
  }

  return positions;
}

/**
 * Parse ULD Master Table sheet (UNCHANGED)
 */
function parseULDMasterTable(workbook) {
  const sheet = workbook.Sheets['ULD MASTER TABLE'];
  if (!sheet) throw new Error('ULD MASTER TABLE sheet not found');

  const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });
  const specs = {};

  // Skip header row
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row[0]) continue;

    const uldType = row[0]?.toString();
    specs[uldType] = {
      maxWeight: parseFloat(row[1]) || 0,
      deck: row[2]?.toString() || 'Main',
      compatible: row[3]?.toString() || ''  // NEW: Compatibility info
    };
  }

  return specs;
}

/**
 * Parse Cargo Hold Visual Layout sheet (UNCHANGED)
 */
function parseCargoVisualLayout(workbook) {
  const sheet = workbook.Sheets['CARGO HOLD VISUAL LAYOUT'];
  if (!sheet) throw new Error('CARGO HOLD VISUAL LAYOUT sheet not found');

  const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });
  const statuses = {};

  // Find status column (usually column F = index 5)
  for (let i = 3; i < data.length; i++) {
    const row = data[i];
    if (!row[0]) continue;

    const position = row[0]?.toString();
    const status = row[5]?.toString() || 'UNKNOWN';
    const actualWeight = parseFloat(row[2]) || 0;
    const maxWeight = parseFloat(row[3]) || 0;
    const utilization = maxWeight > 0 ? actualWeight / maxWeight : 0;

    statuses[position] = {
      status: status,
      actualWeight: actualWeight,
      maxWeight: maxWeight,
      utilization: utilization
    };
  }

  return statuses;
}

/**
 * Parse ARM & MOMENT COMPUTATION sheet (UNCHANGED)
 */
function parseArmMoment(workbook) {
  const sheet = workbook.Sheets['ARM & MOMENT COMPUTATION'];
  if (!sheet) throw new Error('ARM & MOMENT COMPUTATION sheet not found');

  const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });
  
  // Find totals row (last row with data)
  let totalWeight = 0;
  let totalMoment = 0;

  for (let i = data.length - 1; i >= 0; i--) {
    const row = data[i];
    if (row[3] && !isNaN(parseFloat(row[3]))) {
      totalWeight = parseFloat(row[3]);
      totalMoment = parseFloat(row[4]) || 0;
      break;
    }
  }

  return {
    totalWeight: totalWeight,
    totalMoment: totalMoment
  };
}

/**
 * ENHANCED: Parse CG & BALANCE DECISION ENGINE sheet
 */
function parseCGBalance(workbook, aircraftParams) {
  const sheet = workbook.Sheets['CG & BALANCE DECISION ENGINE'];
  if (!sheet) throw new Error('CG & BALANCE DECISION ENGINE sheet not found');

  // Direct cell references
  const aircraftType = getCellValue(sheet, 'B4') || aircraftParams.type;
  
  // CG limits now come from dynamic formulas (should match aircraftParams)
  const forwardLimit = parseFloat(getCellValue(sheet, 'B7')) || aircraftParams.cgForward;
  const aftLimit = parseFloat(getCellValue(sheet, 'B8')) || aircraftParams.cgAft;
  
  const totalWeight = parseFloat(getCellValue(sheet, 'B12')) || 0;
  const totalMoment = parseFloat(getCellValue(sheet, 'B13')) || 0;
  const cg = parseFloat(getCellValue(sheet, 'B15')) || 0;
  const cgStatus = getCellValue(sheet, 'B19') || 'UNKNOWN';
  const overallStatus = getCellValue(sheet, 'B21') || 'UNKNOWN';

  return {
    aircraftType: aircraftType,
    forwardLimit: forwardLimit,
    aftLimit: aftLimit,
    totalWeight: totalWeight,
    totalMoment: totalMoment,
    computedCG: cg,
    cgStatus: cgStatus,
    overallSafetyStatus: overallStatus,
    isSafe: overallStatus.includes('✓ SAFE') || overallStatus.includes('SAFE FOR FLIGHT')
  };
}

/**
 * Helper function to get cell value (UNCHANGED)
 */
function getCellValue(sheet, cellRef) {
  const cell = sheet[cellRef];
  if (!cell) return null;
  return cell.v !== undefined ? cell.v : cell.w;
}

/**
 * ENHANCED: Calculate summary statistics with aircraft awareness
 */
export function calculateSummaryStats(data) {
  const { cargoPositions, uldSpecs, visualStatus, aircraftParams } = data;

  let mainDeckWeight = 0;
  let lowerDeckWeight = 0;
  let overloadCount = 0;

  cargoPositions.forEach(cargo => {
    const spec = uldSpecs[cargo.uldType];
    const status = visualStatus[cargo.position];

    if (spec) {
      if (spec.deck === 'Main') {
        mainDeckWeight += cargo.weight;
      } else if (spec.deck === 'Lower') {
        lowerDeckWeight += cargo.weight;
      }
    }

    if (status && status.status === 'OVERLOAD') {
      overloadCount++;
    }
  });

  return {
    totalULDs: cargoPositions.length,
    mainDeckWeight: mainDeckWeight,
    lowerDeckWeight: lowerDeckWeight,
    overloadCount: overloadCount,
    // NEW: Aircraft-specific stats
    utilizationPercent: aircraftParams.maxPayload > 0 
      ? ((mainDeckWeight + lowerDeckWeight) / aircraftParams.maxPayload) * 100 
      : 0
  };
}

/**
 * NEW: Helper function to build cargo grid layout based on aircraft type
 */
export function buildCargoGridLayout(positions, aircraftParams) {
  const positionIds = positions.map(p => p.position);
  const { type, mainDeckPositions, lowerDeckPositions } = aircraftParams;
  
  if (type === 'B737') {
    // B737: 2x2 grid (4 positions total)
    return [
      positionIds.slice(0, 2),  // FWD1, FWD2
      positionIds.slice(2, 4)   // AFT1, AFT2
    ];
  }
  
  if (type === 'B777') {
    // B777: 12 positions (6 main deck + 6 lower deck)
    const layout = [];
    
    // Main Deck (M1-M6): 3 rows of 2
    for (let i = 0; i < Math.min(6, mainDeckPositions); i += 2) {
      layout.push(positionIds.slice(i, i + 2));
    }
    
    // Deck separator indicator
    if (mainDeckPositions > 0 && lowerDeckPositions > 0) {
      layout.push('DECK_SEPARATOR');
    }
    
    // Lower Deck (L1-L6): 3 rows of 2
    const lowerStart = mainDeckPositions;
    for (let i = lowerStart; i < Math.min(lowerStart + 6, positionIds.length); i += 2) {
      layout.push(positionIds.slice(i, i + 2));
    }
    
    return layout;
  }
  
  // Default: A320 style (6 rows of 2)
  const layout = [];
  for (let i = 0; i < positionIds.length; i += 2) {
    layout.push(positionIds.slice(i, i + 2));
  }
  return layout;
}
