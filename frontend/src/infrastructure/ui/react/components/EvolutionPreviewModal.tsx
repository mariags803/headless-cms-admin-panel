import { useEffect, useRef, useState } from 'react';
import type { Field, FieldValue, SchemaChange } from '@cms/shared';
import type { EvolutionPlan } from '../../../../application/evolution/buildEvolutionPlan';
import { describeChange } from '../../../../application/evolution/describeChange';
import { FieldInput } from './fields/FieldRegistry';
import styles from './EvolutionPreviewModal.module.css';

export interface EvolutionPreviewModalProps {
  plan: EvolutionPlan;
  fieldNames: Record<string, string>;
  candidateFields: Record<string, Field>;
  schemaName: string;
  submitting: boolean;
  onConfirm: (transformed: Record<string, Record<string, FieldValue>>) => void;
  onCancel: () => void;
}

function overrideKey(entryId: string, fieldId: string): string {
  return `${entryId}:${fieldId}`;
}

function changeKindFor(plan: EvolutionPlan, fieldId: string): SchemaChange['kind'] | undefined {
  const found = plan.changes.find(
    ({ change }) =>
      (change.kind === 'field.removed' && change.field.id === fieldId) ||
      ('fieldId' in change && change.fieldId === fieldId),
  );
  return found?.change.kind;
}

function needsManualFix(kind: SchemaChange['kind'] | undefined, coerced: { ok: boolean } | undefined): boolean {
  return kind === 'field.requiredChanged' || (kind === 'field.retyped' && coerced?.ok === false);
}

export function EvolutionPreviewModal({
  plan,
  fieldNames,
  candidateFields,
  schemaName,
  submitting,
  onConfirm,
  onCancel,
}: EvolutionPreviewModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [overrides, setOverrides] = useState<Record<string, FieldValue>>({});

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) {
      dialog.showModal();
    }
  }, []);

  function setOverride(entryId: string, fieldId: string, value: FieldValue) {
    setOverrides((prev) => ({ ...prev, [overrideKey(entryId, fieldId)]: value }));
  }

  function applySuggestedToAll() {
    setOverrides((prev) => {
      const next = { ...prev };
      for (const row of plan.affected) {
        if (row.coerced?.ok) {
          next[overrideKey(row.entryId, row.fieldId)] = row.coerced.value;
        }
      }
      return next;
    });
  }

  function resolvedValue(entryId: string, fieldId: string, coerced: { ok: true; value: FieldValue } | { ok: false } | undefined): FieldValue {
    const key = overrideKey(entryId, fieldId);
    if (key in overrides) return overrides[key];
    return coerced?.ok ? coerced.value : null;
  }

  const fixableRows = plan.affected.filter((row) => changeKindFor(plan, row.fieldId) !== 'field.removed');

  function isMissing(row: (typeof plan.affected)[number]): boolean {
    const kind = changeKindFor(plan, row.fieldId);
    if (!needsManualFix(kind, row.coerced)) return false;
    const value = resolvedValue(row.entryId, row.fieldId, row.coerced);
    return value === null || value === undefined || value === '';
  }

  const canConfirm = fixableRows.every((row) => !isMissing(row));

  const hasSuggestedFix = plan.affected.some((row) => row.coerced?.ok);

  function handleConfirm() {
    const transformed: Record<string, Record<string, FieldValue>> = {};
    for (const row of fixableRows) {
      const value = resolvedValue(row.entryId, row.fieldId, row.coerced);
      transformed[row.entryId] = { ...transformed[row.entryId], [row.fieldId]: value };
    }
    onConfirm(transformed);
  }

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      aria-labelledby="evolution-preview-heading"
      onCancel={(e) => {
        e.preventDefault();
        onCancel();
      }}
    >
      <h2 id="evolution-preview-heading" className={styles.heading}>
        Review changes in {schemaName}
      </h2>

      <ul className={styles.changeList}>
        {plan.changes.map(({ change, risk }, index) => (
          <li key={index} className={styles.changeRow}>
            <span className={styles.badge} data-risk={risk}>
              {risk}
            </span>
            <span>{describeChange(change, fieldNames)}</span>
          </li>
        ))}
      </ul>

      {plan.affected.length > 0 && (
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Affected entries ({plan.affected.length})</h3>
          {hasSuggestedFix && (
            <button type="button" className={styles.applyAllButton} onClick={applySuggestedToAll}>
              Apply the suggested conversion to all
            </button>
          )}
          <ul className={styles.affectedList}>
            {plan.affected.map((entry, index) => {
              const kind = changeKindFor(plan, entry.fieldId);
              const field = candidateFields[entry.fieldId];
              const missing = isMissing(entry);
              return (
                <li key={index} className={styles.affectedRow}>
                  <span className={styles.affectedMeta}>
                    Entry {entry.entryId} · field "{fieldNames[entry.fieldId] ?? entry.fieldId}" ·
                    current valor: {String(entry.currentValue)}
                  </span>
                  {entry.coerced && (
                    <span className={styles.affectedNote}>
                      {entry.coerced.ok
                        ? `will be converted to ${entry.coerced.value}`
                        : 'cannot be converted, requires manual adjustment'}
                    </span>
                  )}
                  {kind === 'field.refRetargeted' && (
                    <span className={styles.affectedNote}>the reference will be removed unless you select another one.</span>
                  )}
                  {kind !== 'field.removed' && field && (
                    <FieldInput
                      field={field}
                      value={resolvedValue(entry.entryId, entry.fieldId, entry.coerced)}
                      onChange={(value) => setOverride(entry.entryId, entry.fieldId, value)}
                      error={missing ? 'Se requiere un valor.' : undefined}
                    />
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <div className={styles.actions}>
        <button type="button" className={styles.cancelButton} onClick={onCancel} disabled={submitting}>
          Cancel
        </button>
        <button type="button" className={styles.confirmButton} onClick={handleConfirm} disabled={submitting || !canConfirm}>
          {submitting ? 'Saving…' : 'Confirm'}
        </button>
      </div>
    </dialog>
  );
}
