const { createInvoiceService } = require("../application/services/InvoiceService");
const { createAnalyticsService } = require("../application/services/AnalyticsService");
const { createMySqlOrderRepository } = require("../infrastructure/persistence/MySqlOrderRepository");
const { createMySqlProductQuery } = require("../infrastructure/catalog/MySqlProductQuery");
const { createGrpcAvailabilityService } = require("../infrastructure/catalog/GrpcAvailabilityService");
const { createOrderEventsPublisher } = require("../infrastructure/events/OrderEventsPublisher");

function createContainer() {
  const orderRepo = createMySqlOrderRepository();
  const productQuery = createMySqlProductQuery();
  const availability = createGrpcAvailabilityService();
  const events = createOrderEventsPublisher();

  const invoiceService = createInvoiceService({ orderRepo, productQuery, availability, events });
  const analyticsService = createAnalyticsService({ orderRepo });

  return { invoiceService, analyticsService };
}

module.exports = { createContainer };

