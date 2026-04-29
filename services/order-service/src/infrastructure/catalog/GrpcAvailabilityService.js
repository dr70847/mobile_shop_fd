const { checkAvailability } = require("../../integration/grpcCatalogClient");

function createGrpcAvailabilityService() {
  return {
    checkAvailability(ids) {
      return checkAvailability(ids);
    },
  };
}

module.exports = { createGrpcAvailabilityService };

