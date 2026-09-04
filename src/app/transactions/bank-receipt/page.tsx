import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { TransactionForm } from '@/components/transactions/TransactionForm';

export default function BankReceiptPage() {
  return (
    <DashboardLayout>
      <TransactionForm type="bank_receipt" />
    </DashboardLayout>
  );
}
