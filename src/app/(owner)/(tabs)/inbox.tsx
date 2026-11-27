// Stays on mocks: inquiries (09) and notifications (10) are not wired to the HTTP API yet (see docs/mobile-plan.md §8).
import React from 'react';
import InboxScreen from '@/app/(student)/(tabs)/inbox';

// Owner shares the same inbox component as student
export default function OwnerInboxScreen() {
  return <InboxScreen />;
}
