import { renderHook, waitFor, act } from '@testing-library/react';
import type { Schema } from '@cms/shared';
import type { UseCases } from '../providers/UseCasesProvider';
import { makeWrapper } from './test-helpers/renderWithProviders';
import { useCreateSchema } from './useCreateSchema';
import { schemaKeys } from './queryKeys';

function fakeUseCases(created: Schema): UseCases {
  return {
    listSchemas: {} as never,
    getSchema: {} as never,
    createSchema: { execute: jest.fn().mockResolvedValue(created) } as never,
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

describe('useCreateSchema', () => {
  it('calls createSchema.execute and invalidates the schemas list', async () => {
    const created: Schema = { id: 's1', name: 'Car', fields: [], createdAt: '', updatedAt: '' };
    const useCases = fakeUseCases(created);
    const { Wrapper, queryClient } = makeWrapper(useCases);
    jest.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useCreateSchema(), { wrapper: Wrapper });

    act(() => {
      result.current.mutate({ name: 'Car', fields: [] });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(useCases.createSchema.execute).toHaveBeenCalledWith({ name: 'Car', fields: [] });
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: schemaKeys.list() });
  });
});
