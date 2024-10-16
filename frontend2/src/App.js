import "./styles.css";
import Editor from "./components/Editor";

export default function App() {
  const handleKeyDown = (event) => {
    if (event.key === 'Tab') {
      event.preventDefault(); // Prevent the default tab behavior
    }
  };
  return (
    <div className="App" onKeyDown={handleKeyDown}>
      <h1>PredictNote</h1>
      <p>A note-taking app that predicts your next word</p>
      <Editor />
    </div>
  );
}
