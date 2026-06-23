import type { Schema } from '@cms/shared';
import { HttpSchemaRepository } from './HttpSchemaRepository';

function makeSchema(overrides: Partial<Schema> = {}): Schema {
  return {
    id: 's1',
    name: 'Car',
    fields: [],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function jsonResponse(body: unknown, status = 200) {
  return { status, json: async () => body } as Response;
}

describe('HttpSchemaRepository', () => {
  let fetchMock: jest.Mock;

  beforeEach(() => {
    fetchMock = jest.fn();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  it('findAll GETs /schemas', async () => {
    const schemas = [makeSchema()];
    fetchMock.mockResolvedValue(jsonResponse(schemas));

    const result = await new HttpSchemaRepository('http://api').findAll();

    expect(fetchMock).toHaveBeenCalledWith('http://api/schemas');
    expect(result).toEqual(schemas);
  });

  it('findById filters the list client-side (no GET /schemas/:id route)', async () => {
    fetchMock.mockResolvedValue(jsonResponse([makeSchema({ id: 's1' }), makeSchema({ id: 's2' })]));

    const result = await new HttpSchemaRepository('http://api').findById('s2');

    expect(result).toEqual(makeSchema({ id: 's2' }));
  });

  it('findById returns null when no schema matches', async () => {
    fetchMock.mockResolvedValue(jsonResponse([makeSchema({ id: 's1' })]));

    const result = await new HttpSchemaRepository('http://api').findById('missing');

    expect(result).toBeNull();
  });

  it('create POSTs to /schemas with the input body', async () => {
    const created = makeSchema();
    fetchMock.mockResolvedValue(jsonResponse(created, 201));

    const result = await new HttpSchemaRepository('http://api').create({ name: 'Car', fields: [] });

    expect(fetchMock).toHaveBeenCalledWith('http://api/schemas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Car', fields: [] }),
    });
    expect(result).toEqual(created);
  });

  it('update PUTs to /schemas/:id with the input body', async () => {
    const updated = makeSchema({ name: 'Vehicle' });
    fetchMock.mockResolvedValue(jsonResponse(updated));

    const result = await new HttpSchemaRepository('http://api').update('s1', { name: 'Vehicle', fields: [] });

    expect(fetchMock).toHaveBeenCalledWith('http://api/schemas/s1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Vehicle', fields: [] }),
    });
    expect(result).toEqual(updated);
  });

  it('delete DELETEs /schemas/:id and does not parse a body', async () => {
    fetchMock.mockResolvedValue({ status: 204 } as Response);

    await new HttpSchemaRepository('http://api').delete('s1');

    expect(fetchMock).toHaveBeenCalledWith('http://api/schemas/s1', { method: 'DELETE' });
  });
});
