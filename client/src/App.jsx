import { Outlet } from "react-router-dom";

export default function App() {
  return (
    <div className="app-shell">
      <header className="app-header">
        <span className="logo">AI Capsule</span>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
}