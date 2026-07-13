import "./style.css";
import logoPharmesUrl from "./img/logopharmes.png";
import {
  ERP_WINDOW,
  addDays,
  createMockErpRows,
  formatDateInput,
  normalizeErpRows,
  normalizeLateErpRows,
} from "./erpRecebimento.js";

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
            <h1 id="pageTitle">Controle de Recebimento</h1>
            <p id="pageSubtitle">Monitoramento por data de retirada na filial destino.</p>
          </div>
        </div>

        <div class="topbar-actions">
          <button class="btn btn-outline" id="filtersToggle" type="button" aria-expanded="false" aria-controls="filtersPanel">
            <span class="btn-icon">${iconFilter()}</span>
            <span>Filtros</span>
          </button>
          <button class="btn btn-outline btn-toggle" id="lateToggleButton" type="button" aria-pressed="false">
            <span>Atrasados</span>
          </button>
          <button class="btn btn-primary" id="exportButton" type="button">
            <span class="btn-icon">${iconExport()}</span>
            <span>Exportar</span>
          </button>
        </div>
      </header>

      <p class="data-status" id="dataStatus" role="status" aria-live="polite" hidden></p>
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

      <section class="summary-grid" id="resumo" data-view="standard" aria-label="Resumo de status">
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
      </section>

      <section class="kanban" id="kanban" data-view="standard" aria-label="Requisições por status de recebimento">
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

      </section>

      <section class="late-dashboard" id="lateDashboard" data-view="late" hidden aria-label="Painel de atrasados">
        <section class="summary-grid late-summary-grid" id="lateResumo" aria-label="Resumo de atrasados">
          <article class="summary-card summary-total late-total">
            <span class="summary-label">Total atrasados</span>
            <strong class="summary-value" id="lateCountTotal">0</strong>
            <small>Registros atrasados no recorte atual</small>
          </article>
          <article class="summary-card late-window late-window-1200">
            <span class="summary-label">12:00</span>
            <strong class="summary-value" id="lateCount1200">0</strong>
            <small>Fila das 12:00</small>
          </article>
          <article class="summary-card late-window late-window-1600">
            <span class="summary-label">16:00</span>
            <strong class="summary-value" id="lateCount1600">0</strong>
            <small>Fila das 16:00</small>
          </article>
          <article class="summary-card late-window late-window-1800">
            <span class="summary-label">18:00</span>
            <strong class="summary-value" id="lateCount1800">0</strong>
            <small>Fila das 18:00</small>
          </article>
          <article class="summary-card late-window late-window-1900">
            <span class="summary-label">19:00</span>
            <strong class="summary-value" id="lateCount1900">0</strong>
            <small>Fila das 19:00</small>
          </article>
        </section>

        <section class="kanban late-kanban" id="lateKanban" aria-label="Requisições atrasadas por horário">
          <article class="column column-late">
            <div class="column-head">
              <div>
                <span class="column-icon" aria-hidden="true">${iconClock()}</span>
                <h3>12:00</h3>
              </div>
              <span class="badge badge-danger" id="lateBadge1200">0</span>
            </div>
            <div class="column-body" id="late-col-1200"></div>
            <button class="column-footer" type="button" data-status="late-12:00" aria-expanded="false">
              <span class="column-footer-label">Ver todos</span>
              <span class="column-footer-count">(0)</span>
              <span class="column-footer-icon" aria-hidden="true">›</span>
            </button>
          </article>

          <article class="column column-late">
            <div class="column-head">
              <div>
                <span class="column-icon" aria-hidden="true">${iconClock()}</span>
                <h3>16:00</h3>
              </div>
              <span class="badge badge-danger" id="lateBadge1600">0</span>
            </div>
            <div class="column-body" id="late-col-1600"></div>
            <button class="column-footer" type="button" data-status="late-16:00" aria-expanded="false">
              <span class="column-footer-label">Ver todos</span>
              <span class="column-footer-count">(0)</span>
              <span class="column-footer-icon" aria-hidden="true">›</span>
            </button>
          </article>

          <article class="column column-late">
            <div class="column-head">
              <div>
                <span class="column-icon" aria-hidden="true">${iconClock()}</span>
                <h3>18:00</h3>
              </div>
              <span class="badge badge-danger" id="lateBadge1800">0</span>
            </div>
            <div class="column-body" id="late-col-1800"></div>
            <button class="column-footer" type="button" data-status="late-18:00" aria-expanded="false">
              <span class="column-footer-label">Ver todos</span>
              <span class="column-footer-count">(0)</span>
              <span class="column-footer-icon" aria-hidden="true">›</span>
            </button>
          </article>

          <article class="column column-late">
            <div class="column-head">
              <div>
                <span class="column-icon" aria-hidden="true">${iconClock()}</span>
                <h3>19:00</h3>
              </div>
              <span class="badge badge-danger" id="lateBadge1900">0</span>
            </div>
            <div class="column-body" id="late-col-1900"></div>
            <button class="column-footer" type="button" data-status="late-19:00" aria-expanded="false">
              <span class="column-footer-label">Ver todos</span>
              <span class="column-footer-count">(0)</span>
              <span class="column-footer-icon" aria-hidden="true">›</span>
            </button>
          </article>
        </section>
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
const STATUS_KEYS = ["a-receber", "recebido", "pendentes"];
const LATE_BUCKET_KEYS = ["12:00", "16:00", "18:00", "19:00"];
const expandedColumns = {
  "a-receber": false,
  recebido: false,
  pendentes: false,
};
const expandedLateColumns = {
  "12:00": false,
  "16:00": false,
  "18:00": false,
  "19:00": false,
};

