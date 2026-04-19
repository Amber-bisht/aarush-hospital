const LoadingScreen = ({ label = 'Loading your workspace...' }) => (
  <div className="flex min-h-screen items-center justify-center px-4">
    <div className="glass-panel w-full max-w-md p-8 text-center">
      <div className="mx-auto mb-4 h-12 w-12 rounded-2xl bg-app-accent/10 p-3">
        <div className="h-full w-full animate-pulse rounded-xl bg-app-accent" />
      </div>
      <h2 className="text-xl font-bold">Hospital Management System</h2>
      <p className="mt-2 text-sm text-app-muted">{label}</p>
    </div>
  </div>
);

export default LoadingScreen;
