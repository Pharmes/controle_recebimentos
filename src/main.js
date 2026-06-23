import "./style.css";
import logoPharmesUrl from "./img/logopharmes.png";
import {
  ERP_WINDOW,
  addDays,
  createMockErpRows,
  formatDateInput,
  normalizeErpRows,
} from "./erpRecebimento.js";
import { ALLOWED_DELAY_HOURS, DEFAULT_DELAY_HOURS, normalizeDelayHours } from "./delaySettings.js";

const app = document.querySelector("#app");
const today = new Date();
const isoToday = formatDateInput(today);
const FILIAL_LABELS = {
  1: "Constança Valadares",
  2: "Santa Rita",
  7: "Tres Rios",
  8: "Botafogo",
  9: "Tijuca",
  12: "Niteroi Centro",
  13: "Niteroi Icarai",
  20: "Manoel Honorio",
};
const ALLOWED_BRANCHES = new Set(Object.keys(FILIAL_LABELS));
const numberFormatter = new Intl.NumberFormat("pt-BR");

function iconTruck() {
  return `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 7.5h11v8H3z"></path>
      <path d="M14 10h3.8L21 13.2V15h-7z"></path>
      <circle cx="7" cy="17.5" r="1.8"></circle>
      <circle cx="17" cy="17.5" r="1.8"></circle>
    </svg>
  `;
}

function iconCheck() {
  return `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M20 7 10.5 16.5 4 10"></path>
    </svg>
  `;
}

function iconClock() {
  return `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="8.5"></circle>
      <path d="M12 7.5V12l3 2"></path>
    </svg>
  `;
}

function iconAlert() {
  return `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 8v5"></path>
      <path d="M12 17h.01"></path>
      <path d="M10.4 4.2 2.7 18a1.6 1.6 0 0 0 1.4 2.4h15.8a1.6 1.6 0 0 0 1.4-2.4L13.6 4.2a1.8 1.8 0 0 0-3.2 0Z"></path>
    </svg>
  `;
}

function iconGear() {
  return `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="3"></circle>
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 0 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1A2 2 0 0 1 4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1A2 2 0 0 1 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3h.1a1.7 1.7 0 0 0 .9-1.5V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1A2 2 0 0 1 19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9v.1a1.7 1.7 0 0 0 1.5.9h.1a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"></path>
    </svg>
  `;
}

function iconFilter() {
  return `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 6h16"></path>
      <path d="M7 12h10"></path>
      <path d="M10 18h4"></path>
      <circle cx="9" cy="6" r="1.5"></circle>
      <circle cx="15" cy="12" r="1.5"></circle>
      <circle cx="12" cy="18" r="1.5"></circle>
    </svg>
  `;
}

function iconExport() {
  return `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3v11"></path>
      <path d="M8 7l4-4 4 4"></path>
      <path d="M5 14v5h14v-5"></path>
    </svg>
  `;
}

