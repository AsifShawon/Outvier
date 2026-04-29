export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold text-slate-900 tracking-tight">Welcome to Outvier</h1>
        <p className="text-slate-500 mt-1">Manage your student profile, saved programs, and see your Outvier Fit Score.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border shadow-sm">
          <h3 className="font-semibold text-slate-900">Your Profile</h3>
          <p className="text-sm text-slate-500 mt-2 mb-4">Complete your academic and financial details to get personalized recommendations.</p>
          <a href="/dashboard/profile" className="text-blue-600 text-sm font-medium hover:underline">Update Profile &rarr;</a>
        </div>
        
        <div className="bg-white p-6 rounded-2xl border shadow-sm">
          <h3 className="font-semibold text-slate-900">Saved Items</h3>
          <p className="text-sm text-slate-500 mt-2 mb-4">View the universities and programs you've short-listed for comparison.</p>
          <a href="/dashboard/saved" className="text-blue-600 text-sm font-medium hover:underline">View Saved &rarr;</a>
        </div>
        
        <div className="bg-white p-6 rounded-2xl border shadow-sm">
          <h3 className="font-semibold text-slate-900">Fit Score</h3>
          <p className="text-sm text-slate-500 mt-2 mb-4">See how well your saved programs align with your personal preferences and constraints.</p>
          <a href="/dashboard/student-fit" className="text-blue-600 text-sm font-medium hover:underline">View Fit Score &rarr;</a>
        </div>
      </div>
    </div>
  );
}
