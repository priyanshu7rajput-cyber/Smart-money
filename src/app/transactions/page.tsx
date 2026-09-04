import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { TransactionsListView } from '@/components/transactions/TransactionsListView';

export default function TransactionsPage() {
  return (
    <DashboardLayout>
      <TransactionsListView />
    </DashboardLayout>
  );
}
