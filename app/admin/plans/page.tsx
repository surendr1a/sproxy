import Table from '@/components/admin/Table';

const columns = [
  { key: 'name', label: 'Plan Name' },
  { key: 'price', label: 'Price' },
  { key: 'bandwidth', label: 'Bandwidth' },
  { key: 'status', label: 'Status' },
];

const data = [
  {
    name: 'Starter',
    price: '$19 / month',
    bandwidth: '10 GB',
    status: 'Active',
  },
  {
    name: 'Pro',
    price: '$49 / month',
    bandwidth: '50 GB',
    status: 'Active',
  },
  {
    name: 'Enterprise',
    price: '$199 / month',
    bandwidth: 'Unlimited',
    status: 'Custom',
  },
];

export default function PlansPage() {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Plans</h2>
      <Table columns={columns} data={data} />
    </div>
  );
}
