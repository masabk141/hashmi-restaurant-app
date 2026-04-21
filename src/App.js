import React, { useState, useEffect, useMemo, useRef } from 'react';
import './App.css';
import logo from './logo.png';

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
  { id:1, date:'2026-04-10', section:'expense',  party:'Al-Hamza Meats',    category:'Meat / Butcher',      amount:18500, status:'Paid',   notes:'Weekly supply', createdBy:'Owner 1' },
  { id:2, date:'2026-04-11', section:'expense',  party:'Karimi Vegetables', category:'Vegetables',          amount:7200,  status:'Unpaid', notes:'',              createdBy:'Manager' },
  { id:3, date:'2026-04-12', section:'customer', party:'Dine-In Sales',     category:'Dine-In',             amount:45000, status:'Paid',   notes:'Lunch service', createdBy:'Manager' },
  { id:4, date:'2026-04-13', section:'expense',  party:'PESCO',             category:'PESCO (Electricity)', amount:9800,  status:'Paid',   notes:'April bill',    createdBy:'Owner 1' },
  { id:5, date:'2026-04-14', section:'expense',  party:'Rice Bazaar Co.',   category:'Rice / Grain',        amount:12000, status:'Unpaid', notes:'',              createdBy:'Manager' },
  { id:6, date:'2026-04-15', section:'customer', party:'Catering - Malik',  category:'Catering Order',      amount:32000, status:'Unpaid', notes:'Wedding event', createdBy:'Manager' },
  { id:7, date:'2026-04-16', section:'expense',  party:'Staff Wages',       category:'Payroll / Wages',     amount:55000, status:'Paid',   notes:'April payroll', createdBy:'Owner 2' },
  { id:8, date:'2026-04-17', section:'expense',  party:'Cooking Oil Depot', category:'Oil',                 amount:6500,  status:'Paid',   notes:'',              createdBy:'Manager' },
];

const NAV_ITEMS = [
  { id:'dashboard', label:'Dashboard',              icon:'▦' },
  { id:'expenses',  label:'Restaurant Expenses',    icon:'↑' },
  { id:'customers', label:'Customer Transactions',  icon:'↓' },
  { id:'history',   label:'Full History',           icon:'☰' },
  { id:'reports',   label:'Reports',                icon:'◈' },
];

// ── HELPERS ────────────────────────────────────────────────────────────────
const fmt   = n  => 'PKR ' + Number(n).toLocaleString('en-PK');
const today = () => new Date().toISOString().split('T')[0];

function getDeviceInfo() {
  const ua = navigator.userAgent;
  let device = /iPhone/.test(ua)?'iPhone':/iPad/.test(ua)?'iPad':/Android/.test(ua)?'Android':/Windows/.test(ua)?'Windows PC':/Mac/.test(ua)?'Mac':'Unknown';
  let browser = /Chrome/.test(ua)?'Chrome':/Firefox/.test(ua)?'Firefox':/Safari/.test(ua)?'Safari':/Edge/.test(ua)?'Edge':'Browser';
  return `${device} · ${browser}`;
}

function loadLS(key, fallback) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
}
function saveLS(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} }

