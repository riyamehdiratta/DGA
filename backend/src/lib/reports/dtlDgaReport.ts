import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import ExcelJS from 'exceljs';
import { getTable1Threshold, getTable2Threshold, getTable3Threshold, getTable4Threshold } from '../analysis/ieee/lookup.js';
import type { GasKey, NormProfile } from '../analysis/ieee/types.js';
import type {
  AnalysisResultDto,
  DgaSampleDto,
  TransformerDto,
} from '../../types/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOGO_PATH = path.resolve(__dirname, '../../assets/dtl-logo.png');

const GAS_ROWS: { key: GasKey; label: string }[] = [
  { key: 'h2', label: 'Hydrogen H2' },
  { key: 'co2', label: 'Carbon Di-oxide CO2' },
  { key: 'co', label: 'Carbon Mono-oxide CO' },
  { key: 'c2h4', label: 'Ethylene C2H4' },
  { key: 'c2h6', label: 'Ethane C2H6' },
  { key: 'ch4', label: 'Methane CH4' },
  { key: 'c2h2', label: 'Acetylene C2H2' },
];

const NOT_TRACKED = 'N/A';
const FONT_NAME = 'Times New Roman';
const BORDER = { style: 'thin' as const, color: { argb: 'FF000000' } };
const THIN_BOX = { top: BORDER, bottom: BORDER, left: BORDER, right: BORDER };

// Column widths reproduced from docs/demo-data/sample_excel_report.docx's
// actual <w:tblGrid> (17 columns, widths in twips converted to Excel's
// character-width units via twips/1440*96/7). Several are near-zero
// "spacer" columns DTL used for fine alignment in the original grid — kept
// as-is so merged-cell boundaries land in the same place as the source.
const COL_WIDTHS = [21.25, 4.09, 9.39, 0.06, 7.7, 5.13, 0.64, 2.44, 0.23, 7.98, 0.12, 8.1, 6.8, 6.7, 12.14, 0.68, 12.9];
const COLS = COL_WIDTHS.length; // 17
const NAME_PLATE_END = 6; // left block spans cols 1-6, per DTL's row-2 gridSpan
const RIGHT_START = NAME_PLATE_END + 1; // 7

function formatThreshold(gas: GasKey, profile: NormProfile, kind: 'table1' | 'table2' | 'table3' | 'table4', extra?: unknown): string {
  let t;
  if (kind === 'table1') t = getTable1Threshold(profile, extra as never, gas);
  else if (kind === 'table2') t = getTable2Threshold(profile, extra as never, gas);
  else if (kind === 'table3') t = getTable3Threshold(profile, gas);
  else t = getTable4Threshold(profile, extra as never, gas);

  if (t.anyIncrease || t.anyIncreasingRate) return 'ANY';
  return String(t.ppm ?? '');
}

function formatGasValue(value: number | null | undefined): string {
  if (value == null) return '—';
  return value < 1 && value > 0 ? `<${Math.max(value, 0.5)}` : String(value);
}

function statusLabel(status: string | null | undefined): string {
  switch (status) {
    case 'STATUS_1':
      return 'Status 1';
    case 'STATUS_2':
      return 'Status 2';
    case 'STATUS_3':
      return 'Status 3';
    default:
      return '—';
  }
}

export interface DtlDgaReportInput {
  transformer: TransformerDto;
  sample: DgaSampleDto;
  previousSample: DgaSampleDto | null;
  analysis: AnalysisResultDto;
  ageCategory: 'UNKNOWN' | 'YEARS_1_TO_9' | 'YEARS_10_TO_30' | 'YEARS_OVER_30';
}

/**
 * Builds an .xlsx workbook that reproduces DTL's own "Dissolved Gas Analysis
 * Lab. Testing Report" cell-for-cell: docs/demo-data/sample_excel_report.docx
 * was parsed directly from its Word table XML (17-column tblGrid, 31 rows,
 * every w:gridSpan/w:vMerge) and that grid, span-by-span, is reproduced here
 * so column boundaries and merges land in the same place as the source.
 *
 * Fields DTL's paper form captures that our data model does not (vector
 * group, year of manufacturing, sample-received date, equipment type,
 * sampling point, load/winding/oil temperature, filtration date, reason for
 * testing, water content, tan delta, resistivity) are rendered as "N/A"
 * rather than fabricated. Rogers Ratio Method is also "N/A" — the app
 * implements Doernenburg Ratio, not Rogers, and this report does not relabel
 * one method as the other.
 */
