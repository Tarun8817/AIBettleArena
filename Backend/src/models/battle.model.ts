import mongoose, { Schema, Document } from 'mongoose';

export interface IBattleMessage {
  problem: string;
  solution_1: string;
  solution_2: string;
  judge: {
    solution_1_score: number;
    solution_2_score: number;
    solution_1_reasoning?: string;
    solution_2_reasoning?: string;
  } | null;
  createdAt?: Date;
}

export interface IBattle extends Document {
  title: string;
  messages: IBattleMessage[];
  createdAt: Date;
  updatedAt: Date;
}

const BattleMessageSchema = new Schema<IBattleMessage>({
  problem: { type: String, required: true },
  solution_1: { type: String, default: '' },
  solution_2: { type: String, default: '' },
  judge: { type: Schema.Types.Mixed, default: null },
  createdAt: { type: Date, default: Date.now }
});

const BattleSchema = new Schema<IBattle>({
  title: { type: String, required: true },
  messages: [BattleMessageSchema]
}, { timestamps: true });

export const Battle = mongoose.model<IBattle>('Battle', BattleSchema);
