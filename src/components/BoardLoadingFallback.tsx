/** Placeholder shown while a lazy puzzle board/example chunk loads. */
export default function BoardLoadingFallback() {
  return (
    <div className="flex min-h-44 w-full min-w-0 items-center justify-center" aria-hidden="true">
      <span className="h-3 w-3 animate-pulse rounded-full bg-border" />
    </div>
  );
}
