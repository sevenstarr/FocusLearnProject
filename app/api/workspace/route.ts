import { NextRequest, NextResponse } from 'next/server';
import { verifyRequestAuth } from '@/src/lib/api-auth.ts';
import {
  getOrCreateUser,
  getWorkspaceData,
  seedStarterWorkspaceIfNeeded,
} from '@/src/db/gateway.ts';

export async function GET(req: NextRequest) {
  const decoded = await verifyRequestAuth(req);
  if (!decoded) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await getOrCreateUser(
      decoded.uid,
      decoded.email || 'estudante@universidade.edu.br',
      decoded.name
    );
    await seedStarterWorkspaceIfNeeded(decoded.uid);
    const data = await getWorkspaceData(decoded.uid);
    return NextResponse.json(data);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Failed to load workspace.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
