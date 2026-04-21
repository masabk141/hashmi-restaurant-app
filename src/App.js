import React, { useState, useEffect, useMemo } from 'react';
import './App.css';

// ── CONSTANTS ──────────────────────────────────────────────────────────────
const EXPENSE_CATEGORIES = [
  'Meat / Butcher','Vegetables','Beverages','Rice / Grain','Oil',
  'PESCO (Electricity)','Gas','Equipment Repair','Payroll / Wages',
  'Condiments / Spices','Cleaning Supplies','Packaging','Operating Expenses','Other'
];

const CUSTOMER_CATEGORIES = [
  'Dine-In','Takeaway','Catering Order','Home Delivery','Event Booking','Advance Booking','Other'
];

const DEFAULT_OWNERS = [
  { id:'owner1', name:'Owner 1', email:'owner1@hashmi.com', password:'hashmi123', role:'owner' },
  { id:'owner2', name:'Owner 2', email:'owner2@hashmi.com', password:'hashmi123', role:'owner' },
  { id:'owner3', name:'Owner 3', email:'owner3@hashmi.com', password:'hashmi123', role:'owner' },
];

const SEED_TRANSACTIONS = [
  { id:1, date:'2026-04-10', section:'expense', party:'Al-Hamza Meats',    category:'Meat / Butcher',       amount:18500, status:'Paid',   notes:'Weekly supply', createdBy:'Owner 1' },
  { id:2, date:'2026-04-11', section:'expense', party:'Karimi Vegetables', category:'Vegetables',           amount:7200,  status:'Unpaid', notes:'',              createdBy:'Manager' },
  { id:3, date:'2026-04-12', section:'customer',party:'Dine-In Sales',     category:'Dine-In',              amount:45000, status:'Paid',   notes:'Lunch service', createdBy:'Manager' },
  { id:4, date:'2026-04-13', section:'expense', party:'PESCO',             category:'PESCO (Electricity)',  amount:9800,  status:'Paid',   notes:'April bill',    createdBy:'Owner 1' },
  { id:5, date:'2026-04-14', section:'expense', party:'Rice Bazaar Co.',   category:'Rice / Grain',         amount:12000, status:'Unpaid', notes:'',              createdBy:'Manager' },
  { id:6, date:'2026-04-15', section:'customer',party:'Catering - Malik',  category:'Catering Order',       amount:32000, status:'Unpaid', notes:'Wedding event', createdBy:'Manager' },
  { id:7, date:'2026-04-16', section:'expense', party:'Staff Wages',       category:'Payroll / Wages',      amount:55000, status:'Paid',   notes:'April payroll', createdBy:'Owner 2' },
  { id:8, date:'2026-04-17', section:'expense', party:'Cooking Oil Depot', category:'Oil',                  amount:6500,  status:'Paid',   notes:'',              createdBy:'Manager' },
];

// ── HELPERS ────────────────────────────────────────────────────────────────
const fmt = n => 'PKR ' + Number(n).toLocaleString('en-PK');
const today = () => new Date().toISOString().split('T')[0];

function getDeviceInfo() {
  const ua = navigator.userAgent;
  let device = 'Unknown Device';
  if (/iPhone/.test(ua)) device = 'iPhone';
  else if (/iPad/.test(ua)) device = 'iPad';
  else if (/Android/.test(ua)) device = 'Android Device';
  else if (/Windows/.test(ua)) device = 'Windows PC';
  else if (/Mac/.test(ua)) device = 'MacBook / iMac';
  else if (/Linux/.test(ua)) device = 'Linux PC';
  const browser = /Chrome/.test(ua) ? 'Chrome' : /Firefox/.test(ua) ? 'Firefox' : /Safari/.test(ua) ? 'Safari' : /Edge/.test(ua) ? 'Edge' : 'Browser';
  return `${device} · ${browser}`;
}

