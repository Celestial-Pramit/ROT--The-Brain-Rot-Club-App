export type TestCase = {
  name: string;
  fn: () => void | Promise<void>;
};

const registeredTests: TestCase[] = [];

export function describe(_suiteName: string, fn: () => void): void {
  fn();
}

export function it(name: string, fn: () => void | Promise<void>): void {
  registeredTests.push({ name, fn });
}

export function getRegisteredTests(): TestCase[] {
  return registeredTests;
}

export const assert = {
  equal<T>(actual: T, expected: T, message?: string): void {
    if (actual !== expected) {
      throw new Error(
        message || `Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`
      );
    }
  },
  deepEqual<T>(actual: T, expected: T, message?: string): void {
    const a = JSON.stringify(actual);
    const b = JSON.stringify(expected);
    if (a !== b) {
      throw new Error(message || `Expected deepEqual ${b}, got ${a}`);
    }
  },
  ok(condition: unknown, message?: string): void {
    if (!condition) {
      throw new Error(message || `Expected truthy value, got ${String(condition)}`);
    }
  },
};
