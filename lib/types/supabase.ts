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

export type Database = {
  public: {
    Tables: Tables;
    Functions: {
      get_daily_pnl: {
        Args: {
          user_id: string;
          start_date: string;
          end_date: string;
          token_filter: string | null;
        };
        Returns: {
          date: string;
          pnl: string;
        }[];
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
}