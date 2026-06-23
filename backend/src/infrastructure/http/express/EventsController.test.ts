import http from 'http';
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

describe('GET /events', () => {
  let db: Database.Database;
  let server: http.Server;
  let publisher: SseEventPublisher;
  let port: number;

  beforeEach((done) => {
    db = createDb(':memory:');
    const schemaRepo = new SqliteSchemaRepository(db);
    const entryRepo = new SqliteEntryRepository(db);
    publisher = new SseEventPublisher();
    const app = createServer({
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
      events: { publisher },
    });
    server = app.listen(0, () => {
      port = (server.address() as { port: number }).port;
      done();
    });
  });

  afterEach((done) => {
    db.close();
    server.close(done);
  });

  it('streams a published event over SSE', (done) => {
    const event = { type: 'schema.deleted' as const, schemaId: 's1' };
    let body = '';

    const req = http.get(`http://localhost:${port}/events`, (res) => {
      expect(res.headers['content-type']).toBe('text/event-stream');

      res.on('data', (chunk: Buffer) => {
        body += chunk.toString();
        if (body.includes('schema.deleted')) {
          expect(body).toContain(`data: ${JSON.stringify(event)}\n\n`);
          req.destroy();
          done();
        }
      });
    });

    setTimeout(() => publisher.publish(event), 20);
  });
});
