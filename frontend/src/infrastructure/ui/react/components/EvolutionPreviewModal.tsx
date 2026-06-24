import { useEffect, useRef, useState } from 'react';
import type { Field, FieldValue, SchemaChange } from '@cms/shared';
import type { EvolutionPlan } from '../../../../application/evolution/buildEvolutionPlan';
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

function describeChange(change: SchemaChange, fieldNames: Record<string, string>): string {
  switch (change.kind) {
    case 'field.added':
      return `Se agregará el campo "${change.field.name}".`;
    case 'field.removed':
      return `Se eliminará el campo "${change.field.name}".`;
    case 'field.renamed':
      return `El campo "${change.from}" se renombrará a "${change.to}".`;
    case 'field.retyped':
      return `El campo "${fieldNames[change.fieldId] ?? change.fieldId}" cambiará de tipo ${change.from} a ${change.to}.`;
    case 'field.requiredChanged':
      return `El campo "${fieldNames[change.fieldId] ?? change.fieldId}" pasará a ser ${
        change.required ? 'obligatorio' : 'opcional'
      }.`;
    case 'field.refRetargeted':
      return `La referencia del campo "${fieldNames[change.fieldId] ?? change.fieldId}" cambiará de destino.`;
  }
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
      <h2 id="evolution-preview-heading">Revisar cambios en {schemaName}</h2>

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
        <section>
          <h3>Entradas afectadas ({plan.affected.length})</h3>
          {hasSuggestedFix && (
            <button type="button" onClick={applySuggestedToAll}>
              Aplicar conversión sugerida a todas
            </button>
          )}
          <ul className={styles.affectedList}>
            {plan.affected.map((entry, index) => {
              const kind = changeKindFor(plan, entry.fieldId);
              const field = candidateFields[entry.fieldId];
              const missing = isMissing(entry);
              return (
                <li key={index} className={styles.affectedRow}>
                  <span>
                    Entrada {entry.entryId} · campo "{fieldNames[entry.fieldId] ?? entry.fieldId}" ·
                    valor actual: {String(entry.currentValue)}
                  </span>
                  {entry.coerced && (
                    <span>
                      {entry.coerced.ok
                        ? `se convertirá a ${entry.coerced.value}`
                        : 'no se puede convertir — requiere ajuste manual'}
                    </span>
                  )}
                  {kind === 'field.refRetargeted' && <span>se quitará la referencia salvo que elijas otra.</span>}
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
        <button type="button" onClick={onCancel} disabled={submitting}>
          Cancelar
        </button>
        <button type="button" onClick={handleConfirm} disabled={submitting || !canConfirm}>
          {submitting ? 'Guardando…' : 'Confirmar'}
        </button>
      </div>
    </dialog>
  );
}
