// /app/page.js
'use client';

import React from 'react';
import { Button, Typography } from 'antd';
import { useUser } from '@auth0/nextjs-auth0/client';

const { Title } = Typography;

export default function HomePage() {
  const { user, error, isLoading } = useUser();

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>{error.message}</p>;

  return (
    <div style={{ textAlign: 'center', padding: '50px' }}>
      <Title level={2}>Jam Room Owner Onboarding</Title>
      {user ? (
        <div>
          <p>Welcome, {user.name}!</p>
          <Button type="primary" href="/register">Register Your Jam Room</Button>
          <Button href="/api/auth/logout" style={{ marginLeft: 10 }}>Logout</Button>
        </div>
      ) : (
        <Button type="primary" href="/api/auth/login">Login / Signup</Button>
      )}
    </div>
  );
}
