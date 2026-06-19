import "./style.css";

const app = document.querySelector("#app");
const today = new Date();
const isoToday = [
  today.getFullYear(),
  String(today.getMonth() + 1).padStart(2, "0"),
  String(today.getDate()).padStart(2, "0"),
].join("-");

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
      <path d="M20 7L10.5 16.5 4 10"></path>
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
  <div class="shell">
    <main class="main">
      <header class="topbar">
        <div class="brand">
          <div class="brand-mark">P</div>
          <div>
            <p class="eyebrow">PHARMES</p>
            <h1>Controle de Recebimento</h1>
          </div>
        </div>
        <div class="topbar-meta">
          <button class="btn btn-primary" id="filtersToggle" type="button" aria-expanded="false" aria-controls="filtersPanel">
            <span class="btn-icon">${iconFilter()}</span>
            <span>Filtros</span>
          </button>
          <button class="btn btn-secondary" id="exportButton" type="button">
            <span class="btn-icon">${iconExport()}</span>
            <span>Exportar</span>
          </button>
        </div>
      </header>

      <section class="filters-panel card" id="filtersPanel" aria-label="Filtros por filial e período" hidden>
        <form class="filters-grid" id="filtersForm">
          <label class="field">
            <span>Filial</span>
            <select id="branchSelect" name="branch">
              <option value="all" selected>Todas as filiais</option>
              <option value="JF - Centro">JF - Centro</option>
              <option value="Filial Juiz de Fora">Filial Juiz de Fora</option>
              <option value="Filial Barro Preto">Filial Barro Preto</option>
              <option value="Filial Palmeiras">Filial Palmeiras</option>
            </select>
          </label>

          <label class="field">
            <span>Nome do cliente</span>
            <input id="clientSearch" type="search" name="client" placeholder="Buscar cliente" autocomplete="off" />
          </label>

          <label class="field">
            <span>Requisição</span>
            <input id="requestSearch" type="search" name="request" placeholder="Ex.: OR-22091" autocomplete="off" />
          </label>

          <label class="field">
            <span>Período</span>
            <select id="periodSelect" name="period">
              <option value="today" selected>Hoje</option>
              <option value="week">Semana</option>
              <option value="month">Mês</option>
              <option value="custom">Personalizado</option>
            </select>
          </label>

          <div class="field-range" id="customRange" hidden>
            <label class="field">
              <span>Início</span>
              <input id="startDate" type="date" />
            </label>
            <label class="field">
              <span>Fim</span>
              <input id="endDate" type="date" />
            </label>
          </div>
          <button class="btn btn-primary filters-apply" type="submit">Aplicar</button>
        </form>
      </section>

      <section class="summary-grid summary-grid--digest" id="resumo" aria-label="Resumo de status">
        <article class="metric card metric-warn">
          <div class="metric-main">
            <span class="metric-icon" aria-hidden="true">${iconTruck()}</span>
            <div>
              <span class="metric-label">A receber</span>
              <strong class="metric-value" id="countAReceber">0</strong>
            </div>
          </div>
          <p class="metric-note">Entrada logística aguardada.</p>
        </article>
        <article class="metric card metric-success metric--quiet">
          <div class="metric-main">
            <span class="metric-icon" aria-hidden="true">${iconCheck()}</span>
            <div>
              <span class="metric-label">Recebido</span>
              <strong class="metric-value" id="countRecebido">0</strong>
            </div>
          </div>
          <p class="metric-note">Conferência concluída.</p>
        </article>
        <article class="metric card metric-danger metric--compact-alert">
          <div class="metric-main">
            <span class="metric-icon" aria-hidden="true">${iconClock()}</span>
            <div>
              <span class="metric-label">Pendentes</span>
              <strong class="metric-value" id="countPendentes">0</strong>
            </div>
          </div>
          <p class="metric-note">Pendências para tratativa imediata.</p>
        </article>
      </section>

      <section class="kanban" id="kanban">
        <article class="column card column-a-receber">
          <div class="column-head">
            <div>
              <p class="column-label">Etapa 01</p>
              <h3><span class="column-icon" aria-hidden="true">${iconTruck()}</span>A receber</h3>
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

        <article class="column card column-recebido">
          <div class="column-head">
            <div>
              <p class="column-label">Etapa 02</p>
              <h3><span class="column-icon" aria-hidden="true">${iconCheck()}</span>Recebido</h3>
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

        <article class="column card column-pendente">
          <div class="column-head">
            <div>
              <p class="column-label">Etapa 03</p>
              <h3><span class="column-icon" aria-hidden="true">${iconClock()}</span>Pendentes</h3>
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
        <div class="formula-title-wrap">
          <h4 class="formula-title"></h4>
          <p class="formula-meta"></p>
        </div>
        <span class="status-chip"></span>
      </div>
      <div class="formula-rows">
        <div class="formula-row">
          <span class="formula-key">Cliente</span>
          <span class="formula-value formula-client"></span>
        </div>
        <div class="formula-row">
          <span class="formula-key">Código</span>
          <span class="formula-value formula-order"></span>
        </div>
        <div class="formula-row">
          <span class="formula-key">Filial</span>
          <span class="formula-value formula-origin"></span>
        </div>
        <div class="formula-row">
          <span class="formula-key">Data</span>
          <span class="formula-value">
            <span class="formula-date"></span>
            <span class="formula-divider">•</span>
            <span class="formula-time"></span>
          </span>
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

