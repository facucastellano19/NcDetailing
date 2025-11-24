const Joi = require('joi');

const getEmployeesSchema = Joi.object({
    status: Joi.string().valid('active', 'inactive', 'all').optional().messages({
        'string.base': 'Status must be a string',
        'any.only': 'Status must be one of [active, inactive, all]'
    })
});

const getEmployeeByIdSchema = Joi.object({
    id: Joi.number().integer().positive().required()
});

const putEmployeeSchema = Joi.object({
    name: Joi.string()
        .min(3)
        .max(50)
        .optional()
        .messages({
            'string.base': 'Name must be a string',
            'string.min': 'Name must be at least 3 characters long',
            'string.max': 'Name must be at most 50 characters long'
        }),

    email: Joi.string()
        .email()
        .optional()
        .messages({
            'string.base': 'Email must be a string',
            'string.email': 'Email must be a valid email address'
        }),

    username: Joi.string()
        .alphanum()
        .min(3)
        .max(30)
        .optional()
        .messages({
            'string.base': 'Username must be a string',
            'string.alphanum': 'Username must be alphanumeric',
            'string.min': 'Username must be at least 3 characters long',
            'string.max': 'Username must be at most 30 characters long'
        }),

    password: Joi.string()
        .pattern(new RegExp('^[a-zA-Z0-9!@#$%^&*()_+{}\\[\\]:;<>,.?~\\\\/-]+$'))
        .min(8)
        .max(30)
        .optional()
        .messages({
            'string.base': 'Password must be a string',
            'string.pattern.base': 'Password must be alphanumeric and can include special characters',
            'string.min': 'Password must be at least 8 characters long',
            'string.max': 'Password must be at most 30 characters long'
        }),

    role_id: Joi.number()
        .integer()
        .valid(1, 2)
        .forbidden()
        .messages({
            'number.base': 'Role ID must be a number',
            'number.integer': 'Role ID must be an integer',
            'any.only': 'Role ID must be 1 or 2'
        }),

    updated_by: Joi.number()
        .integer()
        .forbidden()
        .messages({
            'number.base': 'Updated by must be a number',
            'number.integer': 'Updated by must be an integer',
            'any.unknown': 'Cannot send updated_by field'
        })
});

const deleteEmployeeSchema = Joi.object({
    id: Joi.number().integer().positive().required()
});

module.exports = {
    getEmployeesSchema,
    getEmployeeByIdSchema,
    putEmployeeSchema,
    deleteEmployeeSchema
};
