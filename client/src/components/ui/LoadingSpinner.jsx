// Loading component for data fetching states
export const LoadingSpinner = ({ className = "" }) => (
  <div className={`flex items-center justify-center p-8 ${className}`}>
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
  </div>
)