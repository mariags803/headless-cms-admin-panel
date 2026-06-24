import { renderHook, waitFor, act } from '@testing-library/react';
import type { UseCases } from '../providers/UseCasesProvider';
import { makeWrapper } from './test-helpers/renderWithProviders';
import { useDeleteEntry } from './useDeleteEntry';
import { entryKeys } from './queryKeys';

function fakeUseCases(): UseCases {
  return {
    listSchemas: {} as never,
    getSchema: {} as never,
    createSchema: {} as never,
    updateSchema: {} as never,
    applyEvolution: {} as never,
    deleteSchema: {} as never,
    listEntries: {} as never,
    getEntry: {} as never,
    createEntry: {} as never,
    updateEntry: {} as never,
    deleteEntry: { execute: jest.fn().mockResolvedValue(undefined) } as never,
  };
}

describe('useDeleteEntry', () => {
  it('calls deleteEntry.execute and invalidates the entries list and detail', async () => {
    const useCases = fakeUseCases();
    const { Wrapper, queryClient } = makeWrapper(useCases);
    jest.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useDeleteEntry(), { wrapper: Wrapper });

    act(() => {
      result.current.mutate({ id: 'e1', schemaId: 's1' });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(useCases.deleteEntry.execute).toHaveBeenCalledWith('e1');
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: entryKeys.list('s1') });
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: entryKeys.detail('s1', 'e1') });
  });
});
