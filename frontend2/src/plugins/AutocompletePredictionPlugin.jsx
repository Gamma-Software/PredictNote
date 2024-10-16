import { CLICK_COMMAND, KEY_DOWN_COMMAND, SELECTION_CHANGE_COMMAND, UNDO_COMMAND, KEY_MODIFIER_COMMAND, COMMAND_PRIORITY_HIGH, COMMAND_PRIORITY_NORMAL } from 'lexical';
import {$getRoot, $getSelection, $createTextNode, $isRangeSelection, $isTextNode, $isElementNode, LexicalNode, ElementNode} from 'lexical';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useEffect, useState } from 'react';
import { HistoryState } from '@lexical/react/LexicalHistoryPlugin';
import { mergeRegister } from '@lexical/utils';


function AutocompletePredictionPlugin() {
  const [editor] = useLexicalComposerContext();
  const [prediction, setPrediction] = useState('');
  const [keycode, setKeycode] = useState('');
  const [isPredictionAccepted, setIsPredictionAccepted] = useState(true);

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

    const removeLastHistoryEntry = () => {
        console.log("HistoryState", HistoryState);
      if (HistoryState && HistoryState.undoStack.length > 0) {
        const newUndoStack = HistoryState.undoStack.slice(0, -1);
        HistoryState.undoStack = newUndoStack;
      }
    };
    const isCursorBetweenText = () => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
        return false;
      }

      const node = selection.getNodes()[0];
      if (!$isTextNode(node)) {
        return false;
      }

      const offset = selection.anchor.offset;
      const text = node.getTextContent();

      return offset > 0 && offset < text.length;
    };

    function getTextAroundCursor() {
        let root = $getRoot();
        let wholeText = root.getTextContent();
        let selection = $getSelection();
        let currentNode = selection.getNodes()[0];
        let beforeText = '';
        let afterText = '';
        if ($isRangeSelection(selection) && $isTextNode(currentNode)) {
            const offset = selection.anchor.offset;
            const nodeText = currentNode.getTextContent();
            beforeText = wholeText.slice(0, offset);
            afterText = wholeText.slice(offset);
        }
        //console.log('Before cursor:', beforeText);
        //console.log('After cursor:', afterText);
        return [beforeText, afterText];
    }

    function getTextAroundCursorInNode() {
        let root = $getRoot();
        let wholeText = root.getTextContent();
        let selection = $getSelection();
        let currentNode = selection.getNodes()[0];
        let beforeText = '';
        let afterText = '';
        if ($isRangeSelection(selection) && $isTextNode(currentNode)) {
            const offset = selection.anchor.offset;
            const nodeText = currentNode.getTextContent();
            beforeText = nodeText.slice(0, offset);
            afterText = nodeText.slice(offset);
        }
        return [beforeText, afterText];
    }

    function cursorPosition() {
        getTextAroundCursorInNode()
    }

    const updatePrediction = () => {
      editor.update(() => {
        const root = $getRoot();
        const text = root.getTextContent();
        // console.log(root.getChildren()[0].getTextContent());
        // Get cursor position
        const selection = $getSelection();
        if (selection){
            const currentNode = selection.getNodes()[0];
            // Get current node text content
            if (currentNode){
                // getPrediction(text);
                let prediction = '';
                if (isCursorBetweenText()) {
                    if (!isPredictionAccepted){
                        setPrediction('');
                        removePrediction();
                        setIsPredictionAccepted(true);
                    }
                    return;
                } else {
                    prediction = "this is a prediction" + Math.round(Math.random() * 100);
                    setPrediction(prediction);
                }
                //getTextAroundCursor();
                if (findPredictionNodes().length > 0 || !isPredictionAccepted) {
                    return;
                } else {
                    const predictionNode = $createTextNode(prediction);
                    predictionNode.setStyle('opacity: 0.5;');

                    //const text = currentNode.getTextContent();
                    //currentNode.setTextContent(text + prediction);
                    // console.log("prediction", prediction);
                    // console.log("currentNode", currentNode);
                    // console.log("predictionNode", predictionNode);
                    if (currentNode.canInsertTextAfter() && currentNode.getNextSibling() !== predictionNode) {
                        currentNode.insertAfter(predictionNode);
                        removeLastHistoryEntry(); // Call this to remove the last history entry
                        setIsPredictionAccepted(false);
                    }
                }
            }
        }
        });
    };

    //const updateListener = editor.registerUpdateListener(() => {
    //  clearTimeout(timer);
    //  timer = setTimeout(updatePrediction, 200); // Debounce API calls
    //});

    function $getAllNodes(root) {
        const nodes = [];
        let child = root.getFirstChild();
        while (child !== null) {
            nodes.push(child);
            if ($isElementNode(child)) {
                const subChildrenNodes = $getAllNodes(child);
                nodes.push(...subChildrenNodes);
            }
            child = child.getNextSibling();
        }
        return nodes;
    }

    const findPredictionNodes = () => {
        // iterate over all the nodes and find the ones with a lower opacity
        const nodes = $getAllNodes($getRoot());
        const predictionNodes = [];
        for (const node of nodes) {
            if ($isTextNode(node)) {
                    if (node.getStyle().includes('opacity: 0.5')) {
                        predictionNodes.push(node);
                }
            }
        }
        return predictionNodes;
    };

    const removePrediction = () => {
        const predictionNodes = findPredictionNodes();
        for (const node of predictionNodes) {
            node.remove();
        }
    }

    const updateTextPrediction = (text) => {
        const predictionNodes = findPredictionNodes()
        if (predictionNodes.length > 0){
            predictionNodes[0].setTextContent(text);
        }
    }

    const applyPrediction = () => {
        const selection = $getSelection();

        // Remove all the prediction nodes but keep their position in the DOM
        const predictionNodes = findPredictionNodes();

        // For now we consider only one prediction node
        if (predictionNodes.length > 0){
            const node = predictionNodes[0];
            const parent = node.getPreviousSibling();
            const textContent = node.getTextContent();
            node.remove();
            if (parent) {
                const predictionNodeAccepted = $createTextNode(textContent);
                parent.insertAfter(predictionNodeAccepted);
                // Move the selection to the end of the predictionNode
                selection.focus.set(predictionNodeAccepted.getKey(), predictionNodeAccepted.getTextContent().length);
                selection.anchor.set(predictionNodeAccepted.getKey(), predictionNodeAccepted.getTextContent().length);
            }
            setIsPredictionAccepted(true);
        }
    };

    const isPredictionNodeSelected = () => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
            const selectionNode = selection.anchor.getNode();
            const nextSibling = selectionNode.getNextSibling();
            if (selectionNode && selectionNode.getStyle().includes('opacity: 0.5')) {
                return true;
            }
            if (selection.anchor.offset === selectionNode.getTextContent().length) {
                return false;
            }
        }
        return false;
    }

    const removeClickListener = editor.registerCommand(
      KEY_MODIFIER_COMMAND,
      (event) => {
        // Remove the prediction when the user clicks on the editor
        console.log("click: ", event);
        editor.update(() => {
            removePrediction();
            setPrediction('');
            setIsPredictionAccepted(true);
        });
        return true;
      },
      COMMAND_PRIORITY_HIGH
    );

    const removeKeyDownListener = editor.registerCommand(
      KEY_DOWN_COMMAND,
      (event) => {
        setKeycode(event.key);
        const nodes = findPredictionNodes();
        let predictionText = '';
        if (nodes.length > 0){
            predictionText = nodes[0].getTextContent();
        }
        if (predictionText && (predictionText === '')) {
            return true;
        }
        if (event.key === 'Tab') {
            event.preventDefault();
            editor.update(() => {
                applyPrediction();
            });
            setPrediction('');
            return true;
        } else if (event.key === 'Escape') {
          event.preventDefault();
          editor.update(() => {
            removePrediction();
          });
          setPrediction('');
          return true;
        } else if (event.key === 'Enter' || event.key === 'Backspace' || event.key === 'Delete' || event.key === 'ArrowRight' || event.key === 'ArrowLeft' || event.key === 'ArrowUp' || event.key === 'ArrowDown') {
            editor.update(() => {
                removePrediction();
            });
            setPrediction('');
            setIsPredictionAccepted(true);
            return true;
        } else if (event.key.length === 1 && /[\w\s]/.test(event.key)) { // Check if the key is a letter or space
            if (event.key === predictionText.at(0)){
                const newPrediction = predictionText.substring(1);
                if (newPrediction === ''){
                    applyPrediction();
                } else {
                    editor.update(() => {
                        updateTextPrediction(newPrediction);
                    });
                }
                return true;
            } else if (predictionText !== ''){
                editor.update(() => {
                    removePrediction();
                });
                setPrediction('');
                setIsPredictionAccepted(true);
                return true;
            }
        }
        return true;
      },
      COMMAND_PRIORITY_NORMAL
    );


    const removeSelectionChangedListener = editor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      (event) => {
        setTimeout(() => {
            updatePrediction();
        }, 10);
        console.log("selection changed");
        const selection = $getSelection();

        // Unless the cursor is in the same place the prediction is revoked
        console.log("keycode:", keycode);
        if (keycode === 'Enter' || keycode === 'Backspace' || keycode === 'Delete' || keycode === 'ArrowRight' || keycode === 'ArrowLeft' || keycode === 'ArrowUp' || keycode === 'ArrowDown') {
            editor.update(() => {
                removePrediction();
            });
            setPrediction('');
            setIsPredictionAccepted(true);
            return true;
        }
        if (isPredictionNodeSelected()) {
            applyPrediction();
        }
        return true;
      },
      COMMAND_PRIORITY_NORMAL
    );

    return () => {
      clearTimeout(timer);
      removeClickListener();
      //updateListener();
      removeKeyDownListener();
      removeSelectionChangedListener();
    };
  }, [editor, keycode, prediction, isPredictionAccepted]);

  return null;
}

export default AutocompletePredictionPlugin;
