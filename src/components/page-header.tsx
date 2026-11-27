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
    <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between lg:gap-4">
      <div className="min-w-0">
        <h1 className="truncate text-xl font-semibold text-[#26223d] sm:text-2xl">{title}</h1>
        {subtitle ? <p className="mt-1 text-xs leading-5 text-[#8c88a6]">{subtitle}</p> : null}
      </div>
      {right ? <div className="flex min-w-0 flex-wrap items-center gap-2">{right}</div> : null}
    </div>
  );
}
