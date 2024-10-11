// frontend/src/components/NoteEditor.js
import React, { useState, useEffect } from 'react';
import debounce from 'lodash.debounce';
import axios from 'axios';
import {
  MDXEditor,
  UndoRedo,
  BoldItalicUnderlineToggles,
  BlockTypeSelect,
  toolbarPlugin,
  KitchenSinkToolbar,
  listsPlugin,
  quotePlugin,
  headingsPlugin,
  linkPlugin,
  linkDialogPlugin,
  imagePlugin,
  tablePlugin,
  thematicBreakPlugin,
  frontmatterPlugin,
  codeBlockPlugin,
  sandpackPlugin,
  codeMirrorPlugin,
  directivesPlugin,
  AdmonitionDirectiveDescriptor,
  diffSourcePlugin,
  markdownShortcutPlugin,
} from '@mdxeditor/editor';
import '@mdxeditor/editor/style.css';

const NoteEditor = () => {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [suggestion, setSuggestion] = useState('');
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [currentNoteId, setCurrentNoteId] = useState(null);

     useEffect(() => {
        const token = localStorage.getItem('access_token');
        if (token) {
            setIsLoggedIn(true);
            fetchNotes();
        }
    }, [isLoggedIn]);

    const allPlugins = [
        toolbarPlugin({ toolbarContents: () => <KitchenSinkToolbar /> }),
        listsPlugin(),
        quotePlugin(),
        headingsPlugin(),
        linkPlugin(),
        linkDialogPlugin(),
        imagePlugin({ imageUploadHandler: async () => '/sample-image.png' }),
        tablePlugin(),
        thematicBreakPlugin(),
        frontmatterPlugin(),
        codeBlockPlugin({ defaultCodeBlockLanguage: 'txt' }),
        codeMirrorPlugin({ codeBlockLanguages: { js: 'JavaScript', css: 'CSS', txt: 'text', tsx: 'TypeScript' } }),
        directivesPlugin({ directiveDescriptors: [AdmonitionDirectiveDescriptor] }),
        diffSourcePlugin({ viewMode: 'rich-text', diffMarkdown: content }),
        markdownShortcutPlugin(),
    ];

    // Debounced function to fetch predictive text
    const fetchSuggestion = debounce(async (value) => {
        if (value.trim().length === 0) {
            setSuggestion('');
            return;
        }
        try {
            const response = await axios.post('/api/predict/', {
                prompt: value,
                max_tokens: 50
            }, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                }
            });
            setSuggestion(response.data.suggestion);
        } catch (error) {
            console.error('Error fetching prediction:', error);
        }
    }, 2000); // 500ms debounce

    const handleContentChange = (newContent) => {
        setContent(newContent);
        console.log(newContent);
    };

    const handleSave = async () => {
        try {
            const url = currentNoteId ? `/api/notes/${currentNoteId}/` : '/api/notes/';
            const method = currentNoteId ? 'put' : 'post';

            await axios({
                method: method,
                url: url,
                data: { title, content },
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                }
            });

            if (!currentNoteId) {
                // If it was a new note, fetch notes again to get the new ID
                fetchNotes();
            }
        } catch (error) {
            console.error('Error saving note:', error);
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post('/api/login/', { username, password });
            localStorage.setItem('access_token', response.data.access);
            localStorage.setItem('refresh_token', response.data.refresh);
            setIsLoggedIn(true);
            setUsername('');
            setPassword('');
        } catch (error) {
            console.error('Login error:', error);
            alert('Login failed. Please check your credentials.');
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        setIsLoggedIn(false);
        setTitle('');
        setContent('');
        setCurrentNoteId(null);
    };

    const fetchNotes = async () => {
        try {
            const response = await axios.get('/api/notes/', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                }
            });
            if (response.data.length > 0) {
                const latestNote = response.data[0];  // Assuming the API returns notes sorted by latest first
                setTitle(latestNote.title);
                setContent(latestNote.content || '');  // Ensure content is set, even if it's an empty string
                setCurrentNoteId(latestNote.id);
                console.log('Fetched note:', latestNote);  // Log the entire note object for debugging
            } else {
                // If there are no notes, reset the editor
                setTitle('');
                setContent('');
                setCurrentNoteId(null);
                console.log('No notes found');
            }
        } catch (error) {
            console.error('Error fetching notes:', error);
        }
    };

    if (!isLoggedIn) {
        return (
            <div className="login-form">
                <h2>Login</h2>
                <form onSubmit={handleLogin}>
                    <input
                        type="text"
                        placeholder="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <button type="submit">Login</button>
                </form>
            </div>
        );
    }

    return (
        <div className="note-editor">
            <div className="header">
                <input
                    type="text"
                    placeholder="Title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="title-input"
                />
                <button onClick={handleSave} className="save-button">
                    Save Note
                </button>
                <button onClick={handleLogout} className="logout-button">
                    Logout
                </button>
            </div>
            <MDXEditor
                markdown={content}
                onChange={handleContentChange}
                plugins={allPlugins}
                className="content-editor"
            />
            {/* Add this for debugging */}
            <pre style={{display: 'none'}}>{JSON.stringify({title, content, currentNoteId}, null, 2)}</pre>
        </div>
    );
};

export default NoteEditor;