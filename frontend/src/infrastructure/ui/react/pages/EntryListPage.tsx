import { useParams } from 'react-router-dom'

export function EntryListPage() {
  const { schemaId } = useParams<{ schemaId: string }>()
  return (
    <section>
      <h1>Entries — {schemaId}</h1>
    </section>
  )
}
