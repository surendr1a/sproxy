'use client';

import React, { useState } from 'react';

/**
 * Batch Page (Dashboard)
 * --------------------------------
 * Purpose:
 * - User apne proxy batches manage kare
 * - Ek batch = proxies ka logical group
 *
 * Future Scope:
 * - Backend se batches fetch
 * - Real proxy counts
 * - Pagination + search
 */

type Batch = {
  id: string;
  name: string;
  proxies: number;
  status: 'active' | 'paused';
  createdAt: string;
};

export default function BatchPage() {
  const [batches, setBatches] = useState<Batch[]>([
    {
      id: '1',
      name: 'Instagram Automation',
      proxies: 120,
      status: 'active',
      createdAt: '2026-02-01',
    },
    {
      id: '2',
      name: 'Scraping Batch EU',
      proxies: 80,
      status: 'paused',
      createdAt: '2026-01-28',
    },
  ]);

  const [batchName, setBatchName] = useState('');

  /**
   * Create new batch (frontend only for now)
   */
  const createBatch = () => {
    if (!batchName.trim()) return;

    const newBatch: Batch = {
      id: Date.now().toString(),
      name: batchName,
      proxies: 0,
      status: 'active',
      createdAt: new Date().toISOString().split('T')[0],
    };

    setBatches([newBatch, ...batches]);
    setBatchName('');
  };

  /**
   * Toggle batch status
   */
  const toggleStatus = (id: string) => {
    setBatches(prev =>
      prev.map(batch =>
        batch.id === id
          ? {
              ...batch,
              status: batch.status === 'active' ? 'paused' : 'active',
            }
          : batch
      )
    );
  };

  /**
   * Delete batch
   */
  const deleteBatch = (id: string) => {
    if (!confirm('Are you sure you want to delete this batch?')) return;
    setBatches(prev => prev.filter(batch => batch.id !== id));
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Proxy Batches</h1>
          <p className="text-gray-500 mt-1">
            Manage and organize your proxy groups
          </p>
        </div>
      </div>

      {/* Create Batch */}
      <div className="bg-white rounded-xl shadow p-6 mb-10">
        <h2 className="text-lg font-semibold mb-4">Create New Batch</h2>

        <div className="flex gap-4">
          <input
            type="text"
            placeholder="Batch name (e.g. Twitter Scraper)"
            value={batchName}
            onChange={e => setBatchName(e.target.value)}
            className="flex-1 border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black"
          />
          <button
            onClick={createBatch}
            className="bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800"
          >
            Create
          </button>
        </div>
      </div>

      {/* Batch List */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-sm font-medium">Batch Name</th>
              <th className="px-6 py-4 text-sm font-medium">Proxies</th>
              <th className="px-6 py-4 text-sm font-medium">Status</th>
              <th className="px-6 py-4 text-sm font-medium">Created</th>
              <th className="px-6 py-4 text-sm font-medium text-right">
                Actions
              </th>
            </tr>
          </thead>

          <tbody>
            {batches.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-10 text-center text-gray-500"
                >
                  No batches created yet
                </td>
              </tr>
            )}

            {batches.map(batch => (
              <tr
                key={batch.id}
                className="border-t hover:bg-gray-50 transition"
              >
                <td className="px-6 py-4 font-medium">{batch.name}</td>
                <td className="px-6 py-4">{batch.proxies}</td>
                <td className="px-6 py-4">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      batch.status === 'active'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}
                  >
                    {batch.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {batch.createdAt}
                </td>
                <td className="px-6 py-4 text-right space-x-3">
                  <button
                    onClick={() => toggleStatus(batch.id)}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    {batch.status === 'active' ? 'Pause' : 'Activate'}
                  </button>
                  <button
                    onClick={() => deleteBatch(batch.id)}
                    className="text-sm text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
