import { ReactNode } from 'react'
import './DataTable.css'

export interface Column<T> {
  key: keyof T | string
  label: string
  render?: (value: unknown, row: T) => ReactNode
}

interface Props<T> {
  columns: Column<T>[]
  rows: T[]
  rowKey?: keyof T
  emptyText?: string
}

export default function DataTable<T extends object>({ columns, rows, rowKey, emptyText = 'No records found.' }: Props<T>) {
  return (
    <div className="data-table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((col, i) => <th key={i}>{col.label}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr><td colSpan={columns.length} className="data-table__empty">{emptyText}</td></tr>
          ) : rows.map((row, i) => (
            <tr key={rowKey ? String(row[rowKey as keyof T]) : i}>
              {columns.map((col, j) => (
                <td key={j}>
                  {col.render
                    ? col.render(col.key in row ? row[col.key as keyof T] : undefined, row)
                    : col.key in row ? String(row[col.key as keyof T] ?? '—') : '—'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
