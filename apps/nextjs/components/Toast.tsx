import { FaCircleCheck, FaCircleXmark, FaXmark } from "react-icons/fa6";
import { useToastStore } from "../store/useToastStore";

export function Toast() {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium shadow-lg
            border transition-all duration-300
            ${
              toast.type === "success"
                ? "bg-card border-green-500/30 text-green-500"
                : "bg-card border-red-500/30 text-red-500"
            }`}
        >
          {toast.type === "success" ? (
            <FaCircleCheck className="shrink-0" />
          ) : (
            <FaCircleXmark className="shrink-0" />
          )}
          <span>{toast.message}</span>
          <button
            onClick={() => removeToast(toast.id)}
            className="ml-2 text-muted-foreground hover:text-foreground"
          >
            <FaXmark />
          </button>
        </div>
      ))}
    </div>
  );
}
