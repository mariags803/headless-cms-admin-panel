import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSchema } from '../hooks/useSchema';
import { useSchemas } from '../hooks/useSchemas';
import { useCreateSchema } from '../hooks/useCreateSchema';
import { useUpdateSchema } from '../hooks/useUpdateSchema';
import { SchemaFieldRow, toFieldPayload, type FieldDraft } from '../components/SchemaFieldRow';
import styles from './SchemaEditorPage.module.css';

function swap<T>(items: T[], a: number, b: number): T[] {
  const next = [...items];
  [next[a], next[b]] = [next[b], next[a]];
  return next;
}

export function SchemaEditorPage() {
  const { schemaId } = useParams<{ schemaId: string }>();
  const isEdit = Boolean(schemaId);
  const navigate = useNavigate();

  const { data: schema, isLoading, error } = useSchema(schemaId);
  const { data: allSchemas } = useSchemas();
  const { mutate: createSchema, isPending: isCreating } = useCreateSchema();
  const { mutate: updateSchema, isPending: isUpdating } = useUpdateSchema();
  const isSubmitting = isCreating || isUpdating;

  const [name, setName] = useState('');
  const [fields, setFields] = useState<FieldDraft[]>([]);
  const [nameError, setNameError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<number, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const seededRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (schema && seededRef.current !== schema.id) {
      seededRef.current = schema.id;
      setName(schema.name);
      setFields(
        schema.fields.map((field) => ({
          key: field.id,
          id: field.id,
          name: field.name,
          type: field.type,
          required: field.required,
          refSchemaId: field.refSchemaId,
        })),
      );
    }
  }, [schema]);

  function addField() {
    setFields((prev) => [
      ...prev,
      { key: crypto.randomUUID(), name: '', type: 'text', required: false },
    ]);
  }

  function removeField(index: number) {
    setFields((prev) => prev.filter((_, i) => i !== index));
  }

  function moveField(index: number, direction: -1 | 1) {
    setFields((prev) => swap(prev, index, index + direction));
  }

  function updateField(index: number, patch: Partial<Omit<FieldDraft, 'key' | 'id'>>) {
    setFields((prev) => prev.map((field, i) => (i === index ? { ...field, ...patch } : field)));
  }

  function validate(): boolean {
    let valid = true;
    if (!name.trim()) {
      setNameError('Name is required.');
      valid = false;
    } else {
      setNameError(null);
    }

    const errors: Record<number, string> = {};
    const seenNames = new Set<string>();
    fields.forEach((field, index) => {
      const trimmed = field.name.trim();
      if (!trimmed) {
        errors[index] = 'Field name is required.';
        valid = false;
      } else if (seenNames.has(trimmed)) {
        errors[index] = 'Duplicate field name.';
        valid = false;
      } else {
        seenNames.add(trimmed);
      }
    });
    setFieldErrors(errors);

    return valid;
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    if (!validate()) {
      return;
    }

    const input = { name: name.trim(), fields: fields.map(toFieldPayload) };

    if (isEdit) {
      updateSchema(
        { id: schemaId as string, input },
        {
          onSuccess: () => navigate('/schemas'),
          onError: (err) => setSubmitError(err.message),
        },
      );
    } else {
      createSchema(input, {
        onSuccess: () => navigate('/schemas'),
        onError: (err) => setSubmitError(err.message),
      });
    }
  }

  if (isEdit && isLoading) {
    return <p data-state="loading">Loading content type…</p>;
  }

  if (isEdit && error) {
    return <p role="alert">{error.message}</p>;
  }

  return (
    <section className={styles.page}>
      <h1>{isEdit ? 'Edit Content Type' : 'New Content Type'}</h1>
      <form onSubmit={handleSubmit} className={styles.form}>
        <label className={styles.nameField}>
          Name
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            data-invalid={nameError ? '' : undefined}
          />
        </label>
        {nameError && <p role="alert">{nameError}</p>}

        <ul className={styles.fieldList}>
          {fields.map((field, index) => (
            <SchemaFieldRow
              key={field.key}
              field={field}
              index={index}
              total={fields.length}
              schemas={allSchemas ?? []}
              nameError={fieldErrors[index]}
              onChange={(patch) => updateField(index, patch)}
              onRemove={() => removeField(index)}
              onMoveUp={() => moveField(index, -1)}
              onMoveDown={() => moveField(index, 1)}
            />
          ))}
        </ul>

        <button type="button" onClick={addField} className={styles.addButton}>
          Add Field
        </button>

        {submitError && <p role="alert">{submitError}</p>}

        <div className={styles.actions}>
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving…' : 'Save'}
          </button>
        </div>
      </form>
    </section>
  );
}
