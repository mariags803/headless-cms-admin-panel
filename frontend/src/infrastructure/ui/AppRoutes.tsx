import { Navigate, Route, Routes } from 'react-router-dom'
import { SchemaListPage } from './react/pages/SchemaListPage'
import { SchemaEditorPage } from './react/pages/SchemaEditorPage'
import { EntryListPage } from './react/pages/EntryListPage'
import { EntryEditorPage } from './react/pages/EntryEditorPage'

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/schemas" replace />} />
      <Route path="/schemas" element={<SchemaListPage />} />
      <Route path="/schemas/new" element={<SchemaEditorPage />} />
      <Route path="/schemas/:schemaId/edit" element={<SchemaEditorPage />} />
      <Route path="/schemas/:schemaId/entries" element={<EntryListPage />} />
      <Route path="/schemas/:schemaId/entries/new" element={<EntryEditorPage />} />
      <Route path="/schemas/:schemaId/entries/:entryId/edit" element={<EntryEditorPage />} />
    </Routes>
  )
}
