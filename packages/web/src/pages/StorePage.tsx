import { useEffect, useState } from "react";
import { Link } from "react-router";
import type { Item, Product, WithId } from "@wpbot/shared";
import { SessionIcon } from "@/components/SessionIcon";

declare global {
  class WidgetCheckout {
    constructor(config: {
      currency: string;
      amountInCents: number;
      reference: string;
      publicKey: string;
      signature: { integrity: string };
      redirectUrl?: string;
    });
    open(
      callback: (result: {
        transaction: { id: string; status: string };
      }) => void,
    ): void;
  }
}

type ProductWithItems = WithId<Product> & { items: WithId<Item>[] };

async function fetchStore(): Promise<ProductWithItems[]> {
  const [productsRes, itemsRes] = await Promise.all([
    fetch("/api/products"),
    fetch("/api/items"),
  ]);
  if (!productsRes.ok)
    throw new Error(`Failed to fetch products: ${productsRes.status}`);
  if (!itemsRes.ok)
    throw new Error(`Failed to fetch items: ${itemsRes.status}`);
  const products: WithId<Product>[] = await productsRes.json();
  const items: WithId<Item>[] = await itemsRes.json();

  return products
    .map((p) => ({
      ...p,
      items: items.filter((i) => i.product_id === p.id && i.stock > 0),
    }))
    .filter((p) => p.items.length > 0);
}

function formatPrice(price: number) {
  return `$${price.toLocaleString()}`;
}

async function startWompiCheckout(productId: number) {
  const res = await fetch("/api/wompi/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ itemId: productId }),
  });
  if (!res.ok) {
    const err = await res
      .json()
      .catch(() => ({ error: "Error al iniciar pago" }));
    alert(err.error ?? "Error al iniciar pago");
    return;
  }
  const data = await res.json();
  const checkout = new WidgetCheckout({
    currency: data.currency,
    amountInCents: data.amountInCents,
    reference: data.reference,
    publicKey: data.publicKey,
    signature: { integrity: data.signature },
  });
  checkout.open((result) => {
    console.log("Wompi transaction:", result.transaction);
  });
}

function ProductCard({ product }: { product: ProductWithItems }) {
  const [selectedItemId, setSelectedItemId] = useState<number>(
    product.items[0].id,
  );

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300">
      {product.image_url && (
        <img
          src={product.image_url}
          alt={product.name}
          className="w-full h-48 object-cover"
        />
      )}
      <div className="p-6">
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white m-0">
            {product.name}
          </h3>
          <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400 whitespace-nowrap ml-3">
            {formatPrice(product.price)}
          </span>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 m-0 line-clamp-3">
          {product.description || "Sin descripción"}
        </p>

        {product.requires_device && product.items.length > 0 && (
          <div className="mt-3">
            <label
              htmlFor={`model-${product.id}`}
              className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1"
            >
              Selecciona tu modelo
            </label>
            <select
              id={`model-${product.id}`}
              value={selectedItemId}
              onChange={(e) => setSelectedItemId(Number(e.target.value))}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm py-2 px-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            >
              {product.items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.brand} {item.reference}
                </option>
              ))}
            </select>
          </div>
        )}

        <button
          type="button"
          onClick={() => startWompiCheckout(product.id)}
          className="mt-4 w-full rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 text-sm transition-colors cursor-pointer"
        >
          Comprar
        </button>
      </div>
    </div>
  );
}

export default function StorePage() {
  const [products, setProducts] = useState<ProductWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStore()
      .then(setProducts)
      .catch((e) =>
        setError(e instanceof Error ? e.message : "Error loading products"),
      )
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link
            to="/"
            className="text-xl font-bold bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent m-0 no-underline"
          >
            wpbot Store
          </Link>
          <nav className="flex items-center gap-6">
            <Link
              to="/"
              className="text-sm font-medium text-gray-900 dark:text-white no-underline transition-colors"
            >
              Tienda
            </Link>
            <Link
              to="/about"
              className="text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 no-underline transition-colors"
            >
              Nosotros
            </Link>
            <SessionIcon />
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white m-0 mb-1">
            Productos
          </h2>
          <p className="text-gray-500 dark:text-gray-400 m-0">
            Explora nuestro catálogo de productos
          </p>
        </div>

        {error && (
          <div className="bg-red-900/20 border border-red-600 text-red-400 px-4 py-3 rounded-md mb-6">
            {error}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-48 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse"
              />
            ))}
          </div>
        ) : products.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-16">
            No hay productos disponibles.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
