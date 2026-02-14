import Table from '@/components/admin/Table';

const columns = [
  { key: 'type', label: 'Proxy Type' },
  { key: 'location', label: 'Location' },
  { key: 'ipCount', label: 'IP Count' },
  { key: 'status', label: 'Status' },
];

const data = [
  {
    type: 'Residential',
    location: 'US',
    ipCount: 1200,
    status: 'Active',
  },
  {
    type: 'Datacenter',
    location: 'Germany',
    ipCount: 500,
    status: 'Active',
  },
  {
    type: 'Mobile',
    location: 'India',
    ipCount: 300,
    status: 'Paused',
  },
];

export default function ProxiesPage() {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Proxies</h2>
      <Table columns={columns} data={data} />
    </div>
  );
}
