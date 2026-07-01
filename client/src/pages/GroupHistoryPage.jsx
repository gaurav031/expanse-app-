import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Calendar, Download, Search, Users, Receipt, ChevronDown, ChevronUp } from 'lucide-react';

export default function GroupHistoryPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [group, setGroup] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [settlements, setSettlements] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Grouped Data
  const [history, setHistory] = useState([]);
  const [expandedMonth, setExpandedMonth] = useState(null);
  
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const [groupRes, expRes, setRes] = await Promise.all([
          axios.get(`/groups/${id}`),
          axios.get(`/groups/${id}/expenses`),
          axios.get(`/groups/${id}/settlements`)
        ]);
        
        setGroup(groupRes.data.group);
        setExpenses(expRes.data);
        setSettlements(setRes.data);
        
        // Group by Month-Year
        const grouped = {};
        expRes.data.forEach(exp => {
          const date = new Date(exp.date);
          const monthYear = date.toLocaleString('default', { month: 'long', year: 'numeric' });
          const sortKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          
          if (!grouped[sortKey]) {
            grouped[sortKey] = {
              label: monthYear,
              expenses: [],
              total: 0,
              members: new Set(),
            };
          }
          grouped[sortKey].expenses.push(exp);
          grouped[sortKey].total += exp.amount;
          grouped[sortKey].members.add(exp.paidById._id);
        });
        
        // Convert to array and sort descending
        const historyArray = Object.keys(grouped).sort().reverse().map(key => ({
          key,
          label: grouped[key].label,
          expenses: grouped[key].expenses,
          total: grouped[key].total,
          memberCount: grouped[key].members.size
        }));
        
        setHistory(historyArray);
        if (historyArray.length > 0) setExpandedMonth(historyArray[0].key);
        
      } catch (error) {
        if (error.response?.status === 401) navigate('/');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchHistory();
  }, [id, navigate]);

  const handleExportCSV = (monthData) => {
    let csv = "Date,Description,Paid By,Amount (INR)\n";
    monthData.expenses.forEach(exp => {
      csv += `${new Date(exp.date).toLocaleDateString()},"${exp.description}",${exp.paidById.email},${(exp.amount / 100).toFixed(2)}\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Group_${group.name}_Expenses_${monthData.label}.csv`;
    a.click();
  };

  const filteredHistory = history.map(h => ({
    ...h,
    expenses: h.expenses.filter(e => 
      e.description.toLowerCase().includes(searchQuery.toLowerCase()) || 
      e.paidById.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.paidById.email.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(h => h.expenses.length > 0);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500">Loading History...</div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <header className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
        <div className="px-5 py-4 flex items-center gap-4">
          <Link to={`/groups/${id}`} className="text-gray-500 hover:text-gray-900 bg-gray-100 p-2 rounded-full transition"><ArrowLeft size={20}/></Link>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-gray-900 leading-tight">Expense History</h1>
            <p className="text-xs text-gray-500 font-medium">{group.name}</p>
          </div>
        </div>
      </header>

      <main className="px-5 mt-6 space-y-6">
        {/* Search */}
        <div className="relative">
          <Search size={18} className="absolute left-3 top-3 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search by description or person..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-600 outline-none shadow-sm transition"
          />
        </div>

        {/* Global Summary */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <Receipt size={16} />
              <span className="text-xs font-bold uppercase tracking-wider">Total Lifetime</span>
            </div>
            <p className="text-xl font-bold text-gray-900">₹{(expenses.reduce((sum, e) => sum + e.amount, 0) / 100).toFixed(2)}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <Calendar size={16} />
              <span className="text-xs font-bold uppercase tracking-wider">Months Active</span>
            </div>
            <p className="text-xl font-bold text-gray-900">{history.length}</p>
          </div>
        </div>

        {/* Monthly Breakdown */}
        <div className="space-y-4">
          {filteredHistory.map(month => (
            <div key={month.key} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2">
              <div 
                onClick={() => setExpandedMonth(expandedMonth === month.key ? null : month.key)}
                className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition"
              >
                <div>
                  <h3 className="text-sm font-bold text-gray-900">{month.label}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{month.expenses.length} transactions • ₹{(month.total / 100).toFixed(2)}</p>
                </div>
                {expandedMonth === month.key ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
              </div>
              
              {expandedMonth === month.key && (
                <div className="border-t border-gray-100 bg-gray-50/50 p-4">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Expense Details</span>
                    <button 
                      onClick={() => handleExportCSV(month)}
                      className="flex items-center gap-1.5 bg-white border border-gray-200 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50 shadow-sm transition"
                    >
                      <Download size={14} /> Export CSV
                    </button>
                  </div>
                  
                  <div className="space-y-2">
                    {month.expenses.map(exp => (
                      <div key={exp._id} className="bg-white p-3 rounded-lg border border-gray-200 flex justify-between items-center shadow-sm">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{exp.description}</p>
                          <p className="text-[10px] text-gray-500 mt-0.5">Paid by {exp.paidById.name || exp.paidById.email.split('@')[0]} on {new Date(exp.date).toLocaleDateString()}</p>
                        </div>
                        <div className="text-sm font-bold text-gray-900">
                          ₹{(exp.amount / 100).toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
          
          {filteredHistory.length === 0 && (
            <div className="text-center py-10 bg-white rounded-xl border border-gray-200 border-dashed">
              <Calendar size={32} className="mx-auto text-gray-300 mb-2" />
              <p className="text-sm font-medium text-gray-500">No history found for your search.</p>
            </div>
          )}
        </div>

      </main>
    </div>
  );
}