const formulaNames = [
  "Cloridrato de Sertralina 50mg",
  "Vitamina D3 + K2 cápsulas",
  "Creme de ureia 10% com glicerina",
  "Melatonina 3mg sublingual",
  "Minoxidil 5% solução capilar",
  "Magnésio quelato cápsulas",
  "Probiótico sachê pediátrico",
  "Coenzima Q10 100mg",
  "Sérum niacinamida 4%",
  "Ômega 3 concentrado",
  "Colágeno hidrolisado",
  "Loção calmante pós-procedimento",
];

const branchNames = [
  "Filial Juiz de Fora",
  "Filial Barro Preto",
  "Filial Palmeiras",
  "JF - Centro",
];

const clientNames = [
  "Marina Duarte",
  "Carlos Henrique",
  "Ana Beatriz",
  "Renata Alves",
  "Paulo Roberto",
  "Juliana Martins",
  "Luciana Costa",
  "Sofia Almeida",
  "Eduardo Lima",
  "Bianca Torres",
  "Helena Rocha",
  "Rafael Moreira",
];

function makeFormulas(status, statusLabel, total, startId, startOrder, hourStart) {
  return Array.from({ length: total }, (_, index) => {
    const sequence = startId + index;
    const minutes = String((index * 11 + 20) % 60).padStart(2, "0");

    return {
      id: `F-${sequence}`,
      name: formulaNames[index % formulaNames.length],
      status,
      statusLabel,
      order: `OR-${startOrder + index}`,
      clientName: clientNames[index % clientNames.length],
      origin: branchNames[index % branchNames.length],
      destination: "JF - Centro",
      date: isoToday,
      time: `${String(hourStart + (index % 7)).padStart(2, "0")}:${minutes}`,
    };
  });
}

const formulas = [
  ...makeFormulas("a-receber", "A receber", 12, 10245, 22091, 8),
  ...makeFormulas("recebido", "Recebido", 27, 10310, 22180, 9),
  ...makeFormulas("pendentes", "Pendente", 7, 10420, 22260, 10),
];

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

const template = document.querySelector("#formula-template");
document.querySelector("#startDate").value = isoToday;
document.querySelector("#endDate").value = isoToday;

function renderCard(formula) {
  const node = template.content.cloneNode(true);
  node.querySelector(".formula-title").textContent = formula.name;
  node.querySelector(".formula-meta").textContent = formula.id;
  node.querySelector(".formula-client").textContent = formula.clientName;
  node.querySelector(".formula-order").textContent = formula.order;
  node.querySelector(".formula-origin").textContent = formula.origin;
  node.querySelector(".formula-date").textContent = formula.date;
  node.querySelector(".formula-time").textContent = formula.time;

  const chip = node.querySelector(".status-chip");
  chip.textContent = formula.statusLabel;
  chip.classList.add(
    formula.status === "a-receber"
      ? "badge-warn"
      : formula.status === "recebido"
        ? "badge-success"
        : "badge-danger",
  );

  const icon = node.querySelector(".formula-title-wrap");
  icon.insertAdjacentHTML("beforebegin", `<span class="formula-icon ${formula.status === "a-receber" ? "icon-warn" : formula.status === "recebido" ? "icon-success" : "icon-danger"}" aria-hidden="true">${getStageIcon(formula.status)}</span>`);

  return node;
}

