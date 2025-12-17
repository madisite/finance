import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Sidebar from '../Sidebar';
import { describe, test, expect } from 'vitest';

describe('Sidebar', () => {
  test('renders navigation and toggles on mobile', () => {
    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>
    );

    const toggle = screen.getByRole('button', { name: /toggle menu/i });
    expect(toggle).toBeTruthy();
    // default closed on mobile, aria-expanded attribute should exist
    expect(toggle.getAttribute('aria-expanded')).not.toBeNull();

    // toggle open
    fireEvent.click(toggle);
    // after click aria-expanded should be true
    expect(toggle.getAttribute('aria-expanded')).toBe('true');

    // links exist
    expect(screen.getByRole('link', { name: /overview/i })).toBeTruthy();
    expect(screen.getByRole('link', { name: /docs/i })).toBeTruthy();
    expect(screen.getByRole('link', { name: /settings/i })).toBeTruthy();
    expect(screen.getByRole('link', { name: /sign up/i })).toBeTruthy();
  });
});
