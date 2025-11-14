import { ReactNode } from 'react';
import '../globals.css';
import AppShell from '../../components/dashboard/AppShell';

export default function AppLayout({ children }: { children: ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
