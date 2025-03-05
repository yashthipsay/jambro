import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

const BookingConfirmation = () => {
  const { id } = useParams();
  console.log(id);
  const [downloaded, setDownloaded] = useState(false);

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/payments/invoices/${id}`);
        const data = await response.json();
        if (data.success && !downloaded) {
          const link = document.createElement('a');
          link.href = `data:application/pdf;base64,${data.pdfBuffer}`;
          link.download = 'invoice.pdf';
          link.click();
          setDownloaded(true);
        } else {
          alert('Failed to fetch invoice');
        }
      } catch (error) {
        console.error('Error fetching invoice:', error);
      }
    };

    fetchInvoice();
  }, [id, downloaded]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <h1>Booking Confirmed!</h1>
      <p>Your booking ID is: {id}</p>
    </div>
  );
};

export default BookingConfirmation;