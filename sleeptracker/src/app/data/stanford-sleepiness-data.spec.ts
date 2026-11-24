import { StanfordSleepinessData } from './stanford-sleepiness-data';

describe('StanfordSleepinessData', () => {
  it('uses the chosen rating and check-in date', () => {
    const date = new Date(2025, 0, 2, 14);
    const entry = new StanfordSleepinessData(4, date);
    expect(entry.summaryString()).toContain('4: Somewhat foggy');
    expect(entry.loggedAt).toEqual(date);
  });
});
