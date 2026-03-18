type KpiCardProps = {
  label: string;
  value: string;
  tone?: "good" | "warn" | "neutral";
};

export function KpiCard({ label, value, tone = "neutral" }: KpiCardProps) {
  return (
    <article className={`kpi-card kpi-card--${tone}`}>
      <p>{label}</p>
      <strong>{value}</strong>
    </article>
  );
}
