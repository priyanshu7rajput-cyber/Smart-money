import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { TransactionForm } from '@/components/transactions/TransactionForm';

export default function CashPaymentPage() {
  return (
    <DashboardLayout>
      <TransactionForm type="cash_payment" />
    </DashboardLayout>
  );
}
