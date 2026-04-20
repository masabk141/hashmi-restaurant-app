import React, { useState, useEffect } from 'react';
import './App.css';

const CATEGORIES = [
  'Beverages','Butcher','Rice Merchant','Vegetables','Utilities',
  'Equipment Repair','Payroll','Oil','Condiments','Operating Expenses'
];

const SEED_DATA = [
  { id:1, date:'2026-04-10', type:'AP', party:'Al-Hamza Meats', category:'Butcher', amount:18500, status:'Paid' },
  { id:2, date:'2026-04-11', type:'AP', party:'Karimi Vegetables', category:'Vegetables', amount:7200, status:'Unpaid' },
  { id:3, date:'2026-04-12', type:'AR', party:'Dine-In Sales', category:'Operating Expenses', amount:45000, status:'Paid' },
  { id:4, date:'2026-04-13', type:'EX', party:'KESC', category:'Utilities', amount:9800, status:'Paid' },
  { id:5, date:'2026-04-14', type:'AR', party:'Catering Order - Malik', category:'Operating Expenses', amount:32000, status:'Unpaid' },
  { id:6, date:'2026-04-16', type:'EX', party:'Staff Wages', category:'Payroll', amount:55000, status:'Paid' },
];

function fmt(n) {
  return 'PKR ' + Number(n).toLocaleString('en-PK');
}

function getTodayDate() {
  return new Date().toISOString().split('T')[0];
}

