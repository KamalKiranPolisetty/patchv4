import mongoose, { Schema, Document } from 'mongoose';

export interface IConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface IIncident extends Document {
  userId: mongoose.Types.ObjectId;
  category: string;
  subCategory: string;
  priority: number;
  urgency: number;
  impact: number;
  status: 'Open' | 'In Progress' | 'Resolved';
  lastUpdatedBy: string;
  conversation: IConversationMessage[];
  resolutionDetails: string;
  createdAt: Date;
  updatedAt: Date;
}

const ConversationMessageSchema = new Schema<IConversationMessage>({
  role: { type: String, enum: ['user', 'assistant'], required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
}, { _id: false });

const IncidentSchema = new Schema<IIncident>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  category: { type: String, required: true },
  subCategory: { type: String, required: true },
  priority: { type: Number, default: 5 },
  urgency: { type: Number, default: 3 },
  impact: { type: Number, default: 3 },
  status: { type: String, enum: ['Open', 'In Progress', 'Resolved'], default: 'Open' },
  lastUpdatedBy: { type: String, default: '' },
  conversation: [ConversationMessageSchema],
  resolutionDetails: { type: String, default: '' },
}, { timestamps: true });

export default mongoose.models.Incident || mongoose.model<IIncident>('Incident', IncidentSchema);
