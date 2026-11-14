/* ===== สรุปมือถือ – Logic หลัก (localStorage) ===== */
"use strict";

/* ---------- Storage ---------- */
const STORE_KEY = "lifeTrackerData";

const data = {
  money: [],   // {id, type: 'income'|'expense', amount, note, date}
  todos: [],   // {id, text, done}
  notes: [],   // {id, title, body, createdAt}
  counters: [] // {id, name, value}
};

function load() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) Object.assign(data, JSON.parse(raw));
  } catch (e) { console.error("โหลดข้อมูลไม่สำเร็จ", e); }
}

function save() {
  localStorage.setItem(STORE_KEY, JSON.stringify(data));
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function fmt(n) {
  return Number(n).toLocaleString("th-TH", { maximumFractionDigits: 2 });
}

/* ---------- แท็บ / นำทาง ---------- */
const titles = {
  dashboard: "สรุปภาพรวม",
  money: "รายรับ – รายจ่าย",
  todo: "To-Do List",
  notes: "บันทึกงาน",
  counter: "ตัวนับกิจกรรม",
};

document.getElementById("bottomNav").addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-tab]");
  if (!btn) return;
  const tab = btn.dataset.tab;

  document.querySelectorAll(".bottom-nav button").forEach(b => b.classList.toggle("active", b === btn));
  document.querySelectorAll(".tab").forEach(t => { t.hidden = t.id !== "tab-" + tab; });
  document.getElementById("pageTitle").textContent = titles[tab];
});

/* ---------- รายรับรายจ่าย ---------- */
const moneyForm = document.getElementById("moneyForm");

moneyForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const type = document.querySelector('input[name="moneyType"]:checked').value;
  const amount = parseFloat(document.getElementById("moneyAmount").value);
  const note = document.getElementById("moneyNote").value.trim();
  const date = document.getElementById("moneyDate").value || new Date().toISOString().slice(0, 10);
  if (!amount || amount <= 0) return;

  data.money.push({ id: uid(), type, amount, note, date });
  save();
  moneyForm.reset();
  document.getElementById("moneyDate").value = date;
  renderAll();
});

function moneyTotals(filterMonth = true) {
  const now = new Date().toISOString().slice(0, 7); // "YYYY-MM"
  let items = data.money;
  if (filterMonth) items = items.filter(m => m.date.startsWith(now));
  const income = items.filter(m => m.type === "income").reduce((s, m) => s + m.amount, 0);
  const expense = items.filter(m => m.type === "expense").reduce((s, m) => s + m.amount, 0);
  return { income, expense, balance: income - expense };
}

function renderMoney() {
  const t = moneyTotals();
  document.getElementById("dashIncome").textContent = fmt(t.income);
  document.getElementById("dashExpense").textContent = fmt(t.expense);
  document.getElementById("dashBalance").textContent = fmt(t.balance);
  document.getElementById("moneyIncome").textContent = fmt(t.income);
  document.getElementById("moneyExpense").textContent = fmt(t.expense);
  document.getElementById("moneyBalance").textContent = fmt(t.balance);

  const list = document.getElementById("moneyList");
  const items = [...data.money].sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
  list.innerHTML = "";
  items.forEach(m => {
    const li = document.createElement("li");
    li.innerHTML = `
      <div class="item-main">
        <div class="item-title">${m.note || (m.type === "income" ? "รายรับ" : "รายจ่าย")}</div>
        <div class="item-sub">${m.date}</div>
      </div>
      <span class="money-amount ${m.type}">${m.type === "income" ? "+" : "-"}${fmt(m.amount)}</span>
      <button class="btn-icon" data-del="${m.id}" data-store="money">🗑️</button>`;
    list.appendChild(li);
  });
}

/* ---------- To-Do ---------- */
document.getElementById("todoForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const input = document.getElementById("todoText");
  const text = input.value.trim();
  if (!text) return;
  data.todos.push({ id: uid(), text, done: false });
  input.value = "";
  save();
  renderAll();
});

function renderTodo() {
  const list = document.getElementById("todoList");
  const empty = document.getElementById("todoEmpty");
  list.innerHTML = "";
  empty.hidden = data.todos.length > 0;

  const undone = data.todos.filter(t => !t.done).length;
  document.getElementById("dashTodo").textContent =
    data.todos.length === 0 ? "ยังไม่มีรายการ"
      : `เหลืออีก ${undone} รายการ จากทั้งหมด ${data.todos.length}`;

  [...data.todos].reverse().forEach(t => {
    const li = document.createElement("li");
    if (t.done) li.classList.add("done");
    li.innerHTML = `
      <input type="checkbox" class="todo-check" ${t.done ? "checked" : ""} data-check="${t.id}" />
      <div class="item-main"><div class="item-title">${escapeHtml(t.text)}</div></div>
      <button class="btn-icon" data-del="${t.id}" data-store="todos">🗑️</button>`;
    list.appendChild(li);
  });
}

