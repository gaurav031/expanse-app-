import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Check, LogOut, User as UserIcon } from 'lucide-react';

const AVATARS = [
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Felix',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Aneka',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Jack',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Nala',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Lily',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Oliver',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Leo',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Chloe',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Max',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Lucy'
];

export default function ProfilePage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.get('/auth/me');
        setUser(res.data);
        setName(res.data.name || '');
        setAvatar(res.data.avatarUrl || AVATARS[0]);
      } catch (error) {
        if (error.response?.status === 401) navigate('/');
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [navigate]);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await axios.put('/auth/profile', {
        name,
        avatarUrl: avatar
      });
      alert('Profile updated successfully!');
    } catch (error) {
      console.error(error);
      alert('Error updating profile');
    }
  };

  const handleLogout = async () => {
    try {
      await axios.post('/auth/logout');
      navigate('/');
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-blue-600 font-medium">Loading...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 pb-24">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="px-5 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">My Profile</h1>
          <button onClick={handleLogout} className="bg-red-50 text-red-600 p-2 rounded-full transition hover:bg-red-100">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      <main className="px-5 mt-8 space-y-8">
        
        {/* Profile Card */}
        <div className="flex flex-col items-center bg-white p-6 rounded-3xl shadow-sm border border-gray-50">
          <div className="relative mb-4">
            {avatar ? (
              <img src={avatar} alt="Avatar" className="w-24 h-24 rounded-full bg-blue-50 border-4 border-white shadow-md" />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center border-4 border-white shadow-md">
                <UserIcon size={32} className="text-gray-400" />
              </div>
            )}
          </div>
          <h2 className="text-xl font-bold text-gray-900">{name || 'Your Name'}</h2>
          <p className="text-sm text-gray-500">{user?.email}</p>
        </div>

        {/* Edit Form */}
        <form onSubmit={handleSave} className="bg-white p-5 rounded-3xl shadow-sm border border-gray-50 space-y-6">
          
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Display Name</label>
            <input 
              type="text" placeholder="e.g. John Doe" required 
              className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
              value={name} onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Choose an Avatar</label>
            <div className="grid grid-cols-5 gap-3">
              {AVATARS.map((url, i) => (
                <div 
                  key={i} 
                  onClick={() => setAvatar(url)}
                  className={`relative cursor-pointer rounded-full p-1 transition ${avatar === url ? 'bg-blue-600 shadow-md scale-110' : 'bg-gray-50 hover:bg-gray-100'}`}
                >
                  <img src={url} alt={`Avatar ${i+1}`} className="w-full h-auto rounded-full" />
                  {avatar === url && (
                    <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm">
                      <Check size={12} className="text-blue-600 font-bold" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-sm shadow-lg shadow-blue-200 hover:bg-blue-700 transition">
            Save Profile
          </button>
        </form>

      </main>
    </div>
  );
}
