import React, { useState, useEffect, useMemo } from 'react';
import { 
  Wrench, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  MoreVertical,
  Filter,
  Plus,
  FileText,
  UserPlus,
  Activity,
  History as HistoryIcon,
  BarChart3,
  Search,
  ChevronRight,
  Calendar,
  User,
  TrendingUp,
  AlertTriangle,
  Bell,
  PlusCircle,
  LayoutDashboard,
  ClipboardList,
  X,
  Save,
  Trash2
} from 'lucide-react';
import { useAuth } from '../AuthContext';
import { MaintenanceRequest, Asset, User as UserType } from '../types';
import { cn } from '../lib/utils';
import { useSearchParams } from 'react-router-dom';

export default function Maintenance() {
  const { token, user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (searchParams.get('tab') as any) || 
    (user?.role === 'maintenance' ? 'tasks' : 
     user?.role === 'custodian' ? 'report' : 'requests');
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [technicians, setTechnicians] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<MaintenanceRequest | null>(null);
  const [technicianFilter, setTechnicianFilter] = useState('');
  const [message, setMessage] = useState('');
  const [newRequest, setNewRequest] = useState({
    asset_id: '',
    issue_description: '',
    priority: 'Medium'
  });

  const setActiveTab = (tab: string) => {
    setSearchParams({ tab });
  };

  const filteredTechnicians = useMemo(() => {
    if (!technicianFilter.trim()) return technicians;
    const q = technicianFilter.toLowerCase();
    return technicians.filter(t => 
      t.username.toLowerCase().includes(q) ||
      (t as any).specialty?.toLowerCase().includes(q)
    );
  }, [technicians, technicianFilter]);

  const maintenanceRequests = useMemo(() => {
    return requests.filter(r => r.status !== 'Cancelled');
  }, [requests]);

  const pendingRequests = useMemo(() => {
    return maintenanceRequests.filter(r => r.status === 'Pending');
  }, [maintenanceRequests]);

  const inProgressRequests = useMemo(() => {
    return maintenanceRequests.filter(r => r.status === 'In Progress');
  }, [maintenanceRequests]);

  const completedRequests = useMemo(() => {
    return maintenanceRequests.filter(r => r.status === 'Completed');
  }, [maintenanceRequests]);

  const unassignedRequests = useMemo(() => {
    return maintenanceRequests.filter(r => !r.technician_id && r.status === 'Pending');
  }, [maintenanceRequests]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [reqsRes, assetsRes, usersRes] = await Promise.all([
          fetch('/api/maintenance', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/assets', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/users?role=maintenance', { headers: { Authorization: `Bearer ${token}` } })
        ]);
        setRequests(await reqsRes.json());
        setAssets(await assetsRes.json());
        const usersData = await usersRes.json();
        setTechnicians(Array.isArray(usersData) ? usersData : []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token]);

  useEffect(() => {
    if (!message) return;
    const timeout = window.setTimeout(() => setMessage(''), 3000);
    return () => window.clearTimeout(timeout);
  }, [message]);

  const handleAssignTechnician = async (requestId: number, techId: number) => {
    try {
      const res = await fetch(`/api/maintenance/${requestId}/assign`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ technician_id: techId })
      });
      if (res.ok) {
        const updatedReq = await res.json();
        setRequests(prev => prev.map(r => 
          r.id === requestId ? { ...r, technician_id: techId, status: 'In Progress' as const } : r
        ));
        setSelectedRequest(null);
        setMessage('Technician assigned successfully');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateStatus = async (requestId: number, newStatus: 'In Progress' | 'Completed', assetId?: number) => {
    try {
      const res = await fetch(`/api/maintenance/${requestId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        setRequests(prev => prev.map(r => 
          r.id === requestId ? { ...r, status: newStatus } : r
        ));
        if (newStatus === 'Completed' && assetId) {
          const assetRes = await fetch(`/api/assets/${assetId}`, {
            method: 'PUT',
            headers: { 
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}` 
            },
            body: JSON.stringify({ status: 'Available' })
          });
          if (assetRes.ok) {
            setAssets(prev => prev.map(a => 
              a.id === assetId ? { ...a, status: 'Available' } : a
            ));
          }
        }
        setMessage(newStatus === 'Completed' ? 'Maintenance completed' : 'Status updated');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCompleteMaintenance = async (requestId: number, assetId: number) => {
    await handleUpdateStatus(requestId, 'Completed', assetId);
  };

  const handleDeleteRequest = async (requestId: number) => {
    if (!confirm('Are you sure you want to delete this maintenance request?')) return;
    try {
      const res = await fetch(`/api/maintenance/${requestId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setRequests(prev => prev.filter(r => r.id !== requestId));
        setMessage('Request deleted');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getAssetForRequest = (assetId: number) => {
    return assets.find(a => a.id === assetId);
  };

  const getTechnicianName = (techId?: number) => {
    if (!techId) return 'Unassigned';
    const tech = technicians.find(t => t.id === techId);
    return tech?.username || 'Unknown';
  };

  const renderAdminView = () => (
    <div className="space-y-6">
      {message && (
        <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-2 text-sm text-green-700">{message}</div>
      )}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Maintenance Management</h2>
          <p className="text-gray-500">Track and manage asset repairs and preventive maintenance.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus size={18} />
          <span>New Request</span>
        </button>
      </div>

      {/* Admin Tabs */}
      <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {[
          { id: 'requests', label: 'Maintenance Requests', icon: FileText },
          { id: 'assignment', label: 'Task Assignment', icon: UserPlus },
          { id: 'tracking', label: 'Repair Tracking', icon: Activity },
          { id: 'history', label: 'Maintenance History', icon: HistoryIcon },
          { id: 'analytics', label: 'Analytics', icon: BarChart3 },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all",
              activeTab === tab.id 
                ? "bg-white text-blue-600 shadow-sm" 
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50"
            )}
          >
            <tab.icon size={16} />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
        {activeTab === 'requests' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
                <div className="p-3 bg-amber-50 rounded-lg text-amber-600">
                  <Clock size={24} />
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">Pending Requests</p>
                  <h3 className="text-2xl font-bold text-gray-900">{pendingRequests.length}</h3>
                </div>
              </div>
              <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
                <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
                  <Wrench size={24} />
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">In Progress</p>
                  <h3 className="text-2xl font-bold text-gray-900">{inProgressRequests.length}</h3>
                </div>
              </div>
              <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
                <div className="p-3 bg-green-50 rounded-lg text-green-600">
                  <CheckCircle size={24} />
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">Completed</p>
                  <h3 className="text-2xl font-bold text-gray-900">{completedRequests.length}</h3>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <h3 className="font-bold text-gray-900">Incoming Requests</h3>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                    <input type="text" placeholder="Search requests..." className="pl-9 pr-4 py-1.5 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <button className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg border border-gray-200"><Filter size={18} /></button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-100 text-xs font-bold text-gray-500 uppercase">
                      <th className="px-6 py-4">Asset</th>
                      <th className="px-6 py-4">Issue</th>
                      <th className="px-6 py-4">Requester</th>
                      <th className="px-6 py-4">Priority</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Date Reported</th>
                      <th className="px-6 py-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {maintenanceRequests.map((req) => (
                      <tr key={req.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-gray-900">{req.asset_name}</span>
                            <span className="text-xs text-gray-500 font-mono">{req.asset_code}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">{req.issue_description}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{req.requester_name || '-'}</td>
                        <td className="px-6 py-4">
                          <span className={cn("px-2 py-1 rounded text-[10px] font-bold uppercase", 
                            req.priority === 'High' ? "bg-red-50 text-red-600" : 
                            req.priority === 'Medium' ? "bg-amber-50 text-amber-600" : "bg-blue-50 text-blue-600"
                          )}>{req.priority}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={cn("px-2 py-1 rounded text-[10px] font-bold uppercase", 
                            req.status === 'Pending' ? "bg-amber-50 text-amber-600" : 
                            req.status === 'In Progress' ? "bg-blue-50 text-blue-600" : "bg-green-50 text-green-600"
                          )}>{req.status}</span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">{req.created_at?.split('T')[0] || '-'}</td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {req.status === 'Pending' && (
                              <button 
                                onClick={() => setSelectedRequest(req)}
                                className="text-blue-600 hover:underline text-sm font-bold"
                              >
                                Assign
                              </button>
                            )}
                            {(req.status === 'In Progress' || req.status === 'Pending') && (
                              <button 
                                onClick={() => handleUpdateStatus(req.id, 'In Progress')}
                                className="text-amber-600 hover:underline text-sm font-bold"
                              >
                                Update
                              </button>
                            )}
                            {req.status === 'Completed' && (
                              <button 
                                onClick={() => handleDeleteRequest(req.id)}
                                className="text-red-600 hover:underline text-sm font-bold"
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {maintenanceRequests.length === 0 && (
                  <div className="p-8 text-center text-gray-500">No maintenance requests found.</div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'assignment' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-lg font-bold text-gray-900">Unassigned Maintenance Tasks</h3>
              </div>
              <div className="divide-y divide-gray-100">
                {unassignedRequests.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">All requests have been assigned.</div>
                ) : unassignedRequests.map((req) => (
                  <div key={req.id} className="p-6 flex items-center justify-between hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
                        <AlertTriangle size={24} />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900">{req.asset_name}</h4>
                        <p className="text-xs text-gray-500 font-mono">{req.asset_code} • {req.priority} Priority</p>
                        <p className="text-sm text-gray-600 mt-1">{req.issue_description}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setSelectedRequest(req)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors"
                    >
                      Assign Tech
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">Available Technicians</h3>
              </div>
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                <input 
                  type="text" 
                  placeholder="Search technicians..." 
                  value={technicianFilter}
                  onChange={(e) => setTechnicianFilter(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" 
                />
              </div>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {filteredTechnicians.length === 0 ? (
                  <div className="text-sm text-gray-500">No technicians found.</div>
                ) : filteredTechnicians.map((tech) => (
                  <div key={tech.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-blue-600 font-bold border border-gray-200">
                        {tech.username.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">{tech.username}</p>
                        <p className="text-[10px] text-gray-500 uppercase font-bold">{tech.role}</p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-[10px] font-bold uppercase">
                      Available
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'tracking' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Active Repair Tracking</h3>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Live Updates</span>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-100 text-xs font-bold text-gray-500 uppercase">
                    <th className="px-6 py-4">Asset</th>
                    <th className="px-6 py-4">Technician</th>
                    <th className="px-6 py-4">Issue</th>
                    <th className="px-6 py-4">Priority</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {inProgressRequests.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-gray-500">No active repairs in progress.</td>
                    </tr>
                  ) : inProgressRequests.map((req) => (
                    <tr key={req.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-bold text-gray-900">{req.asset_name}</td>
                      <td className="px-6 py-4 text-gray-600">{getTechnicianName(req.technician_id)}</td>
                      <td className="px-6 py-4 text-gray-500 max-w-xs truncate">{req.issue_description}</td>
                      <td className="px-6 py-4">
                        <span className={cn("px-2 py-1 rounded text-[10px] font-bold uppercase", 
                          req.priority === 'High' ? "bg-red-50 text-red-600" : 
                          req.priority === 'Medium' ? "bg-amber-50 text-amber-600" : "bg-blue-50 text-blue-600"
                        )}>{req.priority}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-[10px] font-bold uppercase">
                          {req.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => handleCompleteMaintenance(req.id, req.asset_id)}
                          className="px-3 py-1 bg-green-600 text-white rounded-lg text-xs font-bold hover:bg-green-700"
                        >
                          Complete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Maintenance History Logs</h3>
              <button className="text-sm text-blue-600 font-bold hover:underline">Export CSV</button>
            </div>
            <div className="divide-y divide-gray-100">
              {completedRequests.length === 0 ? (
                <div className="p-8 text-center text-gray-500">No completed maintenance yet.</div>
              ) : completedRequests.map((log) => (
                <div key={log.id} className="p-6 flex items-center justify-between hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center text-green-600">
                      <CheckCircle size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">{log.asset_name}</h4>
                      <p className="text-xs text-gray-500">Repair completed by {getTechnicianName(log.technician_id)}</p>
                      <p className="text-sm text-gray-600 mt-1">{log.issue_description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium text-gray-500">Completed on {log.updated_at?.split('T')[0] || '-'}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <TrendingUp size={20} className="text-blue-600" />
                Maintenance Trends
              </h3>
              <div className="h-64 flex items-end justify-between gap-2">
                {[40, 25, 60, 45, 80, 55, 70].map((h, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2">
                    <div className="w-full bg-blue-500 rounded-t-lg" style={{ height: `${h}%` }}></div>
                    <span className="text-[10px] text-gray-400 font-bold uppercase">Day {i+1}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-6">Asset Health Overview</h3>
              <div className="space-y-6">
                {(() => {
                  const total = assets.length || 1;
                  const operational = assets.filter(a => a.status === 'Available').length;
                  const underRepair = assets.filter(a => a.status === 'Under Maintenance').length;
                  const critical = assets.filter(a => a.status === 'Damaged').length;
                  const data = [
                    { label: 'Operational', value: total > 1 ? Math.round((operational / total) * 100) : 85, color: 'bg-green-500' },
                    { label: 'Under Repair', value: total > 1 ? Math.round((underRepair / total) * 100) : 10, color: 'bg-amber-500' },
                    { label: 'Critical', value: total > 1 ? Math.round((critical / total) * 100) : 5, color: 'bg-red-500' },
                  ];
                  return data.map((item, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex justify-between text-sm font-bold">
                      <span className="text-gray-700">{item.label}</span>
                      <span className="text-gray-900">{item.value}%</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className={cn("h-full", item.color)} style={{ width: `${item.value}%` }}></div>
                    </div>
                  </div>
                ));
                })()}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderMaintenanceView = () => {
    const myRequests = maintenanceRequests.filter(r => r.technician_id === user?.id || r.technician_name === user?.username);
    
    return (
    <div className="space-y-6">
      {message && (
        <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-2 text-sm text-green-700">{message}</div>
      )}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Maintenance Tasks</h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Status:</span>
          <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold uppercase">On Duty</span>
        </div>
      </div>

      {/* Maintenance Tabs */}
      <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {[
          { id: 'tasks', label: 'Assigned Tasks', icon: UserPlus },
          { id: 'all', label: 'All Tasks', icon: Wrench },
          { id: 'technicians', label: 'Technicians', icon: Wrench },
          { id: 'alerts', label: 'Alerts', icon: Bell },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all",
              activeTab === tab.id 
                ? "bg-white text-blue-600 shadow-sm" 
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50"
            )}
          >
            <tab.icon size={16} />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
        {activeTab === 'tasks' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {myRequests.filter(r => r.status !== 'Completed').map(req => (
              <div key={req.id} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-bold text-gray-900">{req.asset_name}</h4>
                    <p className="text-xs text-gray-500 font-mono">{req.asset_code}</p>
                  </div>
                  <span className={cn("px-2 py-1 rounded text-xs font-bold", 
                    req.priority === 'High' ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-600"
                  )}>{req.priority}</span>
                </div>
                <p className="text-sm text-gray-600 mb-4">{req.issue_description}</p>
                <div className="flex gap-2">
                  {req.status === 'In Progress' ? (
                    <button 
                      onClick={() => handleCompleteMaintenance(req.id, req.asset_id)}
                      className="flex-1 py-2 bg-green-600 text-white rounded-lg text-sm font-bold"
                    >
                      Mark Complete
                    </button>
                  ) : (
                    <button 
                      onClick={() => handleUpdateStatus(req.id, 'In Progress')}
                      className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold"
                    >
                      Start Work
                    </button>
                  )}
                </div>
              </div>
            ))}
            {myRequests.filter(r => r.status !== 'Completed').length === 0 && (
              <div className="md:col-span-2 bg-white p-12 rounded-xl border border-dashed border-gray-200 text-center">
                <CheckCircle size={48} className="text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-gray-900">No Assigned Tasks</h3>
                <p className="text-gray-500">You have no assigned maintenance tasks at the moment.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'all' && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h3 className="font-bold text-gray-900">All Maintenance Tasks</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 text-xs font-bold text-gray-500 uppercase">
                    <th className="px-6 py-4">Asset</th>
                    <th className="px-6 py-4">Issue</th>
                    <th className="px-6 py-4">Priority</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {maintenanceRequests.filter(r => r.status !== 'Completed').map((req) => (
                    <tr key={req.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-gray-900">{req.asset_name}</span>
                          <span className="text-xs text-gray-500 font-mono">{req.asset_code}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">{req.issue_description}</td>
                      <td className="px-6 py-4">
                        <span className={cn("px-2 py-1 rounded text-[10px] font-bold uppercase", 
                          req.priority === 'High' ? "bg-red-50 text-red-600" : 
                          req.priority === 'Medium' ? "bg-amber-50 text-amber-600" : "bg-blue-50 text-blue-600"
                        )}>{req.priority}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn("px-2 py-1 rounded text-[10px] font-bold uppercase", 
                          req.status === 'Pending' ? "bg-amber-50 text-amber-600" : 
                          req.status === 'In Progress' ? "bg-blue-50 text-blue-600" : "bg-green-50 text-green-600"
                        )}>{req.status}</span>
                      </td>
                      <td className="px-6 py-4">
                        {req.technician_id === user?.id || req.technician_name === user?.username ? (
                          req.status === 'In Progress' ? (
                            <button 
                              onClick={() => handleCompleteMaintenance(req.id, req.asset_id)}
                              className="px-3 py-1 bg-green-600 text-white rounded-lg text-xs font-bold hover:bg-green-700"
                            >
                              Complete
                            </button>
                          ) : req.status === 'Pending' ? (
                            <button 
                              onClick={() => handleUpdateStatus(req.id, 'In Progress')}
                              className="px-3 py-1 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700"
                            >
                              Start
                            </button>
                          ) : null
                        ) : (
                          <span className="text-xs text-gray-400">Not Assigned</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {maintenanceRequests.filter(r => r.status !== 'Completed').length === 0 && (
                <div className="p-8 text-center text-gray-500">No maintenance tasks found.</div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'alerts' && (
          <div className="space-y-4">
            {pendingRequests.filter(r => r.priority === 'High').map(req => (
              <div key={req.id} className="p-4 bg-amber-50 border border-amber-100 rounded-xl flex gap-4">
                <div className="p-2 bg-amber-100 text-amber-600 rounded-lg h-fit">
                  <Bell size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900">Urgent Repair: {req.asset_name}</h4>
                  <p className="text-sm text-gray-600">{req.issue_description}</p>
                  <span className="text-[10px] text-gray-500 font-bold uppercase mt-2 block">{req.priority} Priority</span>
                </div>
              </div>
            ))}
            {pendingRequests.filter(r => r.priority === 'High').length === 0 && (
              <div className="p-4 bg-green-50 border border-green-100 rounded-xl text-sm text-green-700">
                No urgent alerts at this time.
              </div>
            )}
          </div>
        )}

        {activeTab === 'technicians' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Technician & Mechanic Management</h3>
                  <p className="text-sm text-gray-500">Manage maintenance personnel</p>
                </div>
                <button 
                  onClick={() => setIsModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700"
                >
                  <Plus size={16} />
                  <span>Add Technician</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {technicians.filter(t => t.role === 'technician').length === 0 ? (
                  <div className="col-span-full p-8 text-center text-gray-500">
                    <Wrench size={40} className="mx-auto mb-2 text-gray-300" />
                    <p>No technicians added yet.</p>
                  </div>
                ) : (
                  technicians.filter(t => t.role === 'technician').map(tech => (
                    <div key={tech.id} className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 font-bold">
                          {tech.username.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900">{tech.username}</h4>
                          <p className="text-xs text-gray-500 capitalize">{tech.role}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className={cn(
                          "px-2 py-1 rounded text-xs font-bold uppercase",
                          tech.is_on_duty ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                        )}>
                          {tech.is_on_duty ? 'On Duty' : 'Off Duty'}
                        </span>
                        <button 
                          onClick={() => handleToggleDuty(tech.id, !!tech.is_on_duty)}
                          className="text-xs font-bold text-blue-600 hover:underline"
                        >
                          Toggle Status
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Add New Technician/Mechanic</h3>
              <form onSubmit={async (e) => {
                e.preventDefault();
                const form = e.target as HTMLFormElement;
                const formData = new FormData(form);
                
                try {
                  const res = await fetch('/api/technicians', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({
                      username: formData.get('tech_username'),
                      email: formData.get('tech_email'),
                      password: formData.get('tech_password'),
                      specialty: formData.get('tech_specialty')
                    })
                  });
                  
                  if (res.ok) {
                    const newTech = await res.json();
                    setTechnicians(prev => [...prev, newTech]);
                    form.reset();
                    setMessage('Technician added successfully');
                  } else {
                    const err = await res.json();
                    setMessage(err.error || 'Failed to add technician');
                  }
                } catch (err) {
                  console.error(err);
                }
              }} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Username</label>
                  <input 
                    name="tech_username"
                    type="text" 
                    required
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Enter username"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Email</label>
                  <input 
                    name="tech_email"
                    type="email" 
                    required
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Enter email"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Password</label>
                  <input 
                    name="tech_password"
                    type="password" 
                    required
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Enter password"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Specialty</label>
                  <select 
                    name="tech_specialty"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="Mechanic">Mechanic</option>
                    <option value="Electrician">Electrician</option>
                    <option value="Plumber">Plumber</option>
                    <option value="General Repair">General Repair</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <button 
                    type="submit" 
                    className="w-full py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors"
                  >
                    Add Technician
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
    );
  };

  const renderCustodianView = () => {
    const myRequests = maintenanceRequests.filter(r => r.requester_name === user?.username || r.requester_id === user?.id);
    
    return (
    <div className="space-y-6">
      {message && (
        <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-2 text-sm text-green-700">{message}</div>
      )}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Maintenance Requests</h2>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-red-600 text-white rounded-lg font-bold flex items-center gap-2 hover:bg-red-700 transition-colors"
        >
          <AlertTriangle size={18} />
          <span>Report New Issue</span>
        </button>
      </div>

      {/* Custodian Tabs */}
      <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {[
          { id: 'report', label: 'Issue Reporting', icon: AlertTriangle },
          { id: 'requests', label: 'Maintenance Requests', icon: ClipboardList },
          { id: 'tracking', label: 'Repair Status Tracking', icon: Clock },
          { id: 'alerts', label: 'Alerts', icon: Bell },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all",
              activeTab === tab.id 
                ? "bg-white text-red-600 shadow-sm" 
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50"
            )}
          >
            <tab.icon size={16} />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
        {activeTab === 'report' && (
          <div className="bg-white p-12 rounded-2xl border border-dashed border-gray-300 text-center">
            <AlertTriangle size={48} className="text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-900">Found a problem?</h3>
            <p className="text-gray-500 mt-2 max-w-md mx-auto">If an asset is damaged or malfunctioning, report it immediately to the maintenance team.</p>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="mt-6 px-8 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-200"
            >
              Submit Issue Report
            </button>
          </div>
        )}

        {activeTab === 'requests' && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-gray-50/50 font-bold">My Maintenance Requests</div>
            <div className="divide-y divide-gray-100">
              {myRequests.map(req => (
                <div key={req.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center text-red-600">
                      <ClipboardList size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">{req.asset_name}</h4>
                      <p className="text-xs text-gray-500">{req.issue_description}</p>
                    </div>
                  </div>
                  <span className={cn("px-2.5 py-1 rounded-full text-xs font-bold uppercase", 
                    req.status === 'Pending' ? "bg-amber-100 text-amber-700" : 
                    req.status === 'In Progress' ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"
                  )}>
                    {req.status}
                  </span>
                </div>
              ))}
              {myRequests.length === 0 && (
                <div className="p-8 text-center text-gray-500">No maintenance requests found.</div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'tracking' && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-gray-50/50 font-bold">Repair Status Tracking</div>
            <div className="divide-y divide-gray-100">
              {myRequests.filter(r => r.status === 'In Progress').length === 0 ? (
                <div className="p-8 text-center text-gray-500">No assets currently in repair.</div>
              ) : myRequests.filter(r => r.status === 'In Progress').map(req => (
                <div key={req.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
                      <Wrench size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">{req.asset_name}</h4>
                      <p className="text-xs text-gray-500">Being worked on by {getTechnicianName(req.technician_id)}</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold uppercase">
                    In Progress
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'alerts' && (
          <div className="space-y-4">
            {myRequests.filter(r => r.status === 'Completed').map(req => (
              <div key={req.id} className="p-4 bg-green-50 border border-green-100 rounded-xl flex gap-4">
                <div className="p-2 bg-green-100 text-green-600 rounded-lg h-fit">
                  <CheckCircle size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900">Repair Completed: {req.asset_name}</h4>
                  <p className="text-sm text-gray-600">The maintenance for your asset has been completed. It is now ready for use.</p>
                  <span className="text-[10px] text-gray-500 font-bold uppercase mt-2 block">{req.updated_at?.split('T')[0]}</span>
                </div>
              </div>
            ))}
            {myRequests.filter(r => r.status === 'Completed').length === 0 && (
              <div className="p-4 bg-gray-50 border border-gray-100 rounded-xl text-sm text-gray-500">
                No completed repairs to show.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
    );
  };

  if (loading) return <div className="p-8 text-center">Loading Module...</div>;

  return (
    <div className="animate-in fade-in duration-500 bg-white rounded-2xl p-6">
      {user?.role === 'admin' && renderAdminView()}
      {user?.role === 'maintenance' && renderMaintenanceView()}
      {user?.role === 'custodian' && renderCustodianView()}

      {/* New Request Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">New Maintenance Request</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full"><Plus size={20} className="rotate-45" /></button>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              try {
                const res = await fetch('/api/maintenance', {
                  method: 'POST',
                  headers: { 
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}` 
                  },
                  body: JSON.stringify({
                    asset_id: parseInt(newRequest.asset_id),
                    issue_description: newRequest.issue_description,
                    priority: newRequest.priority
                  })
                });
                if (res.ok) {
                  const reqsRes = await fetch('/api/maintenance', { headers: { Authorization: `Bearer ${token}` } });
                  setRequests(await reqsRes.json());
                  setIsModalOpen(false);
                  setNewRequest({ asset_id: '', issue_description: '', priority: 'Medium' });
                }
              } catch (err) {
                console.error(err);
              }
            }} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Asset</label>
                <select 
                  required
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={newRequest.asset_id}
                  onChange={e => setNewRequest({...newRequest, asset_id: e.target.value})}
                >
                  <option value="">Select Asset</option>
                  {assets.filter(a => a.status === 'Available' || a.status === 'Under Maintenance').map(asset => (
                    <option key={asset.id} value={asset.id}>{asset.name} ({asset.code})</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Priority</label>
                <div className="flex gap-2">
                  {['Low', 'Medium', 'High'].map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setNewRequest({...newRequest, priority: p})}
                      className={cn(
                        "flex-1 py-2 rounded-lg border text-sm font-bold transition-all",
                        newRequest.priority === p 
                          ? "bg-blue-600 text-white border-blue-600" 
                          : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                      )}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Issue Description</label>
                <textarea 
                  required
                  rows={4}
                  placeholder="Describe the problem in detail..." 
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                  value={newRequest.issue_description}
                  onChange={e => setNewRequest({...newRequest, issue_description: e.target.value})}
                />
              </div>
              <div className="pt-4 flex items-center gap-3">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-lg font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 shadow-sm"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Technician Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">Assign Technician</h3>
              <button onClick={() => setSelectedRequest(null)} className="p-2 hover:bg-gray-100 rounded-full"><X size={20} /></button>
            </div>
            <div className="p-6">
              <div className="mb-4 p-4 bg-gray-50 rounded-xl">
                <p className="text-sm font-bold text-gray-900">{selectedRequest.asset_name}</p>
                <p className="text-xs text-gray-500 font-mono">{selectedRequest.asset_code}</p>
                <p className="text-sm text-gray-600 mt-2">{selectedRequest.issue_description}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">Select Technician:</p>
                {filteredTechnicians.map(tech => (
                  <button
                    key={tech.id}
                    onClick={() => handleAssignTechnician(selectedRequest.id, tech.id)}
                    className="w-full p-3 flex items-center gap-3 bg-gray-50 hover:bg-blue-50 rounded-xl border border-gray-100 transition-colors"
                  >
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-blue-600 font-bold border border-gray-200">
                      {tech.username.charAt(0).toUpperCase()}
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold text-gray-900">{tech.username}</p>
                      <p className="text-[10px] text-gray-500 uppercase">{tech.role}</p>
                    </div>
                  </button>
                ))}
                {filteredTechnicians.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">No technicians available.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
