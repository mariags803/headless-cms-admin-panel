import { Link, useParams } from 'react-router-dom'
import type { FieldValue } from '@cms/shared'
import { useSchema } from '../hooks/useSchema'
import { useEntries } from '../hooks/useEntries'
import { useDeleteEntry } from '../hooks/useDeleteEntry'
import styles from './EntryListPage.module.css'

function formatValue(value: FieldValue | undefined) {
  if (value === null || value === undefined) return '—'
  if (typeof value === 'boolean') return value ? 'Sí' : 'No'
  return String(value)
}

export function EntryListPage() {
  const { schemaId } = useParams<{ schemaId: string }>()
  const { data: schema, isLoading: schemaLoading, error: schemaError } = useSchema(schemaId)
  const { data: entries, isLoading: entriesLoading, error: entriesError } = useEntries(schemaId)
  const { mutate: deleteEntry } = useDeleteEntry()

  const isLoading = schemaLoading || entriesLoading
  const error = schemaError ?? entriesError

  function handleDelete(id: string) {
    if (window.confirm('Delete this entry? This cannot be undone.') && schemaId) {
      deleteEntry({ id, schemaId })
    }
  }

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <div>
          <Link to="/schemas">← Back to content types</Link>
          <h1>{schema ? `${schema.name} entries` : 'Entries'}</h1>
        </div>
        <Link className={styles.newButton} to={`/schemas/${schemaId}/entries/new`}>
          New Entry
        </Link>
      </header>

      {isLoading && <p data-state="loading">Loading entries…</p>}

      {error && <p role="alert">{error.message}</p>}

      {entries && entries.length === 0 && (
        <p className="emptyState">No entries yet. Create your first one.</p>
      )}

      {schema && entries && entries.length > 0 && (
        <table className={styles.table}>
          <thead>
            <tr>
              {schema.fields.map((field) => (
                <th key={field.id}>{field.name}</th>
              ))}
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry.id}>
                {schema.fields.map((field) => (
                  <td key={field.id}>{formatValue(entry.data[field.id])}</td>
                ))}
                <td>
                  <div className={styles.actions}>
                    <Link to={`/schemas/${schemaId}/entries/${entry.id}/edit`}>Edit</Link>
                    <button type="button" onClick={() => handleDelete(entry.id)}>
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  )
}
