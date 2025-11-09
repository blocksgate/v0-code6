import { Database } from './supabase'

export interface SystemMetric {
  id: number
  timestamp: string
  cpu_usage: number
  memory_usage: number
  active_users: number
  requests_per_minute: number
  average_response_time: number
  error_rate: number
}

export interface SystemAlert {
  id: number
  timestamp: string
  type: 'error' | 'warning' | 'info'
  message: string
  details: Record<string, any>
}

export interface AuditLog {
  id: number
  timestamp: string
  action: string
  details: {
    message: string
    error: string
    stack?: string
  }
}

export type DbSystemMetrics = Database['public']['Tables']['system_metrics']['Row']
export type DbSystemAlerts = Database['public']['Tables']['system_alerts']['Row']
export type DbAuditLogs = Database['public']['Tables']['audit_logs']['Row']