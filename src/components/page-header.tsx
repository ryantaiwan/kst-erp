export function PageHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold text-[#26223d]">{title}</h1>
        {subtitle ? <p className="mt-1 text-xs text-[#8c88a6]">{subtitle}</p> : null}
      </div>
      {right}
    </div>
  );
}