let formulas = [];
let lateFormulas = [];
let isLoading = false;
let dataStatusTimer = null;
let routeTransitionTimer = null;
const ROUTES = {
  standard: "/",
  late: "/atrasados",
};
let currentRoute = getRouteFromLocation();

const columns = {
  "a-receber": document.querySelector("#col-a-receber"),
  recebido: document.querySelector("#col-recebido"),
  pendentes: document.querySelector("#col-pendentes"),
};

const lateColumns = {
  "12:00": document.querySelector("#late-col-1200"),
  "16:00": document.querySelector("#late-col-1600"),
  "18:00": document.querySelector("#late-col-1800"),
  "19:00": document.querySelector("#late-col-1900"),
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
};

const lateStatusMeta = {
  "12:00": {
    metric: document.querySelector("#lateCount1200"),
    badge: document.querySelector("#lateBadge1200"),
  },
  "16:00": {
    metric: document.querySelector("#lateCount1600"),
    badge: document.querySelector("#lateBadge1600"),
  },
  "18:00": {
    metric: document.querySelector("#lateCount1800"),
    badge: document.querySelector("#lateBadge1800"),
  },
  "19:00": {
    metric: document.querySelector("#lateCount1900"),
    badge: document.querySelector("#lateBadge1900"),
  },
};

const statusIcons = {
  "a-receber": iconTruck,
  recebido: iconCheck,
  pendentes: iconClock,
};

const template = document.querySelector("#formula-template");
const totalCount = document.querySelector("#countTotal");
const lateTotalCount = document.querySelector("#lateCountTotal");
const pageTitle = document.querySelector("#pageTitle");
const pageSubtitle = document.querySelector("#pageSubtitle");
const dataStatus = document.querySelector("#dataStatus");
const filtersToggle = document.querySelector("#filtersToggle");
const lateToggleButton = document.querySelector("#lateToggleButton");
const workspace = document.querySelector(".workspace");
const filtersPanel = document.querySelector("#filtersPanel");
const filtersForm = document.querySelector("#filtersForm");
const branchSelect = document.querySelector("#branchSelect");
const stageSelect = document.querySelector("#stageSelect");
const requestSearch = document.querySelector("#requestSearch");
const exportButton = document.querySelector("#exportButton");
const systemIcon = document.querySelector(".system-icon");
const startDateInput = document.querySelector("#startDate");
const endDateInput = document.querySelector("#endDate");
const standardViews = document.querySelectorAll('[data-view="standard"]');
const lateViews = document.querySelectorAll('[data-view="late"]');
systemIcon.addEventListener("error", () => {
  systemIcon.hidden = true;
  systemIcon.closest(".system-icon-frame")?.classList.add("is-empty");
});

