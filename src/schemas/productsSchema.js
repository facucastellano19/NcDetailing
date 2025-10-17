const Joi = require('joi');

const getProductByIdSchema = Joi.object({
    id: Joi.number().integer().positive().required().messages({
        'number.base': 'ID must be a number',
        'number.integer': 'ID must be an integer',
        'number.positive': 'ID must be a positive number',
        'any.required': 'ID is required'
    })
});

const postProductSchema = Joi.object({
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
    stock: Joi.number().integer().min(0).required().messages({
        'number.base': 'Stock must be a number',
        'number.integer': 'Stock must be an integer',
        'number.min': 'Stock cannot be negative',
        'any.required': 'Stock is required'
    }),
    min_stock: Joi.number().integer().min(0).required().messages({
        'number.base': 'Min stock must be a number',
        'number.integer': 'Min stock must be an integer',
        'number.min': 'Min stock cannot be negative',
        'any.required': 'Min stock is required'
    }),
    category_id: Joi.number().integer().positive().required().messages({
        'number.base': 'Category ID must be a number',
        'number.integer': 'Category ID must be an integer',
        'number.positive': 'Category ID must be a positive number',
        'any.required': 'Category ID is required'
    }),
    created_by: Joi.number().integer().positive().forbidden().messages({
        'any.unknown': 'Cannot send created_by field'
    })
});

const putProductSchema = Joi.object({
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
    stock: Joi.number().integer().min(0).optional().messages({
        'number.base': 'Stock must be a number',
        'number.integer': 'Stock must be an integer',
        'number.min': 'Stock cannot be negative'
    }),
    category_id: Joi.number().integer().positive().optional().messages({
        'number.base': 'Category ID must be a number',
        'number.integer': 'Category ID must be an integer',
        'number.positive': 'Category ID must be a positive number'
    }),
    updated_by: Joi.number().integer().positive().forbidden().messages({
        'any.unknown': 'Cannot send updated_by field'
    })
});

const deleteProductSchema = Joi.object({
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

const postCategorySchema = Joi.object({
    name: Joi.string().max(50).required().messages({
        'string.base': 'Name must be text',
        'string.empty': 'Name is required',
        'string.max': 'Name cannot exceed 50 characters',
        'any.required': 'Name is required'
    }),
    created_by: Joi.number().integer().positive().forbidden().messages({
        'any.unknown': 'Cannot send created_by field'
    })
});

const updateMinStockSchema = Joi.object({
    min_stock: Joi.number().integer().min(0).required().messages({
        'number.base': 'Min stock must be a number',
        'number.integer': 'Min stock must be an integer',
        'number.min': 'Min stock cannot be negative',
        'any.required': 'Min stock is required'
    }),
    updated_by: Joi.number().integer().positive().forbidden().messages({
        'any.unknown': 'Cannot send updated_by field'
    })
});

const getProductsSchema = Joi.object({
    category_id: Joi.number().integer().positive().optional().messages({
        'number.base': 'Category ID must be a number',
        'number.integer': 'Category ID must be an integer',
        'number.positive': 'Category ID must be a positive number'
    }),
    name: Joi.string().max(100).optional().messages({
        'string.base': 'Name must be text',
        'string.max': 'Name cannot exceed 100 characters'
    })
});

module.exports = {
    getProductByIdSchema,
    postProductSchema,
    putProductSchema,
    deleteProductSchema,
    postCategorySchema,
    getProductsSchema,
    updateMinStockSchema
};