function render() {
  const filteredFormulas = getFilteredFormulas();

  Object.values(columns).forEach((column) => {
    column.innerHTML = "";
  });

  Object.entries(columns).forEach(([status, column]) => {
    const formulasByStatus = filteredFormulas.filter((formula) => formula.status === status);
    const visibleFormulas = expandedColumns[status]
      ? formulasByStatus
      : formulasByStatus.slice(0, collapsedLimit);

    statusMeta[status].metric.textContent = formulasByStatus.length;
    statusMeta[status].badge.textContent = formulasByStatus.length;

    visibleFormulas.forEach((formula) => {
      column.appendChild(renderCard(formula));
    });

    updateColumnFooter(status, formulasByStatus.length);
  });
}

function getFilteredFormulas() {
  const branch = branchSelect.value;
  const clientQuery = normalizeSearch(clientSearch.value);
  const requestQuery = normalizeSearch(requestSearch.value);

  return formulas.filter((formula) => {
    const matchesBranch = branch === "all" || formula.origin === branch;
    const matchesClient =
      clientQuery === "" || normalizeSearch(formula.clientName).includes(clientQuery);
    const matchesRequest =
      requestQuery === "" || normalizeSearch(formula.order).includes(requestQuery);

    return matchesBranch && matchesClient && matchesRequest && isWithinSelectedPeriod(formula.date);
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
  const formulaDate = new Date(`${dateValue}T00:00:00`);
  const todayDate = new Date(`${isoToday}T00:00:00`);

  if (periodSelect.value === "today") {
    return dateValue === isoToday;
  }

  if (periodSelect.value === "week") {
    const daysAgo = (todayDate - formulaDate) / 86400000;
    return daysAgo >= 0 && daysAgo <= 6;
  }

  if (periodSelect.value === "month") {
    return (
      formulaDate.getFullYear() === todayDate.getFullYear() &&
      formulaDate.getMonth() === todayDate.getMonth()
    );
  }

  if (periodSelect.value === "custom") {
    const start = document.querySelector("#startDate").value || isoToday;
    const end = document.querySelector("#endDate").value || isoToday;
    return dateValue >= start && dateValue <= end;
  }

  return true;
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

const filtersToggle = document.querySelector("#filtersToggle");
const filtersPanel = document.querySelector("#filtersPanel");
const filtersForm = document.querySelector("#filtersForm");
const branchSelect = document.querySelector("#branchSelect");
const periodSelect = document.querySelector("#periodSelect");
const customRange = document.querySelector("#customRange");
const clientSearch = document.querySelector("#clientSearch");
const requestSearch = document.querySelector("#requestSearch");

filtersToggle.addEventListener("click", () => {
  const shouldOpen = filtersPanel.hidden;
  filtersPanel.hidden = !shouldOpen;
  filtersToggle.setAttribute("aria-expanded", String(shouldOpen));
});

periodSelect.addEventListener("change", () => {
  customRange.hidden = periodSelect.value !== "custom";
});

filtersForm.addEventListener("submit", (event) => {
  event.preventDefault();
  Object.keys(expandedColumns).forEach((status) => {
    expandedColumns[status] = false;
  });
  render();
});

document.querySelectorAll(".column-footer").forEach((button) => {
  button.addEventListener("click", () => {
    const { status } = button.dataset;
    expandedColumns[status] = !expandedColumns[status];
    render();
  });
});

render();

document.querySelector("#exportButton").addEventListener("click", () => {
  const payload = formulas.map((formula) => ({
    codigo: formula.id,
    formula: formula.name,
    cliente: formula.clientName,
    filial: formula.origin,
    destino: formula.destination,
    data: formula.date,
    horario: formula.time,
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
});

function getStageIcon(status) {
  if (status === "a-receber") {
    return iconTruck();
  }

  if (status === "recebido") {
    return iconCheck();
  }

  return iconClock();
}
