import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { validateEntry, type DomainEvent, type Entry, type Field, type FieldValue, type Schema } from '@cms/shared';
import { useSchema } from '../hooks/useSchema';
import { useEntry } from '../hooks/useEntry';
import { useCreateEntry } from '../hooks/useCreateEntry';
import { useUpdateEntry } from '../hooks/useUpdateEntry';
import { useRealtime } from '../hooks/useRealtime';
import { FieldInput } from '../components/fields';
import { buildEvolutionPlan } from '../../../../application/evolution/buildEvolutionPlan';
import { describeChange } from '../../../../application/evolution/describeChange';
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

  // Frozen snapshot the form actually renders against. A live schema.updated
  // event is staged in pendingSchema instead of swapping this in directly, so
  // in-progress input is never silently discarded mid-edit.
  const [activeSchema, setActiveSchema] = useState<Schema | null>(null);
  const [pendingSchema, setPendingSchema] = useState<Schema | null>(null);
  const activeSchemaSeededRef = useRef(false);

  useEffect(() => {
    if (!schema) return;
    if (!activeSchemaSeededRef.current) {
      activeSchemaSeededRef.current = true;
      setActiveSchema(schema);
    }
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

  const onRealtimeEvent = useCallback(
    (event: DomainEvent) => {
      if (
        event.type === 'schema.updated' &&
        event.schema.id === schemaId &&
        activeSchema &&
        event.schema.updatedAt !== activeSchema.updatedAt
      ) {
        setPendingSchema(event.schema);
      }
    },
    [schemaId, activeSchema],
  );
  useRealtime(onRealtimeEvent);

  const fieldNames = useMemo(() => {
    const names: Record<string, string> = {};
    activeSchema?.fields.forEach((field) => {
      names[field.id] = field.name;
    });
    pendingSchema?.fields.forEach((field) => {
      names[field.id] = field.name;
    });
    return names;
  }, [activeSchema, pendingSchema]);

  const pendingPlan = useMemo(() => {
    if (!activeSchema || !pendingSchema) return null;
    const draftEntry: Entry = {
      id: entryId ?? 'draft',
      schemaId: schemaId as string,
      data,
      createdAt: '',
      updatedAt: '',
    };
    return buildEvolutionPlan(activeSchema, pendingSchema, [draftEntry]);
  }, [activeSchema, pendingSchema, entryId, schemaId, data]);

  function handleChange(fieldId: string, value: FieldValue) {
    setData((prev) => ({ ...prev, [fieldId]: value }));
  }

  function reconcileSchema() {
    if (!pendingSchema || !pendingPlan) return;

    const nextFieldIds = new Set(pendingSchema.fields.map((field) => field.id));
    const nextData = defaultsFor(pendingSchema.fields);
    for (const field of pendingSchema.fields) {
      if (field.id in data) nextData[field.id] = data[field.id];
    }

    const nextErrors: Record<string, string> = {};
    for (const row of pendingPlan.affected) {
      if (!nextFieldIds.has(row.fieldId)) continue;
      if (row.coerced) {
        if (row.coerced.ok) {
          nextData[row.fieldId] = row.coerced.value;
        } else {
          nextErrors[row.fieldId] = 'Este valor ya no es válido tras el cambio de tipo; corrígelo.';
        }
      } else {
        nextErrors[row.fieldId] = 'Este campo ahora es obligatorio.';
      }
    }

    setData(nextData);
    setFieldErrors(nextErrors);
    setActiveSchema(pendingSchema);
    setPendingSchema(null);
  }

  function dismissPendingSchema() {
    setPendingSchema(null);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    if (!activeSchema) return;

    const errors = validateEntry(data, activeSchema);
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

  if (!activeSchema) {
    return <p role="alert">Content type not found. It may have been deleted.</p>;
  }

  return (
    <section className={styles.page}>
      <h1>
        {isEdit ? 'Edit Entry' : 'New Entry'} — {activeSchema.name}
      </h1>

      {pendingSchema && pendingPlan && (
        <section role="alert" className={styles.schemaBanner}>
          <p>El esquema cambió mientras editabas esta entrada.</p>
          <ul className={styles.schemaBannerList}>
            {pendingPlan.changes.map(({ change, risk }, index) => (
              <li key={index} data-risk={risk}>
                {describeChange(change, fieldNames)}
              </li>
            ))}
          </ul>
          <div className={styles.actions}>
            <button type="button" onClick={reconcileSchema}>
              Actualizar formulario
            </button>
            <button type="button" onClick={dismissPendingSchema}>
              Descartar
            </button>
          </div>
        </section>
      )}

      <form onSubmit={handleSubmit} className={styles.form}>
        {activeSchema.fields.map((field) => (
          <div key={field.id} className={styles.field} data-field-type={field.type}>
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
          <button type="submit" className={styles.saveButton} disabled={isSubmitting}>
            {isSubmitting ? 'Saving…' : 'Save'}
          </button>
          <button
            type="button"
            className={styles.cancelButton}
            onClick={() => navigate(`/schemas/${schemaId}/entries`)}
          >
            Cancel
          </button>
        </div>
      </form>
    </section>
  );
}
