const DataTable = ({ columns, data, emptyMessage = 'No records found.', actions }) => (
  <div className="glass-panel overflow-hidden">
    <div className="overflow-x-auto">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-app-soft text-app-muted">
          <tr>
            {columns.map((column) => (
              <th key={column.key} className="px-5 py-4 font-semibold">
                {column.header}
              </th>
            ))}
            {actions ? <th className="px-5 py-4 font-semibold">Actions</th> : null}
          </tr>
        </thead>
        <tbody>
          {data.length ? (
            data.map((row) => (
              <tr key={row.id} className="border-t border-app-border/80">
                {columns.map((column) => (
                  <td key={`${row.id}-${column.key}`} className="px-5 py-4 align-top text-app-black">
                    {column.render ? column.render(row) : row[column.key] ?? 'N/A'}
                  </td>
                ))}
                {actions ? <td className="px-5 py-4">{actions(row)}</td> : null}
              </tr>
            ))
          ) : (
            <tr>
              <td
                colSpan={columns.length + (actions ? 1 : 0)}
                className="px-5 py-10 text-center text-sm text-app-muted"
              >
                {emptyMessage}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </div>
);

export default DataTable;
