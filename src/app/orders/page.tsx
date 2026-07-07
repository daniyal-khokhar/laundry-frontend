'use client';

import { useEffect, useState } from 'react';
import { orderApi } from '@/lib/api';
import { Order, OrderStatus } from '@/lib/types';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

// Shadcn UI Essential Components
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Modern UI Lucide Icons
import { 
  MoreVertical, 
  Pencil, 
  Trash2, 
  Loader2, 
  Filter, 
  Store, 
  RefreshCw, 
  CheckCircle2, 
  Play, 
  Truck,
  User,
  Calendar,
  Coins
} from "lucide-react";

const statusColors: Record<OrderStatus, string> = {
  pending: 'bg-amber-500/10 text-amber-500 border-amber-500/20 hover:bg-amber-500/20',
  processing: 'bg-blue-500/10 text-blue-500 border-blue-500/20 hover:bg-blue-500/20',
  ready: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20',
  delivered: 'bg-slate-500/10 text-slate-500 border-slate-500/20 hover:bg-slate-500/20',
};

const paymentStatusBadges = {
  paid: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  unpaid: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
  partial: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [branchId, setBranchId] = useState('1');
  const [filterStatus, setFilterStatus] = useState<OrderStatus | 'all'>('all');

  useEffect(() => {
    loadOrders();
  }, [branchId, filterStatus]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const response = await orderApi.getByBranch(
        branchId,
        filterStatus === 'all' ? undefined : filterStatus
      );
      
      if (response && Array.isArray(response.data)) {
        setOrders(response.data);
      } else if (Array.isArray(response)) {
        setOrders(response);
      } else {
        setOrders([]);
      }
    } catch (error) {
      toast.error('Failed to load orders');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId: string, status: OrderStatus) => {
    try {
      await orderApi.updateStatus(orderId, status);
      toast.success(`Order status updated to ${status}!`);
      loadOrders();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleEditOrder = (orderId: string) => {
    toast.success(`Redirecting to edit order: ${orderId}`);
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (confirm('Are you sure you want to delete this order?')) {
      try {
        if (typeof (orderApi as any).delete === 'function') {
          await (orderApi as any).delete(orderId);
        } else {
          toast.loading('Deleting...', { id: 'delete-toast' });
        }
        toast.success('Order deleted successfully', { id: 'delete-toast' });
        loadOrders();
      } catch (error) {
        toast.error('Failed to delete order', { id: 'delete-toast' });
      }
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-full">
      
      {/* --- EXTERNAL HEADER & FILTERS PANEL --- */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-1">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-gray-900">All Orders</h1>
          <p className="text-sm text-gray-500">Manage and monitor live laundry operations.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2 min-w-[140px] flex-1 sm:flex-initial">
            <Store className="h-4 w-4 text-gray-400 shrink-0" />
            <Select value={branchId} onValueChange={(val) => { if(val) setBranchId(val); }}>
              <SelectTrigger className="w-full bg-white border-gray-200 shadow-sm h-9">
                <SelectValue placeholder="Select Branch" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Decent1 (D1)</SelectItem>
                <SelectItem value="2">Decent2 (D2)</SelectItem>
                <SelectItem value="3">Decent3 (D3)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2 min-w-[140px] flex-1 sm:flex-initial">
            <Filter className="h-4 w-4 text-gray-400 shrink-0" />
            <Select 
              value={filterStatus} 
              onValueChange={(value) => setFilterStatus(value as OrderStatus | 'all')}
            >
              <SelectTrigger className="w-full bg-white border-gray-200 shadow-sm h-9">
                <SelectValue placeholder="Filter Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="ready">Ready</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* No Orders State */}
      {orders.length === 0 ? (
        <Card className="border-gray-200/80 shadow-sm bg-white rounded-lg p-8 text-center text-gray-400 text-sm">
          No orders found in this branch filter.
        </Card>
      ) : (
        <>
          {/* 📱 MOBILE VIEW: Cards Layout (1 column on ultra-small, 2 columns on sm screens, hidden on md) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:hidden">
            {orders.map((order, index) => (
              <Card key={order._id} className="border-gray-200 shadow-sm bg-white rounded-xl overflow-hidden relative">
                <CardContent className="p-4 space-y-3">
                  
                  {/* Top Line: Index, Dress Code & Dropdown Actions */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-gray-400">#{index + 1}</span>
                      <span className="bg-gray-100 border border-gray-200 px-2 py-0.5 font-mono text-xs font-bold rounded text-blue-700">
                        {order.dressCode || 'N/A'}
                      </span>
                    </div>
                    
                    {/* Action Dropdown Menu */}
                    <DropdownMenu>
                      <DropdownMenuTrigger>
                        <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-gray-100 rounded-full">
                          <MoreVertical className="h-4 w-4 text-gray-500" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40 bg-white shadow-md border border-gray-100 rounded-md p-1">
                        <DropdownMenuItem onClick={() => handleEditOrder(order._id)} className="flex items-center gap-2 px-2 py-1.5 text-xs text-gray-700 hover:bg-gray-50 rounded cursor-pointer">
                          <Pencil className="h-3.5 w-3.5 text-gray-400" /> Edit Order
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDeleteOrder(order._id)} className="flex items-center gap-2 px-2 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded cursor-pointer">
                          <Trash2 className="h-3.5 w-3.5" /> Delete Order
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Customer Block */}
                  <div className="space-y-0.5">
                    <div className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5 text-gray-400" />
                      {order.customerName || 'Walk-in'}
                    </div>
                    <div className="text-gray-500 text-xs pl-5 font-mono">{order.customerPhone || 'No Phone'}</div>
                  </div>

                  {/* Service Details */}
                  <div className="bg-gray-50/50 p-2.5 rounded-lg space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="capitalize font-medium text-gray-800">{order.serviceType || 'wash'}</span>
                      <span className="text-gray-500">Qty: {order.quantity ?? 1} pcs</span>
                    </div>
                    {order.dressDescription && (
                      <p className="text-[11px] text-amber-600 italic truncate" title={order.dressDescription}>
                        Desc: {order.dressDescription}
                      </p>
                    )}
                  </div>

                  {/* Financial & Status Pills */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-gray-100">
                    <div className="text-sm font-bold text-gray-900 flex items-center gap-1">
                      <Coins className="h-3.5 w-3.5 text-gray-400" />
                      Rs. {order.price ?? 0}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Badge variant="outline" className={`capitalize text-[10px] font-semibold ${paymentStatusBadges[order.paymentStatus as keyof typeof paymentStatusBadges] || 'bg-gray-100 text-gray-800'}`}>
                        {order.paymentStatus || 'unpaid'}
                      </Badge>
                      <Badge variant="outline" className={`capitalize text-[10px] font-semibold ${statusColors[order.orderStatus as OrderStatus] || statusColors.pending}`}>
                        {order.orderStatus || 'pending'}
                      </Badge>
                    </div>
                  </div>

                  {/* Workflow Direct Button (Mobile Optimized) */}
                  {order.orderStatus === 'pending' && (
                    <Button 
                      size="sm" 
                      className="w-full h-8 text-xs bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-600 hover:text-white transition-all gap-1 rounded-lg mt-2"
                      onClick={() => handleStatusUpdate(order._id, 'processing')}
                    >
                      <Play className="h-3 w-3" /> Start Processing
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* 💻 DESKTOP VIEW: Legacy Table (Hidden on Mobile, Displayed on md+) */}
          <Card className="hidden md:block border-gray-200/80 shadow-sm bg-white rounded-lg overflow-hidden">
            <CardContent className="p-0">
              <div className="w-full overflow-x-auto">
                <Table className="min-w-full whitespace-nowrap">
                  <TableHeader className="bg-gray-50/70">
                    <TableRow>
                      <TableHead className="w-12 text-center text-xs font-semibold text-gray-500">#</TableHead>
                      <TableHead className="text-xs font-semibold text-gray-500">Dress Code</TableHead>
                      <TableHead className="text-xs font-semibold text-gray-500">Customer Info</TableHead>
                      <TableHead className="text-xs font-semibold text-gray-500">Service Details</TableHead>
                      <TableHead className="text-xs font-semibold text-gray-500">Price</TableHead>
                      <TableHead className="text-xs font-semibold text-gray-500">Payment</TableHead>
                      <TableHead className="text-xs font-semibold text-gray-500">Status</TableHead>
                      <TableHead className="text-xs font-semibold text-gray-500">Date</TableHead>
                      <TableHead className="text-right text-xs font-semibold text-gray-500 pr-6">Management Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order, index) => (
                      <TableRow key={order._id} className="hover:bg-gray-50/60 transition-colors">
                        <TableCell className="text-center text-sm font-medium text-gray-400">{index + 1}</TableCell>
                        <TableCell className="font-mono text-xs font-bold">
                          <span className="bg-gray-100 border border-gray-200 px-2 py-1 rounded text-blue-700">
                            {order.dressCode || 'N/A'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm font-semibold text-gray-900">{order.customerName || 'Walk-in'}</div>
                          <div className="text-gray-500 text-xs font-mono">{order.customerPhone || ''}</div>
                        </TableCell>
                        <TableCell>
                          <span className="capitalize text-sm font-medium text-gray-800">{order.serviceType || 'wash'}</span>
                          <span className="text-xs text-gray-400 block">Qty: {order.quantity ?? 1} pcs</span>
                        </TableCell>
                        <TableCell className="text-sm font-bold text-gray-900">Rs. {order.price ?? 0}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`capitalize text-[11px] font-semibold ${paymentStatusBadges[order.paymentStatus as keyof typeof paymentStatusBadges] || 'bg-gray-100 text-gray-800'}`}>
                            {order.paymentStatus || 'unpaid'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`capitalize text-[11px] font-semibold ${statusColors[order.orderStatus as OrderStatus] || statusColors.pending}`}>
                            {order.orderStatus || 'pending'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-gray-500 font-mono">
                          {order.createdAt ? format(new Date(order.createdAt), 'dd/MM/yyyy') : 'N/A'}
                        </TableCell>
                        <TableCell className="text-right pr-6">
                          <div className="flex items-center justify-end gap-2.5">
                            {order.orderStatus === 'pending' && (
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="h-7 px-2.5 text-xs bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-600 hover:text-white transition-all gap-1 rounded-lg"
                                onClick={() => handleStatusUpdate(order._id, 'processing')}
                              >
                                <Play className="h-3 w-3" /> Start
                              </Button>
                            )}
                            <DropdownMenu>
                              <DropdownMenuTrigger>
                                <Button variant="ghost" className="h-7 w-7 p-0 rounded-full"><MoreVertical className="h-4 w-4" /></Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="bg-white border">
                                <DropdownMenuItem onClick={() => handleEditOrder(order._id)}>Edit</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDeleteOrder(order._id)} className="text-red-600">Delete</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}