app.innerHTML = `
  <div class="app-shell">
    <main class="workspace">
      <header class="topbar">
        <div class="header-title">
          <span class="system-icon-frame" aria-hidden="true">
            <img class="system-icon" src="${logoPharmesUrl}" alt="" />
          </span>
          <div class="headline">
            <h1>Controle de Recebimento</h1>
            <p>Monitoramento por data de retirada na filial destino.</p>
          </div>
        </div>

        <div class="topbar-actions">
          <button class="btn btn-outline btn-settings" id="settingsButton" type="button" aria-haspopup="dialog">
            <span class="btn-icon">${iconGear()}</span>
            <span>Configurações</span>
          </button>
          <button class="btn btn-outline" id="filtersToggle" type="button" aria-expanded="false" aria-controls="filtersPanel">
            <span class="btn-icon">${iconFilter()}</span>
            <span>Filtros</span>
          </button>
          <button class="btn btn-primary" id="exportButton" type="button">
            <span class="btn-icon">${iconExport()}</span>
            <span>Exportar</span>
          </button>
        </div>
      </header>

      <p class="data-status" id="dataStatus" role="status" aria-live="polite" hidden></p>

      <dialog class="settings-modal" id="settingsModal" aria-labelledby="settingsTitle">
        <form class="settings-panel" id="settingsForm" method="dialog">
          <div class="settings-head">
            <span class="settings-icon" aria-hidden="true">${iconGear()}</span>
            <div>
              <h2 id="settingsTitle">Configurações gerais</h2>
              <p>Parâmetros que controlam a lógica operacional do sistema.</p>
            </div>
          </div>

          <fieldset class="settings-fieldset">
            <legend>Prazo para considerar a requisição atrasada</legend>
            <p class="settings-current" id="settingsCurrent">Valor atual: 22 horas</p>
            <div class="delay-options" id="delayOptions">
              ${ALLOWED_DELAY_HOURS.map(
                (hours) => `
                  <label class="delay-option">
                    <input type="radio" name="delayHours" value="${hours}" />
                    <span>
                      <strong>${hours} horas</strong>
                      <small>${formatDelayDescription(hours)}</small>
                    </span>
                  </label>
                `,
              ).join("")}
            </div>
          </fieldset>

          <p class="settings-feedback" id="settingsFeedback" role="status" aria-live="polite" hidden></p>

          <div class="settings-actions">
            <button class="btn btn-outline" id="settingsCancel" type="button">Cancelar</button>
            <button class="btn btn-primary" type="submit">Salvar configuração</button>
          </div>
        </form>
      </dialog>

      <section class="filters-panel" id="filtersPanel" aria-label="Filtros por filial destino e período" hidden>
        <form class="filters-grid" id="filtersForm">
          <label class="field">
            <span>Filial destino</span>
            <select id="branchSelect" name="branch"></select>
          </label>

          <label class="field">
            <span>Etapa</span>
            <select id="stageSelect" name="stage">
              <option value="all" selected>Todos</option>
              <option value="08">08 - Logística</option>
              <option value="10">10 - Balcão</option>
            </select>
          </label>

          <label class="field">
            <span>Requisição</span>
            <input id="requestSearch" type="search" name="request" placeholder="Ex.: 12-22091-1" autocomplete="off" />
          </label>

          <div class="field field-calendar">
            <span>Calendário</span>
            <div class="field-range field-range-calendar">
              <label class="field">
                <span>Início</span>
                <input id="startDate" type="date" />
              </label>
              <label class="field">
                <span>Fim</span>
                <input id="endDate" type="date" />
              </label>
            </div>
          </div>

          <button class="btn btn-secondary filters-apply" type="submit">Aplicar</button>
        </form>
      </section>

      <section class="summary-grid" id="resumo" aria-label="Resumo de status">
        <article class="summary-card summary-total">
          <span class="summary-label">Total monitorado</span>
          <strong class="summary-value" id="countTotal">0</strong>
          <small>Registros no recorte atual</small>
        </article>
        <article class="summary-card status-received">
          <span class="summary-label">Recebido</span>
          <strong class="summary-value" id="countRecebido">0</strong>
          <small>Registro confirmado no balcão</small>
        </article>
        <article class="summary-card status-waiting">
          <span class="summary-label">A receber</span>
          <strong class="summary-value" id="countAReceber">0</strong>
          <small>Saída da logística</small>
        </article>
        <article class="summary-card status-pending">
          <span class="summary-label">Pendentes</span>
          <strong class="summary-value" id="countPendentes">0</strong>
          <small>Entrada na logística</small>
        </article>
        <article class="summary-card status-late">
          <span class="summary-label">Atrasados</span>
          <strong class="summary-value" id="countAtrasados">0</strong>
          <small>Sem PCP de saída após o prazo</small>
        </article>
      </section>

      <section class="kanban" id="kanban" aria-label="Requisições por status de recebimento">
        <article class="column column-a-receber">
          <div class="column-head">
            <div>
              <span class="column-icon" aria-hidden="true">${iconTruck()}</span>
              <h3>A receber</h3>
            </div>
            <span class="badge badge-warn" id="badgeAReceber">0</span>
          </div>
          <div class="column-body" id="col-a-receber"></div>
          <button class="column-footer" type="button" data-status="a-receber" aria-expanded="false">
            <span class="column-footer-label">Ver todos</span>
            <span class="column-footer-count">(0)</span>
            <span class="column-footer-icon" aria-hidden="true">›</span>
          </button>
        </article>

        <article class="column column-recebido">
          <div class="column-head">
            <div>
              <span class="column-icon" aria-hidden="true">${iconCheck()}</span>
              <h3>Recebido</h3>
            </div>
            <span class="badge badge-success" id="badgeRecebido">0</span>
          </div>
          <div class="column-body" id="col-recebido"></div>
          <button class="column-footer" type="button" data-status="recebido" aria-expanded="false">
            <span class="column-footer-label">Ver todos</span>
            <span class="column-footer-count">(0)</span>
            <span class="column-footer-icon" aria-hidden="true">›</span>
          </button>
        </article>

        <article class="column column-pendente">
          <div class="column-head">
            <div>
              <span class="column-icon" aria-hidden="true">${iconClock()}</span>
              <h3>Pendentes</h3>
            </div>
            <span class="badge badge-danger" id="badgePendentes">0</span>
          </div>
          <div class="column-body" id="col-pendentes"></div>
          <button class="column-footer" type="button" data-status="pendentes" aria-expanded="false">
            <span class="column-footer-label">Ver todos</span>
            <span class="column-footer-count">(0)</span>
            <span class="column-footer-icon" aria-hidden="true">›</span>
          </button>
        </article>

        <article class="column column-atrasados">
          <div class="column-head">
            <div>
              <span class="column-icon" aria-hidden="true">${iconAlert()}</span>
              <h3>Atrasados</h3>
            </div>
            <span class="badge badge-danger" id="badgeAtrasados">0</span>
          </div>
          <div class="column-body" id="col-atrasados"></div>
          <button class="column-footer" type="button" data-status="atrasados" aria-expanded="false">
            <span class="column-footer-label">Ver todos</span>
            <span class="column-footer-count">(0)</span>
            <span class="column-footer-icon" aria-hidden="true">›</span>
          </button>
        </article>
      </section>
    </main>
  </div>

  <template id="formula-template">
    <article class="formula-card">
      <button class="formula-top" type="button" aria-expanded="false">
        <span class="formula-icon" aria-hidden="true"></span>
        <div class="formula-heading">
          <p class="formula-meta"></p>
          <h4 class="formula-title"></h4>
        </div>
        <span class="status-chip"></span>
        <span class="formula-chevron" aria-hidden="true">›</span>
      </button>
      <div class="formula-rows" hidden>
        <div class="formula-row">
          <span class="formula-key">Entrada</span>
          <span class="formula-value">
            <span class="formula-entry-date"></span>
            <span class="formula-divider">•</span>
            <span class="formula-entry-time"></span>
          </span>
        </div>
        <div class="formula-row">
          <span class="formula-key">Retirada</span>
          <span class="formula-value">
            <span class="formula-withdrawal-date"></span>
            <span class="formula-divider">•</span>
            <span class="formula-withdrawal-time"></span>
          </span>
        </div>
        <div class="formula-row formula-late-row">
          <span class="formula-key">Limite</span>
          <span class="formula-value formula-deadline"></span>
        </div>
        <div class="formula-row">
          <span class="formula-key">Origem</span>
          <span class="formula-value formula-origin"></span>
        </div>
        <div class="formula-row">
          <span class="formula-key">Destino</span>
          <span class="formula-value formula-destination"></span>
        </div>
        <div class="formula-row">
          <span class="formula-key">Etapa</span>
          <span class="formula-value formula-stage"></span>
        </div>
        <div class="formula-row">
          <span class="formula-key">Operação</span>
          <span class="formula-value formula-operation"></span>
        </div>
      </div>
    </article>
  </template>
`;

