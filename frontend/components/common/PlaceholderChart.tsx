export default function PlaceholderChart() {
  return (
    <div
      style={{
        borderRadius: "0.75rem",
        border: "1px solid var(--th-card-border)",
        background: "var(--th-card-bg)",
        padding: "1.5rem",
      }}
    >
      <div className="mb-6 flex items-center justify-between">
        <div
          className="animate-pulse"
          style={{ height: "1rem", width: "10rem", borderRadius: "0.25rem", background: "var(--th-subtle-bg)" }}
        />
        <div
          className="animate-pulse"
          style={{ height: "1rem", width: "5rem", borderRadius: "0.25rem", background: "var(--th-subtle-bg)" }}
        />
      </div>
      <div className="flex h-40 items-end gap-2">
        {Array.from({ length: 10 }).map((_, index) => (
          <div
            key={index}
            className="flex-1 rounded-t animate-pulse"
            style={{ height: `${20 + index * 5}%`, background: "var(--th-subtle-bg)" }}
          />
        ))}
      </div>
    </div>
  );
}
