import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { CompanyProfileView } from '@/components/settings/CompanyProfileView';

export default function CompanySettingsPage() {
  return (
    <DashboardLayout>
      <CompanyProfileView />
    </DashboardLayout>
  );
}