function downloadCSV(data, filename) {
  const headers = ['Date','Section','Party','Category','Amount (PKR)','Status','Notes','Added By'];
  const rows = data.map(t => [t.date, t.section==='expense'?'Restaurant Expense':'Customer', t.party, t.category, t.amount, t.status, t.notes||'', t.createdBy||'']);
  const csv = [headers,...rows].map(r=>r.map(c=>`"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
  const blob = new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8;'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href=url; a.download=filename; a.click();
  URL.revokeObjectURL(url);
}

function downloadReportCSV(transactions) {
  const expTx = transactions.filter(t=>t.section==='expense');
  const cusTx = transactions.filter(t=>t.section==='customer');
  const catMap={};
  transactions.forEach(t=>{catMap[t.category]=(catMap[t.category]||0)+t.amount;});
  const lines=[
    ['HASHMI PLATTER HOUSE - FINANCIAL REPORT'],
    ['Generated:', new Date().toLocaleDateString('en-PK',{day:'numeric',month:'long',year:'numeric'})],[''],
    ['=== SUMMARY ==='],
    ['Total Restaurant Expenses', expTx.reduce((s,t)=>s+t.amount,0)],
    ['Total Customer Revenue',    cusTx.reduce((s,t)=>s+t.amount,0)],
    ['Net Profit / Loss',         cusTx.reduce((s,t)=>s+t.amount,0)-expTx.reduce((s,t)=>s+t.amount,0)],[''],
    ['=== EXPENSES BY CATEGORY ==='],['Category','Amount (PKR)'],
    ...Object.entries(catMap).filter(([k])=>EXPENSE_CATEGORIES.includes(k)).sort((a,b)=>b[1]-a[1]).map(([k,v])=>[k,v]),[''],
    ['=== CUSTOMER REVENUE ==='],['Category','Amount (PKR)'],
    ...Object.entries(catMap).filter(([k])=>CUSTOMER_CATEGORIES.includes(k)).sort((a,b)=>b[1]-a[1]).map(([k,v])=>[k,v]),
  ];
  const csv = lines.map(r=>r.map(c=>`"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
  const blob = new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8;'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href=url; a.download=`HPH_Report_${today()}.csv`; a.click();
  URL.revokeObjectURL(url);
}

// ══════════════════════════════════════════════════════════════════════════
// ROOT APP
// ══════════════════════════════════════════════════════════════════════════
export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [transactions, setTransactions] = useState(()=>loadLS('hm_txns_v3', SEED_TRANSACTIONS));
  const [users,        setUsers]        = useState(()=>loadLS('hm_users_v3', DEFAULT_OWNERS));
  const [loginLogs,    setLoginLogs]    = useState(()=>loadLS('hm_logs_v3',  []));
  const [page,         setPage]         = useState('dashboard');
  const [toast,        setToast]        = useState({msg:'',ok:true,show:false});

  useEffect(()=>{ saveLS('hm_txns_v3',  transactions); },[transactions]);
  useEffect(()=>{ saveLS('hm_users_v3', users);        },[users]);
  useEffect(()=>{ saveLS('hm_logs_v3',  loginLogs);    },[loginLogs]);

  function showToast(msg, ok=true) {
    setToast({msg,ok,show:true});
    setTimeout(()=>setToast(t=>({...t,show:false})),2800);
  }

  function handleLogin(email, password) {
    const user = users.find(u=>u.email.toLowerCase()===email.toLowerCase() && u.password===password);
    if (!user) { showToast('Invalid email or password.', false); return; }
    const log = { id:Date.now(), userId:user.id, userName:user.name, role:user.role,
      time:new Date().toLocaleString('en-PK'), device:getDeviceInfo(), location:'Pakistan' };
    setLoginLogs(prev=>[log,...prev].slice(0,100));
    setCurrentUser(user); setPage('dashboard');
    showToast(`Welcome, ${user.name}!`);
  }

  function handleLogout() { setCurrentUser(null); setPage('dashboard'); }

  function markPaid(id) {
    setTransactions(prev=>prev.map(t=>t.id===id?{...t,status:'Paid',paidAt:new Date().toLocaleString('en-PK')}:t));
    showToast('Marked as Paid!');
  }

  function deleteTransaction(id) {
    if (currentUser?.role!=='owner') { showToast('Only owners can delete.', false); return; }
    if (!window.confirm('Delete this transaction permanently?')) return;
    setTransactions(prev=>prev.filter(t=>t.id!==id));
    showToast('Deleted.');
  }

  function addTransaction(tx) {
    setTransactions(prev=>[{...tx, id:Date.now(), createdBy:currentUser?.name||'Unknown'},...prev]);
    showToast('Transaction recorded!');
  }

  function clearHistory() {
    if (currentUser?.role!=='owner') { showToast('Only owners can clear history.', false); return; }
    if (!window.confirm('Clear ALL transaction history? Cannot be undone.')) return;
    setTransactions([]); showToast('History cleared.');
  }

  function addManager(mgr) {
    setUsers(prev=>[...prev,{...mgr,id:'mgr_'+Date.now(),role:'manager'}]);
    showToast('Manager added!');
  }
  function removeManager(id) {
    if (!window.confirm('Remove this manager?')) return;
    setUsers(prev=>prev.filter(u=>u.id!==id)); showToast('Removed.');
  }

  if (!currentUser) return <LoginPage onLogin={handleLogin} toast={toast}/>;

  const isOwner = currentUser.role==='owner';
  const allNavItems = [...NAV_ITEMS, ...(isOwner?[{id:'settings',label:'Settings',icon:'⚙'}]:[] )];

  return (
    <div className="shell">
      {/* ── SIDEBAR ── */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <img src={logo} alt="Hashmi Platter House" className="sidebar-logo-img"/>
          <div className="sidebar-logo-text">
            <span className="slt-name">Hashmi</span>
            <span className="slt-sub">Platter House</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="snav-label">MAIN MENU</div>
          {allNavItems.slice(0,3).map(n=>(
            <button key={n.id} className={`snav-item ${page===n.id?'active':''}`} onClick={()=>setPage(n.id)}>
              <span className="snav-icon">{n.icon}</span>
              <span className="snav-label-text">{n.label}</span>
              {page===n.id && <span className="snav-active-bar"/>}
            </button>
          ))}
          <div className="snav-label" style={{marginTop:20}}>RECORDS</div>
          {allNavItems.slice(3,5).map(n=>(
            <button key={n.id} className={`snav-item ${page===n.id?'active':''}`} onClick={()=>setPage(n.id)}>
              <span className="snav-icon">{n.icon}</span>
              <span className="snav-label-text">{n.label}</span>
              {page===n.id && <span className="snav-active-bar"/>}
            </button>
          ))}
          {isOwner && <>
            <div className="snav-label" style={{marginTop:20}}>ADMIN</div>
            <button className={`snav-item ${page==='settings'?'active':''}`} onClick={()=>setPage('settings')}>
              <span className="snav-icon">⚙</span>
              <span className="snav-label-text">Settings</span>
              {page==='settings' && <span className="snav-active-bar"/>}
            </button>
          </>}
        </nav>

        <div className="sidebar-footer">
          <span className={`sf-role ${currentUser.role}`}>{currentUser.role.toUpperCase()}</span>
          <span className="sf-version">v2.0</span>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <div className="main-area">
        {/* TOPBAR */}
        <header className="topbar">
          <div className="topbar-left">
            <div className="topbar-page">{allNavItems.find(n=>n.id===page)?.label || 'Dashboard'}</div>
            <div className="topbar-date">{new Date().toLocaleDateString('en-PK',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}</div>
          </div>
          <div className="topbar-right">
            <AvatarMenu currentUser={currentUser} onLogout={handleLogout}/>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main className="page-content">
          {page==='dashboard' && <DashboardPage transactions={transactions} currentUser={currentUser} setPage={setPage} markPaid={markPaid}/>}
          {page==='expenses'  && <ExpensesPage  transactions={transactions} addTransaction={addTransaction} markPaid={markPaid} deleteTransaction={deleteTransaction} currentUser={currentUser}/>}
          {page==='customers' && <CustomersPage transactions={transactions} addTransaction={addTransaction} markPaid={markPaid} deleteTransaction={deleteTransaction} currentUser={currentUser}/>}
          {page==='history'   && <HistoryPage   transactions={transactions} markPaid={markPaid} deleteTransaction={deleteTransaction} clearHistory={clearHistory} currentUser={currentUser}/>}
          {page==='reports'   && <ReportsPage   transactions={transactions}/>}
          {page==='settings'  && isOwner && <SettingsPage users={users} loginLogs={loginLogs} addManager={addManager} removeManager={removeManager} currentUser={currentUser}/>}
        </main>
      </div>

      {toast.show && <div className={`toast ${toast.ok?'tok':'terr'}`}>{toast.msg}</div>}
    </div>
  );
}

// ── AVATAR DROPDOWN ────────────────────────────────────────────────────────
function AvatarMenu({ currentUser, onLogout }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(()=>{
    function handleClick(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener('mousedown', handleClick);
    return ()=>document.removeEventListener('mousedown', handleClick);
  },[]);

  const initials = currentUser.name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();

  return (
    <div className="avatar-wrap" ref={ref}>
      <button className="avatar-btn" onClick={()=>setOpen(o=>!o)}>
        <div className={`avatar-circle ${currentUser.role}`}>{initials}</div>
        <div className="avatar-info">
          <span className="avatar-name">{currentUser.name}</span>
          <span className={`avatar-role ${currentUser.role}`}>{currentUser.role.toUpperCase()}</span>
        </div>
        <span className="avatar-caret">{open?'▴':'▾'}</span>
      </button>

      {open && (
        <div className="avatar-dropdown">
          <div className="adrop-header">
            <div className={`avatar-circle lg ${currentUser.role}`}>{initials}</div>
            <div>
              <div className="adrop-name">{currentUser.name}</div>
              <div className="adrop-email">{currentUser.email}</div>
              <span className={`role-pill ${currentUser.role}`}>{currentUser.role.toUpperCase()}</span>
            </div>
          </div>
          <div className="adrop-divider"/>
          <div className="adrop-item disabled">
            <span>🔒</span> Account Settings
          </div>
          <div className="adrop-divider"/>
          <button className="adrop-signout" onClick={()=>{setOpen(false); onLogout();}}>
            <span>→</span> Sign Out
          </button>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// LOGIN
// ══════════════════════════════════════════════════════════════════════════
function LoginPage({ onLogin, toast }) {
  const [email, setEmail]     = useState('');
  const [pass,  setPass]      = useState('');
  const [show,  setShow]      = useState(false);

  return (
    <div className="login-page">
      <div className="login-left">
        <img src={logo} alt="Hashmi Platter House" className="login-logo-img"/>
        <div className="login-tagline">Restaurant Management System</div>
        <div className="login-tagline-sub">Manage your finances, track expenses,<br/>and grow your business.</div>
      </div>
      <div className="login-right">
        <div className="login-card">
          <div className="lc-title">Sign In</div>
          <div className="lc-sub">Enter your credentials to continue</div>
          <div className="field" style={{marginBottom:14}}>
            <label>Email Address</label>
            <input type="email" placeholder="your@email.com" value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==='Enter'&&onLogin(email,pass)}/>
          </div>
          <div className="field" style={{marginBottom:20}}>
            <label>Password</label>
            <div className="pass-wrap">
              <input type={show?'text':'password'} placeholder="••••••••" value={pass} onChange={e=>setPass(e.target.value)} onKeyDown={e=>e.key==='Enter'&&onLogin(email,pass)}/>
              <button className="show-btn" onClick={()=>setShow(s=>!s)} type="button">{show?'Hide':'Show'}</button>
            </div>
          </div>
          <button className="login-btn" onClick={()=>onLogin(email,pass)}>Sign In →</button>
          <div className="login-hint">
            <strong>Default logins:</strong><br/>
            owner1@hashmi.com · hashmi123<br/>
            owner2@hashmi.com · hashmi123<br/>
            owner3@hashmi.com · hashmi123
          </div>
        </div>
      </div>
      {toast.show && <div className={`toast ${toast.ok?'tok':'terr'}`}>{toast.msg}</div>}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// DASHBOARD
// ══════════════════════════════════════════════════════════════════════════
function DashboardPage({ transactions, currentUser, setPage, markPaid }) {
  const expTx      = transactions.filter(t=>t.section==='expense');
  const cusTx      = transactions.filter(t=>t.section==='customer');
  const totalExp   = expTx.reduce((s,t)=>s+t.amount,0);
  const totalCus   = cusTx.reduce((s,t)=>s+t.amount,0);
  const totalUnpaid= transactions.filter(t=>t.status==='Unpaid').reduce((s,t)=>s+t.amount,0);
  const unpaidCount= transactions.filter(t=>t.status==='Unpaid').length;
  const net        = totalCus - totalExp;
  const paidCount  = transactions.filter(t=>t.status==='Paid').length;
  const totalCount = transactions.length;

  const catMap={};
  expTx.forEach(t=>{catMap[t.category]=(catMap[t.category]||0)+t.amount;});
  const topCats = Object.entries(catMap).sort((a,b)=>b[1]-a[1]).slice(0,5);
  const recentUnpaid = transactions.filter(t=>t.status==='Unpaid').slice(0,4);

  return (
    <div className="page-wrap">
      {/* Greeting */}
      <div className="dash-greeting">
        <div>
          <h1 className="dash-hello">Good {getTimeOfDay()}, {currentUser.name.split(' ')[0]} 👋</h1>
          <p className="dash-sub">Here's what's happening with Hashmi Platter House today.</p>
        </div>
      </div>

      {/* KPI Row */}
      <div className="kpi-row">
        <KpiCard label="Total Revenue" value={fmt(totalCus)}    delta={`${cusTx.length} entries`}   color="green"  icon={<IconRevenue/>}/>
        <KpiCard label="Total Expenses" value={fmt(totalExp)}   delta={`${expTx.length} entries`}   color="red"    icon={<IconExpense/>}/>
        <KpiCard label="Unpaid Balance" value={fmt(totalUnpaid)} delta={`${unpaidCount} pending`}   color="yellow" icon={<IconPending/>}/>
        <KpiCard label="Net Profit" value={fmt(net)}             delta={net>=0?'Profit':'Loss'}      color={net>=0?'green':'red'} icon={<IconNet/>}/>
      </div>

      {/* Middle Row */}
      <div className="dash-mid">
        {/* Unpaid Items */}
        <div className="dash-card" style={{flex:1.2}}>
          <div className="dc-header">
            <span className="dc-title">Pending Payments</span>
            {unpaidCount>0 && <span className="dc-badge red">{unpaidCount} unpaid</span>}
          </div>
          {recentUnpaid.length===0
            ? <div className="empty-state"><span>✓</span><p>All caught up! No pending payments.</p></div>
            : recentUnpaid.map(t=>(
              <div className="pending-row" key={t.id}>
                <div className="pr-left">
                  <div className="pr-dot" style={{background: t.section==='expense'?'var(--red)':'var(--green)'}}/>
                  <div>
                    <div className="pr-party">{t.party}</div>
                    <div className="pr-meta">{t.category} · {t.date}</div>
                  </div>
                </div>
                <div className="pr-right">
                  <span className="pr-amt">{fmt(t.amount)}</span>
                  <button className="mark-paid-btn" onClick={()=>markPaid(t.id)}>✓ Paid</button>
                </div>
              </div>
            ))
          }
        </div>

        {/* Top Categories */}
        <div className="dash-card" style={{flex:1}}>
          <div className="dc-header"><span className="dc-title">Top Expense Categories</span></div>
          {topCats.length===0
            ? <div className="empty-state"><p>No expense data yet</p></div>
            : topCats.map(([cat,amt],i)=>(
              <div className="cat-bar-row" key={cat}>
                <div className="cbr-top">
                  <span className="cbr-rank">#{i+1}</span>
                  <span className="cbr-name">{cat}</span>
                  <span className="cbr-amt">{fmt(amt)}</span>
                </div>
                <div className="cbr-track">
                  <div className="cbr-fill" style={{width:`${(amt/(topCats[0][1]||1))*100}%`, opacity: 1-(i*0.15)}}/>
                </div>
              </div>
            ))
          }
        </div>
      </div>

      {/* Stats Row */}
      <div className="dash-stats-row">
        <div className="dash-stat-card">
          <div className="dsc-val">{totalCount}</div>
          <div className="dsc-label">Total Transactions</div>
        </div>
        <div className="dash-stat-card">
          <div className="dsc-val green">{paidCount}</div>
          <div className="dsc-label">Paid Transactions</div>
        </div>
        <div className="dash-stat-card">
          <div className="dsc-val yellow">{unpaidCount}</div>
          <div className="dsc-label">Unpaid Transactions</div>
        </div>
        <div className="dash-stat-card">
          <div className="dsc-val">{expTx.length}</div>
          <div className="dsc-label">Expense Entries</div>
        </div>
        <div className="dash-stat-card">
          <div className="dsc-val green">{cusTx.length}</div>
          <div className="dsc-label">Customer Entries</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="dash-card">
        <div className="dc-header"><span className="dc-title">Quick Actions</span></div>
        <div className="qa-grid">
          <button className="qa-btn red"    onClick={()=>setPage('expenses')}>+ Add Expense</button>
          <button className="qa-btn green"  onClick={()=>setPage('customers')}>+ Add Customer</button>
          <button className="qa-btn neutral" onClick={()=>setPage('history')}>View Full History</button>
          <button className="qa-btn yellow" onClick={()=>setPage('reports')}>Download Reports</button>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="dash-card" style={{marginTop:16}}>
        <div className="dc-header">
          <span className="dc-title">Recent Transactions</span>
          <button className="link-btn" onClick={()=>setPage('history')}>View All →</button>
        </div>
        <TxTable data={transactions.slice(0,6)} markPaid={markPaid} onDelete={()=>{}} canDelete={false} showSection={true}/>
      </div>
    </div>
  );
}

function getTimeOfDay() {
  const h = new Date().getHours();
  return h<12?'Morning':h<17?'Afternoon':'Evening';
}

// ── KPI CARD ──
function KpiCard({ label, value, delta, color, icon }) {
  return (
    <div className={`kpi-card kpi-${color}`}>
      <div className="kpi-top">
        <div className="kpi-label">{label}</div>
        <div className="kpi-icon">{icon}</div>
      </div>
      <div className={`kpi-value ${color}`}>{value}</div>
      <div className="kpi-delta">{delta}</div>
    </div>
  );
}

// ── ICONS ──
const IconRevenue = ()=><svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 2v16M6 6l4-4 4 4M6 14l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const IconExpense = ()=><svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M3 10h14M10 3v14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>;
const IconPending = ()=><svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.5"/><path d="M10 6v4l2.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>;
const IconNet     = ()=><svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M3 14l4-4 3 3 7-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>;

// ══════════════════════════════════════════════════════════════════════════
// EXPENSES PAGE
// ══════════════════════════════════════════════════════════════════════════
function ExpensesPage({ transactions, addTransaction, markPaid, deleteTransaction, currentUser }) {
  const expTx = transactions.filter(t=>t.section==='expense');
  const [form, setForm] = useState({date:today(),party:'',category:'Meat / Butcher',amount:'',status:'Paid',notes:''});
  const [err,  setErr]  = useState(false);

  function handleAdd() {
    if (!form.party.trim()||!form.amount||parseFloat(form.amount)<=0) { setErr(true); return; }
    addTransaction({...form,section:'expense',amount:parseFloat(form.amount)});
    setForm({date:today(),party:'',category:'Meat / Butcher',amount:'',status:'Paid',notes:''});
    setErr(false);
  }

  const total  = expTx.reduce((s,t)=>s+t.amount,0);
  const paid   = expTx.filter(t=>t.status==='Paid').reduce((s,t)=>s+t.amount,0);
  const unpaid = expTx.filter(t=>t.status==='Unpaid').reduce((s,t)=>s+t.amount,0);

  return (
    <div className="page-wrap">
      <PageHeader title="Restaurant Expenses" action={<button className="dl-btn" onClick={()=>downloadCSV(expTx,`HPH_Expenses_${today()}.csv`)}>⬇ Export Excel</button>}/>
      <div className="stat-row">
        <StatPill label="Total Expenses" val={fmt(total)}  color="red"/>
        <StatPill label="Paid"           val={fmt(paid)}   color="green"/>
        <StatPill label="Unpaid"         val={fmt(unpaid)} color="yellow"/>
      </div>
      <div className="split-layout">
        <FormCard title="Add Expense Entry" onSubmit={handleAdd} submitLabel="+ Record Expense" submitColor="red">
          <TwoCol>
            <Field label="Date *"><input type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})}/></Field>
            <Field label="Category *">
              <select value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>
                {EXPENSE_CATEGORIES.map(c=><option key={c}>{c}</option>)}
              </select>
            </Field>
          </TwoCol>
          <Field label="Supplier / Party Name *" error={err&&!form.party.trim()}>
            <input type="text" placeholder="e.g. Al-Hamza Meats" value={form.party} onChange={e=>setForm({...form,party:e.target.value})}/>
          </Field>
          <TwoCol>
            <Field label="Amount (PKR) *" error={err&&(!form.amount||parseFloat(form.amount)<=0)}>
              <input type="number" placeholder="0" min="0" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})}/>
            </Field>
            <Field label="Status *">
              <select value={form.status} onChange={e=>setForm({...form,status:e.target.value})}>
                <option value="Paid">Paid</option>
                <option value="Unpaid">Unpaid / Pending</option>
              </select>
            </Field>
          </TwoCol>
          <Field label="Notes (optional)">
            <input type="text" placeholder="Invoice no., remarks..." value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})}/>
          </Field>
        </FormCard>
        <div className="list-card">
          <div className="lc-hdr"><span>Expense History</span><span className="lc-count">{expTx.length} entries</span></div>
          <TxTable data={expTx.slice(0,30)} markPaid={markPaid} onDelete={deleteTransaction} canDelete={currentUser?.role==='owner'} showSection={false}/>
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
  const [err,  setErr]  = useState(false);

  function handleAdd() {
    if (!form.party.trim()||!form.amount||parseFloat(form.amount)<=0) { setErr(true); return; }
    addTransaction({...form,section:'customer',amount:parseFloat(form.amount)});
    setForm({date:today(),party:'',category:'Dine-In',amount:'',status:'Paid',notes:''});
    setErr(false);
  }

  const total  = cusTx.reduce((s,t)=>s+t.amount,0);
  const paid   = cusTx.filter(t=>t.status==='Paid').reduce((s,t)=>s+t.amount,0);
  const unpaid = cusTx.filter(t=>t.status==='Unpaid').reduce((s,t)=>s+t.amount,0);

  return (
    <div className="page-wrap">
      <PageHeader title="Customer Transactions" action={<button className="dl-btn" onClick={()=>downloadCSV(cusTx,`HPH_Customers_${today()}.csv`)}>⬇ Export Excel</button>}/>
      <div className="stat-row">
        <StatPill label="Total Revenue" val={fmt(total)}  color="green"/>
        <StatPill label="Received"      val={fmt(paid)}   color="green"/>
        <StatPill label="Pending / Owed" val={fmt(unpaid)} color="yellow"/>
      </div>
      <div className="split-layout">
        <FormCard title="Add Customer Transaction" onSubmit={handleAdd} submitLabel="+ Record Transaction" submitColor="green">
          <TwoCol>
            <Field label="Date *"><input type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})}/></Field>
            <Field label="Category *">
              <select value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>
                {CUSTOMER_CATEGORIES.map(c=><option key={c}>{c}</option>)}
              </select>
            </Field>
          </TwoCol>
          <Field label="Customer / Party Name *" error={err&&!form.party.trim()}>
            <input type="text" placeholder="e.g. Walk-in Customer or Malik Family" value={form.party} onChange={e=>setForm({...form,party:e.target.value})}/>
          </Field>
          <TwoCol>
            <Field label="Amount (PKR) *" error={err&&(!form.amount||parseFloat(form.amount)<=0)}>
              <input type="number" placeholder="0" min="0" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})}/>
            </Field>
            <Field label="Status *">
              <select value={form.status} onChange={e=>setForm({...form,status:e.target.value})}>
                <option value="Paid">Paid / Received</option>
                <option value="Unpaid">Unpaid / Pending</option>
              </select>
            </Field>
          </TwoCol>
          <Field label="Notes (optional)">
            <input type="text" placeholder="Order details, event info..." value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})}/>
          </Field>
        </FormCard>
        <div className="list-card">
          <div className="lc-hdr"><span>Customer History</span><span className="lc-count">{cusTx.length} entries</span></div>
          <TxTable data={cusTx.slice(0,30)} markPaid={markPaid} onDelete={deleteTransaction} canDelete={currentUser?.role==='owner'} showSection={false}/>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// HISTORY PAGE
