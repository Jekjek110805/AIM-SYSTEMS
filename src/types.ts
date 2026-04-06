export interface User {
  id: number;
  username: string;
  email: string;
  role: 'admin' | 'maintenance' | 'custodian';
}

export interface Asset {
  id: number;
  code: string;
  name: string;
  category_id: number;
  category_name?: string;
  status: 'Available' | 'Under Maintenance' | 'Damaged' | 'Disposed' | 'Transferred';
  condition?: 'Excellent' | 'Good' | 'Fair' | 'Poor';
  quantity?: number;
  plate_number?: string;
  location: string;
  purchase_date: string;
  price: number;
  invoice_no?: string;
}

export interface Category {
  id: number;
  name: string;
  description: string;
}

export interface MaintenanceRequest {
  id: number;
  asset_id: number;
  asset_name: string;
  asset_code: string;
  requester_id: number;
  requester_name: string;
  technician_id?: number;
  technician_name?: string;
  issue_description: string;
  status: 'Pending' | 'In Progress' | 'Completed' | 'Cancelled';
  priority: 'Low' | 'Medium' | 'High';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Stats {
  total: number;
  active: number;
  maintenance: number;
  disposed: number;
}
