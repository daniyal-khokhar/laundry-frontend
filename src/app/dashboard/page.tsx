'use client';

import { useEffect, useState } from 'react';
import {
  IoHome,
  IoAddCircle,
  IoList,
  IoBarChart,
  IoStorefront,
  IoSettings,
} from "react-icons/io5";
import toast from 'react-hot-toast';
import { orderApi } from "@/lib/api";
import { DashboardStats, ServiceType, PaymentStatus } from "@/lib/types";
const statsCards = [
  { name: 'Total Orders', key: 'totalOrders', icon: IoHome, color: 'blue' },
  { name: 'Pending Orders', key: 'pendingOrders', icon: IoAddCircle, color: 'yellow' },
  { name: 'Ready Orders', key: 'readyOrders', icon: IoList, color: 'green' },
  { name: "Today's Revenue", key: 'todayRevenue', icon: IoBarChart, color: 'purple' },
];

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    pendingOrders: 0,
    readyOrders: 0,
    todayRevenue: 0,
    completedOrders: 0,
    revenue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [branchId, setBranchId] = useState('1');

  useEffect(() => {
    loadDashboard();
  }, [branchId]);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const data = await orderApi.getDashboard(branchId);
      setStats(data);
    } catch (error) {
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <select
          value={branchId}
          onChange={(e) => setBranchId(e.target.value)}
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="1">🏪 Decent1 (D1)</option>
          <option value="2">🏪 Decent2 (D2)</option>
          <option value="3">🏪 Decent3 (D3)</option>
        </select>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {statsCards.map((stat) => {
          const Icon = stat.icon;
          const value = stats[stat.key as keyof DashboardStats];
          const colorClasses = {
            blue: 'bg-blue-50 text-blue-600',
            yellow: 'bg-yellow-50 text-yellow-600',
            green: 'bg-green-50 text-green-600',
            purple: 'bg-purple-50 text-purple-600',
          };

          return (
            <div
              key={stat.name}
              className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200 transition-all hover:shadow-md"
            >
              <div className="flex items-center">
                <div className={`rounded-lg p-3 ${colorClasses[stat.color as keyof typeof colorClasses]}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">{stat.name}</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {stat.key === 'todayRevenue' ? `₹${value}` : value}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Orders - You can add a table here */}
      <div className="mt-8 rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Recent Orders</h2>
        <p className="mt-4 text-sm text-gray-500">Recent orders will appear here</p>
      </div>
    </div>
  );
}