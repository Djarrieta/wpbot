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
}

export function Table<T>({ columns, data, keyField, actions }: TableProps<T>) {
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
    </table>
  );
}
