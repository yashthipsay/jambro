

'use client'
import { DashboardLayout } from '../../components/DashboardLayout.jsx';
import BookingsPage from '@/app/components/BookingsPage.jsx';

export  function Bookings() {
    return (
        <DashboardLayout>
        <BookingsPage />
        </DashboardLayout>
    )
    }

export default Bookings;