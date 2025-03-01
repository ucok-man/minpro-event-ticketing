import {
  firstIsBeforeEqualSecondDate,
  sourceTimeIsAfterTarget,
  targetIsAfterCurrentDate,
} from '@/helpers/datetime-utils';
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
    urlStreaming: z.string().trim().url().optional().nullable(),
    placeName: z.string().trim().nonempty().optional().nullable(),
    placeAddress: z.string().trim().nonempty().optional().nullable(),
    placeCity: z.string().trim().nonempty().optional().nullable(),
    description: z
      .string()
      .trim()
      .min(100)
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
    (data) => firstIsBeforeEqualSecondDate(data.startDate, data.endDate),
    {
      message: 'End date must be after or equal start date',
      path: ['endDate'],
    },
  )
  .refine((data) => targetIsAfterCurrentDate(data.startDate), {
    message: 'Event start must be in the future',
    path: ['startDate'],
  })
  .refine(
    (data) =>
      sourceTimeIsAfterTarget(
        data.endTime as TimeType,
        data.startTime as TimeType,
      ),
    {
      message: 'End time must be after start time',
      path: ['endTime'],
    },
  );
