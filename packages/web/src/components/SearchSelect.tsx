import { useState, useEffect, useRef, useCallback } from "react";
import type { ApiClient } from "@/lib/createApiClient";

interface SearchSelectProps<T> {
  apiClient: ApiClient<T>;
  value: number | string;
  onChange: (id: number, record: T | null) => void;
  labelKey?: string;
  valueKey?: string;
  placeholder?: string;
  required?: boolean;
  autoFocus?: boolean;
  renderOption?: (record: T) => string;
}

export function SearchSelect<T extends Record<string, unknown>>({
  apiClient,
  value,
  onChange,
  labelKey = "name",
  valueKey = "id",
  placeholder = "Buscar...",
  required,
  autoFocus,
  renderOption,
}: SearchSelectProps<T>) {
  const [inputValue, setInputValue] = useState("");
  const [results, setResults] = useState<T[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  const getLabel = useCallback(
    (record: T) =>
      renderOption ? renderOption(record) : String(record[labelKey] ?? ""),
    [renderOption, labelKey],
  );

  // Load initial label when value is set (e.g. editing existing record)
  useEffect(() => {
    if (!value) {
      setSelectedLabel("");
      return;
    }
    apiClient
      .fetchPaginated({ page: 1, limit: 10, search: String(value) })
      .then((res) => {
        const match = res.data.find(
          (r) => String(r[valueKey]) === String(value),
        );
        if (match) setSelectedLabel(getLabel(match));
      })
      .catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchResults = useCallback(
    (search: string) => {
      setLoading(true);
      const params: Record<string, string | number> = {
        page: 1,
        limit: 10,
      };
      if (search) params.search = search;
      apiClient
        .fetchPaginated(params as { page: number; limit: number } & Record<string, string | number>)
        .then((res) => {
          setResults(res.data);
        })
        .catch(() => setResults([]))
        .finally(() => setLoading(false));
    },
    [apiClient],
  );

  function handleInputChange(text: string) {
    setInputValue(text);
    setSelectedLabel("");
    onChange(0, null);
    setIsOpen(true);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchResults(text), 300);
  }

  function handleSelect(record: T) {
    const id = Number(record[valueKey]);
    const label = getLabel(record);
    setSelectedLabel(label);
    setInputValue("");
    setIsOpen(false);
    onChange(id, record);
  }

  function handleClear() {
    setSelectedLabel("");
    setInputValue("");
    setResults([]);
    onChange(0, null);
  }

  function handleFocus() {
    setIsOpen(true);
    if (results.length === 0 && !selectedLabel) {
      fetchResults("");
    }
  }

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const inputClass =
    "w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent";

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <input
          type="text"
          value={selectedLabel || inputValue}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={handleFocus}
          placeholder={placeholder}
          className={inputClass}
          required={required && !value}
          autoFocus={autoFocus}
          readOnly={!!selectedLabel}
        />
        {selectedLabel && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 bg-transparent border-none cursor-pointer text-lg leading-none"
          >
            ✕
          </button>
        )}
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 shadow-lg max-h-60 overflow-y-auto">
          {loading && (
            <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
              Buscando...
            </div>
          )}
          {!loading && results.length === 0 && (
            <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
              Sin resultados
            </div>
          )}
          {!loading &&
            results.map((record, i) => (
              <button
                key={String(record[valueKey]) || i}
                type="button"
                onClick={() => handleSelect(record)}
                className="w-full text-left px-3 py-2 text-sm text-gray-900 dark:text-gray-100 hover:bg-indigo-50 dark:hover:bg-gray-700 cursor-pointer border-none bg-transparent"
              >
                {getLabel(record)}
              </button>
            ))}
        </div>
      )}

      {/* Hidden input for form validation */}
      <input type="hidden" value={value || ""} />
    </div>
  );
}
