import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { AccountsView } from '@/components/accounts/AccountsView';

export default function BankAccountsPage() {
  return (
    <DashboardLayout>
      <AccountsView initialType="bank" />
    </DashboardLayout>
  );
}
