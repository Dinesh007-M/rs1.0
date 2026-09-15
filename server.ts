import express, { Request, Response } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import pg from 'pg';
import dns from 'dns';
import { createClient } from '@supabase/supabase-js';

// Ensure IPv4 resolution preference
dns.setDefaultResultOrder('ipv4first');

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Supabase PostgreSQL Pool
const pool = new pg.Pool({
  user: process.env.PGUSER || 'postgres.kbefnpofbsgsumkpkfpa',
  password: process.env.PGPASSWORD || 'Road@123#777',
  host: process.env.PGHOST || 'aws-0-ap-northeast-1.pooler.supabase.com',
  port: Number(process.env.PGPORT) || 5432,
  database: process.env.PGDATABASE || 'postgres',
  ssl: { rejectUnauthorized: false },
  max: 15,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 8000,
});

pool.on('error', (err) => {
  console.error('Unexpected Supabase Postgres pool error:', err.message);
});

// Helper for queries with logging
async function dbQuery(text: string, params: any[] = []) {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  // console.log('DB Query executed:', { text: text.substring(0, 80), duration, rows: res.rowCount });
  return res;
}

// ---------------------------------------------------------------------------
// 1. SYSTEM HEALTH & DIAGNOSTICS
// ---------------------------------------------------------------------------
app.get('/api/health', async (_req: Request, res: Response) => {
  try {
    const result = await dbQuery('SELECT NOW() as db_time, current_database() as db_name, version() as version;');
    res.json({
      status: 'ONLINE',
      database: 'Supabase PostgreSQL (Connected)',
      db_time: result.rows[0].db_time,
      db_name: result.rows[0].db_name,
      pool_total: pool.totalCount,
      pool_idle: pool.idleCount,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('Database health check failed:', err.message);
    res.status(500).json({
      status: 'DEGRADED',
      database: 'Supabase PostgreSQL Disconnected',
      error: err.message,
    });
  }
});

// ---------------------------------------------------------------------------
// 2. LIVE MUNICIPAL STATS AGGREGATE
// ---------------------------------------------------------------------------
app.get('/api/stats', async (_req: Request, res: Response) => {
  try {
    const [defectStats, busStats, orderStats] = await Promise.all([
      dbQuery(`
        SELECT 
          COUNT(*) as total_defects,
          COUNT(*) FILTER (WHERE status = 'VERIFIED') as verified_defects,
          COUNT(*) FILTER (WHERE status = 'REPAIRED') as repaired_defects,
          COUNT(*) FILTER (WHERE status IN ('DETECTED', 'IN_REPAIR')) as pending_defects,
          COUNT(*) FILTER (WHERE severity = 'CRITICAL') as critical_defects,
          AVG(confidence_score) as avg_confidence
        FROM public.road_defects;
      `),
      dbQuery(`
        SELECT 
          COUNT(*) as total_buses,
          COUNT(*) FILTER (WHERE status = 'ACTIVE_EN_ROUTE') as active_buses
        FROM public.buses;
      `),
      dbQuery(`
        SELECT 
          COUNT(*) as total_orders,
          COUNT(*) FILTER (WHERE status = 'DISPATCHED') as dispatched_orders,
          COUNT(*) FILTER (WHERE status = 'COMPLETED') as completed_orders
        FROM public.work_orders;
      `),
    ]);

    const d = defectStats.rows[0];
    const b = busStats.rows[0];
    const o = orderStats.rows[0];

    res.json({
      total_defects: parseInt(d.total_defects || '0', 10),
      verified_defects: parseInt(d.verified_defects || '0', 10),
      repaired_defects: parseInt(d.repaired_defects || '0', 10),
      pending_defects: parseInt(d.pending_defects || '0', 10),
      critical_defects: parseInt(d.critical_defects || '0', 10),
      avg_confidence: parseFloat(d.avg_confidence || '0.92'),
      total_buses: parseInt(b.total_buses || '0', 10),
      active_buses: parseInt(b.active_buses || '0', 10),
      total_work_orders: parseInt(o.total_orders || '0', 10),
      dispatched_work_orders: parseInt(o.dispatched_orders || '0', 10),
      completed_work_orders: parseInt(o.completed_orders || '0', 10),
    });
  } catch (err: any) {
    console.error('Failed to aggregate stats:', err);
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// 3. ROAD DEFECTS CRUD (Reports Module)
// ---------------------------------------------------------------------------
app.get('/api/defects', async (req: Request, res: Response) => {
  try {
    const { status, severity, defect_type, bus_id, user_id, limit = '100', offset = '0', search } = req.query;

    let query = `SELECT * FROM public.road_defects WHERE 1=1`;
    const params: any[] = [];
    let pIndex = 1;

    if (status && status !== 'ALL') {
      query += ` AND status = $${pIndex++}`;
      params.push(status);
    }
    if (severity && severity !== 'ALL') {
      query += ` AND severity = $${pIndex++}`;
      params.push(severity);
    }
    if (defect_type && defect_type !== 'ALL') {
      query += ` AND defect_type = $${pIndex++}`;
      params.push(defect_type);
    }
    if (bus_id) {
      query += ` AND bus_id = $${pIndex++}`;
      params.push(bus_id);
    }
    if (user_id) {
      query += ` AND user_id = $${pIndex++}`;
      params.push(user_id);
    }
    if (search) {
      query += ` AND (address ILIKE $${pIndex} OR id ILIKE $${pIndex} OR reported_by_name ILIKE $${pIndex})`;
      params.push(`%${search}%`);
      pIndex++;
    }

    query += ` ORDER BY created_at DESC LIMIT $${pIndex++} OFFSET $${pIndex++};`;
    params.push(parseInt(limit as string, 10), parseInt(offset as string, 10));

    const result = await dbQuery(query, params);
    res.json(result.rows);
  } catch (err: any) {
    console.error('Error fetching defects:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/defects/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await dbQuery('SELECT * FROM public.road_defects WHERE id = $1;', [id]);
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Defect not found' });
      return;
    }
    res.json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/defects', async (req: Request, res: Response) => {
  try {
    const {
      id,
      defect_type,
      severity = 'MEDIUM',
      confidence_score = 0.92,
      status = 'DETECTED',
      latitude,
      longitude,
      address = 'Reported Location',
      bus_id,
      user_id,
      reported_by_name = 'Mobile Sensing Node',
      image_url,
      evidence_uris = [],
      verification_count = 1,
      assigned_to,
      work_order_id,
      estimated_cost_inr = 8500,
      speed_kmh = 32,
    } = req.body;

    if (!defect_type) {
      res.status(400).json({ error: 'defect_type is required' });
      return;
    }

    const defectId = id || `DEF-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const lat = Number(latitude) || 12.9716;
    const lng = Number(longitude) || 77.5946;

    const query = `
      INSERT INTO public.road_defects (
        id, defect_type, severity, confidence_score, status, latitude, longitude,
        address, bus_id, user_id, reported_by_name, image_url, evidence_uris,
        verification_count, assigned_to, work_order_id, estimated_cost_inr, speed_kmh,
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, NOW(), NOW())
      ON CONFLICT (id) DO UPDATE SET
        verification_count = public.road_defects.verification_count + 1,
        confidence_score = GREATEST(public.road_defects.confidence_score, EXCLUDED.confidence_score),
        status = CASE WHEN EXCLUDED.status = 'VERIFIED' THEN 'VERIFIED' ELSE public.road_defects.status END,
        updated_at = NOW()
      RETURNING *;
    `;

    const params = [
      defectId,
      defect_type,
      severity,
      confidence_score,
      status,
      lat,
      lng,
      address,
      bus_id || null,
      user_id || null,
      reported_by_name,
      image_url || 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80',
      evidence_uris,
      verification_count,
      assigned_to || null,
      work_order_id || null,
      estimated_cost_inr,
      speed_kmh,
    ];

    const result = await dbQuery(query, params);

    // Also auto-append an audit log for transparency
    try {
      await dbQuery(`
        INSERT INTO public.audit_logs (id, user_name, user_role, action, target_resource, result, justification, created_at)
        VALUES ($1, $2, 'Mobile Edge AI', 'DEFECT_AUTO_INGESTED', $3, 'SUCCESS', 'Mobile camera defect synced to Supabase database', NOW());
      `, [`AUD-${Date.now().toString().slice(-6)}`, reported_by_name, `${defectId} (${defect_type})`]);
    } catch {
      // Quiet catch for audit log
    }

    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    console.error('Error inserting defect:', err);
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/defects/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, assigned_to, work_order_id, verification_count, confidence_score, severity } = req.body;

    const fields: string[] = [];
    const params: any[] = [];
    let pIdx = 1;

    if (status !== undefined) {
      fields.push(`status = $${pIdx++}`);
      params.push(status);
    }
    if (assigned_to !== undefined) {
      fields.push(`assigned_to = $${pIdx++}`);
      params.push(assigned_to);
    }
    if (work_order_id !== undefined) {
      fields.push(`work_order_id = $${pIdx++}`);
      params.push(work_order_id);
    }
    if (verification_count !== undefined) {
      fields.push(`verification_count = $${pIdx++}`);
      params.push(verification_count);
    }
    if (confidence_score !== undefined) {
      fields.push(`confidence_score = $${pIdx++}`);
      params.push(confidence_score);
    }
    if (severity !== undefined) {
      fields.push(`severity = $${pIdx++}`);
      params.push(severity);
    }

    fields.push(`updated_at = NOW()`);

    if (fields.length === 1) {
      res.status(400).json({ error: 'No fields provided to update' });
      return;
    }

    params.push(id);
    const query = `UPDATE public.road_defects SET ${fields.join(', ')} WHERE id = $${pIdx} RETURNING *;`;
    const result = await dbQuery(query, params);

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Defect not found' });
      return;
    }

    res.json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/defects/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await dbQuery('DELETE FROM public.road_defects WHERE id = $1;', [id]);
    res.json({ success: true, message: `Defect ${id} deleted` });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// 4. BUSES & FLEET TELEMETRY
// ---------------------------------------------------------------------------
app.get('/api/buses', async (_req: Request, res: Response) => {
  try {
    const result = await dbQuery('SELECT * FROM public.buses ORDER BY id ASC;');
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/buses/telemetry', async (req: Request, res: Response) => {
  try {
    const { id, latitude, longitude, speed, status = 'ACTIVE_EN_ROUTE', thermal_status = 'NOMINAL', fps = 30.0 } = req.body;
    if (!id) {
      res.status(400).json({ error: 'Bus ID required' });
      return;
    }

    const query = `
      INSERT INTO public.buses (id, route_number, latitude, longitude, speed, status, thermal_status, fps, last_heartbeat)
      VALUES ($1, 'Live Mobile Bus Route', $2, $3, $4, $5, $6, $7, NOW())
      ON CONFLICT (id) DO UPDATE SET
        latitude = EXCLUDED.latitude,
        longitude = EXCLUDED.longitude,
        speed = EXCLUDED.speed,
        status = EXCLUDED.status,
        thermal_status = EXCLUDED.thermal_status,
        fps = EXCLUDED.fps,
        last_heartbeat = NOW()
      RETURNING *;
    `;
    const result = await dbQuery(query, [id, latitude, longitude, speed, status, thermal_status, fps]);
    res.json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// 5. WORK ORDERS (PWD MAINTENANCE)
// ---------------------------------------------------------------------------
app.get('/api/work-orders', async (_req: Request, res: Response) => {
  try {
    const result = await dbQuery('SELECT * FROM public.work_orders ORDER BY created_at DESC;');
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/work-orders', async (req: Request, res: Response) => {
  try {
    const { id, defect_id, title, priority = 'HIGH', status = 'DISPATCHED', contractor_name, asphalt_volume_m3 = 0.45, sla_hours = 24 } = req.body;
    const orderId = id || `TASK-PWD-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;

    const query = `
      INSERT INTO public.work_orders (id, defect_id, title, priority, status, contractor_name, asphalt_volume_m3, sla_hours, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
      ON CONFLICT (id) DO UPDATE SET
        status = EXCLUDED.status,
        contractor_name = EXCLUDED.contractor_name
      RETURNING *;
    `;
    const result = await dbQuery(query, [orderId, defect_id, title, priority, status, contractor_name, asphalt_volume_m3, sla_hours]);

    if (defect_id) {
      await dbQuery(`UPDATE public.road_defects SET work_order_id = $1, assigned_to = $2, status = 'IN_REPAIR' WHERE id = $3;`, [
        orderId,
        contractor_name,
        defect_id,
      ]);
    }

    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/work-orders/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, completed_at } = req.body;
    const query = `
      UPDATE public.work_orders 
      SET status = $1, completed_at = CASE WHEN $1 = 'COMPLETED' THEN NOW() ELSE completed_at END
      WHERE id = $2 RETURNING *;
    `;
    const result = await dbQuery(query, [status, id]);
    res.json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// 6. AUDIT LOGS
// ---------------------------------------------------------------------------
app.get('/api/audit-logs', async (_req: Request, res: Response) => {
  try {
    const result = await dbQuery('SELECT * FROM public.audit_logs ORDER BY created_at DESC LIMIT 100;');
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/audit-logs', async (req: Request, res: Response) => {
  try {
    const { id, user_id, user_name, user_role, action, target_resource, result = 'SUCCESS', ip_address, justification } = req.body;
    const auditId = id || `AUD-${Date.now().toString().slice(-6)}`;
    const query = `
      INSERT INTO public.audit_logs (id, user_id, user_name, user_role, action, target_resource, result, ip_address, justification, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
      RETURNING *;
    `;
    const resDb = await dbQuery(query, [auditId, user_id, user_name, user_role, action, target_resource, result, ip_address, justification]);
    res.status(201).json(resDb.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// 7. EDGE AI MODELS
// ---------------------------------------------------------------------------
app.get('/api/models', async (_req: Request, res: Response) => {
  try {
    const result = await dbQuery('SELECT * FROM public.ai_models ORDER BY id ASC;');
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/models/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, fleet_rollout_percent, current_version, previous_version } = req.body;
    const query = `
      UPDATE public.ai_models 
      SET 
        status = COALESCE($1, status),
        fleet_rollout_percent = COALESCE($2, fleet_rollout_percent),
        current_version = COALESCE($3, current_version),
        previous_version = COALESCE($4, previous_version),
        updated_at = NOW()
      WHERE id = $5 RETURNING *;
    `;
    const result = await dbQuery(query, [status, fleet_rollout_percent, current_version, previous_version, id]);
    res.json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// 8. STORAGE UPLOAD FALLBACK PROXY
// ---------------------------------------------------------------------------
app.post('/api/upload-evidence', async (req: Request, res: Response) => {
  try {
    const { imageBase64, filename } = req.body;
    if (!imageBase64) {
      res.status(400).json({ error: 'imageBase64 required' });
      return;
    }

    const fileId = filename || `defect_${Date.now()}.jpg`;
    const cleanBase64 = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');
    const buffer = Buffer.from(cleanBase64, 'base64');

    const supabase = createClient(
      process.env.SUPABASE_URL || 'https://kbefnpofbsgsumkpkfpa.supabase.co',
      process.env.SUPABASE_ANON_KEY || 'sb_publishable_8LtFE7690_7AFhN4sMTmIg_oX-hKYJZ'
    );

    const { error: uploadError } = await supabase.storage
      .from('road-report-images')
      .upload(fileId, buffer, {
        contentType: 'image/jpeg',
        upsert: true,
      });

    if (uploadError) {
      console.warn('Supabase storage upload notice from server:', uploadError.message);
    }

    const { data: urlData } = supabase.storage
      .from('road-report-images')
      .getPublicUrl(fileId);

    const publicUrl =
      urlData?.publicUrl ||
      `https://kbefnpofbsgsumkpkfpa.supabase.co/storage/v1/object/public/road-report-images/${fileId}`;

    res.json({
      url: publicUrl,
      path: fileId,
      status: 'STORED',
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// 9. VITE INTEGRATION & SERVER BOOTSTRAP
// ---------------------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Road Sense Supabase Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
