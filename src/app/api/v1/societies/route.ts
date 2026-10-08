import { NextRequest, NextResponse } from 'next/server';
import { getRepository } from '@/lib/db';

export async function GET(req: NextRequest) {
  const repo = getRepository();
  const societies = await repo.listSocieties();
  return NextResponse.json({ societies });
}
