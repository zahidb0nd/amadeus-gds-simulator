import { NextRequest, NextResponse } from 'next/server';
import { executeCommand } from '@/lib/command-engine';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as { command?: unknown; sessionId?: unknown };
  const command = typeof body.command === 'string' ? body.command : '';
  const sessionId = typeof body.sessionId === 'string' && body.sessionId.trim().length > 0 ? body.sessionId : 'default';
  const result = await executeCommand(command, { sessionId });

  return NextResponse.json(
    {
      ok: result.ok,
      command: result.command,
      echo: result.echo,
      output: result.output
    },
    { status: result.ok ? 200 : 400 }
  );
}