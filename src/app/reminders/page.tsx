'use client';

import React from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PaymentRemindersView } from '@/components/reminders/PaymentRemindersView';

export default function RemindersPage() {
  return (
    <DashboardLayout>
      <PaymentRemindersView />
    </DashboardLayout>
  );
}
