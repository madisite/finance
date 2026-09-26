import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Header from '../Header';
import { afterEach, describe, test, expect } from 'vitest';

describe('Header', () => {
  afterEach(() => {
    cleanup();
    localStorage.clear();
    sessionStorage.clear();
  });

  test('renders brand and navigation links', () => {
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );

    expect(screen.getByRole('link', { name: 'Finance' })).toBeTruthy();
    expect(screen.getByRole('banner')).toBeTruthy();
    expect(screen.getByRole('link', { name: /dashboard/i })).toBeTruthy();
    expect(screen.getByRole('link', { name: /docs/i })).toBeTruthy();
    expect(screen.getByRole('link', { name: /settings/i })).toBeTruthy();
    expect(screen.getByRole('link', { name: /sign in/i })).toBeTruthy();
  });

  test('shows profile actions instead of sign-in links for a logged-in user', () => {
    localStorage.setItem('finance_user', JSON.stringify({ name: 'Madi', email: 'demo@example.com', role: 'admin' }));

    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /open user profile menu/i }));
    expect(screen.queryByRole('link', { name: /sign in/i })).toBeNull();
    expect(screen.queryByRole('link', { name: /sign up/i })).toBeNull();
    expect(screen.getByRole('link', { name: /edit profile/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /connect wallet/i })).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: /sign out/i }));
    expect(screen.getByRole('link', { name: /sign in/i })).toBeTruthy();
    expect(localStorage.getItem('finance_user')).toBeNull();
  });
});
