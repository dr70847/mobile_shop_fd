const { publishOrderCreated } = require("../../integration/messageBus");

function createOrderEventsPublisher() {
  return {
    async publishOrderCreated(payload) {
      return publishOrderCreated(payload);
    },
  };
}

module.exports = { createOrderEventsPublisher };

