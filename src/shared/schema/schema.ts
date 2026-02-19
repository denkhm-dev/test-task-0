import * as yup from 'yup';

export const serviceLogSchema = yup.object({
  providerId: yup.string().required('Provider ID required'),
  serviceOrder: yup.string().required('Order required'),
  carId: yup.string().required('Car ID required'),
  odometer: yup.number().typeError('Must be number').required(),
  engineHours: yup.number().typeError('Must be number').required(),
  startDate: yup.string().required(),
  endDate: yup.string().required(),
  type: yup.string().oneOf(['planned', 'unplanned', 'emergency']).required(),
  serviceDescription: yup.string().min(5, 'Too short').required(),
});