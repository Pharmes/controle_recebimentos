const formulas = [
  {
    id: "F-10245",
    name: "Cloridrato de Sertralina 50mg",
    status: "a-receber",
    statusLabel: "A receber",
    order: "OR-22091",
    pcp: "PCP logística saída",
    origin: "Filial Juiz de Fora",
    destination: "JF - Centro",
    time: "Previsto para chegada hoje, 14:30",
  },
  {
    id: "F-10246",
    name: "Vitamina D3 + K2 cápsulas",
    status: "recebido",
    statusLabel: "Recebido",
    order: "OR-22088",
    pcp: "PCP balcão",
    origin: "Filial Barro Preto",
    destination: "JF - Centro",
    time: "Conferido às 09:12",
  },
  {
    id: "F-10247",
    name: "Magnésio quelado 300mg",
    status: "pendente",
    statusLabel: "Pendente",
    order: "OR-22102",
    pcp: "Sem PCP localizado",
    origin: "Filial Palmeiras",
    destination: "JF - Centro",
    time: "Aguardando integração ERP",
  },
];

const columns = {
  "a-receber": document.querySelector("#col-a-receber"),
  recebido: document.querySelector("#col-recebido"),
  pendentes: document.querySelector("#col-pendentes"),
};

const counts = {
  "a-receber": document.querySelector("#countAReceber"),
  recebido: document.querySelector("#countRecebido"),
  pendentes: document.querySelector("#countPendentes"),
};

const badges = {
  "a-receber": document.querySelector("#badgeAReceber"),
  recebido: document.querySelector("#badgeRecebido"),
  pendentes: document.querySelector("#badgePendentes"),
};

const template = document.querySelector("#formula-template");

function renderCard(formula) {
  const node = template.content.cloneNode(true);
  const card = node.querySelector(".formula-card");

  node.querySelector(".formula-title").textContent = formula.name;
  node.querySelector(".formula-meta").textContent = formula.id;
  node.querySelector(".formula-order").textContent = formula.order;
  node.querySelector(".formula-pcp").textContent = formula.pcp;
  node.querySelector(".formula-origin").textContent = formula.origin;
  node.querySelector(".formula-destination").textContent = formula.destination;
  node.querySelector(".formula-time").textContent = formula.time;

  const chip = node.querySelector(".status-chip");
  chip.textContent = formula.statusLabel;
  chip.classList.add(
    formula.status === "a-receber"
      ? "badge-warn"
      : formula.status === "recebido"
        ? "badge-success"
        : "badge-danger"
  );

  card.dataset.status = formula.status;
  return node;
}

function render() {
  Object.values(columns).forEach((column) => {
    column.innerHTML = "";
  });

  formulas.forEach((formula) => {
    columns[formula.status].appendChild(renderCard(formula));
  });

  const grouped = formulas.reduce(
    (acc, formula) => {
      acc[formula.status] += 1;
      return acc;
    },
    { "a-receber": 0, recebido: 0, pendentes: 0 }
  );

  counts["a-receber"].textContent = grouped["a-receber"];
  counts.recebido.textContent = grouped.recebido;
  counts.pendentes.textContent = grouped.pendentes;

  badges["a-receber"].textContent = grouped["a-receber"];
  badges.recebido.textContent = grouped.recebido;
  badges.pendentes.textContent = grouped.pendentes;
}

const themeToggle = document.querySelector("#themeToggle");
themeToggle.addEventListener("click", () => {
  document.documentElement.classList.toggle("dark");
});

render();
