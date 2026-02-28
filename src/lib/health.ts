import { pool } from './db';

export interface HealthCheckResult {
  status: 'ok' | 'degraded' | 'unhealthy';
  timestamp: string;
  checks: {
    database: {
      status: 'ok' | 'error';
      latency_ms?: number;
      error?: string;
    };
  };
}

export async function checkHealth(): Promise<HealthCheckResult> {
  const checks: HealthCheckResult['checks'] = {
    database: { status: 'ok' },
  };

  const dbStart = Date.now();
  try {
    await pool.query('SELECT 1');
    checks.database.latency_ms = Date.now() - dbStart;
  } catch (error) {
    checks.database.status = 'error';
    checks.database.error = error instanceof Error ? error.message : 'Unknown error';
  }

  const allOk = Object.values(checks).every((c) => c.status === 'ok');
  const status = allOk ? 'ok' : 'degraded';

  return {
    status,
    timestamp: new Date().toISOString(),
    checks,
  };
}
