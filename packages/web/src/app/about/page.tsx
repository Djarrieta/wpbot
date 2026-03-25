"use client";

import Link from "next/link";
import { SessionIcon } from "@/components/SessionIcon";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link
            href="/"
            className="text-xl font-bold bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent m-0 no-underline"
          >
            wpbot Store
          </Link>
          <nav className="flex items-center gap-6">
            <Link
              href="/"
              className="text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 no-underline transition-colors"
            >
              Tienda
            </Link>
            <Link
              href="/about"
              className="text-sm font-medium text-gray-900 dark:text-white no-underline transition-colors"
            >
              Nosotros
            </Link>
            <Link
              href="/admin"
              className="text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 no-underline transition-colors"
            >
              Admin →
            </Link>
            <SessionIcon />
          </nav>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white m-0 mb-4">
          Sobre Nosotros
        </h2>
        <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed mb-6">
          Somos wpbot, una tienda comprometida con ofrecer los mejores productos
          a nuestros clientes. Nuestro objetivo es brindar una experiencia de
          compra sencilla, rápida y confiable.
        </p>
        <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed mb-6">
          Trabajamos día a día para mejorar nuestro catálogo y garantizar la
          mejor calidad en cada uno de nuestros artículos.
        </p>

        <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-8">
          <div className="text-center">
            <span className="text-4xl block mb-3">🎯</span>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white m-0 mb-2">
              Misión
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 m-0">
              Facilitar el acceso a productos de calidad con un servicio
              excepcional.
            </p>
          </div>
          <div className="text-center">
            <span className="text-4xl block mb-3">👁️</span>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white m-0 mb-2">
              Visión
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 m-0">
              Ser la tienda en línea preferida por nuestros clientes.
            </p>
          </div>
          <div className="text-center">
            <span className="text-4xl block mb-3">💡</span>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white m-0 mb-2">
              Valores
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 m-0">
              Transparencia, calidad y compromiso con el cliente.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
