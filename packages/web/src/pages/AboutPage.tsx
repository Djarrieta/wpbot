import { Link } from "react-router";
import { SessionIcon } from "@/components/SessionIcon";
import { useEffect, useState } from "react";
import type { Context, WithId } from "@wpbot/shared";

const NUMBERED_SUFFIX_RE = /^(.+)_(\d+)$/;

function useContextGroup(prefix: string) {
  const [paragraphs, setParagraphs] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/context")
      .then((r) => r.json())
      .then((rows: WithId<Context>[]) => {
        const matching = rows
          .filter((c) => {
            const m = c.topic.match(NUMBERED_SUFFIX_RE);
            return m && m[1] === prefix;
          })
          .sort((a, b) => {
            const na = parseInt(a.topic.match(NUMBERED_SUFFIX_RE)?.[2] ?? "0");
            const nb = parseInt(b.topic.match(NUMBERED_SUFFIX_RE)?.[2] ?? "0");
            return na - nb;
          })
          .map((c) => c.content);
        setParagraphs(matching.length > 0 ? matching : []);
      })
      .catch(() => setParagraphs([]))
      .finally(() => setLoading(false));
  }, [prefix]);

  return { paragraphs, loading };
}

export default function AboutPage() {
  const { paragraphs, loading } = useContextGroup("acerca_de_la_empresa");

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
              className="text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 no-underline transition-colors"
            >
              Tienda
            </Link>
            <Link
              to="/about"
              className="text-sm font-medium text-gray-900 dark:text-white no-underline transition-colors"
            >
              Nosotros
            </Link>
            <Link
              to="/admin"
              className="text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 no-underline transition-colors"
            >
              Admin →
            </Link>
            <SessionIcon />
          </nav>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white m-0 mb-4">
          Sobre Nosotros
        </h2>

        {loading ? (
          <div className="space-y-4 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-full"
              />
            ))}
          </div>
        ) : paragraphs.length > 0 ? (
          paragraphs.map((text, i) => (
            <p
              key={i}
              className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed mb-6"
            >
              {text}
            </p>
          ))
        ) : (
          <p className="text-gray-400 dark:text-gray-500 italic">
            No hay información disponible.
          </p>
        )}
      </main>
    </div>
  );
}
