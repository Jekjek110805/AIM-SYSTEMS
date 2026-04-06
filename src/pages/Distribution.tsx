import React, { useEffect, useMemo, useState } from 'react';
import locationMapImg from '../Location Map.png';
import {
  ArrowLeftRight,
  UserPlus,
  MapPin,
  Search,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  ClipboardList,
  Activity,
  Plus,
  Filter,
  Download,
  Box,
  Clock,
  Bell,
  ArrowUpRight,
  Truck,
  RotateCcw,
  ShieldAlert,
  ThumbsUp,
  X,
  Send as SendIcon,
  Eye,
  Users,
  Map as MapIcon,
} from 'lucide-react';
import { useAuth } from '../AuthContext';
import { cn } from '../lib/utils';
import { useSearchParams } from 'react-router-dom';
import { Asset, User } from '../types';

type AssignmentRecord = {
  id: number;
  assetId: number;
  assetName: string;
  assetCode: string;
  assigneeId: number;
  assigneeName: string;
  assigneeRole: string;
  location: string;
  notes: string;
  expectedReturnDate: string;
  status: 'Assigned' | 'Returned Good' | 'Returned Reported' | 'Transferred';
  operator?: string;
  receiver?: string;
  createdAt: string;
};

type TransferRecord = {
  id: number;
  assetId: number;
  assetName: string;
  assetCode: string;
  from: string;
  to: string;
  requestedBy: string;
  status: 'Pending Approval' | 'Approved' | 'In Transit' | 'Completed' | 'Declined';
  date: string;
};

type HandoverRecord = {
  id: number;
  assetName: string;
  assetCode: string;
  from: string;
  to: string;
  confirmedAt: string;
};

type InspectionRecord = {
  id: number;
  assetId: number;
  assetName: string;
  assetCode: string;
  inspector: string;
  result: 'Ready' | 'Not Ready';
  notes: string;
  date: string;
};

type AssignmentFormState = {
  assetId: string;
  userId: string;
  location: string;
  expectedReturnDate: string;
  notes: string;
};

type TransferFormState = {
  assetId: string;
  from: string;
  to: string;
};

type DeploymentFormState = {
  assetId: string;
  operator: string;
  receiver: string;
  location: string;
  notes: string;
};

const DISTRIBUTION_STORAGE_KEY = 'aims-distribution-data';

