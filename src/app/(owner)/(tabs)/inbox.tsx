// Stays on mocks: inquiries (09) and notifications (10) are not wired to the HTTP API yet (see docs/mobile-plan.md §8).
import React from 'react';
import { InboxScreen } from '@/features/inquiries/screens/inbox-screen';

// Owner shares the same inbox screen as the student Messages screen
export default function OwnerInboxScreen() {
  return <InboxScreen />;
}
