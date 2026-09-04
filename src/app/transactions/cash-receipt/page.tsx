import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { TransactionForm } from '@/components/transactions/TransactionForm';

export default function CashReceiptPage() {
  return (
    <DashboardLayout>
      <TransactionForm type="cash_receipt" />
    </DashboardLayout>
  );
}
