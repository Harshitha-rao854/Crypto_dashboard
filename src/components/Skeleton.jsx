export default function Skeleton() {
  return (
    <div className="animate-pulse space-y-3">
      {[...Array(10)].map((_, i) => (
        <div
          key={i}
          className="h-12 rounded bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800"
        />
      ))}
    </div>
  );
}