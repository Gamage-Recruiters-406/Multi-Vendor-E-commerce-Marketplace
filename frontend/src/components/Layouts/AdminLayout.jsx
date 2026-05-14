import AdminSidebar from "../AdminSidebar";

export default function AdminLayout({ children }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <aside className="fixed left-0 top-0 bottom-0 z-50 w-60 bg-white border-r border-gray-200">
        <AdminSidebar />
      </aside>

      <div className="pl-60 min-h-screen">
        <main className="w-full min-h-screen bg-gray-50">{children}</main>
      </div>
    </div>
  );
}
