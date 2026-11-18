import { NextRequest, NextResponse } from 'next/server';
import { verifyRequestAuth } from '@/src/lib/api-auth.ts';
import { getOrCreateUser, updateUserProfileRow } from '@/src/db/gateway.ts';

const TUTORIAL_SECTIONS = new Set([
  'visao-geral',
  'materias-cursos',
  'cronometro-pomodoro',
  'loja',
  'planejador-semanal',
  'estatisticas-metas',
  'anotacoes',
  'estudos-inteligentes',
  'comunidade',
  'configuracoes-ajuda',
]);

export async function PATCH(req: NextRequest) {
  const decoded = await verifyRequestAuth(req);
  if (!decoded) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    if (body.tutorialsSeen !== undefined) {
      const value = body.tutorialsSeen;
      if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return NextResponse.json({ error: 'Invalid tutorial progress.' }, { status: 400 });
      }
      body.tutorialsSeen = Object.fromEntries(
        Object.entries(value)
          .filter(([section, seen]) => TUTORIAL_SECTIONS.has(section) && seen === true)
          .map(([section]) => [section, true])
      );
    }
    await getOrCreateUser(
      decoded.uid,
      decoded.email || 'estudante@universidade.edu.br',
      decoded.name
    );
    const updated = await updateUserProfileRow(decoded.uid, body);
    if (!updated) {
      return NextResponse.json({ error: 'Profile not found.' }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Failed to update profile.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
