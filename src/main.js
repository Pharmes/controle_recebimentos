import "./style.css";
import logoPharmesUrl from "./img/logopharmes.png";
import {
  DEFAULT_CDFILD,
  ERP_WINDOW,
  addDays,
  createMockErpRows,
  formatDateInput,
  getDestinationBranches,
  normalizeErpRows,
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
      </section>
    </main>
  </div>

  <template id="formula-template">
    <article class="formula-card">
      <div class="formula-top">
        <span class="formula-icon" aria-hidden="true"></span>
        <div class="formula-heading">
          <p class="formula-meta"></p>
          <h4 class="formula-title"></h4>
        </div>
        <span class="status-chip"></span>
      </div>
      <div class="formula-rows">
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
const expandedColumns = {
  "a-receber": false,
  recebido: false,
  pendentes: false,
};

const erpRows = createMockErpRows(today);
const formulas = normalizeErpRows(erpRows);

const columns = {
  "a-receber": document.querySelector("#col-a-receber"),
  recebido: document.querySelector("#col-recebido"),
  pendentes: document.querySelector("#col-pendentes"),
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

const statusIcons = {
  "a-receber": iconTruck,
  recebido: iconCheck,
  pendentes: iconClock,
};

const template = document.querySelector("#formula-template");
const totalCount = document.querySelector("#countTotal");
const filtersToggle = document.querySelector("#filtersToggle");
const filtersPanel = document.querySelector("#filtersPanel");
const filtersForm = document.querySelector("#filtersForm");
const branchSelect = document.querySelector("#branchSelect");
const stageSelect = document.querySelector("#stageSelect");
const requestSearch = document.querySelector("#requestSearch");
const exportButton = document.querySelector("#exportButton");
const systemIcon = document.querySelector(".system-icon");
const startDateInput = document.querySelector("#startDate");
const endDateInput = document.querySelector("#endDate");

systemIcon.addEventListener("error", () => {
  systemIcon.hidden = true;
  systemIcon.closest(".system-icon-frame")?.classList.add("is-empty");
});

startDateInput.value = formatDateInput(addDays(today, ERP_WINDOW.startOffsetDays));
endDateInput.value = formatDateInput(addDays(today, ERP_WINDOW.endOffsetDays));

populateBranchFilter();

function populateBranchFilter() {
  branchSelect.innerHTML = [
    '<option value="all">Todas as filiais</option>',
    ...Array.from(ALLOWED_BRANCHES)
      .sort((a, b) => Number(a) - Number(b))
      .map((branch) => `<option value="${branch}">${branch} - ${FILIAL_LABELS[branch]}</option>`),
  ].join("");

  branchSelect.value = "all";
}

function renderCard(formula) {
  const node = template.content.cloneNode(true);
  const card = node.querySelector(".formula-card");
  const icon = node.querySelector(".formula-icon");
  const chip = node.querySelector(".status-chip");

  card.dataset.status = formula.status;
  icon.innerHTML = statusIcons[formula.status]();
  icon.classList.add(`icon-${formula.status}`);
  node.querySelector(".formula-meta").textContent = `Requisição ${formula.request}`;
  node.querySelector(".formula-title").textContent = formula.title;
  node.querySelector(".formula-entry-date").textContent = formatDisplayDate(formula.dtentr);
  node.querySelector(".formula-entry-time").textContent = formula.hrcad || "--:--";
  node.querySelector(".formula-withdrawal-date").textContent = formatDisplayDate(formula.dtret);
  node.querySelector(".formula-withdrawal-time").textContent = formula.hrret || "--:--";
  node.querySelector(".formula-origin").textContent = formula.origin;
  node.querySelector(".formula-destination").textContent = formula.destination;
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

  return node;
}

function renderEmptyState(column, status) {
  const empty = document.createElement("p");
  empty.className = "empty-state";
  empty.textContent =
    status === "pendentes"
      ? "Nenhuma pendência no recorte atual."
      : "Nenhuma requisição encontrada para esta etapa.";
  column.appendChild(empty);
}

function render() {
  syncDateBounds();
  syncStageOptions();
  const filteredFormulas = getFilteredFormulas();
  const grouped = filteredFormulas.reduce(
    (acc, formula) => {
      acc[formula.status] += 1;
      return acc;
    },
    { "a-receber": 0, recebido: 0, pendentes: 0 },
  );

  Object.values(columns).forEach((column) => {
    column.innerHTML = "";
  });

  Object.entries(columns).forEach(([status, column]) => {
    const formulasByStatus = filteredFormulas.filter((formula) => formula.status === status);
    const visibleFormulas = expandedColumns[status]
      ? formulasByStatus
      : formulasByStatus.slice(0, collapsedLimit);

    statusMeta[status].metric.textContent = grouped[status];
    statusMeta[status].badge.textContent = grouped[status];

    if (visibleFormulas.length === 0) {
      renderEmptyState(column, status);
    } else {
      visibleFormulas.forEach((formula) => {
        column.appendChild(renderCard(formula));
      });
    }

    updateColumnFooter(status, formulasByStatus.length);
  });

  totalCount.textContent = filteredFormulas.length;
}

function getFilteredFormulas() {
  const branch = branchSelect.value;
  const stage = stageSelect.value;
  const requestQuery = normalizeSearch(requestSearch.value);

  return formulas.filter((formula) => {
    const branchAllowed = ALLOWED_BRANCHES.has(formula.cdfild);
    const matchesBranch = branch === "all" || formula.cdfild === branch;
    const matchesStage = stage === "all" || formula.cdetapa === stage;
    const matchesRequest =
      requestQuery === "" || normalizeSearch(formula.request).includes(requestQuery);

    return (
      branchAllowed &&
      matchesBranch &&
      matchesStage &&
      matchesRequest &&
      isWithinSelectedPeriod(formula.dtret)
    );
  });
}

function getAvailableFormulas({ ignoreBranch = false, ignoreStage = false, ignoreDate = false } = {}) {
  const branch = ignoreBranch ? "all" : branchSelect.value;
  const stage = ignoreStage ? "all" : stageSelect.value;
  const requestQuery = normalizeSearch(requestSearch.value);

  return formulas.filter((formula) => {
    if (!ALLOWED_BRANCHES.has(formula.cdfild)) {
      return false;
    }

    const matchesBranch = branch === "all" || formula.cdfild === branch;
    const matchesStage = stage === "all" || formula.cdetapa === stage;
    const matchesRequest =
      requestQuery === "" || normalizeSearch(formula.request).includes(requestQuery);
    const matchesPeriod = ignoreDate ? true : isWithinSelectedPeriod(formula.dtret);

    return matchesBranch && matchesStage && matchesRequest && matchesPeriod;
  });
}

function normalizeSearch(value) {
  return value
    .trim()
    .toLocaleLowerCase("pt-BR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function isWithinSelectedPeriod(dateValue) {
  const start = startDateInput.value || isoToday;
  const end = endDateInput.value || isoToday;
  return dateValue >= start && dateValue <= end;
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

function syncDateBounds() {
  const dateSource = getAvailableFormulas({ ignoreDate: true });
  if (dateSource.length === 0) {
    return;
  }

  const dates = dateSource.map((formula) => formula.dtret).sort();
  const minDate = dates[0];
  const maxDate = dates[dates.length - 1];

  startDateInput.min = minDate;
  startDateInput.max = maxDate;
  endDateInput.min = minDate;
  endDateInput.max = maxDate;

  if (!startDateInput.value || startDateInput.value < minDate) {
    startDateInput.value = minDate;
  }

  if (!endDateInput.value || endDateInput.value > maxDate) {
    endDateInput.value = maxDate;
  }

  if (startDateInput.value > endDateInput.value) {
    startDateInput.value = minDate;
    endDateInput.value = maxDate;
  }
}

function formatDisplayDate(dateValue) {
  if (!dateValue) {
    return "--/--/----";
  }

  const [year, month, day] = dateValue.split("-");

  if (!year || !month || !day) {
    return dateValue;
  }

  return `${day}/${month}/${year}`;
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
    ? `(${total})`
    : `(+${remaining})`;
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
  render();
});

[startDateInput, endDateInput, branchSelect, stageSelect, requestSearch].forEach((input) => {
  input.addEventListener("input", () => {
    render();
  });
  input.addEventListener("change", () => {
    render();
  });
});

document.querySelectorAll(".column-footer").forEach((button) => {
  button.addEventListener("click", () => {
    const { status } = button.dataset;
    expandedColumns[status] = !expandedColumns[status];
    render();
  });
});

exportButton.addEventListener("click", () => {
  const payload = getFilteredFormulas().map((formula) => ({
    cdfil: formula.cdfil,
    nrrqu: formula.nrrqu,
    serier: formula.serier,
    nomepa: formula.nomepa,
    requisicao: formula.request,
    dtentr: formula.dtentr,
    hrcad: formula.hrcad,
    dtret: formula.dtret,
    hrret: formula.hrret,
    cdfild: formula.cdfild,
    cdetapa: formula.cdetapa,
    cdopera: formula.cdopera,
    status: formula.statusLabel,
  }));

  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "controle-recebimento.json";
  link.click();
  URL.revokeObjectURL(url);

  const label = exportButton.querySelector("span:last-child");
  const previousLabel = label.textContent;
  label.textContent = "Exportado";
  window.setTimeout(() => {
    label.textContent = previousLabel;
  }, 1400);
});

render();
