# PredictNote

## Description

This is a note-taking app that uses a LLM to predict the next word the user will write.
It helps the user write faster and more fluently by highlighting the next word that the user could write.

## The issue

A lot of time we stuck on finding the right words to write. This is why I decided to create this app.
It allows the user to write without worrying about finding the right words.

## How it works

When the user starts writing, the app starts predicting the next word the user will write.
When the user presses the tab key, the app highlights the next word that the user could write.
Where ever the cursor is, the app will highlight the next word that the user could write.
It can also rewrite the sentence when the user is writing inside a sentence.
It will give then the option to accept or reject the rewrite by pressing the tab key again.

The predicted words copies the current cursor position text style but with a lower opacity.

The predicted words are accepted when:

- The user enters "tab", the cursor moves at the end of the prediction node
- The user click on the node (move cursor in the prediction node). In that case, the cursor does not move at the end of the prediction node

The prediction is partially accepted when:

- The user enters progressively the same characters than the prediction itself. For instance, the prediction is "this is a prediction", the user will enter the letter "t", the prediction will still be the same but without the "t".

The predicted words are rejected when:

- The user enters "escape"
- The user click on any other node than the prediction node and the current cursor position

The prediction is created / updated when:

- When there is no prediction and the cursor is at the end of a text node
- The user decides the not write the same letter as the next predicted letter


## TODO

Rewrite the