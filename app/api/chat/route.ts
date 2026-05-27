import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { getSession } from '@/lib/auth';
import DocumentModel from '@/models/Document';
import IncidentModel from '@/models/Incident';

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';

const CATEGORY_CONFIG: Record<string, { category: string; subCategory: string; priority: number; urgency: number; impact: number }> = {
  VDI: { category: 'Software', subCategory: 'VDI', priority: 5, urgency: 3, impact: 3 },
  Printer: { category: 'Software', subCategory: 'Printer', priority: 5, urgency: 3, impact: 3 },
  Scanner: { category: 'Hardware', subCategory: 'Scanner', priority: 5, urgency: 3, impact: 3 },
};

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { message, tileCategory, incidentId: existingIncidentId } = await req.json();

    if (!message || !tileCategory) {
      return NextResponse.json({ error: 'Message and tileCategory are required' }, { status: 400 });
    }

    await connectDB();

    let incident;

    if (existingIncidentId) {
      incident = await IncidentModel.findById(existingIncidentId);
    }

    // Create incident on first message
    if (!incident) {
      const cfg = CATEGORY_CONFIG[tileCategory] || CATEGORY_CONFIG.VDI;
      incident = await IncidentModel.create({
        userId: session.userId,
        ...cfg,
        status: 'Open',
        lastUpdatedBy: '',
        conversation: [],
      });

      // Link existing documents to this incident
      await DocumentModel.updateMany(
        { userId: session.userId, tileCategory, incidentId: { $exists: false } },
        { incidentId: incident._id }
      );
    }

    // Get extracted text for context
    const docs = await DocumentModel.find({ userId: session.userId, tileCategory });
    const context = docs.map(d => d.extractedText).filter(Boolean).join('\n\n');

    // Build messages for Ollama
    const systemPrompt = context
      ? `You are Patch, an IT support assistant. Use the following documentation to help resolve the user's issue:\n\n${context.slice(0, 8000)}\n\nIf you resolve the issue, end your message with [RESOLVED]. If you cannot resolve and need to escalate, end with [ESCALATE].`
      : `You are Patch, an IT support assistant. Help the user resolve their IT issue. If you resolve the issue, end your message with [RESOLVED]. If you cannot resolve and need to escalate, end with [ESCALATE].`;

    const ollamaMessages = [
      ...incident.conversation.map((m: { role: string; content: string }) => ({ role: m.role, content: m.content })),
      { role: 'user', content: message },
    ];

    let aiResponse = '';
    try {
      const ollamaRes = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'gemma4:31b-cloud',
          messages: [{ role: 'system', content: systemPrompt }, ...ollamaMessages],
          stream: false,
        }),
        signal: AbortSignal.timeout(30000),
      });

      if (!ollamaRes.ok) throw new Error('Ollama error');
      const data = await ollamaRes.json();
      aiResponse = data.message?.content || 'I was unable to generate a response.';
    } catch {
      aiResponse = "I'm having trouble connecting. Please try again.";
    }

    // Check for resolution/escalation signals
    let newStatus = incident.status;
    let lastUpdatedBy = incident.lastUpdatedBy;
    let endOfFlow: 'resolved' | 'escalated' | null = null;

    if (aiResponse.includes('[RESOLVED]')) {
      aiResponse = aiResponse.replace('[RESOLVED]', '').trim();
      aiResponse += '\n\nAwesome, glad that worked! Is there anything else I can help with?';
      newStatus = 'Resolved';
      lastUpdatedBy = 'Patch agent';
      endOfFlow = 'resolved';
    } else if (aiResponse.includes('[ESCALATE]')) {
      aiResponse = aiResponse.replace('[ESCALATE]', '').trim();
      aiResponse += "\n\nI wasn't able to resolve the issue. I'm escalating this to our Trusted Experts for hands-on support.";
      newStatus = 'In Progress';
      lastUpdatedBy = 'L2 Team';
      endOfFlow = 'escalated';
    }

    // Save conversation
    await IncidentModel.findByIdAndUpdate(incident._id, {
      $push: {
        conversation: {
          $each: [
            { role: 'user', content: message, timestamp: new Date() },
            { role: 'assistant', content: aiResponse, timestamp: new Date() },
          ],
        },
      },
      status: newStatus,
      lastUpdatedBy,
      ...(newStatus === 'Resolved' && { resolutionDetails: aiResponse }),
    });

    return NextResponse.json({
      response: aiResponse,
      incidentId: incident._id.toString(),
      status: newStatus,
      endOfFlow,
    });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
