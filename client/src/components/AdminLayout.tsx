import { type ReactNode } from "react";
import AdminSidebar from "./AdminSidebar";

export default function AdminLayout({ children, title }: { children: ReactNode; title: string }) {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AdminSidebar />
      <main className="flex-1 ml-64">
        <header className="bg-white border-b border-gray-100 px-8 py-5 sticky top-0 z-30">
          <h1 className="text-2xl font-black text-gray-900">{title}</h1>
        </header>
        <div className="p-8">
          {children}
        </div>
        <footer className="p-8 text-center text-xs text-gray-400">
          Demo by Khevin Andrew Kita - Ed Corporation 0911742202
        </footer>
      </main>
    </div>
  );
}
