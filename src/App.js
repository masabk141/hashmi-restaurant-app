import React, { useState, useEffect, useMemo } from 'react';
import './App.css';

const CATEGORIES = [
  'Beverages','Butcher','Rice Merchant','Vegetables','Utilities',
  'Equipment Repair','Payroll','Oil','Condiments','Operating Expenses'
];

const SEED_DATA = [
  { id:1, date:'2026-04-10', type:'AP', party:'Al-Hamza Meats', category:'Butcher', amount:18500, status:'Paid', notes:'' },
  { id:2, date:'2026-04-11', type:'AP', party:'Karimi Vegetables', category:'Vegetables', amount:7200, status:'Unpaid', notes:'' },
  { id:3, date:'2026-04-12', type:'AR', party:'Dine-In Sales', category:'Operating Expenses', amount:45000, status:'Paid', notes:'' },
  { id:4, date:'2026-04-13', type:'EX', party:'KESC', category:'Utilities', amount:9800, status:'Paid', notes:'' },
  { id:5, date:'2026-04-14', type:'AP', party:'Rice Bazaar Co.', category:'Rice Merchant', amount:12000, status:'Unpaid', notes:'' },
  { id:6, date:'2026-04-15', type:'AR', party:'Catering Order - Malik', category:'Operating Expenses', amount:32000, status:'Unpaid', notes:'' },
  { id:7, date:'2026-04-16', type:'EX', party:'Staff Wages', category:'Payroll', amount:55000, status:'Paid', notes:'' },
  { id:8, date:'2026-04-17', type:'AP', party:'Cooking Oil Depot', category:'Oil', amount:6500, status:'Paid', notes:'' },
];

function fmt(n) { return 'PKR ' + Number(n).toLocaleString('en-PK'); }
function today() { return new Date().toISOString().split('T')[0]; }
function typeLabel(t) { return t==='AP'?'Payable':t==='AR'?'Receivable':'Expense'; }
function typeClass(t) { return t==='AP'?'ap':t==='AR'?'ar':'ex'; }

