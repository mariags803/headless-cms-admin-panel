import { useParams } from 'react-router-dom'

export function EntryEditorPage() {
  const { schemaId, entryId } = useParams<{ schemaId: string; entryId: string }>()
  return (
    <section>
      <h1>{entryId ? 'Edit Entry' : 'New Entry'} — {schemaId}</h1>
    </section>
  )
}
