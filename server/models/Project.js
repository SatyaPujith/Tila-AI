import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  files: [{
    id: String,
    name: String,
    type: String,
    size: String,
    content: String,
    uploadDate: Date,
    isVirtual: Boolean
  }],
  messages: [{
    id: String,
    role: String,
    text: String,
    timestamp: Date,
    codeSnippet: String
  }],
  code: { type: String, default: '' },
  language: { type: String, default: 'python' },
  snippets: [{
    id: String,
    title: String,
    code: String,
    language: String,
    explanation: String,
    tags: [String],
    createdAt: Date,
    complexity: String
  }],
  // Per-notebook challenges
  challenges: [{
    id: String,
    title: String,
    difficulty: String,
    description: String,
    starterCode: String,
    testCases: [String],
    completed: Boolean,
    solution: String
  }],
  // Per-notebook roadmaps
  roadmaps: [{
    id: String,
    title: String,
    description: String,
    nodes: [{
      id: String,
      label: String,
      type: String,
      status: String,
      x: Number,
      y: Number
    }],
    links: [{
      source: String,
      target: String
    }],
    progress: Number
  }],
  lastEdited: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Project', projectSchema);
