import Table from '@/components/admin/Table';

const columns = [
  { key: 'user', label: 'User' },
  { key: 'plan', label: 'Plan' },
  { key: 'used', label: 'Used Bandwidth' },
  { key: 'limit', label: 'Limit' },
];

const data = [
  {
    user: 'user1@test.com',
    plan: 'Starter',
    used: '6 GB',
    limit: '10 GB',
  },
  {
    user: 'user2@test.com',
    plan: 'Pro',
    used: '22 GB',
    limit: '50 GB',
  },
  {
    user: 'user3@test.com',
    plan: 'Enterprise',
    used: '120 GB',
    limit: 'Unlimited',
  },
];

export default function UsagePage() {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Usage</h2>
      <Table columns={columns} data={data} />
    </div>
  );
}
