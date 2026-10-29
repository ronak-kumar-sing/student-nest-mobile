import { formatINR, paiseToRupees, rupeesToPaise } from '../src/lib/money';

describe('Money utilities (paise conventions)', () => {
  it('formats integer paise correctly into INR currency display', () => {
    // 850000 paise = ₹8,500
    const formatted = formatINR(850000);
    expect(formatted).toMatch(/₹\s*8,500/);
  });

  it('formats zero paise', () => {
    const formatted = formatINR(0);
    expect(formatted).toMatch(/₹\s*0/);
  });

  it('converts paise to rupees', () => {
    expect(paiseToRupees(150000)).toBe(1500);
  });

  it('converts rupees to paise as integer', () => {
    expect(rupeesToPaise(1500)).toBe(150000);
    expect(rupeesToPaise(4999.5)).toBe(499950);
  });
});
