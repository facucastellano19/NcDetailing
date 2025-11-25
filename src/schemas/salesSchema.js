const Joi = require('joi');

const clientId = Joi.number().integer().positive().required();
const vehicleId = Joi.number().integer().positive();
const paymentMethodId = Joi.number().integer().positive().required();
const paymentStatusId = Joi.number().integer().positive();
const observations = Joi.string().allow(null, '').messages({
    'string.base': 'Observations must be a string.'
});

const productItemSchema = Joi.object({
    product_id: Joi.number().integer().positive().required().messages({
        'number.base': 'Product ID must be a number.',
        'number.integer': 'Product ID must be an integer.',
        'number.positive': 'Product ID must be a positive number.',
        'any.required': 'Product ID is a required field.'
    }),
    quantity: Joi.number().integer().min(1).required().messages({
        'number.base': 'Quantity must be a number.',
        'number.integer': 'Quantity must be an integer.',
        'number.min': 'Quantity must be at least 1.',
        'any.required': 'Quantity is a required field.'
    })
});

const serviceItemSchema = Joi.object({
    service_id: Joi.number().integer().positive().required().messages({
        'number.base': 'Service ID must be a number.',
        'number.integer': 'Service ID must be an integer.',
        'number.positive': 'Service ID must be a positive number.',
        'any.required': 'Service ID is a required field.'
    })
});

const postSaleProductsSchema = Joi.object({
    client_id: clientId.messages({
        'number.base': 'Client ID must be a number.',
        'number.integer': 'Client ID must be an integer.',
        'number.positive': 'Client ID must be a positive number.',
        'any.required': 'Client ID is a required field.'
    }),
    payment_method_id: paymentMethodId.messages({
        'number.base': 'Payment method ID must be a number.',
        'number.integer': 'Payment method ID must be an integer.',
        'number.positive': 'Payment method ID must be a positive number.',
        'any.required': 'Payment method ID is a required field.'
    }),
    payment_status_id: paymentStatusId.messages({
        'number.base': 'Payment status ID must be a number.',
        'number.integer': 'Payment status ID must be an integer.',
        'number.positive': 'Payment status ID must be a positive number.'
    }),
    observations: observations,
    products: Joi.array().items(productItemSchema).min(1).required().messages({
        'array.base': 'Products must be an array.',
        'array.min': 'At least one product is required for the sale.',
        'any.required': 'The products field is required.'
    })
});

const postSaleServicesSchema = Joi.object({
    client_id: clientId.messages({
        'number.base': 'Client ID must be a number.',
        'number.integer': 'Client ID must be an integer.',
        'number.positive': 'Client ID must be a positive number.',
        'any.required': 'Client ID is a required field.'
    }),
    vehicle_id: vehicleId.required().messages({
        'number.base': 'Vehicle ID must be a number.',
        'number.integer': 'Vehicle ID must be an integer.',
        'number.positive': 'Vehicle ID must be a positive number.',
        'any.required': 'Vehicle ID is required for service sales.'
    }),
    payment_method_id: paymentMethodId.messages({
        'number.base': 'Payment method ID must be a number.',
        'number.integer': 'Payment method ID must be an integer.',
        'number.positive': 'Payment method ID must be a positive number.',
        'any.required': 'Payment method ID is a required field.'
    }),
    payment_status_id: paymentStatusId.messages({
        'number.base': 'Payment status ID must be a number.',
        'number.integer': 'Payment status ID must be an integer.',
        'number.positive': 'Payment status ID must be a positive number.'
    }),
    observations: observations,
    services: Joi.array().items(serviceItemSchema).min(1).required().messages({
        'array.base': 'Services must be an array.',
        'array.min': 'At least one service is required for the sale.',
        'any.required': 'The services field is required.'
    })
});

const updatePaymentStatusSchema = Joi.object({
    payment_status_id: Joi.number().integer().positive().valid(1, 2, 3).required().messages({
        'number.base': 'Payment status ID must be a number.',
        'number.integer': 'Payment status ID must be an integer.',
        'number.positive': 'Payment status ID must be a positive number.',
        'any.only': 'Payment status ID must be one of [1, 2, 3].',
        'any.required': 'Payment status ID is a required field.'
    })
});

const getSaleByIdSchema = Joi.object({
    id: Joi.number().integer().positive().required()
});

const updateServiceStatusSchema = Joi.object({
    service_status_id: Joi.number().integer().positive().valid(1, 2, 3, 4).required().messages({
        'number.base': 'Service status ID must be a number.',
        'number.integer': 'Service status ID must be an integer.',
        'number.positive': 'Service status ID must be a positive number.',
        'any.only': 'Service status ID must be one of [1, 2, 3, 4].',
        'any.required': 'Service status ID is a required field.'
    })
});

module.exports = { 
    postSaleProductsSchema, 
    postSaleServicesSchema, 
    updatePaymentStatusSchema, 
    getSaleByIdSchema, 
    updateServiceStatusSchema 
};