import type { Prisma } from "@prisma/client";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import {
  deltaResultToScalars,
  runAnalysisPipeline,
} from "../src/lib/analysis/index.js";
import type {
  GasSampleInput,
  RateSampleInput,
} from "../src/lib/analysis/types.js";

const prisma = new PrismaClient();

interface SeedSample {
  id: string;
  transformerId: string;
  sampleDate: string;
  h2: number;
  ch4: number;
  c2h6: number;
  c2h4: number;
  c2h2: number;
  co: number;
  co2: number;
  o2: number | null;
  n2: number | null;
  remarks: string;
}

interface SeedAnalysis {
  id: string;
  sampleId: string;
  createdAt: string;
}

function parseDate(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

function toJson<T>(value: T): Prisma.InputJsonValue {
  return value as unknown as Prisma.InputJsonValue;
}

/** Up to 5 prior samples for the same transformer, most-recent-first — matches the /run endpoint's window. */
function findPreviousSamples(
  samples: SeedSample[],
  sample: SeedSample,
): RateSampleInput[] {
  return samples
    .filter(
      (s) =>
        s.transformerId === sample.transformerId &&
        s.sampleDate < sample.sampleDate,
    )
    .sort((a, b) => b.sampleDate.localeCompare(a.sampleDate))
    .slice(0, 5)
    .map((s) => toGasSampleInput(s));
}

function toGasSampleInput(sample: SeedSample): RateSampleInput {
  const { h2, ch4, c2h6, c2h4, c2h2, co, co2 } = sample;
  return {
    h2,
    ch4,
    c2h6,
    c2h4,
    c2h2,
    co,
    co2,
    sampleDate: parseDate(sample.sampleDate),
  };
}

async function main() {
  await prisma.auditLog.deleteMany();
  await prisma.user.deleteMany();
  await prisma.deltaResult.deleteMany();
  await prisma.analysisResult.deleteMany();
  await prisma.dgaSample.deleteMany();
  await prisma.transformer.deleteMany();

  await prisma.user.create({
    data: {
      email: "admin@dtl.demo",
      passwordHash: await bcrypt.hash("Admin@123", 12),
      role: "ADMIN",
      designation: "System Administrator",
      substationType: "220 kV",
      substationArea: "Subzi Mandi",
    },
  });

  const transformers = [
    {
      id: "tx-001",
      transformerName: "TX-500/220-Unit-A",
      serialNumber: "SN-2019-00482",
      equipmentId: "EQ-SS-NORTH-001",
      substation: "North Substation",
      manufacturer: "ABB",
      voltageRating: "500/220 kV",
      mvaRating: "315 MVA",
      commissioningDate: "2019-06-15",
    },
    {
      id: "tx-002",
      transformerName: "TX-220/66-Unit-C",
      serialNumber: "SN-2018-00231",
      equipmentId: "EQ-SS-EAST-003",
      substation: "East Substation",
      manufacturer: "Siemens",
      voltageRating: "220/66 kV",
      mvaRating: "100 MVA",
      commissioningDate: "2018-03-22",
    },
    {
      id: "tx-003",
      transformerName: "TX-132/33-Unit-B",
      serialNumber: "SN-2020-00715",
      equipmentId: "EQ-SS-SOUTH-002",
      substation: "South Substation",
      manufacturer: "GE Grid",
      voltageRating: "132/33 kV",
      mvaRating: "63 MVA",
      commissioningDate: "2020-11-08",
    },
    {
      id: "tx-004",
      transformerName: "TX-400/220-Unit-D",
      serialNumber: "SN-2017-00109",
      equipmentId: "EQ-SS-WEST-001",
      substation: "West Substation",
      manufacturer: "ABB",
      voltageRating: "400/220 kV",
      mvaRating: "250 MVA",
      commissioningDate: "2017-09-01",
    },
    {
      id: "tx-005",
      transformerName: "TX-220/11-Unit-E",
      serialNumber: "SN-2016-00054",
      equipmentId: "EQ-SS-CENTRAL-004",
      substation: "Central Substation",
      manufacturer: "Hyundai Electric",
      voltageRating: "220/11 kV",
      mvaRating: "80 MVA",
      commissioningDate: "2016-04-18",
    },
    // Dummy verification transformer — real-world identity fields are placeholders
    // (source data was a 7-sample gas-only series with no transformer metadata),
    // rename freely. Commissioned well before the sample series so age category
    // (YEARS_10_TO_30, 23-26 years across the series) stays constant across all
    // 7 samples, isolating the gas trend as the only variable under test.
    {
      id: "tx-006",
      transformerName: "TX-TEST-Verification-Unit-F",
      serialNumber: "SN-TEST-00001",
      equipmentId: "EQ-TEST-VERIFY-001",
      substation: "Verification Test Bench",
      manufacturer: "Test Fixture",
      voltageRating: "220/66 kV",
      mvaRating: "100 MVA",
      commissioningDate: "2000-01-01",
    },
    // Real DTL field data (docs/demo-data/transformer-info.png + values.png).
    {
      id: "tx-007",
      transformerName: "100MVA-II",
      serialNumber: "HT1644/12427",
      equipmentId: "2",
      substation: "Subzi Mandi",
      manufacturer: "EMCO",
      voltageRating: "220/33 kV",
      mvaRating: "100 MVA",
      commissioningDate: "2005-07-01",
    },
    // Synthetic transformer whose latest sample is hand-designed so Duval
    // Triangle 1 returns T1 (routing eligibility into Triangle 4) and
    // Triangle 4 itself lands in zone C — exercises the C-region fix from
    // this session's Duval Triangle 4 geometry correction.
    {
      id: "tx-008",
      transformerName: "TX-220/66-Unit-G",
      serialNumber: "SN-2015-00367",
      equipmentId: "EQ-SS-RIVER-005",
      substation: "Riverside Substation",
      manufacturer: "Crompton Greaves",
      voltageRating: "220/66 kV",
      mvaRating: "125 MVA",
      commissioningDate: "2015-03-10",
    },
  ];

  const samples: SeedSample[] = [
    {
      id: "sample-001",
      transformerId: "tx-001",
      sampleDate: "2026-03-12",
      h2: 48,
      ch4: 14,
      c2h6: 10,
      c2h4: 30,
      c2h2: 0,
      co: 335,
      co2: 2800,
      o2: 8200,
      n2: 41000,
      remarks: "Routine scheduled sample.",
    },
    {
      id: "sample-002",
      transformerId: "tx-001",
      sampleDate: "2026-04-18",
      h2: 52,
      ch4: 18,
      c2h6: 12,
      c2h4: 35,
      c2h2: 1,
      co: 348,
      co2: 2950,
      o2: 8300,
      n2: 41500,
      remarks: "",
    },
    {
      id: "sample-003",
      transformerId: "tx-001",
      sampleDate: "2026-05-22",
      h2: 58,
      ch4: 25,
      c2h6: 15,
      c2h4: 38,
      c2h2: 3,
      co: 378,
      co2: 3050,
      o2: 8400,
      n2: 41800,
      remarks: "Follow-up after elevated CH4.",
    },
    {
      id: "sample-004",
      transformerId: "tx-001",
      sampleDate: "2026-06-10",
      h2: 65,
      ch4: 32,
      c2h6: 18,
      c2h4: 45,
      c2h2: 8,
      co: 410,
      co2: 3200,
      o2: 8500,
      n2: 42000,
      remarks: "Sample taken during scheduled maintenance outage.",
    },
    {
      id: "sample-005",
      transformerId: "tx-002",
      sampleDate: "2026-05-10",
      h2: 38,
      ch4: 15,
      c2h6: 8,
      c2h4: 22,
      c2h2: 0,
      co: 290,
      co2: 2600,
      o2: 8000,
      n2: 40000,
      remarks: "",
    },
    {
      id: "sample-006",
      transformerId: "tx-002",
      sampleDate: "2026-06-09",
      h2: 42,
      ch4: 28,
      c2h6: 12,
      c2h4: 30,
      c2h2: 2,
      co: 310,
      co2: 2750,
      o2: 8100,
      n2: 40500,
      remarks: "",
    },
    {
      id: "sample-007",
      transformerId: "tx-003",
      sampleDate: "2026-05-15",
      h2: 40,
      ch4: 20,
      c2h6: 10,
      c2h4: 28,
      c2h2: 1,
      co: 300,
      co2: 2700,
      o2: 7900,
      n2: 39800,
      remarks: "",
    },
    {
      id: "sample-008",
      transformerId: "tx-003",
      sampleDate: "2026-06-08",
      h2: 48,
      ch4: 35,
      c2h6: 16,
      c2h4: 42,
      c2h2: 6,
      co: 360,
      co2: 3100,
      o2: 8050,
      n2: 40200,
      remarks: "C2H2 detected — priority review.",
    },
    {
      id: "sample-009",
      transformerId: "tx-004",
      sampleDate: "2026-06-07",
      h2: 35,
      ch4: 10,
      c2h6: 6,
      c2h4: 18,
      c2h2: 0,
      co: 280,
      co2: 2500,
      o2: 7800,
      n2: 39000,
      remarks: "",
    },
    {
      id: "sample-010",
      transformerId: "tx-005",
      sampleDate: "2026-06-06",
      h2: 72,
      ch4: 45,
      c2h6: 22,
      c2h4: 55,
      c2h2: 15,
      co: 450,
      co2: 3400,
      o2: 8600,
      n2: 42500,
      remarks: "Emergency sample — high C2H2.",
    },
    // Verification series for tx-006: a hand-designed, monotonically escalating
    // 7-sample history (dates read as DD/MM/YYYY — twice-yearly sampling from
    // 2023-01 to 2026-01) to validate Rate/Status/Duval progression against
    // known expected behavior.
    {
      id: "sample-011",
      transformerId: "tx-006",
      sampleDate: "2023-01-01",
      h2: 120,
      ch4: 80,
      c2h6: 40,
      c2h4: 60,
      c2h2: 2,
      co: 500,
      co2: 3500,
      o2: 20000,
      n2: 60000,
      remarks: "Verification dataset sample #1 (dummy data).",
    },
    {
      id: "sample-012",
      transformerId: "tx-006",
      sampleDate: "2023-06-01",
      h2: 140,
      ch4: 85,
      c2h6: 42,
      c2h4: 70,
      c2h2: 2,
      co: 520,
      co2: 3600,
      o2: 19800,
      n2: 59800,
      remarks: "Verification dataset sample #2 (dummy data).",
    },
    {
      id: "sample-013",
      transformerId: "tx-006",
      sampleDate: "2024-01-01",
      h2: 165,
      ch4: 95,
      c2h6: 48,
      c2h4: 85,
      c2h2: 3,
      co: 560,
      co2: 3800,
      o2: 19500,
      n2: 59500,
      remarks: "Verification dataset sample #3 (dummy data).",
    },
    {
      id: "sample-014",
      transformerId: "tx-006",
      sampleDate: "2024-06-01",
      h2: 180,
      ch4: 110,
      c2h6: 50,
      c2h4: 100,
      c2h2: 3,
      co: 600,
      co2: 4000,
      o2: 19300,
      n2: 59000,
      remarks: "Verification dataset sample #4 (dummy data).",
    },
    {
      id: "sample-015",
      transformerId: "tx-006",
      sampleDate: "2025-01-01",
      h2: 210,
      ch4: 120,
      c2h6: 55,
      c2h4: 130,
      c2h2: 4,
      co: 650,
      co2: 4300,
      o2: 19000,
      n2: 58500,
      remarks: "Verification dataset sample #5 (dummy data).",
    },
    {
      id: "sample-016",
      transformerId: "tx-006",
      sampleDate: "2025-06-01",
      h2: 240,
      ch4: 140,
      c2h6: 60,
      c2h4: 160,
      c2h2: 4,
      co: 720,
      co2: 4700,
      o2: 18800,
      n2: 58000,
      remarks: "Verification dataset sample #6 (dummy data).",
    },
    {
      id: "sample-017",
      transformerId: "tx-006",
      sampleDate: "2026-01-01",
      h2: 260,
      ch4: 155,
      c2h6: 68,
      c2h4: 190,
      c2h2: 5,
      co: 800,
      co2: 5200,
      o2: 18500,
      n2: 57500,
      remarks: "Verification dataset sample #7 (dummy data).",
    },
    // tx-007 field history (docs/demo-data/values.png), 04.05.2022–31.05.2025
    // only, per request — earlier rows predate the 19.04.2022 post-overhaul
    // filtration and are a different gas regime. O2/N2 were not recorded in
    // the source lab sheet for this series, so left null (not measured, never
    // coerced to 0).
    {
      id: "sample-018",
      transformerId: "tx-007",
      sampleDate: "2022-05-04",
      h2: 27,
      ch4: 88,
      c2h6: 40,
      c2h4: 246,
      c2h2: 4,
      co: 51,
      co2: 539,
      o2: null,
      n2: null,
      remarks: "First sample after filtration completed 19.04.2022.",
    },
    {
      id: "sample-019",
      transformerId: "tx-007",
      sampleDate: "2022-06-03",
      h2: 34,
      ch4: 148,
      c2h6: 55,
      c2h4: 427,
      c2h2: 3,
      co: 89,
      co2: 1004,
      o2: null,
      n2: null,
      remarks: "",
    },
    {
      id: "sample-020",
      transformerId: "tx-007",
      sampleDate: "2022-07-08",
      h2: 39,
      ch4: 201,
      c2h6: 70,
      c2h4: 568,
      c2h2: 2,
      co: 145,
      co2: 1965,
      o2: null,
      n2: null,
      remarks: "",
    },
    {
      id: "sample-021",
      transformerId: "tx-007",
      sampleDate: "2022-08-10",
      h2: 24,
      ch4: 179,
      c2h6: 38,
      c2h4: 436,
      c2h2: 1.0,
      co: 144,
      co2: 1963,
      o2: null,
      n2: null,
      remarks: "",
    },
    {
      id: "sample-022",
      transformerId: "tx-007",
      sampleDate: "2022-09-12",
      h2: 39,
      ch4: 245,
      c2h6: 79,
      c2h4: 661,
      c2h2: 1.0,
      co: 194,
      co2: 2283,
      o2: null,
      n2: null,
      remarks: "",
    },
    {
      id: "sample-023",
      transformerId: "tx-007",
      sampleDate: "2022-10-26",
      h2: 32,
      ch4: 270,
      c2h6: 102,
      c2h4: 781,
      c2h2: 2.5,
      co: 155,
      co2: 1997,
      o2: null,
      n2: null,
      remarks: "",
    },
    {
      id: "sample-024",
      transformerId: "tx-007",
      sampleDate: "2022-11-05",
      h2: 50,
      ch4: 301,
      c2h6: 115,
      c2h4: 870,
      c2h2: 3.5,
      co: 174,
      co2: 2106,
      o2: null,
      n2: null,
      remarks: "",
    },
    {
      id: "sample-025",
      transformerId: "tx-007",
      sampleDate: "2022-12-12",
      h2: 31,
      ch4: 273,
      c2h6: 126,
      c2h4: 826,
      c2h2: 1.5,
      co: 180,
      co2: 1962,
      o2: null,
      n2: null,
      remarks: "",
    },
    {
      id: "sample-026",
      transformerId: "tx-007",
      sampleDate: "2023-04-11",
      h2: 20,
      ch4: 293,
      c2h6: 121,
      c2h4: 853,
      c2h2: 1.0,
      co: 221,
      co2: 2510,
      o2: null,
      n2: null,
      remarks: "",
    },
    {
      id: "sample-027",
      transformerId: "tx-007",
      sampleDate: "2023-10-17",
      h2: 23,
      ch4: 379,
      c2h6: 172,
      c2h4: 1106,
      c2h2: 0.5,
      co: 357,
      co2: 3458,
      o2: null,
      n2: null,
      remarks: "",
    },
    {
      id: "sample-028",
      transformerId: "tx-007",
      sampleDate: "2024-01-15",
      h2: 17,
      ch4: 311,
      c2h6: 224,
      c2h4: 1136,
      c2h2: 0,
      co: 293,
      co2: 2856,
      o2: null,
      n2: null,
      remarks: "",
    },
    {
      id: "sample-029",
      transformerId: "tx-007",
      sampleDate: "2024-06-20",
      h2: 29,
      ch4: 476,
      c2h6: 278,
      c2h4: 1381,
      c2h2: 0.5,
      co: 473,
      co2: 4429,
      o2: null,
      n2: null,
      remarks: "",
    },
    {
      id: "sample-030",
      transformerId: "tx-007",
      sampleDate: "2024-09-23",
      h2: 40,
      ch4: 566,
      c2h6: 218,
      c2h4: 1532,
      c2h2: 0.5,
      co: 537,
      co2: 4699,
      o2: null,
      n2: null,
      remarks: "",
    },
    {
      id: "sample-031",
      transformerId: "tx-007",
      sampleDate: "2024-12-19",
      h2: 33,
      ch4: 231,
      c2h6: 270,
      c2h4: 1608,
      c2h2: 0,
      co: 525,
      co2: 3918,
      o2: null,
      n2: null,
      remarks: "",
    },
    {
      id: "sample-032",
      transformerId: "tx-007",
      sampleDate: "2025-05-27",
      h2: 61,
      ch4: 634,
      c2h6: 283,
      c2h4: 1147,
      c2h2: 1.5,
      co: 651,
      co2: 4520,
      o2: null,
      n2: null,
      remarks: "",
    },
    {
      id: "sample-033",
      transformerId: "tx-007",
      sampleDate: "2025-05-28",
      h2: 76,
      ch4: 684,
      c2h6: 324,
      c2h4: 2007,
      c2h2: 2.5,
      co: 594,
      co2: 4594,
      o2: null,
      n2: null,
      remarks: "",
    },
    {
      id: "sample-034",
      transformerId: "tx-007",
      sampleDate: "2025-05-31",
      h2: 71,
      ch4: 683,
      c2h6: 281,
      c2h4: 1945,
      c2h2: 3.0,
      co: 579,
      co2: 4839,
      o2: null,
      n2: null,
      remarks: "Most recent sample on record — elevated C2H4 trend under review.",
    },
    // tx-008 — synthetic 3-sample history building up to a hand-designed
    // Triangle-1 T1 / Triangle-4 C demonstration (see transformer comment).
    {
      id: "sample-035",
      transformerId: "tx-008",
      sampleDate: "2026-04-01",
      h2: 20,
      ch4: 15,
      c2h6: 8,
      c2h4: 5,
      c2h2: 0,
      co: 40,
      co2: 400,
      o2: 8500,
      n2: 40000,
      remarks: "Routine scheduled sample.",
    },
    {
      id: "sample-036",
      transformerId: "tx-008",
      sampleDate: "2026-05-05",
      h2: 45,
      ch4: 200,
      c2h6: 80,
      c2h4: 30,
      c2h2: 3,
      co: 60,
      co2: 650,
      o2: 8300,
      n2: 40000,
      remarks: "Follow-up sample — CH4 and C2H6 trending upward.",
    },
    {
      id: "sample-037",
      transformerId: "tx-008",
      sampleDate: "2026-06-12",
      h2: 100,
      ch4: 650,
      c2h6: 250,
      c2h4: 100,
      c2h2: 10,
      co: 80,
      co2: 900,
      o2: 8000,
      n2: 40000,
      remarks:
        "Elevated CH4/C2H6 — Triangle 1 indicates T1, routing to Triangle 4 refinement.",
    },
  ];

  // Same 8 of 10 samples get analyzed as before — sample-001/sample-002 are
  // intentionally left un-analyzed so the dashboard has a "pending review" case.
  const analyses: SeedAnalysis[] = [
    {
      id: "AN-2026-0135",
      sampleId: "sample-007",
      createdAt: "2026-05-15T10:00:00.000Z",
    },
    {
      id: "AN-2026-0136",
      sampleId: "sample-003",
      createdAt: "2026-05-22T10:00:00.000Z",
    },
    {
      id: "AN-2026-0137",
      sampleId: "sample-005",
      createdAt: "2026-05-10T10:00:00.000Z",
    },
    {
      id: "AN-2026-0138",
      sampleId: "sample-010",
      createdAt: "2026-06-06T10:00:00.000Z",
    },
    {
      id: "AN-2026-0139",
      sampleId: "sample-009",
      createdAt: "2026-06-07T10:00:00.000Z",
    },
    {
      id: "AN-2026-0140",
      sampleId: "sample-008",
      createdAt: "2026-06-08T10:00:00.000Z",
    },
    {
      id: "AN-2026-0141",
      sampleId: "sample-006",
      createdAt: "2026-06-09T10:00:00.000Z",
    },
    {
      id: "AN-2026-0142",
      sampleId: "sample-004",
      createdAt: "2026-06-10T10:00:00.000Z",
    },
    // tx-006 verification series — every sample analyzed so the full
    // escalation is visible step by step.
    {
      id: "AN-2026-0200",
      sampleId: "sample-011",
      createdAt: "2023-01-01T08:00:00.000Z",
    },
    {
      id: "AN-2026-0201",
      sampleId: "sample-012",
      createdAt: "2023-06-01T08:00:00.000Z",
    },
    {
      id: "AN-2026-0202",
      sampleId: "sample-013",
      createdAt: "2024-01-01T08:00:00.000Z",
    },
    {
      id: "AN-2026-0203",
      sampleId: "sample-014",
      createdAt: "2024-06-01T08:00:00.000Z",
    },
    {
      id: "AN-2026-0204",
      sampleId: "sample-015",
      createdAt: "2025-01-01T08:00:00.000Z",
    },
    {
      id: "AN-2026-0205",
      sampleId: "sample-016",
      createdAt: "2025-06-01T08:00:00.000Z",
    },
    {
      id: "AN-2026-0206",
      sampleId: "sample-017",
      createdAt: "2026-01-01T08:00:00.000Z",
    },
    // tx-007 field history — every sample analyzed so the full 3-year trend
    // (post-overhaul through the latest 2025 samples) is visible.
    {
      id: "AN-2026-0300",
      sampleId: "sample-018",
      createdAt: "2022-05-04T09:00:00.000Z",
    },
    {
      id: "AN-2026-0301",
      sampleId: "sample-019",
      createdAt: "2022-06-03T09:00:00.000Z",
    },
    {
      id: "AN-2026-0302",
      sampleId: "sample-020",
      createdAt: "2022-07-08T09:00:00.000Z",
    },
    {
      id: "AN-2026-0303",
      sampleId: "sample-021",
      createdAt: "2022-08-10T09:00:00.000Z",
    },
    {
      id: "AN-2026-0304",
      sampleId: "sample-022",
      createdAt: "2022-09-12T09:00:00.000Z",
    },
    {
      id: "AN-2026-0305",
      sampleId: "sample-023",
      createdAt: "2022-10-26T09:00:00.000Z",
    },
    {
      id: "AN-2026-0306",
      sampleId: "sample-024",
      createdAt: "2022-11-05T09:00:00.000Z",
    },
    {
      id: "AN-2026-0307",
      sampleId: "sample-025",
      createdAt: "2022-12-12T09:00:00.000Z",
    },
    {
      id: "AN-2026-0308",
      sampleId: "sample-026",
      createdAt: "2023-04-11T09:00:00.000Z",
    },
    {
      id: "AN-2026-0309",
      sampleId: "sample-027",
      createdAt: "2023-10-17T09:00:00.000Z",
    },
    {
      id: "AN-2026-0310",
      sampleId: "sample-028",
      createdAt: "2024-01-15T09:00:00.000Z",
    },
    {
      id: "AN-2026-0311",
      sampleId: "sample-029",
      createdAt: "2024-06-20T09:00:00.000Z",
    },
    {
      id: "AN-2026-0312",
      sampleId: "sample-030",
      createdAt: "2024-09-23T09:00:00.000Z",
    },
    {
      id: "AN-2026-0313",
      sampleId: "sample-031",
      createdAt: "2024-12-19T09:00:00.000Z",
    },
    {
      id: "AN-2026-0314",
      sampleId: "sample-032",
      createdAt: "2025-05-27T09:00:00.000Z",
    },
    {
      id: "AN-2026-0315",
      sampleId: "sample-033",
      createdAt: "2025-05-28T09:00:00.000Z",
    },
    {
      id: "AN-2026-0316",
      sampleId: "sample-034",
      createdAt: "2025-05-31T09:00:00.000Z",
    },
    // tx-008 — all 3 analyzed; sample-037 is the Triangle-4-C demonstration.
    {
      id: "AN-2026-0400",
      sampleId: "sample-035",
      createdAt: "2026-04-01T09:00:00.000Z",
    },
    {
      id: "AN-2026-0401",
      sampleId: "sample-036",
      createdAt: "2026-05-05T09:00:00.000Z",
    },
    {
      id: "AN-2026-0402",
      sampleId: "sample-037",
      createdAt: "2026-06-12T09:00:00.000Z",
    },
  ];

  const sampleById = new Map(samples.map((s) => [s.id, s]));
  const transformerById = new Map(transformers.map((t) => [t.id, t]));

  for (const transformer of transformers) {
    await prisma.transformer.create({
      data: {
        ...transformer,
        commissioningDate: parseDate(transformer.commissioningDate),
      },
    });
  }

  for (const sample of samples) {
    await prisma.dgaSample.create({
      data: {
        id: sample.id,
        transformerId: sample.transformerId,
        sampleDate: parseDate(sample.sampleDate),
        h2: sample.h2,
        ch4: sample.ch4,
        c2h6: sample.c2h6,
        c2h4: sample.c2h4,
        c2h2: sample.c2h2,
        co: sample.co,
        co2: sample.co2,
        o2: sample.o2,
        n2: sample.n2,
        remarks: sample.remarks,
      },
    });
  }

  for (const analysis of analyses) {
    const sample = sampleById.get(analysis.sampleId);
    const transformer = transformerById.get(sample?.transformerId ?? "");
    if (!sample || !transformer) continue;

    const previousSamples = findPreviousSamples(samples, sample);
    const sampleInput: GasSampleInput & {
      o2: number | null;
      n2: number | null;
    } = {
      h2: sample.h2,
      ch4: sample.ch4,
      c2h6: sample.c2h6,
      c2h4: sample.c2h4,
      c2h2: sample.c2h2,
      co: sample.co,
      co2: sample.co2,
      o2: sample.o2,
      n2: sample.n2,
    };

    const pipeline = runAnalysisPipeline(
      sampleInput,
      previousSamples,
      parseDate(transformer.commissioningDate),
      parseDate(sample.sampleDate),
    );

    const created = await prisma.analysisResult.create({
      data: {
        id: analysis.id,
        transformerId: sample.transformerId,
        sampleId: sample.id,
        normProfile: pipeline.normProfile,
        o2n2Ratio: pipeline.o2n2Ratio,
        status: pipeline.status,
        statusResult: toJson(pipeline.statusResult),
        rateResult: toJson(pipeline.rate),
        keyGasResult: toJson(pipeline.keyGas),
        doernenburgResult: toJson(pipeline.doernenburg),
        duvalTriangleResult: toJson(pipeline.duvalTriangle),
        duvalPentagon1Result: toJson(pipeline.duvalPentagon1),
        duvalPentagon2Result: toJson(pipeline.duvalPentagon2),
        recommendationResult: toJson(pipeline.recommendation),
        createdAt: new Date(analysis.createdAt),
      },
    });

    await prisma.deltaResult.create({
      data: {
        analysisId: created.id,
        ...deltaResultToScalars(pipeline.delta),
      },
    });
  }

  console.log(
    `Seeded demo admin plus ${transformers.length} transformers, ${samples.length} samples, ${analyses.length} analyses.`,
  );
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
