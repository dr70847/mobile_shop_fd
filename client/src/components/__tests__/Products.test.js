import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthContext } from '../auth/AuthContext';
import Products from '../products';
import axios from 'axios';

// Mock axios
jest.mock('axios');

// Mock the AuthContext
const mockAuthContext = {
  user: null,
  login: jest.fn(),
  logout: jest.fn(),
};

// Test wrapper component
const TestWrapper = ({ children, user = null }) => (
  <BrowserRouter>
    <AuthContext.Provider value={{ ...mockAuthContext, user }}>
      {children}
    </AuthContext.Provider>
  </BrowserRouter>
);

describe('Products Component', () => {
  const mockProducts = [
    { id: 1, name: 'iPhone 15', price: 999, stock: 10 },
    { id: 2, name: 'Samsung S24', price: 899, stock: 5 },
    { id: 3, name: 'Google Pixel 8', price: 799, stock: 8 }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    axios.get.mockResolvedValue({
      data: { items: mockProducts }
    });
  });

  test('renders products page with title', async () => {
    render(
      <TestWrapper>
        <Products />
      </TestWrapper>
    );

    expect(screen.getByText('Find your next phone.')).toBeInTheDocument();
    expect(screen.getByText('Browse curated devices and pricing. Fast API, clean UI, and a smooth shopping feel.')).toBeInTheDocument();
  });

  test('displays loading state initially', () => {
    render(
      <TestWrapper>
        <Products />
      </TestWrapper>
    );

    expect(screen.getByText('Loading products…')).toBeInTheDocument();
  });

  test('displays products after successful fetch', async () => {
    render(
      <TestWrapper>
        <Products />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('iPhone 15')).toBeInTheDocument();
      expect(screen.getByText('Samsung S24')).toBeInTheDocument();
      expect(screen.getByText('Google Pixel 8')).toBeInTheDocument();
    });

    expect(screen.getByText('$999.00')).toBeInTheDocument();
    expect(screen.getByText('$899.00')).toBeInTheDocument();
    expect(screen.getByText('$799.00')).toBeInTheDocument();
  });

  test('displays error message when API fails', async () => {
    axios.get.mockRejectedValue(new Error('Network error'));

    render(
      <TestWrapper>
        <Products />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/Couldn't load products/)).toBeInTheDocument();
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });

  test('displays KPI information', async () => {
    render(
      <TestWrapper>
        <Products />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Products')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument(); // Number of products
      expect(screen.getByText('Average price')).toBeInTheDocument();
      expect(screen.getByText('$899.00')).toBeInTheDocument(); // Average price
      expect(screen.getByText('Delivery')).toBeInTheDocument();
      expect(screen.getByText('24–48h')).toBeInTheDocument();
    });
  });

  test('search functionality works correctly', async () => {
    render(
      <TestWrapper>
        <Products />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('iPhone 15')).toBeInTheDocument();
      expect(screen.getByText('Samsung S24')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Search phones…');
    fireEvent.change(searchInput, { target: { value: 'iPhone' } });

    expect(screen.getByText('iPhone 15')).toBeInTheDocument();
    expect(screen.queryByText('Samsung S24')).not.toBeInTheDocument();
  });

  test('clear search button resets search', async () => {
    render(
      <TestWrapper>
        <Products />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('iPhone 15')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Search phones…');
    fireEvent.change(searchInput, { target: { value: 'iPhone' } });

    const clearButton = screen.getByText('Clear search');
    fireEvent.click(clearButton);

    expect(searchInput.value).toBe('');
    expect(screen.getByText('Samsung S24')).toBeInTheDocument();
  });

  test('add to cart functionality works', async () => {
    render(
      <TestWrapper>
        <Products />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('iPhone 15')).toBeInTheDocument();
    });

    const addToCartButton = screen.getAllByText('Add to cart')[0];
    fireEvent.click(addToCartButton);

    expect(screen.getByText('Cart')).toBeInTheDocument();
    expect(screen.getByText('1 item(s)')).toBeInTheDocument();
    expect(screen.getByText('iPhone 15')).toBeInTheDocument();
    expect(screen.getByText('$999.00 each')).toBeInTheDocument();
  });

  test('cart quantity management works', async () => {
    render(
      <TestWrapper>
        <Products />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('iPhone 15')).toBeInTheDocument();
    });

    // Add product to cart
    const addToCartButton = screen.getAllByText('Add to cart')[0];
    fireEvent.click(addToCartButton);

    // Increase quantity
    const increaseButton = screen.getByText('+');
    fireEvent.click(increaseButton);

    expect(screen.getByText('2')).toBeInTheDocument(); // Quantity should be 2

    // Decrease quantity
    const decreaseButton = screen.getByText('-');
    fireEvent.click(decreaseButton);

    expect(screen.getByText('1')).toBeInTheDocument(); // Quantity should be back to 1
  });

  test('clear cart functionality works', async () => {
    render(
      <TestWrapper>
        <Products />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('iPhone 15')).toBeInTheDocument();
    });

    // Add product to cart
    const addToCartButton = screen.getAllByText('Add to cart')[0];
    fireEvent.click(addToCartButton);

    // Clear cart
    const clearCartButton = screen.getByText('Clear cart');
    fireEvent.click(clearCartButton);

    expect(screen.getByText('Empty')).toBeInTheDocument();
    expect(screen.getByText('Add products to your cart to checkout.')).toBeInTheDocument();
  });

  test('checkout requires login', async () => {
    render(
      <TestWrapper>
        <Products />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('iPhone 15')).toBeInTheDocument();
    });

    // Add product to cart
    const addToCartButton = screen.getAllByText('Add to cart')[0];
    fireEvent.click(addToCartButton);

    expect(screen.getByText('Please')).toBeInTheDocument();
    expect(screen.getByText('login')).toBeInTheDocument();
    expect(screen.getByText('to checkout.')).toBeInTheDocument();
  });

  test('checkout works for logged in user', async () => {
    const mockUser = { id: 1, name: 'John Doe', email: 'john@example.com' };
    
    axios.post.mockResolvedValue({
      data: { orderId: 123 }
    });

    render(
      <TestWrapper user={mockUser}>
        <Products />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('iPhone 15')).toBeInTheDocument();
    });

    // Add product to cart
    const addToCartButton = screen.getAllByText('Add to cart')[0];
    fireEvent.click(addToCartButton);

    // Checkout
    const checkoutButton = screen.getByText('Checkout');
    fireEvent.click(checkoutButton);

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith('/orders/checkout', {
        items: [{ product_id: 1, quantity: 1 }]
      });
      expect(screen.getByText('Order #123 created!')).toBeInTheDocument();
    });
  });

  test('checkout error handling', async () => {
    const mockUser = { id: 1, name: 'John Doe', email: 'john@example.com' };
    
    axios.post.mockRejectedValue({
      response: { data: { message: 'Payment failed' } }
    });

    render(
      <TestWrapper user={mockUser}>
        <Products />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('iPhone 15')).toBeInTheDocument();
    });

    // Add product to cart
    const addToCartButton = screen.getAllByText('Add to cart')[0];
    fireEvent.click(addToCartButton);

    // Checkout
    const checkoutButton = screen.getByText('Checkout');
    fireEvent.click(checkoutButton);

    await waitFor(() => {
      expect(screen.getByText('Payment failed')).toBeInTheDocument();
    });
  });

  test('displays no results message for empty search', async () => {
    render(
      <TestWrapper>
        <Products />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('iPhone 15')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Search phones…');
    fireEvent.change(searchInput, { target: { value: 'NonExistentProduct' } });

    expect(screen.getByText('No products match your search.')).toBeInTheDocument();
  });
});
