import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { getSession } from '@/lib/auth';
import IncidentModel from '@/models/Incident';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const incidents = await IncidentModel.find({ userId: session.userId })
      .sort({ createdAt: -1 })
      .select('-conversation');

    return NextResponse.json({ incidents });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
