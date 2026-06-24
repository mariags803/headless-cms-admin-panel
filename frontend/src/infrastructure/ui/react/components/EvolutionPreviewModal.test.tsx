import { fireEvent, render, screen } from '@testing-library/react';
import type { Field } from '@cms/shared';
import type { EvolutionPlan } from '../../../../application/evolution/buildEvolutionPlan';
import { EvolutionPreviewModal } from './EvolutionPreviewModal';

const yearField: Field = { id: 'f1', name: 'year', type: 'number', required: false };

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
        candidateFields={{ f1: yearField }}
        schemaName="Car"
        submitting={false}
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
      />,
    );

    expect(screen.getByText('warning')).toHaveAttribute('data-risk', 'warning');
    expect(screen.getByText(/year.*text.*number/)).toBeInTheDocument();
  });

  it('does not render the affected section when there are no affected entries', () => {
    render(
      <EvolutionPreviewModal
        plan={makePlan()}
        fieldNames={{ f1: 'year' }}
        candidateFields={{ f1: yearField }}
        schemaName="Car"
        submitting={false}
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
      />,
    );

    expect(screen.queryByText(/Affected entries/)).not.toBeInTheDocument();
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
        candidateFields={{ f1: yearField }}
        schemaName="Car"
        submitting={false}
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
      />,
    );

    expect(screen.getByText(/Affected entries \(2\)/)).toBeInTheDocument();
    expect(screen.getByText(/will be converted to 2024/)).toBeInTheDocument();
    expect(screen.getByText(/cannot be converted/)).toBeInTheDocument();
  });

  it('disables Confirm until a non-coercible retype is fixed, then enables it once filled', () => {
    const plan = makePlan({
      affected: [{ entryId: 'e2', fieldId: 'f1', currentValue: 'vintage', coerced: { ok: false } }],
      highestRisk: 'destructive',
      hasBlockingChanges: true,
    });
    render(
      <EvolutionPreviewModal
        plan={plan}
        fieldNames={{ f1: 'year' }}
        candidateFields={{ f1: yearField }}
        schemaName="Car"
        submitting={false}
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
      />,
    );

    const confirmButton = screen.getByRole('button', { name: 'Confirm' });
    expect(confirmButton).toBeDisabled();

    fireEvent.change(screen.getByLabelText('year'), { target: { value: '1999' } });

    expect(confirmButton).toBeEnabled();
  });

  it('"Apply the suggested conversion to all" fills every coercible row, and onConfirm groups values by entry', () => {
    const onConfirm = jest.fn();
    const plan = makePlan({
      affected: [
        { entryId: 'e1', fieldId: 'f1', currentValue: '2024', coerced: { ok: true, value: 2024 } },
        { entryId: 'e3', fieldId: 'f1', currentValue: '1998', coerced: { ok: true, value: 1998 } },
      ],
    });
    render(
      <EvolutionPreviewModal
        plan={plan}
        fieldNames={{ f1: 'year' }}
        candidateFields={{ f1: yearField }}
        schemaName="Car"
        submitting={false}
        onConfirm={onConfirm}
        onCancel={jest.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Apply the suggested conversion to all' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));

    expect(onConfirm).toHaveBeenCalledWith({
      e1: { f1: 2024 },
      e3: { f1: 1998 },
    });
  });

  it('calls onCancel when Cancel is clicked', () => {
    const onCancel = jest.fn();
    render(
      <EvolutionPreviewModal
        plan={makePlan()}
        fieldNames={{ f1: 'year' }}
        candidateFields={{ f1: yearField }}
        schemaName="Car"
        submitting={false}
        onConfirm={jest.fn()}
        onCancel={onCancel}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalled();
  });

  it('calls onConfirm when Confirm is clicked', () => {
    const onConfirm = jest.fn();
    render(
      <EvolutionPreviewModal
        plan={makePlan()}
        fieldNames={{ f1: 'year' }}
        candidateFields={{ f1: yearField }}
        schemaName="Car"
        submitting={false}
        onConfirm={onConfirm}
        onCancel={jest.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));
    expect(onConfirm).toHaveBeenCalled();
  });

  it('disables both buttons while submitting', () => {
    render(
      <EvolutionPreviewModal
        plan={makePlan()}
        fieldNames={{ f1: 'year' }}
        candidateFields={{ f1: yearField }}
        schemaName="Car"
        submitting
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
    expect(screen.getByRole('button', { name: /saving/i })).toBeDisabled();
  });
});
