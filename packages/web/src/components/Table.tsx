interface Column<T> {
  key: keyof T;
  header: string;
  render?: (value: T[keyof T], row: T) => React.ReactNode;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyField: keyof T;
  actions?: (row: T) => React.ReactNode;
  page?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
}

export function Table<T>({
  columns,
  data,
  keyField,
  actions,
  page,
  totalPages,
  onPageChange,
}: TableProps<T>) {
  return (
    <table className="w-full border-collapse">
      <thead>
        <tr>
          {columns.map((col) => (
            <th
              key={String(col.key)}
              className="border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300"
            >
              {col.header}
            </th>
          ))}
          {actions && (
            <th className="border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">
              Acciones
            </th>
          )}
        </tr>
      </thead>
      <tbody>
        {data.length === 0 ? (
          <tr>
            <td
              colSpan={columns.length + (actions ? 1 : 0)}
              className="text-center py-8 text-gray-400 dark:text-gray-500 border border-gray-200 dark:border-gray-700"
            >
              No se encontraron datos.
            </td>
          </tr>
        ) : (
          data.map((row) => (
            <tr
              key={String(row[keyField])}
              className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
            >
              {columns.map((col) => (
                <td
                  key={String(col.key)}
                  className="border border-gray-200 dark:border-gray-700 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300"
                >
                  {col.render
                    ? col.render(row[col.key], row)
                    : String(row[col.key] ?? "")}
                </td>
              ))}
              {actions && (
                <td className="border border-gray-200 dark:border-gray-700 px-4 py-2.5 whitespace-nowrap">
                  <div className="flex gap-2">{actions(row)}</div>
                </td>
              )}
            </tr>
          ))
        )}
      </tbody>
      {page !== undefined &&
        totalPages !== undefined &&
        onPageChange &&
        totalPages > 1 && (
          <tfoot>
            <tr>
              <td
                colSpan={columns.length + (actions ? 1 : 0)}
                className="border border-gray-200 dark:border-gray-700 px-4 py-2.5"
              >
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => onPageChange(page - 1)}
                    disabled={page <= 1}
                    className="px-3 py-1 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    ← Anterior
                  </button>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Página {page} de {totalPages}
                  </span>
                  <button
                    onClick={() => onPageChange(page + 1)}
                    disabled={page >= totalPages}
                    className="px-3 py-1 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Siguiente →
                  </button>
                </div>
              </td>
            </tr>
          </tfoot>
        )}
    </table>
  );
}
