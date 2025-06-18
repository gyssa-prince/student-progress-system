import express from 'express';
import Student from '../models/Student.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const students = await Student.find();
    res.json(students);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', async (req, res) => {
  const student = new Student({
    name: req.body.name,
    email: req.body.email,
    phone: req.body.phone,
    cfHandle: req.body.cfHandle
  });

  try {
    const newStudent = await student.save();
    res.status(201).json(newStudent);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ message: 'Student not found' });

    student.name = req.body.name || student.name;
    student.email = req.body.email || student.email;
    student.phone = req.body.phone || student.phone;
    student.cfHandle = req.body.cfHandle || student.cfHandle;

    const updatedStudent = await student.save();
    res.json(updatedStudent);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await Student.findByIdAndDelete(req.params.id);
    res.json({ message: 'Student deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/:id/profile', async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ message: 'Student not found' });
    res.json(student);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/:id/contests', async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ message: 'Student not found' });
    const days = parseInt(req.query.days) || 30;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const filtered = (student.contestHistory || []).filter(c => new Date(c.date) >= since);
    res.json(filtered);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/:id/problems', async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ message: 'Student not found' });
    const days = parseInt(req.query.days) || 30;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const history = (student.problemStats?.history || []).filter(h => new Date(h.date) >= since);
    res.json({
      history,
      buckets: student.problemStats?.buckets || {},
      heatmap: student.problemStats?.heatmap || {}
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/:id/sync', async (req, res) => {
  res.json({ message: 'Sync started' });
});

router.post('/sync/schedule', async (req, res) => {
  res.json({ message: 'Schedule updated' });
});

router.post('/:id/reminder-toggle', async (req, res) => {
  const student = await Student.findById(req.params.id);
  if (!student) return res.status(404).json({ message: 'Student not found' });
  student.reminderDisabled = !student.reminderDisabled;
  await student.save();
  res.json({ reminderDisabled: student.reminderDisabled });
});

router.get('/:id', async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ message: 'Student not found' });
    res.json(student);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;