// Import commands.js using ES2015 syntax:
import './commands'

// Alternatively you can use CommonJS syntax:
// require('./commands')

// Global configuration
beforeEach(() => {
  // Clear local storage before each test
  cy.clearLocalStorage();
  
  // Clear cookies before each test
  cy.clearCookies();
});

// Add custom commands for MobileShop testing
Cypress.Commands.add('login', (email, password) => {
  cy.visit('/login');
  cy.get('input[name="email"]').type(email);
  cy.get('input[name="password"]').type(password);
  cy.get('button[type="submit"]').click();
});

Cypress.Commands.add('register', (name, email, password) => {
  cy.visit('/signup');
  cy.get('input[name="name"]').type(name);
  cy.get('input[name="email"]').type(email);
  cy.get('input[name="password"]').type(password);
  cy.get('button[type="submit"]').click();
});

Cypress.Commands.add('addToCart', (productName) => {
  cy.contains('article', productName).within(() => {
    cy.contains('button', 'Add to cart').click();
  });
});

Cypress.Commands.add('checkout', () => {
  cy.contains('button', 'Checkout').click();
});

Cypress.Commands.add('verifyOrderSuccess', () => {
  cy.contains(/Order #\d+ created!/).should('be.visible');
});

// Handle uncaught exceptions
Cypress.on('uncaught:exception', (err, runnable) => {
  // returning false here prevents Cypress from failing the test
  if (err.message.includes('ResizeObserver loop limit exceeded')) {
    return false;
  }
  return true;
});
