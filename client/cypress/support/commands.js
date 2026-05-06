// Custom commands for MobileShop e2e testing

// Login command
Cypress.Commands.add('login', (email, password) => {
  cy.visit('/login');
  cy.get('input[name="email"]').type(email);
  cy.get('input[name="password"]').type(password);
  cy.get('button[type="submit"]').click();
  cy.url().should('not.include', '/login');
});

// Register command
Cypress.Commands.add('register', (name, email, password) => {
  cy.visit('/signup');
  cy.get('input[name="name"]').type(name);
  cy.get('input[name="email"]').type(email);
  cy.get('input[name="password"]').type(password);
  cy.get('button[type="submit"]').click();
  cy.url().should('not.include', '/signup');
});

// Add to cart command
Cypress.Commands.add('addToCart', (productName) => {
  cy.contains('article', productName).within(() => {
    cy.contains('button', 'Add to cart').click();
  });
});

// Checkout command
Cypress.Commands.add('checkout', () => {
  cy.contains('button', 'Checkout').click();
});

// Verify order success command
Cypress.Commands.add('verifyOrderSuccess', () => {
  cy.contains(/Order #\d+ created!/).should('be.visible');
});

// Search products command
Cypress.Commands.add('searchProducts', (searchTerm) => {
  cy.get('input[placeholder="Search phones…"]').clear().type(searchTerm);
});

// Verify cart items command
Cypress.Commands.add('verifyCartItems', (expectedCount) => {
  cy.contains('Cart').parent().should('contain', `${expectedCount} item(s)`);
});

// API request helper
Cypress.Commands.add('apiRequest', (method, endpoint, data = {}) => {
  return cy.request({
    method,
    url: `${Cypress.env('apiUrl')}/api/v1${endpoint}`,
    body: data,
    headers: {
      'Content-Type': 'application/json'
    }
  });
});

// Login via API command
Cypress.Commands.add('apiLogin', (email, password) => {
  return cy.apiRequest('POST', '/auth/login', { email, password }).then((response) => {
    window.localStorage.setItem('token', response.body.token);
    return response.body;
  });
});
