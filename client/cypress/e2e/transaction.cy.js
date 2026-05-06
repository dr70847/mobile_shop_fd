describe('Transaction Flow', () => {
  const testUser = {
    name: 'Transaction Test User',
    email: 'transaction.test@example.com',
    password: 'password123'
  };

  const testProducts = [
    { name: 'iPhone 15', price: 999 },
    { name: 'Samsung S24', price: 899 }
  ];

  beforeEach(() => {
    // Register and login user
    cy.apiRequest('POST', '/auth/register', testUser);
    cy.apiLogin(testUser.email, testUser.password);
  });

  it('should complete full purchase workflow', () => {
    cy.visit('/');
    
    // Wait for products to load
    cy.contains('iPhone 15').should('be.visible');
    cy.contains('Samsung S24').should('be.visible');
    
    // Add products to cart
    cy.addToCart('iPhone 15');
    cy.verifyCartItems(1);
    
    cy.addToCart('Samsung S24');
    cy.verifyCartItems(2);
    
    // Verify cart contents
    cy.contains('Cart').parent().within(() => {
      cy.contains('iPhone 15').should('be.visible');
      cy.contains('Samsung S24').should('be.visible');
      cy.contains('$999.00').should('be.visible');
      cy.contains('$899.00').should('be.visible');
    });
    
    // Update quantities
    cy.contains('iPhone 15').parents('.ms-cartRow').within(() => {
      cy.get('button').contains('+').click();
      cy.get('.ms-cartRow__qty').should('contain', '2');
    });
    
    // Verify updated total
    cy.contains('Total').parent().should('contain', '$2,897.00'); // 2*999 + 1*899
    
    // Checkout
    cy.checkout();
    
    // Verify order success
    cy.verifyOrderSuccess();
    
    // Verify cart is empty
    cy.contains('Cart').parent().should('contain', 'Empty');
    cy.contains('Add products to your cart to checkout.').should('be.visible');
  });

  it('should handle single item purchase', () => {
    cy.visit('/');
    
    // Add single product to cart
    cy.addToCart('iPhone 15');
    cy.verifyCartItems(1);
    
    // Checkout immediately
    cy.checkout();
    
    // Verify order success
    cy.verifyOrderSuccess();
  });

  it('should prevent checkout with empty cart', () => {
    cy.visit('/');
    
    // Try to checkout without items
    cy.contains('Checkout').should('be.disabled');
  });

  it('should remove items from cart', () => {
    cy.visit('/');
    
    // Add products to cart
    cy.addToCart('iPhone 15');
    cy.addToCart('Samsung S24');
    cy.verifyCartItems(2);
    
    // Remove one item by setting quantity to 0
    cy.contains('iPhone 15').parents('.ms-cartRow').within(() => {
      cy.get('button').contains('-').click();
      cy.get('button').contains('-').click();
    });
    
    // Verify cart updated
    cy.verifyCartItems(1);
    cy.contains('iPhone 15').should('not.exist');
    cy.contains('Samsung S24').should('be.visible');
  });

  it('should clear cart completely', () => {
    cy.visit('/');
    
    // Add products to cart
    cy.addToCart('iPhone 15');
    cy.addToCart('Samsung S24');
    cy.verifyCartItems(2);
    
    // Clear cart
    cy.contains('Clear cart').click();
    
    // Verify cart is empty
    cy.contains('Cart').parent().should('contain', 'Empty');
    cy.contains('Add products to your cart to checkout.').should('be.visible');
  });

  it('should handle checkout API errors gracefully', () => {
    // Mock API error
    cy.intercept('POST', '/api/v1/orders/checkout', {
      statusCode: 500,
      body: { message: 'Payment processing failed' }
    }).as('checkoutError');
    
    cy.visit('/');
    
    // Add product and try to checkout
    cy.addToCart('iPhone 15');
    cy.checkout();
    
    // Wait for API call
    cy.wait('@checkoutError');
    
    // Verify error message
    cy.contains('Payment processing failed').should('be.visible');
    
    // Verify cart still has items
    cy.verifyCartItems(1);
  });

  it('should persist cart during session', () => {
    cy.visit('/');
    
    // Add product to cart
    cy.addToCart('iPhone 15');
    cy.verifyCartItems(1);
    
    // Navigate to another page
    cy.visit('/orders');
    
    // Return to home page
    cy.visit('/');
    
    // Verify cart still has items
    cy.verifyCartItems(1);
    cy.contains('iPhone 15').should('be.visible');
  });

  it('should calculate totals correctly', () => {
    cy.visit('/');
    
    // Add multiple quantities of same product
    cy.addToCart('iPhone 15');
    cy.addToCart('iPhone 15');
    cy.addToCart('Samsung S24');
    
    // Verify cart calculation
    cy.contains('Total').parent().should('contain', '$2,897.00'); // 2*999 + 1*899
    
    // Update quantities
    cy.contains('iPhone 15').parents('.ms-cartRow').within(() => {
      cy.get('button').contains('+').click();
      cy.get('.ms-cartRow__qty').should('contain', '3');
    });
    
    // Verify updated total
    cy.contains('Total').parent().should('contain', '$3,896.00'); // 3*999 + 1*899
  });
});