const collapsedLimit = 3;
const STATUS_KEYS = ["a-receber", "recebido", "pendentes", "atrasados"];
const expandedColumns = {
  "a-receber": false,
  recebido: false,
  pendentes: false,
  atrasados: false,
};

let formulas = [];
let isLoading = false;
let dataStatusTimer = null;
let currentDelayHours = DEFAULT_DELAY_HOURS;

const columns = {
  "a-receber": document.querySelector("#col-a-receber"),
  recebido: document.querySelector("#col-recebido"),
  pendentes: document.querySelector("#col-pendentes"),
  atrasados: document.querySelector("#col-atrasados"),
};

const statusMeta = {
  "a-receber": {
    metric: document.querySelector("#countAReceber"),
    badge: document.querySelector("#badgeAReceber"),
  },
  recebido: {
    metric: document.querySelector("#countRecebido"),
    badge: document.querySelector("#badgeRecebido"),
  },
  pendentes: {
    metric: document.querySelector("#countPendentes"),
    badge: document.querySelector("#badgePendentes"),
  },
  atrasados: {
    metric: document.querySelector("#countAtrasados"),
    badge: document.querySelector("#badgeAtrasados"),
  },
};

const statusIcons = {
  "a-receber": iconTruck,
  recebido: iconCheck,
  pendentes: iconClock,
  atrasados: iconAlert,
};

