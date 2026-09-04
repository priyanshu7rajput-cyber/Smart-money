import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { SummariesView } from '@/components/reports/SummariesView';

export default function SummariesPage() {
  return (
    <DashboardLayout>
      <SummariesView />
    </DashboardLayout>
  );
}
