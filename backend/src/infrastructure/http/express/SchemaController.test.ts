import request from 'supertest';
import type Database from 'better-sqlite3';
import { createDb } from '../../persistence/sqlite/db';
import { SqliteSchemaRepository } from '../../persistence/sqlite/SqliteSchemaRepository';
import { SqliteEntryRepository } from '../../persistence/sqlite/SqliteEntryRepository';
import { CreateSchema } from '../../../application/schema/CreateSchema';
import { ListSchemas } from '../../../application/schema/ListSchemas';
import { UpdateSchema } from '../../../application/schema/UpdateSchema';
import { DeleteSchema } from '../../../application/schema/DeleteSchema';
import { CreateEntry } from '../../../application/entry/CreateEntry';
import { ListEntries } from '../../../application/entry/ListEntries';
import { GetEntry } from '../../../application/entry/GetEntry';
import { UpdateEntry } from '../../../application/entry/UpdateEntry';
import { DeleteEntry } from '../../../application/entry/DeleteEntry';
import { ListContent } from '../../../application/content/ListContent';
import { GetContentEntry } from '../../../application/content/GetContentEntry';
import { SseEventPublisher } from '../../realtime/SseEventPublisher';
import { createServer } from './server';

describe('SchemaController', () => {
  let db: Database.Database;
  let app: ReturnType<typeof createServer>;

  beforeEach(() => {
    db = createDb(':memory:');
    const repo = new SqliteSchemaRepository(db);
    const entryRepo = new SqliteEntryRepository(db);
    app = createServer({
      schema: {
        createSchema: new CreateSchema(repo),
        listSchemas: new ListSchemas(repo),
        updateSchema: new UpdateSchema(repo),
        deleteSchema: new DeleteSchema(repo),
      },
      entry: {
        createEntry: new CreateEntry(entryRepo, repo),
        listEntries: new ListEntries(entryRepo),
        getEntry: new GetEntry(entryRepo),
        updateEntry: new UpdateEntry(entryRepo, repo),
        deleteEntry: new DeleteEntry(entryRepo),
      },
      content: {
        listContent: new ListContent(repo, entryRepo),
        getContentEntry: new GetContentEntry(repo, entryRepo),
      },
      events: {
        publisher: new SseEventPublisher(),
      },
    });
  });

  afterEach(() => {
    db.close();
  });

  const carPayload = {
    name: 'Car',
    fields: [{ id: 'f1', name: 'brand', type: 'text', required: true }],
  };

  it('POST /schemas creates a schema', async () => {
    const res = await request(app).post('/schemas').send(carPayload);

    expect(res.status).toBe(201);
    expect(res.body.id).toBeTruthy();
    expect(res.body.createdAt).toBeTruthy();
    expect(res.body.updatedAt).toBeTruthy();
    expect(res.body.name).toBe('Car');
  });

  it('POST /schemas with missing name returns 400', async () => {
    const res = await request(app).post('/schemas').send({ fields: [] });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('VALIDATION_ERROR');
  });

  it('GET /schemas returns [] when empty', async () => {
    const res = await request(app).get('/schemas');

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('GET /schemas includes a previously created schema', async () => {
    await request(app).post('/schemas').send(carPayload);

    const res = await request(app).get('/schemas');

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].name).toBe('Car');
  });

  it('PUT /schemas/:id updates an existing schema', async () => {
    const created = await request(app).post('/schemas').send(carPayload);

    const res = await request(app)
      .put(`/schemas/${created.body.id}`)
      .send({ name: 'Car (used)', fields: carPayload.fields });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Car (used)');
    expect(res.body.id).toBe(created.body.id);
    expect(res.body.updatedAt >= created.body.updatedAt).toBe(true);
  });

  it('PUT /schemas/:id on an unknown id returns 404', async () => {
    const res = await request(app).put('/schemas/does-not-exist').send({ name: 'X', fields: [] });

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('NOT_FOUND');
  });

  it('PUT /schemas/:id with an invalid body returns 400', async () => {
    const created = await request(app).post('/schemas').send(carPayload);

    const res = await request(app).put(`/schemas/${created.body.id}`).send({ name: '  ', fields: [] });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('VALIDATION_ERROR');
  });

  it('DELETE /schemas/:id removes a schema', async () => {
    const created = await request(app).post('/schemas').send(carPayload);

    const del = await request(app).delete(`/schemas/${created.body.id}`);
    expect(del.status).toBe(204);

    const list = await request(app).get('/schemas');
    expect(list.body).toEqual([]);
  });

  it('DELETE /schemas/:id on an unknown id returns 404', async () => {
    const res = await request(app).delete('/schemas/does-not-exist');

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('NOT_FOUND');
  });
});