populateBranchFilter();
startDateInput.value = formatDateInput(addDays(today, ERP_WINDOW.startOffsetDays));
endDateInput.value = formatDateInput(addDays(today, ERP_WINDOW.endOffsetDays));

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

function getRouteFromLocation() {
  return window.location.pathname === ROUTES.late ? ROUTES.late : ROUTES.standard;
}

function isLateRoute(route = currentRoute) {
  return route === ROUTES.late;
}

function syncRouteUi() {
  const lateView = isLateRoute();
  workspace.dataset.mode = lateView ? "late" : "standard";
  standardViews.forEach((view) => {
    view.classList.toggle("is-exiting", lateView);
    view.classList.toggle("is-active", !lateView);
    view.hidden = false;
  });
  lateViews.forEach((view) => {
    view.classList.toggle("is-entering", lateView);
    view.classList.toggle("is-active", lateView);
    view.hidden = false;
  });
  lateToggleButton.setAttribute("aria-pressed", String(lateView));
  lateToggleButton.classList.toggle("is-active", lateView);
  lateToggleButton.textContent = lateView ? "Recebimento" : "Atrasados";
  pageTitle.textContent = lateView
    ? "Controle de requisições atrasadas"
    : "Controle de Recebimento";
  pageSubtitle.textContent = lateView
    ? "Monitoramento por horario de retirada na filial destino."
    : "Monitoramento por data de retirada na filial destino.";
  document.title = lateView
    ? "Controle de Recebimento | Atrasados"
    : "Controle de Recebimento de Fórmulas";
}

function navigateToRoute(nextRoute, { replace = false } = {}) {
  if (nextRoute === currentRoute) {
    return;
  }

  if (routeTransitionTimer) {
    window.clearTimeout(routeTransitionTimer);
  }

  workspace.classList.add("is-transitioning");
  workspace.dataset.nextMode = nextRoute === ROUTES.late ? "late" : "standard";
  routeTransitionTimer = window.setTimeout(() => {
    currentRoute = nextRoute;
    routeTransitionTimer = null;
    workspace.dataset.nextMode = "";

    if (replace) {
      history.replaceState({}, "", nextRoute);
    } else {
      history.pushState({}, "", nextRoute);
    }

    syncRouteUi();
    render();

    requestAnimationFrame(() => {
      workspace.classList.remove("is-transitioning");
    });
  }, 180);
}

