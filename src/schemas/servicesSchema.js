const Joi = require('joi');

const getServiceByIdSchema = Joi.object({
    id: Joi.number().integer().positive().required().messages({
        'number.base': 'ID must be a number',
        'number.integer': 'ID must be an integer',
        'number.positive': 'ID must be a positive number',
        'any.required': 'ID is required'
    })
});

const postServiceSchema = Joi.object({
    category_id: Joi.number().integer().positive().required().messages({
        'number.base': 'Category ID must be a number',
        'number.integer': 'Category ID must be an integer',
        'number.positive': 'Category ID must be a positive number',
        'any.required': 'Category ID is required'
    }),
    name: Joi.string().max(100).required().messages({
        'string.base': 'Name must be text',
        'string.empty': 'Name is required',
        'string.max': 'Name cannot exceed 100 characters',
        'any.required': 'Name is required'
    }),
    description: Joi.string().max(500).optional().messages({
        'string.base': 'Description must be text',
        'string.max': 'Description cannot exceed 500 characters'
    }),
    price: Joi.number().positive().required().messages({
        'number.base': 'Price must be a number',
        'number.positive': 'Price must be a positive number',
        'any.required': 'Price is required'
    }),
    created_by: Joi.number().integer().positive().forbidden().messages({
        'any.unknown': 'Cannot send created_by field'
    })
});

const putServiceSchema = Joi.object({
    category_id: Joi.number().integer().positive().optional().messages({
        'number.base': 'Category ID must be a number',
        'number.integer': 'Category ID must be an integer',
        'number.positive': 'Category ID must be a positive number'
    }),
    name: Joi.string().max(100).optional().messages({
        'string.base': 'Name must be text',
        'string.max': 'Name cannot exceed 100 characters'
    }),
    description: Joi.string().max(500).optional().messages({
        'string.base': 'Description must be text',
        'string.max': 'Description cannot exceed 500 characters'
    }),
    price: Joi.number().positive().optional().messages({
        'number.base': 'Price must be a number',
        'number.positive': 'Price must be a positive number'
    }),
    updated_by: Joi.number().integer().positive().forbidden().messages({
        'any.unknown': 'Cannot send updated_by field'
    })
});

const deleteServiceSchema = Joi.object({
    id: Joi.number().integer().positive().required().messages({
        'number.base': 'ID must be a number',
        'number.integer': 'ID must be an integer',
        'number.positive': 'ID must be a positive number',
        'any.required': 'ID is required'
    }),
    deleted_by: Joi.number().integer().positive().forbidden().messages({
        'any.unknown': 'Cannot send deleted_by field'
    })
});

module.exports = {
    getServiceByIdSchema,
    postServiceSchema,
    putServiceSchema,
    deleteServiceSchema
};