"use client";

import React from "react";
import { Button } from "@/app/ui/button";
import { useUser } from "@auth0/nextjs-auth0/client";

export default function HomePage() {
  const { user, error, isLoading } = useUser();

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>{error.message}</p>;

  return (
    <div className="text-center p-12">
      <h1 className="text-3xl font-bold mb-6">Jam Room Owner Onboarding</h1>
      {user ? (
        <div className="space-y-4">
          <p className="text-lg">Welcome, {user.name}!</p>
          <div className="space-x-4">
            <Button asChild>
              <a href="/register">Register Your Jam Room</a>
            </Button>
            <Button variant="outline" asChild>
              <a href="/api/auth/logout">Logout</a>
            </Button>
          </div>
        </div>
      ) : (
        <Button asChild>
          <a href="/api/auth/login">Login / Signup</a>
        </Button>
      )}
    </div>
  );
}
