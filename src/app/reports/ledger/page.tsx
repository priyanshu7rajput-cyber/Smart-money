import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { FinancialReportView } from '@/components/reports/FinancialReportView';

export default function LedgerReportPage() {
  return (
    <DashboardLayout>
      <FinancialReportView reportType="ledger" />
    </DashboardLayout>
  );
}
