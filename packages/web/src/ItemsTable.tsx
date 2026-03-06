import { useEffect, useState } from "react";
import type { Item } from "./types";

export function ItemsTable() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchItems();
  }, []);

  async function fetchItems() {
    try {
      setLoading(true);
      const response = await fetch("/items");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setItems(data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch items");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="loading">Loading items...</div>;
  }

  if (error) {
    return (
      <div className="error">
        <p>Error: {error}</p>
        <button onClick={fetchItems}>Retry</button>
      </div>
    );
  }

  return (
    <div className="items-container">
      <h2>Items</h2>
      <button onClick={fetchItems} className="refresh-btn">
        Refresh
      </button>
      {items.length === 0 ? (
        <p>No items found.</p>
      ) : (
        <table className="items-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Quantity</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>{item.id}</td>
                <td>{item.name}</td>
                <td>{item.quantity}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
