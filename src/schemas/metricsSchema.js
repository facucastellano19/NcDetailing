const Joi = require('joi');

const filter = Joi.string().valid('weekly', 'monthly', 'yearly');
const startDate = Joi.date().iso();
const endDate = Joi.date().iso();

const getDashboardMetricsSchema = Joi.object({
    filter: filter,
    startDate: startDate,
    endDate: endDate
}).and('startDate', 'endDate')
  .without('filter', ['startDate', 'endDate'])
  .messages({
    'object.and': 'Both `startDate` and `endDate` must be provided for a custom date range.',
    'object.without': 'Cannot use a predefined `filter` in combination with `startDate` or `endDate`.'
  });

module.exports = { getDashboardMetricsSchema };