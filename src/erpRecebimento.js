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
LEFT JOIN
    fc12530 p ON p.nrrqu = v.nrrqu
    AND p.cdfil = v.cdfil
    AND p.serier = v.serier
    AND p.cdetapa IN ('00', '08', '10')
WHERE 1=1
    AND v.dtret BETWEEN {startDate} AND {endDate}
    AND v.cdfild IN ({branchList})
    AND v.tpformafarma NOT IN (6,7,8)
`.trim();

export const ATRASADOS_ERP_QUERY = `
SELECT
    v.cdfil,
    v.nrrqu,
    v.serier,
    v.nomepa,
    v.dtentr,
    v.hrcad,
    v.dtret,
    EXTRACT(HOUR FROM v.hrret) hrret,
    v.cdfild
FROM
    fc12100 v
WHERE 1=1
    AND v.dtret >= {startDate}
    AND v.dtret <= {endDate}
    AND v.cdfild IN ({branchList})
    AND v.tpformafarma NOT IN (6,7,8,13)
    AND EXTRACT(HOUR FROM v.hrret) NOT IN ('3')
    AND NOT EXISTS (
        SELECT 1
        FROM fc12500 prd
        WHERE 1=1
            AND prd.nrrqu = v.nrrqu
            AND prd.cdfil = v.cdfil
            AND prd.cdetapa = '08'
    )
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
    .replace("{branchList}", branchList || DEFAULT_CDFILD);
}

export function buildAtrasadosErpQuery(
  cdfilds = [DEFAULT_CDFILD],
  { startDate, endDate } = {},
) {
  const branchList = cdfilds
    .map((cdfild) => Number.parseInt(cdfild, 10))
    .filter((cdfild) => Number.isFinite(cdfild))
    .join(", ");

  const rangeStart = startDate ? toFirebirdDateLiteral(startDate) : "current_date - 30";
  const rangeEnd = endDate ? toFirebirdDateLiteral(endDate) : "current_date";

  return ATRASADOS_ERP_QUERY.replace("{startDate}", rangeStart)
    .replace("{endDate}", rangeEnd)
    .replace("{branchList}", branchList || DEFAULT_CDFILD);
}

