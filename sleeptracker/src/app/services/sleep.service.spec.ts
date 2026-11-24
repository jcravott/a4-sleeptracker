import { SleepService } from './sleep.service';
import { OvernightSleepData } from '../data/overnight-sleep-data';
import { StanfordSleepinessData } from '../data/stanford-sleepiness-data';
import { overnightError, sleepinessError, localDateTime } from './sleep-validation';

describe('SleepService persistence and validation', () => {
  beforeEach(() => {
    localStorage.removeItem(SleepService.storageKey);
    localStorage.removeItem(SleepService.deleteConfirmationKey);
  });
  afterEach(() => {
    localStorage.removeItem(SleepService.storageKey);
    localStorage.removeItem(SleepService.deleteConfirmationKey);
  });

  it('defaults to confirmations and safely ignores malformed preferences', () => {
    expect(new SleepService().askBeforeDeleting).toBeTrue();
    localStorage.setItem(SleepService.deleteConfirmationKey, 'invalid');
    expect(new SleepService().askBeforeDeleting).toBeTrue();
  });

  it('keeps the previous confirmation preference if storage fails', () => {
    const service = new SleepService();
    spyOn(Storage.prototype, 'setItem').and.throwError('quota');
    expect(() => service.setAskBeforeDeleting(false)).toThrowError(/Could not save/);
    expect(service.askBeforeDeleting).toBeTrue();
  });

  it('restores both model types with dates, methods and stable IDs', () => {
    const service = new SleepService();
    const night = new OvernightSleepData(new Date(2025, 0, 1, 23, 30), new Date(2025, 0, 2, 7, 45));
    service.save(night);
    service.save(new StanfordSleepinessData(3, new Date(2025, 0, 2, 12)));
    service.save(new StanfordSleepinessData(6, new Date(2025, 0, 2, 15)));
    const restored = new SleepService();
    expect(restored.records.length).toBe(3);
    expect(restored.overnight[0] instanceof OvernightSleepData).toBeTrue();
    expect(restored.overnight[0].id).toBe(night.id);
    expect(restored.overnight[0].durationMinutes).toBe(495);
    expect(restored.sleepiness[0].summaryString()).toContain('3:');
    expect(restored.sleepiness[0].loggedAt instanceof Date).toBeTrue();
  });

  it('persists edits, deletion and restoring a deleted record', () => {
    const service = new SleepService();
    const entry = new StanfordSleepinessData(2, new Date(2025, 0, 2, 12));
    service.save(entry);
    const edited = new StanfordSleepinessData(5, entry.loggedAt);
    edited.id = entry.id;
    service.save(edited);
    expect(new SleepService().sleepiness[0].loggedValue).toBe(5);
    expect(service.records.length).toBe(1);
    service.delete(entry.id);
    expect(new SleepService().records.length).toBe(0);
    service.save(edited);
    expect(new SleepService().records.length).toBe(1);
  });

  it('keeps memory unchanged if writing storage fails', () => {
    const service = new SleepService();
    spyOn(Storage.prototype, 'setItem').and.throwError('quota');
    expect(() => service.save(new StanfordSleepinessData(2))).toThrowError(/Could not save/);
    expect(service.records.length).toBe(0);
  });

  it('preserves malformed stored data and prevents overwriting it', () => {
    localStorage.setItem(SleepService.storageKey, 'broken');
    const service = new SleepService();
    expect(service.storageError).toContain('preserved');
    expect(() => service.save(new StanfordSleepinessData(2))).toThrow();
    expect(localStorage.getItem(SleepService.storageKey)).toBe('broken');
  });

  it('calculates across midnight and validates duration limits', () => {
    const start = new Date(2025, 0, 1, 23, 30);
    const end = new Date(2025, 0, 2, 7, 45);
    expect(overnightError(start, end)).toBe('');
    expect(overnightError(end, start)).toContain('after bedtime');
    expect(overnightError(start, start)).toContain('after bedtime');
    expect(overnightError(start, new Date(start.getTime() + 25 * 3600000))).toContain('24 hours');
    expect(overnightError(start, new Date(start.getTime() + 30000))).toContain('1 minute');
    expect(overnightError(start, new Date(start.getTime() + 24 * 3600000))).toBe('');
    expect(overnightError(new Date('bad'), end)).toContain('Choose');
    const future = new Date(Date.now() + 86400000);
    expect(overnightError(start, future)).toContain('past');
  });

  it('validates sleepiness ratings and future or missing dates', () => {
    const past = new Date(2025, 0, 1);
    for (let value = 1; value <= 7; value++) expect(sleepinessError(value, past)).toBe('');
    for (const value of [0, 8, 2.5, NaN]) expect(sleepinessError(value, past)).toContain('rating');
    expect(sleepinessError(3, new Date('bad'))).toContain('date');
    expect(sleepinessError(3, new Date(Date.now() + 86400000))).toContain('past');
    expect(localDateTime(new Date(2025, 0, 2, 7, 5))).toBe('2025-01-02T07:05:00');
  });
});
