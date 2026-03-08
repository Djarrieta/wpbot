import { Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import { Dashboard } from "./pages/Dashboard";
import { ItemsPage } from "./pages/ItemsPage";

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/items" element={<ItemsPage />} />
      </Route>
    </Routes>
  );
}

export default App;