const STATUS_BY_STEP_OPERATION = {
  "00:0": {
    status: "pendentes",
    statusLabel: "Pendente",
  },
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

const STATUS_PRIORITY = {
  pendentes: 1,
  "a-receber": 2,
  recebido: 3,
};

const STEP_LABELS = {
  "08": "Logistica",
  10: "Balcao",
};

const OPERATION_LABELS = {
  1: "Entrada",
  2: "Saida",
};

export function normalizeErpRows(rows) {
  const normalizedRows = rows
    .map((row) => normalizeErpRow(row))
    .filter((row) => row.status !== "ignorado");

  return getCurrentRowsByRequest(normalizedRows);
}

export function normalizeLateErpRows(rows) {
  return rows.map((row) => normalizeLateErpRow(row));
}

export function getDestinationBranches(rows) {
  return [...new Set(rows.map((row) => row.cdfild).filter(Boolean))].sort((a, b) =>
    Number(a) - Number(b),
  );
}

export function createMockErpRows(referenceDate = new Date()) {
  return [
    {
      cdfil: "12",
      nrrqu: "22090",
      serier: "1",
      nomepa: "Daniela Martins",
      dtentr: formatDateInput(addDays(referenceDate, -4)),
      hrcad: "07:55",
      dtret: formatDateInput(addDays(referenceDate, -2)),
      hrret: "10:00",
      cdfild: "12",
      cdetapa: "08",
      cdopera: 1,
    },
    {
      cdfil: "12",
      nrrqu: "22091",
      serier: "1",
      nomepa: "Ana Silva",
      dtentr: formatDateInput(addDays(referenceDate, -2)),
      hrcad: "08:20",
      dtret: formatDateInput(addDays(referenceDate, 0)),
      hrret: "10:40",
      cdfild: "12",
      cdetapa: "08",
      cdopera: 2,
    },
    {
      cdfil: "12",
      nrrqu: "22092",
      serier: "1",
      nomepa: "Marcos Souza",
      dtentr: formatDateInput(addDays(referenceDate, -1)),
      hrcad: "09:10",
      dtret: formatDateInput(addDays(referenceDate, 0)),
      hrret: "11:25",
      cdfild: "12",
      cdetapa: "08",
      cdopera: 1,
    },
    {
      cdfil: "12",
      nrrqu: "22093",
      serier: "2",
      nomepa: "Claudia Rocha",
      dtentr: formatDateInput(addDays(referenceDate, -1)),
      hrcad: "10:30",
      dtret: formatDateInput(addDays(referenceDate, 1)),
      hrret: "12:10",
      cdfild: "12",
      cdetapa: "10",
      cdopera: 1,
    },
    {
      cdfil: "7",
      nrrqu: "22094",
      serier: "1",
      nomepa: "Renata Alves",
      dtentr: formatDateInput(addDays(referenceDate, 0)),
      hrcad: "08:45",
      dtret: formatDateInput(addDays(referenceDate, 1)),
      hrret: "13:20",
      cdfild: "12",
      cdetapa: "08",
      cdopera: 2,
    },
    {
      cdfil: "7",
      nrrqu: "22095",
      serier: "1",
      nomepa: "Paulo Roberto",
      dtentr: formatDateInput(addDays(referenceDate, 0)),
      hrcad: "11:15",
      dtret: formatDateInput(addDays(referenceDate, 2)),
      hrret: "09:30",
      cdfild: "12",
      cdetapa: "08",
      cdopera: 1,
    },
    {
      cdfil: "8",
      nrrqu: "22096",
      serier: "1",
      nomepa: "Juliana Martins",
      dtentr: formatDateInput(addDays(referenceDate, 0)),
      hrcad: "13:35",
      dtret: formatDateInput(addDays(referenceDate, 2)),
      hrret: "15:00",
      cdfild: "12",
      cdetapa: "10",
      cdopera: 1,
    },
    {
      cdfil: "8",
      nrrqu: "22097",
      serier: "2",
      nomepa: "Luciana Costa",
      dtentr: formatDateInput(addDays(referenceDate, 1)),
      hrcad: "09:50",
      dtret: formatDateInput(addDays(referenceDate, 3)),
      hrret: "10:30",
      cdfild: "12",
      cdetapa: "08",
      cdopera: 2,
    },
    {
      cdfil: "9",
      nrrqu: "22098",
      serier: "1",
      nomepa: "Sofia Almeida",
      dtentr: formatDateInput(addDays(referenceDate, 1)),
      hrcad: "12:05",
      dtret: formatDateInput(addDays(referenceDate, 3)),
      hrret: "14:45",
      cdfild: "12",
      cdetapa: "08",
      cdopera: 2,
    },
    {
      cdfil: "9",
      nrrqu: "22099",
      serier: "1",
      nomepa: "Eduardo Lima",
      dtentr: formatDateInput(addDays(referenceDate, 1)),
      hrcad: "14:10",
      dtret: formatDateInput(addDays(referenceDate, 4)),
      hrret: "16:15",
      cdfild: "12",
      cdetapa: "08",
      cdopera: 1,
    },
    {
      cdfil: "10",
      nrrqu: "22100",
      serier: "1",
      nomepa: "Bianca Torres",
      dtentr: formatDateInput(addDays(referenceDate, 2)),
      hrcad: "08:25",
      dtret: formatDateInput(addDays(referenceDate, 4)),
      hrret: "09:55",
      cdfild: "12",
      cdetapa: "10",
      cdopera: 1,
    },
    {
      cdfil: "10",
      nrrqu: "22101",
      serier: "2",
      nomepa: "Helena Rocha",
      dtentr: formatDateInput(addDays(referenceDate, 2)),
      hrcad: "10:40",
      dtret: formatDateInput(addDays(referenceDate, 5)),
      hrret: "11:40",
      cdfild: "12",
      cdetapa: "08",
      cdopera: 2,
    },
    {
      cdfil: "11",
      nrrqu: "22102",
      serier: "1",
      nomepa: "Rafael Moreira",
      dtentr: formatDateInput(addDays(referenceDate, 3)),
      hrcad: "15:20",
      dtret: formatDateInput(addDays(referenceDate, 5)),
      hrret: "17:00",
      cdfild: "12",
      cdetapa: "08",
      cdopera: 1,
    },
    {
      cdfil: "11",
      nrrqu: "22103",
      serier: "1",
      nomepa: "Marina Duarte",
      dtentr: formatDateInput(addDays(referenceDate, 3)),
      hrcad: "09:05",
      dtret: formatDateInput(addDays(referenceDate, 5)),
      hrret: "13:35",
      cdfild: "14",
      cdetapa: "08",
      cdopera: 2,
    },
    {
      cdfil: "12",
      nrrqu: "22104",
      serier: "2",
      nomepa: "Carlos Henrique",
      dtentr: formatDateInput(addDays(referenceDate, 4)),
      hrcad: "11:55",
      dtret: formatDateInput(addDays(referenceDate, 5)),
      hrret: "15:25",
      cdfild: "14",
      cdetapa: "10",
      cdopera: 1,
    },
    {
      cdfil: "13",
      nrrqu: "22105",
      serier: "1",
      nomepa: "Beatriz Nunes",
      dtentr: formatDateInput(addDays(referenceDate, 4)),
      hrcad: "08:00",
      dtret: formatDateInput(addDays(referenceDate, 6)),
      hrret: "10:10",
      cdfild: "15",
      cdetapa: "08",
      cdopera: 1,
    },
    {
      cdfil: "12",
      nrrqu: "22106",
      serier: "1",
      nomepa: "Patricia Lima",
      dtentr: formatDateInput(addDays(referenceDate, -3)),
      hrcad: "07:40",
      dtret: formatDateInput(addDays(referenceDate, -1)),
      hrret: "08:55",
      cdfild: "12",
      cdetapa: "08",
      cdopera: 2,
    },
    {
      cdfil: "7",
      nrrqu: "22107",
      serier: "1",
      nomepa: "Diego Martins",
      dtentr: formatDateInput(addDays(referenceDate, -2)),
      hrcad: "09:15",
      dtret: formatDateInput(addDays(referenceDate, 0)),
      hrret: "14:05",
      cdfild: "12",
      cdetapa: "08",
      cdopera: 2,
    },
    {
      cdfil: "8",
      nrrqu: "22108",
      serier: "1",
      nomepa: "Fernanda Alves",
      dtentr: formatDateInput(addDays(referenceDate, -1)),
      hrcad: "10:50",
      dtret: formatDateInput(addDays(referenceDate, 1)),
      hrret: "15:45",
      cdfild: "12",
      cdetapa: "10",
      cdopera: 1,
    },
    {
      cdfil: "9",
      nrrqu: "22109",
      serier: "2",
      nomepa: "Rogério Costa",
      dtentr: formatDateInput(addDays(referenceDate, 0)),
      hrcad: "12:30",
      dtret: formatDateInput(addDays(referenceDate, 2)),
      hrret: "16:20",
      cdfild: "12",
      cdetapa: "08",
      cdopera: 2,
    },
    {
      cdfil: "10",
      nrrqu: "22110",
      serier: "1",
      nomepa: "Larissa Gomes",
      dtentr: formatDateInput(addDays(referenceDate, 0)),
      hrcad: "13:05",
      dtret: formatDateInput(addDays(referenceDate, 3)),
      hrret: "18:10",
      cdfild: "12",
      cdetapa: "08",
      cdopera: 1,
    },
    {
      cdfil: "11",
      nrrqu: "22111",
      serier: "1",
      nomepa: "Tiago Fernandes",
      dtentr: formatDateInput(addDays(referenceDate, 1)),
      hrcad: "14:25",
      dtret: formatDateInput(addDays(referenceDate, 4)),
      hrret: "19:30",
      cdfild: "12",
      cdetapa: "10",
      cdopera: 1,
    },
    {
      cdfil: "12",
      nrrqu: "22112",
      serier: "2",
      nomepa: "Camila Rocha",
      dtentr: formatDateInput(addDays(referenceDate, 1)),
      hrcad: "15:40",
      dtret: formatDateInput(addDays(referenceDate, 4)),
      hrret: "20:05",
      cdfild: "12",
      cdetapa: "08",
      cdopera: 2,
    },
    {
      cdfil: "13",
      nrrqu: "22113",
      serier: "1",
      nomepa: "Gustavo Ribeiro",
      dtentr: formatDateInput(addDays(referenceDate, 2)),
      hrcad: "16:15",
      dtret: formatDateInput(addDays(referenceDate, 5)),
      hrret: "21:15",
      cdfild: "12",
      cdetapa: "08",
      cdopera: 1,
    },
    {
      cdfil: "12",
      nrrqu: "22114",
      serier: "1",
      nomepa: "Leticia Barros",
      dtentr: formatDateInput(addDays(referenceDate, -1)),
      hrcad: "07:20",
      dtret: formatDateInput(addDays(referenceDate, 0)),
      hrret: "12:05",
      cdfild: "12",
      cdetapa: "08",
      cdopera: 2,
    },
    {
      cdfil: "7",
      nrrqu: "22115",
      serier: "2",
      nomepa: "Andre Luiz",
      dtentr: formatDateInput(addDays(referenceDate, 0)),
      hrcad: "11:35",
      dtret: formatDateInput(addDays(referenceDate, 2)),
      hrret: "14:55",
      cdfild: "12",
      cdetapa: "08",
      cdopera: 1,
    },
  ];
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

function addDaysString(dateText, days) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateText)) {
    return "";
  }

  const [year, month, day] = dateText.split("-").map((part) => Number.parseInt(part, 10));
  const baseDate = new Date(Date.UTC(year, month - 1, day));
  baseDate.setUTCDate(baseDate.getUTCDate() + days);

  return [
    baseDate.getUTCFullYear(),
    String(baseDate.getUTCMonth() + 1).padStart(2, "0"),
    String(baseDate.getUTCDate()).padStart(2, "0"),
  ].join("-");
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
  const effectiveStatusMeta = statusMeta;
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
    status: effectiveStatusMeta?.status ?? "ignorado",
    statusLabel: effectiveStatusMeta?.statusLabel ?? "Ignorado",
  };
}

