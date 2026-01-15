// Reusable Card component
import { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  className?: string;
}

export function Card({ children, title, subtitle, className = "" }: CardProps) {
  return (
    <div className={`bg-gray-800 rounded-xl border border-gray-700 shadow-xl ${className}`}>
      {(title || subtitle) && (
        <div className="px-6 py-4 border-b border-gray-700">
          {title && <h2 className="text-lg font-semibold text-white">{title}</h2>}
          {subtitle && <p className="text-sm text-gray-400 mt-1">{subtitle}</p>}
        </div>
      )}
      <div className="p-6">
        {children}
      </div>
    </div>
  );
}
