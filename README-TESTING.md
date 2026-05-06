# MobileShop Testing Documentation

This document provides comprehensive testing guidelines and instructions for the MobileShop application.

## 🧪 Testing Overview

The MobileShop application implements a comprehensive multi-layered testing strategy:

### 3.1. Unit Testing (Njësor)
- **Backend**: Jest with Supertest for API testing
- **Frontend**: Jest with React Testing Library for component testing
- **Coverage Target**: Minimum 80% for critical business logic

### 3.2. Integration Testing
- **API Integration**: Newman/Postman for end-to-end API testing
- **Docker Integration**: TestContainers and Docker Compose for isolated test environments
- **Frontend-Backend Integration**: Full stack testing scenarios

### 3.3. End-to-End Testing (E2E)
- **Cypress**: Complete user journey testing
- **Scenarios**: Registration, login, transactions, reporting
- **Real Browser Testing**: Chrome, Firefox, Edge support

### 3.4. Performance Testing
- **Locust**: Load testing and stress testing
- **Concurrent Users**: 1000+ users simulation
- **Critical Endpoints**: API stress testing with detailed metrics

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MySQL 8.0+
- Docker & Docker Compose (for integration tests)
- Newman CLI (`npm install -g newman`)

### Running Tests

#### Backend Tests
```bash
cd server

# Run all unit tests
npm test

# Run tests with coverage
npm run test:coverage

# Run integration tests
npm run test:integration

# Run integration tests with TestContainers (ephemeral MySQL container)
npm run test:integration:tc

# Run Docker-based integration tests
npm run test:docker

# Run Newman API tests
npm run test:newman

# Run performance tests
npm run test:performance

# Run all performance scenarios
npm run test:performance:all

# Run complete test suite
npm run test:all
```

#### Frontend Tests
```bash
cd client

# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in CI mode
npm run test:ci

# Run Cypress e2e tests
npm run e2e

# Open Cypress test runner
npm run e2e:open
```

## 📊 Test Structure

### Backend Tests (`server/__tests__/`)

#### Unit Tests
- `models/` - Model layer testing (Product, User, Order, etc.)
- `middleware/` - Authentication and authorization testing
- `routes/` - API endpoint testing
- `services/` - Business logic testing

#### Integration Tests
- `integration/api.integration.test.js` - Full API workflow testing
- `integration/docker-compose.test.yml` - Docker environment setup

### Frontend Tests (`client/src/components/__tests__/`)

#### Component Tests
- `Products.test.js` - Product listing and cart functionality
- `Layout.test.js` - Navigation and authentication UI
- Additional component tests for critical user flows

### E2E Testing (`client/cypress/`)

#### Cypress Tests
- `e2e/registration.cy.js` - User registration scenarios
- `e2e/login.cy.js` - Authentication and login flows
- `e2e/transaction.cy.js` - Complete purchase workflow
- `e2e/reporting.cy.js` - Order history and reporting

#### Cypress Configuration
- `cypress.config.js` - Cypress configuration
- `support/commands.js` - Custom commands for MobileShop
- `support/e2e.js` - Global setup and teardown

### Performance Testing (`tests/performance/`)

#### Locust Load Testing
- `locustfile.py` - User behavior simulation
- `locust.conf.py` - Test configurations and thresholds
- `run-load-tests.py` - Automated test runner
- `docker-compose.locust.yml` - Distributed load testing

#### Test Scenarios
- **Basic**: 100 users, 5 minutes
- **Medium**: 500 users, 10 minutes  
- **High**: 1000 users, 15 minutes
- **Stress**: 2000 users, 5 minutes
- **Soak**: 200 users, 1 hour

### API Testing (`tests/postman/`)

#### Postman Collection
- `mobile-shop-api.postman_collection.json` - Complete API test suite
- `mobile-shop-environment.postman_environment.json` - Test environment variables

#### Newman Automation
- `tests/newman/run-api-tests.js` - Automated API test runner
- `tests/newman/newman.config.js` - Newman configuration

## 🎯 Coverage Requirements

### Critical Business Logic (80% minimum coverage)

#### Backend Critical Paths
- User authentication and authorization
- Product CRUD operations
- Order processing and management
- Payment integration
- Two-factor authentication

