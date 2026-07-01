import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Settings, Plus, Receipt } from 'lucide-react';

export default function CategoryDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Edit State
  const [showEdit, setShowEdit] = useState(false);
  const [editName, setEditName] = useState('');
  const [editLimit, setEditLimit] = useState('');

  // Transaction Add State
  const [showTxForm, setShowTxForm] = useState(false);
  const [txAmount, setTxAmount] = useState('');
  const [txNote, setTxNote] = useState('');

  const fetchData = async () => {
    try {
      const [statsRes, txRes] = await Promise.all([
        axios.get('/finance/dashboard/stats'),
        axios.get('/finance/transactions')
      ]);
      const categoryStat = statsRes.data.find(s => s.category._id === id);
      if (!categoryStat) return navigate('/dashboard');
      
      setStats(categoryStat);
      setEditName(categoryStat.category.name);
      setEditLimit(categoryStat.limit / 100);
      
      setTransactions(txRes.data.filter(t => (t.categoryId?._id || t.categoryId) === id));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`/finance/categories/${id}`, {
        name: editName,
        monthlyLimit: Number(editLimit)
      });
      setShowEdit(false);
      fetchData();
    } catch (error) {
      console.error(error);
    }
  };

  const handleAddTransaction = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/finance/transactions', {
        categoryId: id,
        amount: Number(txAmount),
        note: txNote
      });
      setShowTxForm(false);
      setTxAmount('');
      setTxNote('');
      fetchData();
    } catch (error) {
      console.error(error);
    }
  };

  if (loading || !stats) return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-blue-600 font-medium">Loading...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 pb-24">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="px-5 py-4 flex items-center gap-4">
          <Link to="/dashboard" className="text-gray-500 hover:text-gray-900 bg-gray-50 p-2 rounded-full transition"><ArrowLeft size={20}/></Link>
          <h1 className="text-xl font-bold text-gray-900 truncate flex-1">{stats.category.name}</h1>
          <button onClick={() => setShowEdit(!showEdit)} className="bg-gray-100 text-gray-600 p-2 rounded-full transition hover:bg-gray-200">
            <Settings size={20} />
          </button>
        </div>
      </header>

      <main className="px-5 mt-6 space-y-6">
        
        {/* EDIT FORM */}
        {showEdit && (
          <form onSubmit={handleEditSubmit} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-3 animate-in fade-in slide-in-from-top-2">
            <h3 className="font-semibold text-gray-900 text-sm mb-2">Edit Category</h3>
            <input 
              type="text" placeholder="Name" required 
              className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
              value={editName} onChange={(e) => setEditName(e.target.value)}
            />
            <div className="flex gap-2">
              <span className="bg-gray-50 border border-gray-100 rounded-xl px-4 flex items-center text-gray-500 font-medium">₹</span>
              <input 
                type="number" placeholder="Monthly Limit" required min="0" step="0.01"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
                value={editLimit} onChange={(e) => setEditLimit(e.target.value)}
              />
            </div>
            <button type="submit" className="w-full bg-gray-900 text-white py-3 rounded-xl font-medium text-sm hover:bg-gray-800 transition shadow-sm">Save Changes</button>
          </form>
        )}

        {/* PROGRESS BAR */}
        <div className="bg-white p-6 rounded-3xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-50 flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <span className="font-bold text-gray-800 text-lg">Monthly Budget</span>
            <span className="text-xs font-semibold text-gray-900 bg-gray-100 px-3 py-1.5 rounded-lg">
              ₹{(stats.spent / 100).toFixed(0)} / ₹{(stats.limit / 100).toFixed(0)}
            </span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden mt-2">
            <div 
              className={`h-3 rounded-full transition-all duration-500 ${stats.percentage >= 100 ? 'bg-red-500' : stats.percentage > 80 ? 'bg-orange-400' : 'bg-blue-500'}`} 
              style={{ width: `${Math.min(stats.percentage, 100)}%` }}
            ></div>
          </div>
          <p className={`text-[10px] text-right font-medium uppercase tracking-wide ${stats.percentage >= 100 ? 'text-red-500' : 'text-gray-400'}`}>
            {stats.percentage}% used
          </p>
        </div>

        {/* Add Expense Button */}
        <button 
          onClick={() => setShowTxForm(!showTxForm)} 
          className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold text-sm shadow-lg shadow-blue-200 hover:bg-blue-700 transition flex items-center justify-center gap-2"
        >
          <Receipt size={20} /> Add Expense Here
        </button>

        {/* Add Expense Form */}
        {showTxForm && (
          <form onSubmit={handleAddTransaction} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-3 animate-in fade-in slide-in-from-top-2">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-semibold text-gray-900 text-sm">New Expense</h3>
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
            <input 
              type="text" placeholder="Note (e.g. Lunch at McD)" 
              className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
              value={txNote} onChange={(e) => setTxNote(e.target.value)}
            />
            <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium text-sm hover:bg-blue-700 transition shadow-sm shadow-blue-200">Save Expense</button>
          </form>
        )}

        {/* Expenses List */}
        <div className="pt-4 space-y-3">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">History</h2>
          {transactions.length === 0 ? (
            <div className="bg-white p-6 rounded-2xl border border-gray-100 text-center">
              <p className="text-sm text-gray-400 font-medium">No expenses yet.</p>
            </div>
          ) : (
            transactions.map(tx => (
              <div key={tx._id} className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] border border-gray-50">
                <div>
                  <p className="font-bold text-gray-900 text-sm">{tx.note || 'Expense'}</p>
                  <p className="text-[10px] text-gray-400 font-medium mt-0.5">{new Date(tx.date).toLocaleDateString()}</p>
                </div>
                <span className="font-bold text-gray-900">₹{(tx.amount / 100).toFixed(2)}</span>
              </div>
            ))
          )}
        </div>

      </main>
    </div>
  );
}
