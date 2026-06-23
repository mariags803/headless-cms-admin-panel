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
import { createServer } from './server';

describe('EntryController', () => {
  let db: Database.Database;
  let app: ReturnType<typeof createServer>;

  beforeEach(() => {
    db = createDb(':memory:');
    const schemaRepo = new SqliteSchemaRepository(db);
    const entryRepo = new SqliteEntryRepository(db);
    app = createServer({
      schema: {
        createSchema: new CreateSchema(schemaRepo),
        listSchemas: new ListSchemas(schemaRepo),
        updateSchema: new UpdateSchema(schemaRepo),
        deleteSchema: new DeleteSchema(schemaRepo),
      },
      entry: {
        createEntry: new CreateEntry(entryRepo, schemaRepo),
        listEntries: new ListEntries(entryRepo),
        getEntry: new GetEntry(entryRepo),
        updateEntry: new UpdateEntry(entryRepo, schemaRepo),
        deleteEntry: new DeleteEntry(entryRepo),
      },
    });
  });

  afterEach(() => {
    db.close();
  });

  const carSchemaPayload = {
    name: 'Car',
    fields: [{ id: 'f-brand', name: 'brand', type: 'text', required: true }],
  };

  async function createSchema() {
    const res = await request(app).post('/schemas').send(carSchemaPayload);
    return res.body;
  }

  it('GET /entries without schema param returns 400', async () => {
    const res = await request(app).get('/entries');

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('VALIDATION_ERROR');
  });

  it('GET /entries with an unknown schema id returns []', async () => {
    const res = await request(app).get('/entries').query({ schema: 'does-not-exist' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('POST /entries creates an entry', async () => {
    const schema = await createSchema();

    const res = await request(app)
      .post('/entries')
      .send({ schemaId: schema.id, data: { 'f-brand': 'Toyota' } });

    expect(res.status).toBe(201);
    expect(res.body.id).toBeTruthy();
    expect(res.body.schemaId).toBe(schema.id);
    expect(res.body.data).toEqual({ 'f-brand': 'Toyota' });
  });

  it('POST /entries with a missing required field returns 400', async () => {
    const schema = await createSchema();

    const res = await request(app).post('/entries').send({ schemaId: schema.id, data: {} });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('VALIDATION_ERROR');
  });

  it('POST /entries with an unknown schemaId returns 404', async () => {
    const res = await request(app)
      .post('/entries')
      .send({ schemaId: 'does-not-exist', data: {} });

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('NOT_FOUND');
  });

  it('GET /entries?schema= returns entries for that schema', async () => {
    const schema = await createSchema();
    await request(app).post('/entries').send({ schemaId: schema.id, data: { 'f-brand': 'Toyota' } });

    const res = await request(app).get('/entries').query({ schema: schema.id });

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].data).toEqual({ 'f-brand': 'Toyota' });
  });

  it('GET /entries/:id returns the entry', async () => {
    const schema = await createSchema();
    const created = await request(app)
      .post('/entries')
      .send({ schemaId: schema.id, data: { 'f-brand': 'Toyota' } });

    const res = await request(app).get(`/entries/${created.body.id}`);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(created.body.id);
  });

  it('GET /entries/:id on an unknown id returns 404', async () => {
    const res = await request(app).get('/entries/does-not-exist');

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('NOT_FOUND');
  });

  it('PUT /entries/:id updates an existing entry', async () => {
    const schema = await createSchema();
    const created = await request(app)
      .post('/entries')
      .send({ schemaId: schema.id, data: { 'f-brand': 'Toyota' } });

    const res = await request(app)
      .put(`/entries/${created.body.id}`)
      .send({ data: { 'f-brand': 'Honda' } });

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(created.body.id);
    expect(res.body.data).toEqual({ 'f-brand': 'Honda' });
  });

  it('PUT /entries/:id on an unknown id returns 404', async () => {
    const res = await request(app).put('/entries/does-not-exist').send({ data: {} });

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('NOT_FOUND');
  });

  it('PUT /entries/:id with an invalid body returns 400', async () => {
    const schema = await createSchema();
    const created = await request(app)
      .post('/entries')
      .send({ schemaId: schema.id, data: { 'f-brand': 'Toyota' } });

    const res = await request(app).put(`/entries/${created.body.id}`).send({ data: {} });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('VALIDATION_ERROR');
  });

  it('DELETE /entries/:id removes an entry', async () => {
    const schema = await createSchema();
    const created = await request(app)
      .post('/entries')
      .send({ schemaId: schema.id, data: { 'f-brand': 'Toyota' } });

    const del = await request(app).delete(`/entries/${created.body.id}`);
    expect(del.status).toBe(204);

    const list = await request(app).get('/entries').query({ schema: schema.id });
    expect(list.body).toEqual([]);
  });

  it('DELETE /entries/:id on an unknown id returns 404', async () => {
    const res = await request(app).delete('/entries/does-not-exist');

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('NOT_FOUND');
  });
});
