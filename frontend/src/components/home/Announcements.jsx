import { ChevronLeft, ChevronRight, Calendar, Eye } from 'lucide-react';

export default function Announcements({
  loadingAnnouncements,
  announcements,
  currentAnnouncementIndex,
  handlePrevAnnouncement,
  handleNextAnnouncement,
  handleAnnouncementIndicatorClick,
  GREEN,
}) {
  // Get icon based on announcement type
  const getAnnouncementIcon = (type) => {
    const icons = {
      'Offer / Promotion': '🎉',
      'Feature Update': '✨',
      Maintenance: '🔧',
      'General Info': '📢',
    };
    return icons[type] || '🚀';
  };

  const currentAnnouncement = announcements[currentAnnouncementIndex];

  // Loading state
  if (loadingAnnouncements) {
    return (
      <section className="border-b border-gray-100 px-4 py-3 sm:px-6 sm:py-5 md:px-16 lg:px-24">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-center justify-center py-4">
            <div
              className="animate-spin rounded-full h-5 w-5 border-b-2"
              style={{ borderColor: GREEN }}
            ></div>
          </div>
        </div>
      </section>
    );
  }

  // No announcements
  if (announcements.length === 0) {
    return null;
  }

  return (
    <section className="border-b border-gray-100 px-4 py-3 sm:px-6 sm:py-5 md:px-16 lg:px-24">
      <div className="mx-auto max-w-6xl">
        <div className="relative px-8 sm:px-10 md:px-12">
          {/* Navigation Buttons */}
          {announcements.length > 1 && (
            <>
              <button
                onClick={handlePrevAnnouncement}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-1 sm:p-2 rounded-full bg-white shadow-md hover:shadow-lg transition-all hover:scale-110"
                style={{ border: `1px solid ${GREEN}20` }}
                aria-label="Previous announcement"
              >
                <ChevronLeft
                  size={16}
                  className="sm:w-5 sm:h-5"
                  style={{ color: GREEN }}
                />
              </button>
              <button
                onClick={handleNextAnnouncement}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-1 sm:p-2 rounded-full bg-white shadow-md hover:shadow-lg transition-all hover:scale-110"
                style={{ border: `1px solid ${GREEN}20` }}
                aria-label="Next announcement"
              >
                <ChevronRight
                  size={16}
                  className="sm:w-5 sm:h-5"
                  style={{ color: GREEN }}
                />
              </button>
            </>
          )}

          {/* Announcement Content */}
          <div className="announcement-slide">
            <div className="flex items-center gap-3 sm:gap-4 rounded-xl border border-gray-200 bg-white px-3 py-3 sm:px-5 sm:py-4 shadow-sm">
              <div className="flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-base sm:text-lg">
                {currentAnnouncement.icon ||
                  getAnnouncementIcon(currentAnnouncement.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-1 sm:gap-2 mb-1">
                  <span className="text-xs sm:text-sm font-semibold text-gray-800">
                    {currentAnnouncement.title}
                  </span>
                  <span
                    style={{ backgroundColor: GREEN }}
                    className="rounded-full px-1.5 sm:px-2 py-0.5 text-[8px] sm:text-[10px] font-bold uppercase tracking-wider text-white"
                  >
                    {currentAnnouncement.type || 'UPDATE'}
                  </span>
                </div>
                <p className="text-[10px] sm:text-xs text-gray-500 leading-relaxed line-clamp-2">
                  {currentAnnouncement.content || currentAnnouncement.description}
                </p>
                <div className="mt-1 sm:mt-1.5 flex items-center gap-2 sm:gap-4 text-[9px] sm:text-[11px] text-gray-400">
                  <span className="flex items-center gap-1">
                    <Calendar size={9} className="sm:w-[11px] sm:h-[11px]" />{' '}
                    {currentAnnouncement.createdAt
                      ? new Date(currentAnnouncement.createdAt).toLocaleDateString()
                      : 'Recent'}
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye size={9} className="sm:w-[11px] sm:h-[11px]" />{' '}
                    {currentAnnouncement.views || 0} views
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Page Indicators */}
          {announcements.length > 1 && (
            <div className="flex justify-center gap-1.5 sm:gap-2 mt-3">
              {announcements.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => handleAnnouncementIndicatorClick(idx)}
                  className={`transition-all duration-300 rounded-full ${
                    currentAnnouncementIndex === idx
                      ? 'w-6 h-1.5 sm:w-8 sm:h-2'
                      : 'w-1.5 h-1.5 sm:w-2 sm:h-2'
                  }`}
                  style={{
                    backgroundColor:
                      currentAnnouncementIndex === idx ? GREEN : GREEN + '40',
                  }}
                  aria-label={`Go to announcement ${idx + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        .announcement-slide {
          animation: slideIn 0.5s ease-out;
        }
      `}</style>
    </section>
  );
}