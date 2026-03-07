import { ItemsPage } from "./components/ItemsPage";

function App() {
  return (
    <div className="max-w-6xl mx-auto p-6 flex flex-col items-center min-h-screen">
      <h1 className="text-4xl font-bold mb-8 text-gray-900 dark:text-white">
        wpbot Dashboard
      </h1>
      <ItemsPage />
    </div>
  );
}

export default App;
