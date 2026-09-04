import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { TransactionForm } from '@/components/transactions/TransactionForm';

export default function TransferPage() {
  return (
    <DashboardLayout>
      <TransactionForm type="transfer" />
    </DashboardLayout>
  );
}
