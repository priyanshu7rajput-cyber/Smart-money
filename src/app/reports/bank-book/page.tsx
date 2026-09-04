import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { FinancialReportView } from '@/components/reports/FinancialReportView';

export default function BankBookPage() {
  return (
    <DashboardLayout>
      <FinancialReportView reportType="bank_book" />
    </DashboardLayout>
  );
}
