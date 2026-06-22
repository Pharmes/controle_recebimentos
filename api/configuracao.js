import {
  ALLOWED_DELAY_HOURS,
  DEFAULT_DELAY_HOURS,
  DELAY_SETTING_KEY,
  normalizeDelayHours,
} from "../src/delaySettings.js";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const SUPABASE_PROJECT_ID = "dbwgricmddvfetompjcj";
const SUPABASE_URL = process.env.SUPABASE_URL || `https://${SUPABASE_PROJECT_ID}.supabase.co`;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;
const SUPABASE_SETTINGS_SOURCES = [
  { schema: "controle de recebimentos", table: "system_seting" },
  { schema: "public", table: "system_seting" },
  { schema: "public", table: "system_settings" },
];
const LOCAL_SETTINGS_PATH = path.join(process.cwd(), ".local", "system-settings.json");

export default async function handler(request, response) {
  if (!["GET", "PUT"].includes(request.method)) {
    response.setHeader("Allow", "GET, PUT");
    response.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    if (request.method === "GET") {
      response.status(200).json(await readDelaySettingRoute());
      return;
    }

    const body = await readJsonBody(request);
    const requestedHours = Number.parseInt(String(body?.prazoAtrasoHoras ?? ""), 10);

    if (!ALLOWED_DELAY_HOURS.includes(requestedHours)) {
      response.status(400).json({
        error: "Prazo invalido.",
        allowedValues: ALLOWED_DELAY_HOURS,
      });
      return;
    }

    response.status(200).json({
      ...(await saveDelaySettingRoute(normalizeDelayHours(requestedHours))),
      message: "Configuracao salva com sucesso.",
    });
  } catch (error) {
    response.status(500).json({
      error: "Falha ao acessar configuracao no Supabase.",
      detail: error instanceof Error ? error.message : String(error),
    });
  }
}

export async function getDelaySetting() {
  if (!SUPABASE_SERVICE_ROLE_KEY) {
    return readLocalDelaySetting();
  }

  return readDelaySetting();
}

function readDelaySettingRoute() {
  return SUPABASE_SERVICE_ROLE_KEY ? readDelaySetting() : readLocalDelaySetting();
}

function saveDelaySettingRoute(prazoAtrasoHoras) {
  return SUPABASE_SERVICE_ROLE_KEY
    ? saveDelaySetting(prazoAtrasoHoras)
    : saveLocalDelaySetting(prazoAtrasoHoras);
}

async function readLocalDelaySetting() {
  try {
    const content = await readFile(LOCAL_SETTINGS_PATH, "utf8");
    const settings = JSON.parse(content);
    const row = settings[DELAY_SETTING_KEY];

    return {
      prazoAtrasoHoras: normalizeDelayHours(row?.hours),
      allowedValues: ALLOWED_DELAY_HOURS,
      isDefault: !row,
      source: row ? "local-file" : "default",
      updatedAt: row?.updatedAt ?? null,
      warning: "SUPABASE_SERVICE_ROLE_KEY nao configurada no backend. Usando persistencia local.",
    };
  } catch {
    return {
      prazoAtrasoHoras: DEFAULT_DELAY_HOURS,
      allowedValues: ALLOWED_DELAY_HOURS,
      isDefault: true,
      source: "default",
      updatedAt: null,
      warning: "SUPABASE_SERVICE_ROLE_KEY nao configurada no backend. Usando valor padrao.",
    };
  }
}

async function saveLocalDelaySetting(prazoAtrasoHoras) {
  const updatedAt = new Date().toISOString();

  await mkdir(path.dirname(LOCAL_SETTINGS_PATH), { recursive: true });
  await writeFile(
    LOCAL_SETTINGS_PATH,
    JSON.stringify(
      {
        [DELAY_SETTING_KEY]: {
          hours: prazoAtrasoHoras,
          updatedAt,
        },
      },
      null,
      2,
    ),
  );

  return {
    prazoAtrasoHoras,
    allowedValues: ALLOWED_DELAY_HOURS,
    isDefault: false,
    source: "local-file",
    updatedAt,
    warning: "SUPABASE_SERVICE_ROLE_KEY nao configurada no backend. Configuracao salva localmente.",
  };
}

async function readDelaySetting() {
  const { result } = await supabaseFetchWithFallback((source) => ({
    path: `/rest/v1/${source.table}?key=eq.${encodeURIComponent(DELAY_SETTING_KEY)}&select=key,value,updated_at&limit=1`,
    source,
  }));
  const row = Array.isArray(result) ? result[0] : null;

  return {
    prazoAtrasoHoras: normalizeDelayHours(row?.value?.hours),
    allowedValues: ALLOWED_DELAY_HOURS,
    isDefault: !row,
    source: row ? "supabase" : "default",
    updatedAt: row?.updated_at ?? null,
  };
}

async function saveDelaySetting(prazoAtrasoHoras) {
  const { result } = await supabaseFetchWithFallback((source) => ({
    path: `/rest/v1/${source.table}?on_conflict=key`,
    source,
    options: {
      method: "POST",
      headers: {
        Prefer: "resolution=merge-duplicates,return=representation",
      },
      body: JSON.stringify([
        {
          key: DELAY_SETTING_KEY,
          value: { hours: prazoAtrasoHoras },
          updated_at: new Date().toISOString(),
        },
      ]),
    },
  }));
  const [row] = result;

  return {
    prazoAtrasoHoras: normalizeDelayHours(row?.value?.hours),
    allowedValues: ALLOWED_DELAY_HOURS,
    isDefault: false,
    source: "supabase",
    updatedAt: row?.updated_at ?? null,
  };
}

async function supabaseFetchWithFallback(createRequest) {
  let lastError;

  for (const source of SUPABASE_SETTINGS_SOURCES) {
    try {
      const request = createRequest(source);
      const result = await supabaseFetch(request.path, request.options || {}, request.source);

      return { result, source };
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError;
}

async function supabaseFetch(path, options = {}, source = SUPABASE_SETTINGS_SOURCES[0]) {
  const schemaHeaders =
    source.schema && source.schema !== "public"
      ? {
          "Accept-Profile": source.schema,
          "Content-Profile": source.schema,
        }
      : {};
  const apiResponse = await fetch(`${SUPABASE_URL}${path}`, {
    ...options,
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      ...schemaHeaders,
      ...(options.headers || {}),
    },
  });

  const text = await apiResponse.text();
  const payload = text ? JSON.parse(text) : null;

  if (!apiResponse.ok) {
    throw new Error(payload?.message || payload?.error || `Supabase HTTP ${apiResponse.status}`);
  }

  return payload;
}

function readJsonBody(request) {
  if (request.body) {
    return Promise.resolve(request.body);
  }

  return new Promise((resolve, reject) => {
    let body = "";

    request.on("data", (chunk) => {
      body += chunk;
    });

    request.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(error);
      }
    });

    request.on("error", reject);
  });
}
