import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  FileText, 
  Download, 
  Search, 
  History,
  CheckCircle,
  Clock,
  AlertCircle,
  LayoutGrid,
  Upload,
  ClipboardList,
  PlusCircle,
  Trash2,
  ChevronRight,
  Bell,
  ShieldCheck,
  LayoutDashboard,
  Activity,
  Package,
  Box,
  QrCode,
  AlertTriangle,
  Truck,
  HardHat,
  LifeBuoy,
  Stethoscope,
  Wrench,
  Filter,
  Edit2,
  X
} from 'lucide-react';
import { useAuth } from '../AuthContext';
import { Asset, Category } from '../types';
import { cn } from '../lib/utils';

import { useSearchParams } from 'react-router-dom';

export default function Acquisition() {
  const { user, token } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (searchParams.get('tab') as any) || 
    (user?.role === 'admin' ? 'dashboard' :
     user?.role === 'maintenance' ? 'tasks' : 
     user?.role === 'custodian' ? 'dashboard' : 'registration');
  const [assets, setAssets] = useState<Asset[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDesc, setNewCategoryDesc] = useState('');
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [deletingAsset, setDeletingAsset] = useState<Asset | null>(null);
  const [assetLogs, setAssetLogs] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [personnel, setPersonnel] = useState<any[]>([]);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    type: 'Invoice',
    asset_id: '',
    source: '',
    reference_no: '',
    file: null as File | null
  });

  const [formData, setFormData] = useState<{
    name: string;
    code: string;
    category_id: string;
    purchase_date: string;
    price: string;
    location: string;
    status: string;
    condition: string;
    quantity: string;
    plate_number: string;
    invoice_no: string;
    attachment: File | null;
    [key: string]: string | File | null;
  }>({
    name: '',
    code: '',
    category_id: '',
    purchase_date: '',
    price: '',
    location: '',
    status: 'Available',
    condition: 'Excellent',
    quantity: '1',
    plate_number: '',
    invoice_no: '',
    attachment: null,
  });

  const isVehicleCategory = categories.find(c => c.id === parseInt(formData.category_id))?.name?.toLowerCase().includes('vehicle');

  const generateVehicleFields = () => {
    const qty = parseInt(formData.quantity) || 1;
    const fields = [];
    for (let i = 0; i < qty; i++) {
      fields.push(
        <div key={i} className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4 border-b border-gray-100">
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Vehicle {i + 1} - Plate Number</label>
            <input 
              type="text" 
              placeholder="e.g. ABC-1234" 
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={(formData[`plate_${i}`] as string) || ''}
              onChange={(e) => setFormData({...formData, [`plate_${i}`]: e.target.value})}
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Vehicle {i + 1} - Location</label>
            <input 
              type="text" 
              placeholder="e.g. Station A" 
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={(formData[`vehicle_location_${i}`] as string) || ''}
              onChange={(e) => setFormData({...formData, [`vehicle_location_${i}`]: e.target.value})}
              required
            />
          </div>
        </div>
      );
    }
    return fields;
  };

  const filteredAssets = assets.filter(asset => {
    const matchesSearch = asset.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         asset.code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || asset.category_name === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const setActiveTab = (tab: string) => {
    setSearchParams({ tab });
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [assetsRes, catsRes, logsRes, docsRes, usersRes] = await Promise.all([
          fetch('/api/assets', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/categories', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/asset-logs', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/documents', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/users', { headers: { Authorization: `Bearer ${token}` } })
        ]);
        setAssets(await assetsRes.json());
        setCategories(await catsRes.json());
        setAssetLogs(await logsRes.json());
        setDocuments(await docsRes.json());
        setPersonnel(await usersRes.json());
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const qty = parseInt(formData.quantity) || 1;
      const categoryName = categories.find(c => c.id === parseInt(formData.category_id))?.name || '';
      const isVehicle = categoryName.toLowerCase().includes('vehicle');

      if (isVehicle && qty > 1) {
        for (let i = 0; i < qty; i++) {
          const plateNumber = formData[`plate_${i}`] || '';
          const vehicleLocation = formData[`vehicle_location_${i}`] || '';
          
          const response = await fetch('/api/assets', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
              name: `${formData.name} ${i + 1}`,
              code: `${formData.code}-${i + 1}`,
              category_id: parseInt(formData.category_id),
              purchase_date: formData.purchase_date,
              price: parseFloat(formData.price) / qty,
              location: vehicleLocation || formData.location,
              status: formData.status,
              condition: formData.condition,
              quantity: 1,
              plate_number: plateNumber,
              attachment: formData.attachment ? formData.attachment.name : null
            })
          });

          if (response.ok) {
            const result = await response.json();
            const assetRes = await fetch(`/api/assets/${result.id}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            const newAsset = await assetRes.json();
            setAssets(prev => [...prev, newAsset]);
          }
        }
      } else {
        const response = await fetch('/api/assets', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            name: formData.name,
            code: formData.code,
            category_id: parseInt(formData.category_id),
            purchase_date: formData.purchase_date,
            price: parseFloat(formData.price),
            location: formData.location,
            status: formData.status,
            condition: formData.condition,
            quantity: qty,
            plate_number: isVehicle ? formData.plate_0 : '',
            attachment: formData.attachment ? formData.attachment.name : null
          })
        });

        if (response.ok) {
          const result = await response.json();
          const assetRes = await fetch(`/api/assets/${result.id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const newAsset = await assetRes.json();
          setAssets(prev => [...prev, newAsset]);
        }
      }
      
      setFormData({
        name: '',
        code: '',
        category_id: '',
        purchase_date: '',
        price: '',
        location: '',
        status: 'Available',
        condition: 'Excellent',
        quantity: '1',
        plate_number: '',
        invoice_no: '',
      });
      
      setActiveTab('dashboard');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAddingCategory(true);
    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newCategoryName,
          description: newCategoryDesc
        })
      });

      if (response.ok) {
        const result = await response.json();
        setCategories(prev => [...prev, result]);
        setNewCategoryName('');
        setNewCategoryDesc('');
      } else {
        const error = await response.json();
        console.error('Error adding category:', error);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsAddingCategory(false);
    }
  };

  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;
    setIsAddingCategory(true);
    try {
      const response = await fetch(`/api/categories/${editingCategory.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newCategoryName,
          description: newCategoryDesc
        })
      });

      if (response.ok) {
        setCategories(prev => prev.map(cat => 
          cat.id === editingCategory.id ? { ...cat, name: newCategoryName, description: newCategoryDesc } : cat
        ));
        setEditingCategory(null);
        setNewCategoryName('');
        setNewCategoryDesc('');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsAddingCategory(false);
    }
  };

  const handleDeleteCategory = async (id: number) => {
    if (!confirm('Are you sure you want to delete this category?')) return;
    try {
      const response = await fetch(`/api/categories/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        setCategories(prev => prev.filter(cat => cat.id !== id));
      } else {
        const err = await response.json();
        alert(err.error || 'Failed to delete category');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleDuty = async (id: number, isOnDuty: boolean) => {
    try {
      const response = await fetch(`/api/users/${id}/duty`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ is_on_duty: !isOnDuty })
      });
      if (response.ok) {
        setPersonnel(prev => prev.map(p => 
          p.id === id ? { ...p, is_on_duty: !isOnDuty } : p
        ));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const startEditCategory = (cat: Category) => {
    setEditingCategory(cat);
    setNewCategoryName(cat.name);
    setNewCategoryDesc(cat.description || '');
    // Scroll to form? 
    document.getElementById('category-form')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleEditAsset = (asset: Asset) => {
    setEditingAsset(asset);
    setFormData({
      name: asset.name,
      code: asset.code,
      category_id: String(asset.category_id || ''),
      purchase_date: asset.purchase_date || '',
      price: String(asset.price || ''),
      location: asset.location || '',
      status: asset.status || 'Available',
      condition: (asset as any).condition || 'Excellent',
      quantity: String(asset.quantity || 1),
      plate_number: asset.plate_number || '',
      invoice_no: (asset as any).invoice_no || '',
      attachment: null,
    });
    setActiveTab('registration');
  };

  const handleUpdateAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAsset) return;
    setIsSubmitting(true);
    try {
      const qty = parseInt(formData.quantity) || 1;
      const response = await fetch(`/api/assets/${editingAsset.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: formData.name,
          code: formData.code,
          category_id: parseInt(formData.category_id),
          purchase_date: formData.purchase_date,
          price: parseFloat(formData.price),
          location: formData.location,
          status: formData.status,
          condition: formData.condition,
          quantity: qty,
          plate_number: formData.plate_number,
          invoice_no: formData.invoice_no
        })
      });

      if (response.ok) {
        setAssets(prev => prev.map<Asset>(a => 
          a.id === editingAsset.id ? ({
            ...a,
            name: formData.name,
            code: formData.code,
            category_id: parseInt(formData.category_id),
            purchase_date: formData.purchase_date,
            price: parseFloat(formData.price),
            location: formData.location,
            status: formData.status as Asset['status'],
            condition: formData.condition as NonNullable<Asset['condition']>,
            quantity: qty,
            plate_number: formData.plate_number,
            invoice_no: formData.invoice_no,
            category_name: categories.find(c => c.id === parseInt(formData.category_id))?.name
          } as Asset) : a
        ));
        setEditingAsset(null);
        setFormData({
          name: '',
          code: '',
          category_id: '',
          purchase_date: '',
          price: '',
          location: '',
          status: 'Available',
          condition: 'Excellent',
          quantity: '1',
          plate_number: '',
          invoice_no: '',
          attachment: null,
        });
        setActiveTab('dashboard');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAsset = async () => {
    if (!deletingAsset) return;
    try {
      const response = await fetch(`/api/assets/${deletingAsset.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        setAssets(prev => prev.filter(a => a.id !== deletingAsset.id));
        setDeletingAsset(null);
      } else {
        const err = await response.json();
        alert(err.error || 'Failed to delete asset');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUploadDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          type: uploadForm.type,
          asset_id: uploadForm.asset_id ? parseInt(uploadForm.asset_id) : null,
          source: uploadForm.source,
          reference_no: uploadForm.reference_no,
          file_path: uploadForm.file ? uploadForm.file.name : null
        })
      });

      if (response.ok) {
        const newDoc = await response.json();
        setDocuments(prev => [newDoc, ...prev]);
        setIsUploadModalOpen(false);
        setUploadForm({
          type: 'Invoice',
          asset_id: '',
          source: '',
          reference_no: '',
          file: null
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteDocument = async (id: number) => {
    if (!confirm('Are you sure you want to delete this document?')) return;
    try {
      const response = await fetch(`/api/documents/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        setDocuments(prev => prev.filter(d => d.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const renderAdminView = () => (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Asset Acquisition</h2>
          <p className="text-gray-500">Manage new resource registration and procurement logs.</p>
        </div>
      </div>

      {/* Admin/Custodian Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {[
          ...(user?.role === 'admin' || user?.role === 'custodian' ? [
            { id: 'dashboard', label: 'Asset Management', icon: LayoutDashboard },
          ] : []),
          ...(user?.role === 'admin' ? [
            { id: 'registration', label: 'Asset Registration', icon: PlusCircle },
          ] : []),
          ...(user?.role === 'admin' || user?.role === 'custodian' ? [
            { id: 'categories', label: 'Asset Categories', icon: LayoutGrid },
            { id: 'invoices', label: 'Invoice Repository', icon: FileText },
            { id: 'logs', label: 'Acquisition Logs', icon: ClipboardList },
          ] : []),
          ...(user?.role === 'custodian' ? [
            { id: 'requests', label: 'Asset Requests', icon: FileText },
            { id: 'receiving', label: 'Receiving & Confirmation', icon: CheckCircle },
            { id: 'alerts', label: 'Alerts', icon: Bell },
          ] : []),
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

       <div>
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Total Disaster Assets', value: assets.length, icon: Package, color: 'text-blue-600', bg: 'bg-blue-50' },
                { label: 'Vehicles (Rescue)', value: assets.filter(a => a.category_name?.toLowerCase().includes('vehicle')).length, icon: Truck, color: 'text-orange-600', bg: 'bg-orange-50' },
                { label: 'PPE & Safety', value: assets.filter(a => a.category_name?.toLowerCase().includes('ppe') || a.category_name?.toLowerCase().includes('safety')).length, icon: HardHat, color: 'text-green-600', bg: 'bg-green-50' },
                { label: 'Emergency Gear', value: assets.filter(a => a.category_name?.toLowerCase().includes('emergency') || a.category_name?.toLowerCase().includes('rescue')).length, icon: LifeBuoy, color: 'text-red-600', bg: 'bg-red-50' },
              ].map((stat, i) => (
                <div key={i} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                  <div className={cn("p-3 rounded-xl", stat.bg, stat.color)}>
                    <stat.icon size={24} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">{stat.label}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Asset Management Table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="flex flex-col gap-4 border-b border-slate-800 p-6 md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white">Asset Management</h3>
                  <p className="text-sm text-slate-400">Comprehensive list of all disaster response resources.</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input 
                      type="text" 
                      placeholder="Search assets..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 w-full md:w-64"
                    />
                  </div>
                  <select 
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Categories</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.name}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-gray-50/50 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider">
                      <th className="px-6 py-4">Asset Details</th>
                      <th className="px-6 py-4">Category</th>
                      <th className="px-6 py-4">Condition</th>
                      <th className="px-6 py-4">Current Status</th>
                      <th className="px-6 py-4">Acquisition Date</th>
                      {user?.role === 'admin' && <th className="px-6 py-4 text-right">Action</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm">
                    {filteredAssets.length > 0 ? filteredAssets.map(asset => (
                      <tr key={asset.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                              {asset.category_name?.toLowerCase().includes('vehicle') ? <Truck size={18} /> : 
                               asset.category_name?.toLowerCase().includes('ppe') ? <HardHat size={18} /> :
                               asset.category_name?.toLowerCase().includes('medical') ? <Stethoscope size={18} /> :
                               <Package size={18} />}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-bold text-gray-900">{asset.name}</span>
                              <span className="text-xs text-gray-500 font-mono">{asset.code}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium">
                            {asset.category_name}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                            <span className="text-gray-700">Excellent</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-bold uppercase">
                            Operational
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-500">{asset.purchase_date}</td>
                        {user?.role === 'admin' && (
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button 
                                onClick={() => handleEditAsset(asset)}
                                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Edit"
                              >
                                <Edit2 size={16} />
                              </button>
                              <button 
                                onClick={() => setDeletingAsset(asset)}
                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete"
                              >
                                <Trash2 size={16} />
                              </button>
                              <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                <ChevronRight size={18} />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                          <div className="flex flex-col items-center gap-2">
                            <Package size={40} className="text-gray-200" />
                            <p>No assets found. Start by registering a new asset.</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="p-4 border-t border-gray-100 bg-gray-50/30 flex items-center justify-between">
                <p className="text-xs text-gray-500 font-medium">Showing {filteredAssets.length} disaster-ready assets</p>
                <div className="flex items-center gap-2">
                  <button className="px-3 py-1 text-xs font-bold text-gray-500 hover:text-gray-700 disabled:opacity-50" disabled>Previous</button>
                  <button className="px-3 py-1 text-xs font-bold text-blue-600 hover:text-blue-700 disabled:opacity-50" disabled>Next</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'registration' && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900">
                  {editingAsset ? 'Edit Asset' : 'New Asset Registration'}
                </h3>
                {editingAsset && (
                  <button 
                    onClick={() => {
                      setEditingAsset(null);
                      setFormData({
                        name: '',
                        code: '',
                        category_id: '',
                        purchase_date: '',
                        price: '',
                        location: '',
                        status: 'Available',
                        condition: 'Excellent',
                        quantity: '1',
                        plate_number: '',
                        invoice_no: '',
                      });
                    }}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    Cancel Edit
                  </button>
                )}
              </div>
              <form className="grid grid-cols-1 md:grid-cols-2 gap-6" onSubmit={editingAsset ? handleUpdateAsset : handleSubmit}>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Asset Name</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Rescue Boat 01" 
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Asset Code</label>
                  <input 
                    type="text" 
                    placeholder="e.g. RES-0001" 
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    value={formData.code}
                    onChange={(e) => setFormData({...formData, code: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Category</label>
                  <select 
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    value={formData.category_id}
                    onChange={(e) => setFormData({...formData, category_id: e.target.value})}
                    required
                  >
                    <option value="">Select Category</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Purchase Date</label>
                  <input 
                    type="date" 
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    value={formData.purchase_date}
                    onChange={(e) => setFormData({...formData, purchase_date: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Purchase Price</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">₱</span>
                    <input 
                      type="number" 
                      placeholder="0.00" 
                      className="w-full pl-8 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      value={formData.price}
                      onChange={(e) => setFormData({...formData, price: e.target.value})}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Initial Location</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Station A" 
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Status</label>
                  <select 
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                  >
                    <option value="Available">Available</option>
                    <option value="Under Maintenance">Under Maintenance</option>
                    <option value="Damaged">Damaged</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Condition</label>
                  <select 
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    value={formData.condition}
                    onChange={(e) => setFormData({...formData, condition: e.target.value})}
                  >
                    <option value="Excellent">Excellent</option>
                    <option value="Good">Good</option>
                    <option value="Fair">Fair</option>
                    <option value="Poor">Poor</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Quantity</label>
                  <input 
                    type="number" 
                    min="1"
                    placeholder="1" 
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    value={formData.quantity}
                    onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                    required
                  />
                </div>
                {isVehicleCategory && parseInt(formData.quantity) > 0 && (
                  <div className="md:col-span-2">
                    <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                      <h4 className="font-bold text-gray-700">Vehicle Details</h4>
                      {generateVehicleFields()}
                    </div>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Invoice / Reference No.</label>
                  <input 
                    type="text" 
                    placeholder="e.g. INV-2024-001" 
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    value={formData.invoice_no}
                    onChange={(e) => setFormData({...formData, invoice_no: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Attachment (Invoice/Deed)</label>
                  <div className="relative">
                    <input 
                      type="file" 
                      className="hidden" 
                      id="invoice-upload"
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setFormData({...formData, attachment: file});
                        }
                      }}
                    />
                    <label htmlFor="invoice-upload" className="flex items-center gap-2 w-full px-4 py-2 border border-gray-200 border-dashed rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                      <Upload size={16} className="text-gray-400" />
                      <span className="text-sm text-gray-500">
                        {formData.attachment ? (formData.attachment as File).name : 'Upload document...'}
                      </span>
                    </label>
                  </div>
                </div>
                <div className="md:col-span-2 pt-4">
                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 disabled:opacity-50"
                  >
                    {isSubmitting ? (editingAsset ? 'Updating...' : 'Registering...') : (editingAsset ? 'Update Asset' : 'Register Asset')}
                  </button>
                </div>
              </form>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <h3 className="mb-4 text-lg font-bold text-white">Registration Tips</h3>
              <ul className="space-y-4">
                <li className="flex gap-3">
                  <div className="w-6 h-6 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 text-xs font-bold">1</div>
                  <p className="text-sm text-gray-600">Ensure the asset code is unique and follows the BDRRMO naming convention.</p>
                </li>
                <li className="flex gap-3">
                  <div className="w-6 h-6 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 text-xs font-bold">2</div>
                  <p className="text-sm text-gray-600">Select the correct category to ensure proper maintenance scheduling.</p>
                </li>
                <li className="flex gap-3">
                  <div className="w-6 h-6 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 text-xs font-bold">3</div>
                  <p className="text-sm text-gray-600">Double-check the purchase price for accurate financial reporting.</p>
                </li>
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'categories' && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900">Asset Categories</h3>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                  <input type="text" placeholder="Search categories..." className="pl-9 pr-4 py-1.5 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div className="divide-y divide-gray-100">
                {categories.map(cat => (
                  <div key={cat.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                    <div>
                      <h4 className="font-bold text-gray-900">{cat.name}</h4>
                      <p className="text-sm text-gray-500">{cat.description}</p>
                    </div>
                    {user?.role === 'admin' && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => startEditCategory(cat)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                          title="Edit category"
                        >
                          <History size={18} />
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(cat.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                          title="Delete category"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            {user?.role === 'admin' && (
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-6">
                  {editingCategory ? 'Edit Category' : 'Add New Category'}
                </h3>
                <form
                  id="category-form"
                  className="space-y-4"
                  onSubmit={editingCategory ? handleUpdateCategory : handleAddCategory}
                >
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">Category Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Communication Gear"
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">Description</label>
                    <textarea
                      rows={3}
                      placeholder="Describe the category..."
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                      value={newCategoryDesc}
                      onChange={(e) => setNewCategoryDesc(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-3">
                    {editingCategory && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingCategory(null);
                          setNewCategoryName('');
                          setNewCategoryDesc('');
                        }}
                        className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg font-bold hover:bg-gray-200 transition-colors"
                      >
                        Cancel
                      </button>
                    )}
                    <button
                      type="submit"
                      disabled={isAddingCategory}
                      className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      {isAddingCategory
                        ? editingCategory
                          ? 'Updating...'
                          : 'Adding...'
                        : editingCategory
                          ? 'Update Category'
                          : 'Add Category'}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}
        {activeTab === 'invoices' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Invoice & Document Repository</h3>
                  <p className="text-sm text-gray-500">Evidence of acquisition, funding sources, and donation records.</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                    <input type="text" placeholder="Search documents..." className="pl-9 pr-4 py-1.5 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  {user?.role === 'admin' && (
                    <button 
                      onClick={() => setIsUploadModalOpen(true)}
                      className="flex items-center gap-2 px-4 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors"
                    >
                      <Upload size={14} />
                      <span>Upload New</span>
                    </button>
                  )}
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-gray-50/50 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider">
                      <th className="px-6 py-4">Document Type</th>
                      <th className="px-6 py-4">Asset Reference</th>
                      <th className="px-6 py-4">Source / Fund</th>
                      <th className="px-6 py-4">Date Uploaded</th>
                      <th className="px-6 py-4">Reference No.</th>
                      <th className="px-6 py-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm">
                    {documents.length > 0 ? documents.map((doc) => (
                      <tr key={doc.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={cn("p-2 rounded-lg", 
                              doc.type === 'Invoice' ? "bg-blue-50 text-blue-600" :
                              doc.type === 'Deed of Donation' ? "bg-green-50 text-green-600" :
                              doc.type === 'Procurement Receipt' ? "bg-purple-50 text-purple-600" :
                              "bg-amber-50 text-amber-600"
                            )}>
                              <FileText size={18} />
                            </div>
                            <span className="font-bold text-gray-900">{doc.type}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-700 font-medium">{doc.asset_name || '-'}</td>
                        <td className="px-6 py-4">
                          <span className={cn("px-2.5 py-1 rounded-full text-[10px] font-bold uppercase", 
                            doc.source?.includes('Donation') ? "bg-green-100 text-green-700" : 
                            doc.source?.includes('Government') ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700"
                          )}>
                            {doc.source || '-'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-500">{doc.created_at?.split('T')[0]}</td>
                        <td className="px-6 py-4 font-mono text-xs text-gray-500">{doc.reference_no || '-'}</td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="View Document">
                              <Search size={16} />
                            </button>
                            <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Download">
                              <Download size={16} />
                            </button>
                            {user?.role === 'admin' && (
                              <button 
                                onClick={() => handleDeleteDocument(doc.id)}
                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" 
                                title="Delete"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                          <div className="flex flex-col items-center gap-2">
                            <FileText size={40} className="text-gray-200" />
                            <p>No documents found. Upload a new document to get started.</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Quick Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <h4 className="text-sm font-bold text-gray-500 uppercase mb-4">Funding Distribution</h4>
                <div className="space-y-3">
                  {[
                    { label: 'Government Fund', value: '65%', color: 'bg-blue-500' },
                    { label: 'Private Donation', value: '20%', color: 'bg-green-500' },
                    { label: 'LGU Budget', value: '15%', color: 'bg-purple-500' },
                  ].map((fund, i) => (
                    <div key={i} className="space-y-1">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-gray-600">{fund.label}</span>
                        <span className="text-gray-900">{fund.value}</span>
                      </div>
                      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className={cn("h-full", fund.color)} style={{ width: fund.value }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="md:col-span-2 bg-blue-600 p-6 rounded-2xl text-white flex items-center justify-between">
                <div className="space-y-2">
                  <h4 className="text-lg font-bold">Need to archive a new donation?</h4>
                  <p className="text-blue-100 text-sm max-w-md">Ensure all Deed of Donation documents are scanned and uploaded with the corresponding asset reference for audit compliance.</p>
                  {user?.role === 'admin' && (
                    <button 
                      onClick={() => {
                        setUploadForm({ ...uploadForm, type: 'Deed of Donation', source: 'Private Donation' });
                        setIsUploadModalOpen(true);
                      }}
                      className="mt-4 px-6 py-2 bg-white text-blue-600 rounded-xl font-bold text-sm hover:bg-blue-50 transition-colors"
                    >
                      Upload Donation Record
                    </button>
                  )}
                </div>
                <div className="hidden lg:block opacity-20">
                  <ShieldCheck size={120} />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Acquisition History Logs</h3>
              <button className="text-sm text-blue-600 font-bold hover:underline">Export Logs</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-100 text-xs font-bold text-gray-500 uppercase">
                    <th className="px-6 py-4">Action</th>
                    <th className="px-6 py-4">Asset Name</th>
                    <th className="px-6 py-4">Source / Invoice</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4">Admin</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4 text-right">Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {assets.map(asset => (
                    <tr key={asset.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-green-50 text-green-700 rounded text-[10px] font-bold uppercase">Registered</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-gray-900">{asset.name}</span>
                          <span className="text-xs text-gray-500 font-mono">{asset.code}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-gray-700 uppercase">Buy</span>
                          <span className="text-xs text-blue-600 hover:underline cursor-pointer">INV-2024-001</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{asset.category_name}</td>
                      <td className="px-6 py-4 text-gray-600">Admin</td>
                      <td className="px-6 py-4 text-gray-500">{asset.purchase_date}</td>
                      <td className="px-6 py-4 text-right font-mono font-bold text-gray-900">₱{asset.price.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Custodian specific tabs contents */}
        {activeTab === 'requests' && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-gray-50/50 font-bold text-gray-900">Active Requests</div>
            <div className="divide-y divide-gray-100">
              {[
                { item: 'First Aid Kits (x10)', status: 'Pending', date: '2024-03-28', icon: Clock, color: 'text-amber-500' },
                { item: 'Handheld Radios (x5)', status: 'Approved', date: '2024-03-25', icon: CheckCircle, color: 'text-green-500' },
              ].map((req, i) => (
                <div key={i} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={cn("p-2 rounded-lg bg-gray-50", req.color)}>
                      <req.icon size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">{req.item}</h4>
                      <p className="text-xs text-gray-500">Requested on {req.date}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={cn("px-2.5 py-1 rounded-full text-xs font-bold uppercase", 
                      req.status === 'Pending' ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"
                    )}>
                      {req.status}
                    </span>
                    {req.status === 'Approved' && (
                      <button className="text-sm font-bold text-blue-600 hover:underline">Confirm Receipt</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'receiving' && (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center">
            <CheckCircle size={48} className="text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-900">Confirm Receipt</h3>
            <p className="text-gray-500 mt-2 max-w-md mx-auto">When new assets arrive, use this section to confirm their condition and add them to your assigned inventory.</p>
            <button className="mt-6 px-8 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-colors shadow-lg shadow-green-200">
              Scan Delivery QR
            </button>
          </div>
        )}

        {activeTab === 'alerts' && (
          <div className="space-y-4">
            <div className="flex gap-4 rounded-2xl border border-blue-200 bg-blue-50 p-4">
              <div className="p-2 bg-blue-100 text-blue-600 rounded-lg h-fit">
                <Bell size={20} />
              </div>
              <div>
                <h4 className="font-bold text-gray-900">Asset Ready for Pickup</h4>
                <p className="text-sm text-gray-600">Your requested Handheld Radios (x5) are ready for pickup at the main warehouse.</p>
                <span className="text-[10px] text-gray-500 font-bold uppercase mt-2 block">1 hour ago</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderCustodianView = () => renderAdminView();

  const renderMaintenanceView = () => {
    return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Maintenance Acquisition Tasks</h2>
          <p className="text-gray-500">Inspect and verify newly acquired assets for operational readiness.</p>
        </div>
      </div>

      {/* Maintenance Tabs */}
      <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {[
          { id: 'tasks', label: 'Assigned Tasks', icon: ClipboardList },
          { id: 'alerts', label: 'Alerts', icon: Bell },
          { id: 'assets', label: 'Assets', icon: Package },
          { id: 'inspection', label: 'Asset Inspection', icon: ShieldCheck },
          { id: 'verification', label: 'Condition Verification', icon: CheckCircle },
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

      {activeTab === 'tasks' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100 font-bold text-gray-900">Assigned Inspection Tasks</div>
          <div className="divide-y divide-gray-100">
            {[
              { asset: 'Rescue Boat 01', code: 'RES-0001', date: '2024-03-28', status: 'Pending' },
              { asset: 'Drone Unit B', code: 'DRN-0012', date: '2024-03-27', status: 'In Progress' },
            ].map((task, i) => (
              <div key={i} className="p-6 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
                    <ClipboardList size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">{task.asset}</h4>
                    <p className="text-xs text-gray-500 font-mono">{task.code} • Assigned on {task.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={cn("px-2 py-1 rounded text-[10px] font-bold uppercase", 
                    task.status === 'Pending' ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"
                  )}>{task.status}</span>
                  <button className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700">Start Inspection</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'alerts' && (
        <div className="space-y-4">
          {[
            { title: 'Critical Inspection Required', msg: 'Rescue Boat 01 has been registered and needs immediate safety inspection.', type: 'critical', date: '2 hours ago' },
            { title: 'New Asset Alert', msg: '5 new radios have been added to inventory and require condition verification.', type: 'info', date: '5 hours ago' },
          ].map((alert, i) => (
            <div key={i} className={cn("flex gap-4 rounded-2xl border p-4", 
              alert.type === 'critical' ? "border-red-200 bg-red-50" : "border-blue-200 bg-blue-50"
            )}>
              <div className={cn("p-2 rounded-lg h-fit", 
                alert.type === 'critical' ? "bg-red-100 text-red-600" : "bg-blue-100 text-blue-600"
              )}>
                <Bell size={20} />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-bold text-gray-900">{alert.title}</h4>
                  <span className="text-[10px] text-gray-500 font-bold uppercase">{alert.date}</span>
                </div>
                <p className="text-sm text-gray-600">{alert.msg}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'assets' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900">Newly Acquired Assets</h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
              <input type="text" placeholder="Search assets..." className="pl-9 pr-4 py-1.5 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-100 text-xs font-bold text-gray-500 uppercase">
                  <th className="px-6 py-4">Asset</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Condition</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {assets.slice(0, 5).map(asset => (
                  <tr key={asset.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-gray-900">{asset.name}</span>
                        <span className="text-xs text-gray-500 font-mono">{asset.code}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{asset.category_name}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-green-50 text-green-700 rounded text-[10px] font-bold uppercase">Excellent</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-[10px] font-bold uppercase">New</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-blue-600 font-bold hover:underline">View Details</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'inspection' && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center">
            <ShieldCheck size={48} className="text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-900">Safety Inspection Report</h3>
            <p className="text-gray-500 mt-2">Submit a detailed safety inspection for newly acquired assets.</p>
            <button className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg font-bold">Create Report</button>
          </div>
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center">
            <ClipboardList size={48} className="text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-900">Inspection Checklist</h3>
            <p className="text-gray-500 mt-2">Manage and update standard inspection checklists for different categories.</p>
            <button className="mt-6 px-6 py-2 bg-gray-600 text-white rounded-lg font-bold">Manage Checklists</button>
          </div>
        </div>
      )}

      {activeTab === 'verification' && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <CheckCircle size={20} className="text-green-600" />
            Condition Verification
          </h3>
          <div className="space-y-6">
            <p className="text-gray-600 text-sm">Verify the physical condition of assets against the registration data.</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { label: 'Verified Today', value: 12, color: 'text-green-600' },
                { label: 'Pending Verification', value: 5, color: 'text-amber-600' },
                { label: 'Issues Found', value: 1, color: 'text-red-600' },
              ].map((stat, i) => (
                <div key={i} className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <p className="text-xs text-gray-500 font-bold uppercase mb-1">{stat.label}</p>
                  <p className={cn("text-2xl font-bold", stat.color)}>{stat.value}</p>
                </div>
              ))}
            </div>
            <button className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold">Start Batch Verification</button>
          </div>
        </div>
      )}
    </div>
    );
  };

  if (loading) return <div className="p-8 text-center">Loading Module...</div>;

  return (
    <div>
      {user?.role === 'admin' && renderAdminView()}
      {user?.role === 'custodian' && renderCustodianView()}
      {user?.role === 'maintenance' && renderMaintenanceView()}
      
      {deletingAsset && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-2xl shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-red-100 text-red-600 rounded-full">
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Delete Asset</h3>
                <p className="text-sm text-gray-500">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete <strong>{deletingAsset.name}</strong> ({deletingAsset.code})? 
              This will also remove it from all assignments and maintenance records.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setDeletingAsset(null)}
                className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg font-bold hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleDeleteAsset}
                className="flex-1 py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {isUploadModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-2xl shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900">Upload Document</h3>
              <button 
                onClick={() => setIsUploadModalOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleUploadDocument} className="space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Document Type</label>
                <select 
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={uploadForm.type}
                  onChange={(e) => setUploadForm({...uploadForm, type: e.target.value})}
                >
                  <option value="Invoice">Invoice</option>
                  <option value="Deed of Donation">Deed of Donation</option>
                  <option value="Procurement Receipt">Procurement Receipt</option>
                  <option value="Grant Document">Grant Document</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Asset Reference (Optional)</label>
                <select 
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={uploadForm.asset_id}
                  onChange={(e) => setUploadForm({...uploadForm, asset_id: e.target.value})}
                >
                  <option value="">No specific asset</option>
                  {assets.map(asset => (
                    <option key={asset.id} value={asset.id}>{asset.name} ({asset.code})</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Source / Fund</label>
                <input 
                  type="text" 
                  placeholder="e.g. Government Fund, Private Donation"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={uploadForm.source}
                  onChange={(e) => setUploadForm({...uploadForm, source: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Reference No.</label>
                <input 
                  type="text" 
                  placeholder="e.g. INV-2024-001"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={uploadForm.reference_no}
                  onChange={(e) => setUploadForm({...uploadForm, reference_no: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">File Attachment</label>
                <div className="relative">
                  <input 
                    type="file" 
                    className="hidden" 
                    id="document-upload"
                    onChange={(e) => setUploadForm({...uploadForm, file: e.target.files?.[0] || null})}
                  />
                  <label 
                    htmlFor="document-upload" 
                    className="flex items-center gap-2 w-full px-4 py-2 border border-gray-200 border-dashed rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <Upload size={16} className="text-gray-400" />
                    <span className="text-sm text-gray-500">
                      {uploadForm.file ? uploadForm.file.name : 'Click to upload file...'}
                    </span>
                  </label>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg font-bold hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Uploading...' : 'Upload'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
