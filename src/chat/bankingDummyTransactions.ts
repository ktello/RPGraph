import type { StorybookCharacter } from '../storybook/runtime';

export type DummyBankTransaction = {
  id: string;
  label: string;
  amount: number;
  rpDateTime: string;
};

// Everyday spending kinds with typical price points. A seeded pick keeps the
// amounts looking like real receipts (…9.99, …4.90) instead of pure noise.
const fillerKinds: ReadonlyArray<{ label: string; amounts: readonly number[] }> = [
  { label: 'Grocery store', amounts: [18.63, 24.87, 32.19, 41.52, 57.35] },
  { label: 'Restaurant', amounts: [12.5, 18.9, 24.0, 32.5, 45.0] },
  { label: 'Clothing store', amounts: [19.99, 29.99, 49.99, 59.95, 89.9] },
  { label: 'Online shopping', amounts: [9.99, 14.99, 24.99, 39.99, 54.99] },
  { label: 'Streaming subscription', amounts: [7.99, 9.99, 12.99, 15.99] },
  { label: 'Gas station', amounts: [20.0, 35.0, 42.3, 55.1] },
  { label: 'Pharmacy', amounts: [6.49, 11.99, 17.85, 23.4] },
  { label: 'Coffee shop', amounts: [3.9, 4.5, 5.2, 7.8] },
  { label: 'Cinema', amounts: [11.0, 14.5, 22.0, 28.0] },
  { label: 'Food delivery', amounts: [16.9, 21.4, 26.8, 33.2] },
];

const mobilePlanAmounts: readonly number[] = [14.99, 19.99, 24.99, 29.99, 34.99];

function characterSeed(characterId: string) {
  // FNV-1a so the same stable character id always yields the same dummy history.
  let hash = 0x811c9dc5;
  for (const char of characterId.trim().toLocaleLowerCase()) {
    hash ^= char.codePointAt(0) ?? 0;
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

function mulberry32(seed: number) {
  let state = seed || 1;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let mixed = Math.imul(state ^ (state >>> 15), 1 | state);
    mixed = (mixed + Math.imul(mixed ^ (mixed >>> 7), 61 | mixed)) ^ mixed;
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
  };
}

function seededShuffle<T>(values: T[], random: () => number) {
  for (let index = values.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [values[index], values[swapIndex]] = [values[swapIndex], values[index]];
  }
  return values;
}

function pad2(value: number) {
  return String(value).padStart(2, '0');
}

function rpDateTimeDaysBack(reference: Date, daysAgo: number, hour: number, minute: number) {
  const date = new Date(reference.getTime() - daysAgo * 24 * 60 * 60 * 1000);
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}` +
    `T${pad2(hour)}:${pad2(minute)}`;
}

// Builds the display-only opening history of the Banking app: the storybook's
// fixed expenses (with a generated mobile plan as fallback) plus 4-6 seeded
// everyday fillers, spread over the last four weeks before referenceDateTime.
// Purely cosmetic - these entries never change the balance.
export function dummyBankTransactions(
  character: StorybookCharacter,
  referenceDateTime: string,
): DummyBankTransaction[] {
  const random = mulberry32(characterSeed(character.id));
  const pick = <T,>(options: readonly T[]) => options[Math.floor(random() * options.length)];
  const fixedExpenses = character.banking.fixedExpenses.length
    ? character.banking.fixedExpenses
    : [{ label: 'Mobile plan', amount: pick(mobilePlanAmounts) }];
  const fillerCount = 4 + Math.floor(random() * 3);
  const fillers = seededShuffle([...fillerKinds], random)
    .slice(0, fillerCount)
    .map((kind) => ({ label: kind.label, amount: pick(kind.amounts) }));
  const entries = [...fixedExpenses, ...fillers];
  const parsedReference = new Date(referenceDateTime);
  const reference = Number.isNaN(parsedReference.getTime()) ? new Date() : parsedReference;
  const days = seededShuffle(
    Array.from({ length: 28 }, (_, index) => index + 1),
    random,
  ).slice(0, entries.length);
  return entries
    .map((entry, index) => ({
      id: `dummy-transaction-${index}`,
      label: entry.label,
      amount: entry.amount,
      rpDateTime: rpDateTimeDaysBack(
        reference,
        days[index] ?? 1,
        8 + Math.floor(random() * 13),
        Math.floor(random() * 60),
      ),
    }))
    .sort((left, right) => right.rpDateTime.localeCompare(left.rpDateTime));
}
