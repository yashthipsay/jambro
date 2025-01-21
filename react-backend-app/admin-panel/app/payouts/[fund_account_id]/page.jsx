'use client'
import PayoutHistory from '../../components/PayoutHistory.jsx';
import { DashboardLayout } from '../../components/DashboardLayout.jsx';

export function PayoutHistoryPage() {
  return (
    <DashboardLayout>
      <PayoutHistory />
    </DashboardLayout>
  )
}

export default PayoutHistoryPage;