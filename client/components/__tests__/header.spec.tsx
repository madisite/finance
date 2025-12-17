import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Header from '../Header';
import { describe, test, expect } from 'vitest';

describe('Header', () => {
  test('renders brand and navigation links', () => {
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );

    expect(screen.getByText('Flare')).toBeTruthy();
    expect(screen.getByRole('banner')).toBeTruthy();
    expect(screen.getByRole('link', { name: /dashboard/i })).toBeTruthy();
    expect(screen.getByRole('link', { name: /docs/i })).toBeTruthy();
    expect(screen.getByRole('link', { name: /settings/i })).toBeTruthy();
    expect(screen.getByRole('link', { name: /sign in/i })).toBeTruthy();
  });
});
