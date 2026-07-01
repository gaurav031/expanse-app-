import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { LogOut, Plus, ChevronRight } from 'lucide-react';

export default function DashboardPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedCat, setExpandedCat] = useState(null);

  // Category Add State
  const [showCatForm, setShowCatForm] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatLimit, setNewCatLimit] = useState('');

  // Transaction Add State
  const [showTxForm, setShowTxForm] = useState(false);
  const [txAmount, setTxAmount] = useState('');
  const [txCategoryId, setTxCategoryId] = useState('');
  const [txNote, setTxNote] = useState('');

  const fetchStats = async () => {
    try {
      const [statsRes, txRes] = await Promise.all([
        axios.get('/finance/dashboard/stats'),
        axios.get('/finance/transactions')
      ]);
      setStats(statsRes.data);
      setTransactions(txRes.data);
    } catch (error) {
      if (error.response && error.response.status === 401) navigate('/');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleLogout = async () => {
    try {
      await axios.post('/auth/logout');
      navigate('/');
    } catch (error) {
      console.error(error);
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/finance/categories', {
        name: newCatName,
        monthlyLimit: Number(newCatLimit)
      });
      setShowCatForm(false);
      setNewCatName('');
      setNewCatLimit('');
      fetchStats();
    } catch (error) {
      console.error(error);
    }
  };

  const handleAddTransaction = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/finance/transactions', {
        categoryId: txCategoryId,
        amount: Number(txAmount),
        note: txNote
      });
      setShowTxForm(false);
      setTxAmount('');
      setTxNote('');
      fetchStats();
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-blue-600 font-medium">Loading...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 pb-24">
      {/* HEADER */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="px-5 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">Overview</h1>
            <p className="text-xs text-gray-500 font-medium">{new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
          </div>
          <button onClick={handleLogout} className="bg-gray-100 p-2 rounded-full text-gray-600 hover:bg-gray-200 transition">
            <LogOut size={16} />
          </button>
        </div>
      </header>

      <main className="px-5 mt-6 space-y-6">
        
        {/* TOTAL SUMMARY CARD */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-6 text-white shadow-lg shadow-blue-200">
          <p className="text-blue-100 text-sm font-medium mb-1 opacity-90">Total Monthly Spend</p>
          <h2 className="text-4xl font-bold tracking-tight">₹{(stats.reduce((acc, s) => acc + s.spent, 0) / 100).toFixed(2)}</h2>
          <div className="mt-6 flex gap-2">
            <button onClick={() => setShowCatForm(!showCatForm)} className="bg-white/20 hover:bg-white/30 backdrop-blur-md px-4 py-2 rounded-full text-sm font-medium transition flex items-center gap-1">
              <Plus size={16} /> Category
            </button>
            <button onClick={() => setShowTxForm(!showTxForm)} className="bg-white text-blue-700 hover:bg-gray-50 px-4 py-2 rounded-full text-sm font-semibold shadow-sm transition flex items-center gap-1">
              <Plus size={16} /> Expense
            </button>
          </div>
        </div>

        {/* FORMS */}
        {showCatForm && (
          <form onSubmit={handleAddCategory} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-3 animate-in fade-in slide-in-from-top-2">
            <h3 className="font-semibold text-gray-900 text-sm mb-2">New Category</h3>
            <input 
              type="text" placeholder="Name (e.g. Food)" required 
              className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
              value={newCatName} onChange={(e) => setNewCatName(e.target.value)}
            />
            <input 
              type="number" placeholder="Monthly Limit (₹)" required min="0" step="0.01"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
              value={newCatLimit} onChange={(e) => setNewCatLimit(e.target.value)}
            />
            <button type="submit" className="w-full bg-gray-900 text-white py-3 rounded-xl font-medium text-sm hover:bg-gray-800 transition shadow-sm">Save Category</button>
          </form>
        )}

        {showTxForm && (
          <form onSubmit={handleAddTransaction} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-3 animate-in fade-in slide-in-from-top-2">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-semibold text-gray-900 text-sm">Add Expense</h3>
              <button 
                type="button" 
                onClick={() => {
                  const txt = prompt("Paste your Bank/UPI SMS here:");
                  if (txt) {
                    const match = txt.match(/(?:Rs\.?|INR|₹)\s*([\d,]+\.?\d*)/i) || txt.match(/(?:debited|spent|paid).*(?:Rs\.?|INR|₹)\s*([\d,]+\.?\d*)/i);
                    if (match && match[1]) {
                      setTxAmount(match[1].replace(/,/g, ''));
                      setTxNote(txt.substring(0, 30) + '...');
                    } else {
                      alert("Could not detect amount from text. Please enter manually.");
                    }
                  }
                }}
                className="text-[11px] font-bold uppercase text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full hover:bg-blue-100 transition"
              >
                Smart Paste
              </button>
            </div>
            <div className="flex gap-2">
              <span className="bg-gray-50 border border-gray-100 rounded-xl px-4 flex items-center text-gray-500 font-medium">₹</span>
              <input 
                type="number" placeholder="Amount" required min="0" step="0.01"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
                value={txAmount} onChange={(e) => setTxAmount(e.target.value)}
              />
            </div>
            <select 
              required className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
              value={txCategoryId} onChange={(e) => setTxCategoryId(e.target.value)}
            >
              <option value="">Select Category</option>
              {stats.map(s => <option key={s.category._id} value={s.category._id}>{s.category.name}</option>)}
            </select>
            <input 
              type="text" placeholder="Note (e.g. Lunch at McD)" 
              className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
              value={txNote} onChange={(e) => setTxNote(e.target.value)}
            />
            <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium text-sm hover:bg-blue-700 transition shadow-sm shadow-blue-200">Save Expense</button>
          </form>
        )}

        {/* PROGRESS BARS */}
        <div>
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 px-1">Budgets</h2>
          <div className="space-y-4">
            {stats.length === 0 && <p className="text-gray-500 text-sm px-1">No categories set for this month.</p>}
            {stats.map(s => (
              <div 
                key={s.category._id} 
                onClick={() => navigate(`/category/${s.category._id}`)}
                className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-3 cursor-pointer hover:shadow-md transition active:scale-[0.98]"
              >
                <div className="flex justify-between items-center">
                  <span className="font-bold text-gray-800 text-lg">{s.category.name}</span>
                  <span className="text-xs font-semibold text-gray-900 bg-gray-100 px-3 py-1.5 rounded-lg">
                    ₹{(s.spent / 100).toFixed(0)} / ₹{(s.limit / 100).toFixed(0)}
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                  <div 
                    className={`h-2.5 rounded-full transition-all duration-500 ${s.percentage >= 100 ? 'bg-red-500' : s.percentage > 80 ? 'bg-orange-400' : 'bg-blue-500'}`} 
                    style={{ width: `${Math.min(s.percentage, 100)}%` }}
                  ></div>
                </div>
                <p className={`text-[10px] text-right font-medium uppercase tracking-wide ${s.percentage >= 100 ? 'text-red-500' : 'text-gray-400'}`}>{s.percentage}% used</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
