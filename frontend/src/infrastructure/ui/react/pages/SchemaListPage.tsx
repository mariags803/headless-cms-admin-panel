import { Link } from 'react-router-dom'
import { useSchemas } from '../hooks/useSchemas'
import { useDeleteSchema } from '../hooks/useDeleteSchema'
import styles from './SchemaListPage.module.css'

export function SchemaListPage() {
  const { data: schemas, isLoading, error } = useSchemas()
  const { mutate: deleteSchema } = useDeleteSchema()

  function handleDelete(id: string, name: string) {
    if (window.confirm(`Delete "${name}"? This cannot be undone.`)) {
      deleteSchema(id)
    }
  }

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <h1>Content Types</h1>
        <Link className={styles.newButton} to="/schemas/new">
          New Content Type
        </Link>
      </header>

      {isLoading && <p data-state="loading">Loading content types…</p>}

      {error && <p role="alert">{error.message}</p>}

      {schemas && schemas.length === 0 && (
        <p className="emptyState">No content types yet. Create your first one.</p>
      )}

      {schemas && schemas.length > 0 && (
        <ul className={styles.grid}>
          {schemas.map((schema) => (
            <li key={schema.id} className={styles.card}>
              <h2 className={styles.cardName}>{schema.name}</h2>
              <p className={styles.cardMeta}>{schema.fields.length} fields</p>
              <div className={styles.cardActions}>
                <Link to={`/schemas/${schema.id}/edit`}>Edit</Link>
                <Link to={`/schemas/${schema.id}/entries`}>View entries</Link>
                <button type="button" onClick={() => handleDelete(schema.id, schema.name)}>
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
