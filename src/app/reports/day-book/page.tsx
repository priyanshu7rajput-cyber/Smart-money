import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { FinancialReportView } from '@/components/reports/FinancialReportView';

export default function DayBookPage() {
  return (
    <DashboardLayout>
      <FinancialReportView reportType="day_book" />
    </DashboardLayout>
  );
}