// ══════════════════════════════════════════════════════════════════════════
function HistoryPage({ transactions, markPaid, deleteTransaction, clearHistory, currentUser }) {
  const [fSec,    setFSec]    = useState('');
  const [fStatus, setFStatus] = useState('');
  const [fDate,   setFDate]   = useState('');
  const [search,  setSearch]  = useState('');

  const filtered = useMemo(()=>transactions.filter(t=>{
    if (fSec    && t.section!==fSec)        return false;
    if (fStatus && t.status!==fStatus)      return false;
    if (fDate   && t.date!==fDate)          return false;
    if (search  && !t.party.toLowerCase().includes(search.toLowerCase()) && !t.category.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }),[transactions,fSec,fStatus,fDate,search]);

  return (
    <div className="page-wrap">
      <PageHeader title="Full Transaction History" action={
        <div style={{display:'flex',gap:8}}>
          <button className="dl-btn" onClick={()=>downloadCSV(filtered,`HPH_History_${today()}.csv`)}>⬇ Export Excel</button>
          {currentUser?.role==='owner' && <button className="danger-btn" onClick={clearHistory}>🗑 Clear All</button>}
        </div>
      }/>
      <div className="filter-bar">
        <FilterItem label="Search"><input type="text" placeholder="Party or category..." value={search} onChange={e=>setSearch(e.target.value)} style={{minWidth:160}}/></FilterItem>
        <FilterItem label="Section">
          <select value={fSec} onChange={e=>setFSec(e.target.value)}>
            <option value="">All</option><option value="expense">Expenses</option><option value="customer">Customers</option>
          </select>
        </FilterItem>
        <FilterItem label="Status">
          <select value={fStatus} onChange={e=>setFStatus(e.target.value)}>
            <option value="">All</option><option value="Paid">Paid</option><option value="Unpaid">Unpaid</option>
          </select>
        </FilterItem>
        <FilterItem label="Date"><input type="date" value={fDate} onChange={e=>setFDate(e.target.value)}/></FilterItem>
        <button className="clear-btn" onClick={()=>{setFSec('');setFStatus('');setFDate('');setSearch('');}}>✕ Clear</button>
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
  const expTx   = transactions.filter(t=>t.section==='expense');
  const cusTx   = transactions.filter(t=>t.section==='customer');
  const totalExp= expTx.reduce((s,t)=>s+t.amount,0);
  const totalCus= cusTx.reduce((s,t)=>s+t.amount,0);
  const paid    = transactions.filter(t=>t.status==='Paid').reduce((s,t)=>s+t.amount,0);
  const unpaid  = transactions.filter(t=>t.status==='Unpaid').reduce((s,t)=>s+t.amount,0);

  const expCatMap={},cusCatMap={},supMap={};
  expTx.forEach(t=>{expCatMap[t.category]=(expCatMap[t.category]||0)+t.amount; supMap[t.party]=(supMap[t.party]||0)+t.amount;});
  cusTx.forEach(t=>{cusCatMap[t.category]=(cusCatMap[t.category]||0)+t.amount;});

  return (
    <div className="page-wrap">
      <PageHeader title="Financial Reports" action={<button className="dl-btn" onClick={()=>downloadReportCSV(transactions)}>⬇ Download Full Report</button>}/>
      <div className="kpi-row">
        <KpiCard label="Total Expenses"  value={fmt(totalExp)}            delta={`${expTx.length} entries`} color="red"   icon={<IconExpense/>}/>
        <KpiCard label="Total Revenue"   value={fmt(totalCus)}            delta={`${cusTx.length} entries`} color="green" icon={<IconRevenue/>}/>
        <KpiCard label="Total Paid"      value={fmt(paid)}                delta="All sections"              color="green" icon={<IconNet/>}/>
        <KpiCard label="Net Profit/Loss" value={fmt(totalCus-totalExp)}   delta={totalCus-totalExp>=0?'Profit':'Loss'} color={totalCus-totalExp>=0?'green':'red'} icon={<IconNet/>}/>
      </div>
      <div className="reports-grid">
        <ReportTable title="Expenses by Category"     rows={Object.entries(expCatMap).sort((a,b)=>b[1]-a[1])} color="red"   empty="No expenses"/>
        <ReportTable title="Revenue by Customer Type" rows={Object.entries(cusCatMap).sort((a,b)=>b[1]-a[1])} color="green" empty="No customer data"/>
        <ReportTable title="Top Suppliers"            rows={Object.entries(supMap).sort((a,b)=>b[1]-a[1]).slice(0,8)} color="red" empty="No suppliers"/>
        <div className="report-card">
          <div className="rc-title">Payment Summary</div>
          {[
            {l:'Paid Transactions',   v:transactions.filter(t=>t.status==='Paid').length,   c:'green'},
            {l:'Unpaid Transactions', v:transactions.filter(t=>t.status==='Unpaid').length, c:'yellow'},
            {l:'Amount Received',     v:fmt(paid),   c:'green'},
            {l:'Amount Outstanding',  v:fmt(unpaid), c:'yellow'},
            {l:'Total Transactions',  v:transactions.length, c:''},
          ].map(r=>(
            <div className="rep-row" key={r.l}><span>{r.l}</span><strong className={r.c}>{r.v}</strong></div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// SETTINGS (OWNER ONLY)
// ══════════════════════════════════════════════════════════════════════════
function SettingsPage({ users, loginLogs, addManager, removeManager, currentUser }) {
  const [tab,  setTab]  = useState('managers');
  const [form, setForm] = useState({name:'',email:'',password:''});
  const [err,  setErr]  = useState('');

  const managers = users.filter(u=>u.role==='manager');
  const owners   = users.filter(u=>u.role==='owner');

  function handleAdd() {
    if (!form.name.trim()||!form.email.trim()||!form.password.trim()) { setErr('All fields required.'); return; }
    if (users.find(u=>u.email.toLowerCase()===form.email.toLowerCase())) { setErr('Email already exists.'); return; }
    addManager(form); setForm({name:'',email:'',password:''}); setErr('');
  }

  return (
    <div className="page-wrap">
      <PageHeader title="Settings & Security" action={<span className={`role-pill owner`}>OWNER ACCESS</span>}/>
      <div className="settings-tabs">
        {[{id:'managers',label:'Manage Staff'},{id:'devices',label:'Device Login History'}].map(t=>(
          <button key={t.id} className={`stab ${tab===t.id?'active':''}`} onClick={()=>setTab(t.id)}>{t.label}</button>
        ))}
      </div>

      {tab==='managers' && (
        <div className="split-layout" style={{alignItems:'start'}}>
          <FormCard title="Add New Manager" onSubmit={handleAdd} submitLabel="+ Add Manager" submitColor="red">
            <Field label="Full Name *"><input type="text" placeholder="Manager name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></Field>
            <Field label="Email *"><input type="email" placeholder="manager@hashmi.com" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/></Field>
            <Field label="Password *"><input type="password" placeholder="Set a password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})}/></Field>
            {err && <div className="err-alert">{err}</div>}
          </FormCard>
          <div className="list-card">
            <div className="lc-hdr"><span>Current Staff</span></div>
            <div className="staff-section-lbl">OWNERS</div>
            {owners.map(u=>(
              <div className="staff-row" key={u.id}>
                <div className={`staff-av owner`}>{u.name[0]}</div>
                <div><div className="staff-name">{u.name}</div><div className="staff-email">{u.email}</div></div>
                <span className="role-pill owner" style={{marginLeft:'auto'}}>OWNER</span>
              </div>
            ))}
            <div className="staff-section-lbl" style={{marginTop:12}}>MANAGERS</div>
            {managers.length===0 && <div className="empty-state" style={{padding:'16px 18px'}}><p>No managers added yet.</p></div>}
            {managers.map(u=>(
              <div className="staff-row" key={u.id}>
                <div className="staff-av mgr">{u.name[0]}</div>
                <div><div className="staff-name">{u.name}</div><div className="staff-email">{u.email}</div></div>
                <div style={{marginLeft:'auto',display:'flex',gap:8,alignItems:'center'}}>
                  <span className="role-pill manager">MANAGER</span>
                  <button className="del-btn" onClick={()=>removeManager(u.id)}>✕</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab==='devices' && (
        <div className="list-card">
          <div className="lc-hdr"><span>Device Login History</span><span className="lc-count">{loginLogs.length} logins</span></div>
          {loginLogs.length===0 && <div className="empty-state" style={{padding:32}}><p>No login history yet.</p></div>}
          {loginLogs.map(log=>(
            <div className="device-row" key={log.id}>
              <div className="device-icon">{log.role==='owner'?'👑':'👤'}</div>
              <div className="device-info">
                <div className="device-name">{log.userName} <span className={`role-pill ${log.role}`}>{log.role.toUpperCase()}</span></div>
                <div className="device-meta">📱 {log.device}</div>
                <div className="device-meta">📍 {log.location}</div>
              </div>
              <div className="device-time">{log.time}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// SHARED COMPONENTS
// ══════════════════════════════════════════════════════════════════════════
function PageHeader({ title, action }) {
  return (
    <div className="page-header">
      <h1 className="page-title">{title}</h1>
      {action && <div>{action}</div>}
    </div>
  );
}

function StatPill({ label, val, color }) {
  return (
    <div className={`stat-pill sp-${color}`}>
      <div className="sp-label">{label}</div>
      <div className={`sp-val ${color}`}>{val}</div>
    </div>
  );
}

function FormCard({ title, onSubmit, submitLabel, submitColor, children }) {
  return (
    <div className="form-card">
      <div className="fc-title">{title}</div>
      <div className="fc-body">{children}</div>
      <button className={`submit-btn sb-${submitColor}`} onClick={onSubmit}>{submitLabel}</button>
    </div>
  );
}

function TwoCol({ children }) { return <div className="two-col">{children}</div>; }

function Field({ label, error, children }) {
  return (
    <div className={`field ${error?'field-err':''}`}>
      <label>{label}</label>
      {children}
      {error && <span className="field-err-msg">This field is required</span>}
    </div>
  );
}

function FilterItem({ label, children }) {
  return (
    <div className="fi">
      <label>{label}</label>
      {children}
    </div>
  );
}

function ReportTable({ title, rows, color, empty }) {
  return (
    <div className="report-card">
      <div className="rc-title">{title}</div>
      {rows.length===0 && <div className="empty-state"><p>{empty}</p></div>}
      {rows.map(([k,v])=>(
        <div className="rep-row" key={k}><span>{k}</span><strong className={color}>PKR {Number(v).toLocaleString('en-PK')}</strong></div>
      ))}
      {rows.length>0 && (
        <div className="rep-row rep-total"><span>Total</span><strong className={color}>PKR {Number(rows.reduce((s,[,v])=>s+v,0)).toLocaleString('en-PK')}</strong></div>
      )}
    </div>
  );
}

function TxTable({ data, markPaid, onDelete, canDelete, showSection }) {
  if (!data.length) return <div className="empty-state" style={{padding:24}}><p>No transactions found.</p></div>;
  return (
    <div className="tx-scroll">
      <table className="tx-table">
        <thead>
          <tr>
            <th>Date</th><th>Party</th><th>Category</th>
            {showSection && <th>Section</th>}
            <th>Status</th><th>Amount</th><th>Action</th>
          </tr>
        </thead>
        <tbody>
          {data.map(t=>(
            <tr key={t.id}>
              <td className="td-date">{t.date}</td>
              <td><div className="td-party">{t.party}</div>{t.notes&&<div className="td-note">{t.notes}</div>}</td>
              <td className="td-cat">{t.category}</td>
              {showSection && <td><span className={`pill pill-${t.section}`}>{t.section==='expense'?'Expense':'Customer'}</span></td>}
              <td>
                <span className={`pill pill-${t.status.toLowerCase()}`}>{t.status}</span>
                {t.paidAt&&<div style={{fontSize:10,color:'var(--text3)',marginTop:2}}>at {t.paidAt}</div>}
              </td>
              <td className={`td-amt ${t.section==='expense'?'red':'green'}`}>{fmt(t.amount)}</td>
              <td>
                <div style={{display:'flex',gap:4,alignItems:'center'}}>
                  {t.status==='Unpaid'&&<button className="mpb" onClick={()=>markPaid(t.id)}>✓ Paid</button>}
                  {canDelete&&<button className="del-btn" onClick={()=>onDelete(t.id)}>✕</button>}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
