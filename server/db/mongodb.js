import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const sessionSchema = new mongoose.Schema({
  _id: { type: String },
  stage: { type: Number, default: 1 },
  startStage: { type: Number, default: 1 },
  level: { type: Number, default: 1 },
  score: { type: Number, default: 0 },
  completed: { type: Boolean, default: false },
  state: { type: mongoose.Schema.Types.Mixed },
  createdAt: { type: Date, default: Date.now },
});

const playerSchema = new mongoose.Schema({
  sessionId: { type: String, required: true },
  userId: { type: String, required: true },
  name: { type: String, required: true },
  role: { type: String, enum: ['Architect', 'Builder'], required: true },
  joinedAt: { type: Date, default: Date.now },
});

export const User = mongoose.model('User', userSchema);
export const Session = mongoose.model('Session', sessionSchema);
export const Player = mongoose.model('Player', playerSchema);

export async function connectMongo() {
  await mongoose.connect(process.env.MONGO_DB_URI);
  console.log('✅  MongoDB connected');
}
