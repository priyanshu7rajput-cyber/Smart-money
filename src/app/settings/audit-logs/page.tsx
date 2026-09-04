import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { AuditLogsView } from '@/components/settings/AuditLogsView';

export default function AuditLogsPage() {
  return (
    <DashboardLayout>
      <AuditLogsView />
    </DashboardLayout>
  );
}
