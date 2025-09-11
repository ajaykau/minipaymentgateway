import Joi from 'joi';

export const chargeRequestSchema = Joi.object({
  amount: Joi.number().integer().min(1).max(10000000).required(),
  currency: Joi.string().length(3).pattern(/^[A-Z]{3}$/).uppercase().required(),
  source: Joi.string().min(1).max(100).required(),
  email: Joi.string().email().required()
});

export const validateChargeRequest = (data: any) => {
  return chargeRequestSchema.validate(data);
};