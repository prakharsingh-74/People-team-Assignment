const express = require('express');
const router = express.Router();
const notesController = require('../controllers/notesController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

// Notes CRUD
router.post('/', notesController.createNote);
router.get('/', notesController.getAllNotes);
router.get('/:id', notesController.getNoteById);
router.put('/:id', notesController.updateNote);
router.delete('/:id', notesController.deleteNote);

// Sharing
router.post('/:id/share', notesController.shareNote);

// Labels (Custom Feature)
router.post('/labels', notesController.createLabel);
router.get('/labels', notesController.getLabels);
router.post('/:id/labels', notesController.addLabelToNote);

module.exports = router;
