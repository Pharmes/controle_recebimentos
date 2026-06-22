import FirebirdModule from "node-firebird";
import { addDays, buildRecebimentoErpQuery } from "../src/erpRecebimento.js";
import { getDelaySetting } from "./configuracao.js";
import { DEFAULT_DELAY_HOURS, normalizeDelayHours } from "../src/delaySettings.js";

const Firebird = FirebirdModule.default || FirebirdModule;

const ERP_WINDOW = {
  startOffsetDays: -1,
  endOffsetDays: 5,
};

const FILIAL_DESTINO_IDS = ["1", "2", "7", "8", "9", "12", "13", "20"];

const FIREBIRD_OPTIONS = {
  host: process.env.FIREBIRD_HOST || "192.168.1.128",
  port: Number.parseInt(process.env.FIREBIRD_PORT || "3050", 10),
  database: process.env.FIREBIRD_DATABASE || "C:\\FCerta\\DB\\ALTERDB.ib",
  user: process.env.FIREBIRD_USER || "PH_LUCA",
  password: process.env.FIREBIRD_PASSWORD || "KHJEkcEjqfJE",
  lowercase_keys: true,
  encoding: "UTF8",
  connectTimeout: 15000,
};

export default async function handler(request, response) {
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    response.status(405).json({
      error: "Method not allowed",
    });
    return;
  }

  const url = new URL(request.url, `https://${request.headers.host}`);
  const cdfilds = parseCdfilds(url.searchParams.get("cdfild") || url.searchParams.get("branches"));
  const startDate = url.searchParams.get("start") || formatDateInTimeZone(addDays(new Date(), ERP_WINDOW.startOffsetDays));
  const endDate = url.searchParams.get("end") || formatDateInTimeZone(addDays(new Date(), ERP_WINDOW.endOffsetDays));
  const delayHours = await resolveDelayHours(url.searchParams.get("delayHours"));
  const query = buildRecebimentoErpQuery(cdfilds, { startDate, endDate, delayHours });

  try {
    const rows = await queryFirebird(query);

    response.status(200).json({
      rows,
      meta: {
        cdfilds,
        startDate,
        endDate,
        delayHours,
        count: rows.length,
        query,
        source: "firebird",
      },
    });
  } catch (error) {
    response.status(500).json({
      error: "Failed to load recebimento data from Firebird.",
      detail: error instanceof Error ? error.message : String(error),
      source: {
        host: FIREBIRD_OPTIONS.host,
        port: FIREBIRD_OPTIONS.port,
        database: FIREBIRD_OPTIONS.database,
      },
    });
  }
}

async function resolveDelayHours(queryValue) {
  if (queryValue) {
    return normalizeDelayHours(queryValue);
  }

  try {
    const setting = await getDelaySetting();

    return normalizeDelayHours(setting?.prazoAtrasoHoras);
  } catch {
    return DEFAULT_DELAY_HOURS;
  }
}

function queryFirebird(sql) {
  return new Promise((resolve, reject) => {
    Firebird.attach(FIREBIRD_OPTIONS, (attachError, db) => {
      if (attachError) {
        reject(attachError);
        return;
      }

      db.query(sql, (queryError, rows) => {
        db.detach(() => {
          if (queryError) {
            reject(queryError);
            return;
          }

          resolve(Array.isArray(rows) ? rows : []);
        });
      });
    });
  });
}

function parseCdfilds(value) {
  const requested = normalizeCode(value);
  const source = !requested || requested === "all" ? FILIAL_DESTINO_IDS.join(",") : requested;
  const cdfilds = source
    .split(",")
    .map((cdfild) => normalizeCode(cdfild))
    .filter((cdfild) => FILIAL_DESTINO_IDS.includes(cdfild))
    .filter(Boolean);

  return [...new Set(cdfilds)].length > 0 ? [...new Set(cdfilds)] : FILIAL_DESTINO_IDS;
}

function normalizeCode(value) {
  return String(value ?? "").trim();
}

function formatDateInTimeZone(date, timeZone = "America/Sao_Paulo") {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const lookup = Object.fromEntries(
    parts.filter((part) => part.type !== "literal").map((part) => [part.type, part.value]),
  );

  return `${lookup.year}-${lookup.month}-${lookup.day}`;
}
