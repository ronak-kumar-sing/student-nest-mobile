import { cn } from '@/lib/cn';

describe('cn', () => {
  it('keeps the colour when a custom font size is also set', () => {
    expect(cn('font-heading text-primary', 'text-h3')).toBe('font-heading text-primary text-h3');
  });

  it('still resolves real conflicts', () => {
    expect(cn('text-h3', 'text-h2')).toBe('text-h2');
    expect(cn('text-primary', 'text-foreground')).toBe('text-foreground');
    expect(cn('font-heading', 'font-body')).toBe('font-body');
  });
});
