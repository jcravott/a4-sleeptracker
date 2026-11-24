import { OvernightSleepData } from './overnight-sleep-data';

describe('OvernightSleepData', () => {
  it('describes sleep crossing midnight', () => {
    const night = new OvernightSleepData(new Date(2025, 0, 1, 23, 30), new Date(2025, 0, 2, 7, 45));
    expect(night.durationMinutes).toBe(495);
    expect(night.summaryString()).toBe('8 hours, 15 minutes.');
    expect(night.dateString()).toContain('January 1');
  });
});
