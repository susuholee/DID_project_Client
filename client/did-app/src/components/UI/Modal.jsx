"use client";

export default function Modal({ isOpen, message, title, children, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="text-black bg-white p-6 rounded-xl shadow-2xl w-[320px] border border-cyan-200">
        {title && (
          <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">{title}</h3>
        )}
        
        {children ? (
          <div className="mb-4">{children}</div>
        ) : (
          <p className="mb-4 text-center text-gray-800 leading-relaxed">{message}</p>
        )}
        
        <div className="flex justify-center">
          <button
            onClick={onClose}
            className="bg-gradient-to-r from-cyan-500 to-cyan-600 text-white px-6 py-2 rounded-lg hover:from-cyan-600 hover:to-cyan-700 transition-all duration-200 font-medium shadow-lg transform hover:scale-105"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
}
