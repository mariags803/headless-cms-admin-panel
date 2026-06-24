import { renderHook } from '@testing-library/react';
import { UseCasesProvider, useUseCases, type UseCases } from './UseCasesProvider';

function fakeUseCases(): UseCases {
  return {
    listSchemas: { execute: jest.fn() } as never,
    getSchema: { execute: jest.fn() } as never,
    createSchema: { execute: jest.fn() } as never,
    updateSchema: { execute: jest.fn() } as never,
    applyEvolution: {} as never,
    deleteSchema: { execute: jest.fn() } as never,
    listEntries: { execute: jest.fn() } as never,
    getEntry: { execute: jest.fn() } as never,
    createEntry: { execute: jest.fn() } as never,
    updateEntry: { execute: jest.fn() } as never,
    deleteEntry: { execute: jest.fn() } as never,
  };
}

describe('UseCasesProvider', () => {
  it('exposes the injected use cases via context', () => {
    const useCases = fakeUseCases();

    const { result } = renderHook(() => useUseCases(), {
      wrapper: ({ children }) => <UseCasesProvider useCases={useCases}>{children}</UseCasesProvider>,
    });

    expect(result.current).toBe(useCases);
  });

  it('throws when used without a UseCasesProvider', () => {
    expect(() => {
      renderHook(() => useUseCases());
    }).toThrow('useUseCases must be used within a UseCasesProvider');
  });
});
