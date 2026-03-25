export function PageSkeleton() {
  return (
    <div className="w-full max-w-5xl animate-pulse">
      <div className="flex justify-between items-center mb-4">
        <div className="h-8 w-48 bg-gray-200 dark:bg-gray-800 rounded" />
        <div className="flex gap-2">
          <div className="h-9 w-24 bg-gray-200 dark:bg-gray-800 rounded-lg" />
          <div className="h-9 w-28 bg-gray-200 dark:bg-gray-800 rounded-lg" />
        </div>
      </div>
      <div className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
        <div className="h-10 bg-gray-100 dark:bg-gray-800" />
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="h-12 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900"
          />
        ))}
      </div>
    </div>
  );
}
