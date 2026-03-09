import { Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import { Dashboard } from "./pages/Dashboard";
import { modules } from "./modules";

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        {modules.map((m) => (
          <Route key={m.basePath} path={m.basePath} element={<m.Page />} />
        ))}
      </Route>
    </Routes>
  );
}

export default App;
