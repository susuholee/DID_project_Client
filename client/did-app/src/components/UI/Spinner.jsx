'use client';

export default function LoadingSpinner({ 
  message = "처리 중...", 
  size = "md",
  color = "rose-400",
  className = "",
  showMessage = true,
  position = "center"
}) {

  const sizeClasses = {
    sm: "h-3 w-3",
    md: "h-4 w-4", 
    lg: "h-6 w-6"
  };


  const textSizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base"
  };

  
  const positionClasses = {
    center: "justify-center",
    left: "justify-start",
    right: "justify-end"
  };

  return (
    <div className={`flex items-center gap-2 ${positionClasses[position]} ${className}`}>
      <div 
        className={`animate-spin ${sizeClasses[size]} border-2 border-${color} rounded-full border-t-transparent`}
        role="status"
        aria-label="로딩 중"
      />

      {showMessage && (
        <span className={`${textSizeClasses[size]} text-gray-600`}>
          {message}
        </span>
      )}
    </div>
  );
}