import * as XLSX from 'xlsx';

/**
 * Parse Excel workbook and extract all necessary data for the Trim Sheet
 * @param {XLSX.WorkBook} workbook - The loaded Excel workbook
 * @returns {Object} Structured data for the dashboard
 */
export function parseExcelData(workbook) {
  try {
    // Extract data from each sheet
    const uldLoadInput = parseULDLoadInput(workbook);
    const uldMasterTable = parseULDMasterTable(workbook);
    const cargoVisualLayout = parseCargoVisualLayout(workbook);
    const armMoment = parseArmMoment(workbook);
    const cgBalance = parseCGBalance(workbook);

    // Structure complete data
    return {
      flightInfo: {
        aircraftType: cgBalance.aircraftType || 'A320 Cargo Variant',
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
      cargoPositions: uldLoadInput,
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
 * Parse ULD Load Input sheet
 */
function parseULDLoadInput(workbook) {
  const sheet = workbook.Sheets['ULD LOAD INPUT'];
  if (!sheet) throw new Error('ULD LOAD INPUT sheet not found');

  const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });
  const positions = [];

  // Skip header row, process data rows
  for (let i = 1; i < data.length; i++) {
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
 * Parse ULD Master Table sheet
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
      deck: row[2]?.toString() || 'Main'
    };
  }

  return specs;
}

/**
 * Parse Cargo Hold Visual Layout sheet
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
 * Parse ARM & MOMENT COMPUTATION sheet
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
 * Parse CG & BALANCE DECISION ENGINE sheet
 */
function parseCGBalance(workbook) {
  const sheet = workbook.Sheets['CG & BALANCE DECISION ENGINE'];
  if (!sheet) throw new Error('CG & BALANCE DECISION ENGINE sheet not found');

  // Direct cell references
  const aircraftType = getCellValue(sheet, 'B4');
  const forwardLimit = parseFloat(getCellValue(sheet, 'B7')) || 14.0;
  const aftLimit = parseFloat(getCellValue(sheet, 'B8')) || 28.0;
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
 * Helper function to get cell value
 */
function getCellValue(sheet, cellRef) {
  const cell = sheet[cellRef];
  if (!cell) return null;
  return cell.v !== undefined ? cell.v : cell.w;
}

/**
 * Calculate summary statistics
 */
export function calculateSummaryStats(data) {
  const { cargoPositions, uldSpecs, visualStatus } = data;

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
    overloadCount: overloadCount
  };
}
