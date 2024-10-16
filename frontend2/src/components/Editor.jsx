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
import AutocompletePredictionPlugin from "../plugins/AutocompletePredictionPlugin";

function Placeholder() {
  return <div className="editor-placeholder">Enter some rich text...</div>;
}


const onChange = editorState => {
  editorState.read(() => {
    const jsonString = JSON.stringify(editorState);
    // console.log('Editor content changed');
    // You can save the content here, or set it to a state variable, etc.
    // For example:
    // saveContent(jsonString);
    // Get the content
    const root = $getRoot();
    const selection = $getSelection();
  });
};

const debouncedOnChange = debounce(onChange, 2000);


export default function Editor() {
  const loadContent = async () => {
    // ... your existing loadContent logic ...
  };

  return (
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
          {/*<HistoryPlugin />
          <AutoFocusPlugin />
          <CodeHighlightPlugin />
          <LinkPlugin />
          <AutoLinkPlugin />*/}
          <OnChangePlugin onChange={debouncedOnChange} />
          <ListPlugin />
          <ListMaxIndentLevelPlugin maxDepth={7} />
          {/* <ActionsPlugin /> */}
          <AutocompletePredictionPlugin />
        </div>
      </div>
    </LexicalComposer>
  );
}

