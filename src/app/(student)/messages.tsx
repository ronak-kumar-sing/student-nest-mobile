// The student Inbox left the tab bar when the Roommates tab took its slot; it opens from Profile → Messages.
import React from 'react';
import { InboxScreen } from '@/features/inquiries/screens/inbox-screen';

export default function StudentMessagesRoute() {
  return <InboxScreen showBack />;
}
