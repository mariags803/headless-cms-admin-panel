import {
  classifyRisk,
  diffSchemas,
  scanAffected,
  type AffectedEntry,
  type Entry,
  type RiskLevel,
  type Schema,
  type SchemaChange,
} from '@cms/shared';

export interface EvolutionChangeRisk {
  change: SchemaChange;
  risk: RiskLevel;
}

export interface EvolutionPlan {
  changes: EvolutionChangeRisk[];
  affected: AffectedEntry[];
  highestRisk: RiskLevel;
  hasBlockingChanges: boolean;
}

const RISK_ORDER: Record<RiskLevel, number> = { safe: 0, warning: 1, destructive: 2 };

export function buildEvolutionPlan(oldSchema: Schema, nextSchema: Schema, entries: Entry[]): EvolutionPlan {
  const rawChanges = diffSchemas(oldSchema, nextSchema);
  const changes = rawChanges.map((change) => ({ change, risk: classifyRisk(change) }));
  const affected = scanAffected(rawChanges, entries);
  const hasUncoercibleValue = affected.some((entry) => entry.coerced?.ok === false);
  const highestRisk = changes.reduce<RiskLevel>(
    (worst, { risk }) => (RISK_ORDER[risk] > RISK_ORDER[worst] ? risk : worst),
    hasUncoercibleValue ? 'destructive' : 'safe',
  );

  return { changes, affected, highestRisk, hasBlockingChanges: highestRisk === 'destructive' };
}
