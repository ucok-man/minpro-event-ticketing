import { timeToFloat } from '@/helpers/time-to-float';
import { TimeType } from '@/types/time-type';
import { z } from 'zod';

export const EventSchema = z
  .object({
    id: z.string().uuid().optional(),
    name: z.string().trim().min(3).max(250),
    bannerUrl: z
      .string({ message: 'Please upload your banner first before continue' })
      .nonempty('Please upload your banner first before continue')
      .url('Invalid banner image url')
      .refine(
        (url) => {
          return url.startsWith(
            'https://res.cloudinary.com/dx6hmxiv3/image/upload/',
          );
        },
        { message: 'Invalid banner image url' },
      ),
    category: z.string().trim().nonempty(),
    startDate: z.string().datetime(),
    endDate: z.string().datetime(),
    startTime: z.string().regex(/^(?:[01]\d|2[0-3]):(?:00|30)$/, {
      message: 'Invalid time format. Please use HH:mm format.',
    }),
    endTime: z.string().regex(/^(?:[01]\d|2[0-3]):(?:00|30)$/, {
      message: 'Invalid time format. Please use HH:mm format.',
    }),
    isEventOnline: z.boolean(),
    urlStreaming: z.string().trim().url().optional(),
    placeName: z.string().trim().nonempty().optional(),
    placeAddress: z.string().trim().nonempty().optional(),
    placeCity: z.string().trim().nonempty().optional(),
    description: z
      .string()
      .trim()
      .min(10)
      .refine((arg) => arg !== '<p></p>', { message: 'Required' }),
    isPublished: z.boolean().optional(),
  })
  .refine(
    (data) => {
      if (data.isEventOnline) return !data.placeName;
      return true;
    },
    {
      message: 'Should be null if event is online',
      path: ['placeName'],
    },
  )
  .refine(
    (data) => {
      if (data.isEventOnline) return !data.placeAddress;
      return true;
    },
    {
      message: 'Should be null if event is online',
      path: ['placeAddress'],
    },
  )
  .refine(
    (data) => {
      if (data.isEventOnline) return !data.placeCity;
      return true;
    },
    {
      message: 'Should be null if event is online',
      path: ['placeCity'],
    },
  )
  .refine(
    (data) => {
      if (!data.isEventOnline) return !data.urlStreaming;
      return true;
    },
    {
      message: 'Should be null if event is in place',
      path: ['urlStreaming'],
    },
  )
  .refine(
    (data) => {
      if (data.isEventOnline) return data.urlStreaming;
      return true;
    },
    {
      message: 'Required',
      path: ['urlStreaming'],
    },
  )
  .refine(
    (data) => {
      if (!data.isEventOnline) return data.placeName;
      return true;
    },
    {
      message: 'Required',
      path: ['placeName'],
    },
  )
  .refine(
    (data) => {
      if (!data.isEventOnline) return data.placeAddress;
      return true;
    },
    {
      message: 'Required',
      path: ['placeAddress'],
    },
  )
  .refine(
    (data) => {
      if (!data.isEventOnline) return data.placeCity;
      return true;
    },
    {
      message: 'Required',
      path: ['placeCity'],
    },
  )
  .refine(
    (data) => {
      return data.startDate <= data.endDate;
    },
    { message: 'End date is behind start date', path: ['endDate'] },
  )
  .refine(
    (data) => {
      const start = timeToFloat(data.startTime as TimeType) || 0;
      const end = timeToFloat(data.endTime as TimeType) || 0;
      return end > start;
    },
    { message: 'End time must be more than start time', path: ['endTime'] },
  );

export const TicketsSchema = z
  .array(
    z
      .object({
        id: z.string().uuid().optional(),
        type: z.enum(['PAID', 'FREE']),
        name: z.string().min(3).max(250),
        amount: z.number().min(1),
        description: z.string().min(10),
        price: z.number().min(1).optional(),
        startDate: z.string().datetime(),
        endDate: z.string().datetime(),
        startTime: z.string().regex(/^(?:[01]\d|2[0-3]):(?:00|30)$/, {
          message: 'Invalid time format. Please use HH:mm format.',
        }),
        endTime: z.string().regex(/^(?:[01]\d|2[0-3]):(?:00|30)$/, {
          message: 'Invalid time format. Please use HH:mm format.',
        }),
      })
      .refine(
        (data) =>
          (data.type === 'FREE' && !data.price) ||
          (data.type === 'PAID' && data.price),
        {
          message:
            'Free ticket should not include price, and paid ticket should specify the price',
          path: ['price'],
        },
      )
      .refine((data) => data.endDate >= data.startDate, {
        message: 'End date must be after start date',
        path: ['endDate'],
      })
      .refine(
        (data) => {
          const start = timeToFloat(data.startTime as TimeType) || 0;
          const end = timeToFloat(data.endTime as TimeType) || 0;
          return end > start;
        },
        { message: 'End time must be more than start time', path: ['endTime'] },
      ),
  )
  .nonempty();

export const CreateEventDTO = z.object({
  event: EventSchema,
  tickets: TicketsSchema,
});
