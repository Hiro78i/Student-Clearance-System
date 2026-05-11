import Swal from 'sweetalert2'

export function toast(message, icon = 'success') {
  return Swal.fire({
    toast: true,
    position: 'top-end',
    icon,
    title: message,
    showConfirmButton: false,
    timer: 2200,
    timerProgressBar: true,
  })
}

export function confirmAction({
  title,
  text,
  confirmButtonText = 'Confirm',
  icon = 'question',
}) {
  return Swal.fire({
    title,
    text,
    icon,
    showCancelButton: true,
    confirmButtonColor: '#1d4ed8',
    cancelButtonColor: '#64748b',
    confirmButtonText,
    cancelButtonText: 'Cancel',
    reverseButtons: true,
  })
}

export function promptRemarks({ title, inputLabel, confirmButtonText, icon }) {
  return Swal.fire({
    title,
    input: 'textarea',
    inputLabel,
    inputPlaceholder: 'Enter formal remarks for the clearance record',
    inputAttributes: {
      'aria-label': inputLabel,
    },
    icon,
    showCancelButton: true,
    confirmButtonColor: icon === 'error' ? '#be123c' : '#047857',
    cancelButtonColor: '#64748b',
    confirmButtonText,
    cancelButtonText: 'Cancel',
    reverseButtons: true,
    preConfirm: (value) => value?.trim() || null,
  })
}
