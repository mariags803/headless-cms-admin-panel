import { useParams } from 'react-router-dom'

export function SchemaEditorPage() {
  const { schemaId } = useParams<{ schemaId: string }>()
  return (
    <section>
      <h1>{schemaId ? 'Edit Content Type' : 'New Content Type'}</h1>
    </section>
  )
}
