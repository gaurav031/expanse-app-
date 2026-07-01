import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, UserPlus, Receipt, User, CheckSquare, Square, Trash2, Settings, Check, MoreVertical, Calendar } from 'lucide-react';

const GROUP_AVATARS = [
  'https://images.unsplash.com/photo-1511895426328-dc8714191300?q=80&w=200&auto=format&fit=crop', // Party
  'https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=200&auto=format&fit=crop', // Team/Colleagues
  'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=200&auto=format&fit=crop', // Road trip
  'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=200&auto=format&fit=crop', // Office/Colleagues
  'https://images.unsplash.com/photo-1555244162-803834f70033?q=80&w=200&auto=format&fit=crop', // Dinner
  'https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=200&auto=format&fit=crop', // Vacation/Beach
  'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?q=80&w=200&auto=format&fit=crop', // Balloons/Event
  'https://images.unsplash.com/photo-1473625247510-8ceb1760943f?q=80&w=200&auto=format&fit=crop', // Concert/Festival
  'https://images.unsplash.com/photo-1521405617584-1d9867aecad3?q=80&w=200&auto=format&fit=crop', // Gift/Celebration
  'https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?q=80&w=200&auto=format&fit=crop'  // Friends sitting together
];

export default function GroupDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [group, setGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [settlements, setSettlements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUserRole, setCurrentUserRole] = useState('member');
  const [currentUserId, setCurrentUserId] = useState(null);

  // Edit Group State
  const [showEdit, setShowEdit] = useState(false);
  const [editName, setEditName] = useState('');
  const [editAvatar, setEditAvatar] = useState('');
  const [showMembers, setShowMembers] = useState(false);

  // Invite state
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');

  // Expense state
  const [showExpense, setShowExpense] = useState(false);
  const [amount, setAmount] = useState('');
  const [desc, setDesc] = useState('');
  const [selectedMembers, setSelectedMembers] = useState([]);

  // Settlement state
  const [showPay, setShowPay] = useState(null); // userId to pay
  const [payAmount, setPayAmount] = useState('');

  const fetchData = async () => {
    try {
      const [groupRes, expRes, setRes, userRes] = await Promise.all([
        axios.get(`/groups/${id}`),
        axios.get(`/groups/${id}/expenses`),
        axios.get(`/groups/${id}/settlements`),
        axios.get(`/auth/me`)
      ]);
      setGroup(groupRes.data.group);
      setMembers(groupRes.data.members);
      setExpenses(expRes.data);
      setSettlements(setRes.data);
      setCurrentUserRole(groupRes.data.currentUserRole);
      setCurrentUserId(userRes.data._id);

      setEditName(groupRes.data.group.name);
      setEditAvatar(groupRes.data.group.avatarUrl || GROUP_AVATARS[0]);

      // Select all by default
      if (selectedMembers.length === 0) {
        setSelectedMembers(groupRes.data.members.map(m => m.userId._id));
      }
    } catch (error) {
      if (error.response?.status === 401) navigate('/');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleEditGroup = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`/groups/${id}`, { name: editName, avatarUrl: editAvatar });
      setShowEdit(false);
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Error updating group');
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`/groups/${id}/invite`, { email: inviteEmail });
      setShowInvite(false);
      setInviteEmail('');
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Error inviting user');
    }
  };

  const handleDeleteGroup = async () => {
    if (!window.confirm("Are you sure you want to delete this entire group and all its expenses?")) return;
    try {
      await axios.delete(`/groups/${id}`);
      navigate('/groups');
    } catch (error) {
      alert(error.response?.data?.message || 'Error deleting group');
    }
  };

  const [activeMemberMenu, setActiveMemberMenu] = useState(null);

  const handleUpdateRole = async (userId, role) => {
    try {
      await axios.put(`/groups/${id}/members/${userId}/role`, { role });
      setActiveMemberMenu(null);
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Error updating role');
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!window.confirm("Remove this member from the group?")) return;
    try {
      await axios.delete(`/groups/${id}/members/${userId}`);
      setActiveMemberMenu(null);
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Error removing member');
    }
  };

  const handleToggleMember = (userId) => {
    setSelectedMembers(prev => 
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (selectedMembers.length === 0) return alert('Select at least one person to split with!');

    try {
      // Split equally among SELECTED members
      const splitAmount = Number(amount) / selectedMembers.length;
      const splits = selectedMembers.map(userId => ({
        userId,
        amountOwed: splitAmount
      }));

      await axios.post(`/groups/${id}/expenses`, {
        amount: Number(amount),
        description: desc,
        splits
      });

      setShowExpense(false);
      setAmount('');
      setDesc('');
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Error adding expense');
    }
  };

  const handlePay = async (e, paidToId) => {
    e.preventDefault();
    try {
      await axios.post(`/groups/${id}/settlements`, { paidToId, amount: Number(payAmount) });
      setShowPay(null);
      setPayAmount('');
      fetchData();
      alert("Payment request sent! Waiting for them to accept.");
    } catch (error) {
      alert(error.response?.data?.message || 'Error sending payment');
    }
  };

  const handleSettlementStatus = async (settlementId, status) => {
    try {
      await axios.put(`/groups/${id}/settlements/${settlementId}`, { status });
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Error updating status');
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 pb-24">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="px-5 py-4 flex items-center gap-4">
          <Link to="/groups" className="text-gray-500 hover:text-gray-900 bg-gray-50 p-2 rounded-full transition"><ArrowLeft size={20}/></Link>
          {group.avatarUrl && <img src={group.avatarUrl} alt="Group" className="w-10 h-10 rounded-full border border-gray-200" />}
          <h1 className="text-xl font-bold text-gray-900 truncate flex-1">{group.name}</h1>
          <div className="flex gap-2">
            <Link to={`/groups/${id}/history`} className="p-2 rounded-full transition bg-gray-100 text-gray-600 hover:bg-gray-200">
              <Calendar size={20} />
            </Link>
            <button onClick={() => setShowMembers(!showMembers)} className={`p-2 rounded-full transition ${showMembers ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              <User size={20} />
            </button>
            {currentUserRole === 'admin' && (
              <>
                <button onClick={() => setShowEdit(!showEdit)} className={`p-2 rounded-full transition ${showEdit ? 'bg-gray-900 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                  <Settings size={20} />
                </button>
                <button onClick={() => setShowInvite(!showInvite)} className={`p-2 rounded-full transition ${showInvite ? 'bg-blue-600 text-white shadow-md' : 'bg-blue-100 text-blue-600 hover:bg-blue-200'}`}>
                  <UserPlus size={20} />
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="px-5 mt-6 space-y-6">
        
        {/* Your Balance Card */}
        {members.find(m => m.userId._id === currentUserId) && (
          <div className={`p-5 rounded-2xl border ${members.find(m => m.userId._id === currentUserId).runningBalance < 0 ? 'bg-red-50 border-red-100' : members.find(m => m.userId._id === currentUserId).runningBalance > 0 ? 'bg-green-50 border-green-100' : 'bg-gray-50 border-gray-100'}`}>
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Your Balance</h2>
            <div className="flex justify-between items-end">
              <span className={`text-2xl font-bold ${members.find(m => m.userId._id === currentUserId).runningBalance < 0 ? 'text-red-600' : members.find(m => m.userId._id === currentUserId).runningBalance > 0 ? 'text-green-600' : 'text-gray-900'}`}>
                {members.find(m => m.userId._id === currentUserId).runningBalance > 0 ? '+' : members.find(m => m.userId._id === currentUserId).runningBalance < 0 ? '-' : ''}₹{(Math.abs(members.find(m => m.userId._id === currentUserId).runningBalance) / 100).toFixed(2)}
              </span>
              {members.find(m => m.userId._id === currentUserId).runningBalance < 0 && (
                <button 
                  onClick={() => setShowMembers(true)} 
                  className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm shadow-red-200 hover:bg-red-700 transition"
                >
                  Pay Dues
                </button>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {members.find(m => m.userId._id === currentUserId).runningBalance < 0 ? 'You owe money to the group.' : members.find(m => m.userId._id === currentUserId).runningBalance > 0 ? 'The group owes you money.' : 'You are all settled up!'}
            </p>
          </div>
        )}

        {/* Edit Group Form */}
        {showEdit && currentUserRole === 'admin' && (
          <form onSubmit={handleEditGroup} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-5 animate-in fade-in slide-in-from-top-2">
            <h3 className="font-semibold text-gray-900 text-sm border-b border-gray-100 pb-2">Group Settings</h3>
            <div>
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Group Name</label>
              <input 
                type="text" placeholder="Group Name" required 
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition"
                value={editName} onChange={(e) => setEditName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Group Avatar</label>
              <div className="grid grid-cols-5 gap-3">
                {GROUP_AVATARS.map((url, i) => (
                  <div 
                    key={i} 
                    onClick={() => setEditAvatar(url)}
                    className={`relative cursor-pointer rounded-lg p-1 transition ${editAvatar === url ? 'bg-blue-600 shadow-md ring-2 ring-blue-600 ring-offset-2 scale-105' : 'bg-gray-50 hover:bg-gray-200'}`}
                  >
                    <img src={url} alt={`Avatar ${i}`} className="w-full h-10 object-cover rounded-md" />
                    {editAvatar === url && (
                      <div className="absolute -top-1 -right-1 bg-blue-600 rounded-full p-0.5 shadow-sm">
                        <Check size={10} className="text-white font-bold" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <button type="submit" className="w-full bg-gray-900 text-white px-5 py-3 rounded-lg font-medium text-sm hover:bg-gray-800 transition shadow-sm">Save Changes</button>
          </form>
        )}
        
        {/* Members List */}
        {showMembers && (
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 animate-in fade-in slide-in-from-top-2">
            <h3 className="font-semibold text-gray-900 text-sm border-b border-gray-100 pb-2 mb-4">Group Members</h3>
            <div className="space-y-3 pr-2">
              {members.map(m => (
                <div key={m._id} className="space-y-2">
                  <div className="flex justify-between items-center bg-white p-3 rounded-lg border border-gray-200 shadow-sm relative">
                    <div className="flex items-center gap-3">
                      {m.userId.avatarUrl ? (
                        <img src={m.userId.avatarUrl} alt="User Avatar" className="w-9 h-9 rounded-full border border-gray-200 object-cover" />
                      ) : (
                        <div className="bg-gray-100 p-2 rounded-full border border-gray-200"><User size={16} className="text-gray-500"/></div>
                      )}
                      <span className="text-sm font-semibold text-gray-900">{m.userId.name || m.userId.email.split('@')[0]}</span>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className={`text-xs font-bold ${m.runningBalance > 0 ? 'text-green-600' : m.runningBalance < 0 ? 'text-red-600' : 'text-gray-500'}`}>
                        {m.runningBalance > 0 ? 'Gets back' : m.runningBalance < 0 ? 'Owes' : 'Settled up'} ₹{(Math.abs(m.runningBalance) / 100).toFixed(2)}
                      </span>
                      
                      {currentUserRole === 'admin' && (
                        <div>
                          <button 
                            type="button" 
                            onClick={() => setActiveMemberMenu(activeMemberMenu === m.userId._id ? null : m.userId._id)}
                            className="text-gray-400 hover:text-gray-900 p-1 rounded-md hover:bg-gray-100 transition relative z-20"
                          >
                            <MoreVertical size={16} />
                          </button>
                          
                          {activeMemberMenu === m.userId._id && (
                            <>
                              <div className="fixed inset-0 z-30" onClick={() => setActiveMemberMenu(null)}></div>
                              <div className="absolute right-3 top-10 bg-white border border-gray-200 shadow-xl rounded-lg z-40 py-1 w-40 animate-in fade-in zoom-in-95">
                                {m.role !== 'admin' ? (
                                  <button type="button" onClick={() => handleUpdateRole(m.userId._id, 'admin')} className="w-full text-left px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100">Make Admin</button>
                                ) : (
                                  <button type="button" onClick={() => handleUpdateRole(m.userId._id, 'member')} className="w-full text-left px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100">Remove Admin</button>
                                )}
                                <div className="border-t border-gray-100 my-1"></div>
                                <button type="button" onClick={() => handleRemoveMember(m.userId._id)} className="w-full text-left px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50">Remove User</button>
                              </div>
                            </>
                          )}
                        </div>
                      )}
                      {m.role === 'admin' && currentUserRole !== 'admin' && <span className="text-[9px] uppercase font-bold text-gray-500 mt-1 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">Admin</span>}
                      {m.role === 'admin' && currentUserRole === 'admin' && activeMemberMenu !== m.userId._id && <span className="text-[9px] uppercase font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">Admin</span>}
                      {m.userId._id !== currentUserId && (
                        <button 
                          type="button" 
                          onClick={() => setShowPay(showPay === m.userId._id ? null : m.userId._id)}
                          className="mt-2 text-[10px] uppercase font-bold text-green-600 bg-green-50 px-2 py-1 rounded-md hover:bg-green-100"
                        >
                          Settle Up
                        </button>
                      )}
                    </div>
                  </div>
                  {showPay === m.userId._id && (
                    <form onSubmit={(e) => handlePay(e, m.userId._id)} className="bg-gray-50 p-3 rounded-lg border border-gray-200 mt-2 flex gap-2 animate-in fade-in slide-in-from-top-1">
                      <input 
                        type="number" placeholder="Amount (₹)" required min="1" step="0.01"
                        className="flex-1 px-3 py-2 border border-gray-200 rounded-md text-xs focus:ring-1 focus:ring-green-500 outline-none"
                        value={payAmount} onChange={(e) => setPayAmount(e.target.value)}
                      />
                      <button type="submit" className="bg-green-600 text-white px-3 py-2 rounded-md font-bold text-xs hover:bg-green-700">Send</button>
                    </form>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Pending Settlements */}
        {settlements.some(s => s.status === 'pending') && (
          <section className="bg-orange-50 p-5 rounded-xl border border-orange-100">
            <h2 className="text-xs font-bold text-orange-600 uppercase tracking-wider mb-3">Pending Settlements</h2>
            <div className="space-y-3">
              {settlements.filter(s => s.status === 'pending').map(s => (
                <div key={s._id} className="bg-white p-3 rounded-lg border border-orange-100 shadow-sm flex justify-between items-center">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{s.paidById.name || s.paidById.email.split('@')[0]} marked ₹{(s.amount / 100).toFixed(2)} as paid to {s.paidToId.name || s.paidToId.email.split('@')[0]}.</p>
                  </div>
                  {s.paidToId._id === currentUserId && (
                    <div className="flex gap-2">
                      <button onClick={() => handleSettlementStatus(s._id, 'accepted')} className="bg-green-100 text-green-700 px-3 py-1.5 rounded-md text-xs font-bold hover:bg-green-200">Accept</button>
                      <button onClick={() => handleSettlementStatus(s._id, 'rejected')} className="bg-red-100 text-red-700 px-3 py-1.5 rounded-md text-xs font-bold hover:bg-red-200">Reject</button>
                    </div>
                  )}
                  {s.paidById._id === currentUserId && (
                    <span className="text-xs font-bold text-orange-400 italic">Waiting...</span>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Invite Form */}
        {showInvite && currentUserRole === 'admin' && (
          <form onSubmit={handleInvite} className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 flex gap-2 animate-in fade-in slide-in-from-top-2">
            <input 
              type="email" placeholder="User Email Address" required 
              className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition"
              value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)}
            />
            <button type="submit" className="bg-blue-600 text-white px-5 py-2.5 rounded-lg font-medium text-sm hover:bg-blue-700 transition shadow-sm">Invite User</button>
          </form>
        )}



        {/* Add Expense Button */}
        <button 
          onClick={() => setShowExpense(!showExpense)} 
          className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold text-sm shadow-lg shadow-blue-200 hover:bg-blue-700 transition flex items-center justify-center gap-2"
        >
          <Receipt size={20} /> Add Group Expense
        </button>

        {/* Add Expense Form */}
        {showExpense && (
          <form onSubmit={handleAddExpense} className="bg-white p-5 rounded-2xl shadow-sm space-y-4 border border-gray-100 animate-in fade-in slide-in-from-top-2">
            <input 
              type="text" placeholder="What was this for? (e.g. Dinner)" required 
              className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
              value={desc} onChange={(e) => setDesc(e.target.value)}
            />
            <div className="flex gap-2">
              <span className="bg-gray-50 border border-gray-100 rounded-xl px-4 flex items-center text-gray-500 font-medium">₹</span>
              <input 
                type="number" placeholder="Total Amount" required min="0" step="0.01"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
                value={amount} onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            
            <div className="pt-2 border-t border-gray-100">
              <p className="text-xs font-medium text-gray-500 mb-2">Split among:</p>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {members.map(m => (
                  <div 
                    key={m._id} 
                    onClick={() => handleToggleMember(m.userId._id)}
                    className="flex items-center gap-2 cursor-pointer p-1 rounded hover:bg-gray-50 transition"
                  >
                    {selectedMembers.includes(m.userId._id) 
                      ? <CheckSquare size={18} className="text-blue-600" />
                      : <Square size={18} className="text-gray-400" />
                    }
                    <span className="text-sm text-gray-700">{m.userId.email}</span>
                  </div>
                ))}
              </div>
            </div>

            <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-md font-medium text-sm hover:bg-blue-700 transition">Save Expense</button>
          </form>
        )}

        {/* Expenses List (Current Month) */}
        <section>
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider">This Month's Expenses</h2>
            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded-md">{new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y divide-gray-100">
            {expenses.filter(e => {
              const expDate = new Date(e.date);
              const now = new Date();
              return expDate.getMonth() === now.getMonth() && expDate.getFullYear() === now.getFullYear();
            }).length === 0 && <p className="p-4 text-gray-500 text-sm">No expenses this month yet. You're all settled up!</p>}
            
            {expenses.filter(e => {
              const expDate = new Date(e.date);
              const now = new Date();
              return expDate.getMonth() === now.getMonth() && expDate.getFullYear() === now.getFullYear();
            }).map(exp => (
              <div key={exp._id} className="p-4 flex justify-between items-center hover:bg-gray-50 transition">
                <div>
                  <p className="font-medium text-gray-900">{exp.description}</p>
                  <p className="text-xs text-gray-500">Paid by {exp.paidById.email} on {new Date(exp.date).toLocaleDateString()}</p>
                </div>
                <div className="font-bold text-gray-900">
                  ₹{(exp.amount / 100).toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </section>

        {currentUserRole === 'admin' && (
          <div className="pt-8">
            <button 
              onClick={handleDeleteGroup} 
              className="w-full bg-red-50 text-red-600 py-3 rounded-xl font-medium border border-red-100 hover:bg-red-100 transition flex items-center justify-center gap-2"
            >
              <Trash2 size={18} /> Delete Group
            </button>
          </div>
        )}

      </main>
    </div>
  );
}
