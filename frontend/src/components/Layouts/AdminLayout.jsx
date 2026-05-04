import AdminSidebar from "../AdminSidebar";

export default function AdminLayout({ children }) {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="w-60 min-h-screen bg-white border-r border-gray-200 flex-shrink-0">
        <AdminSidebar />
      </aside>

      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