function normalizeLateErpRow(row) {
  const cdfil = normalizeCode(getField(row, "cdfil"));
  const nrrqu = normalizeCode(getField(row, "nrrqu"));
  const serier = normalizeCode(getField(row, "serier"));
  const nomepa = normalizeCode(getField(row, "nomepa"));
  const cdfild = normalizeCode(getField(row, "cdfild"));
  const request = `${cdfil}-${nrrqu}-${serier}`;
  const dtret = normalizeDate(getField(row, "dtret"));

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
    dtret,
    hrret: normalizeTime(getField(row, "hrret")),
    cdfild,
    cdetapa: "08",
    cdopera: "0",
    lateAfterDate: addDaysString(dtret, 1),
    lateAfterAt: buildLateAfterAt(dtret, getField(row, "hrret")),
    stepLabel: "08 - Logistica",
    operationLabel: "Sem PCP de saida",
    origin: `Filial origem ${cdfil}`,
    destination: `Filial destino ${cdfild}`,
    status: "pendentes",
    statusLabel: "Atrasado",
  };
}

function getCurrentRowsByRequest(rows) {
  const rowsByRequest = new Map();

  rows.forEach((row) => {
    const currentRow = rowsByRequest.get(row.id);

    if (!currentRow || compareCurrentStatus(row, currentRow) > 0) {
      rowsByRequest.set(row.id, row);
    }
  });

  return [...rowsByRequest.values()];
}