function downloadCSV(data, filename) {
  const headers = ['Date','Section','Party','Category','Amount (PKR)','Status','Notes','Added By'];
  const rows = data.map(t => [t.date, t.section==='expense'?'Restaurant Expense':'Customer', t.party, t.category, t.amount, t.status, t.notes||'', t.createdBy||'']);
  const csv = [headers,...rows].map(r => r.map(c=>`"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
  const blob = new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8;'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href=url; a.download=filename; a.click();
  URL.revokeObjectURL(url);
}

function downloadReportCSV(transactions) {
  const expTx = transactions.filter(t=>t.section==='expense');
  const cusTx = transactions.filter(t=>t.section==='customer');
  const totalExp = expTx.reduce((s,t)=>s+t.amount,0);
  const totalCus = cusTx.reduce((s,t)=>s+t.amount,0);
  const unpaid = transactions.filter(t=>t.status==='Unpaid').reduce((s,t)=>s+t.amount,0);

  const catMap={};
  transactions.forEach(t=>{catMap[t.category]=(catMap[t.category]||0)+t.amount;});

  const lines = [
    ['HASHMI RESTAURANT - FINANCIAL REPORT'],
    ['Generated:', new Date().toLocaleDateString('en-PK',{day:'numeric',month:'long',year:'numeric'})],
    [''],['=== SUMMARY ==='],
    ['Total Restaurant Expenses', totalExp],
    ['Total Customer Revenue', totalCus],
    ['Total Outstanding Unpaid', unpaid],
    ['Net Profit / Loss', totalCus - totalExp],
    [''],['=== EXPENSES BY CATEGORY ==='],['Category','Amount (PKR)'],
    ...Object.entries(catMap).filter(([k])=>EXPENSE_CATEGORIES.includes(k)).sort((a,b)=>b[1]-a[1]).map(([k,v])=>[k,v]),
    [''],['=== CUSTOMER REVENUE BY CATEGORY ==='],['Category','Amount (PKR)'],
    ...Object.entries(catMap).filter(([k])=>CUSTOMER_CATEGORIES.includes(k)).sort((a,b)=>b[1]-a[1]).map(([k,v])=>[k,v]),
  ];
  const csv = lines.map(r=>r.map(c=>`"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
  const blob = new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8;'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href=url; a.download=`Hashmi_Report_${today()}.csv`; a.click();
  URL.revokeObjectURL(url);
}

// ── STORAGE ────────────────────────────────────────────────────────────────
function loadLS(key, fallback) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch(e) { return fallback; }
}
function saveLS(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch(e) {} }

// ══════════════════════════════════════════════════════════════════════════
// MAIN APP
// ══════════════════════════════════════════════════════════════════════════
export default function App() {
  const [currentUser, setCurrentUser]       = useState(null);
  const [transactions, setTransactions]     = useState(() => loadLS('hm_txns', SEED_TRANSACTIONS));
  const [users, setUsers]                   = useState(() => loadLS('hm_users', DEFAULT_OWNERS));
  const [loginLogs, setLoginLogs]           = useState(() => loadLS('hm_logs', []));
  const [page, setPage]                     = useState('dashboard');
  const [toast, setToast]                   = useState({ msg:'', ok:true, show:false });

  useEffect(() => { saveLS('hm_txns', transactions); }, [transactions]);
  useEffect(() => { saveLS('hm_users', users); }, [users]);
  useEffect(() => { saveLS('hm_logs', loginLogs); }, [loginLogs]);

  function showToast(msg, ok=true) {
    setToast({msg,ok,show:true});
    setTimeout(()=>setToast(t=>({...t,show:false})),2800);
  }

  function handleLogin(email, password) {
    const user = users.find(u => u.email.toLowerCase()===email.toLowerCase() && u.password===password);
    if (!user) { showToast('Invalid email or password.', false); return; }
    const log = {
      id: Date.now(), userId: user.id, userName: user.name, role: user.role,
      time: new Date().toLocaleString('en-PK'), device: getDeviceInfo(),
      location: 'Pakistan (Browser-based)'
    };
    setLoginLogs(prev => [log, ...prev].slice(0,100));
    setCurrentUser(user);
    setPage('dashboard');
    showToast(`Welcome back, ${user.name}!`);
  }

  function handleLogout() { setCurrentUser(null); setPage('dashboard'); }

  function markPaid(id) {
    setTransactions(prev => prev.map(t => t.id===id ? {...t, status:'Paid', paidAt: new Date().toLocaleString('en-PK')} : t));
    showToast('Marked as Paid!');
  }

  function deleteTransaction(id) {
    if (currentUser?.role !== 'owner') { showToast('Only owners can delete records.', false); return; }
    if (!window.confirm('Permanently delete this transaction?')) return;
    setTransactions(prev => prev.filter(t => t.id!==id));
    showToast('Transaction deleted.');
  }

  function addTransaction(tx) {
    setTransactions(prev => [{...tx, id:Date.now(), createdBy: currentUser?.name||'Unknown'}, ...prev]);
    showToast('Transaction recorded!');
  }

  function clearHistory() {
    if (currentUser?.role !== 'owner') { showToast('Only owners can clear history.', false); return; }
    if (!window.confirm('Clear ALL transaction history? This cannot be undone.')) return;
    setTransactions([]);
    showToast('History cleared.');
  }

  function addManager(manager) {
    setUsers(prev => [...prev, {...manager, id:'mgr_'+Date.now(), role:'manager'}]);
    showToast('Manager added!');
  }

  function removeManager(id) {
    if (!window.confirm('Remove this manager?')) return;
    setUsers(prev => prev.filter(u => u.id!==id));
    showToast('Manager removed.');
  }

  if (!currentUser) return (
    <LoginPage onLogin={handleLogin} toast={toast}/>
  );

  return (
    <div className="app">
      <Header currentUser={currentUser} page={page} setPage={setPage} onLogout={handleLogout}/>
      <main className="main-content">
        {page==='dashboard'  && <DashboardPage transactions={transactions} currentUser={currentUser} setPage={setPage} markPaid={markPaid}/>}
        {page==='expenses'   && <ExpensesPage  transactions={transactions} addTransaction={addTransaction} markPaid={markPaid} deleteTransaction={deleteTransaction} currentUser={currentUser}/>}
        {page==='customers'  && <CustomersPage transactions={transactions} addTransaction={addTransaction} markPaid={markPaid} deleteTransaction={deleteTransaction} currentUser={currentUser}/>}
        {page==='history'    && <HistoryPage   transactions={transactions} markPaid={markPaid} deleteTransaction={deleteTransaction} clearHistory={clearHistory} currentUser={currentUser}/>}
        {page==='reports'    && <ReportsPage   transactions={transactions}/>}
        {page==='settings'   && currentUser.role==='owner' && <SettingsPage users={users} loginLogs={loginLogs} addManager={addManager} removeManager={removeManager} currentUser={currentUser}/>}
      </main>
      <footer className="footer">
        <span>Hashmi Restaurant Management System</span>
        <span>Logged in as <strong>{currentUser.name}</strong> · {currentUser.role.toUpperCase()}</span>
      </footer>
      {toast.show && <div className={`toast ${toast.ok?'tok':'terr'}`}>{toast.msg}</div>}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// LOGIN PAGE
// ══════════════════════════════════════════════════════════════════════════
function LoginPage({ onLogin, toast }) {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <div className="login-emblem">🍽</div>
          <div className="login-brand">HASHMI</div>
          <div className="login-sub">RESTAURANT MANAGEMENT</div>
        </div>
        <div className="login-form">
          <div className="field">
            <label>Email Address</label>
            <input type="email" placeholder="your@email.com" value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==='Enter'&&onLogin(email,password)}/>
          </div>
          <div className="field">
            <label>Password</label>
            <div className="pass-wrap">
              <input type={showPass?'text':'password'} placeholder="••••••••" value={password} onChange={e=>setPassword(e.target.value)} onKeyDown={e=>e.key==='Enter'&&onLogin(email,password)}/>
              <button className="show-btn" onClick={()=>setShowPass(s=>!s)} type="button">{showPass?'Hide':'Show'}</button>
            </div>
          </div>
          <button className="login-btn" onClick={()=>onLogin(email,password)}>Sign In</button>
          <div className="login-hint">
            <strong>Default Owner Logins:</strong><br/>
            owner1@hashmi.com / hashmi123<br/>
            owner2@hashmi.com / hashmi123<br/>
            owner3@hashmi.com / hashmi123
          </div>
        </div>
      </div>
      {toast.show && <div className={`toast ${toast.ok?'tok':'terr'}`}>{toast.msg}</div>}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// HEADER
// ══════════════════════════════════════════════════════════════════════════
function Header({ currentUser, page, setPage, onLogout }) {
  const isOwner = currentUser?.role === 'owner';
  const navItems = [
    {id:'dashboard', label:'Dashboard'},
    {id:'expenses',  label:'Restaurant Expenses'},
    {id:'customers', label:'Customer Transactions'},
    {id:'history',   label:'Full History'},
    {id:'reports',   label:'Reports'},
    ...(isOwner ? [{id:'settings', label:'Settings'}] : []),
  ];
  return (
    <header className="header">
      <div className="header-top">
        <div className="logo-wrap">
          <div className="logo-emblem">🍽</div>
          <div className="logo-text">
            <span className="logo-name">HASHMI</span>
            <span className="logo-tagline">RESTAURANT</span>
          </div>
        </div>
        <div className="header-user">
          <span className={`role-badge ${currentUser.role}`}>{currentUser.role.toUpperCase()}</span>
          <span className="user-name">{currentUser.name}</span>
          <button className="logout-btn" onClick={onLogout}>Sign Out</button>
        </div>
      </div>
      <nav className="header-nav">
        {navItems.map(n => (
          <button key={n.id} className={`nav-link ${page===n.id?'active':''}`} onClick={()=>setPage(n.id)}>{n.label}</button>
        ))}
      </nav>
    </header>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// DASHBOARD
// ══════════════════════════════════════════════════════════════════════════
function DashboardPage({ transactions, currentUser, setPage, markPaid }) {
  const expTx = transactions.filter(t=>t.section==='expense');
  const cusTx = transactions.filter(t=>t.section==='customer');
  const totalExp  = expTx.reduce((s,t)=>s+t.amount,0);
  const totalCus  = cusTx.reduce((s,t)=>s+t.amount,0);
  const totalUnpaid = transactions.filter(t=>t.status==='Unpaid').reduce((s,t)=>s+t.amount,0);
  const unpaidCount = transactions.filter(t=>t.status==='Unpaid').length;
  const net = totalCus - totalExp;

  const catMap={};
  expTx.forEach(t=>{catMap[t.category]=(catMap[t.category]||0)+t.amount;});
  const topCats = Object.entries(catMap).sort((a,b)=>b[1]-a[1]).slice(0,5);

  const recentUnpaid = transactions.filter(t=>t.status==='Unpaid').slice(0,5);

  return (
    <div className="page-wrap">
      <div className="page-heading">
        <h1 className="page-title">Dashboard</h1>
        <span className="page-date">{new Date().toLocaleDateString('en-PK',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}</span>
      </div>

      <div className="metrics-grid">
        <MetricCard label="Restaurant Expenses" value={fmt(totalExp)} sub={`${expTx.length} entries`} accent="red" icon="↑"/>
        <MetricCard label="Customer Revenue"    value={fmt(totalCus)} sub={`${cusTx.length} entries`} accent="green" icon="↓"/>
        <MetricCard label="Outstanding Unpaid"  value={fmt(totalUnpaid)} sub={`${unpaidCount} pending`} accent="yellow" icon="!"/>
        <MetricCard label="Net Profit / Loss"   value={fmt(net)} sub="Revenue minus Expenses" accent={net>=0?'green':'red'} icon="◎"/>
      </div>

      <div className="dash-row">
        <div className="info-card">
          <div className="info-card-title">Top Expense Categories</div>
          {topCats.length===0 && <div className="empty-msg">No expense data yet</div>}
          {topCats.map(([cat,amt],i)=>(
            <div className="cat-row" key={cat}>
              <span className="cat-rank">{i+1}</span>
              <span className="cat-name">{cat}</span>
              <div className="cat-track"><div className="cat-fill" style={{width:`${(amt/(topCats[0][1]||1))*100}%`}}></div></div>
              <span className="cat-amt">{fmt(amt)}</span>
            </div>
          ))}
        </div>

        <div className="info-card">
          <div className="info-card-title">Pending Payments ⚠️</div>
          {recentUnpaid.length===0 && <div className="empty-msg">All caught up! No unpaid items.</div>}
          {recentUnpaid.map(t=>(
            <div className="unpaid-row" key={t.id}>
              <div>
                <div className="up-party">{t.party}</div>
                <div className="up-meta">{t.category} · {t.date}</div>
              </div>
              <div className="up-right">
                <span className="up-amt">{fmt(t.amount)}</span>
                <button className="mark-paid-btn" onClick={()=>markPaid(t.id)}>Mark Paid</button>
              </div>
            </div>
          ))}
          {transactions.filter(t=>t.status==='Unpaid').length>5 &&
            <button className="link-btn" style={{marginTop:8}} onClick={()=>{}}>View all unpaid →</button>}
        </div>
      </div>

      <div className="dash-row">
        <div className="quick-links">
          <div className="ql-title">Quick Actions</div>
          <div className="ql-grid">
            <button className="ql-btn" onClick={()=>setPage('expenses')}>+ Add Expense</button>
            <button className="ql-btn ql-green" onClick={()=>setPage('customers')}>+ Add Customer</button>
            <button className="ql-btn ql-yellow" onClick={()=>setPage('history')}>View All History</button>
            <button className="ql-btn ql-outline" onClick={()=>setPage('reports')}>Download Reports</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// EXPENSES PAGE
// ══════════════════════════════════════════════════════════════════════════
function ExpensesPage({ transactions, addTransaction, markPaid, deleteTransaction, currentUser }) {
  const expTx = transactions.filter(t=>t.section==='expense');
  const [form, setForm] = useState({date:today(),party:'',category:'Meat / Butcher',amount:'',status:'Paid',notes:''});
  const [submitted, setSubmitted] = useState(false);

  function handleAdd() {
    if (!form.party.trim()||!form.amount||parseFloat(form.amount)<=0) { setSubmitted(true); return; }
    addTransaction({...form, section:'expense', amount:parseFloat(form.amount)});
    setForm({date:today(),party:'',category:'Meat / Butcher',amount:'',status:'Paid',notes:''});
    setSubmitted(false);
  }

  const total   = expTx.reduce((s,t)=>s+t.amount,0);
  const unpaid  = expTx.filter(t=>t.status==='Unpaid').reduce((s,t)=>s+t.amount,0);
  const paid    = expTx.filter(t=>t.status==='Paid').reduce((s,t)=>s+t.amount,0);

  return (
    <div className="page-wrap">
      <div className="page-heading">
        <h1 className="page-title">Restaurant Expenses</h1>
        <button className="download-btn" onClick={()=>downloadCSV(expTx,`Hashmi_Expenses_${today()}.csv`)}>⬇ Download Excel</button>
      </div>

      <div className="three-stats">
        <div className="ts-card red"><div className="ts-label">Total Expenses</div><div className="ts-val">{fmt(total)}</div></div>
        <div className="ts-card green"><div className="ts-label">Paid</div><div className="ts-val">{fmt(paid)}</div></div>
        <div className="ts-card yellow"><div className="ts-label">Unpaid</div><div className="ts-val">{fmt(unpaid)}</div></div>
      </div>

      <div className="add-layout">
        <div className="form-card">
          <div className="form-card-title">Add Expense Entry</div>
          <div className="form-grid">
            <div className="field"><label>Date *</label><input type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})}/></div>
            <div className="field"><label>Category *</label>
              <select value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>
                {EXPENSE_CATEGORIES.map(c=><option key={c}>{c}</option>)}
              </select>
            </div>
            <div className={`field full ${submitted&&!form.party.trim()?'err':''}`}>
              <label>Supplier / Party Name *</label>
              <input type="text" placeholder="e.g. Al-Hamza Meats" value={form.party} onChange={e=>setForm({...form,party:e.target.value})}/>
              {submitted&&!form.party.trim()&&<span className="err-msg">Required</span>}
            </div>
            <div className={`field ${submitted&&(!form.amount||parseFloat(form.amount)<=0)?'err':''}`}>
              <label>Amount (PKR) *</label>
              <input type="number" placeholder="0" min="0" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})}/>
            </div>
            <div className="field"><label>Status *</label>
              <select value={form.status} onChange={e=>setForm({...form,status:e.target.value})}>
                <option value="Paid">Paid</option>
                <option value="Unpaid">Unpaid / Pending</option>
              </select>
            </div>
            <div className="field full"><label>Notes (optional)</label>
              <input type="text" placeholder="Invoice number, remarks..." value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})}/>
            </div>
          </div>
          <button className="primary-btn" onClick={handleAdd}>+ Add Expense</button>
        </div>

        <div className="section-card" style={{flex:1,minWidth:0}}>
          <div className="section-header">
            <span className="section-title">Expense History</span>
            <span className="section-count">{expTx.length} entries</span>
          </div>
          <TxTable data={expTx.slice(0,20)} markPaid={markPaid} onDelete={deleteTransaction} canDelete={currentUser?.role==='owner'} showSection={false}/>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// CUSTOMERS PAGE
// ══════════════════════════════════════════════════════════════════════════
function CustomersPage({ transactions, addTransaction, markPaid, deleteTransaction, currentUser }) {
  const cusTx = transactions.filter(t=>t.section==='customer');
  const [form, setForm] = useState({date:today(),party:'',category:'Dine-In',amount:'',status:'Paid',notes:''});
  const [submitted, setSubmitted] = useState(false);

  function handleAdd() {
    if (!form.party.trim()||!form.amount||parseFloat(form.amount)<=0) { setSubmitted(true); return; }
    addTransaction({...form, section:'customer', amount:parseFloat(form.amount)});
    setForm({date:today(),party:'',category:'Dine-In',amount:'',status:'Paid',notes:''});
    setSubmitted(false);
  }

  const total  = cusTx.reduce((s,t)=>s+t.amount,0);
  const unpaid = cusTx.filter(t=>t.status==='Unpaid').reduce((s,t)=>s+t.amount,0);
  const paid   = cusTx.filter(t=>t.status==='Paid').reduce((s,t)=>s+t.amount,0);

  return (
    <div className="page-wrap">
      <div className="page-heading">
        <h1 className="page-title">Customer Transactions</h1>
        <button className="download-btn" onClick={()=>downloadCSV(cusTx,`Hashmi_Customers_${today()}.csv`)}>⬇ Download Excel</button>
      </div>

      <div className="three-stats">
        <div className="ts-card green"><div className="ts-label">Total Revenue</div><div className="ts-val">{fmt(total)}</div></div>
        <div className="ts-card green2"><div className="ts-label">Received</div><div className="ts-val">{fmt(paid)}</div></div>
        <div className="ts-card yellow"><div className="ts-label">Pending / Owed</div><div className="ts-val">{fmt(unpaid)}</div></div>
      </div>

      <div className="add-layout">
        <div className="form-card">
          <div className="form-card-title">Add Customer Transaction</div>
          <div className="form-grid">
            <div className="field"><label>Date *</label><input type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})}/></div>
            <div className="field"><label>Category *</label>
              <select value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>
                {CUSTOMER_CATEGORIES.map(c=><option key={c}>{c}</option>)}
              </select>
            </div>
            <div className={`field full ${submitted&&!form.party.trim()?'err':''}`}>
              <label>Customer / Party Name *</label>
              <input type="text" placeholder="e.g. Walk-in Customer or Malik Family" value={form.party} onChange={e=>setForm({...form,party:e.target.value})}/>
              {submitted&&!form.party.trim()&&<span className="err-msg">Required</span>}
            </div>
            <div className={`field ${submitted&&(!form.amount||parseFloat(form.amount)<=0)?'err':''}`}>
              <label>Amount (PKR) *</label>
              <input type="number" placeholder="0" min="0" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})}/>
            </div>
            <div className="field"><label>Status *</label>
              <select value={form.status} onChange={e=>setForm({...form,status:e.target.value})}>
                <option value="Paid">Paid / Received</option>
                <option value="Unpaid">Unpaid / Pending</option>
              </select>
            </div>
            <div className="field full"><label>Notes (optional)</label>
              <input type="text" placeholder="Event details, order number..." value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})}/>
            </div>
          </div>
          <button className="primary-btn green-btn" onClick={handleAdd}>+ Add Customer Transaction</button>
        </div>

        <div className="section-card" style={{flex:1,minWidth:0}}>
          <div className="section-header">
            <span className="section-title">Customer History</span>
            <span className="section-count">{cusTx.length} entries</span>
          </div>
          <TxTable data={cusTx.slice(0,20)} markPaid={markPaid} onDelete={deleteTransaction} canDelete={currentUser?.role==='owner'} showSection={false}/>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// FULL HISTORY PAGE
