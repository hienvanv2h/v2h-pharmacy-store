"use client";
import { useEffect } from "react";

export default function NotificationOverlay({
  message,
  duration = 3000,
  onClose,
}: {
  message?: string;
  duration?: number;
  onClose: () => void;
}) {
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [message, duration, onClose]);

  if (!message) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 w-full mx-auto">
      {/* Background overlay */}
      <div className="absolute inset-0 bg-gray-300 opacity-80"></div>

      {/* Content */}
      <div className="relative text-center text-lg font-bold bg-green-300 border border-gray-300 rounded-lg shadow-lg p-4">
        <p className="text-gray-700">{message}</p>
      </div>
    </div>
  );
}
