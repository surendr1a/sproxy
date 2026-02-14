import StatCard from '@/components/admin/StatCard';

export default function AdminDashboard() {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Overview</h2>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard title="Total Users" value="124" />
        <StatCard title="Active Proxies" value="58" />
        <StatCard title="Monthly Usage" value="312 GB" />
        <StatCard title="Revenue" value="$1,240" />
      </div>
    </div>
  );
}
