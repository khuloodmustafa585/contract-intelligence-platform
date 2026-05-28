interface LoadingStateProps {
  rows?: number;
  type?: "table" | "cards" | "list" | "detail";
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 px-6 py-4" style={{ borderBottom: "1px solid var(--th-divider)" }}>
      <div className="skeleton h-4 w-48 rounded" />
      <div className="skeleton h-5 w-20 rounded-full ml-auto" />
      <div className="skeleton h-4 w-24 rounded" />
      <div className="skeleton h-4 w-20 rounded" />
    </div>
  );
}

function SkeletonCard() {
  return (
    <div
      className="rounded-2xl p-5"
      style={{ background: "var(--th-card-bg)", border: "1px solid var(--th-card-border)" }}
    >
      <div className="skeleton h-9 w-9 rounded-xl mb-4" />
      <div className="skeleton h-3 w-16 rounded mb-3" />
      <div className="skeleton h-7 w-12 rounded" />
    </div>
  );
}

function SkeletonListItem() {
  return (
    <div className="flex items-start gap-3 py-3" style={{ borderBottom: "1px solid var(--th-divider)" }}>
      <div className="skeleton h-8 w-8 rounded-lg shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="skeleton h-3.5 w-3/4 rounded" />
        <div className="skeleton h-3 w-1/2 rounded" />
      </div>
    </div>
  );
}

export default function LoadingState({ rows = 4, type = "table" }: LoadingStateProps) {
  if (type === "cards") {
    return (
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {Array.from({ length: rows }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (type === "list") {
    return (
      <div>
        {Array.from({ length: rows }).map((_, i) => (
          <SkeletonListItem key={i} />
        ))}
      </div>
    );
  }

  if (type === "detail") {
    return (
      <div className="space-y-4">
        <div className="skeleton h-8 w-64 rounded-xl" />
        <div className="skeleton h-4 w-96 rounded" />
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
        <div className="skeleton h-48 w-full rounded-2xl mt-4" />
      </div>
    );
  }

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: "var(--th-card-bg)", border: "1px solid var(--th-card-border)" }}
    >
      <div className="px-6 py-4" style={{ borderBottom: "1px solid var(--th-divider)" }}>
        <div className="skeleton h-4 w-32 rounded" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonRow key={i} />
      ))}
    </div>
  );
}
