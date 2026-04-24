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

// Chart of Accounts (Double-Entry Bookkeeping System)
const CHART_OF_ACCOUNTS = {
  // ASSETS
  '1010': { code:'1010', name:'Cash in Hand', type:'Asset', category:'Current Asset', active:true },
  '1020': { code:'1020', name:'Bank Account', type:'Asset', category:'Current Asset', active:true },
  '1030': { code:'1030', name:'Inventory - Meat', type:'Asset', category:'Current Asset', active:true },
  '1031': { code:'1031', name:'Inventory - Vegetables', type:'Asset', category:'Current Asset', active:true },
  '1032': { code:'1032', name:'Inventory - Beverages', type:'Asset', category:'Current Asset', active:true },
  '1033': { code:'1033', name:'Inventory - Other', type:'Asset', category:'Current Asset', active:true },
  '1040': { code:'1040', name:'Equipment', type:'Asset', category:'Fixed Asset', active:true },
  
  // LIABILITIES
  '2010': { code:'2010', name:'Accounts Payable', type:'Liability', category:'Current Liability', active:true },
  '2020': { code:'2020', name:'Short Term Loan', type:'Liability', category:'Current Liability', active:true },
  '2030': { code:'2030', name:'Long Term Loan', type:'Liability', category:'Long Term Liability', active:true },
  
  // EQUITY
  '3010': { code:'3010', name:'Capital Account', type:'Equity', category:'Owner Equity', active:true },
  '3020': { code:'3020', name:'Retained Earnings', type:'Equity', category:'Owner Equity', active:true },
  
  // REVENUE
  '4010': { code:'4010', name:'Dine-In Revenue', type:'Revenue', category:'Food & Beverage', active:true },
  '4020': { code:'4020', name:'Takeaway Revenue', type:'Revenue', category:'Food & Beverage', active:true },
  '4030': { code:'4030', name:'Catering Revenue', type:'Revenue', category:'Food & Beverage', active:true },
  '4040': { code:'4040', name:'Beverage Sales', type:'Revenue', category:'Food & Beverage', active:true },
  '4050': { code:'4050', name:'Delivery Revenue', type:'Revenue', category:'Food & Beverage', active:true },
  
  // EXPENSES
  '5010': { code:'5010', name:'Cost of Meat', type:'Expense', category:'COGS', active:true },
  '5020': { code:'5020', name:'Cost of Vegetables', type:'Expense', category:'COGS', active:true },
  '5030': { code:'5030', name:'Cost of Beverages', type:'Expense', category:'COGS', active:true },
  '5040': { code:'5040', name:'Cost of Rice & Grain', type:'Expense', category:'COGS', active:true },
  '5050': { code:'5050', name:'Cooking Oil & Condiments', type:'Expense', category:'COGS', active:true },
  '6010': { code:'6010', name:'Electricity', type:'Expense', category:'Operating', active:true },
  '6020': { code:'6020', name:'Gas', type:'Expense', category:'Operating', active:true },
  '6030': { code:'6030', name:'Equipment Repair', type:'Expense', category:'Operating', active:true },
  '6040': { code:'6040', name:'Staff Wages', type:'Expense', category:'Payroll', active:true },
  '6050': { code:'6050', name:'Cleaning & Supplies', type:'Expense', category:'Operating', active:true },
  '6060': { code:'6060', name:'Packaging', type:'Expense', category:'Operating', active:true },
  '6070': { code:'6070', name:'Other Operating Expenses', type:'Expense', category:'Operating', active:true },
};

const DEFAULT_OWNERS = [
  { id:'owner1', name:'Owner 1', email:'owner1@hashmi.com', password:'hashmi123', role:'owner' },
  { id:'owner2', name:'Owner 2', email:'owner2@hashmi.com', password:'hashmi123', role:'owner' },
  { id:'owner3', name:'Owner 3', email:'owner3@hashmi.com', password:'hashmi123', role:'owner' },
];

// Seed GL Entries (with Chart of Accounts)
const SEED_GL_ENTRIES = [
  { id:1, date:'2026-04-10', debitCode:'1010', creditCode:'4010', amount:18500, description:'Dine-In Cash Receipt', refTxId:null },
  { id:2, date:'2026-04-11', debitCode:'5010', creditCode:'2010', amount:7200, description:'Meat Purchase - Payable', refTxId:null },
  { id:3, date:'2026-04-12', debitCode:'1020', creditCode:'4040', amount:5000, description:'Beverage Sales - Bank Deposit', refTxId:null },
];

