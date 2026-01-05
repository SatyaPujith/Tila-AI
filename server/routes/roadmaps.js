import express from 'express';
import Roadmap from '../models/Roadmap.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Get all roadmaps for user and project
router.get('/:projectId', authMiddleware, async (req, res) => {
  try {
    console.log('Fetching roadmaps for user:', req.userId, 'project:', req.params.projectId);
    const roadmaps = await Roadmap.find({ 
      userId: req.userId,
      projectId: req.params.projectId 
    }).sort({ createdAt: -1 });
    console.log('Found roadmaps:', roadmaps.length);
    res.json(roadmaps);
  } catch (error) {
    console.error('Error fetching roadmaps:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create roadmap
router.post('/:projectId', authMiddleware, async (req, res) => {
  try {
    let { topic, nodes, links } = req.body;
    const projectId = req.params.projectId;
    
    console.log('Creating roadmap for topic:', topic, 'project:', projectId);
    
    if (!topic) {
      return res.status(400).json({ error: 'Topic is required' });
    }
    
    // Parse if stringified
    if (typeof nodes === 'string') {
      try { nodes = JSON.parse(nodes); } catch (e) { nodes = []; }
    }
    if (typeof links === 'string') {
      try { links = JSON.parse(links); } catch (e) { links = []; }
    }
    
    // Ensure arrays
    nodes = Array.isArray(nodes) ? nodes : [];
    links = Array.isArray(links) ? links : [];
    
    // Clean and validate nodes
    const cleanNodes = nodes.map((node, idx) => ({
      id: String(node.id || idx + 1),
      label: String(node.label || 'Node'),
      type: String(node.type || 'concept'),
      status: String(node.status || 'locked'),
      ...(node.x != null && { x: Number(node.x) }),
      ...(node.y != null && { y: Number(node.y) })
    }));
    
    // Clean and validate links
    const cleanLinks = links.map(link => ({
      source: String(link.source || ''),
      target: String(link.target || '')
    })).filter(link => link.source && link.target);
    
    console.log(`Saving roadmap with ${cleanNodes.length} nodes and ${cleanLinks.length} links`);
    
    const roadmap = new Roadmap({
      userId: req.userId,
      projectId: projectId,
      topic,
      nodes: cleanNodes,
      links: cleanLinks
    });
    
    await roadmap.save();
    console.log('Roadmap saved:', roadmap._id);
    res.status(201).json(roadmap);
  } catch (error) {
    console.error('Create roadmap error:', error.message);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// Update roadmap node status
router.put('/:projectId/:id/nodes/:nodeId', authMiddleware, async (req, res) => {
  try {
    const roadmap = await Roadmap.findOne({ 
      _id: req.params.id, 
      userId: req.userId,
      projectId: req.params.projectId 
    });
    if (!roadmap) {
      return res.status(404).json({ error: 'Roadmap not found' });
    }
    
    const node = roadmap.nodes.find(n => n.id === req.params.nodeId);
    if (node) {
      node.status = req.body.status;
      await roadmap.save();
    }
    
    res.json(roadmap);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Generate challenges for a roadmap node
router.post('/:projectId/:id/nodes/:nodeId/challenges', authMiddleware, async (req, res) => {
  try {
    const { nodeLabel } = req.body;
    const roadmap = await Roadmap.findOne({ 
      _id: req.params.id, 
      userId: req.userId,
      projectId: req.params.projectId 
    });
    
    if (!roadmap) {
      return res.status(404).json({ error: 'Roadmap not found' });
    }
    
    // Return success - challenges will be generated on frontend
    res.json({ success: true, nodeLabel, roadmapId: roadmap._id });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
