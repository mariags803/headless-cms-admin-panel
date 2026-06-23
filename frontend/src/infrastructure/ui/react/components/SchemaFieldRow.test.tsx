import { fireEvent, render, screen } from '@testing-library/react';
import type { Schema } from '@cms/shared';
import { SchemaFieldRow, type FieldDraft, toFieldPayload } from './SchemaFieldRow';

function makeField(overrides: Partial<FieldDraft> = {}): FieldDraft {
  return { key: 'k1', name: 'brand', type: 'text', required: false, ...overrides };
}

describe('SchemaFieldRow', () => {
  it('renders the field name, type and required values', () => {
    const field = makeField({ name: 'brand', type: 'text', required: true });
    render(
      <ul>
        <SchemaFieldRow
          field={field}
          index={0}
          total={1}
          schemas={[]}
          onChange={jest.fn()}
          onRemove={jest.fn()}
          onMoveUp={jest.fn()}
          onMoveDown={jest.fn()}
        />
      </ul>,
    );

    expect(screen.getByLabelText('Field 1 name')).toHaveValue('brand');
    expect(screen.getByLabelText('Field 1 type')).toHaveValue('text');
    expect(screen.getByRole('checkbox')).toBeChecked();
  });

  it('calls onChange with the new name', () => {
    const onChange = jest.fn();
    render(
      <ul>
        <SchemaFieldRow
          field={makeField()}
          index={0}
          total={1}
          schemas={[]}
          onChange={onChange}
          onRemove={jest.fn()}
          onMoveUp={jest.fn()}
          onMoveDown={jest.fn()}
        />
      </ul>,
    );

    fireEvent.change(screen.getByLabelText('Field 1 name'), { target: { value: 'model' } });

    expect(onChange).toHaveBeenCalledWith({ name: 'model' });
  });

  it('clears refSchemaId when the type changes away from reference', () => {
    const onChange = jest.fn();
    render(
      <ul>
        <SchemaFieldRow
          field={makeField({ type: 'reference', refSchemaId: 's1' })}
          index={0}
          total={1}
          schemas={[]}
          onChange={onChange}
          onRemove={jest.fn()}
          onMoveUp={jest.fn()}
          onMoveDown={jest.fn()}
        />
      </ul>,
    );

    fireEvent.change(screen.getByLabelText('Field 1 type'), { target: { value: 'number' } });

    expect(onChange).toHaveBeenCalledWith({ type: 'number', refSchemaId: undefined });
  });

  it('only shows the reference target select for type "reference", populated from schemas', () => {
    const schemas: Schema[] = [{ id: 's1', name: 'Car', fields: [], createdAt: '', updatedAt: '' }];
    const { rerender } = render(
      <ul>
        <SchemaFieldRow
          field={makeField({ type: 'text' })}
          index={0}
          total={1}
          schemas={schemas}
          onChange={jest.fn()}
          onRemove={jest.fn()}
          onMoveUp={jest.fn()}
          onMoveDown={jest.fn()}
        />
      </ul>,
    );
    expect(screen.queryByLabelText('Field 1 reference target')).not.toBeInTheDocument();

    rerender(
      <ul>
        <SchemaFieldRow
          field={makeField({ type: 'reference', refSchemaId: 's1' })}
          index={0}
          total={1}
          schemas={schemas}
          onChange={jest.fn()}
          onRemove={jest.fn()}
          onMoveUp={jest.fn()}
          onMoveDown={jest.fn()}
        />
      </ul>,
    );
    expect(screen.getByLabelText('Field 1 reference target')).toHaveValue('s1');
    expect(screen.getByRole('option', { name: 'Car' })).toBeInTheDocument();
  });

  it('disables move-up at the first row and move-down at the last row', () => {
    render(
      <ul>
        <SchemaFieldRow
          field={makeField()}
          index={0}
          total={3}
          schemas={[]}
          onChange={jest.fn()}
          onRemove={jest.fn()}
          onMoveUp={jest.fn()}
          onMoveDown={jest.fn()}
        />
      </ul>,
    );
    expect(screen.getByLabelText('Move field up')).toBeDisabled();
    expect(screen.getByLabelText('Move field down')).not.toBeDisabled();
  });

  it('calls onMoveUp/onMoveDown/onRemove when clicked', () => {
    const onMoveUp = jest.fn();
    const onMoveDown = jest.fn();
    const onRemove = jest.fn();
    render(
      <ul>
        <SchemaFieldRow
          field={makeField()}
          index={1}
          total={3}
          schemas={[]}
          onChange={jest.fn()}
          onRemove={onRemove}
          onMoveUp={onMoveUp}
          onMoveDown={onMoveDown}
        />
      </ul>,
    );

    fireEvent.click(screen.getByLabelText('Move field up'));
    fireEvent.click(screen.getByLabelText('Move field down'));
    fireEvent.click(screen.getByLabelText('Remove field'));

    expect(onMoveUp).toHaveBeenCalled();
    expect(onMoveDown).toHaveBeenCalled();
    expect(onRemove).toHaveBeenCalled();
  });

  it('renders a nameError as an alert', () => {
    render(
      <ul>
        <SchemaFieldRow
          field={makeField()}
          index={0}
          total={1}
          schemas={[]}
          nameError="Name is required"
          onChange={jest.fn()}
          onRemove={jest.fn()}
          onMoveUp={jest.fn()}
          onMoveDown={jest.fn()}
        />
      </ul>,
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Name is required');
  });
});

describe('toFieldPayload', () => {
  it('omits id for a new field', () => {
    const draft: FieldDraft = { key: 'k1', name: ' brand ', type: 'text', required: true };
    expect(toFieldPayload(draft)).toEqual({ name: 'brand', type: 'text', required: true });
  });

  it('keeps id for an existing field', () => {
    const draft: FieldDraft = { key: 'f1', id: 'f1', name: 'brand', type: 'text', required: false };
    expect(toFieldPayload(draft)).toEqual({ id: 'f1', name: 'brand', type: 'text', required: false });
  });

  it('includes refSchemaId only for reference fields', () => {
    const draft: FieldDraft = {
      key: 'k1',
      name: 'owner',
      type: 'reference',
      required: false,
      refSchemaId: 's1',
    };
    expect(toFieldPayload(draft)).toEqual({
      name: 'owner',
      type: 'reference',
      required: false,
      refSchemaId: 's1',
    });
  });
});
