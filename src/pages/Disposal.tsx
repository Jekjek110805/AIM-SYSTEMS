import React from 'react';
import { 
  Trash2, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Clock,
  FileText,
  Archive,
  FileBarChart,
  ClipboardList,
  Search,
  Filter,
  ChevronRight,
  Calendar,
  User,
  MoreVertical,
  Download,
  Plus,
  TrendingDown,
  ShieldAlert,
  Bell,
  PlusCircle,
  LayoutDashboard
} from 'lucide-react';
import { useAuth } from '../AuthContext';
import { cn } from '../lib/utils';
import { useSearchParams } from 'react-router-dom';

export default function Disposal() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (searchParams.get('tab') as any) || 
    (user?.role === 'maintenance' ? 'reports' : 
     user?.role === 'custodian' ? 'request' : 'requests');

  const setActiveTab = (tab: string) => {
    setSearchParams({ tab });
  };

  const renderAdminView = () => (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Asset Disposal</h2>
          <p className="text-gray-500">Manage the retirement and disposal of end-of-life assets.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors shadow-sm">
          <Trash2 size={18} />
          <span>New Disposal Request</span>
        </button>
      </div>

      {/* Admin Tabs */}
      <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {[
          { id: 'requests', label: 'Disposal Requests', icon: FileText },
          { id: 'retirement', label: 'Asset Retirement', icon: Archive },
          { id: 'reports', label: 'Disposal Reports', icon: FileBarChart },
          { id: 'logs', label: 'Disposal Logs', icon: ClipboardList },
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
        {activeTab === 'requests' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: 'Pending Approval', value: 5, icon: Clock, color: 'text-amber-600 bg-amber-50' },
                { label: 'Approved', value: 12, icon: CheckCircle, color: 'text-green-600 bg-green-50' },
                { label: 'Rejected', value: 2, icon: XCircle, color: 'text-red-600 bg-red-50' },
                { label: 'Total Disposed', value: 45, icon: Trash2, color: 'text-gray-600 bg-gray-50' },
              ].map((stat, i) => (
                <div key={i} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className={cn("p-3 rounded-lg", stat.color)}>
                      <stat.icon size={24} />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 font-medium">{stat.label}</p>
                      <h3 className="text-2xl font-bold text-gray-900">{stat.value}</h3>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <h3 className="font-bold text-gray-900">Incoming Disposal Requests</h3>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                    <input type="text" placeholder="Search requests..." className="pl-9 pr-4 py-1.5 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-red-500" />
                  </div>
                  <button className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg border border-gray-200"><Filter size={18} /></button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-100 text-xs font-bold text-gray-500 uppercase">
                      <th className="px-6 py-4">Asset</th>
                      <th className="px-6 py-4">Reason</th>
                      <th className="px-6 py-4">Requested By</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {[
                      { asset: 'Old Rescue Boat', code: 'RES-0089', reason: 'Structural Damage', requester: 'Admin', status: 'Pending', date: '2024-03-25' },
                      { asset: 'Damaged Drone Unit', code: 'DRN-0012', reason: 'Beyond Repair', requester: 'Maintenance', status: 'Pending', date: '2024-03-27' },
                    ].map((req, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-gray-900">{req.asset}</span>
                            <span className="text-xs text-gray-500 font-mono">{req.code}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{req.reason}</td>
                        <td className="px-6 py-4 text-sm">{req.requester}</td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 bg-amber-50 text-amber-700 rounded text-[10px] font-bold uppercase">{req.status}</span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button className="px-3 py-1 bg-green-600 text-white rounded text-xs font-bold hover:bg-green-700 transition-colors">Approve</button>
                            <button className="px-3 py-1 bg-red-50 text-red-600 rounded text-xs font-bold hover:bg-red-100 transition-colors">Reject</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'retirement' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-lg font-bold text-gray-900">Assets Ready for Retirement</h3>
              </div>
              <div className="divide-y divide-gray-100">
                {[
                  { name: 'Rescue Truck 04', code: 'VH-004', age: '12 Years', condition: 'Poor' },
                  { name: 'Satellite Phone Set B', code: 'COM-022', age: '8 Years', condition: 'Obsolete' },
                ].map((asset, i) => (
                  <div key={i} className="p-6 flex items-center justify-between hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center text-red-600">
                        <ShieldAlert size={24} />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900">{asset.name}</h4>
                        <p className="text-xs text-gray-500 font-mono">{asset.code} • {asset.age} Old</p>
                        <p className="text-sm text-gray-600 mt-1">Condition: <span className="font-bold text-red-600">{asset.condition}</span></p>
                      </div>
                    </div>
                    <button className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-bold hover:bg-slate-800 transition-colors">
                      Retire Asset
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Retirement Policy</h3>
              <div className="space-y-4 text-sm text-gray-600">
                <p>Assets are eligible for retirement if they meet any of the following criteria:</p>
                <ul className="list-disc pl-4 space-y-2">
                  <li>Beyond economical repair (BER)</li>
                  <li>Technologically obsolete</li>
                  <li>Structural safety concerns</li>
                  <li>Exceeded maximum service life (10+ years)</li>
                </ul>
                <div className="pt-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
                  <p className="text-blue-700 font-medium">All retired assets must be documented and have their serial numbers removed from active inventory.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <TrendingDown size={20} className="text-red-600" />
                Disposal Analytics
              </h3>
              <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-100 rounded-xl">
                <p className="text-gray-400 font-medium">Disposal Trends Chart</p>
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-6">Annual Disposal Summary</h3>
              <div className="space-y-4">
                {[
                  { category: 'Vehicles', count: 3, value: '₱45,000' },
                  { category: 'Electronics', count: 15, value: '₱12,500' },
                  { category: 'Equipment', count: 8, value: '₱8,200' },
                  { category: 'Furniture', count: 20, value: '₱3,500' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <span className="font-bold text-gray-700">{item.category}</span>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900">{item.count} Units</p>
                      <p className="text-[10px] text-gray-500 font-bold uppercase">Value: {item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
              <button className="w-full mt-6 py-3 bg-blue-600 text-white rounded-xl font-bold flex items-center justify-center gap-2">
                <Download size={18} />
                Generate Full Report
              </button>
            </div>
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Disposal History Logs</h3>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                  <input type="text" placeholder="Search logs..." className="pl-9 pr-4 py-1.5 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <button className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg border border-gray-200"><Filter size={18} /></button>
              </div>
            </div>
            <div className="divide-y divide-gray-100">
              {[
                { asset: 'Rescue Boat 08', code: 'RES-008', method: 'Scrapped', date: '2024-02-15', value: '₱500.00' },
                { asset: 'Old Server Rack', code: 'IT-044', method: 'Donated', date: '2024-01-20', value: '₱0.00' },
                { asset: 'Patrol Vehicle 02', code: 'VH-002', method: 'Auctioned', date: '2023-12-10', value: '₱5,200.00' },
              ].map((log, i) => (
                <div key={i} className="p-6 flex items-center justify-between hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-600">
                      <Trash2 size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">{log.asset}</h4>
                      <p className="text-xs text-gray-500 font-mono">{log.code} • Disposed via {log.method}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium text-gray-500">{log.date}</p>
                    <p className="text-xs font-bold text-green-600 mt-1">Recovery: {log.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderCustodianView = () => (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Asset Disposal</h2>
          <p className="text-gray-500">Request asset retirement and track disposal status.</p>
        </div>
        <button className="px-4 py-2 bg-red-600 text-white rounded-lg font-bold flex items-center gap-2 hover:bg-red-700 transition-colors">
          <Trash2 size={18} />
          <span>New Disposal Request</span>
        </button>
      </div>

      {/* Custodian Tabs */}
      <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {[
          { id: 'request', label: 'Disposal Requests', icon: Trash2 },
          { id: 'status', label: 'Request Status', icon: ClipboardList },
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
        {activeTab === 'request' && (
          <div className="bg-white p-12 rounded-2xl border border-dashed border-gray-300 text-center">
            <Trash2 size={48} className="text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-900">Retire an Asset?</h3>
            <p className="text-gray-500 mt-2 max-w-md mx-auto">If an asset is beyond repair or obsolete, you can request its disposal here.</p>
            <button className="mt-6 px-8 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-200">
              Create Disposal Request
            </button>
          </div>
        )}

        {activeTab === 'status' && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-gray-50/50 font-bold text-gray-900">Disposal Request Status</div>
            <div className="divide-y divide-gray-100">
              {[
                { asset: 'Old Rescue Boat', code: 'RES-0089', status: 'Approved', date: '2024-03-25' },
              ].map((req, i) => (
                <div key={i} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center text-red-600">
                      <Trash2 size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">{req.asset}</h4>
                      <p className="text-xs text-gray-500 font-mono">{req.code} • Requested on {req.date}</p>
                    </div>
                  </div>
                  <span className={cn("px-2.5 py-1 rounded-full text-xs font-bold uppercase", 
                    req.status === 'Approved' ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                  )}>
                    {req.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'alerts' && (
          <div className="space-y-4">
            <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex gap-4">
              <div className="p-2 bg-red-100 text-red-600 rounded-lg h-fit">
                <Bell size={20} />
              </div>
              <div>
                <h4 className="font-bold text-gray-900">Disposal Approved</h4>
                <p className="text-sm text-gray-600">Your request to dispose of 'Old Rescue Boat' has been approved. Please coordinate with maintenance for pickup.</p>
                <span className="text-[10px] text-gray-500 font-bold uppercase mt-2 block">3 days ago</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderMaintenanceView = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Inspection Reports</h2>
      </div>

      {/* Maintenance Tabs */}
      <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {[
          { id: 'reports', label: 'Inspection Reports', icon: FileText },
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
        {activeTab === 'reports' && (
          <div className="bg-white p-8 rounded-xl border border-dashed border-gray-200 text-center">
            <FileText size={48} className="text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-900">Submit Inspection Report</h3>
            <p className="text-gray-500 mt-2">Recommend assets for disposal based on technical inspection.</p>
            <button className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg font-bold">New Report</button>
          </div>
        )}

        {activeTab === 'alerts' && (
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl flex gap-4">
              <div className="p-2 bg-blue-100 text-blue-600 rounded-lg h-fit">
                <Bell size={20} />
              </div>
              <div>
                <h4 className="font-bold text-gray-900">Inspection Required</h4>
                <p className="text-sm text-gray-600">A new disposal request for 'Damaged Drone Unit' requires a technical inspection report.</p>
                <span className="text-[10px] text-gray-500 font-bold uppercase mt-2 block">5 hours ago</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="animate-in fade-in duration-500">
      {user?.role === 'admin' && renderAdminView()}
      {user?.role === 'custodian' && renderCustodianView()}
      {user?.role === 'maintenance' && renderMaintenanceView()}
    </div>
  );
}
