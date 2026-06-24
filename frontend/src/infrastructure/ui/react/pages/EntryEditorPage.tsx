import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { validateEntry, type Field, type FieldValue } from '@cms/shared';
import { useSchema } from '../hooks/useSchema';
import { useEntry } from '../hooks/useEntry';
import { useCreateEntry } from '../hooks/useCreateEntry';
import { useUpdateEntry } from '../hooks/useUpdateEntry';
import { FieldInput } from '../components/fields';
import styles from './EntryEditorPage.module.css';

function defaultValueFor(field: Field): FieldValue {
  switch (field.type) {
    case 'text':
      return '';
    case 'boolean':
      return false;
    case 'number':
    case 'date':
    case 'reference':
    default:
      return null;
  }
}

function defaultsFor(fields: Field[]): Record<string, FieldValue> {
  return Object.fromEntries(fields.map((field) => [field.id, defaultValueFor(field)]));
}

export function EntryEditorPage() {
  const { schemaId, entryId } = useParams<{ schemaId: string; entryId: string }>();
  const isEdit = Boolean(entryId);
  const navigate = useNavigate();

  const { data: schema, isLoading: schemaLoading, error: schemaError } = useSchema(schemaId);
  const { data: entry, isLoading: entryLoading, error: entryError } = useEntry(schemaId, entryId);
  const { mutate: createEntry, isPending: isCreating } = useCreateEntry();
  const { mutate: updateEntry, isPending: isUpdating } = useUpdateEntry();
  const isSubmitting = isCreating || isUpdating;

  const [data, setData] = useState<Record<string, FieldValue>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const seededRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!schema) return;
    if (isEdit) {
      if (entry && seededRef.current !== entry.id) {
        seededRef.current = entry.id;
        setData({ ...defaultsFor(schema.fields), ...entry.data });
      }
    } else if (seededRef.current !== schema.id) {
      seededRef.current = schema.id;
      setData(defaultsFor(schema.fields));
    }
  }, [schema, entry, isEdit]);

  function handleChange(fieldId: string, value: FieldValue) {
    setData((prev) => ({ ...prev, [fieldId]: value }));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    if (!schema) return;

    const errors = validateEntry(data, schema);
    if (errors.length > 0) {
      setFieldErrors(Object.fromEntries(errors.map((err) => [err.fieldId, err.message])));
      return;
    }
    setFieldErrors({});

    if (isEdit) {
      updateEntry(
        { id: entryId as string, input: { data } },
        {
          onSuccess: () => navigate(`/schemas/${schemaId}/entries`),
          onError: (err) => setSubmitError(err.message),
        },
      );
    } else {
      createEntry(
        { schemaId: schemaId as string, data },
        {
          onSuccess: () => navigate(`/schemas/${schemaId}/entries`),
          onError: (err) => setSubmitError(err.message),
        },
      );
    }
  }

  const isLoadingPage = schemaLoading || (isEdit && entryLoading);
  const loadError = schemaError ?? (isEdit ? entryError : undefined);

  if (isLoadingPage) {
    return <p data-state="loading">Loading entry…</p>;
  }

  if (loadError) {
    return <p role="alert">{loadError.message}</p>;
  }

  if (!schema) {
    return null;
  }

  return (
    <section className={styles.page}>
      <h1>
        {isEdit ? 'Edit Entry' : 'New Entry'} — {schema.name}
      </h1>
      <form onSubmit={handleSubmit} className={styles.form}>
        {schema.fields.map((field) => (
          <div key={field.id} className={styles.field}>
            <span className={styles.fieldLabel}>
              {field.name}
              {field.required && <span aria-hidden="true"> *</span>}
            </span>
            <FieldInput
              field={field}
              value={data[field.id] ?? null}
              onChange={(value) => handleChange(field.id, value)}
              error={fieldErrors[field.id]}
            />
          </div>
        ))}

        {submitError && <p role="alert">{submitError}</p>}

        <div className={styles.actions}>
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving…' : 'Save'}
          </button>
          <button type="button" onClick={() => navigate(`/schemas/${schemaId}/entries`)}>
            Cancel
          </button>
        </div>
      </form>
    </section>
  );
}
