import { languages } from '@/i18n/settings';
import React from 'react';

export async function generateStaticParams() {
  return languages.map((lng) => ({ lng }));
}

interface Props {
  children: React.ReactNode;
  params: Promise<{ lng: string }>;
}

export default async function LngLayout({
  children,
  params,
}: Props) {
  const { lng } = await params;
  
  return <>{children}</>;
}