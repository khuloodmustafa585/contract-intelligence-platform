interface Props {
  title: string;
  value: string | number;
}

export default function MetricCard({
  title,
  value,
}: Props) {
  return (
    <div
      className="
        rounded-xl border border-slate-800
        bg-slate-900/70 p-6
      "
    >
      <div className="flex items-center justify-between">

        <span
          className="
            text-xs uppercase tracking-widest
            text-slate-400
          "
        >
          {title}
        </span>

        <div
          className="
            h-10 w-10 rounded-lg bg-slate-800
          "
        />
      </div>

      <div className="mt-6">

        <div
          className="
            text-3xl font-bold text-white
          "
        >
          {value}
        </div>

      </div>
    </div>
  );
}