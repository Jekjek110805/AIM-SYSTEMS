import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Package, 
  ArrowLeftRight, 
  Wrench, 
  Trash2,
  LogOut,
  User as UserIcon
} from 'lucide-react';
import { useAuth } from '../AuthContext';

const modules = [
  {
    id: 'acquisition',
    title: 'Acquisition',
    description: 'Manage new asset entries, bulk imports, and vendor tracking.',
    icon: Package,
    color: 'bg-blue-500',
    hoverColor: 'hover:bg-blue-600',
    path: 'acquisition'
  },
  {
    id: 'distribution',
    title: 'Distribution',
    description: 'Assign assets to users, track locations, and manage transfers.',
    icon: ArrowLeftRight,
    color: 'bg-indigo-500',
    hoverColor: 'hover:bg-indigo-600',
    path: 'distribution'
  },
  {
    id: 'maintenance',
    title: 'Maintenance',
    description: 'Track repairs, schedule preventive maintenance, and report issues.',
    icon: Wrench,
    color: 'bg-amber-500',
    hoverColor: 'hover:bg-amber-600',
    path: 'maintenance'
  },
  {
    id: 'disposal',
    title: 'Disposal',
    description: 'Manage end-of-life assets, retirement requests, and disposal logs.',
    icon: Trash2,
    color: 'bg-red-500',
    hoverColor: 'hover:bg-red-600',
    path: 'disposal'
  }
];

export default function ModuleSelection() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleModuleSelect = (path: string) => {
    if (!user) return;
    navigate(`/${user.role}/${path}`);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">A</div>
          <h1 className="text-xl font-bold text-gray-900">AIM System</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-full">
            <UserIcon size={16} className="text-gray-500" />
            <span className="text-sm font-medium text-gray-700">{user?.username}</span>
            <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded-md">
              {user?.role}
            </span>
          </div>
          <button 
            onClick={handleLogout}
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Logout"
          >
            <LogOut size={20} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 max-w-6xl mx-auto w-full">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-extrabold text-gray-900 mb-4 tracking-tight">Select a Lifecycle Module</h2>
          <p className="text-lg text-gray-600 max-w-2xl">
            Welcome to the Paknaan BDRRMO Asset Inventory Management System. Please choose a module to begin your operations.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 w-full">
          {modules.map((mod) => (
            <button
              key={mod.id}
              onClick={() => handleModuleSelect(mod.path)}
              className="group relative bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-left flex flex-col h-full"
            >
              <div className={`w-16 h-16 ${mod.color} rounded-2xl flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-current/20`}>
                <mod.icon size={32} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">{mod.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed mb-8 flex-1">
                {mod.description}
              </p>
              <div className="flex items-center text-blue-600 font-bold text-sm group-hover:translate-x-1 transition-transform">
                Enter Module
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="p-8 text-center text-gray-400 text-sm">
        &copy; 2024 BDRRMO Asset Management System. All rights reserved.
      </footer>
    </div>
  );
}