export async function buildDtlDgaReportWorkbook(input: DtlDgaReportInput): Promise<ExcelJS.Workbook> {
  const { transformer, sample, previousSample, analysis } = input;

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'DTL DGA Analysis System';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet('DGA Report', {
    pageSetup: { paperSize: 9, orientation: 'portrait', fitToPage: true, fitToWidth: 1 },
  });

  sheet.columns = COL_WIDTHS.map((width) => ({ width }));

  let row = 1;
  const merge = (r: number, c1: number, c2: number) => {
    if (c2 > c1) sheet.mergeCells(r, c1, r, c2);
  };
  const vmerge = (r1: number, r2: number, c: number) => {
    if (r2 > r1) sheet.mergeCells(r1, c, r2, c);
  };
  const box = (r1: number, c1: number, r2: number, c2: number) => {
    for (let r = r1; r <= r2; r++) {
      for (let c = c1; c <= c2; c++) sheet.getCell(r, c).border = THIN_BOX;
    }
  };

  type CellOpts = {
    bold?: boolean;
    size?: number;
    italic?: boolean;
    align?: 'left' | 'center' | 'right';
    valign?: 'top' | 'middle' | 'bottom';
    wrap?: boolean;
  };
  const setCell = (r: number, c: number, value: unknown, opts: CellOpts = {}) => {
    const cell = sheet.getCell(r, c);
    cell.value = value as ExcelJS.CellValue;
    cell.font = { name: FONT_NAME, size: opts.size ?? 10, bold: !!opts.bold, italic: !!opts.italic };
    cell.alignment = {
      horizontal: opts.align ?? 'left',
      vertical: opts.valign ?? 'top',
      wrapText: opts.wrap ?? true,
    };
    return cell;
  };
  const richText = (runs: { text: string; bold?: boolean; size?: number; underline?: boolean }[]) => ({
    richText: runs.map((r) => ({
      text: r.text,
      font: { name: FONT_NAME, size: r.size ?? 10, bold: !!r.bold, underline: !!r.underline },
    })),
  });

  // --- Row 1: Logo (cols 1-2) + address block (cols 3-17), per DTL's row 0 ---
  const LOGO_ROW_HEIGHT = 105;
  sheet.getRow(row).height = LOGO_ROW_HEIGHT;
  merge(row, 1, 2);
  merge(row, 3, COLS);

  // Center the logo within merged cols 1-2 using a two-cell anchor (tl/br)
  // so Excel positions it from its own real column/row pixel data, inset by
  // a small margin fraction on each side — not a hand-approximated
  // units-to-pixels conversion, which doesn't hold across columns of very
  // different widths (col A is ~5x col B) and rendered off-center/overflowing.
  const logoBuffer = readFileSync(LOGO_PATH);
  const logoImageId = workbook.addImage({ buffer: logoBuffer, extension: 'png' });
  sheet.addImage(logoImageId, {
    tl: { col: 0.15, row: 0.12 },
    br: { col: 1.85, row: 0.88 },
  } as ExcelJS.ImageRange);
  setCell(
    row,
    3,
    richText([
      { text: 'DELHI TRANSCO LTD.\n', bold: true, size: 14 },
      { text: '(Regd. Office: Shakti Sadan, Com. Inderjeet Gupta Road, New Delhi-110002)\n', size: 8, underline: true },
      { text: 'CENTRALISED TESTING LAB\n', bold: true, size: 12 },
      { text: '220 KV GIS SUB STN MAHARANI BAGH, Behlolpur Khadar\n', size: 8, underline: true },
      { text: 'Opp ISBT Sarai Kale Khan, NEW Delhi -13', size: 8, underline: true },
    ]),
    { align: 'center', valign: 'middle' },
  );
  row++;

  // --- Row 2: Title + Report ID, one merged block, per DTL's row 1 ---
  sheet.getRow(row).height = 58;
  merge(row, 1, COLS);
  setCell(
    row,
    1,
    richText([
      { text: 'Dissolved Gas Analysis \n', bold: true, size: 11 },
      { text: 'Lab. Testing Report\n', bold: true, size: 10, underline: true },
      { text: `Report ID: ${analysis.id}`, bold: true, size: 11 },
    ]),
    { align: 'center', valign: 'middle' },
  );
  row++;

  // --- Name Plate Data | Sample Data (side by side, per DTL's row 2) ---
  setCell(row, 1, 'Name Plate Data', { bold: true });
  merge(row, 1, NAME_PLATE_END);
  setCell(row, RIGHT_START, 'Sample Data:', { bold: true });
  merge(row, RIGHT_START, COLS);
  row++;

  // Name Plate Data: one tall multi-line cell, vMerged across the next 3
  // rows on cols 1-6 — matching DTL's row 3-5 vMerge exactly.
  const namePlateTop = row;
  const namePlateText = [
    `Name of S/S: ${transformer.substation}`,
    `Equipment ID: ${transformer.equipmentId}`,
    `Make: ${transformer.manufacturer}`,
    `Serial Number: ${transformer.serialNumber}`,
    `Vector Group: ${NOT_TRACKED}`,
    `Equipment Rating: ${transformer.mvaRating}, ${transformer.voltageRating}`,
    `Yr. of Manufacturing: ${NOT_TRACKED}`,
    `Yr. of Commissioning: ${transformer.commissioningDate}`,
  ].join('\n');

  // Sample Data (row 3, right side)
  sheet.getRow(row).height = 78;
  setCell(
    row,
    RIGHT_START,
    [
      `Date of Sampling: ${sample.sampleDate}`,
      `Sample Received: ${sample.sampleDate}`,
      `Type of Equipment: ${NOT_TRACKED}`,
      `Sampling Point: ${NOT_TRACKED}`,
    ].join('\n'),
  );
  merge(row, RIGHT_START, COLS);
  row++;

  // "Additional Information" sub-header (row 4, right side)
  sheet.getRow(row).height = 20;
  setCell(row, RIGHT_START, 'Additional Information', { bold: true });
  merge(row, RIGHT_START, COLS);
  row++;

  // Additional info block (row 5, right side)
  sheet.getRow(row).height = 78;
  setCell(
    row,
    RIGHT_START,
    [
      `Load at the time of Sampling (MW/Amps): ${NOT_TRACKED}`,
      `Winding Temperature (HV/LV/TV): ${NOT_TRACKED}`,
      `Oil Temperature: ${NOT_TRACKED}`,
      `Date of Last Filtration: ${NOT_TRACKED}`,
    ].join('\n'),
  );
  merge(row, RIGHT_START, COLS);

  // Close the Name Plate Data block: one rectangular merge across the 3
  // rows above and cols 1-6 (a combined h+v merge — exceljs rejects a
  // second merge that partially overlaps an existing one).
  sheet.mergeCells(namePlateTop, 1, row, NAME_PLATE_END);
  setCell(namePlateTop, 1, namePlateText, { valign: 'top' });
  row++;

  // Reason for testing (left, cols 1-3, not bold) | Test Date (right, cols
  // 4-17, bold + centered).
  sheet.getRow(row).height = 40;
  setCell(row, 1, `Reason for Testing: ${NOT_TRACKED}\nIf forced, reason thereof: ${NOT_TRACKED}`, { bold: false });
  merge(row, 1, 3);
  setCell(row, 4, `Test Date: ${sample.sampleDate}`, { bold: true, align: 'center', valign: 'middle' });
  merge(row, 4, COLS);
  row++;

  // --- IEEE threshold matrix, per DTL's rows 7-18 ---
  const profile = analysis.normProfile;
  const ratioLabel =
    profile === 'LOW_RATIO' ? 'O2/N2 Ratio ≤ 0.2' : profile === 'HIGH_RATIO' ? 'O2/N2 Ratio > 0.2' : 'O2/N2 not measured (defaults to > 0.2 table)';

  setCell(row, 1, 'Violation / Max. Limits in ppm (As per IEEE Std C57.104-2019)', { bold: true, size: 12, align: 'center' });
  merge(row, 1, COLS);
  row++;

  const paramHeaderTop = row;
  setCell(row, 2, ratioLabel, { bold: true, align: 'center' });
  merge(row, 2, COLS);
  row++;

  setCell(row, 2, 'Transformer Age in Years', { bold: true, align: 'center' });
  merge(row, 2, COLS);
  row++;

  setCell(row, 2, 'Table-1(90P)', { bold: true, align: 'center' });
  merge(row, 2, 5);
  setCell(row, 6, 'Table-2(95P)', { bold: true, align: 'center' });
  merge(row, 6, 12);
  const table3Top = row;
  setCell(row, 13, 'Table-3\n(Delta)', { bold: true, align: 'center', valign: 'middle' });
  setCell(row, 15, 'Table-4(95P)', { bold: true, align: 'center' });
  merge(row, 15, 17);
  row++;

  setCell(row, 2, '1-9 yr', { bold: true, size: 9, align: 'center' });
  merge(row, 2, 4);
  setCell(row, 5, '10-30 yr', { bold: true, size: 9, align: 'center' });
  setCell(row, 6, '1-9 yr', { bold: true, size: 9, align: 'center' });
  merge(row, 6, 9);
  setCell(row, 10, '10-30 yr', { bold: true, size: 9, align: 'center' });
  merge(row, 10, 11);
  setCell(row, 12, '>30 yr', { bold: true, size: 9, align: 'center' });
  setCell(row, 15, '4-9 Months', { bold: true, size: 9, align: 'center' });
  setCell(row, 16, '10-24 Months', { bold: true, size: 9, align: 'center' });
  merge(row, 16, 17);
  // "Table-3 (Delta)" header: one rectangular merge across both header rows
  // and cols 13-14 (combined h+v merge — see note above).
  sheet.mergeCells(table3Top, 13, row, 14);
  row++;

  vmerge(paramHeaderTop, row - 1, 1);
  setCell(paramHeaderTop, 1, 'PARAMETERS', { bold: true, align: 'center', valign: 'middle' });

  for (const { key, label } of GAS_ROWS) {
    setCell(row, 1, label, { bold: false });
    setCell(row, 2, formatThreshold(key, profile, 'table1', 'YEARS_1_TO_9'), { align: 'center' });
    merge(row, 2, 4);
    setCell(row, 5, formatThreshold(key, profile, 'table1', 'YEARS_10_TO_30'), { align: 'center' });
    setCell(row, 6, formatThreshold(key, profile, 'table2', 'YEARS_1_TO_9'), { align: 'center' });
    merge(row, 6, 8);
    setCell(row, 9, formatThreshold(key, profile, 'table2', 'YEARS_10_TO_30'), { align: 'center' });
    merge(row, 9, 10);
    setCell(row, 11, formatThreshold(key, profile, 'table2', 'YEARS_OVER_30'), { align: 'center' });
    merge(row, 11, 12);
    setCell(row, 13, formatThreshold(key, profile, 'table3'), { align: 'center' });
    merge(row, 13, 14);
    setCell(row, 15, formatThreshold(key, profile, 'table4', 'MONTHS_4_TO_9'), { align: 'center' });
    merge(row, 15, 16);
    setCell(row, 17, formatThreshold(key, profile, 'table4', 'MONTHS_10_TO_24'), { align: 'center' });
    row++;
  }

  // DTL's row 19 ("DISSOLVED GAS RESULTS...") follows the last gas
  // threshold row directly — no blank row between them.
  // --- Dissolved Gas Results | DGA Diagnostics (side by side, row-paired,
  // per DTL's rows 19-29) ---
  setCell(row, 1, 'Dissolved Gas Results (in ppm)', { bold: true });
  merge(row, 1, 7);
  setCell(row, 8, 'DGA Diagnostics', { bold: true });
  merge(row, 8, COLS);
  row++;

  const subHeaderTop = row;
  setCell(row, 1, 'Parameter', { bold: true, align: 'center', valign: 'middle' });
  setCell(row, 2, 'Ist-Prior', { bold: true, align: 'center' });
  merge(row, 2, 3);
  setCell(row, 4, 'Present', { bold: true, align: 'center' });
  merge(row, 4, 7);
  setCell(row, 8, 'DGA Interpretation as per IEEE Std. C57.104-2019', { bold: true, size: 12, align: 'left', valign: 'middle' });
  row++;

  setCell(row, 2, previousSample ? previousSample.sampleDate : '—', { bold: true, align: 'center' });
  merge(row, 2, 3);
  setCell(row, 4, sample.sampleDate, { bold: true, align: 'center' });
  merge(row, 4, 7);
  vmerge(subHeaderTop, row, 1);
  // One rectangular merge for the "DGA Interpretation..." block spanning
  // both header rows and cols 8-17 — a combined h+v merge, not two separate
  // calls (exceljs rejects a merge that partially overlaps an existing one).
  sheet.mergeCells(subHeaderTop, 8, row, COLS);
  row++;

  const hasViolation = (analysis.statusResult?.exceededThresholds.length ?? 0) > 0;
  const co2co = sample.co > 0 ? (sample.co2 / sample.co).toFixed(2) : NOT_TRACKED;
  const triangle1 = analysis.duvalTriangleResult?.triangle1;
  const triangle4or5 = analysis.duvalTriangleResult?.triangle4 ?? analysis.duvalTriangleResult?.triangle5;
  const duvalText = triangle1?.zone
    ? triangle4or5?.zone
      ? `${triangle1.zone} (refined: ${triangle4or5.zone})`
      : triangle1.zone
    : '—';

  const diagnosticsRows: [string, string][] = [
    ['DGA Violation', hasViolation ? 'Yes' : 'No'],
    ['DGA Status', statusLabel(analysis.status)],
    ['CO2/CO Ratio', co2co],
    ['Rogers Ratio Method', `${NOT_TRACKED} (not implemented — see Doernenburg Ratio in-app)`],
    ['Duval Triangle Method', duvalText],
    ['Water Content (ppm) mg/kg', NOT_TRACKED],
    ['Tan Delta (%)', NOT_TRACKED],
    ['Resistivity (Giga Ohm-M)', NOT_TRACKED],
  ];

  const gasValueOf = (s: DgaSampleDto | null, key: GasKey) => (s ? (s as unknown as Record<GasKey, number>)[key] : null);
  const tdcgOf = (s: DgaSampleDto | null) => (s ? s.h2 + s.ch4 + s.c2h6 + s.c2h4 + s.c2h2 + s.co : null);

  GAS_ROWS.forEach(({ key, label }, i) => {
    setCell(row, 1, label, { bold: false });
    setCell(row, 2, previousSample ? formatGasValue(gasValueOf(previousSample, key)) : '—', { align: 'center' });
    merge(row, 2, 3);
    setCell(row, 4, formatGasValue(gasValueOf(sample, key)), { align: 'center' });
    merge(row, 4, 7);

    const [dLabel, dValue] = diagnosticsRows[i];
    setCell(row, 8, dLabel, { bold: false });
    merge(row, 8, 13);
    setCell(row, 14, dValue, { bold: false });
    merge(row, 14, COLS);
    row++;
  });

  setCell(row, 1, 'TDCG', { bold: false });
  setCell(row, 2, previousSample ? String(tdcgOf(previousSample)) : '—', { align: 'center' });
  merge(row, 2, 3);
  setCell(row, 4, String(tdcgOf(sample)), { align: 'center' });
  merge(row, 4, 7);
  const [lastLabel, lastValue] = diagnosticsRows[7];
  setCell(row, 8, lastLabel, { bold: false });
  merge(row, 8, 13);
  setCell(row, 14, lastValue, { bold: false });
  merge(row, 14, COLS);
  row++;

  // "Sampling Interval" immediately follows the TDCG/Resistivity row in
  // DTL's row 30 — no blank row between them.
  setCell(row, 1, 'Sampling Interval: N/A', { bold: true });
  merge(row, 1, COLS);
  const tableEndRow = row;
  row += 3;

  setCell(row, 1, 'Asstt. Manager(T) CTL', { bold: true, wrap: false });
  setCell(row, 12, 'Manager(T) CTL', { bold: true, wrap: false });
  merge(row, 12, COLS);

  // DTL's tblBorders applies a thin black grid line to every cell in the
  // table (top/left/bottom/right/insideH/insideV), from the letterhead down
  // through the "Sampling Interval" row — the signature lines below it sit
  // outside the table grid in the source doc, so they're left unbordered.
  box(1, 1, tableEndRow, COLS);

  return workbook;
}