const template = document.querySelector("#formula-template");
const totalCount = document.querySelector("#countTotal");
const dataStatus = document.querySelector("#dataStatus");
const filtersToggle = document.querySelector("#filtersToggle");
const filtersPanel = document.querySelector("#filtersPanel");
const filtersForm = document.querySelector("#filtersForm");
const branchSelect = document.querySelector("#branchSelect");
const stageSelect = document.querySelector("#stageSelect");
const requestSearch = document.querySelector("#requestSearch");
const exportButton = document.querySelector("#exportButton");
const settingsButton = document.querySelector("#settingsButton");
const settingsModal = document.querySelector("#settingsModal");
const settingsForm = document.querySelector("#settingsForm");
const settingsCancel = document.querySelector("#settingsCancel");
const settingsCurrent = document.querySelector("#settingsCurrent");
const settingsFeedback = document.querySelector("#settingsFeedback");
const systemIcon = document.querySelector(".system-icon");
const startDateInput = document.querySelector("#startDate");
const endDateInput = document.querySelector("#endDate");
systemIcon.addEventListener("error", () => {
  systemIcon.hidden = true;
  systemIcon.closest(".system-icon-frame")?.classList.add("is-empty");
});

populateBranchFilter();
startDateInput.value = formatDateInput(addDays(today, ERP_WINDOW.startOffsetDays));
endDateInput.value = formatDateInput(addDays(today, ERP_WINDOW.endOffsetDays));
syncSettingsUi();

function populateBranchFilter() {
  branchSelect.innerHTML = [
    '<option value="all">Todas as filiais</option>',
    ...Array.from(ALLOWED_BRANCHES)
      .sort((a, b) => Number(a) - Number(b))
      .map((branch) => `<option value="${branch}">${branch} - ${FILIAL_LABELS[branch]}</option>`),
  ].join("");

  branchSelect.value = "all";
}

function setDataStatus(state, message, { autoHide = false } = {}) {
  window.clearTimeout(dataStatusTimer);
  dataStatus.dataset.state = state;
  dataStatus.textContent = message;
  dataStatus.hidden = false;

  if (autoHide) {
    dataStatusTimer = window.setTimeout(() => {
      dataStatus.hidden = true;
    }, 1600);
  }
}

