import { useEffect, useState, useRef } from "react";
import ExampleTheme from "../themes/ExampleTheme.js";
import {$getRoot, $getSelection, $createTextNode, $isRangeSelection} from 'lexical';
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { AutoFocusPlugin } from "@lexical/react/LexicalAutoFocusPlugin";
import LexicalErrorBoundary from "@lexical/react/LexicalErrorBoundary";
import ToolbarPlugin from "../plugins/ToolbarPlugin.jsx";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { TableCellNode, TableNode, TableRowNode } from "@lexical/table";
import { ListItemNode, ListNode } from "@lexical/list";
import { CodeHighlightNode, CodeNode } from "@lexical/code";
import { AutoLinkNode, LinkNode } from "@lexical/link";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext';
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin";
import { TRANSFORMERS } from "@lexical/markdown";

import ListMaxIndentLevelPlugin from "../plugins/ListMaxIndentLevelPlugin";
import CodeHighlightPlugin from "../plugins/CodeHighlightPlugin";
import AutoLinkPlugin from "../plugins/AutoLinkPlugin";
import ActionsPlugin from "../plugins/ActionsPlugin";
import AutoDotPlugin from "../plugins/AutoDotPlugin";
import prepopulatedText from "./SampleText";
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import debounce from 'lodash/debounce';
import axios from 'axios';

function Placeholder() {
  return <div className="editor-placeholder">Enter some rich text...</div>;
}


const onChange = editorState => {
  editorState.read(() => {
    const jsonString = JSON.stringify(editorState);
    console.log('Editor content changed');
    // You can save the content here, or set it to a state variable, etc.
    // For example:
    // saveContent(jsonString);
    // Get the content
    const root = $getRoot();
    const selection = $getSelection();

    console.log(root, selection);
  });
};

const debouncedOnChange = debounce(onChange, 2000);

function MyCustomAutoFocusPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    // Focus the editor when the effect fires!
    editor.focus();
  }, [editor]);

  return null;
}

function AutocompletePredictionPlugin() {
  const [editor] = useLexicalComposerContext();
  const [prediction, setPrediction] = useState('');
  const [cursorPosition, setCursorPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    let timer;

    const getPrediction = async (text) => {
      try {
        const response = await fetch('/api/predict', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text }),
        });
        const data = await response.json();
        setPrediction(data.prediction);
      } catch (error) {
        console.error('Error fetching prediction:', error);
      }
    };

    const updatePrediction = () => {
      editor.update(() => {
        const root = $getRoot();
        const text = root.getTextContent();
        // getPrediction(text);
        setPrediction("this is a prediction");
        // Get cursor position
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          const domSelection = window.getSelection();
          if (domSelection && domSelection.rangeCount > 0) {
            const range = domSelection.getRangeAt(0);
            const rect = range.getBoundingClientRect();
            setCursorPosition({ top: rect.bottom, left: rect.right });
          }
        }
      });
    };

    const removeUpdateListener = editor.registerUpdateListener(() => {
      clearTimeout(timer);
      timer = setTimeout(updatePrediction, 20); // Debounce API calls
    });

    const removeKeyDownListener = editor.registerCommand(
      'keydown',
      (event) => {
        if (event.key === 'Tab' && prediction) {
          event.preventDefault();
          editor.update(() => {
            const selection = $getSelection();
            if ($isRangeSelection(selection)) {
              selection.insertNodes([$createTextNode(prediction)]);
            }
          });
          setPrediction('');
          return true;
        }
        return false;
      },
      1
    );

    return () => {
      clearTimeout(timer);
      removeUpdateListener();
      removeKeyDownListener();
    };
  }, [editor, prediction]);

  return (
    <div className="prediction-container">
      <p>
        {prediction}
      </p>
    </div>
  );
}

export default function Editor() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      setIsLoggedIn(true);
      // You might want to add a function to load user-specific content here
    }
  }, [isLoggedIn]);

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
    // You might want to clear any user-specific content here
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

  const loadContent = async () => {
    // ... your existing loadContent logic ...
  };

  return (
    <>
      <button onClick={handleLogout}>Logout</button>
      <LexicalComposer
        initialConfig={{
          theme: ExampleTheme,
          // Handling of errors during update
          onError(error) {
            throw error;
          },
          // Any custom nodes go here
          nodes: [
            HeadingNode,
            ListNode,
            ListItemNode,
            QuoteNode,
            CodeNode,
            CodeHighlightNode,
            TableNode,
            TableCellNode,
            TableRowNode,
            AutoLinkNode,
            LinkNode
          ],
          editorState: prepopulatedText,
        }}
      >
        <div className="editor-container">
          <ToolbarPlugin />
          <div className="editor-inner">
            <RichTextPlugin
              contentEditable={<ContentEditable className="editor-input" />}
              placeholder={<Placeholder />}
              ErrorBoundary={LexicalErrorBoundary}
            />
            <HistoryPlugin />
            <AutoFocusPlugin />
            <CodeHighlightPlugin />
            <ListPlugin />
            <LinkPlugin />
            <AutoLinkPlugin />
            <ListMaxIndentLevelPlugin maxDepth={7} />
            <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
            <ActionsPlugin />
            <AutocompletePredictionPlugin />
            <OnChangePlugin onChange={debouncedOnChange} />
          </div>
        </div>
      </LexicalComposer>
    </>
  );
}
