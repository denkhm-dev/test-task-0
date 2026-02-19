import * as yup from 'yup';
import dayjs from 'dayjs';

export const serviceLogSchema = yup.object({
  providerId: yup.string().required('Provider ID required'),
  serviceOrder: yup.string().required('Order required'),
  carId: yup.string().required('Car ID required'),
  odometer: yup.number().typeError('Must be number').min(0, 'Cannot be negative').required(),
  engineHours: yup.number().typeError('Must be number').min(0, 'Cannot be negative').required(),
  startDate: yup.string().required(),
  endDate: yup.string()
    .required()
    .test('is-after-start', 'End date must be after start date', function (value) {
      const { startDate } = this.parent;
      return !startDate || !value || dayjs(value).isAfter(dayjs(startDate));
    }),
  type: yup.string().oneOf(['planned', 'unplanned', 'emergency']).required(),
  serviceDescription: yup.string().min(5, 'Too short').required(),
});