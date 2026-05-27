import mongoose, { Schema, Document } from 'mongoose';

export interface IDocument extends Document {
  userId: mongoose.Types.ObjectId;
  tileCategory: 'VDI' | 'Printer' | 'Scanner';
  fileName: string;
  extractedText: string;
  fileUrl: string;
  uploadedAt: Date;
  incidentId?: mongoose.Types.ObjectId;
}

const DocumentSchema = new Schema<IDocument>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  tileCategory: { type: String, enum: ['VDI', 'Printer', 'Scanner'], required: true },
  fileName: { type: String, required: true },
  extractedText: { type: String, default: '' },
  fileUrl: { type: String, required: true },
  uploadedAt: { type: Date, default: Date.now },
  incidentId: { type: Schema.Types.ObjectId, ref: 'Incident' },
});

export default mongoose.models.Document || mongoose.model<IDocument>('Document', DocumentSchema);
