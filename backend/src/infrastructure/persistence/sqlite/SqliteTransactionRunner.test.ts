import { createDb } from './db';
import { SqliteTransactionRunner } from './SqliteTransactionRunner';
import { SqliteSchemaRepository } from './SqliteSchemaRepository';
import { SqliteEntryRepository } from './SqliteEntryRepository';

describe('SqliteTransactionRunner', () => {
  it('commits every write when the function resolves', async () => {
    const db = createDb(':memory:');
    const schemas = new SqliteSchemaRepository(db);
    const entries = new SqliteEntryRepository(db);
    const runner = new SqliteTransactionRunner(db);

    await runner.run(async () => {
      await schemas.save({ id: 's1', name: 'Car', fields: [], createdAt: 'now', updatedAt: 'now' });
      await entries.save({ id: 'e1', schemaId: 's1', data: {}, createdAt: 'now', updatedAt: 'now' });
    });

    expect(await schemas.findById('s1')).not.toBeNull();
    expect(await entries.findById('e1')).not.toBeNull();
    db.close();
  });

  it('rolls back every write when the function throws, leaving the db untouched', async () => {
    const db = createDb(':memory:');
    const schemas = new SqliteSchemaRepository(db);
    const entries = new SqliteEntryRepository(db);
    const runner = new SqliteTransactionRunner(db);

    await expect(
      runner.run(async () => {
        await schemas.save({ id: 's1', name: 'Car', fields: [], createdAt: 'now', updatedAt: 'now' });
        await entries.save({ id: 'e1', schemaId: 's1', data: {}, createdAt: 'now', updatedAt: 'now' });
        throw new Error('boom');
      }),
    ).rejects.toThrow('boom');

    expect(await schemas.findById('s1')).toBeNull();
    expect(await entries.findById('e1')).toBeNull();
    db.close();
  });
});
