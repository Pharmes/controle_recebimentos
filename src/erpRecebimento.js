export const DEFAULT_CDFILD = "12";

export const ERP_WINDOW = {
  startOffsetDays: -1,
  endOffsetDays: 5,
};

export const RECEBIMENTO_ERP_QUERY = `
SELECT
    v.cdfil,
    v.nrrqu,
    v.serier,
    v.nomepa,
    v.dtentr,
    v.hrcad,
    v.dtret,
    v.hrret,
    v.cdfild,
    p.cdetapa,
    p.cdopera
FROM
    fc12100 v
INNER JOIN
    fc12500 p ON p.nrrqu = v.nrrqu
    AND p.cdfil  = v.cdfil
    AND p.serier = v.serier
WHERE 1=1
    AND v.dtret BETWEEN {startDate} AND {endDate}
    AND v.cdfild IN (12)
    AND p.cdetapa IN ('08','10');
`.trim();

export function buildRecebimentoErpQuery(
  cdfilds = [DEFAULT_CDFILD],
  { startDate, endDate } = {},
) {
  const branchList = cdfilds
    .map((cdfild) => Number.parseInt(cdfild, 10))
    .filter((cdfild) => Number.isFinite(cdfild))
    .join(", ");

  const rangeStart = startDate ? toFirebirdDateLiteral(startDate) : "current_date - 1";
  const rangeEnd = endDate ? toFirebirdDateLiteral(endDate) : "current_date + 5";

  return RECEBIMENTO_ERP_QUERY.replace("{startDate}", rangeStart)
    .replace("{endDate}", rangeEnd)
    .replace("AND v.cdfild IN (12)", `AND v.cdfild IN (${branchList || DEFAULT_CDFILD})`);
}

const STATUS_BY_STEP_OPERATION = {
  "08:1": {
    status: "pendentes",
    statusLabel: "Pendente",
  },
  "08:2": {
    status: "a-receber",
    statusLabel: "A receber",
  },
  "10:1": {
    status: "recebido",
    statusLabel: "Recebido",
  },
};

const STEP_LABELS = {
  "08": "Logistica",
  10: "Balcao",
};

const OPERATION_LABELS = {
  1: "Entrada",
  2: "Saida",
};

export function getStatusFromErp(row) {
  const cdetapa = normalizeStep(getField(row, "cdetapa"));
  const cdopera = normalizeOperation(getField(row, "cdopera"));

  return STATUS_BY_STEP_OPERATION[`${cdetapa}:${cdopera}`] ?? null;
}

export function normalizeErpRows(rows) {
  return rows
    .map((row) => normalizeErpRow(row))
    .filter((row) => row.status !== "ignorado");
}

export function getDestinationBranches(rows) {
  return [...new Set(rows.map((row) => row.cdfild).filter(Boolean))].sort((a, b) =>
    Number(a) - Number(b),
  );
}

export function createMockErpRows(referenceDate = new Date()) {
  const rows = [
    ["12", "22091", "1", "Ana Silva", -2, "08:20", 0, "10:40", "12", "08", 2],
    ["12", "22092", "1", "Marcos Souza", -1, "09:10", 0, "11:25", "12", "08", 1],
    ["12", "22093", "2", "Claudia Rocha", -1, "10:30", 1, "12:10", "12", "10", 1],
    ["7", "22094", "1", "Renata Alves", 0, "08:45", 1, "13:20", "12", "08", 2],
    ["7", "22095", "1", "Paulo Roberto", 0, "11:15", 2, "09:30", "12", "08", 1],
    ["8", "22096", "1", "Juliana Martins", 0, "13:35", 2, "15:00", "12", "10", 1],
    ["8", "22097", "2", "Luciana Costa", 1, "09:50", 3, "10:30", "12", "08", 2],
    ["9", "22098", "1", "Sofia Almeida", 1, "12:05", 3, "14:45", "12", "08", 2],
    ["9", "22099", "1", "Eduardo Lima", 1, "14:10", 4, "16:15", "12", "08", 1],
    ["10", "22100", "1", "Bianca Torres", 2, "08:25", 4, "09:55", "12", "10", 1],
    ["10", "22101", "2", "Helena Rocha", 2, "10:40", 5, "11:40", "12", "08", 2],
    ["11", "22102", "1", "Rafael Moreira", 3, "15:20", 5, "17:00", "12", "08", 1],
    ["11", "22103", "1", "Marina Duarte", 3, "09:05", 5, "13:35", "14", "08", 2],
    ["12", "22104", "2", "Carlos Henrique", 4, "11:55", 5, "15:25", "14", "10", 1],
    ["13", "22105", "1", "Beatriz Nunes", 4, "08:00", 6, "10:10", "15", "08", 1],
  ];

  return rows.map(
    ([
      cdfil,
      nrrqu,
      serier,
      nomepa,
      dtentrOffset,
      hrcad,
      dtretOffset,
      hrret,
      cdfild,
      cdetapa,
      cdopera,
    ]) => ({
      cdfil,
      nrrqu,
      serier,
      nomepa,
      dtentr: formatDateInput(addDays(referenceDate, dtentrOffset)),
      hrcad,
      dtret: formatDateInput(addDays(referenceDate, dtretOffset)),
      hrret,
      cdfild,
      cdetapa,
      cdopera,
    }),
  );
}

