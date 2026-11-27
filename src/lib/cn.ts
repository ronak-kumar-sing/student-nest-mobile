import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

/**
 * tailwind-merge only knows Tailwind's built-in scale. Without this, it reads a
 * custom size such as `text-h3` as a colour and drops the real colour class
 * (`cn('text-primary', 'text-h3')` lost `text-primary`). Keep these in sync with
 * `theme.extend.fontSize` / `fontFamily` in tailwind.config.js.
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [{ text: ['display', 'h1', 'h2', 'h3', 'body'] }],
      'font-family': [
        { font: ['heading', 'heading-semibold', 'body', 'body-medium', 'body-semibold'] },
      ],
    },
  },
});

/**
 * Merge Tailwind CSS classes with conflict resolution.
 * Combines `clsx` for conditional classes with `tailwind-merge`
 * to intelligently resolve conflicting utility classes.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
