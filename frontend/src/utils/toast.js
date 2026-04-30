import toast from 'react-hot-toast';

/**
 * Utility to show consistent toast notifications
 * @param {string} type - 'success', 'error', 'loading', or 'default'
 * @param {string} message - The message to display
 */
export const showToast = (type, message) => {
  switch (type) {
    case 'success':
      toast.success(message, {
        duration: 4000,
        position: 'top-right',
      });
      break;
    case 'error':
      toast.error(message, {
        duration: 5000,
        position: 'top-right',
      });
      break;
    case 'loading':
      toast.loading(message, {
        position: 'top-right',
      });
      break;
    default:
      toast(message, {
        duration: 4000,
        position: 'top-right',
      });
  }
};

export default showToast;
