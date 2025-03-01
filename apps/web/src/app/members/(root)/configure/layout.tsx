// import StepNavigation from '@/components/shared/step-navigation';
import MaxWidthWrapper from '@/components/shared/max-width-wrapper';
import StepNavigation from '@/components/shared/step-navigation';
import { CREATE_EVENT_STEPS } from '@/constants';
import CreateEventContextProvider from '@/context/create-event-provider';
import React from 'react';
import Navbar from './navbar';
import PublishBar from './publish-bar';

export default function DealsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CreateEventContextProvider>
      <div className="min-h-screen w-full">
        <Navbar />
        <section>
          <MaxWidthWrapper className="py-8">
            <StepNavigation steps={CREATE_EVENT_STEPS} />
            <div className="my-8">{children}</div>
          </MaxWidthWrapper>
          <PublishBar />
        </section>
      </div>
    </CreateEventContextProvider>
  );
}
