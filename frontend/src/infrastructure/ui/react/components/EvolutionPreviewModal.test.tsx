import { fireEvent, render, screen } from '@testing-library/react';
import type { EvolutionPlan } from '../../../../application/evolution/buildEvolutionPlan';
import { EvolutionPreviewModal } from './EvolutionPreviewModal';

function makePlan(overrides: Partial<EvolutionPlan> = {}): EvolutionPlan {
  return {
    changes: [
      {
        change: { kind: 'field.retyped', fieldId: 'f1', from: 'text', to: 'number' },
        risk: 'warning',
      },
    ],
    affected: [],
    highestRisk: 'warning',
    hasBlockingChanges: false,
    ...overrides,
  };
}

describe('EvolutionPreviewModal', () => {
  it('renders a risk badge for each change', () => {
    render(
      <EvolutionPreviewModal
        plan={makePlan()}
        fieldNames={{ f1: 'year' }}
        schemaName="Car"
        submitting={false}
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
      />,
    );

    expect(screen.getByText('warning')).toHaveAttribute('data-risk', 'warning');
    expect(screen.getByText(/year.*text a number/)).toBeInTheDocument();
  });

  it('does not render the affected section when there are no affected entries', () => {
    render(
      <EvolutionPreviewModal
        plan={makePlan()}
        fieldNames={{ f1: 'year' }}
        schemaName="Car"
        submitting={false}
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
      />,
    );

    expect(screen.queryByText(/Entradas afectadas/)).not.toBeInTheDocument();
  });

  it('shows the affected entries list with coercion outcome', () => {
    const plan = makePlan({
      affected: [
        { entryId: 'e1', fieldId: 'f1', currentValue: '2024', coerced: { ok: true, value: 2024 } },
        { entryId: 'e2', fieldId: 'f1', currentValue: 'vintage', coerced: { ok: false } },
      ],
      highestRisk: 'destructive',
      hasBlockingChanges: true,
    });
    render(
      <EvolutionPreviewModal
        plan={plan}
        fieldNames={{ f1: 'year' }}
        schemaName="Car"
        submitting={false}
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
      />,
    );

    expect(screen.getByText(/Entradas afectadas \(2\)/)).toBeInTheDocument();
    expect(screen.getByText(/se convertirá a 2024/)).toBeInTheDocument();
    expect(screen.getByText(/no se puede convertir/)).toBeInTheDocument();
  });

  it('calls onCancel when Cancelar is clicked', () => {
    const onCancel = jest.fn();
    render(
      <EvolutionPreviewModal
        plan={makePlan()}
        fieldNames={{ f1: 'year' }}
        schemaName="Car"
        submitting={false}
        onConfirm={jest.fn()}
        onCancel={onCancel}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(onCancel).toHaveBeenCalled();
  });

  it('calls onConfirm when Confirmar is clicked', () => {
    const onConfirm = jest.fn();
    render(
      <EvolutionPreviewModal
        plan={makePlan()}
        fieldNames={{ f1: 'year' }}
        schemaName="Car"
        submitting={false}
        onConfirm={onConfirm}
        onCancel={jest.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }));
    expect(onConfirm).toHaveBeenCalled();
  });

  it('disables both buttons while submitting', () => {
    render(
      <EvolutionPreviewModal
        plan={makePlan()}
        fieldNames={{ f1: 'year' }}
        schemaName="Car"
        submitting
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeDisabled();
    expect(screen.getByRole('button', { name: /guardando/i })).toBeDisabled();
  });
});
