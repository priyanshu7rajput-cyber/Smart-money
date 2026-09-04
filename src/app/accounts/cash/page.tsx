import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { AccountsView } from '@/components/accounts/AccountsView';

export default function CashAccountsPage() {
  return (
    <DashboardLayout>
      <AccountsView initialType="cash" />
    </DashboardLayout>
  );
}
