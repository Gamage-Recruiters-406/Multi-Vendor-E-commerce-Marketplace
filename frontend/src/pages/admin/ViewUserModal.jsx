import { useEffect } from 'react';

const roleStyles = {
  Vendor: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  Buyer: 'bg-violet-50 text-violet-700 border border-violet-200',
  admin: 'bg-amber-50 text-amber-700 border border-amber-200',
};

const statusStyles = {
  active: { pill: 'bg-green-50 text-green-700', dot: 'bg-green-500' },
  suspended: { pill: 'bg-red-50 text-red-600', dot: 'bg-red-400' },
};

export default function ViewUserModal({
  user,
  onClose,
  onSuspend,
  suspendingId,
}) {
  // Add body scroll lock and blur effect when modal opens
  useEffect(() => {
    // Add classes to body when modal opens
    document.body.classList.add('overflow-hidden');
    document.body.classList.add('modal-open');

    // Create and append style for blur effect if not exists
    if (!document.querySelector('#modal-blur-style')) {
      const style = document.createElement('style');
      style.id = 'modal-blur-style';
      style.textContent = `
        body.modal-open .blur-target {
          filter: blur(4px);
          transition: filter 0.3s ease;
        }
        @media (max-width: 640px) {
          body.modal-open .blur-target {
            filter: blur(2px);
          }
        }
      `;
      document.head.appendChild(style);
    }

    // Cleanup when modal closes
    return () => {
      document.body.classList.remove('overflow-hidden');
      document.body.classList.remove('modal-open');
    };
  }, []);

  if (!user) return null;

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isSuspended = user.isSuspended || false;

  return (
    <>
      {/* Backdrop with blur effect */}
      <div
        className="fixed inset-0 z-50"
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
        }}
        onClick={onClose}
      />

      {/* Modal  */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="relative bg-white rounded-2xl shadow-xl w-full sm:max-w-2xl transform transition-all animate-scale-in"
          onClick={(e) => e.stopPropagation()}
          style={{
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            margin: 'auto',
          }}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 sm:top-4 sm:right-4 text-gray-400 hover:text-gray-600 transition-colors z-10 p-1.5 sm:p-0 rounded-full bg-white/90 sm:bg-transparent shadow-sm sm:shadow-none"
            aria-label="Close modal"
          >
            <svg
              className="w-5 h-5 sm:w-5 sm:h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          {/* Header */}
          <div className="border-b border-gray-100 px-4 sm:px-6 py-3 sm:py-4 sticky top-0 bg-white rounded-t-2xl z-10">
            <div className="flex items-center gap-3 sm:gap-4">
              {/* Avatar */}
              {user.profilePicture ? (
                <img
                  src={user.profilePicture}
                  alt={user.fullname}
                  className="w-12 h-12 sm:w-16 sm:h-16 rounded-full object-cover ring-2 sm:ring-4 ring-gray-100"
                />
              ) : (
                <div
                  className={`w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center text-base sm:text-xl font-semibold ${
                    user.role === 'Vendor'
                      ? 'bg-emerald-100 text-emerald-600'
                      : user.role === 'Buyer'
                        ? 'bg-violet-100 text-violet-600'
                        : 'bg-amber-100 text-amber-600'
                  }`}
                >
                  {user.fullname
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2)}
                </div>
              )}

              <div className="flex-1 min-w-0">
                <h2 className="text-lg sm:text-2xl font-bold text-gray-900 truncate">
                  {user.fullname}
                </h2>
                <div className="flex items-center gap-1.5 sm:gap-2 mt-1 flex-wrap">
                  <span
                    className={`inline-flex text-xs sm:text-xs font-medium px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full ${roleStyles[user.role]}`}
                  >
                    {user.role === 'admin' ? 'Admin' : user.role}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 sm:gap-1.5 text-xs sm:text-xs font-medium px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full ${isSuspended ? statusStyles.suspended.pill : statusStyles.active.pill}`}
                  >
                    <span
                      className={`w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full ${isSuspended ? statusStyles.suspended.dot : statusStyles.active.dot}`}
                    />
                    {isSuspended ? 'Suspended' : 'Active'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Content - scrollable area */}
          <div
            className="px-4 sm:px-6 py-4 sm:py-5 overflow-y-auto flex-1"
            style={{ maxHeight: 'calc(90vh - 180px)' }}
          >
            {/* Personal Information */}
            <div className="mb-4 sm:mb-6">
              <h3 className="text-xs sm:text-sm font-semibold text-gray-900 uppercase tracking-wider mb-2 sm:mb-3 flex items-center gap-2">
                <svg
                  className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                Personal Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 bg-gray-50 rounded-xl p-3 sm:p-4">
                <div>
                  <p className="text-[10px] sm:text-xs text-gray-400 mb-0.5">
                    Full Name
                  </p>
                  <p className="text-xs sm:text-sm font-medium text-gray-900 break-words">
                    {user.fullname}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] sm:text-xs text-gray-400 mb-0.5">
                    Email Address
                  </p>
                  <p className="text-xs sm:text-sm text-gray-700 break-all">
                    {user.email}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] sm:text-xs text-gray-400 mb-0.5">
                    Phone Number
                  </p>
                  <p className="text-xs sm:text-sm text-gray-700">
                    {user.phone || 'Not provided'}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] sm:text-xs text-gray-400 mb-0.5">
                    Role
                  </p>
                  <p className="text-xs sm:text-sm text-gray-700 capitalize">
                    {user.role}
                  </p>
                </div>
              </div>
            </div>

            {/* Account Status */}
            <div className="mb-4 sm:mb-6">
              <h3 className="text-xs sm:text-sm font-semibold text-gray-900 uppercase tracking-wider mb-2 sm:mb-3 flex items-center gap-2">
                <svg
                  className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
                Account Status
              </h3>
              <div className="bg-gray-50 rounded-xl p-3 sm:p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
                  <div>
                    <p className="text-[10px] sm:text-xs text-gray-400 mb-0.5">
                      Account Created
                    </p>
                    <p className="text-xs sm:text-sm text-gray-700">
                      {formatDateTime(user.createdAt)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] sm:text-xs text-gray-400 mb-0.5">
                      Last Updated
                    </p>
                    <p className="text-xs sm:text-sm text-gray-700">
                      {formatDateTime(user.updatedAt)}
                    </p>
                  </div>
                  {isSuspended && (
                    <>
                      <div className="col-span-1 sm:col-span-2">
                        <p className="text-[10px] sm:text-xs text-gray-400 mb-0.5">
                          Suspended At
                        </p>
                        <p className="text-xs sm:text-sm text-red-600">
                          {formatDateTime(user.suspendedAt) || 'N/A'}
                        </p>
                      </div>
                      <div className="col-span-1 sm:col-span-2">
                        <p className="text-[10px] sm:text-xs text-gray-400 mb-0.5">
                          Suspension Reason
                        </p>
                        <p className="text-xs sm:text-sm text-red-600">
                          {user.suspensionReason || 'No reason provided'}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Addresses Section */}
            {user.addresses && user.addresses.length > 0 && (
              <div className="mb-4 sm:mb-6">
                <h3 className="text-xs sm:text-sm font-semibold text-gray-900 uppercase tracking-wider mb-2 sm:mb-3 flex items-center gap-2">
                  <svg
                    className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  Saved Addresses ({user.addresses.length})
                </h3>
                <div className="space-y-2 sm:space-y-3">
                  {user.addresses.map((address, index) => (
                    <div
                      key={address._id || index}
                      className="bg-gray-50 rounded-xl p-2.5 sm:p-4"
                    >
                      <p className="text-xs sm:text-sm text-gray-800 break-words leading-relaxed">
                        {address.street}, {address.city}, {address.district}
                        {address.postalCode && `, ${address.postalCode}`}
                        <br />
                        {address.country || 'Sri Lanka'}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="border-t border-gray-100 px-4 sm:px-6 py-3 sm:py-4 flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 justify-end sticky bottom-0 bg-white rounded-b-2xl">
            <button
              onClick={onClose}
              className="px-3 py-2 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors active:bg-gray-100"
            >
              Close
            </button>
            <button
              onClick={() => onSuspend(user._id)} // Only pass userId 
              disabled={suspendingId === user._id}
              className={`px-3 py-2 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors ${
                isSuspended
                  ? 'bg-green-600 text-white hover:bg-green-700 active:bg-green-800 border border-green-600'
                  : 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 border border-red-600'
              } ${suspendingId === user._id ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {suspendingId === user._id
                ? 'Processing...'
                : isSuspended
                  ? 'Restore Account'
                  : 'Suspend Account'}
            </button>
          </div>
        </div>
      </div>

      {/* Animation styles */}
      <style jsx>{`
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(-10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        .animate-scale-in {
          animation: scaleIn 0.2s ease-out;
        }

        /* Improve touch targets on mobile */
        @media (max-width: 640px) {
          button {
            cursor: pointer;
            -webkit-tap-highlight-color: transparent;
          }
        }
      `}</style>
    </>
  );
}