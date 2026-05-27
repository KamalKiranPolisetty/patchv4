import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { getSession } from '@/lib/auth';
import FeedbackModel from '@/models/Feedback';

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { incidentId, rating } = await req.json();

    if (!incidentId || !rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Invalid feedback data' }, { status: 400 });
    }

    await connectDB();
    await FeedbackModel.create({ incidentId, rating });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Unable to save feedback, please try again' }, { status: 500 });
  }
}
