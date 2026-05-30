// app/crm/layout.tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    default: 'CRM Dashboard',
    template: '%s | Jović Group CRM',
  },
};

export default function CrmLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#080E1A]">
      {children}
    </div>
  );
}
