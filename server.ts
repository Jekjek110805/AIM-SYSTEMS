import express from 'express';
import cors from 'cors';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import Database from 'better-sqlite3';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const db = new Database('database.sqlite');
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key';

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS roles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL
  );

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role_id INTEGER,
    is_on_duty INTEGER DEFAULT 0,
    FOREIGN KEY (role_id) REFERENCES roles(id)
  );

  CREATE TABLE IF NOT EXISTS asset_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    description TEXT
  );

  CREATE TABLE IF NOT EXISTS assets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    category_id INTEGER,
    status TEXT DEFAULT 'Available',
    condition TEXT DEFAULT 'Excellent',
    quantity INTEGER DEFAULT 1,
    plate_number TEXT,
    chassis_number TEXT,
    location TEXT,
    purchase_date TEXT,
    price REAL,
    invoice_no TEXT,
    latitude REAL,
    longitude REAL,
    FOREIGN KEY (category_id) REFERENCES asset_categories(id)
  );

  CREATE TABLE IF NOT EXISTS assignments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    asset_id INTEGER,
    user_id INTEGER,
    operator TEXT,
    receiver TEXT,
    location TEXT,
    notes TEXT,
    assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    returned_at DATETIME,
    FOREIGN KEY (asset_id) REFERENCES assets(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS maintenance_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    asset_id INTEGER,
    requester_id INTEGER,
    technician_id INTEGER,
    issue_description TEXT,
    status TEXT DEFAULT 'Pending', -- Pending, In Progress, Completed, Cancelled
    priority TEXT DEFAULT 'Medium', -- Low, Medium, High
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (asset_id) REFERENCES assets(id),
    FOREIGN KEY (requester_id) REFERENCES users(id),
    FOREIGN KEY (technician_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS disposal_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    asset_id INTEGER,
    requester_id INTEGER,
    reason TEXT,
    status TEXT DEFAULT 'Pending', -- Pending, Approved, Rejected
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (asset_id) REFERENCES assets(id),
    FOREIGN KEY (requester_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS asset_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    asset_id INTEGER,
    user_id INTEGER,
    action TEXT,
    details TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (asset_id) REFERENCES assets(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,
    asset_id INTEGER,
    source TEXT,
    reference_no TEXT,
    file_path TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (asset_id) REFERENCES assets(id)
  );
`);

// Seed Roles and Admin User if not exists
const seed = () => {
  const roles = ['admin', 'maintenance', 'custodian', 'technician'];
  const insertRole = db.prepare('INSERT OR IGNORE INTO roles (name) VALUES (?)');
  roles.forEach(role => insertRole.run(role));

  const adminRole = db.prepare('SELECT id FROM roles WHERE name = ?').get('admin');
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;

  if (userCount === 0) {
    const adminPass = bcrypt.hashSync('admin123', 10);
    const maintenancePass = bcrypt.hashSync('maintenance123', 10);
    const custodianPass = bcrypt.hashSync('custodian123', 10);

    const adminRoleId = db.prepare('SELECT id FROM roles WHERE name = ?').get('admin').id;
    const maintenanceRoleId = db.prepare('SELECT id FROM roles WHERE name = ?').get('maintenance').id;
    const custodianRoleId = db.prepare('SELECT id FROM roles WHERE name = ?').get('custodian').id;

    db.prepare('INSERT INTO users (username, password, email, role_id) VALUES (?, ?, ?, ?)')
      .run('admin', adminPass, 'admin@bdrrmo.gov.ph', adminRoleId);
    
    db.prepare('INSERT INTO users (username, password, email, role_id) VALUES (?, ?, ?, ?)')
      .run('maintenance', maintenancePass, 'maintenance@bdrrmo.gov.ph', maintenanceRoleId);

    db.prepare('INSERT INTO users (username, password, email, role_id) VALUES (?, ?, ?, ?)')
      .run('custodian', custodianPass, 'custodian@bdrrmo.gov.ph', custodianRoleId);
    
    // Seed some categories
    const categories = ['Rescue Equipment', 'Medical Supplies', 'Communication Gear', 'Vehicles', 'Office Assets'];
    const insertCat = db.prepare('INSERT INTO asset_categories (name) VALUES (?)');
    categories.forEach(cat => insertCat.run(cat));

    // Seed some assets
    const rescueId = db.prepare('SELECT id FROM asset_categories WHERE name = ?').get('Rescue Equipment').id;
    const insertAsset = db.prepare('INSERT INTO assets (code, name, category_id, location, purchase_date, price, latitude, longitude) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
    const baseLat = 10.3344;
    const baseLng = 123.9483;
    for (let i = 1; i <= 5; i++) {
      insertAsset.run(
        `RES-${String(i).padStart(4, '0')}`, 
        `Rescue Boat ${i}`, 
        rescueId, 
        'Station A', 
        '2024-01-15', 
        5000 + i * 500,
        baseLat + (Math.random() - 0.5) * 0.01,
        baseLng + (Math.random() - 0.5) * 0.01
      );
    }
  }
};
seed();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // Auth Middleware
  const authenticate = (req: any, res: any, next: any) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      next();
    } catch (err) {
      res.status(401).json({ error: 'Invalid token' });
    }
  };

  // API Routes
  app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const user = db.prepare(`
      SELECT u.*, r.name as role 
      FROM users u 
      JOIN roles r ON u.role_id = r.id 
      WHERE u.username = ?
    `).get(username) as any;

    if (user && bcrypt.compareSync(password, user.password)) {
      const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '8h' });
      res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  });

  app.get('/api/stats', authenticate, (req, res) => {
    const total = db.prepare('SELECT COUNT(*) as count FROM assets').get().count;
    const active = db.prepare("SELECT COUNT(*) as count FROM assets WHERE status = 'Active'").get().count;
    const maintenance = db.prepare("SELECT COUNT(*) as count FROM assets WHERE status = 'Under Maintenance'").get().count;
    const disposed = db.prepare("SELECT COUNT(*) as count FROM assets WHERE status = 'Disposed'").get().count;
    
    res.json({ total, active, maintenance, disposed });
  });

  app.get('/api/users', authenticate, (req, res) => {
    const users = db.prepare(`
      SELECT u.id, u.username, u.email, u.is_on_duty, r.name as role 
      FROM users u 
      JOIN roles r ON u.role_id = r.id
    `).all();
    res.json(users);
  });

  app.post('/api/users', authenticate, (req: any, res) => {
    const { username, password, email, role } = req.body;
    
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can create users' });
    }

    const roleData = db.prepare('SELECT id FROM roles WHERE name = ?').get(role) as any;
    if (!roleData) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    try {
      const hashedPassword = bcrypt.hashSync(password, 10);
      const result = db.prepare('INSERT INTO users (username, password, email, role_id) VALUES (?, ?, ?, ?)')
        .run(username, hashedPassword, email, roleData.id);
      
      const newUser = db.prepare(`
        SELECT u.id, u.username, u.email, u.is_on_duty, r.name as role 
        FROM users u 
        JOIN roles r ON u.role_id = r.id
        WHERE u.id = ?
      `).get(result.lastInsertRowid);
      
      res.json(newUser);
    } catch (err: any) {
      res.status(400).json({ error: err.message.includes('UNIQUE') ? 'Username or email already exists' : err.message });
    }
  });

  // Maintenance personnel can add technicians/mechanics
  app.post('/api/technicians', authenticate, (req: any, res) => {
    const { username, password, email, specialty } = req.body;
    
    // Only admin and maintenance can add technicians
    if (req.user.role !== 'admin' && req.user.role !== 'maintenance') {
      return res.status(403).json({ error: 'Unauthorized to add technicians' });
    }

    const roleData = db.prepare('SELECT id FROM roles WHERE name = ?').get('technician') as any;
    if (!roleData) {
      return res.status(400).json({ error: 'Technician role not found' });
    }

    try {
      const hashedPassword = bcrypt.hashSync(password, 10);
      const result = db.prepare('INSERT INTO users (username, password, email, role_id) VALUES (?, ?, ?, ?)')
        .run(username, hashedPassword, email, roleData.id);
      
      const newTech = db.prepare(`
        SELECT u.id, u.username, u.email, u.is_on_duty, r.name as role 
        FROM users u 
        JOIN roles r ON u.role_id = r.id
        WHERE u.id = ?
      `).get(result.lastInsertRowid);
      
      res.json(newTech);
    } catch (err: any) {
      res.status(400).json({ error: err.message.includes('UNIQUE') ? 'Username or email already exists' : err.message });
    }
  });

  app.put('/api/users/:id/duty', authenticate, (req, res) => {
    const { is_on_duty } = req.body;
    try {
      db.prepare('UPDATE users SET is_on_duty = ? WHERE id = ?')
        .run(is_on_duty ? 1 : 0, req.params.id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.get('/api/assets', authenticate, (req, res) => {
    const assets = db.prepare(`
      SELECT a.*, c.name as category_name 
      FROM assets a 
      LEFT JOIN asset_categories c ON a.category_id = c.id
      ORDER BY a.id DESC
    `).all();
    res.json(assets);
  });

  app.get('/api/assets/:id', authenticate, (req, res) => {
    const asset = db.prepare(`
      SELECT a.*, c.name as category_name
      FROM assets a 
      LEFT JOIN asset_categories c ON a.category_id = c.id 
      WHERE a.id = ?
    `).get(req.params.id);
    res.json(asset);
  });

  app.post('/api/assets', authenticate, (req, res) => {
    const { code, name, category_id, location, purchase_date, price, status, condition, quantity, plate_number, chassis_number, invoice_no } = req.body;
    try {
      const result = db.prepare('INSERT INTO assets (code, name, category_id, location, purchase_date, price, status, condition, quantity, plate_number, chassis_number, invoice_no, latitude, longitude) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
        .run(code, name, category_id, location, purchase_date, price, status || 'Available', condition || 'Excellent', quantity || 1, plate_number || null, chassis_number || null, invoice_no || null, null, null);
      
      db.prepare('INSERT INTO asset_logs (asset_id, user_id, action, details) VALUES (?, ?, ?, ?)')
        .run(result.lastInsertRowid, (req as any).user.id, 'Created', `Asset "${name}" (${code}) was registered`);
      
      res.json({ id: result.lastInsertRowid });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.put('/api/assets/:id', authenticate, (req, res) => {
    const { code, name, category_id, location, purchase_date, price, status, condition, quantity, plate_number, chassis_number, invoice_no } = req.body;
    try {
      db.prepare(`
        UPDATE assets SET 
          code = ?, name = ?, category_id = ?, location = ?, purchase_date = ?, 
          price = ?, status = ?, condition = ?, quantity = ?, plate_number = ?, chassis_number = ?, invoice_no = ?
        WHERE id = ?
      `).run(code, name, category_id, location, purchase_date, price, status, condition, quantity, plate_number, chassis_number, invoice_no, req.params.id);
      
      db.prepare('INSERT INTO asset_logs (asset_id, user_id, action, details) VALUES (?, ?, ?, ?)')
        .run(req.params.id, (req as any).user.id, 'Updated', `Asset "${name}" (${code}) was updated`);
      
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.delete('/api/assets/:id', authenticate, (req, res) => {
    try {
      const asset = db.prepare('SELECT * FROM assets WHERE id = ?').get(req.params.id) as any;
      if (asset) {
        db.prepare('INSERT INTO asset_logs (asset_id, user_id, action, details) VALUES (?, ?, ?, ?)')
          .run(req.params.id, (req as any).user.id, 'Deleted', `Asset "${asset.name}" (${asset.code}) was disposed/removed`);
      }
      db.prepare('DELETE FROM assets WHERE id = ?').run(req.params.id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.get('/api/asset-logs', authenticate, (req, res) => {
    const logs = db.prepare(`
      SELECT l.*, a.name as asset_name, a.code as asset_code, u.username as user_name
      FROM asset_logs l
      JOIN assets a ON l.asset_id = a.id
      JOIN users u ON l.user_id = u.id
      ORDER BY l.created_at DESC
    `).all();
    res.json(logs);
  });

  app.get('/api/documents', authenticate, (req, res) => {
    const documents = db.prepare(`
      SELECT d.*, a.name as asset_name
      FROM documents d
      LEFT JOIN assets a ON d.asset_id = a.id
      ORDER BY d.created_at DESC
    `).all();
    res.json(documents);
  });

  app.post('/api/documents', authenticate, (req, res) => {
    const { type, asset_id, source, reference_no, file_path } = req.body;
    try {
      const result = db.prepare('INSERT INTO documents (type, asset_id, source, reference_no, file_path) VALUES (?, ?, ?, ?, ?)')
        .run(type, asset_id || null, source, reference_no, file_path || null);
      const newDoc = db.prepare('SELECT * FROM documents WHERE id = ?').get(result.lastInsertRowid);
      res.json(newDoc);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.delete('/api/documents/:id', authenticate, (req, res) => {
    try {
      db.prepare('DELETE FROM documents WHERE id = ?').run(req.params.id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.get('/api/categories', authenticate, (req, res) => {
    const categories = db.prepare('SELECT * FROM asset_categories').all();
    res.json(categories);
  });

  app.post('/api/categories', authenticate, (req, res) => {
    const { name, description } = req.body;
    try {
      const result = db.prepare('INSERT INTO asset_categories (name, description) VALUES (?, ?)')
        .run(name, description || null);
      const newCategory = db.prepare('SELECT * FROM asset_categories WHERE id = ?').get(result.lastInsertRowid);
      res.json(newCategory);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.put('/api/categories/:id', authenticate, (req, res) => {
    const { name, description } = req.body;
    try {
      db.prepare('UPDATE asset_categories SET name = ?, description = ? WHERE id = ?')
        .run(name, description, req.params.id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.delete('/api/categories/:id', authenticate, (req, res) => {
    try {
      db.prepare('DELETE FROM asset_categories WHERE id = ?').run(req.params.id);
      res.json({ success: true });
    } catch (err: any) {
      // Better-sqlite3 will throw if foreign key violation occurs
      res.status(400).json({ error: err.message.includes('FOREIGN KEY') ? 'Cannot delete category that is in use by assets.' : err.message });
    }
  });

  app.get('/api/maintenance', authenticate, (req, res) => {
    const requests = db.prepare(`
      SELECT m.*, a.name as asset_name, a.code as asset_code, u.username as requester_name, t.username as technician_name
      FROM maintenance_requests m
      JOIN assets a ON m.asset_id = a.id
      JOIN users u ON m.requester_id = u.id
      LEFT JOIN users t ON m.technician_id = t.id
      ORDER BY m.created_at DESC
    `).all();
    res.json(requests);
  });

  app.post('/api/maintenance', authenticate, (req: any, res) => {
    const { asset_id, issue_description, priority } = req.body;
    const result = db.prepare('INSERT INTO maintenance_requests (asset_id, requester_id, issue_description, priority) VALUES (?, ?, ?, ?)')
      .run(asset_id, req.user.id, issue_description, priority);
    res.json({ id: result.lastInsertRowid });
  });

  app.put('/api/maintenance/:id', authenticate, (req, res) => {
    const { status, technician_id, notes } = req.body;
    db.prepare('UPDATE maintenance_requests SET status = ?, technician_id = ?, notes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(status, technician_id || null, notes || null, req.params.id);
    
    // If completed, update asset status back to Active
    if (status === 'Completed') {
      const request = db.prepare('SELECT asset_id FROM maintenance_requests WHERE id = ?').get(req.params.id) as any;
      if (request) {
        db.prepare("UPDATE assets SET status = 'Available' WHERE id = ?").run(request.asset_id);
        db.prepare('INSERT INTO asset_logs (asset_id, user_id, action, details) VALUES (?, ?, ?, ?)')
          .run(request.asset_id, (req as any).user.id, 'Maintenance Completed', 'Asset repair completed and status restored to Available');
      }
    }
    // If in progress, set asset to Under Maintenance
    if (status === 'In Progress') {
      const request = db.prepare('SELECT asset_id FROM maintenance_requests WHERE id = ?').get(req.params.id) as any;
      if (request) {
        db.prepare("UPDATE assets SET status = 'Under Maintenance' WHERE id = ?").run(request.asset_id);
      }
    }
    res.json({ success: true });
  });

  app.put('/api/maintenance/:id/assign', authenticate, (req, res) => {
    const { technician_id } = req.body;
    db.prepare('UPDATE maintenance_requests SET technician_id = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(technician_id, 'In Progress', req.params.id);
    
    const request = db.prepare('SELECT asset_id FROM maintenance_requests WHERE id = ?').get(req.params.id) as any;
    if (request) {
      db.prepare("UPDATE assets SET status = 'Under Maintenance' WHERE id = ?").run(request.asset_id);
    }
    res.json({ success: true });
  });

  // Get assigned assets for a user (custodian)
  app.get('/api/assignments', authenticate, (req: any, res) => {
    const userId = req.user.id;
    const userRole = req.user.role;
    
    let assignments;
    if (userRole === 'custodian') {
      // Get assets assigned to this custodian
      assignments = db.prepare(`
        SELECT a.*, c.name as category_name, au.username as assigned_to_name,
               asgn.id as assignment_id, asgn.assigned_at, asgn.returned_at,
               asgn.operator, asgn.receiver, asgn.location as assignment_location, asgn.notes as assignment_notes
        FROM assignments asgn
        JOIN assets a ON asgn.asset_id = a.id
        LEFT JOIN asset_categories c ON a.category_id = c.id
        JOIN users au ON asgn.user_id = au.id
        WHERE asgn.user_id = ? AND asgn.returned_at IS NULL
        ORDER BY asgn.assigned_at DESC
      `).all(userId);
    } else if (userRole === 'admin' || userRole === 'maintenance') {
      // Get all active assignments
      assignments = db.prepare(`
        SELECT a.*, c.name as category_name, au.username as assigned_to_name,
               asgn.id as assignment_id, asgn.assigned_at, asgn.returned_at,
               asgn.operator, asgn.receiver, asgn.location as assignment_location, asgn.notes as assignment_notes
        FROM assignments asgn
        JOIN assets a ON asgn.asset_id = a.id
        LEFT JOIN asset_categories c ON a.category_id = c.id
        JOIN users au ON asgn.user_id = au.id
        WHERE asgn.returned_at IS NULL
        ORDER BY asgn.assigned_at DESC
      `).all();
    }
    res.json(assignments || []);
  });

  // Create assignment (deploy asset)
  app.post('/api/assignments', authenticate, (req: any, res) => {
    const { asset_id, user_id, location, notes, operator, receiver } = req.body;
    
    // Check if asset is already assigned
    const existing = db.prepare('SELECT id FROM assignments WHERE asset_id = ? AND returned_at IS NULL').get(asset_id);
    if (existing) {
      return res.status(400).json({ error: 'Asset is already assigned' });
    }
    
    // Create assignment
    const result = db.prepare('INSERT INTO assignments (asset_id, user_id, operator, receiver, location, notes) VALUES (?, ?, ?, ?, ?, ?)')
      .run(asset_id, user_id, operator || null, receiver || null, location || null, notes || null);
    
    // Update asset status to Transferred and set location
    db.prepare("UPDATE assets SET status = 'Transferred', location = ? WHERE id = ?").run(location || 'Deployed', asset_id);
    
    // Log the action with operator and receiver info
    const details = `Asset assigned to user ID ${user_id}` + 
      (operator ? `, Operator: ${operator}` : '') + 
      (receiver ? `, Receiver: ${receiver}` : '') +
      (location ? `, Location: ${location}` : '');
    
    db.prepare('INSERT INTO asset_logs (asset_id, user_id, action, details) VALUES (?, ?, ?, ?)')
      .run(asset_id, req.user.id, 'Deployed', details);
    
    res.json({ id: result.lastInsertRowid });
  });

  // Return assignment
  app.put('/api/assignments/:id/return', authenticate, (req, res) => {
    const { condition } = req.body;
    const assignment = db.prepare('SELECT * FROM assignments WHERE id = ?').get(req.params.id) as any;
    
    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }
    
    // Mark as returned
    db.prepare('UPDATE assignments SET returned_at = CURRENT_TIMESTAMP WHERE id = ?').run(req.params.id);
    
    // Update asset status based on condition
    const newStatus = condition === 'Damaged' ? 'Under Maintenance' : 'Available';
    db.prepare('UPDATE assets SET status = ? WHERE id = ?').run(newStatus, assignment.asset_id);
    
    // Log the action
    db.prepare('INSERT INTO asset_logs (asset_id, user_id, action, details) VALUES (?, ?, ?, ?)')
      .run(assignment.asset_id, (req as any).user.id, 'Returned', `Asset returned. Condition: ${condition || 'Good'}`);
    
    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