#### Frontend Critical Components
- Product browsing and search
- Shopping cart functionality
- Checkout process
- User authentication flows
- Order management

## 🐳 Docker Integration Testing

### Test Environment Setup
```bash
# Run integration tests with Docker
cd server
npm run test:docker
```

### Test Database
- Uses isolated MySQL container
- Automatic schema setup
- Data cleanup between tests
- Realistic production-like environment

## 📈 Coverage Reports

### Generating Reports
```bash
# Backend coverage
cd server
npm run test:coverage

# Frontend coverage
cd client
npm run test:coverage
```

### Report Locations
- Backend: `server/coverage/`
- Frontend: `client/coverage/`
- Newman HTML: `tests/reports/newman-report.html`
- Newman JSON: `tests/reports/newman-report.json`

## 🔧 Configuration

### Jest Configuration
- Backend: `server/jest.config.js`
- Frontend: Uses Create React App defaults with custom setup

### Environment Variables
```bash
# Test environment
NODE_ENV=test

# Database testing
TEST_DB_HOST=localhost
TEST_DB_USER=testuser
TEST_DB_PASSWORD=testpass
TEST_DB_NAME=mobileshop_test

# JWT testing
JWT_SECRET=test-jwt-secret
ACCESS_TOKEN_TTL=15m
```

## 📝 Test Scenarios

### Authentication Flow
1. User registration
2. Email verification
3. Login with valid credentials
4. Token refresh
5. Logout and token revocation
6. Two-factor authentication

### Product Management
1. Browse products (public)
2. Get product details
3. Create product (admin only)
4. Update product (admin only)
5. Delete product (admin only)
6. Search and filter products

### Order Processing
1. Add items to cart
2. Calculate totals
3. Checkout process
4. Order creation
5. Order history
6. Order status updates

### Error Handling
1. Invalid authentication
2. Unauthorized access
3. Resource not found
4. Validation errors
5. Server errors

## 🚨 CI/CD Integration

### GitHub Actions Example
```yaml
name: Test Suite
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    services:
      mysql:
        image: mysql:8.0
        env:
          MYSQL_ROOT_PASSWORD: testpass
          MYSQL_DATABASE: mobileshop_test
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: cd server && npm ci
      - run: cd server && npm run test:all
      - run: cd client && npm ci
      - run: cd client && npm run test:ci
```

## 📊 Test Metrics

### Success Criteria
- ✅ All unit tests pass
- ✅ Minimum 80% code coverage
- ✅ All integration tests pass
- ✅ API tests complete successfully
- ✅ Performance benchmarks met

### Monitoring
- Test execution time
- Coverage trends
- Failure rates
- API response times

## 🛠️ Troubleshooting

### Common Issues

#### Database Connection Errors
```bash
# Ensure MySQL is running for tests
mysql -u root -p

# Create test database
CREATE DATABASE mobileshop_test;
```

#### Port Conflicts
```bash
# Check if port 3001 is in use
lsof -i :3001

# Kill process if needed
kill -9 <PID>
```

#### Docker Issues
```bash
# Clean up Docker containers
docker-compose down -v
docker system prune -f
```

### Debug Mode
```bash
# Run tests with verbose output
npm test -- --verbose

# Run specific test file
npm test -- models/Product.test.js

# Run tests in debug mode
node --inspect-brk node_modules/.bin/jest --runInBand
```

## 📚 Best Practices

### Writing Tests
1. **Arrange, Act, Assert** pattern
2. Test one thing at a time
3. Use descriptive test names
4. Mock external dependencies
5. Test edge cases and error scenarios

### Test Data Management
1. Use factories for test data
2. Clean up after each test
3. Use realistic data
4. Isolate test environments

### Performance Testing
1. Monitor test execution time
2. Use appropriate timeouts
3. Optimize database queries
4. Test with realistic data volumes

## 🔄 Continuous Improvement

### Regular Tasks
- Review and update test cases
- Monitor coverage metrics
- Update test dependencies
- Refactor test code
- Add tests for new features

### Quality Gates
- All tests must pass before deployment
- Coverage thresholds enforced
- Performance benchmarks required
- Security tests integrated

---

For questions or issues with testing, please refer to the project documentation or create an issue in the repository.
