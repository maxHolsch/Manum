import type { DetailedHTMLProps, HTMLAttributes } from 'react';

declare module 'react' {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      'wired-button': DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & {
        elevation?: number;
        disabled?: boolean;
      };
      'wired-toggle': DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & {
        checked?: boolean;
        disabled?: boolean;
      };
    }
  }
}
