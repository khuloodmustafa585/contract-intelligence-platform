interface Props {
  title: string;
  value: string | number;
}

export default function MetricCard({ title, value }: Props) {
  return (
    <div
      style={{
        borderRadius: "0.75rem",
        border: "1px solid var(--th-card-border)",
        background: "var(--th-card-bg)",
        padding: "1.5rem",
      }}
    >
      <div className="flex items-center justify-between">
        <span
          style={{
            fontSize: "0.75rem",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            color: "var(--th-text-3)",
          }}
        >
          {title}
        </span>
        <div
          style={{
            height: "2.5rem",
            width: "2.5rem",
            borderRadius: "0.5rem",
            background: "var(--th-subtle-bg)",
          }}
        />
      </div>
      <div className="mt-6">
        <div
          style={{
            fontSize: "1.875rem",
            fontWeight: 700,
            color: "var(--th-text-1)",
          }}
        >
          {value}
        </div>
      </div>
    </div>
  );
}
