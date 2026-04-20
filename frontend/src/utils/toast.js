import Swal from "sweetalert2";

const Toast = Swal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 2000,
  width: "350px",
  padding: "6px 10px",
  customClass: {
    popup: "text-sm rounded-lg",
    title: "text-sm",
  },
});

export const showToast = (icon, title) => {
  Toast.fire({
    icon,
    title,
  });
};