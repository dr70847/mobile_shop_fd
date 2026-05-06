import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { AuthContext } from '../auth/AuthContext';
import Layout from '../Layout';
import { getUserRole } from '../../utils/roles';

// Mock the getUserRole utility
jest.mock('../../utils/roles', () => ({
  getUserRole: jest.fn(),
}));

// Test wrapper component
const TestWrapper = ({ children, user = null }) => (
  <BrowserRouter>
    <AuthContext.Provider value={{ user, logout: jest.fn() }}>
      {children}
    </AuthContext.Provider>
  </BrowserRouter>
);

describe('Layout Component', () => {
  const mockLogout = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders navigation links correctly', () => {
    render(
      <TestWrapper>
        <Layout />
      </TestWrapper>
    );

    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Products')).toBeInTheDocument();
    expect(screen.getByText('My orders')).toBeInTheDocument();
    expect(screen.getByText('Support')).toBeInTheDocument();
    expect(screen.getByText('MobileShop')).toBeInTheDocument();
  });

  test('shows login and signup links when user is not authenticated', () => {
    render(
      <TestWrapper>
        <Layout />
      </TestWrapper>
    );

    expect(screen.getByText('Login')).toBeInTheDocument();
    expect(screen.getByText('Sign up')).toBeInTheDocument();
    expect(screen.queryByText('Logout')).not.toBeInTheDocument();
  });

  test('shows user info and logout when user is authenticated', () => {
    const mockUser = { id: 1, name: 'John Doe', email: 'john@example.com' };
    
    render(
      <AuthContext.Provider value={{ user: mockUser, logout: mockLogout }}>
        <Layout />
      </AuthContext.Provider>
    );

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Logout')).toBeInTheDocument();
    expect(screen.queryByText('Login')).not.toBeInTheDocument();
    expect(screen.queryByText('Sign up')).not.toBeInTheDocument();
  });

  test('shows dashboard link for authenticated users', () => {
    const mockUser = { id: 1, name: 'John Doe', email: 'john@example.com' };
    
    render(
      <AuthContext.Provider value={{ user: mockUser, logout: mockLogout }}>
        <Layout />
      </AuthContext.Provider>
    );

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  test('shows manager link for manager role', () => {
    const mockUser = { id: 1, name: 'John Manager', email: 'manager@example.com' };
    getUserRole.mockReturnValue('manager');
    
    render(
      <AuthContext.Provider value={{ user: mockUser, logout: mockLogout }}>
        <Layout />
      </AuthContext.Provider>
    );

    expect(screen.getByText('Manager')).toBeInTheDocument();
  });

  test('shows admin link for admin role', () => {
    const mockUser = { id: 1, name: 'John Admin', email: 'admin@example.com' };
    getUserRole.mockReturnValue('admin');
    
    render(
      <AuthContext.Provider value={{ user: mockUser, logout: mockLogout }}>
        <Layout />
      </AuthContext.Provider>
    );

    expect(screen.getByText('Admin')).toBeInTheDocument();
    expect(screen.getByText('Manager')).toBeInTheDocument();
  });

  test('shows manager link for admin role (admin can access manager)', () => {
    const mockUser = { id: 1, name: 'John Admin', email: 'admin@example.com' };
    getUserRole.mockReturnValue('admin');
    
    render(
      <AuthContext.Provider value={{ user: mockUser, logout: mockLogout }}>
        <Layout />
      </AuthContext.Provider>
    );

    expect(screen.getByText('Manager')).toBeInTheDocument();
    expect(screen.getByText('Admin')).toBeInTheDocument();
  });

  test('does not show manager link for regular user', () => {
    const mockUser = { id: 1, name: 'John User', email: 'user@example.com' };
    getUserRole.mockReturnValue('user');
    
    render(
      <AuthContext.Provider value={{ user: mockUser, logout: mockLogout }}>
        <Layout />
      </AuthContext.Provider>
    );

    expect(screen.queryByText('Manager')).not.toBeInTheDocument();
    expect(screen.queryByText('Admin')).not.toBeInTheDocument();
  });

  test('calls logout function when logout button is clicked', () => {
    const mockUser = { id: 1, name: 'John Doe', email: 'john@example.com' };
    
    render(
      <AuthContext.Provider value={{ user: mockUser, logout: mockLogout }}>
        <Layout />
      </AuthContext.Provider>
    );

    const logoutButton = screen.getByText('Logout');
    fireEvent.click(logoutButton);

    expect(mockLogout).toHaveBeenCalledTimes(1);
  });

  test('displays user email as title when name is not available', () => {
    const mockUser = { id: 1, email: 'john@example.com' };
    
    render(
      <AuthContext.Provider value={{ user: mockUser, logout: mockLogout }}>
        <Layout />
      </AuthContext.Provider>
    );

    const userElement = screen.getByText('john@example.com');
    expect(userElement).toBeInTheDocument();
    expect(userElement).toHaveAttribute('title', 'john@example.com');
  });

  test('renders brand information correctly', () => {
    render(
      <TestWrapper>
        <Layout />
      </TestWrapper>
    );

    expect(screen.getByText('MobileShop')).toBeInTheDocument();
    expect(screen.getByText('Phones, accessories, and deals')).toBeInTheDocument();
  });

  test('renders footer with current year', () => {
    render(
      <TestWrapper>
        <Layout />
      </TestWrapper>
    );

    const currentYear = new Date().getFullYear();
    expect(screen.getByText(`© ${currentYear} MobileShop`)).toBeInTheDocument();
    expect(screen.getByText('Built with React + Express')).toBeInTheDocument();
  });

  test('navigation links have correct href attributes', () => {
    render(
      <TestWrapper>
        <Layout />
      </TestWrapper>
    );

    const homeLink = screen.getByText('Home');
    const productsLink = screen.getByText('Products');
    const ordersLink = screen.getByText('My orders');
    const supportLink = screen.getByText('Support');

    expect(homeLink.closest('a')).toHaveAttribute('href', '/');
    expect(productsLink.closest('a')).toHaveAttribute('href', '/#catalog');
    expect(ordersLink.closest('a')).toHaveAttribute('href', '/orders');
    expect(supportLink.closest('a')).toHaveAttribute('href', '/support');
  });

  test('auth links have correct href attributes when not logged in', () => {
    render(
      <TestWrapper>
        <Layout />
      </TestWrapper>
    );

    const loginLink = screen.getByText('Login');
    const signupLink = screen.getByText('Sign up');

    expect(loginLink.closest('a')).toHaveAttribute('href', '/login');
    expect(signupLink.closest('a')).toHaveAttribute('href', '/signup');
  });

  test('dashboard link has correct href when logged in', () => {
    const mockUser = { id: 1, name: 'John Doe', email: 'john@example.com' };
    
    render(
      <AuthContext.Provider value={{ user: mockUser, logout: mockLogout }}>
        <Layout />
      </AuthContext.Provider>
    );

    const dashboardLink = screen.getByText('Dashboard');
    expect(dashboardLink.closest('a')).toHaveAttribute('href', '/dashboard');
  });
});