export function formatDateInput(date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

export function addDays(date, days) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}

function normalizeErpRow(row) {
  const cdfil = normalizeCode(getField(row, "cdfil"));
  const nrrqu = normalizeCode(getField(row, "nrrqu"));
  const serier = normalizeCode(getField(row, "serier"));
  const nomepa = normalizeCode(getField(row, "nomepa"));
  const cdfild = normalizeCode(getField(row, "cdfild"));
  const cdetapa = normalizeStep(getField(row, "cdetapa"));
  const cdopera = normalizeOperation(getField(row, "cdopera"));
  const statusMeta = STATUS_BY_STEP_OPERATION[`${cdetapa}:${cdopera}`];
  const request = `${cdfil}-${nrrqu}-${serier}`;

  return {
    id: request,
    request,
    title: nomepa || `Requisicao ${request}`,
    cdfil,
    nrrqu,
    serier,
    nomepa,
    dtentr: normalizeDate(getField(row, "dtentr")),
    hrcad: normalizeTime(getField(row, "hrcad")),
    dtret: normalizeDate(getField(row, "dtret")),
    hrret: normalizeTime(getField(row, "hrret")),
    cdfild,
    cdetapa,
    cdopera,
    stepLabel: `${cdetapa} - ${STEP_LABELS[cdetapa] ?? "Etapa"}`,
    operationLabel: `${cdopera} - ${OPERATION_LABELS[cdopera] ?? "Operacao"}`,
    origin: `Filial origem ${cdfil}`,
    destination: `Filial destino ${cdfild}`,
    status: statusMeta?.status ?? "ignorado",
    statusLabel: statusMeta?.statusLabel ?? "Ignorado",
  };
}

function getField(row, field) {
  return row[field] ?? row[field.toUpperCase()] ?? row[field.toLowerCase()];
}

function normalizeCode(value) {
  return String(value ?? "").trim();
}

function normalizeStep(value) {
  return normalizeCode(value).padStart(2, "0");
}

function normalizeOperation(value) {
  const operation = Number.parseInt(normalizeCode(value), 10);

  return Number.isFinite(operation) ? String(operation) : normalizeCode(value);
}

function normalizeDate(value) {
  if (value instanceof Date) {
    return formatDateInput(value);
  }

  const text = normalizeCode(value);

  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    return text;
  }

  if (/^\d{2}\/\d{2}\/\d{4}$/.test(text)) {
    const [day, month, year] = text.split("/");
    return `${year}-${month}-${day}`;
  }

  return text;
}

function normalizeTime(value) {
  if (value instanceof Date) {
    return [value.getHours(), value.getMinutes()]
      .map((part) => String(part).padStart(2, "0"))
      .join(":");
  }

  const text = normalizeCode(value);
  const match = text.match(/^(\d{1,2}):(\d{2})/);

  if (match) {
    return `${match[1].padStart(2, "0")}:${match[2]}`;
  }

  return text;
}

function toFirebirdDateLiteral(value) {
  return `CAST('${normalizeDate(value)}' AS DATE)`;
}
