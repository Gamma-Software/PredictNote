// frontend/src/components/NoteEditor.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import debounce from 'lodash.debounce';

const NoteEditor = () => {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [suggestion, setSuggestion] = useState('');

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
    }, 500); // 500ms debounce

    const handleContentChange = (e) => {
        const value = e.target.value;
        setContent(value);
        fetchSuggestion(value);
    };

    const addSuggestion = () => {
        setContent(content + ' ' + suggestion);
        setSuggestion('');
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Tab' && suggestion) {
            e.preventDefault();
            addSuggestion();
        }
    };

    const handleSave = async () => {
        try {
            await axios.post('/api/notes/', { title, content }, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                }
            });
            // Redirect or update UI as needed
        } catch (error) {
            console.error('Error saving note:', error);
        }
    };

    return (
        <div className="note-editor">
            <input
                type="text"
                placeholder="Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="title-input"
            />
            <textarea
                placeholder="Start writing your note..."
                value={content}
                onChange={handleContentChange}
                onKeyDown={handleKeyDown}
                className="content-textarea"
            />
            {suggestion && (
                <div className="suggestion">
                    <span>Suggestion: {suggestion}</span>
                    <button onClick={addSuggestion}>Add</button>
                </div>
            )}
            <button onClick={handleSave}>Save Note</button>
        </div>
    );
};

export default NoteEditor;