import mongoose, { Schema, Document } from 'mongoose';

export interface IFeedback extends Document {
  incidentId: mongoose.Types.ObjectId;
  rating: number;
  timestamp: Date;
}

const FeedbackSchema = new Schema<IFeedback>({
  incidentId: { type: Schema.Types.ObjectId, ref: 'Incident', required: true },
  rating: { type: Number, min: 1, max: 5, required: true },
  timestamp: { type: Date, default: Date.now },
});

export default mongoose.models.Feedback || mongoose.model<IFeedback>('Feedback', FeedbackSchema);
