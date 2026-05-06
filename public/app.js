// ── Config ─────────────────────────────────────
const API = '/api/transactions'; // Base API URL

// ── Category icon map ──────────────────────────
const catIcons = {
  Food:'ti-fork', Transport:'ti-bus', Shopping:'ti-shopping-bag',
  Entertainment:'ti-device-tv', Health:'ti-pill', Utilities:'ti-bolt',
  Education:'ti-school', Other:'ti-box', Salary:'ti-briefcase',
  Freelance:'ti-laptop', Gift:'ti-gift'
};

const categories = Object.keys(catIcons);

let currentType = 'expense';
let editingId = null; // Track if we are editing

// ── Init ───────────────────────────────────────
document.getElementById('todayDate').textContent =
  new Date().toLocaleDateString('en-IN', { weekday:'short', day:'numeric', month:'long' });
document.getElementById('date').value = new Date().toISOString().split('T')[0];

function populateCategories() {
  const select = document.getElementById('category');
  const filterSelect = document.getElementById('filterCat');
  
  select.innerHTML = '';
  filterSelect.innerHTML = '<option value="all">All categories</option>';

  categories.forEach(cat => {
    select.innerHTML += `<option value="${cat}">${cat}</option>`;
    filterSelect.innerHTML += `<option value="${cat}">${cat}</option>`;
  });
}

populateCategories();

// ── Toast notification ─────────────────────────
function showToast(msg, type = 'success') {
  const icon = type === 'success' ? 'ti-circle-check' : 'ti-circle-x';
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.innerHTML = `<i class="ti ${icon} ${type}"></i> ${msg}`;
  document.body.appendChild(t);
  setTimeout(() => { t.style.opacity = '0'; setTimeout(() => t.remove(), 300); }, 2500);
}

// ── Toggle Expense / Income ────────────────────
function setType(type) {
  currentType = type;
  document.getElementById('btnExpense').className = 'type-btn' + (type === 'expense' ? ' active-expense' : '');
  document.getElementById('btnIncome').className  = 'type-btn' + (type === 'income'  ? ' active-income'  : '');
}

// ── Load summary from API ──────────────────────
async function loadSummary() {
  try {
    const res  = await fetch(`${API}/summary`);
    const json = await res.json();
    if (!json.success) return;

    const { income, expense, balance, byCategory } = json.data;

    document.getElementById('totalIncome').textContent  = '₹' + income.toLocaleString('en-IN');
    document.getElementById('totalExpense').textContent = '₹' + expense.toLocaleString('en-IN');
    const balEl = document.getElementById('balance');
    balEl.textContent  = (balance < 0 ? '-' : '') + '₹' + Math.abs(balance).toLocaleString('en-IN');
    balEl.style.color  = balance >= 0 ? '#00C896' : '#FF5C5C';

    renderChart(byCategory);
  } catch (err) {
    console.error('Summary error:', err);
  }
}

