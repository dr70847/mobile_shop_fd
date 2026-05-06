describe('Order Reporting', () => {
  const testUser = {
    name: 'Reporting Test User',
    email: 'reporting.test@example.com',
    password: 'password123'
  };

  beforeEach(() => {
    // Register and login user
    cy.apiRequest('POST', '/auth/register', testUser);
    cy.apiLogin(testUser.email, testUser.password);
  });

  it('should display order history', () => {
    // Create some orders first
    cy.visit('/');
    cy.addToCart('iPhone 15');
    cy.checkout();
    cy.verifyOrderSuccess();
    
    // Create another order
    cy.visit('/');
    cy.addToCart('Samsung S24');
    cy.checkout();
    cy.verifyOrderSuccess();
    
    // Navigate to orders page
    cy.contains('My orders').click();
    
    // Verify orders are displayed
    cy.url().should('include', '/orders');
    cy.contains('Order History').should('be.visible');
    
    // Should have at least 2 orders
    cy.get('[data-testid="order-item"]').should('have.length.gte', 2);
  });

  it('should display order details', () => {
    // Create an order first
    cy.visit('/');
    cy.addToCart('iPhone 15');
    cy.addToCart('Samsung S24');
    cy.checkout();
    cy.verifyOrderSuccess();
    
    // Navigate to orders page
    cy.contains('My orders').click();
    
    // Click on first order
    cy.get('[data-testid="order-item"]').first().click();
    
    // Verify order details
    cy.contains('Order Details').should('be.visible');
    cy.contains('iPhone 15').should('be.visible');
    cy.contains('Samsung S24').should('be.visible');
    cy.contains('$999.00').should('be.visible');
    cy.contains('$899.00').should('be.visible');
    cy.contains('Total').parent().should('contain', '$1,898.00');
  });

  it('should filter orders by status', () => {
    // Create orders with different statuses
    cy.visit('/');
    cy.addToCart('iPhone 15');
    cy.checkout();
    cy.verifyOrderSuccess();
    
    // Navigate to orders page
    cy.contains('My orders').click();
    
    // Test status filter
    cy.get('[data-testid="status-filter"]').should('be.visible');
    cy.get('[data-testid="status-filter"]').select('pending');
    
    // Verify filtered results
    cy.get('[data-testid="order-item"]').each(($el) => {
      cy.wrap($el).should('contain', 'pending');
    });
  });

  it('should search orders by date', () => {
    // Create an order first
    cy.visit('/');
    cy.addToCart('iPhone 15');
    cy.checkout();
    cy.verifyOrderSuccess();
    
    // Navigate to orders page
    cy.contains('My orders').click();
    
    // Test date filter
    cy.get('[data-testid="date-filter"]').should('be.visible');
    
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];
    
    cy.get('[data-testid="date-from"]').type(todayString);
    cy.get('[data-testid="date-to"]').type(todayString);
    cy.get('[data-testid="apply-date-filter"]').click();
    
    // Verify filtered results
    cy.get('[data-testid="order-item"]').should('have.length.gte', 1);
  });

  it('should export order data', () => {
    // Create an order first
    cy.visit('/');
    cy.addToCart('iPhone 15');
    cy.checkout();
    cy.verifyOrderSuccess();
    
    // Navigate to orders page
    cy.contains('My orders').click();
    
    // Test export functionality
    cy.get('[data-testid="export-button"]').should('be.visible');
    cy.get('[data-testid="export-button"]').click();
    
    // Verify export options
    cy.get('[data-testid="export-csv"]').should('be.visible');
    cy.get('[data-testid="export-pdf"]').should('be.visible');
    
    // Test CSV export
    cy.get('[data-testid="export-csv"]').click();
    
    // Verify download (this would need file download handling)
    cy.readFile('cypress/downloads/orders.csv').should('exist');
  });

  it('should display order statistics', () => {
    // Create multiple orders
    for (let i = 0; i < 3; i++) {
      cy.visit('/');
      cy.addToCart('iPhone 15');
      cy.checkout();
      cy.verifyOrderSuccess();
    }
    
    // Navigate to orders page
    cy.contains('My orders').click();
    
    // Verify statistics
    cy.get('[data-testid="order-stats"]').should('be.visible');
    cy.contains('Total Orders').should('be.visible');
    cy.contains('Total Spent').should('be.visible');
    cy.contains('Average Order Value').should('be.visible');
    
    // Verify numbers
    cy.get('[data-testid="total-orders"]').should('contain', '3');
    cy.get('[data-testid="total-spent"]').should('contain', '$2,997.00'); // 3 * 999
    cy.get('[data-testid="avg-order-value"]').should('contain', '$999.00');
  });

  it('should handle empty order history', () => {
    // Navigate to orders page without creating orders
    cy.contains('My orders').click();
    
    // Verify empty state
    cy.contains('No orders found').should('be.visible');
    cy.contains('Start shopping to see your orders here').should('be.visible');
  });

  it('should paginate large order lists', () => {
    // Create many orders (mock this for testing)
    for (let i = 0; i < 25; i++) {
      cy.visit('/');
      cy.addToCart('iPhone 15');
      cy.checkout();
      cy.verifyOrderSuccess();
    }
    
    // Navigate to orders page
    cy.contains('My orders').click();
    
    // Verify pagination
    cy.get('[data-testid="pagination"]').should('be.visible');
    cy.get('[data-testid="page-info"]').should('contain', 'Showing 1-10 of 25');
    
    // Test navigation
    cy.get('[data-testid="next-page"]').click();
    cy.get('[data-testid="page-info"]').should('contain', 'Showing 11-20 of 25');
    
    cy.get('[data-testid="next-page"]').click();
    cy.get('[data-testid="page-info"]').should('contain', 'Showing 21-25 of 25');
  });
});
