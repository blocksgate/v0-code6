import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';

export async function validateWalletAuth(req: NextRequest) {
  const supabase = createClient();
  
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (error || !session) {
    return NextResponse.json(
      { error: 'Unauthorized - No valid session' },
      { status: 401 }
    );
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('eth_address')
    .eq('id', session.user.id)
    .single();

  if (!profile?.eth_address) {
    return NextResponse.json(
      { error: 'Unauthorized - No wallet connected' },
      { status: 401 }
    );
  }

  return {
    userId: session.user.id,
    walletAddress: profile.eth_address
  };
}