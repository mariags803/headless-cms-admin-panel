import { useEffect, useRef } from 'react';
import type { SchemaChange } from '@cms/shared';
import type { EvolutionPlan } from '../../../../application/evolution/buildEvolutionPlan';
import styles from './EvolutionPreviewModal.module.css';

export interface EvolutionPreviewModalProps {
  plan: EvolutionPlan;
  fieldNames: Record<string, string>;
  schemaName: string;
  submitting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
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
  schemaName,
  submitting,
  onConfirm,
  onCancel,
}: EvolutionPreviewModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) {
      dialog.showModal();
    }
  }, []);

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
          <ul className={styles.affectedList}>
            {plan.affected.map((entry, index) => (
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
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className={styles.actions}>
        <button type="button" onClick={onCancel} disabled={submitting}>
          Cancelar
        </button>
        <button type="button" onClick={onConfirm} disabled={submitting}>
          {submitting ? 'Guardando…' : 'Confirmar'}
        </button>
      </div>
    </dialog>
  );
}
