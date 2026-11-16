import { NextRequest, NextResponse } from 'next/server';
import { verifyRequestAuth } from '@/src/lib/api-auth.ts';

export async function POST(req: NextRequest) {
  const decoded = await verifyRequestAuth(req);
  if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return NextResponse.json(
    { error: 'Registro direto foi removido. Inicie e conclua a sessão pelo cronômetro.' },
    { status: 410 }
  );
}