async function loadRealData() {
  if (isLoading) {
    return;
  }

  isLoading = true;
  setDataStatus("loading", "Sincronizando...");

  if (import.meta.env.DEV) {
    const mockRows = createMockErpRows(today);
    formulas = normalizeErpRows(mockRows);
    lateFormulas = normalizeLateErpRows(mockRows);
    isLoading = false;
    setDataStatus("fallback", "Ambiente local usando dados simulados para visualização.", {
      autoHide: true,
    });
    render();
    return;
  }

  const cdfild = branchSelect.value;
  const startDate = startDateInput.value || isoToday;
  const endDate = endDateInput.value || isoToday;

  try {
    const queryString = `cdfild=${encodeURIComponent(cdfild)}&start=${encodeURIComponent(startDate)}&end=${encodeURIComponent(endDate)}`;
    const [recebimentoResponse, atrasadosResponse] = await Promise.all([
      fetch(`/api/recebimento?${queryString}`, {
        headers: {
          Accept: "application/json",
        },
      }),
      fetch(`/api/atrasados?${queryString}`, {
        headers: {
          Accept: "application/json",
        },
      }),
    ]);

    if (!recebimentoResponse.ok) {
      throw new Error(`Falha ao consultar API de recebimento: ${recebimentoResponse.status}`);
    }

    if (!atrasadosResponse.ok) {
      throw new Error(`Falha ao consultar API de atrasados: ${atrasadosResponse.status}`);
    }

    const [recebimentoPayload, atrasadosPayload] = await Promise.all([
      recebimentoResponse.json(),
      atrasadosResponse.json(),
    ]);

    if (!recebimentoPayload || !Array.isArray(recebimentoPayload.rows)) {
      throw new Error("Resposta inválida da API de recebimento");
    }

    if (!atrasadosPayload || !Array.isArray(atrasadosPayload.rows)) {
      throw new Error("Resposta inválida da API de atrasados");
    }

    formulas = normalizeErpRows(recebimentoPayload.rows);
    lateFormulas = normalizeLateErpRows(atrasadosPayload.rows);
    setDataStatus("ready", "Sincronizado", { autoHide: true });
  } catch (error) {
    formulas = [];
    lateFormulas = [];
    setDataStatus(
      "error",
      "Falha ao carregar dados reais do banco. Verifique as variáveis de ambiente e as rotas de API.",
    );
  }

  isLoading = false;
  render();
}

function renderCard(formula, { hideStatusChip = false, forceAlertIcon = false } = {}) {
  const node = template.content.cloneNode(true);
  const card = node.querySelector(".formula-card");
  const toggle = node.querySelector(".formula-top");
  const details = node.querySelector(".formula-rows");
  const icon = node.querySelector(".formula-icon");
  const chip = node.querySelector(".status-chip");

  card.dataset.status = formula.status;
  toggle.setAttribute("aria-label", `Expandir requisicao ${formula.request}`);
  icon.innerHTML = forceAlertIcon ? iconAlert() : statusIcons[formula.status]();
  icon.classList.add(forceAlertIcon ? "icon-late-alert" : `icon-${formula.status}`);
  node.querySelector(".formula-meta").textContent = `Requisição ${formula.request}`;
  node.querySelector(".formula-title").textContent = formula.title;
  node.querySelector(".formula-entry-date").textContent = formatDisplayDate(formula.dtentr);
  node.querySelector(".formula-entry-time").textContent = formula.hrcad || "--:--";
  node.querySelector(".formula-withdrawal-date").textContent = formatDisplayDate(formula.dtret);
  node.querySelector(".formula-withdrawal-time").textContent = formula.hrret || "--:--";
  node.querySelector(".formula-origin").textContent = formatBranch("Origem", formula.cdfil);
  node.querySelector(".formula-destination").textContent = formatBranch("Destino", formula.cdfild);
  node.querySelector(".formula-stage").textContent = formula.stepLabel;
  node.querySelector(".formula-operation").textContent = formula.operationLabel;

  if (hideStatusChip) {
    chip.remove();
    toggle.dataset.hideStatusChip = "true";
  } else {
    chip.textContent = formula.statusLabel;
    chip.classList.add(
      formula.status === "a-receber"
        ? "badge-warn"
        : formula.status === "recebido"
          ? "badge-success"
          : "badge-danger",
    );
  }
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
    status === "pendentes" ? "Nenhuma pendência no recorte atual." : "Nenhuma requisição encontrada para esta etapa.";
  column.appendChild(empty);
}

function render() {
  syncStageOptions();
  const filteredFormulas = getFilteredFormulas();
  const filteredLateFormulas = getFilteredLateFormulas();

  renderStandardDashboard(filteredFormulas);
  renderLateDashboard(filteredLateFormulas);
  syncViewVisibility();
}

