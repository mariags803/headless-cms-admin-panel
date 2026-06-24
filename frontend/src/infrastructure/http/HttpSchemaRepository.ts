import type { Schema } from '@cms/shared';
import type {
  ApplyEvolutionInput,
  NewSchemaInput,
  SchemaRepository,
  SchemaUpdateInput,
} from '../../domain/schema/SchemaRepository';

const DEFAULT_BASE_URL = 'http://localhost:3001';

export class HttpSchemaRepository implements SchemaRepository {
  private readonly baseUrl: string;

  constructor(baseUrl: string = DEFAULT_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  async findAll(): Promise<Schema[]> {
    const res = await fetch(`${this.baseUrl}/schemas`);
    return res.json();
  }

  // No GET /schemas/:id endpoint exists — list is the only read route, so filter client-side.
  async findById(id: string): Promise<Schema | null> {
    const schemas = await this.findAll();
    return schemas.find((schema) => schema.id === id) ?? null;
  }

  async create(input: NewSchemaInput): Promise<Schema> {
    const res = await fetch(`${this.baseUrl}/schemas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    return res.json();
  }

  async update(id: string, input: SchemaUpdateInput): Promise<Schema> {
    const res = await fetch(`${this.baseUrl}/schemas/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    return res.json();
  }

  async applyEvolution(id: string, input: ApplyEvolutionInput): Promise<Schema> {
    const res = await fetch(`${this.baseUrl}/schemas/${id}/apply`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    return res.json();
  }

  async delete(id: string): Promise<void> {
    await fetch(`${this.baseUrl}/schemas/${id}`, { method: 'DELETE' });
  }
}
