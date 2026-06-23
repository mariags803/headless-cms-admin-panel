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
import { createServer } from './server';

describe('ContentController', () => {
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
      content: {
        listContent: new ListContent(schemaRepo, entryRepo),
        getContentEntry: new GetContentEntry(schemaRepo, entryRepo),
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

  it('GET /api/content/:schema resolves field ids to names', async () => {
    const schema = await createSchema();
    await request(app).post('/entries').send({ schemaId: schema.id, data: { 'f-brand': 'Toyota' } });

    const res = await request(app).get(`/api/content/${schema.name}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].data).toEqual({ brand: 'Toyota' });
  });

  it('GET /api/content/:schema on an unknown schema name returns 404', async () => {
    const res = await request(app).get('/api/content/does-not-exist');

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('NOT_FOUND');
  });

  it('GET /api/content/:schema/:id resolves field ids to names', async () => {
    const schema = await createSchema();
    const created = await request(app)
      .post('/entries')
      .send({ schemaId: schema.id, data: { 'f-brand': 'Toyota' } });

    const res = await request(app).get(`/api/content/${schema.name}/${created.body.id}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({ brand: 'Toyota' });
  });

  it('GET /api/content/:schema/:id on an unknown entry id returns 404', async () => {
    const schema = await createSchema();

    const res = await request(app).get(`/api/content/${schema.name}/does-not-exist`);

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('NOT_FOUND');
  });

  it('GET /api/content/:schema/:id for an entry of another schema returns 404', async () => {
    const schema = await createSchema();
    const created = await request(app)
      .post('/entries')
      .send({ schemaId: schema.id, data: { 'f-brand': 'Toyota' } });
    const otherSchema = await request(app)
      .post('/schemas')
      .send({ name: 'Person', fields: [] });

    const res = await request(app).get(`/api/content/${otherSchema.body.name}/${created.body.id}`);

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('NOT_FOUND');
  });
});
