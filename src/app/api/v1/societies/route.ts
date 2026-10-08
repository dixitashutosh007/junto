import { NextResponse, connection } from 'next/server';
import { getRepository } from '@/lib/db';

export async function GET() {
  // Always read at request time; never prerender society data into the build
  await connection();

  const repo = getRepository();
  const societies = await repo.listSocieties();
  return NextResponse.json({ societies });
}
