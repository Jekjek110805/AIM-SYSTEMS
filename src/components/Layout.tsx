import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  Wrench, 
  Trash2, 
  Users, 
  Settings, 
  LogOut,
  ChevronRight,
  Menu,
  X,
  FileText,
  ArrowLeftRight,
  Grid,
  PlusCircle,
  LayoutGrid,
  Upload,
  ClipboardList,
  UserPlus,
  MapPin,
  CheckCircle,
  BarChart3,
  History,
  Archive,
  FileBarChart,
  Activity,
  Bell,
  ShieldCheck,
  Box,
  Truck
} from 'lucide-react';
import { useAuth } from '../AuthContext';
import { cn } from '../lib/utils';

interface SidebarItemProps {
  to: string;
  icon: React.ElementType;
  label: string;
  active?: boolean;
  key?: string | number;
}

const SidebarItem = ({ to, icon: Icon, label, active }: SidebarItemProps) => (
  <Link
    to={to}
    className={cn(
      "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
      active 
        ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20" 
        : "text-slate-400 hover:bg-slate-800 hover:text-white"
    )}
  >
    <Icon size={20} />
    <span className="font-medium">{label}</span>
    {active && <ChevronRight size={16} className="ml-auto" />}
  </Link>
);

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getLinks = () => {
    const currentPath = location.pathname;
    const searchParams = new URLSearchParams(location.search);
    const currentTab = searchParams.get('tab');

    // Acquisition Module Sidebar (Admin)
    if (user?.role === 'admin' && currentPath.includes('/acquisition')) {
      return [
        { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { to: '/admin/acquisition?tab=registration', icon: PlusCircle, label: 'Asset Registration', active: currentTab === 'registration' || !currentTab },
        { to: '/admin/acquisition?tab=categories', icon: LayoutGrid, label: 'Asset Categories', active: currentTab === 'categories' },
        { to: '/admin/acquisition?tab=invoices', icon: FileText, label: 'Invoice Repository', active: currentTab === 'invoices' },
        { to: '/admin/acquisition?tab=logs', icon: ClipboardList, label: 'Acquisition Logs', active: currentTab === 'logs' },
        { to: '/admin/settings', icon: Settings, label: 'Settings' },
        { to: '/admin/users', icon: Users, label: 'Users & Roles' },
      ];
    }

    // Distribution Module Sidebar (Admin)
    if (user?.role === 'admin' && currentPath.includes('/distribution')) {
      return [
        { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { to: '/admin/distribution?tab=assignment', icon: UserPlus, label: 'Asset Assignment', active: currentTab === 'assignment' || !currentTab },
        { to: '/admin/distribution?tab=transfers', icon: ArrowLeftRight, label: 'Asset Transfers', active: currentTab === 'transfers' },
        { to: '/admin/distribution?tab=tracking', icon: MapPin, label: 'Location Tracking', active: currentTab === 'tracking' },
        { to: '/admin/distribution?tab=availability', icon: CheckCircle, label: 'Availability Monitoring', active: currentTab === 'availability' },
        { to: '/admin/distribution?tab=logs', icon: ClipboardList, label: 'Transfer Logs', active: currentTab === 'logs' },
        { to: '/admin/settings', icon: Settings, label: 'Settings' },
        { to: '/admin/users', icon: Users, label: 'Users & Roles' },
      ];
    }

    // Distribution Module Sidebar (Maintenance)
    if (user?.role === 'maintenance' && currentPath.includes('/distribution')) {
      return [
        { to: '/maintenance/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { to: '/maintenance/distribution?tab=readiness', icon: CheckCircle, label: 'Deployment Readiness', active: currentTab === 'readiness' || !currentTab },
        { to: '/maintenance/distribution?tab=logs', icon: ClipboardList, label: 'Inspection Logs', active: currentTab === 'logs' },
        { to: '/maintenance/distribution?tab=alerts', icon: Bell, label: 'Alerts', active: currentTab === 'alerts' },
      ];
    }

    // Distribution Module Sidebar (Custodian)
    if (user?.role === 'custodian' && currentPath.includes('/distribution')) {
      return [
        { to: '/custodian/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { to: '/custodian/distribution?tab=deployment', icon: Truck, label: 'Deployment & Returns', active: currentTab === 'deployment' || !currentTab },
        { to: '/custodian/distribution?tab=transfers', icon: ArrowLeftRight, label: 'Asset Transfers', active: currentTab === 'transfers' },
        { to: '/custodian/distribution?tab=handover', icon: CheckCircle, label: 'Handover Confirmation', active: currentTab === 'handover' },
        { to: '/custodian/distribution?tab=tracking', icon: MapPin, label: 'Movement Tracking', active: currentTab === 'tracking' },
        { to: '/custodian/distribution?tab=alerts', icon: Bell, label: 'Alerts', active: currentTab === 'alerts' },
      ];
    }

    // Maintenance Module Sidebar (Admin)
    if (user?.role === 'admin' && currentPath.includes('/maintenance')) {
      return [
        { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { to: '/admin/maintenance?tab=requests', icon: FileText, label: 'Maintenance Requests', active: currentTab === 'requests' || !currentTab },
        { to: '/admin/maintenance?tab=assignment', icon: UserPlus, label: 'Task Assignment', active: currentTab === 'assignment' },
        { to: '/admin/maintenance?tab=tracking', icon: Activity, label: 'Repair Tracking', active: currentTab === 'tracking' },
        { to: '/admin/maintenance?tab=history', icon: History, label: 'Maintenance History', active: currentTab === 'history' },
        { to: '/admin/maintenance?tab=analytics', icon: BarChart3, label: 'Analytics', active: currentTab === 'analytics' },
        { to: '/admin/settings', icon: Settings, label: 'Settings' },
        { to: '/admin/users', icon: Users, label: 'Users & Roles' },
      ];
    }

    // Maintenance Module Sidebar (Maintenance)
    if (user?.role === 'maintenance' && currentPath.includes('/maintenance')) {
      return [
        { to: '/maintenance/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { to: '/maintenance/maintenance?tab=tasks', icon: Wrench, label: 'My Tasks', active: currentTab === 'tasks' || !currentTab },
        { to: '/maintenance/maintenance?tab=alerts', icon: Bell, label: 'Alerts', active: currentTab === 'alerts' },
      ];
    }

    // Maintenance Module Sidebar (Custodian)
    if (user?.role === 'custodian' && currentPath.includes('/maintenance')) {
      return [
        { to: '/custodian/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { to: '/custodian/maintenance?tab=report', icon: PlusCircle, label: 'Issue Reporting', active: currentTab === 'report' || !currentTab },
        { to: '/custodian/maintenance?tab=requests', icon: ClipboardList, label: 'Maintenance Requests', active: currentTab === 'requests' },
        { to: '/custodian/maintenance?tab=status', icon: Activity, label: 'Repair Status Tracking', active: currentTab === 'status' },
        { to: '/custodian/maintenance?tab=alerts', icon: Bell, label: 'Alerts', active: currentTab === 'alerts' },
      ];
    }

    // Disposal Module Sidebar (Admin)
    if (user?.role === 'admin' && currentPath.includes('/disposal')) {
      return [
        { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { to: '/admin/disposal?tab=requests', icon: FileText, label: 'Disposal Requests', active: currentTab === 'requests' || !currentTab },
        { to: '/admin/disposal?tab=retirement', icon: Archive, label: 'Asset Retirement', active: currentTab === 'retirement' },
        { to: '/admin/disposal?tab=reports', icon: FileBarChart, label: 'Disposal Reports', active: currentTab === 'reports' },
        { to: '/admin/disposal?tab=logs', icon: ClipboardList, label: 'Disposal Logs', active: currentTab === 'logs' },
        { to: '/admin/settings', icon: Settings, label: 'Settings' },
        { to: '/admin/users', icon: Users, label: 'Users & Roles' },
      ];
    }

    // Disposal Module Sidebar (Maintenance)
    if (user?.role === 'maintenance' && currentPath.includes('/disposal')) {
      return [
        { to: '/maintenance/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { to: '/maintenance/disposal?tab=reports', icon: FileText, label: 'Inspection Reports', active: currentTab === 'reports' || !currentTab },
        { to: '/maintenance/disposal?tab=alerts', icon: Bell, label: 'Alerts', active: currentTab === 'alerts' },
      ];
    }

    // Disposal Module Sidebar (Custodian)
    if (user?.role === 'custodian' && currentPath.includes('/disposal')) {
      return [
        { to: '/custodian/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { to: '/custodian/disposal?tab=request', icon: PlusCircle, label: 'Disposal Requests', active: currentTab === 'request' || !currentTab },
        { to: '/custodian/disposal?tab=status', icon: ClipboardList, label: 'Request Status', active: currentTab === 'status' },
        { to: '/custodian/disposal?tab=alerts', icon: Bell, label: 'Alerts', active: currentTab === 'alerts' },
      ];
    }

    // Acquisition Module Sidebar (Maintenance)
    if (user?.role === 'maintenance' && currentPath.includes('/acquisition')) {
      return [
        { to: '/maintenance/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { to: '/maintenance/acquisition?tab=tasks', icon: ClipboardList, label: 'Assigned Tasks Overview', active: currentTab === 'tasks' || !currentTab },
        { to: '/maintenance/acquisition?tab=alerts', icon: Bell, label: 'Alerts', active: currentTab === 'alerts' },
        { to: '/maintenance/acquisition?tab=assets', icon: Package, label: 'Assets', active: currentTab === 'assets' },
        { to: '/maintenance/acquisition?tab=inspection', icon: ShieldCheck, label: 'Asset Inspection', active: currentTab === 'inspection' },
        { to: '/maintenance/acquisition?tab=verification', icon: CheckCircle, label: 'Condition Verification', active: currentTab === 'verification' },
      ];
    }

    // Acquisition Module Sidebar (Custodian)
    if (user?.role === 'custodian' && currentPath.includes('/acquisition')) {
      return [
        { to: '/custodian/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { to: '/custodian/acquisition?tab=dashboard', icon: LayoutDashboard, label: 'Asset Management', active: currentTab === 'dashboard' || !currentTab },
        { to: '/custodian/acquisition?tab=categories', icon: LayoutGrid, label: 'Asset Categories', active: currentTab === 'categories' },
        { to: '/custodian/acquisition?tab=invoices', icon: FileText, label: 'Invoice Repository', active: currentTab === 'invoices' },
        { to: '/custodian/acquisition?tab=logs', icon: ClipboardList, label: 'Acquisition Logs', active: currentTab === 'logs' },
        { to: '/custodian/acquisition?tab=requests', icon: PlusCircle, label: 'Asset Requests', active: currentTab === 'requests' },
        { to: '/custodian/acquisition?tab=receiving', icon: CheckCircle, label: 'Receiving & Confirmation', active: currentTab === 'receiving' },
        { to: '/custodian/acquisition?tab=alerts', icon: Bell, label: 'Alerts', active: currentTab === 'alerts' },
      ];
    }

    // Default Sidebar
    const baseLinks = [
      { to: `/${user?.role}/dashboard`, icon: LayoutDashboard, label: 'Dashboard' },
      ...(user?.role === 'custodian' ? [{ to: '/custodian/assets', icon: Box, label: 'My Assets' }] : []),
      { to: `/${user?.role}/acquisition`, icon: Package, label: 'Acquisition' },
      { to: `/${user?.role}/distribution`, icon: ArrowLeftRight, label: 'Distribution' },
      { to: `/${user?.role}/maintenance`, icon: Wrench, label: 'Maintenance' },
      { to: `/${user?.role}/disposal`, icon: Trash2, label: 'Disposal' },
    ];

    const adminExtra = [
      { to: '/admin/reports', icon: FileText, label: 'Reports' },
      { to: '/admin/users', icon: Users, label: 'Users & Roles' },
      { to: '/admin/settings', icon: Settings, label: 'Settings' },
    ];

    const allLinks = user?.role === 'admin' ? [...baseLinks, ...adminExtra] : baseLinks;
    
    return allLinks.map(link => ({
      ...link,
      active: currentPath === link.to
    }));
  };

  const links = getLinks();

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 text-slate-300 p-4">
        <div className="flex items-center gap-3 px-4 mb-8">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold shadow-lg">A</div>
          <div className="flex flex-col">
            <h1 className="text-lg font-bold text-white leading-tight">AIMS</h1>
            <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Asset Management</span>
          </div>
        </div>

        <nav className="flex-1 space-y-1">
          {links.map((link) => (
            <SidebarItem 
              key={link.to} 
              to={link.to}
              icon={link.icon}
              label={link.label}
              active={link.active} 
            />
          ))}
        </nav>

        <div className="mt-auto pt-4 border-t border-slate-800 space-y-1">
          <button
            onClick={() => navigate('/module-selection')}
            className="flex items-center gap-3 w-full px-4 py-3 text-slate-400 hover:bg-blue-500/10 hover:text-blue-400 rounded-lg transition-colors"
          >
            <Grid size={20} />
            <span className="font-medium">Switch Module</span>
          </button>
          <div className="flex items-center gap-3 px-4 py-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-blue-400 font-bold border border-slate-700">
              {user?.username.charAt(0).toUpperCase()}
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-semibold text-white truncate">{user?.username}</span>
              <span className="text-[10px] text-slate-500 uppercase font-bold">{user?.role}</span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 text-slate-400 hover:bg-red-500/10 hover:text-red-400 rounded-lg transition-colors"
          >
            <LogOut size={20} />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <header className="md:hidden flex items-center justify-between h-16 px-4 bg-slate-900 border-b border-slate-800 text-white">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">A</div>
            <h1 className="text-lg font-bold">AIMS</h1>
          </div>
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 text-slate-400 hover:bg-slate-800 rounded-lg"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </header>

        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-50 bg-slate-900 p-4 flex flex-col text-slate-300">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">A</div>
                <h1 className="text-xl font-bold text-white">AIMS</h1>
              </div>
              <button onClick={() => setIsMobileMenuOpen(false)} className="p-2">
                <X size={24} />
              </button>
            </div>
            <nav className="flex-1 space-y-1">
              {links.map((link) => (
                <SidebarItem 
                  key={link.to} 
                  to={link.to}
                  icon={link.icon}
                  label={link.label}
                  active={link.active} 
                />
              ))}
            </nav>
            <div className="mt-auto pt-4 border-t border-slate-800 space-y-1">
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  navigate('/module-selection');
                }}
                className="flex items-center gap-3 w-full px-4 py-3 text-slate-400 hover:bg-blue-500/10 hover:text-blue-400 rounded-lg transition-colors"
              >
                <Grid size={20} />
                <span className="font-medium">Switch Module</span>
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 w-full px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-lg"
              >
                <LogOut size={20} />
                <span className="font-medium">Logout</span>
              </button>
            </div>
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
