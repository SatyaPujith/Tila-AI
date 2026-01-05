import mongoose from 'mongoose';

// Node schema for roadmap nodes
const nodeSchema = new mongoose.Schema({
  id: { type: String, required: true },
  label: { type: String, required: true },
  type: { type: String, default: 'concept' },
  status: { type: String, default: 'locked' },
  x: { type: Number },
  y: { type: Number }
}, { _id: false });

// Link schema for roadmap connections
const linkSchema = new mongoose.Schema({
  source: { type: String, required: true },
  target: { type: String, required: true }
}, { _id: false });

const roadmapSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  topic: { type: String, required: true },
  nodes: { type: [nodeSchema], default: [] },
  links: { type: [linkSchema], default: [] },
  createdAt: { type: Date, default: Date.now }
});

// Clear any existing model to prevent caching issues
if (mongoose.models.Roadmap) {
  delete mongoose.models.Roadmap;
}

export default mongoose.model('Roadmap', roadmapSchema);
