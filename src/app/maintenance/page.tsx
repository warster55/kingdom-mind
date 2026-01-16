/**
 * Maintenance Page
 * Shown when site_enabled is set to false in app_config
 */
export default function MaintenancePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-slate-900 to-slate-800 text-white p-8">
      <div className="max-w-md text-center space-y-6">
        {/* Icon */}
        <div className="text-6xl mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-24 w-24 mx-auto text-amber-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
            />
          </svg>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-serif font-bold text-amber-100">
          Kingdom Mind
        </h1>

        {/* Message */}
        <p className="text-lg text-slate-300 leading-relaxed">
          We&apos;re taking a moment to improve your experience.
          Please check back shortly.
        </p>

        {/* Scripture */}
        <p className="text-sm text-slate-400 italic mt-8">
          &quot;But they who wait for the Lord shall renew their strength&quot;
          <br />
          <span className="text-xs not-italic">— Isaiah 40:31</span>
        </p>
      </div>
    </div>
  );
}
