export interface TransactionRunner {
  run<T>(fn: () => Promise<T>): Promise<T>;
}
