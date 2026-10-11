// Error component for data fetching errors
export const ErrorMessage = ({ error, retry, className = "" }) => (
  <div className={`flex flex-col items-center justify-center p-8 text-center ${className}`}>
    <div className="text-red-400 mb-2">⚠️</div>
    <p className="text-sm text-red-400 mb-4">{error || 'Something went wrong'}</p>
    {retry && (
      <button 
        onClick={retry} 
        className="btn-secondary btn-sm"
      >
        Try Again
      </button>
    )}
  </div>
)