import { fireEvent, render, screen } from '@testing-library/react';
import type { Schema } from '@cms/shared';
import { ReferenceTargetPicker } from './ReferenceTargetPicker';

const schemas: Schema[] = [
  { id: 's1', name: 'Car', fields: [], createdAt: '', updatedAt: '' },
  { id: 's2', name: 'Person', fields: [], createdAt: '', updatedAt: '' },
];

describe('ReferenceTargetPicker', () => {
  it('lists every schema as an option', () => {
    render(<ReferenceTargetPicker index={0} value={undefined} schemas={schemas} onChange={jest.fn()} />);

    expect(screen.getByRole('option', { name: 'Car' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Person' })).toBeInTheDocument();
  });

  it('shows the selected value', () => {
    render(<ReferenceTargetPicker index={0} value="s2" schemas={schemas} onChange={jest.fn()} />);

    expect(screen.getByLabelText('Field 1 reference target')).toHaveValue('s2');
  });

  it('calls onChange with the chosen schema id', () => {
    const onChange = jest.fn();
    render(<ReferenceTargetPicker index={0} value={undefined} schemas={schemas} onChange={onChange} />);

    fireEvent.change(screen.getByLabelText('Field 1 reference target'), { target: { value: 's2' } });

    expect(onChange).toHaveBeenCalledWith('s2');
  });

  it('shows an empty state and no select when there are no other content types', () => {
    render(<ReferenceTargetPicker index={0} value={undefined} schemas={[]} onChange={jest.fn()} />);

    expect(screen.queryByLabelText('Field 1 reference target')).not.toBeInTheDocument();
    expect(screen.getByText('No hay otros tipos de contenido disponibles.')).toBeInTheDocument();
  });
});
