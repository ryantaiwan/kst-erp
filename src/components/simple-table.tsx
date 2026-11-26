export type Column<T> = {
  key: string;
  label: string;
  render: (row: T) => React.ReactNode;
};

export function SimpleTable<T>({ columns, rows, empty }: { columns: Column<T>[]; rows: T[]; empty?: string }) {
  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-[#e9e6f3] bg-white p-12 text-center text-sm text-[#8c88a6]">
        {empty ?? "尚無資料"}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-[#e9e6f3] bg-white">
      <table className="w-full text-[12px]">
        <thead>
          <tr className="bg-[#fbfaff] text-left text-[#9b96b0]">
            {columns.map((c) => (
              <th key={c.key} className="whitespace-nowrap px-4 py-3 font-medium">
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-t border-[#f1eff7] hover:bg-[#fcfbff]">
              {columns.map((c) => (
                <td key={c.key} className="whitespace-nowrap px-4 py-3">
                  {c.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
