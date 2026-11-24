import { Injectable } from '@angular/core';
import { OvernightSleepData } from '../data/overnight-sleep-data';
import { StanfordSleepinessData } from '../data/stanford-sleepiness-data';
import { overnightError, sleepinessError } from './sleep-validation';

export type SleepRecord = OvernightSleepData | StanfordSleepinessData;
interface StoredRecord {
  kind: 'sleep' | 'sleepiness';
  id: string;
  loggedAt: string;
  start?: string;
  end?: string;
  rating?: number;
}

@Injectable({ providedIn: 'root' })
export class SleepService {
  static readonly storageKey = 'nightshift.records.v1';
  static readonly deleteConfirmationKey = 'nightshift.askBeforeDeleting.v1';
  records: SleepRecord[] = [];
  storageError = '';
  private confirmDeletions = true;

  constructor() {
    this.reload();
    try {
      this.confirmDeletions = localStorage.getItem(SleepService.deleteConfirmationKey) !== 'false';
    } catch {
      this.confirmDeletions = true;
    }
  }

  get askBeforeDeleting(): boolean { return this.confirmDeletions; }

  setAskBeforeDeleting(enabled: boolean): void {
    try {
      localStorage.setItem(SleepService.deleteConfirmationKey, String(enabled));
    } catch {
      throw new Error('Could not save the delete confirmation setting. Please try again.');
    }
    this.confirmDeletions = enabled;
  }

  get overnight(): OvernightSleepData[] {
    return this.records.filter((record): record is OvernightSleepData => record instanceof OvernightSleepData)
      .sort((a, b) => b.sleepEnd.getTime() - a.sleepEnd.getTime());
  }

  get sleepiness(): StanfordSleepinessData[] {
    return this.records.filter((record): record is StanfordSleepinessData => record instanceof StanfordSleepinessData);
  }

  reload(): void {
    try {
      const raw = localStorage.getItem(SleepService.storageKey);
      const stored: unknown = raw === null ? [] : JSON.parse(raw);
      if (!Array.isArray(stored)) throw new Error('Invalid data');
      const ids = new Set<string>();
      const records = stored.map((item: StoredRecord) => {
        if (!item || typeof item.id !== 'string' || ids.has(item.id) ||
            !Number.isFinite(new Date(item.loggedAt).getTime())) throw new Error('Invalid record');
        ids.add(item.id);
        let record: SleepRecord;
        if (item.kind === 'sleep') {
          const start = new Date(item.start ?? '');
          const end = new Date(item.end ?? '');
          if (overnightError(start, end)) throw new Error('Invalid sleep');
          record = new OvernightSleepData(start, end);
        } else if (item.kind === 'sleepiness') {
          if (sleepinessError(item.rating ?? 0, new Date(item.loggedAt))) throw new Error('Invalid check-in');
          record = new StanfordSleepinessData(item.rating!, new Date(item.loggedAt));
        } else throw new Error('Invalid type');
        record.id = item.id;
        record.loggedAt = new Date(item.loggedAt);
        return record;
      });
      this.records = records;
      this.storageError = '';
    } catch {
      this.storageError = 'Your saved data could not be read. It has been preserved. Enable browser storage, then retry.';
    }
  }

  save(record: SleepRecord): void {
    const error = record instanceof OvernightSleepData
      ? overnightError(record.sleepStart, record.sleepEnd)
      : sleepinessError(record.loggedValue, record.loggedAt);
    if (error) throw new Error(error);
    this.persist([...this.records.filter(item => item.id !== record.id), record]);
  }

  logOvernightData(record: OvernightSleepData): void { this.save(record); }
  logSleepinessData(record: StanfordSleepinessData): void { this.save(record); }

  delete(id: string): void { this.persist(this.records.filter(record => record.id !== id)); }

  private persist(records: SleepRecord[]): void {
    if (this.storageError) throw new Error(this.storageError);
    const stored: StoredRecord[] = records.map(record => ({
      id: record.id,
      loggedAt: record.loggedAt.toISOString(),
      ...(record instanceof OvernightSleepData
        ? { kind: 'sleep' as const, start: record.sleepStart.toISOString(), end: record.sleepEnd.toISOString() }
        : { kind: 'sleepiness' as const, rating: record.loggedValue })
    }));
    try {
      localStorage.setItem(SleepService.storageKey, JSON.stringify(stored));
    } catch {
      throw new Error('Could not save. Browser storage may be full or disabled. Your entry is still here; please try again.');
    }
    this.records = records;
  }
}
