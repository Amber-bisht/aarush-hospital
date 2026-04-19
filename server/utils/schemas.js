import Joi from 'joi';

const passwordRule = Joi.string()
  .min(8)
  .pattern(/[a-z]/, 'lowercase')
  .pattern(/[A-Z]/, 'uppercase')
  .pattern(/[0-9]/, 'number')
  .required()
  .messages({
    'string.pattern.name': 'Password must include uppercase, lowercase, and a number.',
  });

export const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: passwordRule,
  role: Joi.string().valid('admin', 'doctor', 'patient').required(),
  name: Joi.string().trim().min(2).when('role', {
    is: Joi.valid('doctor', 'patient'),
    then: Joi.required(),
    otherwise: Joi.optional().allow(''),
  }),
  age: Joi.number().integer().min(0).max(120).when('role', {
    is: 'patient',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  gender: Joi.string().valid('male', 'female', 'other').when('role', {
    is: 'patient',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  phone: Joi.string().trim().min(8).max(20).when('role', {
    is: Joi.valid('doctor', 'patient'),
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  address: Joi.string().trim().min(5).when('role', {
    is: 'patient',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  specialization: Joi.string().trim().min(2).when('role', {
    is: 'doctor',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

export const refreshSchema = Joi.object({
  refreshToken: Joi.string().required(),
});

export const patientSchema = Joi.object({
  name: Joi.string().trim().min(2).required(),
  age: Joi.number().integer().min(0).max(120).required(),
  gender: Joi.string().valid('male', 'female', 'other').required(),
  phone: Joi.string().trim().min(8).max(20).required(),
  address: Joi.string().trim().min(5).required(),
});

export const doctorSchema = Joi.object({
  name: Joi.string().trim().min(2).required(),
  specialization: Joi.string().trim().min(2).required(),
  phone: Joi.string().trim().min(8).max(20).required(),
});

export const appointmentSchema = Joi.object({
  patient_id: Joi.number().integer().positive().required(),
  doctor_id: Joi.number().integer().positive().required(),
  date: Joi.date().iso().required(),
  reason: Joi.string().trim().allow('', null).max(255),
  notes: Joi.string().allow('', null),
});

export const appointmentRescheduleSchema = Joi.object({
  date: Joi.date().iso().required(),
});

export const billSchema = Joi.object({
  patient_id: Joi.number().integer().positive().required(),
  appointment_id: Joi.number().integer().positive().required(),
  amount: Joi.number().precision(2).min(0).required(),
});

export const prescriptionSchema = Joi.object({
  diagnosis: Joi.string().trim().min(3).required(),
  medicines: Joi.string().trim().min(3).required(),
  notes: Joi.string().allow('', null),
});
