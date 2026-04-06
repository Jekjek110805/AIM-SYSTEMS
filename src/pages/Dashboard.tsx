import React, { useState, useEffect, useMemo } from 'react';
import { 
  Package, 
  Wrench, 
  CheckCircle, 
  AlertTriangle,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Bell,
  Truck
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  Cell
} from 'recharts';
import { useAuth } from '../AuthContext';
import { Stats, MaintenanceRequest } from '../types';
import { cn } from '../lib/utils';

const StatCard = ({ title, value, icon: Icon, color, trend, trendValue }: any) => (
  <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
        {trend && (
          <div className={cn(
            "flex items-center gap-1 mt-2 text-xs font-medium",
            trend === 'up' ? "text-green-600" : "text-red-600"
          )}>
            {trend === 'up' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            <span>{trendValue} from last month</span>
          </div>
        )}
      </div>
      <div className={cn("p-3 rounded-lg", color)}>
        <Icon size={24} className="text-white" />
      </div>
    </div>
  </div>
);

export default function Dashboard() {
  const { token, user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [maintenanceRequests, setMaintenanceRequests] = useState<MaintenanceRequest[]>([]);
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const maintenanceStats = useMemo(() => {
    const pending = maintenanceRequests.filter(r => r.status === 'Pending').length;
    const inProgress = maintenanceRequests.filter(r => r.status === 'In Progress').length;
    const completed = maintenanceRequests.filter(r => r.status === 'Completed').length;
    const critical = maintenanceRequests.filter(r => r.priority === 'High' && r.status !== 'Completed').length;
    return { pending, inProgress, completed, critical };
  }, [maintenanceRequests]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, mtnRes, assetsRes] = await Promise.all([
          fetch('/api/stats', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/maintenance', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/assets', { headers: { Authorization: `Bearer ${token}` } })
        ]);
        const statsData = await statsRes.json();
        const mtnData = await mtnRes.json();
        const assetsData = await assetsRes.json();
        setStats(statsData);
        setMaintenanceRequests(Array.isArray(mtnData) ? mtnData : []);
        setAssets(Array.isArray(assetsData) ? assetsData : []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token]);

  const chartData = [
    { name: 'Jan', count: 40 },
    { name: 'Feb', count: 30 },
    { name: 'Mar', count: 20 },
    { name: 'Apr', count: 27 },
    { name: 'May', count: 18 },
    { name: 'Jun', count: 23 },
  ];

  const statusData = [
    { name: 'Active', value: stats?.active || 0, color: '#3b82f6' },
    { name: 'Maintenance', value: stats?.maintenance || 0, color: '#f59e0b' },
    { name: 'Disposed', value: stats?.disposed || 0, color: '#ef4444' },
  ];

  const renderAdminDashboard = () => {
    const availableAssets = assets.filter(a => a.status === 'Available');
    const assignedAssets = assets.filter(a => a.status === 'Transferred');
    const maintenanceAssets = assets.filter(a => a.status === 'Under Maintenance');
    
    return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Admin Overview</h2>
        <p className="text-gray-500">AIMS Status</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Assets" value={stats?.total || assets.length} icon={Package} color="bg-blue-600" trend="up" trendValue="12%" />
        <StatCard title="Available Assets" value={availableAssets.length} icon={CheckCircle} color="bg-green-600" trend="up" trendValue="5%" />
        <StatCard title="Deployed/Assigned" value={assignedAssets.length} icon={Truck} color="bg-purple-600" />
        <StatCard title="Under Maintenance" value={maintenanceAssets.length} icon={Wrench} color="bg-amber-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-gray-900">Acquisition Trends</h3>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
                <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={3} dot={{r: 4, fill: '#3b82f6'}} activeDot={{r: 6}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-6">Status Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
                <Tooltip />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Asset Management Table in Dashboard */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900">Asset Management Overview</h3>
          <p className="text-sm text-gray-500">Quick view of all assets from Asset Management</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider">
                <th className="px-6 py-4">Asset Details</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Location</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Condition</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {assets.slice(0, 8).map(asset => (
                <tr key={asset.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-gray-900">{asset.name}</span>
                      <span className="text-xs text-gray-500 font-mono">{asset.code}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium">
                      {asset.category_name || 'Uncategorized'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{asset.location || 'Unassigned'}</td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-2.5 py-1 rounded-lg text-xs font-bold uppercase",
                      asset.status === 'Available' ? "bg-green-50 text-green-700" :
                      asset.status === 'Transferred' ? "bg-blue-50 text-blue-700" :
                      asset.status === 'Under Maintenance' ? "bg-amber-50 text-amber-700" :
                      "bg-gray-100 text-gray-700"
                    )}>
                      {asset.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-2.5 py-1 rounded-lg text-xs font-bold uppercase",
                      asset.condition === 'Excellent' ? "bg-green-50 text-green-700" :
                      asset.condition === 'Good' ? "bg-blue-50 text-blue-700" :
                      asset.condition === 'Fair' ? "bg-amber-50 text-amber-700" :
                      "bg-red-50 text-red-700"
                    )}>
                      {asset.condition || 'Good'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => window.location.href = `/${user?.role}/distribution?tab=${user?.role === 'custodian' ? 'deployment' : 'assignment'}&assetId=${asset.id}`}
                      disabled={asset.status !== 'Available'}
                      className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Deploy
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {assets.length > 8 && (
          <div className="p-4 border-t border-gray-100 text-center">
            <span className="text-sm text-gray-500">Showing 8 of {assets.length} assets. View full list in Asset Management.</span>
          </div>
        )}
      </div>
    </div>
    );
  };

  const renderMaintenanceDashboard = () => {
    const upcomingMaintenance = maintenanceRequests.filter(r => r.status !== 'Completed').slice(0, 5);
    
    return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Maintenance Dashboard</h2>
        <p className="text-gray-500">Technical operations and repair tracking.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Pending Repairs" value={maintenanceStats.pending} icon={Clock} color="bg-amber-500" />
        <StatCard title="In Progress" value={maintenanceStats.inProgress} icon={Wrench} color="bg-blue-500" />
        <StatCard title="Critical Issues" value={maintenanceStats.critical} icon={AlertTriangle} color="bg-red-600" />
      </div>

      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <h3 className="font-bold text-gray-900 mb-4">Active Maintenance Tasks</h3>
        <div className="space-y-4">
          {upcomingMaintenance.length === 0 ? (
            <div className="p-4 text-center text-gray-500">No active maintenance tasks.</div>
          ) : upcomingMaintenance.map((item, i) => (
            <div key={item.id || i} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                  <Wrench size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900">{item.asset_name}</h4>
                  <p className="text-sm text-gray-500">{item.issue_description}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-gray-900">{item.priority}</p>
                <p className="text-xs text-gray-500">{item.status}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
    );
  };

  const renderCustodianDashboard = () => {
    const myMaintenanceRequests = maintenanceRequests.filter(r => r.requester_name === user?.username || r.requester_id === user?.id);
    const pendingRequests = myMaintenanceRequests.filter(r => r.status === 'Pending' || r.status === 'In Progress').length;
    const completedRequests = myMaintenanceRequests.filter(r => r.status === 'Completed').length;
    
    return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Custodian Dashboard</h2>
        <p className="text-gray-500">Asset accountability and resource tracking.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Total Requests" value={myMaintenanceRequests.length} icon={Package} color="bg-blue-600" />
        <StatCard title="Pending Repairs" value={pendingRequests} icon={Clock} color="bg-amber-500" />
        <StatCard title="Completed" value={completedRequests} icon={CheckCircle} color="bg-green-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-4">My Maintenance Requests</h3>
          {myMaintenanceRequests.length === 0 ? (
            <div className="p-4 text-center text-gray-500">No maintenance requests found.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myMaintenanceRequests.slice(0, 4).map((item) => (
                <div key={item.id} className="p-4 border border-gray-100 rounded-lg flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-gray-900">{item.asset_name}</h4>
                    <p className="text-xs text-gray-500 font-mono">{item.asset_code}</p>
                  </div>
                  <span className={cn("px-2 py-1 rounded text-xs font-bold uppercase", 
                    item.status === 'Completed' ? "bg-green-100 text-green-700" :
                    item.status === 'In Progress' ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"
                  )}>{item.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Bell size={18} className="text-blue-600" />
            Notifications
          </h3>
          <div className="space-y-4">
            {maintenanceRequests.filter(r => r.priority === 'High').slice(0, 3).map((note, i) => (
              <div key={note.id} className="p-3 bg-gray-50 rounded-lg border-l-4 border-amber-500">
                <div className="flex justify-between items-start mb-1">
                  <h4 className="text-xs font-bold text-gray-900">{note.asset_name}</h4>
                  <span className="text-[10px] text-gray-400">{note.priority}</span>
                </div>
                <p className="text-[11px] text-gray-600 leading-relaxed">{note.issue_description}</p>
              </div>
            ))}
            {maintenanceRequests.filter(r => r.priority === 'High').length === 0 && (
              <div className="p-3 bg-green-50 rounded-lg border-l-4 border-green-500">
                <p className="text-xs text-gray-600">No urgent alerts at this time.</p>
              </div>
            )}
          </div>
          <button className="w-full mt-4 py-2 text-xs font-bold text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
            View All Notifications
          </button>
        </div>
      </div>

      {/* Asset Management Table for Custodian */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Operational Assets Overview</h3>
              <p className="text-sm text-gray-500">Select available assets from the inventory for distribution.</p>
            </div>
            <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-lg uppercase tracking-wider">Inventory</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider">
                <th className="px-6 py-4">Asset Details</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Location</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {assets.filter(a => a.status === 'Available').slice(0, 8).map(asset => (
                <tr key={asset.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-gray-900">{asset.name}</span>
                      <span className="text-xs text-gray-500 font-mono">{asset.code}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium">
                      {asset.category_name || 'Uncategorized'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{asset.location || 'Unassigned'}</td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 bg-green-50 text-green-700 rounded-lg text-xs font-bold uppercase">
                      Operational
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => window.location.href = `/${user?.role}/distribution?tab=deployment&assetId=${asset.id}`}
                      className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 flex items-center justify-center gap-2 ml-auto"
                    >
                      <Truck size={14} />
                      Deploy Now
                    </button>
                  </td>
                </tr>
              ))}
              {assets.filter(a => a.status === 'Available').length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500 italic">No operational assets available for deployment.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
    );
  };

  if (loading) return <div className="flex items-center justify-center h-full">Loading...</div>;

  return (
    <div className="animate-in fade-in duration-500">
      {user?.role === 'admin' && renderAdminDashboard()}
      {user?.role === 'maintenance' && renderMaintenanceDashboard()}
      {user?.role === 'custodian' && renderCustodianDashboard()}
    </div>
  );
}

