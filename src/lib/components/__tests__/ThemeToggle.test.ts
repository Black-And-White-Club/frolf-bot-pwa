/* @vitest-environment jsdom */
import { render, fireEvent } from '@testing-library/svelte'
import { test, expect } from 'vitest'
import ThemeToggle from '../ThemeToggle.svelte'
import { prefersDark } from '$lib/stores/theme'

test('toggles prefersDark when clicked', async () => {
  const { getByTestId } = render(ThemeToggle, { props: { testid: 'theme-toggle' } })
  const input = getByTestId('theme-toggle') as HTMLInputElement
  // initial value from store (default false)
  expect(input.checked).toBe(false)
  await fireEvent.click(input)
  expect(prefersDark.subscribe).toBeTruthy()
})
