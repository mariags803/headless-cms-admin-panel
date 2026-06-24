import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { Field, FieldValue, Schema } from '@cms/shared';
import { useSchema } from '../hooks/useSchema';
import { useSchemas } from '../hooks/useSchemas';
import { useEntries } from '../hooks/useEntries';
import { useCreateSchema } from '../hooks/useCreateSchema';
import { useUpdateSchema } from '../hooks/useUpdateSchema';
import { useUpdateEntry } from '../hooks/useUpdateEntry';
import { SchemaFieldRow, toFieldPayload, type FieldDraft } from '../components/SchemaFieldRow';
import { EvolutionPreviewModal } from '../components/EvolutionPreviewModal';
import { buildEvolutionPlan, type EvolutionPlan } from '../../../../application/evolution/buildEvolutionPlan';
import type { SchemaUpdateInput } from '../../../../domain/schema/SchemaRepository';
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
  const { data: entries } = useEntries(isEdit ? schemaId : undefined);
  const { mutate: createSchema, isPending: isCreating } = useCreateSchema();
  const { mutate: updateSchema, isPending: isUpdating } = useUpdateSchema();
  const { mutateAsync: updateEntry } = useUpdateEntry();
  const [isFixingEntries, setIsFixingEntries] = useState(false);
  const isSubmitting = isCreating || isUpdating || isFixingEntries;

  const [name, setName] = useState('');
  const [fields, setFields] = useState<FieldDraft[]>([]);
  const [nameError, setNameError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<number, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [pendingPlan, setPendingPlan] = useState<EvolutionPlan | null>(null);
  const [pendingInput, setPendingInput] = useState<SchemaUpdateInput | null>(null);
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

  function submitUpdate(input: SchemaUpdateInput) {
    updateSchema(
      { id: schemaId as string, input },
      {
        onSuccess: () => navigate('/schemas'),
        onError: (err) => setSubmitError(err.message),
      },
    );
  }

  function buildCandidateSchema(): Schema {
    const candidateFields: Field[] = fields.map((field) => ({
      id: field.id ?? `__new__${field.key}`,
      name: field.name.trim(),
      type: field.type,
      required: field.required,
      ...(field.type === 'reference' ? { refSchemaId: field.refSchemaId } : {}),
    }));
    return { ...(schema as Schema), name: name.trim(), fields: candidateFields };
  }

  function buildFieldNames(candidate: Schema): Record<string, string> {
    const names: Record<string, string> = {};
    schema?.fields.forEach((field) => {
      names[field.id] = field.name;
    });
    candidate.fields.forEach((field) => {
      names[field.id] = field.name;
    });
    return names;
  }

  function buildCandidateFields(candidate: Schema): Record<string, Field> {
    const byId: Record<string, Field> = {};
    candidate.fields.forEach((field) => {
      byId[field.id] = field;
    });
    return byId;
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    if (!validate()) {
      return;
    }

    const input = { name: name.trim(), fields: fields.map(toFieldPayload) };

    if (isEdit) {
      const candidate = buildCandidateSchema();
      const plan = buildEvolutionPlan(schema as Schema, candidate, entries ?? []);
      if (plan.highestRisk === 'safe') {
        submitUpdate(input);
      } else {
        setPendingPlan(plan);
        setPendingInput(input);
      }
    } else {
      createSchema(input, {
        onSuccess: () => navigate('/schemas'),
        onError: (err) => setSubmitError(err.message),
      });
    }
  }

  async function handleConfirmEvolution(transformed: Record<string, Record<string, FieldValue>>) {
    if (!pendingInput) return;
    const fixes = Object.entries(transformed).filter(([, fields]) => Object.keys(fields).length > 0);

    setIsFixingEntries(true);
    try {
      await Promise.all(
        fixes.map(([entryId, fields]) => {
          const entry = (entries ?? []).find((e) => e.id === entryId);
          if (!entry) return Promise.resolve();
          return updateEntry({ id: entryId, input: { data: { ...entry.data, ...fields } } });
        }),
      );
    } catch (err) {
      setIsFixingEntries(false);
      setSubmitError(err instanceof Error ? err.message : 'No se pudieron corregir las entradas afectadas.');
      return;
    }
    setIsFixingEntries(false);

    submitUpdate(pendingInput);
    setPendingPlan(null);
    setPendingInput(null);
  }

  function handleCancelEvolution() {
    setPendingPlan(null);
    setPendingInput(null);
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

      {pendingPlan && (
        <EvolutionPreviewModal
          plan={pendingPlan}
          fieldNames={buildFieldNames(buildCandidateSchema())}
          candidateFields={buildCandidateFields(buildCandidateSchema())}
          schemaName={name.trim()}
          submitting={isSubmitting}
          onConfirm={handleConfirmEvolution}
          onCancel={handleCancelEvolution}
        />
      )}
    </section>
  );
}