export default function App() {
  const [page, setPage] = useState('dashboard');
  const [transactions, setTransactions] = useState(() => {
    try {
      const saved = localStorage.getItem('hashmi_txns');
      if (saved) return JSON.parse(saved);
    } catch(e) {}
    return SEED_DATA;
  });

  const [form, setForm] = useState({
    date: getTodayDate(), type: 'AP', party: '', category: 'Beverages', amount: '', status: 'Paid'
  });
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [toast, setToast] = useState('');

  useEffect(() => {
    localStorage.setItem('hashmi_txns', JSON.stringify(transactions));
  }, [transactions]);

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  }

  function addTransaction() {
    if (!form.date || !form.party.trim() || !form.amount || parseFloat(form.amount) <= 0) {
      showToast('Please fill in all fields correctly.');
      return;
    }
    const newTx = { ...form, id: Date.now(), amount: parseFloat(form.amount) };
    setTransactions(prev => [newTx, ...prev]);
    setForm({ date: getTodayDate(), type: 'AP', party: '', category: 'Beverages', amount: '', status: 'Paid' });
    showToast('Transaction recorded successfully!');
  }

  const metrics = React.useMemo(() => {
    let ap=0, ar=0, ex=0, unpaid=0, paid=0, apC=0, arC=0, exC=0, unpaidC=0;
    for (const t of transactions) {
      if (t.type==='AP') { ap+=t.amount; apC++; }
      if (t.type==='AR') { ar+=t.amount; arC++; }
      if (t.type==='EX') { ex+=t.amount; exC++; }
      if (t.status==='Unpaid') { unpaid+=t.amount; unpaidC++; }
      if (t.status==='Paid') paid+=t.amount;
    }
    return { ap, ar, ex, unpaid, paid, apC, arC, exC, unpaidC };
  }, [transactions]);

  const filteredTx = transactions.filter(t => {
    if (filterType && t.type !== filterType) return false;
    if (filterStatus && t.status !== filterStatus) return false;
    return true;
  });

  const categoryTotals = React.useMemo(() => {
    const map = {};
    for (const t of transactions) {
      map[t.category] = (map[t.category] || 0) + t.amount;
    }
    return Object.entries(map).sort((a,b) => b[1]-a[1]).slice(0,5);
  }, [transactions]);

  const supplierTotals = React.useMemo(() => {
    const map = {};
    for (const t of transactions.filter(x=>x.type==='AP')) {
      map[t.party] = (map[t.party] || 0) + t.amount;
    }
    return Object.entries(map).sort((a,b) => b[1]-a[1]);
  }, [transactions]);

  const customerTotals = React.useMemo(() => {
    const map = {};
    for (const t of transactions.filter(x=>x.type==='AR')) {
      map[t.party] = (map[t.party] || 0) + t.amount;
    }
    return Object.entries(map).sort((a,b) => b[1]-a[1]);
  }, [transactions]);

  const typeLabel = t => t.type==='AP'?'Payable':t.type==='AR'?'Receivable':'Expense';
  const typeClass = t => t.type==='AP'?'ap':t.type==='AR'?'ar':'ex';

  return (
    <div className="app">
      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="logo-area">
          <div className="logo-icon">🍽</div>
          <div className="logo-name">Hashmi</div>
          <div className="logo-sub">RESTAURANT</div>
        </div>
        <nav className="nav">
          {['dashboard','transactions','reports'].map(p => (
            <div key={p} className={`nav-item ${page===p?'active':''}`} onClick={() => setPage(p)}>
              <span className="nav-icon">{p==='dashboard'?'◈':p==='transactions'?'◫':'◱'}</span>
              {p.charAt(0).toUpperCase()+p.slice(1)}
            </div>
          ))}
        </nav>
      </aside>

      {/* MAIN */}
      <div className="main">
        <div className="topbar">
          <div className="page-title">{page.charAt(0).toUpperCase()+page.slice(1)}</div>
          <div className="date-badge">{new Date().toLocaleDateString('en-PK',{weekday:'short',day:'numeric',month:'short',year:'numeric'})}</div>
        </div>

        <div className="content">

          {/* DASHBOARD */}
          {page === 'dashboard' && (
            <>
              <div className="metrics">
                <div className="metric-card payable">
                  <div className="metric-label">Total Payables (AP)</div>
                  <div className="metric-value">{fmt(metrics.ap)}</div>
                  <div className="metric-sub">{metrics.apC} transactions</div>
                </div>
                <div className="metric-card receivable">
                  <div className="metric-label">Total Receivables (AR)</div>
                  <div className="metric-value">{fmt(metrics.ar)}</div>
                  <div className="metric-sub">{metrics.arC} transactions</div>
                </div>
                <div className="metric-card expense">
                  <div className="metric-label">Total Expenses</div>
                  <div className="metric-value">{fmt(metrics.ex)}</div>
                  <div className="metric-sub">{metrics.exC} transactions</div>
                </div>
                <div className="metric-card unpaid">
                  <div className="metric-label">Outstanding Unpaid</div>
                  <div className="metric-value">{fmt(metrics.unpaid)}</div>
                  <div className="metric-sub">{metrics.unpaidC} items pending</div>
                </div>
              </div>

              <div className="bottom-grid">
                {/* Recent Transactions */}
                <div className="panel">
                  <div className="panel-header">
                    <div className="panel-title">Recent Transactions</div>
                    <button className="add-btn" onClick={() => setPage('transactions')}>View All</button>
                  </div>
                  <div className="tx-list">
                    <div className="tx-row tx-header">
                      <span>Date</span><span>Party / Category</span><span>Type</span><span>Status</span><span className="right">Amount</span>
                    </div>
                    {transactions.slice(0,6).map(t => (
                      <div className="tx-row" key={t.id}>
                        <span className="tx-date">{t.date.slice(5)}</span>
                        <span><div className="tx-party">{t.party}</div><div className="tx-cat">{t.category}</div></span>
                        <span><span className={`badge ${typeClass(t)}`}>{typeLabel(t)}</span></span>
                        <span><span className={`badge ${t.status.toLowerCase()}`}>{t.status}</span></span>
                        <span className={`tx-amount ${typeClass(t)} right`}>{fmt(t.amount)}</span>
                      </div>
                    ))}
                    {transactions.length === 0 && <div className="empty-state">No transactions yet.</div>}
                  </div>
                </div>

                {/* Add Transaction Form */}
                <div className="panel">
                  <div className="panel-header"><div className="panel-title">Add Transaction</div></div>
                  <div className="form-body">
                    <div className="form-row">
                      <div className="field">
                        <label>Date</label>
                        <input type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})}/>
                      </div>
                      <div className="field">
                        <label>Type</label>
                        <select value={form.type} onChange={e=>setForm({...form,type:e.target.value})}>
                          <option value="AP">Accounts Payable</option>
                          <option value="AR">Accounts Receivable</option>
                          <option value="EX">Expense</option>
                        </select>
                      </div>
                    </div>
                    <div className="field">
                      <label>Party (Supplier / Customer)</label>
                      <input type="text" placeholder="e.g. Al-Hamza Meats" value={form.party} onChange={e=>setForm({...form,party:e.target.value})}/>
                    </div>
                    <div className="field">
                      <label>Category</label>
                      <select value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>
                        {CATEGORIES.map(c=><option key={c}>{c}</option>)}
                      </select>
                    </div>
                    <div className="form-row">
                      <div className="field">
                        <label>Amount (PKR)</label>
                        <input type="number" placeholder="0" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})}/>
                      </div>
                      <div className="field">
                        <label>Status</label>
                        <select value={form.status} onChange={e=>setForm({...form,status:e.target.value})}>
                          <option>Paid</option>
                          <option>Unpaid</option>
                        </select>
                      </div>
                    </div>
                    <button className="submit-btn" onClick={addTransaction}>Record Transaction</button>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* TRANSACTIONS PAGE */}
          {page === 'transactions' && (
            <div className="panel">
              <div className="panel-header">
                <div className="panel-title">All Transactions</div>
                <div className="filter-row">
                  <select value={filterType} onChange={e=>setFilterType(e.target.value)}>
                    <option value="">All Types</option>
                    <option value="AP">Payable</option>
                    <option value="AR">Receivable</option>
                    <option value="EX">Expense</option>
                  </select>
                  <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}>
                    <option value="">All Statuses</option>
                    <option value="Paid">Paid</option>
                    <option value="Unpaid">Unpaid</option>
                  </select>
                </div>
              </div>
              <div className="tx-list" style={{maxHeight:'500px'}}>
                <div className="tx-row tx-header">
                  <span>Date</span><span>Party / Category</span><span>Type</span><span>Status</span><span className="right">Amount</span>
                </div>
                {filteredTx.map(t => (
                  <div className="tx-row" key={t.id}>
                    <span className="tx-date">{t.date.slice(5)}</span>
                    <span><div className="tx-party">{t.party}</div><div className="tx-cat">{t.category}</div></span>
                    <span><span className={`badge ${typeClass(t)}`}>{typeLabel(t)}</span></span>
                    <span><span className={`badge ${t.status.toLowerCase()}`}>{t.status}</span></span>
                    <span className={`tx-amount ${typeClass(t)} right`}>{fmt(t.amount)}</span>
                  </div>
                ))}
                {filteredTx.length === 0 && <div className="empty-state">No transactions found.</div>}
              </div>
            </div>
          )}

          {/* REPORTS PAGE */}
          {page === 'reports' && (
            <div className="report-grid">
              <div className="report-card">
                <div className="report-section-title">Payables by Supplier</div>
                {supplierTotals.length === 0 && <div className="empty-state">No data</div>}
                {supplierTotals.map(([k,v]) => (
                  <div className="report-row" key={k}>
                    <span>{k}</span><span className="report-total">{fmt(v)}</span>
                  </div>
                ))}
              </div>
              <div className="report-card">
                <div className="report-section-title">Receivables by Customer</div>
                {customerTotals.length === 0 && <div className="empty-state">No data</div>}
                {customerTotals.map(([k,v]) => (
                  <div className="report-row" key={k}>
                    <span>{k}</span><span className="report-total">{fmt(v)}</span>
                  </div>
                ))}
              </div>
              <div className="report-card">
                <div className="report-section-title">Expenses by Category</div>
                {categoryTotals.length === 0 && <div className="empty-state">No data</div>}
                {categoryTotals.map(([k,v]) => (
                  <div className="report-row" key={k}>
                    <span>{k}</span><span className="report-total">{fmt(v)}</span>
                  </div>
                ))}
              </div>
              <div className="report-card">
                <div className="report-section-title">Payment Summary</div>
                <div className="report-row">
                  <span style={{color:'var(--green)'}}>Total Paid</span>
                  <span className="report-total" style={{color:'var(--green)'}}>{fmt(metrics.paid)}</span>
                </div>
                <div className="report-row">
                  <span style={{color:'var(--gold)'}}>Total Unpaid</span>
                  <span className="report-total" style={{color:'var(--gold)'}}>{fmt(metrics.unpaid)}</span>
                </div>
                <div className="report-row">
                  <span>Total AR</span>
                  <span className="report-total" style={{color:'var(--green)'}}>{fmt(metrics.ar)}</span>
                </div>
                <div className="report-row">
                  <span>Total AP + Expenses</span>
                  <span className="report-total" style={{color:'var(--red)'}}>{fmt(metrics.ap + metrics.ex)}</span>
                </div>
                <div className="report-row" style={{borderBottom:'none', marginTop:'8px'}}>
                  <span style={{fontWeight:500}}>Net Position</span>
                  <span className="report-total">{fmt(metrics.ar - metrics.ap - metrics.ex)}</span>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* TOAST */}
      {toast && <div className="toast show">{toast}</div>}
    </div>
  );
}
