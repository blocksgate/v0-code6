export interface Order {
  id: string;
  user_id: string;
  token: string;
  amount: string;
  price: string;
  side: 'buy' | 'sell';
  status: 'pending' | 'filled' | 'cancelled';
  created_at: string;
  updated_at: string;
  filled_amount: string;
  remaining_amount: string;
  type: 'market' | 'limit';
  tx_hash?: string;
  fee?: string;
}

export interface Trade {
  id: string;
  user_id: string;
  token: string;
  amount: string;
  price: string;
  fee: string;
  side: 'buy' | 'sell';
  executed_at: string;
  tx_hash: string;
  status: 'pending' | 'completed' | 'failed';
}

export interface Portfolio {
  user_id: string;
  token: string;
  amount: string;
  average_entry_price: string;
  current_price: string;
  unrealized_pnl: string;
  realized_pnl: string;
  last_updated: string;
}

export interface PortfolioSummary {
  user_id: string;
  total_value: string;
  total_pnl: string;
  last_updated: string;
}

export interface Profile {
  id: string;
  eth_address: string;
  email: string;
  updated_at: string;
  created_at: string;
  username?: string;
  full_name?: string;
  avatar_url?: string;
  preferences?: Record<string, any>;
}

export interface DailyPnL {
  date: string;
  pnl: string;
}

export interface SystemMetricRow {
  id: string;
  timestamp: string;
  cpu_usage: number;
  memory_usage: number;
  active_users: number;
  requests_per_minute: number;
  average_response_time: number;
  error_rate: number;
  created_at: string;
}

export interface SystemAlertRow {
  id: string;
  type: "error" | "warning" | "info";
  message: string;
  details: Record<string, any>;
  timestamp: string;
  created_at: string;
}

export interface AuditLogRow {
  id: string;
  action: string;
  details: {
    message: string;
    error: string;
    stack?: string;
  };
  timestamp: string;
  created_at: string;
}

export type Database = {
  public: {
    Tables: {
      active_sessions: {
        Row: {
          id: string;
          user_id: string;
          last_seen: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['active_sessions']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['active_sessions']['Row']>;
      };
      system_metrics: {
        Row: SystemMetricRow;
        Insert: Omit<SystemMetricRow, "id" | "created_at">;
        Update: Partial<SystemMetricRow>;
      };
      system_alerts: {
        Row: SystemAlertRow;
        Insert: Omit<SystemAlertRow, "id" | "created_at">;
        Update: Partial<SystemAlertRow>;
      };
      audit_logs: {
        Row: AuditLogRow;
        Insert: Omit<AuditLogRow, "id" | "created_at">;
        Update: Partial<AuditLogRow>;
      };
      profiles: Tables["profiles"];
      orders: Tables["orders"];
      trades: Tables["trades"];
      portfolios: Tables["portfolios"];
      portfolio_summaries: Tables["portfolio_summaries"];
    };
    Functions: {
      get_daily_pnl: {
        Args: {
          user_id: string;
          start_date: string;
          end_date: string;
          token_filter: string | null;
        };
        Returns: Array<{
          date: string;
          pnl: string;
        }>;
      };
      get_active_sessions_count: {
        Args: {
          window_minutes: number;
        };
        Returns: number;
      };
      get_request_rate: {
        Args: {
          window_minutes: number;
        };
        Returns: number;
      };
    };
  };
}

export interface Tables {
  profiles: {
    Row: Profile;
    Insert: Omit<Profile, 'id' | 'created_at' | 'updated_at'>;
    Update: Partial<Profile>;
  };
  orders: {
    Row: Order;
    Insert: Omit<Order, 'id' | 'created_at' | 'updated_at'>;
    Update: Partial<Order>;
  };
  trades: {
    Row: Trade;
    Insert: Omit<Trade, 'id'>;
    Update: Partial<Trade>;
  };
  portfolios: {
    Row: Portfolio;
    Insert: Portfolio;
    Update: Partial<Portfolio>;
  };
  portfolio_summaries: {
    Row: PortfolioSummary;
    Insert: PortfolioSummary;
    Update: Partial<PortfolioSummary>;
  };
  system_metrics: {
    Row: {
      id: string;
      timestamp: string;
      cpu_usage: number;
      memory_usage: number;
      active_users: number;
      requests_per_minute: number;
      average_response_time: number;
      error_rate: number;
      created_at: string;
    };
    Insert: Omit<Tables["system_metrics"]["Row"], "id" | "created_at">;
    Update: Partial<Tables["system_metrics"]["Row"]>;
  };
  system_alerts: {
    Row: {
      id: string;
      type: "error" | "warning" | "info";
      message: string;
      details: Record<string, any>;
      timestamp: string;
      created_at: string;
    };
    Insert: Omit<Tables["system_alerts"]["Row"], "id" | "created_at">;
    Update: Partial<Tables["system_alerts"]["Row"]>;
  };
  audit_logs: {
    Row: {
      id: string;
      action: string;
      details: {
        message: string;
        error: string;
        stack?: string;
      };
      timestamp: string;
      created_at: string;
    };
    Insert: Omit<Tables["audit_logs"]["Row"], "id" | "created_at">;
    Update: Partial<Tables["audit_logs"]["Row"]>;
  };
}