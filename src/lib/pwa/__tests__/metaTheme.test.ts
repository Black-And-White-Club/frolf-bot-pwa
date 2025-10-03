// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { updateMetaThemeColor } from '../metaTheme';

describe('updateMetaThemeColor', () => {
  it('updates meta tag when present', () => {
    document.body.innerHTML = '<meta name="theme-color" content="#000">';
    document.documentElement.style.setProperty('--guild-primary', '#123456');
    const res = updateMetaThemeColor();
    expect(res).toBe('#123456');
    const meta = document.querySelector('meta[name="theme-color"]');
    expect(meta?.getAttribute('content')).toBe('#123456');
  });

  it('returns null when meta missing', () => {
    document.body.innerHTML = '';
    const res = updateMetaThemeColor();
    expect(res).toBeNull();
  });
});
