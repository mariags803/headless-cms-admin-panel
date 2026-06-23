import { renderHook, waitFor } from '@testing-library/react';
import type { Entry } from '@cms/shared';
import type { UseCases } from '../providers/UseCasesProvider';
import { makeWrapper } from './test-helpers/renderWithProviders';
import { useEntries } from './useEntries';

function fakeUseCases(entries: Entry[]): UseCases {
  return {
    listSchemas: {} as never,
    getSchema: {} as never,
    createSchema: {} as never,
    updateSchema: {} as never,
    deleteSchema: {} as never,
    listEntries: { execute: jest.fn().mockResolvedValue(entries) } as never,
    getEntry: {} as never,
    createEntry: {} as never,
    updateEntry: {} as never,
    deleteEntry: {} as never,
  };
}

describe('useEntries', () => {
  it('loads entries for the given schema', async () => {
    const entries: Entry[] = [{ id: 'e1', schemaId: 's1', data: {}, createdAt: '', updatedAt: '' }];
    const useCases = fakeUseCases(entries);
    const { Wrapper } = makeWrapper(useCases);

    const { result } = renderHook(() => useEntries('s1'), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(entries);
    expect(useCases.listEntries.execute).toHaveBeenCalledWith('s1');
  });

  it('does not fetch when schemaId is undefined', () => {
    const useCases = fakeUseCases([]);
    const { Wrapper } = makeWrapper(useCases);

    renderHook(() => useEntries(undefined), { wrapper: Wrapper });

    expect(useCases.listEntries.execute).not.toHaveBeenCalled();
  });
});
