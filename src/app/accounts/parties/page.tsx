import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PartiesView } from '@/components/accounts/PartiesView';

export default function PartiesPage() {
  return (
    <DashboardLayout>
      <PartiesView />
    </DashboardLayout>
  );
}
