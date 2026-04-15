const authenticationModule = require("./authentication");
const userManagementModule = require("./user-management");
const businessOperationsModule = require("./business-operations");
const statisticsReportingModule = require("./statistics-reporting");

const modules = [
  authenticationModule,
  userManagementModule,
  businessOperationsModule,
  statisticsReportingModule,
];

module.exports = { modules };
