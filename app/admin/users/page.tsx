export default function UsersPage() {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Users</h2>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-3 text-left">Email</th>
              <th className="p-3 text-left">Plan</th>
              <th className="p-3 text-left">Usage</th>
              <th className="p-3 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t">
              <td className="p-3">user@test.com</td>
              <td className="p-3">Pro</td>
              <td className="p-3">12 GB</td>
              <td className="p-3 text-green-600">Active</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