// Seed Beverages
const SEED_BEVERAGES = [
  { id:'bev1', name:'Mango Lassi', costPerUnit:150, quantity:50, unit:'Glass', reorderLevel:20 },
  { id:'bev2', name:'Lemonade', costPerUnit:100, quantity:100, unit:'Glass', reorderLevel:30 },
  { id:'bev3', name:'Buttermilk', costPerUnit:80, quantity:75, unit:'Glass', reorderLevel:25 },
  { id:'bev4', name:'Tea / Coffee', costPerUnit:120, quantity:40, unit:'Cup', reorderLevel:15 },
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
  { id:'dashboard', label:'Dashboard',                    icon:'▦' },
  { id:'customers', label:'Customer Transactions',         icon:'👥' },
  { id:'expenses',  label:'Restaurant Expenses',           icon:'💸' },
  { id:'inventory', label:'Inventory Management System',  icon:'📦' },
  { id:'history',   label:'Full History',                  icon:'📜' },
  { id:'reports',   label:'Reports',                       icon:'📊' },
  { id:'ledger',    label:'General Ledger',                icon:'📖' },
  { id:'settings',  label:'Settings',                      icon:'⚙' },
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
  const [glEntries,    setGlEntries]    = useState(()=>loadLS('hm_gl_v3', SEED_GL_ENTRIES));
  const [beverages,    setBeverages]    = useState(()=>loadLS('hm_beverages_v3', SEED_BEVERAGES));
  const [inventory,    setInventory]    = useState(()=>loadLS('hm_inventory_v3', []));
  const [users,        setUsers]        = useState(()=>loadLS('hm_users_v3', DEFAULT_OWNERS));
  const [loginLogs,    setLoginLogs]    = useState(()=>loadLS('hm_logs_v3',  []));
  const [page,         setPage]         = useState('dashboard');
  const [toast,        setToast]        = useState({msg:'',ok:true,show:false});
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  useEffect(()=>{ saveLS('hm_txns_v3',  transactions); },[transactions]);
  useEffect(()=>{ saveLS('hm_gl_v3',    glEntries);    },[glEntries]);
  useEffect(()=>{ saveLS('hm_beverages_v3', beverages); },[beverages]);
  useEffect(()=>{ saveLS('hm_inventory_v3', inventory); },[inventory]);
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
      <aside className={`sidebar ${showMobileMenu ? 'mobile-open' : ''}`}>
        <div className="sidebar-logo">
          <img src={logo} alt="Hashmi Platter House" className="sidebar-logo-img"/>
          <div className="sidebar-logo-text">
            <span className="slt-name">Hashmi</span>
            <span className="slt-sub">Platter House</span>
          </div>
          <button className="mobile-close" onClick={() => setShowMobileMenu(false)}>✕</button>
        </div>

        <nav className="sidebar-nav">
          <div className="snav-label">NAVIGATION</div>
          {allNavItems.map(n=>(
            <button key={n.id} className={`snav-item ${page===n.id?'active':''}`} onClick={()=>{setPage(n.id); setShowMobileMenu(false);}}>
              <span className="snav-icon">{n.icon}</span>
              <span className="snav-label-text">{n.label}</span>
              {page===n.id && <span className="snav-active-bar"/>}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <span className={`sf-role ${currentUser.role}`}>{currentUser.role.toUpperCase()}</span>
          <span className="sf-version">v3.0 Pro</span>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <div className="main-area">
        {/* TOPBAR */}
        <header className="topbar">
          <div className="topbar-left">
            <button className="mobile-menu-btn" onClick={() => setShowMobileMenu(!showMobileMenu)}>☰</button>
            <div className="topbar-page">{allNavItems.find(n=>n.id===page)?.label || 'Dashboard'}</div>
            <div className="topbar-date">{new Date().toLocaleDateString('en-PK',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}</div>
          </div>
          <div className="topbar-right">
            <AvatarMenu currentUser={currentUser} onLogout={handleLogout}/>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main className="page-content">
          {page==='dashboard' && <DashboardPage transactions={transactions} glEntries={glEntries} beverages={beverages} inventory={inventory} setInventory={setInventory} currentUser={currentUser} setPage={setPage} markPaid={markPaid}/>}
          {page==='inventory' && <InventoryManagementPage inventory={inventory} setInventory={setInventory} beverages={beverages} setBeverages={setBeverages} currentUser={currentUser}/>}
          {page==='expenses'  && <ExpensesPage  transactions={transactions} addTransaction={addTransaction} markPaid={markPaid} deleteTransaction={deleteTransaction} currentUser={currentUser}/>}
          {page==='customers' && <CustomersPage transactions={transactions} addTransaction={addTransaction} markPaid={markPaid} deleteTransaction={deleteTransaction} currentUser={currentUser}/>}
          {page==='beverages' && <BeveragesPage beverages={beverages} setBeverages={setBeverages} addTransaction={addTransaction} glEntries={glEntries} setGlEntries={setGlEntries} currentUser={currentUser}/>}
          {page==='history'   && <HistoryPage   transactions={transactions} markPaid={markPaid} deleteTransaction={deleteTransaction} clearHistory={clearHistory} currentUser={currentUser}/>}
          {page==='reports'   && <ReportsPage   transactions={transactions} beverages={beverages}/>}
          {page==='ledger'    && <LedgerPage    glEntries={glEntries} chartOfAccounts={CHART_OF_ACCOUNTS}/>}
          {page==='settings'  && isOwner && <SettingsPage users={users} loginLogs={loginLogs} addManager={addManager} removeManager={removeManager} currentUser={currentUser}/>}
        </main>
      </div>

      {showMobileMenu && <div className="overlay" onClick={() => setShowMobileMenu(false)}/>}
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
  const [videoIndex, setVideoIndex] = useState(0);
  const videos = [require('./1.mp4'), require('./2.mp4'), require('./3.mp4'), require('./4.mp4')];

  useEffect(() => {
    const interval = setInterval(() => {
      setVideoIndex(prev => (prev + 1) % videos.length);
    }, 8000); // Change video every 8 seconds
    return () => clearInterval(interval);
  }, [videos.length]);

  return (
    <div className="login-page">
      <div className="login-left">
        <video key={videoIndex} className="login-video" autoPlay muted loop>
          <source src={videos[videoIndex]} type="video/mp4" />
        </video>
        <div className="login-overlay"/>
      </div>
      <div className="login-right">
        <div className="login-card">
          <div className="login-header-logo">
            <img src={logo} alt="Hashmi Platter House" className="login-logo-lg"/>
          </div>
          <div className="login-form-title">Sign In</div>
          <div className="login-form-sub">Enter your credentials to continue</div>
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
        </div>
      </div>
      {toast.show && <div className={`toast ${toast.ok?'tok':'terr'}`}>{toast.msg}</div>}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// DASHBOARD
// ══════════════════════════════════════════════════════════════════════════
function DashboardPage({ transactions, glEntries, beverages, inventory, setInventory, currentUser, setPage, markPaid }) {
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

  // Total Liabilities (including unpaid balances per accounting standards)
  // Unpaid expenses are liabilities (Accounts Payable) - they represent money owed
  const liabilityCodes = Object.keys(CHART_OF_ACCOUNTS).filter(code => CHART_OF_ACCOUNTS[code].type === 'Liability');
  let totalLiabilities = totalUnpaid; // Start with unpaid balances as liabilities
  glEntries.forEach(entry => {
    if (liabilityCodes.includes(entry.creditCode)) totalLiabilities += entry.amount;
    if (liabilityCodes.includes(entry.debitCode)) totalLiabilities -= entry.amount;
  });

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
        <KpiCard label="Net Profit" value={fmt(net)}             delta={net>=0?'Profit':'Loss'}      color={net>=0?'green':'red'} icon={<IconNet/>}/>
        <KpiCard label="Total Liabilities" value={fmt(totalLiabilities)} delta={`Including unpaid + GL`} color="purple" icon={<IconLedger/>}/>
      </div>

      {/* Quick Actions - MOVED UP */}
      <div className="dash-card qa-card">
        <div className="dc-header"><span className="dc-title">⚡ Quick Actions</span></div>
        <div className="qa-grid">
          <button className="qa-btn red"    onClick={()=>setPage('expenses')}>+ Add Expense</button>
          <button className="qa-btn green"  onClick={()=>setPage('customers')}>+ Add Customer</button>
          <button className="qa-btn blue" onClick={()=>setPage('inventory')}>📦 Manage Inventory</button>
          <button className="qa-btn orange" onClick={()=>setPage('reports')}>📊 Download Reports</button>
        </div>
      </div>

      {/* Middle Row - Liabilities & Categories */}
      <div className="dash-mid">
        {/* Total Liabilities Card */}
        <div className="dash-card" style={{flex:1.2}}>
          <div className="dc-header">
            <span className="dc-title">📋 Total Liabilities</span>
            <span className="dc-badge purple">Accounting Standard</span>
          </div>
          <div className="liability-summary">
            <div className="ls-item">
              <div className="ls-label">Accounts Payable (Unpaid)</div>
              <div className="ls-value">{fmt(totalUnpaid)}</div>
            </div>
            <div className="ls-item">
              <div className="ls-label">Other GL Liabilities</div>
              <div className="ls-value">{fmt(totalLiabilities - totalUnpaid)}</div>
            </div>
            <div className="ls-divider"/>
            <div className="ls-total">
              <div className="lst-label">Total Liabilities</div>
              <div className="lst-value">{fmt(totalLiabilities)}</div>
            </div>
          </div>
          <div className="liability-note">
            <span>📘</span> Per international accounting standards (GAAP/IFRS), unpaid expenses are recorded as liabilities (Accounts Payable) until paid.
          </div>
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
const IconNet     = ()=><svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M3 14l4-4 3 3 7-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const IconLedger = ()=><svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M4 3h12a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V4a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.5"/><path d="M4 8h12M4 12h12M8 4v12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>;

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
// INVENTORY MANAGEMENT PAGE (Professional)
// ══════════════════════════════════════════════════════════════════════════
function InventoryManagementPage({ inventory, setInventory, beverages, setBeverages, currentUser }) {
  const [tab, setTab] = useState('general');
  const [newItem, setNewItem] = useState({ name: '', quantity: '', costPerUnit: '', unit: 'kg', category: 'Meat' });
  const [newBev, setNewBev] = useState({ name: '', costPerUnit: '', quantity: '', unit: 'Glass', reorderLevel: '' });
  const [err, setErr] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  function addGeneralInventory() {
    if (!newItem.name.trim() || !newItem.quantity || !newItem.costPerUnit) { 
      setErr('All fields required'); 
      return; 
    }
    const qty = parseFloat(newItem.quantity);
    const cost = parseFloat(newItem.costPerUnit);
    if (qty <= 0 || cost <= 0) { setErr('Quantity and cost must be greater than 0'); return; }
    
    setInventory(prev => [...prev, { 
      ...newItem, 
      id: Date.now(), 
      quantity: qty, 
      costPerUnit: cost,
      createdDate: new Date().toISOString().split('T')[0],
      lastUpdated: new Date().toISOString().split('T')[0]
    }]);
    setNewItem({ name: '', quantity: '', costPerUnit: '', unit: 'kg', category: 'Meat' });
    setErr('');
  }

  function addBeverageInventory() {
    if (!newBev.name.trim() || !newBev.costPerUnit || !newBev.quantity || !newBev.reorderLevel) {
      setErr('All fields required');
      return;
    }
    const qty = parseInt(newBev.quantity);
    const cost = parseFloat(newBev.costPerUnit);
    const reorder = parseInt(newBev.reorderLevel);
    if (qty <= 0 || cost <= 0 || reorder < 0) { setErr('Invalid quantity or cost'); return; }
    
    setBeverages(prev => [...prev, {
      id: 'bev_' + Date.now(),
      name: newBev.name,
      costPerUnit: cost,
      quantity: qty,
      unit: newBev.unit,
      reorderLevel: reorder,
      createdDate: new Date().toISOString().split('T')[0]
    }]);
    setNewBev({ name: '', costPerUnit: '', quantity: '', unit: 'Glass', reorderLevel: '' });
    setErr('');
  }

  function deleteInventoryItem(id) {
    if (!window.confirm('Delete this item permanently?')) return;
    setInventory(prev => prev.filter(i => i.id !== id));
  }

  function deleteBeverageItem(id) {
    if (!window.confirm('Delete this beverage permanently?')) return;
    setBeverages(prev => prev.filter(b => b.id !== id));
  }

  function updateItemQuantity(id, newQty) {
    setInventory(prev => prev.map(i => i.id === id ? { ...i, quantity: parseFloat(newQty), lastUpdated: new Date().toISOString().split('T')[0] } : i));
  }

  function updateBevQuantity(id, newQty) {
    setBeverages(prev => prev.map(b => b.id === id ? { ...b, quantity: parseInt(newQty) } : b));
  }

  // Filter items
  const filteredInventory = inventory.filter(i => 
    i.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    i.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredBeverages = beverages.filter(b => 
    b.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate totals
  const generalValue = inventory.reduce((s, i) => s + (i.quantity * i.costPerUnit), 0);
  const beverageValue = beverages.reduce((s, b) => s + (b.quantity * b.costPerUnit), 0);
  const totalValue = generalValue + beverageValue;
  const lowStockItems = inventory.filter(i => i.quantity <= 5).length;
  const lowStockBevs = beverages.filter(b => b.quantity <= b.reorderLevel).length;

  return (
    <div className="page-wrap">
      <PageHeader 
        title="📦 Inventory Management System" 
        action={<span className="badge" style={{fontSize:12}}>{inventory.length + beverages.length} Total Items</span>}
      />

      {/* Stats Cards */}
      <div className="inv-stats-row">
        <div className="inv-stat-card gradient-green">
          <div className="inv-stat-icon">💰</div>
          <div className="inv-stat-content">
            <div className="inv-stat-label">Total Inventory Value</div>
            <div className="inv-stat-value">{fmt(totalValue)}</div>
          </div>
        </div>
        <div className="inv-stat-card gradient-blue">
          <div className="inv-stat-icon">📦</div>
          <div className="inv-stat-content">
            <div className="inv-stat-label">General Items</div>
            <div className="inv-stat-value">{inventory.length}</div>
          </div>
        </div>
        <div className="inv-stat-card gradient-orange">
          <div className="inv-stat-icon">🍹</div>
          <div className="inv-stat-content">
            <div className="inv-stat-label">Beverages</div>
            <div className="inv-stat-value">{beverages.length}</div>
          </div>
        </div>
        <div className="inv-stat-card gradient-red">
          <div className="inv-stat-icon">⚠️</div>
          <div className="inv-stat-content">
            <div className="inv-stat-label">Low Stock Items</div>
            <div className="inv-stat-value">{lowStockItems + lowStockBevs}</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="inv-tabs">
        <button className={`inv-tab ${tab === 'general' ? 'active' : ''}`} onClick={() => { setTab('general'); setSearchTerm(''); }}>
          📋 General Inventory ({inventory.length})
        </button>
        <button className={`inv-tab ${tab === 'beverages' ? 'active' : ''}`} onClick={() => { setTab('beverages'); setSearchTerm(''); }}>
          🍹 Beverage Stock ({beverages.length})
        </button>
      </div>

      {/* General Inventory Tab */}
      {tab === 'general' && (
        <div className="inv-split-layout">
          <div className="inv-form-card">
            <div className="inv-form-title">➕ Add New Item</div>
            <div className="inv-form-content">
              <div className="inv-field-group">
                <label>Item Name *</label>
                <input 
                  type="text" 
                  placeholder="e.g., Chicken Breast, Onion, Oil" 
                  value={newItem.name} 
                  onChange={e => setNewItem({...newItem, name: e.target.value})}
                  className="inv-input"
                />
              </div>

              <div className="inv-field-row">
                <div className="inv-field-group">
                  <label>Category *</label>
                  <select value={newItem.category} onChange={e => setNewItem({...newItem, category: e.target.value})} className="inv-input">
                    <option>Meat</option>
                    <option>Vegetables</option>
                    <option>Spices</option>
                    <option>Oil & Condiments</option>
                    <option>Rice & Grains</option>
                    <option>Other</option>
                  </select>
                </div>
                <div className="inv-field-group">
                  <label>Unit *</label>
                  <select value={newItem.unit} onChange={e => setNewItem({...newItem, unit: e.target.value})} className="inv-input">
                    <option>kg</option>
                    <option>liter</option>
                    <option>pcs</option>
                    <option>box</option>
                    <option>pack</option>
                  </select>
                </div>
              </div>

              <div className="inv-field-row">
                <div className="inv-field-group">
                  <label>Quantity *</label>
                  <input 
                    type="number" 
                    placeholder="0" 
                    min="0" 
                    step="0.01"
                    value={newItem.quantity} 
                    onChange={e => setNewItem({...newItem, quantity: e.target.value})}
                    className="inv-input"
                  />
                </div>
                <div className="inv-field-group">
                  <label>Cost per Unit (PKR) *</label>
                  <input 
                    type="number" 
                    placeholder="0" 
                    min="0" 
                    step="0.01"
                    value={newItem.costPerUnit} 
                    onChange={e => setNewItem({...newItem, costPerUnit: e.target.value})}
                    className="inv-input"
                  />
                </div>
              </div>

              {err && <div className="inv-err-alert">{err}</div>}
              <button className="inv-submit-btn" onClick={addGeneralInventory}>➕ Add to Inventory</button>
            </div>
          </div>

          <div className="inv-list-card">
            <div className="inv-list-header">
              <div className="inv-list-title">📋 Current Inventory ({inventory.length})</div>
              <input 
                type="text" 
                placeholder="Search items..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="inv-search"
              />
            </div>

            {inventory.length === 0 ? (
              <div className="empty-state"><p>No inventory items yet. Add one above!</p></div>
            ) : filteredInventory.length === 0 ? (
              <div className="empty-state"><p>No items match your search.</p></div>
            ) : (
              <div className="inv-items-container">
                {filteredInventory.map((item, idx) => (
                  <div key={item.id} className="inv-item-card">
                    <div className="inv-item-header">
                      <div className="inv-item-number">{idx + 1}</div>
                      <div className="inv-item-info">
                        <div className="inv-item-name">{item.name}</div>
                        <div className="inv-item-meta">{item.category} • {item.unit}</div>
                      </div>
                      <button className="inv-del-btn" onClick={() => deleteInventoryItem(item.id)}>✕</button>
                    </div>

                    <div className="inv-item-details">
                      <div className="inv-detail-row">
                        <span className="inv-detail-label">Quantity:</span>
                        <div className="inv-qty-editor">
                          <input 
                            type="number" 
                            value={item.quantity} 
                            onChange={e => updateItemQuantity(item.id, e.target.value)}
                            className="inv-qty-input"
                            step="0.01"
                          />
                          <span className="inv-unit">{item.unit}</span>
                        </div>
                      </div>
                      <div className="inv-detail-row">
                        <span className="inv-detail-label">Unit Cost:</span>
                        <span className="inv-detail-value">{fmt(item.costPerUnit)}</span>
                      </div>
                      <div className="inv-detail-row">
                        <span className="inv-detail-label">Total Value:</span>
                        <span className="inv-detail-value highlight">{fmt(item.quantity * item.costPerUnit)}</span>
                      </div>
                      <div className="inv-detail-row">
                        <span className="inv-detail-label">Added:</span>
                        <span className="inv-detail-value">{item.createdDate || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Beverages Tab */}
      {tab === 'beverages' && (
        <div className="inv-split-layout">
          <div className="inv-form-card">
            <div className="inv-form-title">🍹 Add New Beverage</div>
            <div className="inv-form-content">
              <div className="inv-field-group">
                <label>Beverage Name *</label>
                <input 
                  type="text" 
                  placeholder="e.g., Mango Lassi, Lemonade" 
                  value={newBev.name} 
                  onChange={e => setNewBev({...newBev, name: e.target.value})}
                  className="inv-input"
                />
              </div>

              <div className="inv-field-row">
                <div className="inv-field-group">
                  <label>Unit *</label>
                  <select value={newBev.unit} onChange={e => setNewBev({...newBev, unit: e.target.value})} className="inv-input">
                    <option>Glass</option>
                    <option>Cup</option>
                    <option>Bottle</option>
                    <option>Liter</option>
                  </select>
                </div>
                <div className="inv-field-group">
                  <label>Reorder Level *</label>
                  <input 
                    type="number" 
                    placeholder="e.g., 20" 
                    min="0"
                    value={newBev.reorderLevel} 
                    onChange={e => setNewBev({...newBev, reorderLevel: e.target.value})}
                    className="inv-input"
                  />
                </div>
              </div>

              <div className="inv-field-row">
                <div className="inv-field-group">
                  <label>Opening Quantity *</label>
                  <input 
                    type="number" 
                    placeholder="0" 
                    min="0"
                    value={newBev.quantity} 
                    onChange={e => setNewBev({...newBev, quantity: e.target.value})}
                    className="inv-input"
                  />
                </div>
                <div className="inv-field-group">
                  <label>Cost per Unit (PKR) *</label>
                  <input 
                    type="number" 
                    placeholder="0" 
                    min="0"
                    step="0.01"
                    value={newBev.costPerUnit} 
                    onChange={e => setNewBev({...newBev, costPerUnit: e.target.value})}
                    className="inv-input"
                  />
                </div>
              </div>

              {err && <div className="inv-err-alert">{err}</div>}
              <button className="inv-submit-btn inv-submit-orange" onClick={addBeverageInventory}>🍹 Add Beverage</button>
            </div>
          </div>

          <div className="inv-list-card">
            <div className="inv-list-header">
              <div className="inv-list-title">🍹 Beverages ({beverages.length})</div>
              <input 
                type="text" 
                placeholder="Search beverages..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="inv-search"
              />
            </div>

            {beverages.length === 0 ? (
              <div className="empty-state"><p>No beverages added yet.</p></div>
            ) : filteredBeverages.length === 0 ? (
              <div className="empty-state"><p>No beverages match your search.</p></div>
            ) : (
              <div className="inv-items-container">
                {filteredBeverages.map((bev, idx) => (
                  <div key={bev.id} className={`inv-item-card ${bev.quantity <= bev.reorderLevel ? 'low-stock' : ''}`}>
                    <div className="inv-item-header">
                      <div className="inv-item-number">🍹</div>
                      <div className="inv-item-info">
                        <div className="inv-item-name">{bev.name}</div>
                        <div className="inv-item-meta">{bev.unit}</div>
                      </div>
                      <button className="inv-del-btn" onClick={() => deleteBeverageItem(bev.id)}>✕</button>
                    </div>

                    <div className="inv-item-details">
                      <div className="inv-detail-row">
                        <span className="inv-detail-label">Current Stock:</span>
                        <div className="inv-qty-editor">
                          <input 
                            type="number" 
                            value={bev.quantity} 
                            onChange={e => updateBevQuantity(bev.id, e.target.value)}
                            className="inv-qty-input"
                            min="0"
                          />
                          <span className="inv-unit">{bev.unit}s</span>
                        </div>
                      </div>
                      <div className="inv-detail-row">
                        <span className="inv-detail-label">Reorder Level:</span>
                        <span className={`inv-detail-value ${bev.quantity <= bev.reorderLevel ? 'warning' : ''}`}>{bev.reorderLevel} {bev.unit}s</span>
                      </div>
                      <div className="inv-detail-row">
                        <span className="inv-detail-label">Unit Cost:</span>
                        <span className="inv-detail-value">{fmt(bev.costPerUnit)}</span>
                      </div>
                      <div className="inv-detail-row">
                        <span className="inv-detail-label">Total Value:</span>
                        <span className="inv-detail-value highlight">{fmt(bev.quantity * bev.costPerUnit)}</span>
                      </div>
                    </div>

                    {bev.quantity <= bev.reorderLevel && (
                      <div className="inv-stock-warning">⚠️ Low Stock - Reorder Soon!</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// BEVERAGES PAGE
// ══════════════════════════════════════════════════════════════════════════
function BeveragesPage({ beverages, setBeverages, addTransaction, glEntries, setGlEntries, currentUser }) {
  const [form, setForm] = useState({name:'',costPerUnit:'',quantity:'',unit:'Glass',reorderLevel:''});
  const [err, setErr] = useState('');
  const [saleForm, setSaleForm] = useState({beverageId:'',quantity:'',date:today(),pricePerUnit:''});

  function handleAddBeverage() {
    if (!form.name.trim()||!form.costPerUnit||!form.quantity||!form.reorderLevel) { setErr('All fields required'); return; }
    const newBev = { id:'bev_'+Date.now(), name:form.name, costPerUnit:parseFloat(form.costPerUnit), quantity:parseInt(form.quantity), unit:form.unit, reorderLevel:parseInt(form.reorderLevel) };
    setBeverages(prev=>[...prev,newBev]);
    setForm({name:'',costPerUnit:'',quantity:'',unit:'Glass',reorderLevel:''});
    setErr('');
  }

  function handleSaleBeverage() {
    if (!saleForm.beverageId||!saleForm.quantity||!saleForm.pricePerUnit) { setErr('All fields required'); return; }
    const bev = beverages.find(b=>b.id===saleForm.beverageId);
    if (bev.quantity < parseInt(saleForm.quantity)) { setErr('Insufficient stock'); return; }
    
    const qty = parseInt(saleForm.quantity);
    const totalAmount = qty * parseFloat(saleForm.pricePerUnit);
    
    // Update inventory
    setBeverages(prev=>prev.map(b=>b.id===saleForm.beverageId?{...b,quantity:b.quantity-qty}:b));
    
    // Add GL entries (debit cash, credit beverage revenue)
    setGlEntries(prev=>[...prev,{id:Date.now(), date:saleForm.date, debitCode:'1020', creditCode:'4040', amount:totalAmount, description:`Beverage Sale - ${bev.name}`, refTxId:null}]);
    
    setSaleForm({beverageId:'',quantity:'',date:today(),pricePerUnit:''});
    setErr('');
  }

  const totalInventoryValue = beverages.reduce((s,b)=>s+(b.quantity*b.costPerUnit),0);
  const lowStockCount = beverages.filter(b=>b.quantity <= b.reorderLevel).length;

  return (
    <div className="page-wrap">
      <PageHeader title="Beverage Management" action={<span className="badge">{beverages.length} Items</span>}/>
      <div className="stat-row">
        <StatPill label="Inventory Value" val={fmt(totalInventoryValue)} color="orange"/>
        <StatPill label="Low Stock Items" val={lowStockCount} color="red"/>
        <StatPill label="Total Units" val={beverages.reduce((s,b)=>s+b.quantity,0)} color="blue"/>
      </div>
      
      <div className="split-layout">
        <div>
          <FormCard title="Add New Beverage" onSubmit={handleAddBeverage} submitLabel="+ Add Beverage" submitColor="orange">
            <Field label="Beverage Name *" error={err&&!form.name.trim()}>
              <input type="text" placeholder="e.g. Mango Lassi" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/>
            </Field>
            <TwoCol>
              <Field label="Cost per Unit (PKR) *" error={err&&!form.costPerUnit}>
                <input type="number" placeholder="0" min="0" value={form.costPerUnit} onChange={e=>setForm({...form,costPerUnit:e.target.value})}/>
              </Field>
              <Field label="Unit *">
                <select value={form.unit} onChange={e=>setForm({...form,unit:e.target.value})}>
                  <option>Glass</option><option>Cup</option><option>Bottle</option><option>Liter</option>
                </select>
              </Field>
            </TwoCol>
            <TwoCol>
              <Field label="Opening Quantity *" error={err&&!form.quantity}>
                <input type="number" placeholder="0" min="0" value={form.quantity} onChange={e=>setForm({...form,quantity:e.target.value})}/>
              </Field>
              <Field label="Reorder Level *" error={err&&!form.reorderLevel}>
                <input type="number" placeholder="0" min="0" value={form.reorderLevel} onChange={e=>setForm({...form,reorderLevel:e.target.value})}/>
              </Field>
            </TwoCol>
            {err && <div className="err-alert">{err}</div>}
          </FormCard>

          <FormCard title="Record Beverage Sale" onSubmit={handleSaleBeverage} submitLabel="+ Record Sale" submitColor="green" style={{marginTop:16}}>
            <Field label="Select Beverage *">
              <select value={saleForm.beverageId} onChange={e=>setSaleForm({...saleForm,beverageId:e.target.value})}>
                <option value="">-- Select --</option>
                {beverages.map(b=><option key={b.id} value={b.id}>{b.name} ({b.quantity} remaining)</option>)}
              </select>
            </Field>
            <TwoCol>
              <Field label="Quantity Sold *">
                <input type="number" placeholder="0" min="0" value={saleForm.quantity} onChange={e=>setSaleForm({...saleForm,quantity:e.target.value})}/>
              </Field>
              <Field label="Sale Price per Unit (PKR) *">
                <input type="number" placeholder="0" min="0" value={saleForm.pricePerUnit} onChange={e=>setSaleForm({...saleForm,pricePerUnit:e.target.value})}/>
              </Field>
            </TwoCol>
            <Field label="Date *">
              <input type="date" value={saleForm.date} onChange={e=>setSaleForm({...saleForm,date:e.target.value})}/>
            </Field>
            {err && <div className="err-alert">{err}</div>}
          </FormCard>
        </div>

        <div className="list-card">
          <div className="lc-hdr"><span>Beverage Inventory</span></div>
          {beverages.length===0 && <div className="empty-state"><p>No beverages added yet.</p></div>}
          {beverages.map(b=>(
            <div className="bev-row" key={b.id}>
              <div className="bev-main">
                <div className="bev-name">{b.name}</div>
                <div className="bev-meta">Cost: {fmt(b.costPerUnit)} | Unit: {b.unit}</div>
              </div>
              <div className="bev-qty">
                <div className={`stock-badge ${b.quantity <= b.reorderLevel ? 'low' : 'ok'}`}>{b.quantity} {b.unit}s</div>
                <div className="stock-status">Reorder at: {b.reorderLevel}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// GENERAL LEDGER PAGE
// ══════════════════════════════════════════════════════════════════════════
function LedgerPage({ glEntries, chartOfAccounts }) {
  const [selectedAcct, setSelectedAcct] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [glForm, setGlForm] = useState({date: today(), debitCode: '', creditCode: '', amount: '', description: ''});
  const [err, setErr] = useState('');
  
  // Calculate account balances
  function getAccountBalance(code) {
    const isDebitAcc = ['1','3','5'].includes(code[0]); // Assets, Equity (contra), Expenses are Debit balances
    const debits = glEntries.filter(e=>e.debitCode===code).reduce((s,e)=>s+e.amount,0);
    const credits = glEntries.filter(e=>e.creditCode===code).reduce((s,e)=>s+e.amount,0);
    return isDebitAcc ? (debits - credits) : (credits - debits);
  }

  const accountGroups = {};
  Object.values(chartOfAccounts).forEach(acc=>{
    if (!accountGroups[acc.type]) accountGroups[acc.type] = [];
    accountGroups[acc.type].push(acc);
  });

  // Get all accounts as array for dropdown
  const allAccounts = Object.values(chartOfAccounts);

  // Handle adding new GL entry
  function handleAddGL() {
    if (!glForm.debitCode || !glForm.creditCode || !glForm.amount || !glForm.description) {
      setErr('All fields are required');
      return;
    }
    if (glForm.debitCode === glForm.creditCode) {
      setErr('Debit and Credit accounts must be different');
      return;
    }
    const amount = parseFloat(glForm.amount);
    if (amount <= 0) {
      setErr('Amount must be greater than 0');
      return;
    }
    
    // This would be passed from parent - for now we'll show a success message
    setErr('');
    setShowAddModal(false);
    setGlForm({date: today(), debitCode: '', creditCode: '', amount: '', description: ''});
    alert(`GL Entry prepared:\nDate: ${glForm.date}\nDr: ${chartOfAccounts[glForm.debitCode]?.name}\nCr: ${chartOfAccounts[glForm.creditCode]?.name}\nAmount: ${fmt(amount)}\n\nNote: Connect this to parent setGlEntries to save.`);
  }

  return (
    <div className="page-wrap">
      <PageHeader 
        title="📖 General Ledger (Double-Entry Bookkeeping)" 
        action={
          <button className="dl-btn" onClick={() => setShowAddModal(true)}>+ Add Entry</button>
        }
      />
      
      {/* Add GL Entry Modal */}
      {showAddModal && (
        <div className="gl-modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="gl-modal" onClick={e => e.stopPropagation()}>
            <div className="gl-modal-header">
              <span>➕ Add General Ledger Entry</span>
              <button className="gl-modal-close" onClick={() => setShowAddModal(false)}>✕</button>
            </div>
            <div className="gl-modal-body">
              <div className="gl-field">
                <label>Date *</label>
                <input type="date" value={glForm.date} onChange={e => setGlForm({...glForm, date: e.target.value})} />
              </div>
              <div className="gl-field">
                <label>Debit Account (Increase) *</label>
                <select value={glForm.debitCode} onChange={e => setGlForm({...glForm, debitCode: e.target.value})}>
                  <option value="">-- Select Debit Account --</option>
                  {allAccounts.map(acc => (
                    <option key={acc.code} value={acc.code}>{acc.code} - {acc.name} ({acc.type})</option>
                  ))}
                </select>
              </div>
              <div className="gl-field">
                <label>Credit Account (Decrease) *</label>
                <select value={glForm.creditCode} onChange={e => setGlForm({...glForm, creditCode: e.target.value})}>
                  <option value="">-- Select Credit Account --</option>
                  {allAccounts.map(acc => (
                    <option key={acc.code} value={acc.code}>{acc.code} - {acc.name} ({acc.type})</option>
                  ))}
                </select>
              </div>
              <div className="gl-field">
                <label>Amount (PKR) *</label>
                <input type="number" placeholder="0" min="0" value={glForm.amount} onChange={e => setGlForm({...glForm, amount: e.target.value})} />
              </div>
              <div className="gl-field">
                <label>Description *</label>
                <input type="text" placeholder="e.g., Cash received from customer" value={glForm.description} onChange={e => setGlForm({...glForm, description: e.target.value})} />
              </div>
              {err && <div className="gl-err-alert">{err}</div>}
              <div className="gl-modal-actions">
                <button className="gl-btn-cancel" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button className="gl-btn-submit" onClick={handleAddGL}>+ Add Entry</button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="gl-container">
        <div className="gl-accounts">
          <div className="gl-section-title">📋 Chart of Accounts</div>
          {Object.entries(accountGroups).map(([type,accts])=>(
            <div key={type} className="gl-type-group">
              <div className="gl-type-label">{type.toUpperCase()}S</div>
              {accts.map(acc=>(
                <button key={acc.code} className={`gl-acc-btn ${selectedAcct===acc.code?'active':''}`} onClick={()=>setSelectedAcct(acc.code)}>
                  <span className="gl-code">{acc.code}</span>
                  <span className="gl-accname">{acc.name}</span>
                  <span className="gl-bal">{fmt(getAccountBalance(acc.code))}</span>
                </button>
              ))}
            </div>
          ))}
        </div>

        <div className="gl-entries">
          {selectedAcct ? (
            <>
              <div className="gle-header">
                <div>
                  <div className="gle-acc-name">{chartOfAccounts[selectedAcct]?.name}</div>
                  <div className="gle-acc-code">Code: {selectedAcct} • {chartOfAccounts[selectedAcct]?.type}</div>
                </div>
                <div className="gle-balance">Balance: {fmt(getAccountBalance(selectedAcct))}</div>
              </div>
              <div className="gle-table">
                <div className="gle-row gle-header-row">
                  <div>Date</div>
                  <div>Debit</div>
                  <div>Credit</div>
                  <div>Description</div>
                </div>
                {glEntries.filter(e=>e.debitCode===selectedAcct||e.creditCode===selectedAcct).length === 0 ? (
                  <div className="gle-empty">No entries for this account</div>
                ) : glEntries.filter(e=>e.debitCode===selectedAcct||e.creditCode===selectedAcct).map(e=>(
                  <div className="gle-row" key={e.id}>
                    <div>{e.date}</div>
                    <div>{e.debitCode===selectedAcct?fmt(e.amount):'-'}</div>
                    <div>{e.creditCode===selectedAcct?fmt(e.amount):'-'}</div>
                    <div className="gle-desc">{e.description}</div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="gle-select-prompt">
              <div className="gle-prompt-icon">📖</div>
              <div className="gle-prompt-title">Select an Account</div>
              <div className="gle-prompt-text">Choose an account from the left panel to view its journal entries and balance.</div>
            </div>
          )}
        </div>
      </div>

      {/* Trial Balance */}
      <div className="dash-card" style={{marginTop:24}}>
        <div className="dc-header">
          <span className="dc-title">⚖️ Trial Balance</span>
          <span className="dc-badge">{glEntries.length} Entries</span>
        </div>
        <div className="trial-balance-table">
          <div className="tbl-header">
            <div>Account</div>
            <div>Code</div>
            <div>Debit</div>
            <div>Credit</div>
          </div>
          {Object.values(chartOfAccounts).map(acc=>{
            const balance = getAccountBalance(acc.code);
            const isDebitBal = ['1','3','5'].includes(acc.code[0]);
            const debitBal = balance >= 0 && isDebitBal ? balance : 0;
            const creditBal = balance >= 0 && !isDebitBal ? balance : Math.abs(balance);
            return (debitBal !== 0 || creditBal !== 0) && (
              <div className="tbl-row" key={acc.code}>
                <div>{acc.name}</div>
                <div>{acc.code}</div>
                <div>{fmt(debitBal)}</div>
                <div>{fmt(creditBal)}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}


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
