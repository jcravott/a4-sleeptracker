import { HomePage } from './home.page';
import { SleepService } from '../services/sleep.service';
import { AlertController, ToastController } from '@ionic/angular';
import { OvernightSleepData } from '../data/overnight-sleep-data';
import { StanfordSleepinessData } from '../data/stanford-sleepiness-data';

describe('HomePage logging', () => {
  let page: HomePage;
  let present: jasmine.Spy;
  let alertCreate: jasmine.Spy;
  let toastCreate: jasmine.Spy;
  let dismissal: { role: string; data?: { values: string[] } };
  beforeEach(() => {
    localStorage.removeItem(SleepService.storageKey);
    localStorage.removeItem(SleepService.deleteConfirmationKey);
    present = jasmine.createSpy('present').and.resolveTo();
    dismissal = { role: 'cancel' };
    alertCreate = jasmine.createSpy('create').and.resolveTo({ present, onDidDismiss: async () => dismissal });
    toastCreate = jasmine.createSpy('create').and.resolveTo({ present });
    page = new HomePage(new SleepService(), { create: alertCreate } as unknown as AlertController,
      { create: toastCreate } as unknown as ToastController);
  });
  afterEach(() => {
    localStorage.removeItem(SleepService.storageKey);
    localStorage.removeItem(SleepService.deleteConfirmationKey);
  });

  it('rejects an unselected rating and retains the form on errors', async () => {
    page.section = 'sleepiness';
    await page.save();
    expect(page.error).toContain('rating');
    expect(page.sleepService.records.length).toBe(0);
  });

  it('saves, edits, and immediately reflects an overnight entry', async () => {
    page.bedtime = '2025-01-01T23:30:00';
    page.wakeTime = '2025-01-02T07:45:00';
    await page.save();
    expect(page.latest.durationMinutes).toBe(495);
    expect(present).toHaveBeenCalled();
    page.edit(page.latest);
    page.wakeTime = '2025-01-02T08:00:00';
    await page.save();
    expect(page.nights.length).toBe(1);
    expect(page.latest.durationMinutes).toBe(510);
    page.section = 'history';
    expect(page.history.length).toBe(1);
  });

  it('starts with an unchecked opt-out and does not change the preference when cancelled', async () => {
    const entry = new StanfordSleepinessData(3);
    page.sleepService.save(entry);
    dismissal = { role: 'cancel', data: { values: ['skip-confirmation'] } };
    await page.remove(entry);
    expect(alertCreate.calls.mostRecent().args[0].inputs[0].checked).toBeFalse();
    expect(page.sleepService.records.length).toBe(1);
    expect(new SleepService().askBeforeDeleting).toBeTrue();
    expect(toastCreate).not.toHaveBeenCalled();
  });

  it('persists the opt-out only after confirming deletion', async () => {
    const entry = new StanfordSleepinessData(3);
    page.sleepService.save(entry);
    dismissal = { role: 'destructive', data: { values: ['skip-confirmation'] } };
    await page.remove(entry);
    expect(page.sleepService.records.length).toBe(0);
    expect(new SleepService().askBeforeDeleting).toBeFalse();
    expect(toastCreate.calls.mostRecent().args[0].buttons[0].text).toBe('Undo');
  });

  it('keeps asking when deletion is confirmed without opting out', async () => {
    const entry = new StanfordSleepinessData(3);
    page.sleepService.save(entry);
    dismissal = { role: 'destructive', data: { values: [] } };
    await page.remove(entry);
    expect(page.sleepService.records.length).toBe(0);
    expect(new SleepService().askBeforeDeleting).toBeTrue();
  });

  it('deletes both record types immediately with Undo when confirmations are disabled', async () => {
    page.sleepService.setAskBeforeDeleting(false);
    const entries = [new StanfordSleepinessData(3),
      new OvernightSleepData(new Date(2025, 0, 1, 23), new Date(2025, 0, 2, 7))];
    for (const entry of entries) {
      page.sleepService.save(entry);
      await page.remove(entry);
      expect(page.sleepService.records.some(record => record.id === entry.id)).toBeFalse();
      toastCreate.calls.mostRecent().args[0].buttons[0].handler();
      expect(new SleepService().records.some(record => record.id === entry.id)).toBeTrue();
    }
    expect(alertCreate).not.toHaveBeenCalled();
  });

  it('re-enables confirmations from the History setting and persists the change', async () => {
    page.sleepService.setAskBeforeDeleting(false);
    const input = document.createElement('input');
    input.checked = true;
    page.updateDeleteConfirmation({ target: input } as unknown as Event);
    expect(new SleepService().askBeforeDeleting).toBeTrue();
    await page.remove(new StanfordSleepinessData(3));
    expect(alertCreate).toHaveBeenCalled();
  });
});
