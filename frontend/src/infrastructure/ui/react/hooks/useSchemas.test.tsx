import { renderHook, waitFor } from '@testing-library/react';
import type { Schema } from '@cms/shared';
import type { UseCases } from '../providers/UseCasesProvider';
import { makeWrapper } from './test-helpers/renderWithProviders';
import { useSchemas } from './useSchemas';

function fakeUseCases(schemas: Schema[]): UseCases {
  return {
    listSchemas: { execute: jest.fn().mockResolvedValue(schemas) } as never,
    getSchema: {} as never,
    createSchema: {} as never,
    updateSchema: {} as never,
    applyEvolution: {} as never,
    deleteSchema: {} as never,
    listEntries: {} as never,
    getEntry: {} as never,
    createEntry: {} as never,
    updateEntry: {} as never,
    deleteEntry: {} as never,
  };
}

describe('useSchemas', () => {
  it('loads schemas via listSchemas.execute', async () => {
    const schemas: Schema[] = [{ id: 's1', name: 'Car', fields: [], createdAt: '', updatedAt: '' }];
    const useCases = fakeUseCases(schemas);
    const { Wrapper } = makeWrapper(useCases);

    const { result } = renderHook(() => useSchemas(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(schemas);
    expect(useCases.listSchemas.execute).toHaveBeenCalledTimes(1);
  });
});
