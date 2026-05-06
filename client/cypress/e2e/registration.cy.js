describe('User Registration', () => {
  const testUser = {
    name: 'Test User Cypress',
    email: 'cypress.test@example.com',
    password: 'password123'
  };

  beforeEach(() => {
    // Clean up any existing test user
    cy.apiRequest('POST', '/auth/login', {
      email: testUser.email,
      password: testUser.password
    }).then((response) => {
      if (response.status === 200) {
        // User exists, logout to clean up
        cy.apiRequest('POST', '/auth/logout', {
          refreshToken: response.body.refreshToken
        });
      }
    });
  });

  it('should register a new user successfully', () => {
    cy.visit('/signup');
    
    // Fill registration form
    cy.get('input[name="name"]').type(testUser.name);
    cy.get('input[name="email"]').type(testUser.email);
    cy.get('input[name="password"]').type(testUser.password);
    
    // Submit form
    cy.get('button[type="submit"]').click();
    
    // Verify successful registration
    cy.url().should('not.include', '/signup');
    cy.contains('Welcome').should('be.visible');
    
    // Verify user is logged in
    cy.contains('Logout').should('be.visible');
    cy.contains(testUser.name).should('be.visible');
  });

  it('should show validation errors for invalid data', () => {
    cy.visit('/signup');
    
    // Submit empty form
    cy.get('button[type="submit"]').click();
    
    // Check for validation errors
    cy.contains('Name is required').should('be.visible');
    cy.contains('Email is required').should('be.visible');
    cy.contains('Password is required').should('be.visible');
  });

  it('should show error for duplicate email', () => {
    // First register a user
    cy.register(testUser.name, testUser.email, testUser.password);
    
    // Try to register again with same email
    cy.visit('/signup');
    cy.get('input[name="name"]').type('Another User');
    cy.get('input[name="email"]').type(testUser.email);
    cy.get('input[name="password"]').type('password456');
    cy.get('button[type="submit"]').click();
    
    // Verify error message
    cy.contains('Email already exists').should('be.visible');
  });

  it('should validate email format', () => {
    cy.visit('/signup');
    
    cy.get('input[name="name"]').type(testUser.name);
    cy.get('input[name="email"]').type('invalid-email');
    cy.get('input[name="password"]').type(testUser.password);
    cy.get('button[type="submit"]').click();
    
    // Verify email validation error
    cy.contains('Invalid email format').should('be.visible');
  });

  it('should validate password length', () => {
    cy.visit('/signup');
    
    cy.get('input[name="name"]').type(testUser.name);
    cy.get('input[name="email"]').type('new.email@example.com');
    cy.get('input[name="password"]').type('123'); // Too short
    cy.get('button[type="submit"]').click();
    
    // Verify password validation error
    cy.contains('Password must be at least 6 characters').should('be.visible');
  });
});