// ══════════════════════════════════════════════════════════════════════════
function HistoryPage({ transactions, markPaid, deleteTransaction, clearHistory, currentUser }) {
  const [filterSection, setFilterSection] = useState('');
  const [filterStatus,  setFilterStatus]  = useState('');
  const [filterDate,    setFilterDate]    = useState('');
  const [search,        setSearch]        = useState('');

  const filtered = useMemo(() => transactions.filter(t => {
    if (filterSection && t.section!==filterSection) return false;
    if (filterStatus  && t.status!==filterStatus)   return false;
    if (filterDate    && t.date!==filterDate)        return false;
    if (search && !t.party.toLowerCase().includes(search.toLowerCase()) && !t.category.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [transactions,filterSection,filterStatus,filterDate,search]);

  return (
    <div className="page-wrap">
      <div className="page-heading">
        <h1 className="page-title">Full Transaction History</h1>
        <div style={{display:'flex',gap:8}}>
          <button className="download-btn" onClick={()=>downloadCSV(filtered,`Hashmi_History_${today()}.csv`)}>⬇ Download Excel</button>
          {currentUser?.role==='owner' && <button className="danger-btn" onClick={clearHistory}>🗑 Clear History</button>}
        </div>
      </div>

      <div className="filter-bar">
        <div className="filter-item"><label>Search</label>
          <input type="text" placeholder="Party or category..." value={search} onChange={e=>setSearch(e.target.value)} style={{minWidth:160}}/>
        </div>
        <div className="filter-item"><label>Section</label>
          <select value={filterSection} onChange={e=>setFilterSection(e.target.value)}>
            <option value="">All</option><option value="expense">Expenses</option><option value="customer">Customers</option>
          </select>
        </div>
        <div className="filter-item"><label>Status</label>
          <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}>
            <option value="">All</option><option value="Paid">Paid</option><option value="Unpaid">Unpaid</option>
          </select>
        </div>
        <div className="filter-item"><label>Date</label>
          <input type="date" value={filterDate} onChange={e=>setFilterDate(e.target.value)}/>
        </div>
        <button className="clear-btn" onClick={()=>{setFilterSection('');setFilterStatus('');setFilterDate('');setSearch('');}}>✕ Clear</button>
      </div>

      <div className="result-info">{filtered.length} of {transactions.length} transactions</div>
      <TxTable data={filtered} markPaid={markPaid} onDelete={deleteTransaction} canDelete={currentUser?.role==='owner'} showSection={true}/>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// REPORTS PAGE
// ══════════════════════════════════════════════════════════════════════════
function ReportsPage({ transactions }) {
  const expTx = transactions.filter(t=>t.section==='expense');
  const cusTx = transactions.filter(t=>t.section==='customer');
  const totalExp  = expTx.reduce((s,t)=>s+t.amount,0);
  const totalCus  = cusTx.reduce((s,t)=>s+t.amount,0);
  const totalPaid = transactions.filter(t=>t.status==='Paid').reduce((s,t)=>s+t.amount,0);
  const totalUnpaid = transactions.filter(t=>t.status==='Unpaid').reduce((s,t)=>s+t.amount,0);

  const expCatMap={};
  expTx.forEach(t=>{expCatMap[t.category]=(expCatMap[t.category]||0)+t.amount;});
  const cusCatMap={};
  cusTx.forEach(t=>{cusCatMap[t.category]=(cusCatMap[t.category]||0)+t.amount;});

  const supplierMap={};
  expTx.forEach(t=>{supplierMap[t.party]=(supplierMap[t.party]||0)+t.amount;});

  return (
    <div className="page-wrap">
      <div className="page-heading">
        <h1 className="page-title">Financial Reports</h1>
        <button className="download-btn" onClick={()=>downloadReportCSV(transactions)}>⬇ Download Full Report</button>
      </div>

      <div className="metrics-grid">
        <MetricCard label="Total Expenses"    value={fmt(totalExp)}    sub={`${expTx.length} entries`} accent="red"    icon="↑"/>
        <MetricCard label="Total Revenue"     value={fmt(totalCus)}    sub={`${cusTx.length} entries`} accent="green"  icon="↓"/>
        <MetricCard label="Total Paid"        value={fmt(totalPaid)}   sub="All sections"              accent="green"  icon="✓"/>
        <MetricCard label="Net Profit / Loss" value={fmt(totalCus-totalExp)} sub="Revenue minus Expenses" accent={totalCus-totalExp>=0?'green':'red'} icon="◎"/>
      </div>

      <div className="reports-grid">
        <ReportTable title="Expenses by Category"    rows={Object.entries(expCatMap).sort((a,b)=>b[1]-a[1])}  color="red"    empty="No expenses"/>
        <ReportTable title="Revenue by Customer Type" rows={Object.entries(cusCatMap).sort((a,b)=>b[1]-a[1])} color="green"  empty="No customer data"/>
        <ReportTable title="Top Suppliers"            rows={Object.entries(supplierMap).sort((a,b)=>b[1]-a[1]).slice(0,8)} color="red" empty="No suppliers"/>
        <div className="report-card">
          <div className="report-card-title">Payment Summary</div>
          {[
            {label:'Total Paid Transactions',   val:transactions.filter(t=>t.status==='Paid').length,   color:'green'},
            {label:'Total Unpaid Transactions', val:transactions.filter(t=>t.status==='Unpaid').length, color:'yellow'},
            {label:'Total Amount Paid',         val:fmt(totalPaid),   color:'green'},
            {label:'Total Amount Unpaid',       val:fmt(totalUnpaid), color:'yellow'},
            {label:'Total Transactions',        val:transactions.length, color:''},
          ].map(r=>(
            <div className="rep-row" key={r.label}>
              <span>{r.label}</span><strong className={r.color}>{r.val}</strong>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// SETTINGS PAGE (OWNER ONLY)
// ══════════════════════════════════════════════════════════════════════════
function SettingsPage({ users, loginLogs, addManager, removeManager, currentUser }) {
  const [tab, setTab] = useState('managers');
  const [form, setForm] = useState({name:'',email:'',password:''});
  const [err, setErr]   = useState('');

  const managers = users.filter(u=>u.role==='manager');
  const owners   = users.filter(u=>u.role==='owner');

  function handleAddManager() {
    if (!form.name.trim()||!form.email.trim()||!form.password.trim()) { setErr('All fields required.'); return; }
    if (users.find(u=>u.email.toLowerCase()===form.email.toLowerCase())) { setErr('Email already exists.'); return; }
    addManager(form);
    setForm({name:'',email:'',password:''});
    setErr('');
  }

  return (
    <div className="page-wrap">
      <div className="page-heading">
        <h1 className="page-title">Settings & Security</h1>
        <span className="role-badge owner">OWNER ACCESS</span>
      </div>

      <div className="settings-tabs">
        {['managers','devices'].map(t=>(
          <button key={t} className={`stab ${tab===t?'active':''}`} onClick={()=>setTab(t)}>
            {t==='managers'?'Manage Staff':'Device Login History'}
          </button>
        ))}
      </div>

      {tab==='managers' && (
        <div className="settings-layout">
          <div className="form-card">
            <div className="form-card-title">Add New Manager</div>
            <div className="form-grid" style={{gridTemplateColumns:'1fr'}}>
              <div className="field"><label>Full Name *</label><input type="text" placeholder="Manager name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></div>
              <div className="field"><label>Email *</label><input type="email" placeholder="manager@hashmi.com" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/></div>
              <div className="field"><label>Password *</label><input type="password" placeholder="Set a password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})}/></div>
            </div>
            {err && <div className="err-alert">{err}</div>}
            <button className="primary-btn" onClick={handleAddManager}>+ Add Manager</button>
          </div>

          <div className="section-card" style={{flex:1}}>
            <div className="section-header"><span className="section-title">Current Staff</span></div>
            <div style={{padding:'8px 0'}}>
              <div className="staff-section-label">OWNERS</div>
              {owners.map(u=>(
                <div className="staff-row" key={u.id}>
                  <div className="staff-avatar owner-av">{u.name[0]}</div>
                  <div><div className="staff-name">{u.name}</div><div className="staff-email">{u.email}</div></div>
                  <span className="role-badge owner" style={{marginLeft:'auto'}}>OWNER</span>
                </div>
              ))}
              <div className="staff-section-label" style={{marginTop:16}}>MANAGERS</div>
              {managers.length===0 && <div className="empty-msg">No managers added yet.</div>}
              {managers.map(u=>(
                <div className="staff-row" key={u.id}>
                  <div className="staff-avatar mgr-av">{u.name[0]}</div>
                  <div><div className="staff-name">{u.name}</div><div className="staff-email">{u.email}</div></div>
                  <div style={{marginLeft:'auto',display:'flex',gap:8,alignItems:'center'}}>
                    <span className="role-badge manager">MANAGER</span>
                    {currentUser.role==='owner' && <button className="del-btn" onClick={()=>removeManager(u.id)}>✕</button>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab==='devices' && (
        <div className="section-card">
          <div className="section-header">
            <span className="section-title">Device Login History</span>
            <span className="section-count">{loginLogs.length} logins recorded</span>
          </div>
          {loginLogs.length===0 && <div className="empty-msg" style={{padding:24}}>No login history yet.</div>}
          <div className="device-list">
            {loginLogs.map(log=>(
              <div className="device-row" key={log.id}>
                <div className="device-icon">{log.role==='owner'?'👑':'👤'}</div>
                <div className="device-info">
                  <div className="device-name">{log.userName} <span className={`role-badge ${log.role}`}>{log.role.toUpperCase()}</span></div>
                  <div className="device-meta">📱 {log.device}</div>
                  <div className="device-meta">📍 {log.location}</div>
                </div>
                <div className="device-time">{log.time}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// SHARED COMPONENTS
// ══════════════════════════════════════════════════════════════════════════
function MetricCard({label,value,sub,accent,icon}) {
  return (
    <div className={`metric-card mc-${accent}`}>
      <div className="mc-icon">{icon}</div>
      <div className="mc-label">{label}</div>
      <div className={`mc-value ${accent}`}>{value}</div>
      <div className="mc-sub">{sub}</div>
    </div>
  );
}

function ReportTable({title,rows,color,empty}) {
  return (
    <div className="report-card">
      <div className="report-card-title">{title}</div>
      {rows.length===0 && <div className="empty-msg">{empty}</div>}
      {rows.map(([k,v])=>(
        <div className="rep-row" key={k}><span>{k}</span><strong className={color}>PKR {Number(v).toLocaleString('en-PK')}</strong></div>
      ))}
      {rows.length>0 && (
        <div className="rep-row rep-total"><span>Total</span><strong className={color}>PKR {Number(rows.reduce((s,[,v])=>s+v,0)).toLocaleString('en-PK')}</strong></div>
      )}
    </div>
  );
}

function TxTable({data, markPaid, onDelete, canDelete, showSection}) {
  if (!data.length) return <div className="empty-msg" style={{padding:24}}>No transactions found.</div>;
  return (
    <div className="tx-scroll">
      <table className="tx-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Party</th>
            <th>Category</th>
            {showSection && <th>Section</th>}
            <th>Status</th>
            <th>Amount</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {data.map(t=>(
            <tr key={t.id}>
              <td className="td-date">{t.date}</td>
              <td><div className="td-party">{t.party}</div>{t.notes&&<div className="td-note">{t.notes}</div>}</td>
              <td>{t.category}</td>
              {showSection && <td><span className={`badge b-${t.section}`}>{t.section==='expense'?'Expense':'Customer'}</span></td>}
              <td>
                <span className={`badge b-${t.status.toLowerCase()}`}>{t.status}</span>
                {t.paidAt && <div style={{fontSize:10,color:'var(--text3)',marginTop:2}}>Paid: {t.paidAt}</div>}
              </td>
              <td className={`td-amt ${t.section==='expense'?'red':'green'}`}>{fmt(t.amount)}</td>
              <td>
                <div style={{display:'flex',gap:4}}>
                  {t.status==='Unpaid' && <button className="mark-paid-btn small" onClick={()=>markPaid(t.id)}>✓ Paid</button>}
                  {canDelete && <button className="del-btn" onClick={()=>onDelete(t.id)}>✕</button>}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
