"use client";

interface DeleteButtonProps {
  label?: string;
  message?: string;
}

export function DeleteButton({ label = "Delete", message = "This cannot be undone." }: DeleteButtonProps) {
  function handleClick(e: React.MouseEvent) {
    if (!confirm(`${label}? ${message}`)) {
      e.preventDefault();
    }
  }

  return (
    <button
      type="submit"
      onClick={handleClick}
      className="rounded-md bg-red-500/10 px-4 py-2 text-sm font-medium text-red-500 hover:bg-red-500/20"
    >
      {label}
    </button>
  );
}
