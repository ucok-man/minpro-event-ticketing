'use client';

import CardCarousel from '@/components/shared/card-carousel';
import MaxWidthWrapper from '@/components/shared/max-width-wrapper';
import { toast } from '@/hooks/use-toast';
import { apiclient } from '@/lib/axios';
import { GetAllEventsResponse } from '@/types';
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import EventCard from '../event-card';

export default function FeaturedEvent() {
  const { data, error, isFetching, isPending } = useQuery({
    queryKey: ['event-discovery', 'featured-event'],
    queryFn: async () => {
      const { data } = await apiclient.get(`/events?pageSize=8&popular=true`);
      return data as GetAllEventsResponse;
    },
  });

  useEffect(() => {
    if (error) {
      toast({
        title: 'Failed Load Data',
        description: 'Failed to load featured events',
        variant: 'destructive',
      });
    }
  }, [error]);

  if (isPending) return null;
  if (!data) return null;

  const { events } = data;

  return (
    <MaxWidthWrapper className="my-8">
      <div>
        <h2 className="text-xl font-bold mb-4">Trending Event</h2>
        {events.length >= 1 && (
          <div className="w-full">
            <CardCarousel
              slideToScroll={1}
              items={events.map((event) => (
                <EventCard
                  containerClass="h-full"
                  key={event.id}
                  event={event}
                />
              ))}
            />
          </div>
        )}
      </div>
    </MaxWidthWrapper>
  );
}
