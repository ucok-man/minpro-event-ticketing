/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useCreateEventContext } from '@/context/create-event-provider';
import { validbanner, validEvent, validTicket } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useIsClient } from 'usehooks-ts';
import EventPreview from './event-preview';

export default function ReviewDraft() {
  const isClient = useIsClient();
  const { payload } = useCreateEventContext();
  const router = useRouter();

  let redirectPath: string | null = null;
  if (!payload.uploadBanner || !validbanner(payload.uploadBanner)) {
    redirectPath = '/dashboard/configure/upload-banner';
  } else if (!payload.createEvent || !validEvent(payload.createEvent)) {
    redirectPath = '/dashboard/configure/create-event';
  } else if (!payload.createTicket || !validTicket(payload.createTicket)) {
    redirectPath = '/dashboard/configure/create-ticket';
  }

  useEffect(() => {
    if (redirectPath) {
      router.replace(redirectPath); // `replace` prevents navigation history buildup
    }
  }, [redirectPath, router]);

  if (redirectPath || !isClient) return <div></div>;

  return (
    <div>
      <EventPreview
        event={{
          bannerUrl: payload.uploadBanner.data?.bannerUrl as any,
          ...(payload.createEvent.data as any),
        }}
        tickets={payload.createTicket.data as any}
      />
    </div>
  );
}
