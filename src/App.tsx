import { Routes, Route } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { RequireAdmin } from '@/components/admin/RequireAdmin';
import { DashboardPage } from '@/pages/DashboardPage';
import { TransformersListPage } from '@/pages/TransformersListPage';
import { TransformerDetailPage } from '@/pages/TransformerDetailPage';
import { NewAnalysisPage } from '@/pages/NewAnalysisPage';
import { AnalysisResultPage } from '@/pages/AnalysisResultPage';
import { AnalysisHistoryPage } from '@/pages/AnalysisHistoryPage';
import { ReportsPage } from '@/pages/ReportsPage';
import { LearnPage } from '@/pages/LearnPage';
import { AdminDashboardPage } from '@/pages/admin/AdminDashboardPage';
import { AdminUsersPage } from '@/pages/admin/AdminUsersPage';
import { AdminAuditLogsPage } from '@/pages/admin/AdminAuditLogsPage';
import { AdminBackupPage } from '@/pages/admin/AdminBackupPage';
import { AdminImportExportPage } from '@/pages/admin/AdminImportExportPage';
import { AdminHealthPage } from '@/pages/admin/AdminHealthPage';

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="transformers" element={<TransformersListPage />} />
        <Route path="transformers/:id" element={<TransformerDetailPage />} />
        <Route path="analysis/new" element={<NewAnalysisPage />} />
        <Route path="analysis/history" element={<AnalysisHistoryPage />} />
        <Route path="analysis/:id" element={<AnalysisResultPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="reports/:id" element={<ReportsPage />} />
        <Route path="learn" element={<LearnPage />} />
      </Route>
      <Route
        path="/admin"
        element={
          <RequireAdmin>
            <AdminLayout />
          </RequireAdmin>
        }
      >
        <Route index element={<AdminDashboardPage />} />
        <Route path="users" element={<AdminUsersPage />} />
        <Route path="audit-logs" element={<AdminAuditLogsPage />} />
        <Route path="backup" element={<AdminBackupPage />} />
        <Route path="import-export" element={<AdminImportExportPage />} />
        <Route path="health" element={<AdminHealthPage />} />
      </Route>
    </Routes>
  );
}