/* ---------- บันทึกงาน (Notes) ---------- */
document.getElementById("noteForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const title = document.getElementById("noteTitle").value.trim();
  const body = document.getElementById("noteBody").value.trim();
  if (!title) return;
  data.notes.push({ id: uid(), title, body, createdAt: new Date().toLocaleDateString("th-TH") });
  e.target.reset();
  save();
  renderAll();
});

function renderNotes() {
  const list = document.getElementById("noteList");
  const empty = document.getElementById("noteEmpty");
  list.innerHTML = "";
  empty.hidden = data.notes.length > 0;

  [...data.notes].reverse().forEach(n => {
    const li = document.createElement("li");
    li.innerHTML = `
      <div class="item-main">
        <div class="item-title">${escapeHtml(n.title)}</div>
        ${n.body ? `<div class="item-sub">${escapeHtml(n.body)}</div>` : ""}
        <div class="item-sub">${n.createdAt}</div>
      </div>
      <button class="btn-icon" data-del="${n.id}" data-store="notes">🗑️</button>`;
    list.appendChild(li);
  });
}

/* ---------- ตัวนับ ---------- */
document.getElementById("counterForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const name = document.getElementById("counterName").value.trim();
  if (!name) return;
  data.counters.push({ id: uid(), name, value: 0 });
  e.target.reset();
  save();
  renderAll();
});

function renderCounters() {
  const wrap = document.getElementById("counterList");
  const empty = document.getElementById("counterEmpty");
  const dash = document.getElementById("dashCounters");
  wrap.innerHTML = "";
  dash.innerHTML = "";
  empty.hidden = data.counters.length > 0;

  data.counters.forEach(c => {
    // การ์ดในแท็บตัวนับ (มีปุ่มครบ)
    const el = document.createElement("div");
    el.className = "counter-item";
    el.innerHTML = `
      <div class="counter-name">${escapeHtml(c.name)}</div>
      <button class="btn-round minus" data-cdec="${c.id}">−</button>
      <span class="counter-value">${c.value}</span>
      <button class="btn-round" data-cinc="${c.id}">＋</button>
      <button class="btn-round reset" data-creset="${c.id}">รีเซ็ต</button>
      <button class="btn-icon" data-del="${c.id}" data-store="counters">🗑️</button>`;
    wrap.appendChild(el);

    // สรุปบนหน้าแรก
    const mini = document.createElement("div");
    mini.className = "counter-item";
    mini.innerHTML = `
      <div class="counter-name">${escapeHtml(c.name)}</div>
      <span class="counter-value">${c.value} ครั้ง</span>`;
    dash.appendChild(mini);
  });
}

/* ---------- คลิกรวม (event delegation) ---------- */
document.addEventListener("click", (e) => {
  // ลบรายการ
  const del = e.target.closest("[data-del]");
  if (del) {
    const store = del.dataset.store;
    const id = del.dataset.del;
    data[store] = data[store].filter(x => x.id !== id);
    save();
    renderAll();
    return;
  }
  // เปิด/ปิด todo
  const check = e.target.closest("[data-check]");
  if (check) {
    const t = data.todos.find(x => x.id === check.dataset.check);
    if (t) { t.done = check.checked; save(); renderAll(); }
    return;
  }
  // ตัวนับ + / − / รีเซ็ต
  const inc = e.target.closest("[data-cinc]");
  const dec = e.target.closest("[data-cdec]");
  const reset = e.target.closest("[data-creset]");
  if (inc || dec || reset) {
    const id = (inc || dec || reset).dataset.cinc || (inc || dec || reset).dataset.cdec || (inc || dec || reset).dataset.creset;
    const c = data.counters.find(x => x.id === id);
    if (c) {
      if (inc) c.value++;
      else if (dec) c.value = Math.max(0, c.value - 1);
      else c.value = 0;
      save();
      renderAll();
    }
  }
});

/* ---------- Utility ---------- */
function escapeHtml(s) {
  const d = document.createElement("div");
  d.textContent = s;
  return d.innerHTML;
}

function renderAll() {
  renderMoney();
  renderTodo();
  renderNotes();
  renderCounters();
}

/* ---------- เริ่มต้น ---------- */
document.getElementById("moneyDate").value = new Date().toISOString().slice(0, 10);
load();
renderAll();
