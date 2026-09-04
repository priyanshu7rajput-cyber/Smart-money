import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { CategoriesView } from '@/components/accounts/CategoriesView';

export default function CategoriesPage() {
  return (
    <DashboardLayout>
      <CategoriesView />
    </DashboardLayout>
  );
}