function compareCurrentStatus(nextRow, currentRow) {
  const nextPriority = STATUS_PRIORITY[nextRow.status] ?? 0;
  const currentPriority = STATUS_PRIORITY[currentRow.status] ?? 0;

  if (nextPriority !== currentPriority) {
    return nextPriority - currentPriority;
  }

  return compareDateTime(nextRow.dtentr, nextRow.hrcad, currentRow.dtentr, currentRow.hrcad);
}

function compareDateTime(nextDate, nextTime, currentDate, currentTime) {
  const nextValue = `${nextDate || ""}T${nextTime || "00:00"}`;
  const currentValue = `${currentDate || ""}T${currentTime || "00:00"}`;

  return nextValue.localeCompare(currentValue);
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

function buildLateAfterAt(dateText, timeValue) {
  const nextDate = addDaysString(dateText, 1);

  if (!nextDate) {
    return "";
  }

  const { hour, minute } = parseTimeParts(timeValue);
  const triggerHour = getLateTriggerHour(hour);
  const normalizedMinute = Number.isFinite(minute) ? minute : 0;

  return `${nextDate}T${String(triggerHour).padStart(2, "0")}:${String(normalizedMinute).padStart(2, "0")}:00`;
}

function getLateTriggerHour(hour) {
  if (!Number.isFinite(hour)) {
    return 19;
  }

  if (hour >= 19) {
    return 19;
  }

  return Math.max(hour - 2, 0);
}

function parseTimeParts(value) {
  if (value instanceof Date) {
    return {
      hour: value.getHours(),
      minute: value.getMinutes(),
    };
  }

  const text = normalizeCode(value);
  const match = text.match(/^(\d{1,2})(?::(\d{2}))?/);

  if (!match) {
    return {
      hour: Number.NaN,
      minute: 0,
    };
  }

  return {
    hour: Number.parseInt(match[1], 10),
    minute: Number.parseInt(match[2] || "0", 10),
  };
}

function normalizeDate(value) {
  if (value instanceof Date) {
    return formatDateInput(value);
  }

  const text = normalizeCode(value);

  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    return text;
  }

  if (/^\d{4}-\d{2}-\d{2}T/.test(text)) {
    return text.slice(0, 10);
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
