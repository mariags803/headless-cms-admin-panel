import type { Entry } from '@cms/shared';
import { HttpEntryRepository } from './HttpEntryRepository';

function makeEntry(overrides: Partial<Entry> = {}): Entry {
  return {
    id: 'e1',
    schemaId: 's1',
    data: {},
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function jsonResponse(body: unknown, status = 200) {
  return { status, json: async () => body } as Response;
}

describe('HttpEntryRepository', () => {
  let fetchMock: jest.Mock;

  beforeEach(() => {
    fetchMock = jest.fn();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  it('findAllBySchema GETs /entries?schema=', async () => {
    const entries = [makeEntry()];
    fetchMock.mockResolvedValue(jsonResponse(entries));

    const result = await new HttpEntryRepository('http://api').findAllBySchema('s1');

    expect(fetchMock).toHaveBeenCalledWith('http://api/entries?schema=s1');
    expect(result).toEqual(entries);
  });

  it('findById GETs /entries/:id', async () => {
    const entry = makeEntry();
    fetchMock.mockResolvedValue(jsonResponse(entry));

    const result = await new HttpEntryRepository('http://api').findById('e1');

    expect(fetchMock).toHaveBeenCalledWith('http://api/entries/e1');
    expect(result).toEqual(entry);
  });

  it('findById returns null on a 404', async () => {
    fetchMock.mockResolvedValue(jsonResponse(null, 404));

    const result = await new HttpEntryRepository('http://api').findById('missing');

    expect(result).toBeNull();
  });

  it('create POSTs to /entries with the input body', async () => {
    const created = makeEntry();
    fetchMock.mockResolvedValue(jsonResponse(created, 201));

    const result = await new HttpEntryRepository('http://api').create({ schemaId: 's1', data: { f1: 'x' } });

    expect(fetchMock).toHaveBeenCalledWith('http://api/entries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ schemaId: 's1', data: { f1: 'x' } }),
    });
    expect(result).toEqual(created);
  });

  it('update PUTs to /entries/:id with the input body', async () => {
    const updated = makeEntry({ data: { f1: 'y' } });
    fetchMock.mockResolvedValue(jsonResponse(updated));

    const result = await new HttpEntryRepository('http://api').update('e1', { data: { f1: 'y' } });

    expect(fetchMock).toHaveBeenCalledWith('http://api/entries/e1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: { f1: 'y' } }),
    });
    expect(result).toEqual(updated);
  });

  it('delete DELETEs /entries/:id and does not parse a body', async () => {
    fetchMock.mockResolvedValue({ status: 204 } as Response);

    await new HttpEntryRepository('http://api').delete('e1');

    expect(fetchMock).toHaveBeenCalledWith('http://api/entries/e1', { method: 'DELETE' });
  });
});
