import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Users, Plus, ChevronRight, Search } from 'lucide-react';

export default function GroupsPage() {
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [search, setSearch] = useState('');

  const fetchGroups = async () => {
    try {
      const res = await axios.get('/groups');
      setGroups(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/groups', { name, description: desc });
      setShowAdd(false);
      setName('');
      setDesc('');
      fetchGroups();
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-blue-600 font-medium">Loading...</div>;

  const filteredGroups = groups.filter(g => g.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 pb-24">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="px-5 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">My Groups</h1>
          <button onClick={() => setShowAdd(!showAdd)} className="bg-blue-600 text-white p-2 rounded-full shadow-sm shadow-blue-200 hover:bg-blue-700 transition">
            <Plus size={20} />
          </button>
        </div>
      </header>

      <main className="px-5 mt-6 space-y-6">
        
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" placeholder="Search groups..." 
            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-100 shadow-sm rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
            value={search} onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {showAdd && (
          <form onSubmit={handleCreateGroup} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-3 animate-in fade-in slide-in-from-top-2">
            <h3 className="font-semibold text-gray-900 text-sm mb-2">New Group</h3>
            <input 
              type="text" placeholder="Group Name (e.g. Goa Trip)" required 
              className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
              value={name} onChange={(e) => setName(e.target.value)}
            />
            <input 
              type="text" placeholder="Description (optional)" 
              className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
              value={desc} onChange={(e) => setDesc(e.target.value)}
            />
            <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium text-sm hover:bg-blue-700 transition shadow-sm shadow-blue-200">Create Group</button>
          </form>
        )}

        <div className="space-y-4">
          {filteredGroups.length === 0 && <p className="text-gray-500 text-sm px-1">No groups found.</p>}
          {filteredGroups.map(g => (
            <Link to={`/groups/${g._id}`} key={g._id} className="bg-white p-5 rounded-3xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-50 flex flex-col gap-3 hover:shadow-md transition cursor-pointer block">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  {g.avatarUrl ? (
                    <img src={g.avatarUrl} alt="Group" className="w-12 h-12 object-cover rounded-2xl border border-gray-100 shadow-sm" />
                  ) : (
                    <div className="bg-gradient-to-br from-blue-100 to-indigo-100 p-3 rounded-2xl text-blue-600">
                      <Users size={24} />
                    </div>
                  )}
                  <div>
                    <span className="font-bold text-gray-900 block">{g.name}</span>
                    <span className="text-xs text-gray-500">{g.description || 'No description'}</span>
                  </div>
                </div>
                <ChevronRight size={20} className="text-gray-300" />
              </div>
              <div className="mt-1 pt-3 border-t border-gray-50 flex justify-between items-center">
                <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wide">Your Balance</span>
                <span className={`font-bold ${g.myBalance > 0 ? 'text-green-600' : g.myBalance < 0 ? 'text-red-600' : 'text-gray-500'}`}>
                  {g.myBalance > 0 ? 'Gets back' : g.myBalance < 0 ? 'Owes' : ''} ₹{(Math.abs(g.myBalance) / 100).toFixed(2)}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
