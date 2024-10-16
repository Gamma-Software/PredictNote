import { useEffect } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {$getRoot} from 'lexical';

function AutoDotPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    let timer;

    const addDot = () => {
      editor.update(() => {
        const root = $getRoot();
        const lastParagraph = root.getLastChild();
        if (lastParagraph && lastParagraph.getType() === 'paragraph') {
          const lastTextNode = lastParagraph.getLastChild();
          if (lastTextNode && lastTextNode.getType() === 'text') {
            const text = lastTextNode.getTextContent();
            if (text && !text.endsWith('.')) {
               lastTextNode.setTextContent(text + ' *Yo*');
            }
          }
        }
      });
    };

    const onKeyUp = () => {
      clearTimeout(timer);
      timer = setTimeout(addDot, 3000);
    };

    const removeUpdateListener = editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        onKeyUp();
      });
    });

    return () => {
      clearTimeout(timer);
      removeUpdateListener();
    };
  }, [editor]);

  return null;
}

export default AutoDotPlugin;