function downloadCSV(data, filename) {
  const headers = ['ID','Date','Type','Party / Supplier / Customer','Category','Amount (PKR)','Status','Notes'];
  const rows = data.map(t => [
    t.id, t.date, typeLabel(t.type), t.party, t.category, t.amount, t.status, t.notes||''
  ]);
  const csvContent = [headers, ...rows]
    .map(row => row.map(cell => `"${String(cell).replace(/"/g,'""')}"`).join(','))
    .join('\n');
  const blob = new Blob(['\uFEFF'+csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function downloadReportCSV(metrics, supplierTotals, customerTotals, categoryTotals) {
  const lines = [
    ['HASHMI RESTAURANT - FINANCIAL REPORT'],
    ['Generated On:', new Date().toLocaleDateString('en-PK',{day:'numeric',month:'long',year:'numeric'})],
    [''],
    ['=== SUMMARY ==='],
    ['Metric','Amount (PKR)'],
    ['Total Payables (AP)', metrics.ap],
    ['Total Receivables (AR)', metrics.ar],
    ['Total Expenses', metrics.ex],
    ['Total Paid', metrics.paid],
    ['Total Unpaid', metrics.unpaid],
    ['Net Position (AR minus AP minus Expenses)', metrics.ar - metrics.ap - metrics.ex],
    [''],
    ['=== PAYABLES BY SUPPLIER ==='],
    ['Supplier','Amount (PKR)'],
    ...supplierTotals.map(([k,v]) => [k, v]),
    ['TOTAL', supplierTotals.reduce((s,[,v])=>s+v,0)],
    [''],
    ['=== RECEIVABLES BY CUSTOMER ==='],
    ['Customer','Amount (PKR)'],
    ...customerTotals.map(([k,v]) => [k, v]),
    ['TOTAL', customerTotals.reduce((s,[,v])=>s+v,0)],
    [''],
    ['=== EXPENSES BY CATEGORY ==='],
    ['Category','Amount (PKR)'],
    ...categoryTotals.map(([k,v]) => [k, v]),
    ['TOTAL', categoryTotals.reduce((s,[,v])=>s+v,0)],
  ];
  const csvContent = lines.map(row => row.map(c => `"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
  const blob = new Blob(['\uFEFF'+csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `Hashmi_Report_${today()}.csv`; a.click();
  URL.revokeObjectURL(url);
}

export default function App() {
  const [page, setPage] = useState('dashboard');
  const [transactions, setTransactions] = useState(() => {
    try {
      const saved = localStorage.getItem('hashmi_txns_v2');
      if (saved) return JSON.parse(saved);
    } catch(e) {}
    return SEED_DATA;
  });
  const [form, setForm] = useState({ date:today(), type:'AP', party:'', category:'Beverages', amount:'', status:'Paid', notes:'' });
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [toast, setToast] = useState({ msg:'', ok:true });
  const [toastVisible, setToastVisible] = useState(false);

  useEffect(() => { localStorage.setItem('hashmi_txns_v2', JSON.stringify(transactions)); }, [transactions]);

  function showToast(msg, ok=true) {
    setToast({ msg, ok }); setToastVisible(true);
    setTimeout(() => setToastVisible(false), 2800);
  }

  function addTransaction() {
    if (!form.date || !form.party.trim() || !form.amount || parseFloat(form.amount) <= 0) {
      showToast('Please fill all required fields.', false); return;
    }
    setTransactions(prev => [{ ...form, id:Date.now(), amount:parseFloat(form.amount) }, ...prev]);
    setForm({ date:today(), type:'AP', party:'', category:'Beverages', amount:'', status:'Paid', notes:'' });
    showToast('Transaction recorded!');
  }

  function deleteTransaction(id) {
    if (window.confirm('Delete this transaction?')) {
      setTransactions(prev => prev.filter(t => t.id !== id));
      showToast('Deleted.');
    }
  }

  const metrics = useMemo(() => {
    let ap=0,ar=0,ex=0,unpaid=0,paid=0,apC=0,arC=0,exC=0,unpaidC=0,paidC=0;
    transactions.forEach(t => {
      if(t.type==='AP'){ap+=t.amount;apC++;}
      if(t.type==='AR'){ar+=t.amount;arC++;}
      if(t.type==='EX'){ex+=t.amount;exC++;}
      if(t.status==='Unpaid'){unpaid+=t.amount;unpaidC++;}
      if(t.status==='Paid'){paid+=t.amount;paidC++;}
    });
    return {ap,ar,ex,unpaid,paid,apC,arC,exC,unpaidC,paidC};
  }, [transactions]);

  const filteredTx = useMemo(() => transactions.filter(t => {
    if (filterType && t.type!==filterType) return false;
    if (filterStatus && t.status!==filterStatus) return false;
    if (filterDate && t.date!==filterDate) return false;
    return true;
  }), [transactions,filterType,filterStatus,filterDate]);

  const supplierTotals = useMemo(() => {
    const map={};
    transactions.filter(t=>t.type==='AP').forEach(t=>{map[t.party]=(map[t.party]||0)+t.amount;});
    return Object.entries(map).sort((a,b)=>b[1]-a[1]);
  },[transactions]);

  const customerTotals = useMemo(() => {
    const map={};
    transactions.filter(t=>t.type==='AR').forEach(t=>{map[t.party]=(map[t.party]||0)+t.amount;});
    return Object.entries(map).sort((a,b)=>b[1]-a[1]);
  },[transactions]);

  const categoryTotals = useMemo(() => {
    const map={};
    transactions.forEach(t=>{map[t.category]=(map[t.category]||0)+t.amount;});
    return Object.entries(map).sort((a,b)=>b[1]-a[1]);
  },[transactions]);

  return (
    <div className="app">

      {/* TOP HEADER */}
      <header className="header">
        <div className="header-top">
          <div className="logo-wrap">
            <div className="logo-emblem">
              <svg width="42" height="42" viewBox="0 0 42 42" fill="none">
                <circle cx="21" cy="21" r="21" fill="#C8102E"/>
                <text x="21" y="27" textAnchor="middle" fontSize="20" fill="#F5C518">🍽</text>
              </svg>
            </div>
            <div className="logo-text">
              <span className="logo-name">HASHMI</span>
              <span className="logo-tagline">RESTAURANT</span>
            </div>
          </div>
        </div>
        <nav className="header-nav">
          {[
            {id:'dashboard',label:'Dashboard'},
            {id:'add',label:'Add Transaction'},
            {id:'history',label:'Transaction History'},
            {id:'reports',label:'Reports'},
          ].map(link => (
            <button key={link.id} className={`nav-link ${page===link.id?'active':''}`} onClick={()=>setPage(link.id)}>
              {link.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="main-content">

        {/* DASHBOARD */}
        {page==='dashboard' && (
          <div className="page-wrap">
            <div className="page-heading">
              <h1 className="page-title">Dashboard</h1>
              <span className="page-date">{new Date().toLocaleDateString('en-PK',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}</span>
            </div>
            <div className="metrics-grid">
              <MetricCard label="Total Payables (AP)" value={fmt(metrics.ap)} sub={`${metrics.apC} supplier bills`} color="red" icon="↑"/>
              <MetricCard label="Total Receivables (AR)" value={fmt(metrics.ar)} sub={`${metrics.arC} customer payments`} color="green" icon="↓"/>
              <MetricCard label="Total Expenses" value={fmt(metrics.ex)} sub={`${metrics.exC} expense entries`} color="blue" icon="≡"/>
              <MetricCard label="Net Position" value={fmt(metrics.ar-metrics.ap-metrics.ex)} sub="AR minus AP & Expenses" color={metrics.ar-metrics.ap-metrics.ex>=0?'green':'red'} icon="◎"/>
            </div>
            <div className="dash-row">
              <div className="info-card">
                <div className="info-card-title">Payment Status</div>
                <div className="status-bars">
                  {[
                    {label:'Paid', count:metrics.paidC, amount:metrics.paid, color:'var(--green)'},
                    {label:'Unpaid', count:metrics.unpaidC, amount:metrics.unpaid, color:'var(--yellow)'},
                  ].map(s => (
                    <div className="status-item" key={s.label}>
                      <div className="status-top">
                        <span><span className="dot" style={{background:s.color}}></span>{s.label}</span>
                        <span style={{color:s.color, fontWeight:500}}>{fmt(s.amount)}</span>
                      </div>
                      <div className="bar-track">
                        <div className="bar-fill" style={{width:transactions.length?`${(s.count/transactions.length)*100}%`:'0%',background:s.color}}></div>
                      </div>
                      <div className="status-count">{s.count} transactions</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="info-card">
                <div className="info-card-title">Top Spending Categories</div>
                {categoryTotals.slice(0,5).map(([cat,amt],i) => (
                  <div className="cat-row" key={cat}>
                    <span className="cat-rank">{i+1}</span>
                    <span className="cat-name">{cat}</span>
                    <div className="cat-track"><div className="cat-fill" style={{width:`${(amt/(categoryTotals[0][1]||1))*100}%`}}></div></div>
                    <span className="cat-amt">{fmt(amt)}</span>
                  </div>
                ))}
                {categoryTotals.length===0 && <div className="empty-msg">No data yet</div>}
              </div>
            </div>
            <div className="section-card">
              <div className="section-header">
                <span className="section-title">Recent Transactions</span>
                <button className="link-btn" onClick={()=>setPage('history')}>View All History →</button>
              </div>
              <TxTable data={transactions.slice(0,5)} onDelete={deleteTransaction} showDelete={false}/>
            </div>
          </div>
        )}

        {/* ADD TRANSACTION */}
        {page==='add' && (
          <div className="page-wrap">
            <div className="page-heading">
              <h1 className="page-title">Add Transaction</h1>
            </div>
            <div className="add-layout">
              <div className="form-card">
                <div className="form-card-title">New Transaction Entry</div>
                <div className="form-grid">
                  <div className="field">
                    <label>Date <span className="req">*</span></label>
                    <input type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})}/>
                  </div>
                  <div className="field">
                    <label>Transaction Type <span className="req">*</span></label>
                    <select value={form.type} onChange={e=>setForm({...form,type:e.target.value})}>
                      <option value="AP">Accounts Payable (We owe supplier)</option>
                      <option value="AR">Accounts Receivable (Customer owes us)</option>
                      <option value="EX">Expense (Direct cost paid)</option>
                    </select>
                  </div>
                  <div className="field full">
                    <label>Party Name — Supplier or Customer <span className="req">*</span></label>
                    <input type="text" placeholder="e.g. Al-Hamza Meats or Dine-In Sales" value={form.party} onChange={e=>setForm({...form,party:e.target.value})}/>
                  </div>
                  <div className="field">
                    <label>Category <span className="req">*</span></label>
                    <select value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>
                      {CATEGORIES.map(c=><option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="field">
                    <label>Amount (PKR) <span className="req">*</span></label>
                    <input type="number" placeholder="0" min="0" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})}/>
                  </div>
                  <div className="field">
                    <label>Payment Status <span className="req">*</span></label>
                    <select value={form.status} onChange={e=>setForm({...form,status:e.target.value})}>
                      <option value="Paid">Paid</option>
                      <option value="Unpaid">Unpaid / Pending</option>
                    </select>
                  </div>
                  <div className="field full">
                    <label>Notes (optional)</label>
                    <input type="text" placeholder="Invoice number, remarks, etc." value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})}/>
                  </div>
                </div>
                <button className="primary-btn" onClick={addTransaction}>+ Record Transaction</button>
              </div>
              <div className="section-card" style={{flex:1}}>
                <div className="section-header">
                  <span className="section-title">Recent Entries</span>
                  <button className="link-btn" onClick={()=>setPage('history')}>View All →</button>
                </div>
                <TxTable data={transactions.slice(0,6)} onDelete={deleteTransaction} showDelete={false}/>
              </div>
            </div>
          </div>
        )}

        {/* TRANSACTION HISTORY */}
        {page==='history' && (
          <div className="page-wrap">
            <div className="page-heading">
              <h1 className="page-title">Transaction History</h1>
              <button className="download-btn" onClick={()=>downloadCSV(filteredTx,`Hashmi_Transactions_${today()}.csv`)}>
                ⬇ Download as Excel
              </button>
            </div>
            <div className="filter-bar">
              <div className="filter-item">
                <label>Type</label>
                <select value={filterType} onChange={e=>setFilterType(e.target.value)}>
                  <option value="">All Types</option>
                  <option value="AP">Payable</option>
                  <option value="AR">Receivable</option>
                  <option value="EX">Expense</option>
                </select>
              </div>
              <div className="filter-item">
                <label>Status</label>
                <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}>
                  <option value="">All Statuses</option>
                  <option value="Paid">Paid</option>
                  <option value="Unpaid">Unpaid</option>
                </select>
              </div>
              <div className="filter-item">
                <label>Date</label>
                <input type="date" value={filterDate} onChange={e=>setFilterDate(e.target.value)}/>
              </div>
              <button className="clear-btn" onClick={()=>{setFilterType('');setFilterStatus('');setFilterDate('');}}>✕ Clear</button>
            </div>
            <div className="result-info">{filteredTx.length} of {transactions.length} transactions</div>
            <TxTable data={filteredTx} onDelete={deleteTransaction} showDelete={true}/>
          </div>
        )}

        {/* REPORTS */}
        {page==='reports' && (
          <div className="page-wrap">
            <div className="page-heading">
              <h1 className="page-title">Financial Reports</h1>
              <button className="download-btn" onClick={()=>downloadReportCSV(metrics,supplierTotals,customerTotals,categoryTotals)}>
                ⬇ Download Full Report
              </button>
            </div>
            <div className="metrics-grid" style={{marginBottom:'24px'}}>
              <ReportStat label="Total Payables" value={fmt(metrics.ap)} color="red"/>
              <ReportStat label="Total Receivables" value={fmt(metrics.ar)} color="green"/>
              <ReportStat label="Total Expenses" value={fmt(metrics.ex)} color="blue"/>
              <ReportStat label="Net Position" value={fmt(metrics.ar-metrics.ap-metrics.ex)} color={metrics.ar-metrics.ap-metrics.ex>=0?'green':'red'}/>
            </div>
            <div className="reports-grid">
              <ReportTable title="Payables by Supplier" rows={supplierTotals} color="red" empty="No payables recorded"/>
              <ReportTable title="Receivables by Customer" rows={customerTotals} color="green" empty="No receivables recorded"/>
              <ReportTable title="Expenses by Category" rows={categoryTotals} color="blue" empty="No expenses recorded"/>
              <div className="report-card">
                <div className="report-card-title">Payment Summary</div>
                {[
                  {label:'Paid Transactions', val:metrics.paidC, color:'green'},
                  {label:'Unpaid Transactions', val:metrics.unpaidC, color:'yellow'},
                  {label:'Total Paid Amount', val:fmt(metrics.paid), color:'green'},
                  {label:'Total Unpaid Amount', val:fmt(metrics.unpaid), color:'yellow'},
                  {label:'Total Transactions', val:transactions.length, color:''},
                ].map(r => (
                  <div className="rep-row" key={r.label}>
                    <span>{r.label}</span>
                    <strong className={r.color}>{r.val}</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </main>

      <footer className="footer">
        <span>Hashmi Restaurant Management System</span>
        <span>© {new Date().getFullYear()} All rights reserved</span>
      </footer>

      {toastVisible && <div className={`toast ${toast.ok?'tok':'terr'}`}>{toast.msg}</div>}
    </div>
  );
}

function MetricCard({label,value,sub,color,icon}) {
  return (
    <div className={`metric-card mc-${color}`}>
      <div className="mc-icon">{icon}</div>
      <div className="mc-label">{label}</div>
      <div className={`mc-value ${color}`}>{value}</div>
      <div className="mc-sub">{sub}</div>
    </div>
  );
}

function ReportStat({label,value,color}) {
  return (
    <div className="report-stat">
      <div className="rs-label">{label}</div>
      <div className={`rs-value ${color}`}>{value}</div>
    </div>
  );
}

function ReportTable({title,rows,color,empty}) {
  return (
    <div className="report-card">
      <div className="report-card-title">{title}</div>
      {rows.length===0 && <div className="empty-msg">{empty}</div>}
      {rows.map(([k,v]) => (
        <div className="rep-row" key={k}>
          <span>{k}</span><strong className={color}>PKR {Number(v).toLocaleString('en-PK')}</strong>
        </div>
      ))}
      {rows.length>0 && (
        <div className="rep-row rep-total">
          <span>Total</span><strong className={color}>PKR {Number(rows.reduce((s,[,v])=>s+v,0)).toLocaleString('en-PK')}</strong>
        </div>
      )}
    </div>
  );
}

function TxTable({data,onDelete,showDelete}) {
  if (!data.length) return <div className="empty-msg" style={{padding:'24px'}}>No transactions found.</div>;
  return (
    <div className="tx-scroll">
      <table className="tx-table">
        <thead>
          <tr>
            <th>Date</th><th>Party</th><th>Category</th><th>Type</th><th>Status</th><th>Amount</th>
            {showDelete && <th></th>}
          </tr>
        </thead>
        <tbody>
          {data.map(t => (
            <tr key={t.id}>
              <td className="td-date">{t.date}</td>
              <td><div className="td-party">{t.party}</div>{t.notes&&<div className="td-note">{t.notes}</div>}</td>
              <td>{t.category}</td>
              <td><span className={`badge b-${typeClass(t.type)}`}>{typeLabel(t.type)}</span></td>
              <td><span className={`badge b-${t.status.toLowerCase()}`}>{t.status}</span></td>
              <td className={`td-amt ${typeClass(t.type)}`}>{fmt(t.amount)}</td>
              {showDelete && <td><button className="del-btn" onClick={()=>onDelete(t.id)}>✕</button></td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
