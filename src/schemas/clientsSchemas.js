const Joi = require('joi');

const vehiclePostSchema = Joi.object({
  brand: Joi.string().max(50).required().messages({
    'string.base': 'La marca debe ser un texto',
    'string.empty': 'La marca es obligatoria',
    'string.max': 'La marca no puede superar 50 caracteres',
    'any.required': 'La marca es obligatoria'
  }),
  model: Joi.string().max(50).required().messages({
    'string.base': 'El modelo debe ser un texto',
    'string.empty': 'El modelo es obligatorio',
    'string.max': 'El modelo no puede superar 50 caracteres',
    'any.required': 'El modelo es obligatorio'
  }),
  year: Joi.number().integer().min(1900).max(new Date().getFullYear()).required().messages({
    'number.base': 'El año debe ser un número',
    'number.integer': 'El año debe ser un número entero',
    'number.min': 'El año del vehículo no puede ser menor a 1900',
    'number.max': `El año del vehículo no puede ser mayor a ${new Date().getFullYear()}`,
    'any.required': 'El año es obligatorio'
  }),
  color: Joi.string().max(50).required().messages({
    'string.base': 'El color debe ser un texto',
    'string.empty': 'El color es obligatorio',
    'string.max': 'El color no puede superar 50 caracteres',
    'any.required': 'El color es obligatorio'
  }),
  license_plate: Joi.string().max(20).required().messages({
    'string.base': 'La patente debe ser un texto',
    'string.empty': 'La patente es obligatoria',
    'string.max': 'La patente no puede superar 20 caracteres',
    'any.required': 'La patente es obligatoria'
  })
});

const postClientSchema = Joi.object({
  first_name: Joi.string().max(100).required().messages({
    'string.base': 'El nombre debe ser un texto',
    'string.empty': 'El nombre es obligatorio',
    'string.max': 'El nombre no puede superar 100 caracteres',
    'any.required': 'El nombre es obligatorio'
  }),
  last_name: Joi.string().max(100).required().messages({
    'string.base': 'El apellido debe ser un texto',
    'string.empty': 'El apellido es obligatorio',
    'string.max': 'El apellido no puede superar 100 caracteres',
    'any.required': 'El apellido es obligatorio'
  }),
  email: Joi.string().email().required().messages({
    'string.base': 'El email debe ser un texto',
    'string.email': 'El email no es válido',
    'string.empty': 'El email es obligatorio',
    'any.required': 'El email es obligatorio'
  }),
  phone: Joi.string().max(20).required().messages({
    'string.base': 'El teléfono debe ser un texto',
    'string.empty': 'El teléfono es obligatorio',
    'string.max': 'El teléfono no puede superar 20 caracteres',
    'any.required': 'El teléfono es obligatorio'
  }),
  created_by: Joi.number().integer().forbidden().messages({
    'any.unknown': 'No se puede enviar el campo created_by'
  }),
  vehicles: Joi.array().items(vehiclePostSchema).min(1).required().messages({
    'array.base': 'Debe enviar un arreglo de vehículos',
    'array.min': 'Debe agregar al menos un vehículo',
    'any.required': 'Debe agregar al menos un vehículo'
  })
});

// Vehículo PUT
const vehiclePutSchema = Joi.object({
  id: Joi.number().integer().optional(),
  brand: Joi.string().max(50).optional().messages({
    'string.base': 'La marca debe ser un texto',
    'string.max': 'La marca no puede superar 50 caracteres'
  }),
  model: Joi.string().max(50).optional().messages({
    'string.base': 'El modelo debe ser un texto',
    'string.max': 'El modelo no puede superar 50 caracteres'
  }),
  year: Joi.number().integer().min(1900).max(new Date().getFullYear()).optional().messages({
    'number.base': 'El año debe ser un número',
    'number.integer': 'El año debe ser un número entero',
    'number.min': 'El año del vehículo no puede ser menor a 1900',
    'number.max': `El año del vehículo no puede ser mayor a ${new Date().getFullYear()}`
  }),
  color: Joi.string().max(50).optional().messages({
    'string.base': 'El color debe ser un texto',
    'string.max': 'El color no puede superar 50 caracteres'
  }),
  license_plate: Joi.string().max(20).optional().messages({
    'string.base': 'La patente debe ser un texto',
    'string.max': 'La patente no puede superar 20 caracteres'
  }),
  deleted: Joi.boolean().optional()
});

// PUT Cliente
const putClientSchema = Joi.object({
  first_name: Joi.string().max(100).optional().messages({
    'string.base': 'El nombre debe ser un texto',
    'string.max': 'El nombre no puede superar 100 caracteres'
  }),
  last_name: Joi.string().max(100).optional().messages({
    'string.base': 'El apellido debe ser un texto',
    'string.max': 'El apellido no puede superar 100 caracteres'
  }),
  email: Joi.string().email().optional().messages({
    'string.base': 'El email debe ser un texto',
    'string.email': 'El email no es válido'
  }),
  phone: Joi.string().max(20).optional().messages({
    'string.base': 'El teléfono debe ser un texto',
    'string.max': 'El teléfono no puede superar 20 caracteres'
  }),
  updated_by: Joi.number().integer().forbidden().messages({
    'any.unknown': 'No se puede enviar el campo updated_by'
  }),
  vehicles: Joi.array().items(vehiclePutSchema).optional()
});

const getClientByIdSchema = Joi.object({
  id: Joi.number().integer().required().messages({
    'number.base': 'El id debe ser un número',
    'number.integer': 'El id debe ser un número entero',
    'any.required': 'El id es obligatorio'
  })
});

module.exports = { postClientSchema, putClientSchema, getClientByIdSchema };
