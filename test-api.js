const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
let token1, token2, noteId;

async function test() {
    try {
        console.log('--- Testing Registration ---');
        try {
            await axios.post(`${BASE_URL}/register`, { email: 'user1@example.com', password: 'password123' });
            console.log('User 1 registered');
        } catch (e) { console.log('User 1 might already exist'); }

        try {
            await axios.post(`${BASE_URL}/register`, { email: 'user2@example.com', password: 'password123' });
            console.log('User 2 registered');
        } catch (e) { console.log('User 2 might already exist'); }

        console.log('\n--- Testing Login ---');
        const login1 = await axios.post(`${BASE_URL}/login`, { email: 'user1@example.com', password: 'password123' });
        token1 = login1.data.access_token;
        console.log('User 1 logged in');

        const login2 = await axios.post(`${BASE_URL}/login`, { email: 'user2@example.com', password: 'password123' });
        token2 = login2.data.access_token;
        console.log('User 2 logged in');

        console.log('\n--- Testing Create Note ---');
        const createNote = await axios.post(`${BASE_URL}/notes`, 
            { title: 'My First Note', content: 'This is a test note' },
            { headers: { Authorization: `Bearer ${token1}` } }
        );
        noteId = createNote.data.id;
        console.log('Note created:', noteId);

        console.log('\n--- Testing Get Notes ---');
        const getNotes = await axios.get(`${BASE_URL}/notes`, {
            headers: { Authorization: `Bearer ${token1}` }
        });
        console.log('User 1 notes count:', getNotes.data.length);

        console.log('\n--- Testing Sharing ---');
        await axios.post(`${BASE_URL}/notes/${noteId}/share`, 
            { share_with_email: 'user2@example.com' },
            { headers: { Authorization: `Bearer ${token1}` } }
        );
        console.log('Note shared with User 2');

        console.log('\n--- Testing User 2 Access to Shared Note ---');
        const user2Note = await axios.get(`${BASE_URL}/notes/${noteId}`, {
            headers: { Authorization: `Bearer ${token2}` }
        });
        console.log('User 2 accessed shared note:', user2Note.data.title);

        console.log('\n--- Testing Search ---');
        const search = await axios.get(`${BASE_URL}/search?q=test`, {
            headers: { Authorization: `Bearer ${token1}` }
        });
        console.log('Search results count:', search.data.length);

        console.log('\n--- Testing Labels ---');
        const label = await axios.post(`${BASE_URL}/notes/labels`, 
            { name: 'Work' },
            { headers: { Authorization: `Bearer ${token1}` } }
        );
        const labelId = label.data.id;
        console.log('Label created:', labelId);

        await axios.post(`${BASE_URL}/notes/${noteId}/labels`, 
            { label_id: labelId },
            { headers: { Authorization: `Bearer ${token1}` } }
        );
        console.log('Label attached to note');

        const filtered = await axios.get(`${BASE_URL}/notes?label=Work`, {
            headers: { Authorization: `Bearer ${token1}` }
        });
        console.log('Filtered notes count:', filtered.data.length);

        console.log('\n--- Testing About & OpenAPI ---');
        const about = await axios.get(`${BASE_URL}/about`);
        console.log('About endpoint name:', about.data.name);
        
        const openapi = await axios.get(`${BASE_URL}/openapi.json`);
        console.log('OpenAPI spec version:', openapi.data.openapi);

        console.log('\nAll tests passed successfully!');
    } catch (error) {
        console.error('Test failed:', error.response ? error.response.data : error.message);
    }
}

test();
