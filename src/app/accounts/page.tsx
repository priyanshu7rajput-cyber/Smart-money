import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { AccountsView } from '@/components/accounts/AccountsView';

export default function MasterAccountsPage() {
  return (
    <DashboardLayout>
      <AccountsView initialType="all" />
    </DashboardLayout>
  );
}
