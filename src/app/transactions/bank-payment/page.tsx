import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { TransactionForm } from '@/components/transactions/TransactionForm';

export default function BankPaymentPage() {
  return (
    <DashboardLayout>
      <TransactionForm type="bank_payment" />
    </DashboardLayout>
  );
}
