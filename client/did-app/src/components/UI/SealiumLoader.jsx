'use client';

export default function SealiumLoader({ 
  message = "Sealium 로딩 중...", 
  size = "md",
  className = ""
}) {

  const sizeClasses = {
    sm: {
      container: "w-32 h-16",
      ball: "w-6 h-6",
      logo: "w-8 h-8",
      text: "text-sm"
    },
    md: {
      container: "w-48 h-20",
      ball: "w-8 h-8", 
      logo: "w-12 h-12",
      text: "text-base"
    },
    lg: {
      container: "w-64 h-24",
      ball: "w-10 h-10",
      logo: "w-16 h-16",
      text: "text-lg"
    }
  };

  const currentSize = sizeClasses[size];

  return (
    <div className={`flex flex-col items-center justify-center gap-6 ${className}`}>
  
      <div className="relative">
  
        <svg className="absolute">
          <defs>
            <filter id="sealium-goo">
              <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
              <feColorMatrix 
                in="blur" 
                mode="matrix" 
                values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7" 
                result="goo" 
              />
            </filter>
          </defs>
        </svg>

       
        <div className={`${currentSize.container} relative`}>
       
          <div className={`absolute ${currentSize.ball} bg-cyan-400 rounded-full animate-move-ball shadow-cyan-200 shadow-lg`}></div>
          
      
          <div className="flex items-center justify-between w-full h-full" style={{ filter: 'url(#sealium-goo)' }}>
            <div className={`${currentSize.ball} bg-cyan-300 rounded-full animate-scale-1`}></div>
            <div className={`${currentSize.ball} bg-cyan-300 rounded-full animate-scale-2`}></div>
            <div className={`${currentSize.ball} bg-cyan-300 rounded-full animate-scale-3`}></div>
            <div className={`${currentSize.ball} bg-cyan-300 rounded-full animate-scale-4`}></div>
          </div>
        </div>
      </div>
      <div className={`${currentSize.text} animate-pulse`}>
        {message}
      </div>

    </div>
  );
}
