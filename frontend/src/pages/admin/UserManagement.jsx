import { useState, useEffect } from 'react';
import { userService } from '../../services/userService';
import ViewUserModal from './ViewUserModal';
import Header from '../../components/Layouts/Header';
import Footer from '../../components/Layouts/Footer';

const roleStyles = {
  Vendor: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  Buyer: 'bg-violet-50 text-violet-700 border border-violet-200',
  admin: 'bg-amber-50 text-amber-700 border border-amber-200',
};

const statusStyles = {
  active: { pill: 'bg-green-50 text-green-700', dot: 'bg-green-500' },
  suspended: { pill: 'bg-red-50 text-red-600', dot: 'bg-red-400' },
};

function Avatar({ user }) {
  if (user.profilePicture) {
    return (
      <img
        src={user.profilePicture}
        alt={user.fullname}
        className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover"
      />
    );
  }

  // Generate initials from fullname
  const initials = user.fullname
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const colorClasses = {
    Vendor: 'bg-emerald-100 text-emerald-600',
    Buyer: 'bg-violet-100 text-violet-600',
    admin: 'bg-amber-100 text-amber-600',
  };

  const bgColor = colorClasses[user.role] || 'bg-gray-100 text-gray-600';

  return (
    <div
      className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full ${bgColor} flex items-center justify-center text-xs font-semibold tracking-wide`}
    >
      {initials}
    </div>
  );
}

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [date, setDate] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  const [stats, setStats] = useState({
    totalUsers: 0,
    buyers: 0,
    vendors: 0,
    suspended: 0,
  });
  const [suspendingId, setSuspendingId] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const USERS_PER_PAGE = 7;

  // Fetch users from API
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await userService.getUsers();

      if (response.success) {
        const userData = response.users;
        setUsers(userData);

        // Calculate stats
        const buyers = userData.filter((u) => u.role === 'Buyer').length;
        const vendors = userData.filter((u) => u.role === 'Vendor').length;
        const suspended = userData.filter((u) => u.isSuspended).length;

        setStats({
          totalUsers: response.count,
          buyers,
          vendors,
          suspended,
        });
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Filter users
  const filteredUsers = users.filter((user) => {
    const matchSearch =
      !search ||
      user.fullname.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase());

    const matchRole = !roleFilter || user.role === roleFilter;
    const matchStatus =
      !statusFilter ||
      (statusFilter === 'active' && !user.isSuspended) ||
      (statusFilter === 'suspended' && user.isSuspended);

    // Date filter (if date is selected)
    let matchDate = true;
    if (date) {
      const userDate = new Date(user.createdAt).toISOString().split('T')[0];
      matchDate = userDate === date;
    }

    return matchSearch && matchRole && matchStatus && matchDate;
  });

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / USERS_PER_PAGE);
  const startIndex = (page - 1) * USERS_PER_PAGE;
  const paginatedUsers = filteredUsers.slice(
    startIndex,
    startIndex + USERS_PER_PAGE,
  );

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [search, roleFilter, statusFilter, date]);

  // Toggle user suspension 
  const toggleSuspend = async (userId) => {
    try {
      // Find the current user to check their suspension status
      const currentUser = users.find((u) => u._id === userId);
      if (!currentUser) return;

      const isCurrentlySuspended = currentUser.isSuspended || false;

      setSuspendingId(userId);

      //  Update UI immediately
      const updatedUsers = users.map((u) =>
        u._id === userId ? { ...u, isSuspended: !u.isSuspended } : u
      );
      setUsers(updatedUsers);

      // Update stats optimistically
      setStats((prev) => ({
        ...prev,
        suspended: prev.suspended + (isCurrentlySuspended ? -1 : 1),
      }));

      // Close modal if the suspended/restored user is currently viewed
      if (selectedUser && selectedUser._id === userId) {
        setSelectedUser(null);
      }

      // Make API call
      const response = await userService.toggleSuspend(
        userId,
        isCurrentlySuspended,
      );

      if (!response.success) {
        // Revert on error
        setUsers(users);
        setStats((prev) => ({
          ...prev,
          suspended: prev.suspended - (isCurrentlySuspended ? -1 : 1),
        }));
        throw new Error(response.message || 'Failed to update user status');
      }

      // If API returns updated user data, use it to ensure consistency
      if (response.user) {
        setUsers((prevUsers) =>
          prevUsers.map((u) =>
            u._id === userId ? { ...response.user } : u
          )
        );
      }

      // Adjust page if current page becomes empty after filter change
      const newFilteredCount = filteredUsers.length + (isCurrentlySuspended ? 1 : -1);
      const newTotalPages = Math.ceil(newFilteredCount / USERS_PER_PAGE);
      if (page > newTotalPages && newTotalPages > 0) {
        setPage(newTotalPages);
      } else if (paginatedUsers.length === 1 && page > 1) {
        // If this was the last item on the page, go to previous page
        setPage(page - 1);
      }

      // Show success message
      const action = isCurrentlySuspended ? 'restored' : 'suspended';
      console.log(`User ${action} successfully`);
      
    } catch (err) {
      console.error('Error toggling suspension:', err);
      alert(
        err.response?.data?.message ||
          err.message ||
          'Failed to update user status',
      );
    } finally {
      setSuspendingId(null);
    }
  };

  // View user details
  const handleViewUser = (user) => {
    setSelectedUser(user);
  };

  // Close modal
  const handleCloseModal = () => {
    setSelectedUser(null);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
    });
  };

  // Generate pagination buttons
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      if (page <= 3) {
        for (let i = 1; i <= 4; i++) pageNumbers.push(i);
        pageNumbers.push('...');
        pageNumbers.push(totalPages);
      } else if (page >= totalPages - 2) {
        pageNumbers.push(1);
        pageNumbers.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) pageNumbers.push(i);
      } else {
        pageNumbers.push(1);
        pageNumbers.push('...');
        for (let i = page - 1; i <= page + 1; i++) pageNumbers.push(i);
        pageNumbers.push('...');
        pageNumbers.push(totalPages);
      }
    }

    return pageNumbers;
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
          <div className="w-full max-w-7xl mx-auto">
            <div className="text-center">
              <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-emerald-600 mx-auto"></div>
              <p className="mt-3 sm:mt-4 text-sm sm:text-base text-gray-600">
                Loading users...
              </p>
            </div>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (error) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
          <div className="w-full max-w-7xl mx-auto">
            <div className="text-center">
              <div className="text-red-600 text-base sm:text-lg mb-2">
                ⚠️ {error}
              </div>
              <button
                onClick={fetchUsers}
                className="px-3 py-1.5 sm:px-4 sm:py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 font-sans">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-3 sm:py-4 md:py-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 tracking-tight">
              User Management
            </h1>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-2 sm:gap-3 md:gap-4 mb-4 sm:mb-6">
            {[
              {
                label: 'Total Users',
                value: stats.totalUsers.toLocaleString(),
              },
              { label: 'Active Buyers', value: stats.buyers.toLocaleString() },
              {
                label: 'Active Vendors',
                value: stats.vendors.toLocaleString(),
              },
              { label: 'Suspended', value: stats.suspended.toLocaleString() },
            ].map((stat) => (
              <div
                key={stat.label}
                className="bg-white rounded-lg sm:rounded-xl border border-gray-100 shadow-sm p-2.5 sm:p-3 md:p-5 hover:shadow-md transition-all active:scale-95 sm:active:scale-100"
              >
                <p className="text-[8px] sm:text-[10px] md:text-xs text-gray-400 font-medium uppercase tracking-wider mb-0.5 sm:mb-1">
                  {stat.label}
                </p>
                <p className="text-base sm:text-lg md:text-2xl lg:text-3xl font-bold text-gray-900">
                  {stat.value}
                </p>
              </div>
            ))}
          </div>

          {/* Table Card */}
          <div className="bg-white rounded-lg sm:rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Filters - NOW ONLY 2 ROWS */}
            <div className="p-3 sm:p-4 border-b border-gray-100">
              {/* Row 1: Search and Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 mb-2 sm:mb-3">
                <div className="relative">
                  <svg
                    className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
                    />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-7 sm:pl-9 pr-2 sm:pr-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder-gray-400"
                  />
                </div>
                <div className="relative">
                  <svg
                    className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z"
                    />
                  </svg>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full pl-7 sm:pl-9 pr-2 sm:pr-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-500"
                  />
                </div>
              </div>
              
              {/* Row 2: Role and Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-500 bg-white cursor-pointer"
                >
                  <option value="">All Roles</option>
                  <option value="Vendor">Vendor</option>
                  <option value="Buyer">Buyer</option>
                  <option value="admin">Admin</option>
                </select>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-500 bg-white cursor-pointer"
                >
                  <option value="">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              {/* Desktop Table View */}
              <div className="hidden md:block">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      {[
                        'User',
                        'Email',
                        'Role',
                        'Status',
                        'Join Date',
                        'Actions',
                      ].map((h) => (
                        <th
                          key={h}
                          className="text-left px-4 md:px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {paginatedUsers.map((user) => {
                      const isSuspended = user.isSuspended || false;
                      return (
                        <tr
                          key={user._id}
                          className={`hover:bg-gray-50 transition-colors ${isSuspended ? 'opacity-50 bg-gray-50' : ''}`}
                        >
                          <td className="px-4 md:px-5 py-3.5">
                            <div className="flex items-center gap-3">
                              <Avatar user={user} />
                              <span className="font-medium text-gray-800 truncate max-w-[150px]">
                                {user.fullname}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 md:px-5 py-3.5">
                            <span className="text-gray-500 truncate block max-w-[200px]">
                              {user.email}
                            </span>
                          </td>
                          <td className="px-4 md:px-5 py-3.5">
                            <span
                              className={`inline-flex text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap ${roleStyles[user.role]}`}
                            >
                              {user.role === 'admin' ? 'Admin' : user.role}
                            </span>
                          </td>
                          <td className="px-4 md:px-5 py-3.5">
                            <span
                              className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap ${isSuspended ? statusStyles.suspended.pill : statusStyles.active.pill}`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${isSuspended ? statusStyles.suspended.dot : statusStyles.active.dot}`}
                              />
                              {isSuspended ? 'Suspended' : 'Active'}
                            </span>
                          </td>
                          <td className="px-4 md:px-5 py-3.5">
                            <span className="text-gray-500 whitespace-nowrap">
                              {formatDate(user.createdAt)}
                            </span>
                          </td>
                          <td className="px-4 md:px-5 py-3.5">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleViewUser(user)}
                                className="text-xs font-medium px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-gray-600 whitespace-nowrap"
                              >
                                View
                              </button>
                              <button
                                onClick={() => toggleSuspend(user._id)}
                                disabled={suspendingId === user._id}
                                className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors whitespace-nowrap ${
                                  isSuspended
                                    ? 'border-green-200 text-green-600 hover:bg-green-50'
                                    : 'border-red-200 text-red-500 hover:bg-red-50'
                                } ${suspendingId === user._id ? 'opacity-50 cursor-not-allowed' : ''}`}
                              >
                                {suspendingId === user._id
                                  ? 'Processing...'
                                  : isSuspended
                                    ? 'Restore'
                                    : 'Suspend'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden divide-y divide-gray-100">
                {paginatedUsers.map((user) => {
                  const isSuspended = user.isSuspended || false;
                  return (
                    <div
                      key={user._id}
                      className={`p-3 sm:p-4 ${isSuspended ? 'opacity-50 bg-gray-50' : ''}`}
                    >
                      <div className="flex items-start justify-between mb-2 sm:mb-3">
                        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                          <Avatar user={user} />
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate">
                              {user.fullname}
                            </h3>
                            <p className="text-xs text-gray-500 mt-0.5 truncate">
                              {user.email}
                            </p>
                          </div>
                        </div>
                        <span
                          className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full ml-2 ${isSuspended ? statusStyles.suspended.pill : statusStyles.active.pill}`}
                        >
                          <span
                            className={`w-1 h-1 rounded-full ${isSuspended ? statusStyles.suspended.dot : statusStyles.active.dot}`}
                          />
                          {isSuspended ? 'Suspended' : 'Active'}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 mb-2 sm:mb-3 text-sm">
                        <div>
                          <p className="text-[10px] sm:text-xs text-gray-400 mb-0.5">
                            Role
                          </p>
                          <span
                            className={`inline-flex text-xs font-medium px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full ${roleStyles[user.role]}`}
                          >
                            {user.role === 'admin' ? 'Admin' : user.role}
                          </span>
                        </div>
                        <div>
                          <p className="text-[10px] sm:text-xs text-gray-400 mb-0.5">
                            Join Date
                          </p>
                          <p className="text-gray-600 text-xs">
                            {formatDate(user.createdAt)}
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleViewUser(user)}
                          className="flex-1 text-xs font-medium px-2 sm:px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-gray-600 active:bg-gray-100"
                        >
                          View Details
                        </button>
                        <button
                          onClick={() => toggleSuspend(user._id)}
                          disabled={suspendingId === user._id}
                          className={`flex-1 text-xs font-medium px-2 sm:px-3 py-1.5 rounded-lg border transition-colors active:scale-95 ${
                            isSuspended
                              ? 'border-green-200 text-green-600 hover:bg-green-50 active:bg-green-100'
                              : 'border-red-200 text-red-500 hover:bg-red-50 active:bg-red-100'
                          } ${suspendingId === user._id ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          {suspendingId === user._id
                            ? 'Processing...'
                            : isSuspended
                              ? 'Restore'
                              : 'Suspend'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {paginatedUsers.length === 0 && (
                <div className="text-center py-8 sm:py-12">
                  <svg
                    className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-gray-300 mb-3 sm:mb-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                  <p className="text-gray-500 text-sm sm:text-base">
                    No users found
                  </p>
                  <p className="text-xs sm:text-sm text-gray-400 mt-1">
                    Try adjusting your search or filters
                  </p>
                </div>
              )}
            </div>

            {/* Pagination */}
            {filteredUsers.length > 0 && (
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between px-3 sm:px-4 md:px-5 py-3 border-t border-gray-100 bg-gray-50/50">
                <p className="text-[10px] sm:text-xs text-gray-400 text-center sm:text-left">
                  Showing {startIndex + 1} to{' '}
                  {Math.min(startIndex + USERS_PER_PAGE, filteredUsers.length)}{' '}
                  of{' '}
                  <span className="font-medium text-gray-600">
                    {filteredUsers.length}
                  </span>{' '}
                  users
                </p>
                <div className="flex items-center justify-center gap-0.5 sm:gap-1 flex-wrap">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-2 sm:px-3 py-1 text-[10px] sm:text-xs font-medium border border-gray-200 rounded-lg hover:bg-white transition-colors text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed active:bg-gray-100"
                  >
                    Previous
                  </button>

                  {getPageNumbers().map((pageNum, index) => (
                    <button
                      key={index}
                      onClick={() =>
                        typeof pageNum === 'number' && setPage(pageNum)
                      }
                      className={`min-w-[28px] sm:min-w-[32px] h-7 sm:h-8 text-[10px] sm:text-xs font-medium rounded-lg transition-colors active:scale-95 ${
                        page === pageNum
                          ? 'bg-emerald-600 text-white border border-emerald-600'
                          : pageNum === '...'
                            ? 'border-none cursor-default text-gray-400'
                            : 'border border-gray-200 text-gray-600 hover:bg-white active:bg-gray-100'
                      }`}
                      disabled={pageNum === '...'}
                    >
                      {pageNum}
                    </button>
                  ))}

                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-2 sm:px-3 py-1 text-[10px] sm:text-xs font-medium border border-gray-200 rounded-lg hover:bg-white transition-colors text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed active:bg-gray-100"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* View User Modal */}
          {selectedUser && (
            <ViewUserModal
              user={selectedUser}
              onClose={handleCloseModal}
              onSuspend={toggleSuspend}
              suspendingId={suspendingId}
            />
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}