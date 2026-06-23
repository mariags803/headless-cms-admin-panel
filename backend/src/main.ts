import { createDb } from './infrastructure/persistence/sqlite/db';
import { SqliteSchemaRepository } from './infrastructure/persistence/sqlite/SqliteSchemaRepository';
import { SqliteEntryRepository } from './infrastructure/persistence/sqlite/SqliteEntryRepository';
import { CreateSchema } from './application/schema/CreateSchema';
import { ListSchemas } from './application/schema/ListSchemas';
import { UpdateSchema } from './application/schema/UpdateSchema';
import { DeleteSchema } from './application/schema/DeleteSchema';
import { CreateEntry } from './application/entry/CreateEntry';
import { ListEntries } from './application/entry/ListEntries';
import { GetEntry } from './application/entry/GetEntry';
import { UpdateEntry } from './application/entry/UpdateEntry';
import { DeleteEntry } from './application/entry/DeleteEntry';
import { ListContent } from './application/content/ListContent';
import { GetContentEntry } from './application/content/GetContentEntry';
import { SseEventPublisher } from './infrastructure/realtime/SseEventPublisher';
import { createServer } from './infrastructure/http/express/server';

const db = createDb(process.env.DB_FILE ?? 'cms.sqlite3');
const schemaRepo = new SqliteSchemaRepository(db);
const entryRepo = new SqliteEntryRepository(db);
const eventPublisher = new SseEventPublisher();

const app = createServer({
  schema: {
    createSchema: new CreateSchema(schemaRepo, eventPublisher),
    listSchemas: new ListSchemas(schemaRepo),
    updateSchema: new UpdateSchema(schemaRepo, eventPublisher),
    deleteSchema: new DeleteSchema(schemaRepo, eventPublisher),
  },
  entry: {
    createEntry: new CreateEntry(entryRepo, schemaRepo, eventPublisher),
    listEntries: new ListEntries(entryRepo),
    getEntry: new GetEntry(entryRepo),
    updateEntry: new UpdateEntry(entryRepo, schemaRepo, eventPublisher),
    deleteEntry: new DeleteEntry(entryRepo, eventPublisher),
  },
  content: {
    listContent: new ListContent(schemaRepo, entryRepo),
    getContentEntry: new GetContentEntry(schemaRepo, entryRepo),
  },
  events: {
    publisher: eventPublisher,
  },
});

const port = Number(process.env.PORT ?? 3001);
app.listen(port, () => console.log(`backend listening on :${port}`));
