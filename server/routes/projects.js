import express from 'express';
import Project from '../models/Project.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Test endpoint to validate roadmap structure
router.post('/test-roadmap', authMiddleware, async (req, res) => {
  try {
    console.log('Test roadmap endpoint called');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    
    const { roadmaps } = req.body;
    
    if (!roadmaps || !Array.isArray(roadmaps)) {
      return res.status(400).json({ error: 'roadmaps must be an array' });
    }
    
    // Validate each roadmap
    const validationErrors = [];
    roadmaps.forEach((roadmap, idx) => {
      if (!roadmap.id) validationErrors.push(`Roadmap ${idx}: missing id`);
      if (!roadmap.title) validationErrors.push(`Roadmap ${idx}: missing title`);
      if (!Array.isArray(roadmap.nodes)) validationErrors.push(`Roadmap ${idx}: nodes is not an array`);
      if (!Array.isArray(roadmap.links)) validationErrors.push(`Roadmap ${idx}: links is not an array`);
    });
    
    if (validationErrors.length > 0) {
      return res.status(400).json({ error: 'Validation failed', details: validationErrors });
    }
    
    res.json({ success: true, message: 'Roadmap structure is valid' });
  } catch (error) {
    console.error('Test roadmap error:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// Get all projects for user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const projects = await Project.find({ userId: req.userId }).sort({ lastEdited: -1 });
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single project
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const project = await Project.findOne({ _id: req.params.id, userId: req.userId });
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.json(project);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Create project
router.post('/', authMiddleware, async (req, res) => {
  try {
    const project = new Project({
      userId: req.userId,
      ...req.body
    });
    await project.save();
    res.status(201).json(project);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update project
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    console.log('Update project request:', {
      projectId: req.params.id,
      userId: req.userId,
      bodyKeys: Object.keys(req.body),
      hasRoadmaps: !!req.body.roadmaps,
      roadmapsCount: req.body.roadmaps?.length || 0
    });

    // Validate roadmaps structure if present
    if (req.body.roadmaps && Array.isArray(req.body.roadmaps)) {
      req.body.roadmaps = req.body.roadmaps.map(roadmap => {
        // Ensure nodes and links are arrays
        const nodes = Array.isArray(roadmap.nodes) ? roadmap.nodes : [];
        const links = Array.isArray(roadmap.links) ? roadmap.links : [];
        
        return {
          id: roadmap.id || '',
          title: roadmap.title || '',
          description: roadmap.description || '',
          nodes: nodes.map(n => ({
            id: String(n.id || ''),
            label: String(n.label || ''),
            type: String(n.type || 'concept'),
            status: String(n.status || 'locked')
          })),
          links: links.map(l => ({
            source: String(l.source || ''),
            target: String(l.target || '')
          })),
          progress: Number(roadmap.progress) || 0
        };
      });
      console.log('Cleaned roadmaps:', JSON.stringify(req.body.roadmaps, null, 2));
    }

    const project = await Project.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { ...req.body, lastEdited: new Date() },
      { new: true, runValidators: false }
    );
    
    if (!project) {
      console.log('Project not found:', req.params.id);
      return res.status(404).json({ error: 'Project not found' });
    }
    
    console.log('Project updated successfully');
    res.json(project);
  } catch (error) {
    console.error('Update project error:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// Delete project
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const project = await Project.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.json({ message: 'Project deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Save snippet to project
router.post('/:id/snippets', authMiddleware, async (req, res) => {
  try {
    const project = await Project.findOne({ _id: req.params.id, userId: req.userId });
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    project.snippets.push(req.body);
    project.lastEdited = new Date();
    await project.save();
    
    res.status(201).json(project);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
