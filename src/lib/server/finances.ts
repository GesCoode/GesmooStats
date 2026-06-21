import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createDefaultFinances, migrateFinances } from '$lib/finances/defaults';
import type { FinancesData } from '$lib/finances/types';

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'finances.json');

export async function loadFinances(): Promise<FinancesData> {
  try {
    const raw = await readFile(DATA_FILE, 'utf8');
    const data = migrateFinances(JSON.parse(raw) as Partial<FinancesData>);
    await saveFinances(data);
    return data;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      const defaults = createDefaultFinances();
      await saveFinances(defaults);
      return defaults;
    }
    throw error;
  }
}

export async function saveFinances(data: FinancesData): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
}