async function loadSettings() {
  try {
    const response = await fetch("/api/configuracao", {
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Falha ao consultar configuracao: ${response.status}`);
    }

    const payload = await response.json();
    currentDelayHours = normalizeDelayHours(payload?.prazoAtrasoHoras);
    syncSettingsUi();
  } catch {
    currentDelayHours = DEFAULT_DELAY_HOURS;
    syncSettingsUi();
  }
}

async function saveSettings(delayHours) {
  const response = await fetch("/api/configuracao", {
    method: "PUT",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prazoAtrasoHoras: delayHours,
    }),
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload?.error || `Falha ao salvar configuracao: ${response.status}`);
  }

  currentDelayHours = normalizeDelayHours(payload?.prazoAtrasoHoras);
  syncSettingsUi();
}

function syncSettingsUi() {
  settingsCurrent.textContent = `Valor atual: ${currentDelayHours} horas`;
  settingsFeedback.hidden = true;

  settingsForm.querySelectorAll('input[name="delayHours"]').forEach((input) => {
    input.checked = Number(input.value) === currentDelayHours;
  });
}

function formatDelayDescription(hours) {
  if (hours === 22) return "22 horas após a data prevista";
  if (hours === 48) return "2 dias após a data prevista";
  if (hours === 72) return "3 dias após a data prevista";

  return "32 horas após a data prevista";
}

async function loadRealData() {
  if (isLoading) {
    return;
  }

  isLoading = true;
  setDataStatus("loading", "Sincronizando...");

  const cdfild = branchSelect.value;
  const startDate = startDateInput.value || isoToday;
  const endDate = endDateInput.value || isoToday;

  try {
    const response = await fetch(
      `/api/recebimento?cdfild=${encodeURIComponent(cdfild)}&start=${encodeURIComponent(startDate)}&end=${encodeURIComponent(endDate)}&delayHours=${encodeURIComponent(currentDelayHours)}`,
      {
        headers: {
          Accept: "application/json",
        },
      },
    );

    if (!response.ok) {
      throw new Error(`Falha ao consultar API: ${response.status}`);
    }

    const payload = await response.json();

    if (!payload || !Array.isArray(payload.rows)) {
      throw new Error("Resposta inválida da API de recebimento");
    }

    formulas = normalizeErpRows(payload.rows);
    setDataStatus("ready", "Sincronizado", { autoHide: true });
  } catch (error) {
    if (import.meta.env.DEV) {
      formulas = normalizeErpRows(createMockErpRows(today));
      setDataStatus(
        "fallback",
        "API indisponível no ambiente local. Usando dados simulados enquanto a conexão real não responde.",
      );
    } else {
      formulas = [];
      setDataStatus(
        "error",
        "Falha ao carregar dados reais do banco. Verifique as variáveis de ambiente e a rota /api/recebimento.",
      );
    }
  }

  isLoading = false;
  render();
}

function renderCard(formula) {
  const node = template.content.cloneNode(true);
  const card = node.querySelector(".formula-card");
  const toggle = node.querySelector(".formula-top");
  const details = node.querySelector(".formula-rows");
  const icon = node.querySelector(".formula-icon");
  const chip = node.querySelector(".status-chip");

  card.dataset.status = formula.status;
  toggle.setAttribute("aria-label", `Expandir requisicao ${formula.request}`);
  icon.innerHTML = statusIcons[formula.status]();
  icon.classList.add(`icon-${formula.status}`);
  node.querySelector(".formula-meta").textContent = `Requisição ${formula.request}`;
  node.querySelector(".formula-title").textContent = formula.title;
  node.querySelector(".formula-entry-date").textContent = formatDisplayDate(formula.dtentr);
  node.querySelector(".formula-entry-time").textContent = formula.hrcad || "--:--";
  node.querySelector(".formula-withdrawal-date").textContent = formatDisplayDate(formula.dtret);
  node.querySelector(".formula-withdrawal-time").textContent = formula.hrret || "--:--";
  node.querySelector(".formula-deadline").textContent = formatDeadline(formula);
  node.querySelector(".formula-origin").textContent = formatBranch("Origem", formula.cdfil);
  node.querySelector(".formula-destination").textContent = formatBranch("Destino", formula.cdfild);
  node.querySelector(".formula-stage").textContent = formula.stepLabel;
  node.querySelector(".formula-operation").textContent = formula.operationLabel;

  chip.textContent = formula.statusLabel;
  chip.classList.add(
    formula.status === "a-receber"
      ? "badge-warn"
      : formula.status === "recebido"
        ? "badge-success"
        : "badge-danger",
  );
  toggle.addEventListener("click", () => {
    const isExpanded = toggle.getAttribute("aria-expanded") === "true";

    toggle.setAttribute("aria-expanded", String(!isExpanded));
    toggle.setAttribute(
      "aria-label",
      `${isExpanded ? "Expandir" : "Fechar"} requisicao ${formula.request}`,
    );
    details.hidden = isExpanded;
    card.classList.toggle("is-expanded", !isExpanded);
  });

  return node;
}

function renderEmptyState(column, status) {
  const empty = document.createElement("p");
  empty.className = "empty-state";
  empty.textContent =
    status === "atrasados"
      ? "Nenhuma requisição atrasada hoje para o filtro selecionado."
      : status === "pendentes"
      ? "Nenhuma pendência no recorte atual."
      : "Nenhuma requisição encontrada para esta etapa.";
  column.appendChild(empty);
}

function render() {
  syncStageOptions();
  const filteredFormulas = getFilteredFormulas();
  const grouped = filteredFormulas.reduce(
    (acc, formula) => {
      const status = getRenderStatus(formula);

      if (status in acc) {
        acc[status] += 1;
      }
      return acc;
    },
    Object.fromEntries(STATUS_KEYS.map((status) => [status, 0])),
  );

  Object.values(columns).forEach((column) => {
    column.innerHTML = "";
  });

  Object.entries(columns).forEach(([status, column]) => {
    const formulasByStatus = filteredFormulas.filter((formula) => getRenderStatus(formula) === status);
    const visibleFormulas = expandedColumns[status]
      ? formulasByStatus
      : formulasByStatus.slice(0, collapsedLimit);

    statusMeta[status].metric.textContent = formatNumber(grouped[status]);
    statusMeta[status].badge.textContent = formatNumber(grouped[status]);

    if (visibleFormulas.length === 0) {
      renderEmptyState(column, status);
    } else {
      visibleFormulas.forEach((formula) => {
        column.appendChild(renderCard(formula));
      });
    }

    updateColumnFooter(status, formulasByStatus.length);
  });

  totalCount.textContent = formatNumber(filteredFormulas.length);
}

function getFilteredFormulas() {
  const stage = stageSelect.value;
  const requestQuery = normalizeSearch(requestSearch.value);

  return formulas.filter((formula) => {
    const matchesStage = stage === "all" || formula.cdetapa === stage;
    const matchesRequest =
      requestQuery === "" || normalizeSearch(formula.request).includes(requestQuery);

    return matchesStage && matchesRequest;
  });
}

function getRenderStatus(formula) {
  if (formula.status !== "atrasados") {
    return formula.status;
  }

  return isLateToday(formula) ? "atrasados" : "__hidden__";
}

function isLateToday(formula) {
  return getDateKey(formula.dataLimiteAtraso) === isoToday;
}

function getDateKey(value) {
  return String(value ?? "").slice(0, 10);
}

function getAvailableFormulas({ ignoreStage = false } = {}) {
  const stage = ignoreStage ? "all" : stageSelect.value;
  const requestQuery = normalizeSearch(requestSearch.value);

  return formulas.filter((formula) => {
    const matchesStage = stage === "all" || formula.cdetapa === stage;
    const matchesRequest =
      requestQuery === "" || normalizeSearch(formula.request).includes(requestQuery);

    return matchesStage && matchesRequest;
  });
}

function getVisibleFormulas() {
  return getFilteredFormulas().filter((formula) => getRenderStatus(formula) !== "__hidden__");
}

function normalizeDateRangeInputs() {
  const start = startDateInput.value;
  const end = endDateInput.value;

  if (start && end && start > end) {
    endDateInput.value = start;
  }
}

function normalizeSearch(value) {
  return value
    .trim()
    .toLocaleLowerCase("pt-BR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function syncStageOptions() {
  const stageSource = getAvailableFormulas({ ignoreStage: true });
  const availableStages = new Set(stageSource.map((formula) => formula.cdetapa));
  const currentValue = stageSelect.value || "all";

  const stageOptions = [
    `<option value="all"${currentValue === "all" ? " selected" : ""}>Todos</option>`,
    `<option value="08"${currentValue === "08" ? " selected" : ""}>08 - Logística</option>`,
    `<option value="10"${currentValue === "10" ? " selected" : ""}>10 - Balcão</option>`,
  ].filter((option) => {
    if (option.includes('value="all"')) {
      return true;
    }
    if (option.includes('value="08"')) {
      return availableStages.has("08");
    }
    if (option.includes('value="10"')) {
      return availableStages.has("10");
    }
    return true;
  });

  stageSelect.innerHTML = stageOptions.join("");
  if (![...stageSelect.options].some((option) => option.value === currentValue)) {
    stageSelect.value = "all";
  }
}

function formatDisplayDate(dateValue) {
  if (!dateValue) {
    return "--/--/----";
  }

  const [year, month, day] = String(dateValue).slice(0, 10).split("-");

  if (!year || !month || !day) {
    return dateValue;
  }

  return `${day}/${month}/${year}`;
}

function formatDeadline(formula) {
  if (formula.dataLimiteAtraso) {
    const value = String(formula.dataLimiteAtraso);
    const date = formatDisplayDate(value);
    const timeMatch = value.match(/(?:T|\s)(\d{2}:\d{2})/);

    return timeMatch ? `${date} ${timeMatch[1]}` : `${date} 00:00`;
  }

  return `${formatDisplayDate(formula.dtret)} + ${formula.prazoAtrasoHoras || currentDelayHours}h`;
}

function formatNumber(value) {
  return numberFormatter.format(value);
}

function formatBranch(label, branch) {
  const code = String(branch ?? "").trim();
  const branchName = FILIAL_LABELS[code];

  return branchName ? `${label} ${code} - ${branchName}` : `${label} ${code || "--"}`;
}

function buildExportCsv(rows) {
  const columns = [
    ["Status", (formula) => formula.statusLabel],
    ["Requisição", (formula) => formula.request],
    ["Paciente", (formula) => formula.nomepa],
    ["Filial origem", (formula) => formatBranch("Origem", formula.cdfil)],
    ["Filial destino", (formula) => formatBranch("Destino", formula.cdfild)],
    ["Data entrada", (formula) => formatDisplayDate(formula.dtentr)],
    ["Hora entrada", (formula) => formula.hrcad || ""],
    ["Data retirada", (formula) => formatDisplayDate(formula.dtret)],
    ["Hora retirada", (formula) => formula.hrret || ""],
    ["Etapa", (formula) => formula.stepLabel],
    ["Operação", (formula) => formula.operationLabel],
    ["Atrasada", (formula) => (formula.atrasada ? "Sim" : "Não")],
    ["Prazo atraso horas", (formula) => formula.prazoAtrasoHoras || currentDelayHours],
    ["Data limite atraso", (formula) => formatDeadline(formula)],
  ];
  const header = columns.map(([label]) => escapeCsvCell(label)).join(";");
  const lines = rows.map((formula) =>
    columns.map(([, getValue]) => escapeCsvCell(getValue(formula))).join(";"),
  );

  return [header, ...lines].join("\r\n");
}

function escapeCsvCell(value) {
  const text = String(value ?? "");

  if (/[;"\r\n]/.test(text)) {
    return `"${text.replaceAll('"', '""')}"`;
  }

  return text;
}

function updateColumnFooter(status, total) {
  const button = document.querySelector(`.column-footer[data-status="${status}"]`);
  const remaining = Math.max(total - collapsedLimit, 0);
  const isExpanded = expandedColumns[status];

  button.hidden = remaining === 0;
  button.setAttribute("aria-expanded", String(isExpanded));
  button.querySelector(".column-footer-label").textContent = isExpanded
    ? "Mostrar menos"
    : "Ver todos";
  button.querySelector(".column-footer-count").textContent = isExpanded
    ? `(${formatNumber(total)})`
    : `(+${formatNumber(remaining)})`;
}

filtersToggle.addEventListener("click", () => {
  const shouldOpen = filtersPanel.hidden;
  filtersPanel.hidden = !shouldOpen;
  filtersToggle.setAttribute("aria-expanded", String(shouldOpen));
});

filtersForm.addEventListener("submit", (event) => {
  event.preventDefault();
  Object.keys(expandedColumns).forEach((status) => {
    expandedColumns[status] = false;
  });
  normalizeDateRangeInputs();
  loadRealData();
});

startDateInput.addEventListener("change", () => {
  normalizeDateRangeInputs();
  loadRealData();
});

endDateInput.addEventListener("change", () => {
  normalizeDateRangeInputs();
  loadRealData();
});

branchSelect.addEventListener("change", () => {
  loadRealData();
});

stageSelect.addEventListener("input", () => {
  render();
});
stageSelect.addEventListener("change", () => {
  render();
});

requestSearch.addEventListener("input", () => {
  render();
});
requestSearch.addEventListener("change", () => {
  render();
});

document.querySelectorAll(".column-footer").forEach((button) => {
  button.addEventListener("click", () => {
    const { status } = button.dataset;
    expandedColumns[status] = !expandedColumns[status];
    render();
  });
});

settingsButton.addEventListener("click", () => {
  syncSettingsUi();
  settingsModal.showModal();
});

settingsCancel.addEventListener("click", () => {
  settingsModal.close();
});

settingsModal.addEventListener("click", (event) => {
  if (event.target === settingsModal) {
    settingsModal.close();
  }
});

settingsForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(settingsForm);
  const delayHours = normalizeDelayHours(formData.get("delayHours"));
  const submitButton = settingsForm.querySelector('button[type="submit"]');

  submitButton.disabled = true;
  settingsFeedback.hidden = false;
  settingsFeedback.dataset.state = "loading";
  settingsFeedback.textContent = "Salvando configuração...";

  try {
    await saveSettings(delayHours);
    settingsFeedback.dataset.state = "success";
    settingsFeedback.textContent = `Configuração salva: ${currentDelayHours} horas.`;
    await loadRealData();
    settingsModal.close();
  } catch (error) {
    settingsFeedback.dataset.state = "error";
    settingsFeedback.textContent =
      error instanceof Error ? error.message : "Falha ao salvar configuração.";
  } finally {
    submitButton.disabled = false;
  }
});

exportButton.addEventListener("click", () => {
  const rows = getVisibleFormulas();

  if (rows.length === 0) {
    setDataStatus("fallback", "Não há registros no recorte atual para exportar.", {
      autoHide: true,
    });
    return;
  }

  const csv = buildExportCsv(rows);
  const blob = new Blob([`\uFEFF${csv}`], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `controle-recebimento-${formatDateInput(new Date())}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);

  const label = exportButton.querySelector("span:last-child");
  const previousLabel = label.textContent;
  label.textContent = "Exportado";
  window.setTimeout(() => {
    label.textContent = previousLabel;
  }, 1400);
});

render();
loadSettings().finally(() => {
  loadRealData();
});
