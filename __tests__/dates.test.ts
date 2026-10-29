import { formatIST, toISOString } from '../src/lib/dates';

describe('Date utilities (IST conventions)', () => {
  it('formats UTC ISO timestamp into IST correctly', () => {
    // 2026-10-29T12:00:00.000Z is 5:30 PM IST (17:30)
    const iso = '2026-10-29T12:00:00.000Z';
    const formatted = formatIST(iso, 'yyyy-MM-dd HH:mm');
    expect(formatted).toBe('2026-10-29 17:30');
  });

  it('converts Date to ISO string', () => {
    const d = new Date('2026-10-29T12:00:00.000Z');
    expect(toISOString(d)).toBe('2026-10-29T12:00:00.000Z');
  });
});
