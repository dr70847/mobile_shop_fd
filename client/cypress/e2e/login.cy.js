describe('User Login', () => {
  const testUser = {
    name: 'Login Test User',
    email: 'login.test@example.com',
    password: 'password123'
  };

  beforeEach(() => {
    // Register and login user to ensure they exist
    cy.apiRequest('POST', '/auth/register', testUser).then(() => {
      cy.apiLogin(testUser.email, testUser.password);
      cy.apiRequest('POST', '/auth/logout', {
        refreshToken: window.localStorage.getItem('refreshToken')
      });
      window.localStorage.clear();
    });
  });

  it('should login successfully with valid credentials', () => {
    cy.visit('/login');
    
    // Fill login form
    cy.get('input[name="email"]').type(testUser.email);
    cy.get('input[name="password"]').type(testUser.password);
    
    // Submit form
    cy.get('button[type="submit"]').click();
    
    // Verify successful login
    cy.url().should('not.include', '/login');
    cy.contains('Logout').should('be.visible');
    cy.contains(testUser.name).should('be.visible');
    
    // Verify navigation to home page
    cy.url().should('include', '/');
  });

  it('should show error for invalid credentials', () => {
    cy.visit('/login');
    
    // Fill with wrong password
    cy.get('input[name="email"]').type(testUser.email);
    cy.get('input[name="password"]').type('wrongpassword');
    
    // Submit form
    cy.get('button[type="submit"]').click();
    
    // Verify error message
    cy.contains('Invalid credentials').should('be.visible');
    cy.url().should('include', '/login');
  });

  it('should show error for non-existent user', () => {
    cy.visit('/login');
    
    // Fill with non-existent email
    cy.get('input[name="email"]').type('nonexistent@example.com');
    cy.get('input[name="password"]').type('password123');
    
    // Submit form
    cy.get('button[type="submit"]').click();
    
    // Verify error message
    cy.contains('Invalid credentials').should('be.visible');
    cy.url().should('include', '/login');
  });

  it('should validate required fields', () => {
    cy.visit('/login');
    
    // Submit empty form
    cy.get('button[type="submit"]').click();
    
    // Check for validation errors
    cy.contains('Email is required').should('be.visible');
    cy.contains('Password is required').should('be.visible');
  });

  it('should validate email format', () => {
    cy.visit('/login');
    
    // Fill with invalid email
    cy.get('input[name="email"]').type('invalid-email');
    cy.get('input[name="password"]').type(testUser.password);
    
    // Submit form
    cy.get('button[type="submit"]').click();
    
    // Verify email validation error
    cy.contains('Invalid email format').should('be.visible');
  });

  it('should remember user session after page refresh', () => {
    // Login via API first
    cy.apiLogin(testUser.email, testUser.password);
    
    // Visit home page
    cy.visit('/');
    
    // Verify user is still logged in
    cy.contains('Logout').should('be.visible');
    cy.contains(testUser.name).should('be.visible');
    
    // Refresh page
    cy.reload();
    
    // Verify user is still logged in after refresh
    cy.contains('Logout').should('be.visible');
    cy.contains(testUser.name).should('be.visible');
  });

  it('should logout successfully', () => {
    // Login first
    cy.login(testUser.email, testUser.password);
    
    // Click logout
    cy.contains('Logout').click();
    
    // Verify logout
    cy.contains('Login').should('be.visible');
    cy.contains('Sign up').should('be.visible');
    cy.contains('Logout').should('not.exist');
    
    // Try to access protected route
    cy.visit('/orders');
    
    // Should redirect to login
    cy.url().should('include', '/login');
  });
});