// ── Load & render transactions from API ────────
async function loadTransactions() {
  const filterType = document.getElementById('filterType').value;
  const filterCat  = document.getElementById('filterCat').value;

  const params = new URLSearchParams();
  if (filterType !== 'all') params.set('type', filterType);
  if (filterCat  !== 'all') params.set('category', filterCat);

  const listEl = document.getElementById('txList');
  listEl.innerHTML = '<div class="loading"><div class="spinner"></div> Loading...</div>';

  try {
    const res  = await fetch(`${API}?${params}`);
    const json = await res.json();
    if (!json.success) throw new Error(json.message);

    const txs = json.data;

    if (txs.length === 0) {
      listEl.innerHTML = `<div class="empty"><i class="ti ti-receipt-off"></i>No transactions found</div>`;
      return;
    }

    listEl.innerHTML = txs.map(tx => {
      const icon    = catIcons[tx.category] || 'ti-box';
      const sign    = tx.type === 'expense' ? '-' : '+';
      const dateStr = new Date(tx.date + 'T00:00:00').toLocaleDateString('en-IN', { day:'numeric', month:'short' });
      // Escape desc for safe quotes
      const safeDesc = tx.desc.replace(/'/g, "\\'");
      return `
        <div class="tx">
          <div class="tx-ico ${tx.type}"><i class="ti ${icon}"></i></div>
          <div class="tx-body">
            <div class="tx-name">${tx.desc}</div>
            <div class="tx-meta">${tx.category} &middot; ${dateStr}</div>
          </div>
          <span class="tx-amt ${tx.type}">${sign}₹${Number(tx.amount).toLocaleString('en-IN')}</span>
          <div class="tx-actions">
            <button class="tx-action-btn edit-btn" onclick="startEdit(${tx.id}, '${safeDesc}', ${tx.amount}, '${tx.category}', '${tx.date}', '${tx.type}')" aria-label="Edit">
              <i class="ti ti-pencil"></i>
            </button>
            <button class="tx-action-btn del-btn" onclick="deleteTransaction(${tx.id})" aria-label="Delete">
              <i class="ti ti-trash"></i>
            </button>
          </div>
        </div>`;
    }).join('');

  } catch (err) {
    listEl.innerHTML = `<div class="empty"><i class="ti ti-wifi-off"></i>Could not load data</div>`;
    console.error('Load error:', err);
  }
}

// ── Save Transaction (Add or Edit) ──────────────
async function saveTransaction() {
  const desc     = document.getElementById('desc').value.trim();
  const amount   = parseFloat(document.getElementById('amount').value);
  const category = document.getElementById('category').value;
  const date     = document.getElementById('date').value;

  if (!desc)                  { showToast('Please enter a description.', 'error'); return; }
  if (!amount || amount <= 0) { showToast('Enter a valid amount.', 'error'); return; }
  if (!date)                  { showToast('Please select a date.', 'error'); return; }

  const btn = document.getElementById('btnSave');
  btn.disabled = true;
  const originalHtml = btn.innerHTML;
  btn.innerHTML = '<div class="spinner"></div> Saving...';

  const method = editingId ? 'PUT' : 'POST';
  const url = editingId ? `${API}/${editingId}` : API;

  try {
    const res  = await fetch(url, {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ desc, amount, category, date, type: currentType })
    });
    const json = await res.json();

    if (!json.success) throw new Error(json.message);

    showToast(editingId ? 'Transaction updated!' : 'Transaction added!', 'success');
    cancelEdit();
    loadAll();

  } catch (err) {
    showToast(err.message || 'Something went wrong.', 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = originalHtml;
  }
}

// ── Start Edit ──────────────────────────────────
function startEdit(id, desc, amount, category, date, type) {
  editingId = id;
  
  // Populate form
  document.getElementById('desc').value = desc;
  document.getElementById('amount').value = amount;
  document.getElementById('category').value = category;
  document.getElementById('date').value = date;
  
  setType(type);
  
  // Update UI to edit mode
  document.querySelector('.panel-title').textContent = 'Edit Transaction';
  const btnSave = document.getElementById('btnSave');
  btnSave.innerHTML = '<i class="ti ti-check"></i> Update';
  
  document.getElementById('cancelContainer').style.display = 'block';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ── Cancel Edit ─────────────────────────────────
function cancelEdit() {
  editingId = null;
  
  // Reset form
  document.getElementById('desc').value = '';
  document.getElementById('amount').value = '';
  document.getElementById('category').value = categories[0];
  document.getElementById('date').value = new Date().toISOString().split('T')[0];
  
  setType('expense');
  
  // Restore Add mode UI
  document.querySelector('.panel-title').textContent = 'Add Transaction';
  const btnSave = document.getElementById('btnSave');
  btnSave.innerHTML = '<i class="ti ti-plus"></i> Add Transaction';
  
  document.getElementById('cancelContainer').style.display = 'none';
}

// ── Delete transaction via DELETE ──────────────
async function deleteTransaction(id) {
  if (!confirm('Are you sure you want to delete this transaction?')) return;
  
  try {
    const res  = await fetch(`${API}/${id}`, { method: 'DELETE' });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    showToast('Transaction deleted.', 'success');
    
    // If we're editing the deleted transaction, cancel the edit
    if (editingId === id) cancelEdit();
    
    loadAll();
  } catch (err) {
    showToast('Could not delete.', 'error');
  }
}

// ── Render spending bar chart ──────────────────
function renderChart(byCategory) {
  const el = document.getElementById('barChart');
  if (!byCategory || byCategory.length === 0) {
    el.innerHTML = `<div class="empty" style="padding:1rem 0"><i class="ti ti-chart-bar" style="font-size:30px;display:block;margin-bottom:8px;opacity:.3"></i>No expense data yet</div>`;
    return;
  }
  const max = byCategory[0].total;
  el.innerHTML = byCategory.map(({ category, total }) => {
    const pct = Math.round((total / max) * 100);
    return `
      <div class="b-row">
        <div class="b-cat">${category}</div>
        <div class="b-track"><div class="b-fill" style="width:${pct}%"></div></div>
        <div class="b-val">₹${Number(total).toLocaleString('en-IN')}</div>
      </div>`;
  }).join('');
}

// ── Load everything ────────────────────────────
function loadAll() {
  loadSummary();
  loadTransactions();
}

// Initial load
loadAll();