export default function Distribution() {
  const { user, token } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [assets, setAssets] = useState<Asset[]>([]);
  const [users, setUsers] = useState<(User & { is_on_duty?: boolean })[]>([]);
  const [loading, setLoading] = useState(true);

  const [message, setMessage] = useState('');
  const [trackingQuery, setTrackingQuery] = useState('');
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showDeploymentModal, setShowDeploymentModal] = useState(false);
  const [showHandoverModal, setShowHandoverModal] = useState(false);

  const [assignmentForm, setAssignmentForm] = useState<AssignmentFormState>({
    assetId: '',
    userId: '',
    location: '',
    expectedReturnDate: '',
    notes: '',
  });

  const [transferForm, setTransferForm] = useState<TransferFormState>({
    assetId: '',
    from: '',
    to: '',
  });

  const [deploymentForm, setDeploymentForm] = useState<DeploymentFormState>({
    assetId: '',
    operator: '',
    receiver: '',
    location: '',
    notes: '',
  });

  const [handoverForm, setHandoverForm] = useState({
    assetId: '',
    from: '',
    to: '',
  });

  const [showInspectionModal, setShowInspectionModal] = useState(false);
  const [inspectionAsset, setInspectionAsset] = useState<{id: number, name: string, code: string} | null>(null);
  const [inspectionResult, setInspectionResult] = useState<'damaged' | 'good' | null>(null);

  const [assignments, setAssignments] = useState<AssignmentRecord[]>([]);
  const [transfers, setTransfers] = useState<TransferRecord[]>([]);
  const [handoverRecords, setHandoverRecords] = useState<HandoverRecord[]>([]);
  const [inspectionLogs, setInspectionLogs] = useState<InspectionRecord[]>([]);

  const activeTab =
    (searchParams.get('tab') as string) ||
    (user?.role === 'maintenance'
      ? 'readiness'
      : user?.role === 'custodian'
        ? 'deployment'
        : 'assignment');

  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnForm, setReturnForm] = useState({
    assetId: 0,
    assignmentId: 0,
    condition: 'Good' as 'Good' | 'Damaged',
    isVerified: false,
    notes: ''
  });

  const setActiveTab = (tab: string) => setSearchParams({ tab });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [assetsRes, usersRes, assignmentsRes] = await Promise.all([
          fetch('/api/assets', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/users', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/assignments', { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        const assetsData = await assetsRes.json();
        const usersData = await usersRes.json();
        const assignmentsData = await assignmentsRes.json();
        
        setAssets(assetsData);
        setUsers(usersData);
        
        if (Array.isArray(assignmentsData)) {
          setAssignments(assignmentsData.map((a: any) => ({
            id: a.assignment_id || a.id,
            assetId: a.id,
            assetName: a.name,
            assetCode: a.code,
            assigneeId: a.user_id,
            assigneeName: a.assigned_to_name,
            assigneeRole: 'custodian',
            location: a.location || 'Unassigned',
            notes: a.assignment_notes || '',
            expectedReturnDate: '',
            status: 'Assigned',
            operator: a.operator,
            receiver: a.receiver,
            createdAt: a.assigned_at,
          })));
        }

        // Handle auto-selection from query params
        const queryAssetId = searchParams.get('assetId');
        if (queryAssetId) {
          setAssignmentForm(prev => ({ ...prev, assetId: queryAssetId }));
          setDeploymentForm(prev => ({ ...prev, assetId: queryAssetId }));
          if (user?.role === 'custodian') {
            setShowDeploymentModal(true);
            setActiveTab('deployment');
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token]);

  useEffect(() => {
    const raw = localStorage.getItem(DISTRIBUTION_STORAGE_KEY);
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw);
      setAssignments(parsed.assignments || []);
      setTransfers(parsed.transfers || []);
      setHandoverRecords(parsed.handoverRecords || []);
      setInspectionLogs(parsed.inspectionLogs || []);
    } catch (error) {
      console.error('Failed to load distribution state:', error);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      DISTRIBUTION_STORAGE_KEY,
      JSON.stringify({ assignments, transfers, handoverRecords, inspectionLogs })
    );
  }, [assignments, transfers, handoverRecords, inspectionLogs]);

  useEffect(() => {
    if (!message) return;
    const timeout = window.setTimeout(() => setMessage(''), 2500);
    return () => window.clearTimeout(timeout);
  }, [message]);

  const assetLookup = useMemo(
    () => Object.fromEntries(assets.map((asset) => [asset.id, asset])),
    [assets]
  );

  const assignedAssetIds = useMemo(
    () =>
      new Set(
        assignments
          .filter((item) => item.status === 'Assigned' || item.status === 'Transferred')
          .map((item) => item.assetId)
      ),
    [assignments]
  );

  const availableAssets = useMemo(
    () =>
      assets.filter(
        (asset) => asset.status === 'Available'
      ),
    [assets]
  );

  const trackingItems = useMemo(() => {
    const rows = assignments
      .filter((item) => item.status === 'Assigned' || item.status === 'Transferred')
      .map((item) => ({
        id: item.id,
        assetId: item.assetId,
        name: item.assetName,
        code: item.assetCode,
        location: item.location || assetLookup[item.assetId]?.location || 'Unspecified',
        user: item.assigneeName,
        status: assetLookup[item.assetId]?.status === 'Under Maintenance' ? 'Maintenance' : 'Active',
        time: item.createdAt,
      }));

    if (!trackingQuery.trim()) return rows;
    const q = trackingQuery.toLowerCase();
    return rows.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.code.toLowerCase().includes(q) ||
        item.location.toLowerCase().includes(q) ||
        item.user.toLowerCase().includes(q)
    );
  }, [assignments, assetLookup, trackingQuery]);

  const availabilityStats = useMemo(() => {
    const groups = new Map<string, { total: number; available: number }>();

    assets.forEach((asset) => {
      const key = asset.category_name || 'Uncategorized';
      const current = groups.get(key) || { total: 0, available: 0 };
      current.total += 1;
      if (!assignedAssetIds.has(asset.id) && asset.status === 'Available') current.available += 1;
      groups.set(key, current);
    });

    return Array.from(groups.entries())
      .slice(0, 4)
      .map(([label, value], index) => ({
        label,
        total: value.total,
        available: value.available,
        color: ['bg-blue-500', 'bg-indigo-500', 'bg-amber-500', 'bg-green-500'][index % 4],
      }));
  }, [assets, assignedAssetIds]);

  const resetAssignmentForm = () =>
    setAssignmentForm({ assetId: '', userId: '', location: '', expectedReturnDate: '', notes: '' });

  const handleAssignAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    const asset = assets.find((item) => item.id === Number(assignmentForm.assetId));
    const assignee = users.find((item) => item.id === Number(assignmentForm.userId));
    if (!asset || !assignee || !assignmentForm.location.trim()) return;

    try {
      const res = await fetch('/api/assignments', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          asset_id: Number(assignmentForm.assetId),
          user_id: Number(assignmentForm.userId),
          location: assignmentForm.location,
        })
      });
      
      if (res.ok) {
        const record: AssignmentRecord = {
          id: Date.now(),
          assetId: asset.id,
          assetName: asset.name,
          assetCode: asset.code,
          assigneeId: assignee.id,
          assigneeName: assignee.username,
          assigneeRole: assignee.role,
          location: assignmentForm.location,
          notes: assignmentForm.notes,
          expectedReturnDate: assignmentForm.expectedReturnDate,
          status: 'Assigned',
          createdAt: new Date().toLocaleString(),
        };

        setAssignments((prev) => [record, ...prev]);
        setAssets((prev) =>
          prev.map((item) =>
            item.id === asset.id ? { ...item, status: 'Transferred', location: assignmentForm.location } : item
          )
        );
        resetAssignmentForm();
        setSearchParams({}); // Clear query params
        setMessage('Asset assignment created.');
        setActiveTab('logs');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    const asset = assets.find((item) => item.id === Number(transferForm.assetId));
    if (!asset || !transferForm.from.trim() || !transferForm.to.trim()) return;

    const record: TransferRecord = {
      id: Date.now(),
      assetId: asset.id,
      assetName: asset.name,
      assetCode: asset.code,
      from: transferForm.from,
      to: transferForm.to,
      requestedBy: user?.username || 'User',
      status: user?.role === 'admin' ? 'In Transit' : 'Pending Approval',
      date: new Date().toLocaleString(),
    };

    setTransfers((prev) => [record, ...prev]);
    setTransferForm({ assetId: '', from: '', to: '' });
    setShowTransferModal(false);
    setMessage(user?.role === 'admin' ? 'Transfer started.' : 'Transfer request submitted.');
  };

  const updateTransferStatus = (id: number, status: TransferRecord['status']) => {
    setTransfers((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status } : item))
    );
    setMessage(`Transfer marked as ${status}.`);
  };

  const handleDeployment = async (e: React.FormEvent) => {
    e.preventDefault();
    const asset = assets.find((item) => item.id === Number(deploymentForm.assetId));
    if (!asset || !deploymentForm.location.trim()) return;

    try {
      const res = await fetch('/api/assignments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          asset_id: asset.id,
          user_id: user?.id,
          location: deploymentForm.location,
          notes: deploymentForm.notes,
          operator: deploymentForm.operator,
          receiver: deploymentForm.receiver
        })
      });

      if (res.ok) {
        const record: AssignmentRecord = {
          id: Date.now(),
          assetId: asset.id,
          assetName: asset.name,
          assetCode: asset.code,
          assigneeId: user?.id || 0,
          assigneeName: deploymentForm.operator || user?.username || 'Custodian',
          assigneeRole: user?.role || 'custodian',
          location: deploymentForm.location,
          notes: deploymentForm.notes,
          expectedReturnDate: '',
          status: 'Assigned',
          operator: deploymentForm.operator,
          receiver: deploymentForm.receiver,
          createdAt: new Date().toLocaleString(),
        };

        setAssignments((prev) => [record, ...prev]);
        setAssets((prev) =>
          prev.map((item) =>
            item.id === asset.id ? { ...item, status: 'Transferred', location: deploymentForm.location } : item
          )
        );
        setDeploymentForm({ assetId: '', operator: '', receiver: '', location: '', notes: '' });
        setShowDeploymentModal(false);
        setSearchParams({}); // Clear query params
        setMessage(`Deployment recorded. Operator: ${deploymentForm.operator || 'N/A'}, Receiver: ${deploymentForm.receiver || 'N/A'}`);
      } else {
        setMessage('Failed to record deployment');
      }
    } catch (err) {
      console.error(err);
      setMessage('Error recording deployment');
    }
  };

  const handleReturnAsset = async () => {
    if (!returnForm.assignmentId) return;

    try {
      const res = await fetch(`/api/assignments/${returnForm.assignmentId}/return`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ condition: returnForm.condition })
      });

      if (res.ok) {
        // If damaged and verified, create maintenance request
        if (returnForm.condition === 'Damaged' && returnForm.isVerified) {
          await fetch('/api/maintenance', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}` 
            },
            body: JSON.stringify({
              asset_id: returnForm.assetId,
              issue_description: `Reported Damaged by Custodian: ${returnForm.notes}`,
              priority: 'High'
            })
          });
        }

        setAssignments((prev) =>
          prev.map((a) =>
            a.id === returnForm.assignmentId ? { ...a, status: returnForm.condition === 'Damaged' ? 'Returned Reported' : 'Returned Good' } : a
          )
        );
        setAssets((prev) =>
          prev.map((asset) =>
            asset.id === returnForm.assetId ? { ...asset, status: returnForm.condition === 'Damaged' ? 'Under Maintenance' : 'Available' } : asset
          )
        );
        setShowReturnModal(false);
        setMessage(returnForm.condition === 'Damaged' ? 'Asset returned and sent to maintenance.' : 'Asset returned in good condition.');
        setReturnForm({ assetId: 0, assignmentId: 0, condition: 'Good', isVerified: false, notes: '' });
      }
    } catch (err) {
      console.error(err);
      setMessage('Error processing return');
    }
  };

  const handleConfirmHandover = (e: React.FormEvent) => {
    e.preventDefault();
    const asset = assets.find((item) => item.id === Number(handoverForm.assetId));
    if (!asset || !handoverForm.from.trim() || !handoverForm.to.trim()) return;

    setHandoverRecords((prev) => [
      {
        id: Date.now(),
        assetName: asset.name,
        assetCode: asset.code,
        from: handoverForm.from,
        to: handoverForm.to,
        confirmedAt: new Date().toLocaleString(),
      },
      ...prev,
    ]);
    setHandoverForm({ assetId: '', from: '', to: '' });
    setShowHandoverModal(false);
    setMessage('Handover confirmed.');
  };

  const handleReadinessCheck = (result: InspectionRecord['result']) => {
    const asset = availableAssets[0] || assets[0];
    if (!asset) return;

    const record: InspectionRecord = {
      id: Date.now(),
      assetId: asset.id,
      assetName: asset.name,
      assetCode: asset.code,
      inspector: user?.username || 'Maintenance',
      result,
      notes: result === 'Ready' ? 'Cleared for deployment.' : 'Needs additional maintenance checks.',
      date: new Date().toLocaleString(),
    };

    setInspectionLogs((prev) => [record, ...prev]);
    setAssets((prev) =>
      prev.map((item) =>
        item.id === asset.id ? { ...item, status: result === 'Ready' ? 'Available' : 'Under Maintenance' } : item
      )
    );
    setMessage(`Readiness check saved: ${result}.`);
  };

  const exportLogs = () => {
    const rows = [
      ...assignments.map((item) => `${item.createdAt} | Assignment | ${item.assetCode} | ${item.assigneeName} | ${item.status}`),
      ...transfers.map((item) => `${item.date} | Transfer | ${item.assetCode} | ${item.from} -> ${item.to} | ${item.status}`),
      ...inspectionLogs.map((item) => `${item.date} | Inspection | ${item.assetCode} | ${item.inspector} | ${item.result}`),
    ];
    const blob = new Blob([rows.join('\n') || 'No logs available'], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'distribution-logs.txt';
    a.click();
    URL.revokeObjectURL(url);
    setMessage('Distribution logs exported.');
  };

  const adminLogs = useMemo(() => {
    return [
      ...assignments.map((item) => ({
        id: `a-${item.id}`,
        action: 'Asset Assigned',
        asset: item.assetCode,
        details: `Assigned to ${item.assigneeName} at ${item.location}`,
        admin: user?.username || 'Admin',
        date: item.createdAt,
      })),
      ...transfers.map((item) => ({
        id: `t-${item.id}`,
        action: 'Transfer Update',
        asset: item.assetCode,
        details: `${item.from} to ${item.to}`,
        admin: item.requestedBy,
        date: item.date,
      })),
      ...inspectionLogs.map((item) => ({
        id: `i-${item.id}`,
        action: 'Readiness Check',
        asset: item.assetCode,
        details: `${item.result} by ${item.inspector}`,
        admin: item.inspector,
        date: item.date,
      })),
    ].sort((a, b) => b.date.localeCompare(a.date));
  }, [assignments, transfers, inspectionLogs, user?.username]);

  const renderAdminView = () => (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Asset Distribution</h2>
          <p className="text-gray-500">Manage asset assignments, transfers, and real-time tracking.</p>
        </div>
        {message && <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-2 text-sm text-green-700">{message}</div>}
      </div>

      <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {[
          { id: 'assignment', label: 'Asset Assignment', icon: UserPlus },
          { id: 'transfers', label: 'Asset Transfers', icon: ArrowLeftRight },
          { id: 'tracking', label: 'Location Tracking', icon: MapPin },
          { id: 'availability', label: 'Availability Monitoring', icon: CheckCircle },
          { id: 'logs', label: 'Transfer Logs', icon: ClipboardList },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all',
              activeTab === tab.id ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
            )}
          >
            <tab.icon size={16} />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {activeTab === 'assignment' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-6">New Asset Assignment</h3>
            <form className="space-y-6" onSubmit={handleAssignAsset}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Select Asset</label>
                  <select
                    value={assignmentForm.assetId}
                    onChange={(e) => setAssignmentForm({ ...assignmentForm, assetId: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="">Select an asset...</option>
                    {availableAssets.map((asset) => (
                      <option key={asset.id} value={asset.id}>{asset.name} ({asset.code})</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Assign to User/Custodian</label>
                  <select
                    value={assignmentForm.userId}
                    onChange={(e) => setAssignmentForm({ ...assignmentForm, userId: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="">Select personnel...</option>
                    {users
                      .filter((item) => item.is_on_duty !== false)
                      .map((item) => (
                        <option key={item.id} value={item.id}>{item.username} ({item.role})</option>
                      ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Deployment Location</label>
                  <input
                    type="text"
                    value={assignmentForm.location}
                    onChange={(e) => setAssignmentForm({ ...assignmentForm, location: e.target.value })}
                    placeholder="e.g. Station B - Command Post"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Expected Return Date (Optional)</label>
                  <input
                    type="date"
                    value={assignmentForm.expectedReturnDate}
                    onChange={(e) => setAssignmentForm({ ...assignmentForm, expectedReturnDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Assignment Notes</label>
                <textarea
                  rows={3}
                  value={assignmentForm.notes}
                  onChange={(e) => setAssignmentForm({ ...assignmentForm, notes: e.target.value })}
                  placeholder="Add any specific instructions or deployment details..."
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                />
              </div>
              <button type="submit" className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200">
                Assign Asset
              </button>
            </form>
          </div>
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Stats</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><Box size={18} /></div>
                    <span className="text-sm font-medium text-gray-700">Assigned Today</span>
                  </div>
                  <span className="text-lg font-bold text-blue-700">{assignments.filter((a) => a.status === 'Assigned').length}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-amber-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-100 text-amber-600 rounded-lg"><Clock size={18} /></div>
                    <span className="text-sm font-medium text-gray-700">Pending Return</span>
                  </div>
                  <span className="text-lg font-bold text-amber-700">{assignments.filter((a) => a.status === 'Assigned').length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'transfers' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Active Asset Transfers</h3>
              <button onClick={() => setShowTransferModal(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors">
                <Plus size={16} />
                <span>New Transfer</span>
              </button>
            </div>
            <div className="divide-y divide-gray-100">
              {transfers.length === 0 ? (
                <div className="p-8 text-center text-gray-500">No transfer records yet.</div>
              ) : (
                transfers.map((transfer) => (
                  <div key={transfer.id} className="p-6 flex items-center justify-between hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                        <ArrowLeftRight size={24} />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900">{transfer.assetName}</h4>
                        <p className="text-xs text-gray-500 font-mono">{transfer.assetCode}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-500">{transfer.from}</span>
                          <ChevronRight size={12} className="text-gray-300" />
                          <span className="text-xs font-bold text-blue-600">{transfer.to}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={cn('px-2.5 py-1 rounded-full text-[10px] font-bold uppercase', transfer.status === 'Pending Approval' ? 'bg-amber-100 text-amber-700' : transfer.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700')}>
                        {transfer.status}
                      </span>
                      {transfer.status === 'Pending Approval' && (
                        <button onClick={() => updateTransferStatus(transfer.id, 'Approved')} className="px-3 py-1 text-xs font-bold bg-blue-600 text-white rounded-lg">
                          Approve
                        </button>
                      )}
                      {transfer.status === 'Approved' && (
                        <button onClick={() => updateTransferStatus(transfer.id, 'Completed')} className="px-3 py-1 text-xs font-bold bg-green-600 text-white rounded-lg">
                          Complete
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Transfer Requests</h3>
            <div className="space-y-4">
              {transfers.filter((item) => item.status === 'Pending Approval' || item.status === 'Approved').length === 0 ? (
                <div className="text-sm text-gray-500">No pending requests.</div>
              ) : (
                transfers
                  .filter((item) => item.status === 'Pending Approval' || item.status === 'Approved')
                  .map((item) => (
                    <div key={item.id} className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                      <p className="text-sm text-gray-600 mb-3">
                        <span className="font-bold text-gray-900">{item.requestedBy}</span> requested <span className="font-bold text-gray-900">{item.assetName}</span> for {item.to}.
                      </p>
                      <div className="flex gap-2">
                        <button onClick={() => updateTransferStatus(item.id, 'Approved')} className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700">Approve</button>
                        <button onClick={() => updateTransferStatus(item.id, 'Declined')} className="flex-1 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg text-xs font-bold hover:bg-gray-50">Decline</button>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'tracking' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900">Real-Time Location Tracking</h3>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                <input value={trackingQuery} onChange={(e) => setTrackingQuery(e.target.value)} type="text" placeholder="Filter by asset, user, or location..." className="pl-9 pr-4 py-1.5 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <button onClick={() => setTrackingQuery('')} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg border border-gray-200"><Filter size={18} /></button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-100 text-xs font-bold text-gray-500 uppercase">
                  <th className="px-6 py-4">Asset</th>
                  <th className="px-6 py-4">Current Location</th>
                  <th className="px-6 py-4">Assigned To</th>
                  <th className="px-6 py-4">Last Updated</th>
                  <th className="px-6 py-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {trackingItems.length === 0 ? (
                  <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">No active tracked assignments.</td></tr>
                ) : trackingItems.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4"><div className="flex flex-col"><span className="font-bold text-gray-900">{item.name}</span><span className="text-xs text-gray-500 font-mono">{item.code}</span></div></td>
                    <td className="px-6 py-4"><div className="flex items-center gap-2 text-gray-600"><MapPin size={14} className="text-blue-500" /><span>{item.location}</span></div></td>
                    <td className="px-6 py-4 text-gray-600 font-medium">{item.user}</td>
                    <td className="px-6 py-4 text-gray-500">{item.time}</td>
                    <td className="px-6 py-4 text-right">
                      <span className={cn('px-2 py-1 rounded text-[10px] font-bold uppercase', item.status === 'Active' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700')}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-6 border-t border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <MapIcon size={18} className="text-white" />
                <h4 className="font-bold text-white">Brgy. Paknaan - Location Guide</h4>
              </div>
            </div>
            <div className="space-y-3 mb-3">
              <h1 className="text-sm font-bold text-white">DEPLOYED ASSETS BY LOCATION:</h1>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
                {(() => {
                  const locationCounts = trackingItems.reduce((acc, item) => {
                    acc[item.location] = (acc[item.location] || 0) + 1;
                    return acc;
                  }, {} as Record<string, number>);
                  return Object.entries(locationCounts)
                    .sort(([,a], [,b]) => b - a)
                    .map(([loc, count]) => (
                      <div key={loc} className="bg-[#0f2744] px-3 py-2 rounded-lg border border-slate-500">
                        <span className="text-xs text-blue-300 uppercase">{loc}</span>
                        <h1 className="text-xl font-bold text-white">{count}</h1>
                      </div>
                    ));
                })()}
              </div>
            </div>
            <div className="relative h-[700px] w-full rounded-xl overflow-hidden border border-slate-500 bg-[#1e3a5f] flex items-center justify-center">
              <img 
                src={locationMapImg} 
                alt="Location Map - Brgy. Paknaan" 
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        </div>
      )}

      {activeTab === 'availability' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {availabilityStats.length === 0 ? (
            <div className="col-span-full bg-white p-8 rounded-2xl border border-gray-100 shadow-sm text-center text-gray-500">
              No availability data yet.
            </div>
          ) : (
            availabilityStats.map((stat) => (
              <div key={stat.label} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-bold text-gray-900">{stat.label}</h4>
                  <Activity size={18} className="text-gray-300" />
                </div>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-3xl font-extrabold text-gray-900">{stat.available}</p>
                    <p className="text-xs text-gray-500 font-medium">Available of {stat.total}</p>
                  </div>
                  <div className="w-16 h-1 bg-gray-100 rounded-full overflow-hidden">
                    <div className={cn('h-full', stat.color)} style={{ width: `${stat.total ? (stat.available / stat.total) * 100 : 0}%` }} />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'logs' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900">Transfer & Movement Logs</h3>
            <button onClick={exportLogs} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors">
              <Download size={16} />
              <span>Export History</span>
            </button>
          </div>
          <div className="divide-y divide-gray-100">
            {adminLogs.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No logs yet.</div>
            ) : (
              adminLogs.map((log) => (
                <div key={log.id} className="p-6 flex items-center justify-between hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400">
                      <ClipboardList size={20} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-blue-600 uppercase">{log.action}</span>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs font-mono text-gray-500">{log.asset}</span>
                      </div>
                      <p className="text-sm font-bold text-gray-900 mt-0.5">{log.details}</p>
                      <p className="text-xs text-gray-500 mt-1">Processed by {log.admin}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium text-gray-500">{log.date}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {showTransferModal && (
        <Modal title="New Transfer" onClose={() => setShowTransferModal(false)}>
          <form className="space-y-4" onSubmit={handleCreateTransfer}>
            <select value={transferForm.assetId} onChange={(e) => setTransferForm({ ...transferForm, assetId: e.target.value })} className="w-full px-4 py-2 border border-gray-200 rounded-lg">
              <option value="">Select asset</option>
              {assets.map((asset) => <option key={asset.id} value={asset.id}>{asset.name} ({asset.code})</option>)}
            </select>
            <input value={transferForm.from} onChange={(e) => setTransferForm({ ...transferForm, from: e.target.value })} placeholder="From location" className="w-full px-4 py-2 border border-gray-200 rounded-lg" />
            <input value={transferForm.to} onChange={(e) => setTransferForm({ ...transferForm, to: e.target.value })} placeholder="To location" className="w-full px-4 py-2 border border-gray-200 rounded-lg" />
            <button className="w-full py-2 bg-blue-600 text-white rounded-lg font-bold">Save Transfer</button>
          </form>
        </Modal>
      )}
    </div>
  );

  const custodianAssignments = assignments.filter((item) => item.assigneeName === user?.username || item.assigneeRole === 'custodian');

  const renderCustodianView = () => (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Asset Distribution</h2>
          <p className="text-gray-500">Manage transfers and track asset movements.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowDeploymentModal(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 shadow-sm">
            <Truck size={18} />
            <span>New Deployment</span>
          </button>
          <button onClick={() => setShowTransferModal(true)} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 shadow-sm">
            <ArrowUpRight size={18} />
            <span>New Transfer Request</span>
          </button>
        </div>
      </div>

      <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {[
          { id: 'deployment', label: 'Deployment & Returns', icon: Truck },
          { id: 'transfers', label: 'Asset Transfers', icon: ArrowUpRight },
          { id: 'handover', label: 'Handover Confirmation', icon: CheckCircle },
          { id: 'tracking', label: 'Movement Tracking', icon: MapPin },
          { id: 'alerts', label: 'Alerts', icon: Bell },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all',
              activeTab === tab.id ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
            )}
          >
            <tab.icon size={16} />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {activeTab === 'deployment' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Deploy Asset</h3>
            <form className="space-y-4" onSubmit={handleDeployment}>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Select Available Asset</label>
                <select value={deploymentForm.assetId} onChange={(e) => setDeploymentForm({ ...deploymentForm, assetId: e.target.value })} className="w-full px-4 py-2 border border-gray-200 rounded-lg">
                  <option value="">Select asset to deploy...</option>
                  {availableAssets.map((asset) => <option key={asset.id} value={asset.id}>{asset.name} ({asset.code})</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Operator</label>
                  <input 
                    value={deploymentForm.operator} 
                    onChange={(e) => setDeploymentForm({ ...deploymentForm, operator: e.target.value })} 
                    placeholder="Operator Name" 
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Receiver</label>
                  <input 
                    value={deploymentForm.receiver} 
                    onChange={(e) => setDeploymentForm({ ...deploymentForm, receiver: e.target.value })} 
                    placeholder="Receiver Name" 
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg" 
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Deployment Location</label>
                <input 
                  value={deploymentForm.location} 
                  onChange={(e) => setDeploymentForm({ ...deploymentForm, location: e.target.value })} 
                  placeholder="Deployment location" 
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg" 
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Notes (Optional)</label>
                <textarea 
                  value={deploymentForm.notes} 
                  onChange={(e) => setDeploymentForm({ ...deploymentForm, notes: e.target.value })} 
                  placeholder="Notes" 
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg resize-none" 
                  rows={2} 
                />
              </div>
              <button className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200">
                Deploy Now
              </button>
            </form>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Return Assets</h3>
                <p className="text-gray-500 mt-1">Process assets being returned from the field or personnel.</p>
              </div>
            </div>
            {custodianAssignments.filter(item => item.status === 'Assigned').length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <RotateCcw size={32} className="mx-auto mb-2 text-gray-300" />
                <p>No assets pending return.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {custodianAssignments.filter(item => item.status === 'Assigned').map((item) => (
                  <div key={item.id} className="p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
                          <Box size={20} />
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900">{item.assetName}</h4>
                          <p className="text-xs text-gray-500 font-mono">{item.assetCode}</p>
                        </div>
                      </div>
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-[10px] font-bold uppercase">
                        {item.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button 
                        onClick={() => {
                          setReturnForm({ assetId: item.assetId, assignmentId: item.id, condition: 'Good', isVerified: true, notes: '' });
                          handleReturnAsset();
                        }} 
                        className="py-2 bg-green-600 text-white rounded-lg text-sm font-bold hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                      >
                        <ThumbsUp size={16} />
                        Return Good
                      </button>
                      <button 
                        onClick={() => {
                          setInspectionAsset({ id: item.assetId, name: item.assetName, code: item.assetCode });
                          setInspectionResult(null);
                          setShowInspectionModal(true);
                        }} 
                        className="py-2 bg-amber-600 text-white rounded-lg text-sm font-bold hover:bg-amber-700 transition-colors flex items-center justify-center gap-2"
                      >
                        <ShieldAlert size={16} />
                        Return with Issue
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="md:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-gray-50/50 font-bold text-gray-900">Recent Deployment Activity</div>
            <div className="divide-y divide-gray-100">
              {custodianAssignments.length === 0 ? (
                <div className="p-6 text-center text-gray-500">No deployment activity yet.</div>
              ) : (
                custodianAssignments.map((item) => (
                  <div key={item.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', item.status === 'Assigned' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600')}>
                        {item.status === 'Assigned' ? <Truck size={20} /> : <RotateCcw size={20} />}
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900">{item.assetName}</h4>
                        <p className="text-xs text-gray-500">{item.location}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={cn('px-2 py-0.5 rounded text-[10px] font-bold uppercase', item.status === 'Assigned' ? 'bg-blue-100 text-blue-700' : item.status === 'Returned Good' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700')}>
                        {item.status}
                      </span>
                      <span className="text-xs text-gray-400">{item.createdAt}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'transfers' && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50/50 font-bold text-gray-900">My Transfer Requests</div>
          <div className="divide-y divide-gray-100">
            {transfers.length === 0 ? (
              <div className="p-6 text-center text-gray-500">No transfer requests yet.</div>
            ) : (
              transfers.map((item) => (
                <div key={item.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center text-amber-600">
                      <ArrowUpRight size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">{item.assetName}</h4>
                      <p className="text-xs text-gray-500 font-mono">{item.assetCode} • To {item.to}</p>
                    </div>
                  </div>
                  <span className={cn('px-2.5 py-1 rounded-full text-xs font-bold uppercase', item.status === 'Pending Approval' ? 'bg-amber-100 text-amber-700' : item.status === 'Declined' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700')}>
                    {item.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'handover' && (
        <div className="bg-white p-12 rounded-2xl border border-dashed border-gray-300 text-center">
          <CheckCircle size={48} className="text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-gray-900">Confirm Handover</h3>
          <p className="text-gray-500 mt-2 max-w-md mx-auto">Confirm that you have physically handed over or received assets from another custodian or station.</p>
          <button onClick={() => setShowHandoverModal(true)} className="mt-6 px-8 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200">
            New Handover Confirmation
          </button>

          {handoverRecords.length > 0 && (
            <div className="mt-8 max-w-2xl mx-auto text-left space-y-3">
              {handoverRecords.map((record) => (
                <div key={record.id} className="p-4 rounded-xl border border-gray-100 bg-gray-50">
                  <div className="font-bold text-gray-900">{record.assetName} <span className="text-xs font-mono text-gray-500">{record.assetCode}</span></div>
                  <div className="text-sm text-gray-600 mt-1">{record.from} → {record.to}</div>
                  <div className="text-xs text-gray-400 mt-1">{record.confirmedAt}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'tracking' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Movement Tracking (Paknaan, Mandaue)</h3>
              <p className="text-sm text-gray-500">Asset location density and distribution in Brgy Paknaan</p>
            </div>
            <button onClick={() => map.current?.setView([10.3344, 123.9483], zoom)} className="px-3 py-1.5 text-xs font-bold bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors">
              Recenter to Paknaan
            </button>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                    <MapPin size={20} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-bold">Total Locations</p>
                    <p className="text-2xl font-bold text-gray-900">{trackingItems.length}</p>
                  </div>
                </div>
              </div>
              <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 text-green-600 rounded-lg">
                    <Box size={20} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-bold">Active Assets</p>
                    <p className="text-2xl font-bold text-gray-900">{trackingItems.filter(t => t.status === 'Active').length}</p>
                  </div>
                </div>
              </div>
              <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-100 text-amber-600 rounded-lg">
                    <Users size={20} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-bold">Unique Areas</p>
                    <p className="text-2xl font-bold text-gray-900">{new Set(trackingItems.map(t => t.location)).size}</p>
                  </div>
                </div>
              </div>
              <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                    <MapIcon size={20} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-bold">Density Score</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {trackingItems.length > 0 ? Math.round((trackingItems.length / 10) * 100) : 0}%
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative h-[700px] w-full rounded-xl overflow-hidden border border-slate-500 bg-[#1e3a5f] flex items-center justify-center">
              <img 
                src={locationMapImg} 
                alt="Location Map - Brgy. Paknaan" 
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        </div>
      )}

      {activeTab === 'alerts' && (
        <div className="space-y-4">
          {[...transfers.slice(0, 2), ...handoverRecords.slice(0, 1)].length === 0 ? (
            <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl text-sm text-blue-700">No active alerts.</div>
          ) : (
            <>
              {transfers.slice(0, 2).map((transfer) => (
                <div key={transfer.id} className="p-4 bg-blue-50 border border-blue-100 rounded-xl flex gap-4">
                  <div className="p-2 bg-blue-100 text-blue-600 rounded-lg h-fit"><Bell size={20} /></div>
                  <div>
                    <h4 className="font-bold text-gray-900">Transfer Request Update</h4>
                    <p className="text-sm text-gray-600">{transfer.assetName} transfer is currently {transfer.status.toLowerCase()}.</p>
                    <span className="text-[10px] text-gray-500 font-bold uppercase mt-2 block">{transfer.date}</span>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {showHandoverModal && (
        <Modal title="Confirm Handover" onClose={() => setShowHandoverModal(false)}>
          <form className="space-y-4" onSubmit={handleConfirmHandover}>
            <select value={handoverForm.assetId} onChange={(e) => setHandoverForm({ ...handoverForm, assetId: e.target.value })} className="w-full px-4 py-2 border border-gray-200 rounded-lg">
              <option value="">Select asset</option>
              {assets.map((asset) => <option key={asset.id} value={asset.id}>{asset.name} ({asset.code})</option>)}
            </select>
            <input value={handoverForm.from} onChange={(e) => setHandoverForm({ ...handoverForm, from: e.target.value })} placeholder="From custodian/station" className="w-full px-4 py-2 border border-gray-200 rounded-lg" />
            <input value={handoverForm.to} onChange={(e) => setHandoverForm({ ...handoverForm, to: e.target.value })} placeholder="To custodian/station" className="w-full px-4 py-2 border border-gray-200 rounded-lg" />
            <button className="w-full py-2 bg-blue-600 text-white rounded-lg font-bold">Confirm Handover</button>
          </form>
        </Modal>
      )}

      {showInspectionModal && inspectionAsset && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">Inspect Returned Asset</h3>
              <button onClick={() => setShowInspectionModal(false)} className="p-2 text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                    <Box size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">{inspectionAsset.name}</h4>
                    <p className="text-xs text-gray-500 font-mono">{inspectionAsset.code}</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">Inspection Result:</p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setInspectionResult('good')}
                    className={cn(
                      "py-3 rounded-xl border-2 font-bold transition-all flex flex-col items-center gap-2",
                      inspectionResult === 'good' 
                        ? "border-green-500 bg-green-50 text-green-700" 
                        : "border-gray-200 hover:border-green-300 text-gray-600"
                    )}
                  >
                    <CheckCircle size={24} />
                    <span>Good Condition</span>
                  </button>
                  <button
                    onClick={() => setInspectionResult('damaged')}
                    className={cn(
                      "py-3 rounded-xl border-2 font-bold transition-all flex flex-col items-center gap-2",
                      inspectionResult === 'damaged' 
                        ? "border-red-500 bg-red-50 text-red-700" 
                        : "border-gray-200 hover:border-red-300 text-gray-600"
                    )}
                  >
                    <ShieldAlert size={24} />
                    <span>Damaged</span>
                  </button>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => setShowInspectionModal(false)}
                  className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg font-bold hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    if (inspectionResult === 'good') {
                      setReturnForm({ ...returnForm, condition: 'Good', isVerified: true });
                    } else if (inspectionResult === 'damaged') {
                      setReturnForm({ ...returnForm, condition: 'Damaged', isVerified: true });
                    }
                    handleReturnAsset();
                    setShowInspectionModal(false);
                  }}
                  disabled={!inspectionResult}
                  className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <SendIcon size={16} />
                  {inspectionResult === 'damaged' ? 'Send to Maintenance' : 'Confirm Return'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderMaintenanceView = () => (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Deployment Readiness</h2>
          <p className="text-gray-500">Verify asset condition before deployment.</p>
        </div>
        {message && <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-2 text-sm text-green-700">{message}</div>}
      </div>

      <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {[
          { id: 'readiness', label: 'Readiness Check', icon: CheckCircle },
          { id: 'logs', label: 'Inspection Logs', icon: ClipboardList },
          { id: 'alerts', label: 'Alerts', icon: Bell },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all',
              activeTab === tab.id ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
            )}
          >
            <tab.icon size={16} />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {activeTab === 'readiness' && (
        <div className="bg-white p-8 rounded-xl border border-dashed border-gray-200 text-center">
          <AlertCircle size={48} className="text-blue-500 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-gray-900">Readiness Check</h3>
          <p className="text-gray-500 max-w-md mx-auto mt-2">
            Flag assets that are not ready for deployment or verify their current condition for distribution.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <button onClick={() => handleReadinessCheck('Ready')} className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700">
              Mark Current Asset Ready
            </button>
            <button onClick={() => handleReadinessCheck('Not Ready')} className="px-6 py-2 bg-amber-600 text-white rounded-lg font-bold hover:bg-amber-700">
              Mark Current Asset Not Ready
            </button>
          </div>
        </div>
      )}

      {activeTab === 'logs' && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50/50 font-bold text-gray-900">Inspection History</div>
          {inspectionLogs.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No recent inspection logs.</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {inspectionLogs.map((log) => (
                <div key={log.id} className="p-4 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-gray-900">{log.assetName} <span className="text-xs font-mono text-gray-500">{log.assetCode}</span></div>
                    <div className="text-sm text-gray-600">{log.notes}</div>
                    <div className="text-xs text-gray-400 mt-1">{log.inspector}</div>
                  </div>
                  <div className="text-right">
                    <span className={cn('px-2 py-1 rounded text-[10px] font-bold uppercase', log.result === 'Ready' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700')}>
                      {log.result}
                    </span>
                    <div className="text-xs text-gray-400 mt-2">{log.date}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'alerts' && (
        <div className="space-y-4">
          {inspectionLogs.length === 0 ? (
            <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl text-sm text-amber-700">No active readiness alerts.</div>
          ) : (
            inspectionLogs.slice(0, 3).map((log) => (
              <div key={log.id} className="p-4 bg-amber-50 border border-amber-100 rounded-xl flex gap-4">
                <div className="p-2 bg-amber-100 text-amber-600 rounded-lg h-fit"><Bell size={20} /></div>
                <div>
                  <h4 className="font-bold text-gray-900">Readiness Check Update</h4>
                  <p className="text-sm text-gray-600">{log.assetName} was marked as {log.result.toLowerCase()}.</p>
                  <span className="text-[10px] text-gray-500 font-bold uppercase mt-2 block">{log.date}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );

  if (loading) return <div className="p-8 text-center">Loading Distribution...</div>;

  return (
    <div className="animate-in fade-in duration-500">
      {user?.role === 'admin' && renderAdminView()}
      {user?.role === 'custodian' && renderCustodianView()}
      {user?.role === 'maintenance' && renderMaintenanceView()}
    </div>
  );
}

function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
