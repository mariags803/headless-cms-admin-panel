import { createDb } from './infrastructure/persistence/sqlite/db';
import { SqliteSchemaRepository } from './infrastructure/persistence/sqlite/SqliteSchemaRepository';
import { CreateSchema } from './application/schema/CreateSchema';
import { ListSchemas } from './application/schema/ListSchemas';
import { UpdateSchema } from './application/schema/UpdateSchema';
import { DeleteSchema } from './application/schema/DeleteSchema';
import { createServer } from './infrastructure/http/express/server';

const db = createDb(process.env.DB_FILE ?? 'cms.sqlite3');
const schemaRepo = new SqliteSchemaRepository(db);

const app = createServer({
  schema: {
    createSchema: new CreateSchema(schemaRepo),
    listSchemas: new ListSchemas(schemaRepo),
    updateSchema: new UpdateSchema(schemaRepo),
    deleteSchema: new DeleteSchema(schemaRepo),
  },
});

const port = Number(process.env.PORT ?? 3001);
app.listen(port, () => console.log(`backend listening on :${port}`));
