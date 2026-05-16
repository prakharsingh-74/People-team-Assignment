const { v4: uuidv4 } = require('uuid');
const { getDB } = require('../db/database');
const AppError = require('../utils/errors');

const createNote = async (req, res) => {
    const { title, content } = req.body;
    const userId = req.user.userId;
    const db = getDB();

    if (!title || !content) {
        throw new AppError('Title and content are required', 400);
    }

    const id = uuidv4();
    const now = new Date().toISOString();

    await db.run(
        'INSERT INTO notes (id, user_id, title, content, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
        [id, userId, title, content, now, now]
    );

    const newNote = await db.get('SELECT * FROM notes WHERE id = ?', [id]);
    res.status(201).json(newNote);
};

const getAllNotes = async (req, res) => {
    const userId = req.user.userId;
    const db = getDB();
    
    // Pagination
    const limit = parseInt(req.query.limit) || 10;
    const offset = parseInt(req.query.offset) || 0;
    const labelFilter = req.query.label;

    let query = `
        SELECT DISTINCT n.* FROM notes n
        LEFT JOIN note_shares ns ON n.id = ns.note_id
        LEFT JOIN note_labels nl ON n.id = nl.note_id
        LEFT JOIN labels l ON nl.label_id = l.id
        WHERE (n.user_id = ? OR ns.shared_with_user_id = ?)
    `;
    const params = [userId, userId];

    if (labelFilter) {
        query += ` AND l.name = ?`;
        params.push(labelFilter);
    }

    query += ` ORDER BY n.updated_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const notes = await db.all(query, params);
    res.status(200).json(notes);
};

const getNoteById = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.userId;
    const db = getDB();

    const note = await db.get(`
        SELECT n.* FROM notes n
        LEFT JOIN note_shares ns ON n.id = ns.note_id
        WHERE n.id = ? AND (n.user_id = ? OR ns.shared_with_user_id = ?)
    `, [id, userId, userId]);

    if (!note) {
        throw new AppError('Note not found or unauthorized', 404);
    }

    res.status(200).json(note);
};

const updateNote = async (req, res) => {
    const { id } = req.params;
    const { title, content } = req.body;
    const userId = req.user.userId;
    const db = getDB();

    // Check ownership
    const note = await db.get('SELECT * FROM notes WHERE id = ? AND user_id = ?', [id, userId]);
    if (!note) {
        throw new AppError('Note not found or unauthorized to update', 404);
    }

    const now = new Date().toISOString();
    await db.run(
        'UPDATE notes SET title = ?, content = ?, updated_at = ? WHERE id = ?',
        [title || note.title, content || note.content, now, id]
    );

    const updatedNote = await db.get('SELECT * FROM notes WHERE id = ?', [id]);
    res.status(200).json(updatedNote);
};

const deleteNote = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.userId;
    const db = getDB();

    const result = await db.run('DELETE FROM notes WHERE id = ? AND user_id = ?', [id, userId]);
    
    if (result.changes === 0) {
        throw new AppError('Note not found or unauthorized to delete', 404);
    }

    res.status(204).send();
};

const shareNote = async (req, res) => {
    const { id } = req.params;
    const { share_with_email } = req.body;
    const userId = req.user.userId;
    const db = getDB();

    // Check ownership
    const note = await db.get('SELECT * FROM notes WHERE id = ? AND user_id = ?', [id, userId]);
    if (!note) {
        throw new AppError('Note not found or unauthorized to share', 404);
    }

    // Find user to share with
    const targetUser = await db.get('SELECT id FROM users WHERE email = ?', [share_with_email]);
    if (!targetUser) {
        throw new AppError('User to share with not found', 404);
    }

    if (targetUser.id === userId) {
        throw new AppError('Cannot share note with yourself', 400);
    }

    await db.run(
        'INSERT OR IGNORE INTO note_shares (note_id, shared_with_user_id) VALUES (?, ?)',
        [id, targetUser.id]
    );

    res.status(200).json({ message: 'Note shared successfully' });
};

const searchNotes = async (req, res) => {
    const { q } = req.query;
    const userId = req.user.userId;
    const db = getDB();

    if (!q) {
        throw new AppError('Search query is required', 400);
    }

    // FTS Search combined with ownership/sharing check
    const query = `
        SELECT n.* FROM notes n
        JOIN notes_fts fts ON n.id = fts.note_id
        LEFT JOIN note_shares ns ON n.id = ns.note_id
        WHERE fts.notes_fts MATCH ? AND (n.user_id = ? OR ns.shared_with_user_id = ?)
        ORDER BY rank
    `;
    
    const notes = await db.all(query, [q, userId, userId]);
    res.status(200).json(notes);
};

// Label Controllers
const createLabel = async (req, res) => {
    const { name } = req.body;
    const userId = req.user.userId;
    const db = getDB();

    if (!name) throw new AppError('Label name is required', 400);

    const id = uuidv4();
    try {
        await db.run('INSERT INTO labels (id, user_id, name) VALUES (?, ?, ?)', [id, userId, name]);
    } catch (e) {
        if (e.message.includes('UNIQUE')) throw new AppError('Label already exists', 400);
        throw e;
    }

    res.status(201).json({ id, name });
};

const getLabels = async (req, res) => {
    const userId = req.user.userId;
    const db = getDB();
    const labels = await db.all('SELECT * FROM labels WHERE user_id = ?', [userId]);
    res.status(200).json(labels);
};

const addLabelToNote = async (req, res) => {
    const { id } = req.params;
    const { label_id } = req.body;
    const userId = req.user.userId;
    const db = getDB();

    // Verify ownership
    const note = await db.get('SELECT * FROM notes WHERE id = ? AND user_id = ?', [id, userId]);
    if (!note) throw new AppError('Note not found or unauthorized', 404);

    const label = await db.get('SELECT * FROM labels WHERE id = ? AND user_id = ?', [label_id, userId]);
    if (!label) throw new AppError('Label not found or unauthorized', 404);

    await db.run('INSERT OR IGNORE INTO note_labels (note_id, label_id) VALUES (?, ?)', [id, label_id]);
    res.status(200).json({ message: 'Label added to note' });
};

module.exports = {
    createNote,
    getAllNotes,
    getNoteById,
    updateNote,
    deleteNote,
    shareNote,
    searchNotes,
    createLabel,
    getLabels,
    addLabelToNote
};