function renderStandardDashboard(filteredFormulas) {
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

function renderLateDashboard(lateFormulas) {
  const grouped = lateFormulas.reduce(
    (acc, formula) => {
      const bucket = getLateBucket(formula);

      if (bucket in acc) {
        acc[bucket] += 1;
      }
      return acc;
    },
    Object.fromEntries(LATE_BUCKET_KEYS.map((bucket) => [bucket, 0])),
  );

  Object.values(lateColumns).forEach((column) => {
    column.innerHTML = "";
  });

  Object.entries(lateColumns).forEach(([bucket, column]) => {
    const formulasByBucket = lateFormulas.filter((formula) => getLateBucket(formula) === bucket);
    const visibleFormulas = expandedLateColumns[bucket]
      ? formulasByBucket
      : formulasByBucket.slice(0, collapsedLimit);
    const volumeState = getLateVolumeState(formulasByBucket.length);

    lateStatusMeta[bucket].metric.textContent = formatNumber(grouped[bucket]);
    lateStatusMeta[bucket].badge.textContent = formatNumber(grouped[bucket]);
    column.dataset.volume = volumeState;
    column.closest(".column-late")?.setAttribute("data-volume", volumeState);

    if (visibleFormulas.length === 0) {
      renderLateEmptyState(column, bucket);
    } else {
      visibleFormulas.forEach((formula) => {
        const card = renderCard(formula, { hideStatusChip: true, forceAlertIcon: true });
        column.appendChild(card);
      });
    }

    updateColumnFooter(`late-${bucket}`, formulasByBucket.length, expandedLateColumns);
  });

  lateTotalCount.textContent = formatNumber(lateFormulas.length);
}

function renderLateEmptyState(column, bucket) {
  const empty = document.createElement("p");
  empty.className = "empty-state";
  empty.textContent = `Nenhuma requisição atrasada para a faixa ${bucket}.`;
  column.appendChild(empty);
}

function getLateVolumeState(total) {
  if (total === 0) {
    return "none";
  }

  if (total <= 5) {
    return "low";
  }

  return "high";
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

function getFilteredLateFormulas() {
  const requestQuery = normalizeSearch(requestSearch.value);

  return lateFormulas
    .filter((formula) => isLateByMarkedTime(formula))
    .filter((formula) => requestQuery === "" || normalizeSearch(formula.request).includes(requestQuery));
}

function getLateBucket(formula) {
  const hour = Number.parseInt(String(formula.hrret || formula.hrcad || "").slice(0, 2), 10);

  if (!Number.isFinite(hour)) {
    return "19:00";
  }

  if (hour <= 12) return "12:00";
  if (hour <= 16) return "16:00";
  if (hour <= 18) return "18:00";

  return "19:00";
}

function isLateByMarkedTime(formula) {
  const lateAfterDate = String(formula.lateAfterDate || "").slice(0, 10);

  if (!lateAfterDate) {
    return true;
  }

  return isoToday >= lateAfterDate;
}

function getRenderStatus(formula) {
  return formula.status;
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

function syncLateToggleUi() {
  syncRouteUi();
}

function syncViewVisibility() {
  syncRouteUi();
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

function updateColumnFooter(status, total, expandedMap = expandedColumns) {
  const button = document.querySelector(`.column-footer[data-status="${status}"]`);
  if (!button) {
    return;
  }
  const remaining = Math.max(total - collapsedLimit, 0);
  const isExpanded = expandedMap[status];

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

lateToggleButton.addEventListener("click", () => {
  navigateToRoute(isLateRoute() ? ROUTES.standard : ROUTES.late);
});

window.addEventListener("popstate", () => {
  currentRoute = getRouteFromLocation();
  syncRouteUi();
  render();
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
    if (status.startsWith("late-")) {
      expandedLateColumns[status.slice(5)] = !expandedLateColumns[status.slice(5)];
    } else {
      expandedColumns[status] = !expandedColumns[status];
    }
    render();
  });
});


exportButton.addEventListener("click", () => {
  const rows = isLateRoute() ? getFilteredLateFormulas() : getVisibleFormulas();

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
syncLateToggleUi();
loadRealData();
