import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { FinancialReportView } from '@/components/reports/FinancialReportView';

export default function CashBookPage() {
  return (
    <DashboardLayout>
      <FinancialReportView reportType="cash_book" />
    </DashboardLayout>
  );
}
