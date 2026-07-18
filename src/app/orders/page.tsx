'use client';

import { Suspense, useEffect, useState } from 'react';
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

// Modern UI Icons
import {
  MoreVertical,
  Pencil,
  Trash2,
  Loader2,
  Filter,
  Store,
  ChevronLeft,
  ChevronRight,
  Plus,
  Eye,
  Clock,
  PackageCheck,
  CheckCircle2,
  Phone,
  MapPin,
  Mail,
  Calendar,
  Coins,
  Wallet,
  FileText,
  X,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useRouter, useSearchParams } from 'next/navigation';

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

const ITEMS_PER_PAGE = 10;

// ✅ FIX: Actual page logic moved into this inner component.
// This is the component that calls useSearchParams().
function OrdersPageContent() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [branchId, setBranchId] = useState('1');
  const [filterStatus, setFilterStatus] = useState<OrderStatus | 'all'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);

  // ✨ NEW: Detail/Preview modal state (mobile "Detail" button)
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [orderToView, setOrderToView] = useState<any>(null);

  const searchParams = useSearchParams();
  const editId = searchParams.get('id');
  const isEditMode = Boolean(editId);
  const [initialLoading, setInitialLoading] = useState(isEditMode);

  useEffect(() => {
    loadOrders();
  }, [branchId, filterStatus]);

  useEffect(() => {
    setCurrentPage(1);
  }, [branchId, filterStatus, orders.length]);

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

  const totalPages = Math.max(1, Math.ceil(orders.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * ITEMS_PER_PAGE;
  const paginatedOrders = orders.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const goToPage = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  // ✨ FIXED: Edit par form page navigate ho, id ke sath
  const handleEditOrder = (orderId: string) => {
    router.push(`/new-order?id=${orderId}`);
  };

  // ✨ FIXED: Delete click par sirf modal khole
  const handleDeleteClick = (order: any) => {
    setOrderToDelete(order);
    setDeleteModalOpen(true);
  };

  // ✨ NEW: Modal ke "Delete" button par asal delete
  const confirmDelete = async () => {
    if (!orderToDelete) return;
    setDeleting(true);
    try {
      await orderApi.delete(orderToDelete._id);
      toast.success('Order deleted successfully');
      setDeleteModalOpen(false);
      setOrderToDelete(null);
      loadOrders();
    } catch (error) {
      toast.error('Failed to delete order');
    } finally {
      setDeleting(false);
    }
  };

  // ✨ NEW: Detail/Preview modal open karo
  const handleViewDetail = (order: any) => {
    setOrderToView(order);
    setDetailModalOpen(true);
  };

  // ✨ NEW: Status counts for the 3 mobile counters
  const pendingCount = orders.filter(o => o.orderStatus === 'pending' || o.orderStatus === 'processing').length;
  const readyCount = orders.filter(o => o.orderStatus === 'ready').length;
  const deliveredCount = orders.filter(o => o.orderStatus === 'delivered').length;

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4 md:space-y-6 max-w-full">

        {/* --- DESKTOP ONLY HEADER & FILTERS PANEL --- */}
        <div className="hidden md:flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-1">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-gray-900">All Orders</h1>
            <p className="text-sm text-gray-500">Manage and monitor live laundry operations.</p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            <div className="flex flex-wrap items-center gap-3 flex-1 sm:flex-initial">
              <div className="flex items-center gap-2 min-w-[130px] flex-1 sm:flex-initial">
                <Store className="h-4 w-4 text-gray-400 shrink-0" />
                <Select value={branchId} onValueChange={(val) => { if (val) setBranchId(val); }}>
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

              <div className="flex items-center gap-2 min-w-[130px] flex-1 sm:flex-initial">
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

            <Button
              size="icon"
              className="h-9 w-9 shrink-0 bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-sm rounded-lg"
              onClick={() => router.push('/new-order')}
              title="Create New Order"
            >
              <Plus className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* --- MOBILE ONLY HEADER --- */}
        <div className="flex md:hidden items-center justify-between px-1">
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-gray-900">All Orders</h1>
            <p className="text-xs text-gray-500">{orders.length} total orders</p>
          </div>
          <Button
            size="icon"
            className="h-9 w-9 shrink-0 bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-sm rounded-lg"
            onClick={() => router.push('/new-order')}
            title="Create New Order"
          >
            <Plus className="h-5 w-5" />
          </Button>
        </div>

        {/* --- MOBILE ONLY STATUS COUNTERS: pending / ready / delivered with text --- */}
        <div className="flex md:hidden items-center justify-between bg-white border border-gray-100 p-2 rounded-xl shadow-sm mb-1">
          <div className="grid grid-cols-3 w-full gap-1.5">
            {/* Pending Counter */}
            <button
              type="button"
              onClick={() => setFilterStatus(filterStatus === 'pending' ? 'all' : 'pending')}
              className={`flex flex-col items-center justify-center gap-1 py-2 rounded-lg transition-colors ${
                filterStatus === 'pending' ? 'bg-amber-50 ring-1 ring-amber-200' : 'active:bg-gray-50'
              }`}
            >
              <div className="relative">
                <Clock className="w-5 h-5 text-amber-500" />
                <span className="absolute -top-2 -right-3 bg-amber-500 text-white text-[9px] min-w-[16px] h-[16px] flex items-center justify-center px-1 rounded-full font-bold">
                  {pendingCount}
                </span>
              </div>
              <span className="text-[10px] font-semibold text-gray-600">Pending</span>
            </button>

            {/* Ready Counter */}
            <button
              type="button"
              onClick={() => setFilterStatus(filterStatus === 'ready' ? 'all' : 'ready')}
              className={`flex flex-col items-center justify-center gap-1 py-2 rounded-lg transition-colors ${
                filterStatus === 'ready' ? 'bg-emerald-50 ring-1 ring-emerald-200' : 'active:bg-gray-50'
              }`}
            >
              <div className="relative">
                <PackageCheck className="w-5 h-5 text-emerald-500" />
                <span className="absolute -top-2 -right-3 bg-emerald-500 text-white text-[9px] min-w-[16px] h-[16px] flex items-center justify-center px-1 rounded-full font-bold">
                  {readyCount}
                </span>
              </div>
              <span className="text-[10px] font-semibold text-gray-600">Ready</span>
            </button>

            {/* Delivered Counter */}
            <button
              type="button"
              onClick={() => setFilterStatus(filterStatus === 'delivered' ? 'all' : 'delivered')}
              className={`flex flex-col items-center justify-center gap-1 py-2 rounded-lg transition-colors ${
                filterStatus === 'delivered' ? 'bg-slate-100 ring-1 ring-slate-300' : 'active:bg-gray-50'
              }`}
            >
              <div className="relative">
                <CheckCircle2 className="w-5 h-5 text-slate-500" />
                <span className="absolute -top-2 -right-3 bg-slate-500 text-white text-[9px] min-w-[16px] h-[16px] flex items-center justify-center px-1 rounded-full font-bold">
                  {deliveredCount}
                </span>
              </div>
              <span className="text-[10px] font-semibold text-gray-600">Delivered</span>
            </button>
          </div>
        </div>

        {/* No Orders State */}
        {orders.length === 0 ? (
          <Card className="border-gray-200/80 shadow-sm bg-white rounded-lg p-8 text-center text-gray-400 text-sm">
            No orders found in this branch filter.
          </Card>
        ) : (
          <>
            {/* 📱 MOBILE VIEW: Card layout with name, qty, price, dress code + Detail button */}
            <div className="flex flex-col gap-2 md:hidden">
              {paginatedOrders.map((order, index) => (
                <div
                  key={order._id}
                  className="bg-white border border-gray-200/70 shadow-sm rounded-xl p-3 active:scale-[0.99] transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    {/* Left: dress code + customer name */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-mono font-bold text-xs text-blue-700 bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded">
                          #{order.dressCode || 'N/A'}
                        </span>
                        <Badge variant="outline" className={`capitalize text-[10px] font-semibold px-1.5 py-0 ${statusColors[order.orderStatus as OrderStatus] || statusColors.pending}`}>
                          {order.orderStatus || 'pending'}
                        </Badge>
                        {order.paymentStatus === 'unpaid' && (
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse shrink-0" />
                        )}
                      </div>
                      <p className="text-sm font-semibold text-gray-900 truncate mt-1">
                        {order.customerName || 'Walk-in'}
                      </p>
                    </div>

                    {/* Right: quick actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleViewDetail(order)}
                        className="p-1.5 rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors"
                        title="Detail / Preview"
                      >
                        <Eye className="h-4 w-4 text-blue-600" />
                      </button>
                      <DropdownMenu>
                        <DropdownMenuTrigger>
                          <button className="focus:outline-none p-1.5 hover:bg-gray-100 rounded-full transition-colors">
                            <MoreVertical className="h-4 w-4 text-gray-500" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40 bg-white shadow-xl border border-gray-100 rounded-lg p-1 z-[100]">
                          <DropdownMenuItem onClick={() => handleViewDetail(order)} className="flex items-center gap-2 px-2 py-2 text-xs text-gray-700 hover:bg-gray-50 rounded cursor-pointer">
                            <Eye className="h-3.5 w-3.5" /> View Detail
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditOrder(order._id)} className="flex items-center gap-2 px-2 py-2 text-xs text-gray-700 hover:bg-gray-50 rounded cursor-pointer">
                            <Pencil className="h-3.5 w-3.5" /> Edit Order
                          </DropdownMenuItem>
                          {order.orderStatus === 'pending' && (
                            <DropdownMenuItem onClick={() => handleStatusUpdate(order._id, 'processing')} className="flex items-center gap-2 px-2 py-2 text-xs text-blue-600 hover:bg-blue-50 rounded cursor-pointer">
                              Start Process
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => handleDeleteClick(order)} className="flex items-center gap-2 px-2 py-2 text-xs text-red-600 hover:bg-red-50 rounded cursor-pointer">
                            <Trash2 className="h-3.5 w-3.5" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {/* Bottom row: quantity + price */}
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span>Qty: <span className="font-bold text-gray-800">{order.quantity ?? 1}</span></span>
                      <span className="capitalize">{order.serviceType || 'wash'}</span>
                    </div>
                    <span className="text-sm font-bold text-gray-900">Rs. {order.price ?? 0}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* 💻 DESKTOP VIEW: Legacy Table Dashboard layout */}
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
                      {paginatedOrders.map((order, index) => (
                        <TableRow key={order._id} className="hover:bg-gray-50/60 transition-colors">
                          <TableCell className="text-center text-sm font-medium text-gray-400">{startIndex + index + 1}</TableCell>
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
                              <button
                                onClick={() => handleViewDetail(order)}
                                className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
                                title="View Detail"
                              >
                                <Eye className="h-4 w-4 text-blue-600" />
                              </button>
                              <DropdownMenu>
                                <DropdownMenuTrigger>
                                  <Button variant="ghost" className="h-7 w-7 p-0 rounded-full"><MoreVertical className="h-4 w-4" /></Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="bg-white border">
                                  <DropdownMenuItem onClick={() => handleEditOrder(order._id)}>Edit</DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleDeleteClick(order)} className="text-red-600">Delete</DropdownMenuItem>
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

            {/* --- PAGINATION CONTROLS --- */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-1 pt-2 gap-2">
                <p className="text-xs text-gray-500 hidden sm:block">
                  Showing {startIndex + 1}-{Math.min(startIndex + ITEMS_PER_PAGE, orders.length)} of {orders.length}
                </p>
                <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto justify-center sm:justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0 shrink-0"
                    disabled={safePage === 1}
                    onClick={() => goToPage(safePage - 1)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <Button
                      key={page}
                      variant={page === safePage ? 'default' : 'outline'}
                      size="sm"
                      className={`h-8 w-8 p-0 text-xs shrink-0 ${page === safePage ? 'bg-blue-600 text-white hover:bg-blue-700' : ''}`}
                      onClick={() => goToPage(page)}
                    >
                      {page}
                    </Button>
                  ))}

                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0 shrink-0"
                    disabled={safePage === totalPages}
                    onClick={() => goToPage(safePage + 1)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ✨ Order Detail / Preview Modal (mobile "Detail" button opens this) */}
      <Dialog open={detailModalOpen} onOpenChange={setDetailModalOpen}>
        <DialogContent className="sm:max-w-md w-[92vw] rounded-xl max-h-[85vh] overflow-y-auto bg-white z-[100] border border-gray-200 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Order Detail
              <span className="font-mono text-xs bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded">
                #{orderToView?.dressCode || 'N/A'}
              </span>
            </DialogTitle>
            <DialogDescription>Complete information for this order.</DialogDescription>
          </DialogHeader>

          {orderToView && (
            <div className="space-y-4 text-sm">
              {/* Status badges */}
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className={`capitalize text-[11px] font-semibold ${statusColors[orderToView.orderStatus as OrderStatus] || statusColors.pending}`}>
                  {orderToView.orderStatus || 'pending'}
                </Badge>
                <Badge variant="outline" className={`capitalize text-[11px] font-semibold ${paymentStatusBadges[orderToView.paymentStatus as keyof typeof paymentStatusBadges] || 'bg-gray-100 text-gray-800'}`}>
                  {orderToView.paymentStatus || 'unpaid'}
                </Badge>
              </div>

              {/* Customer Info */}
              <div className="space-y-2 border-t border-gray-100 pt-3">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Customer</p>
                <p className="font-semibold text-gray-900">{orderToView.customerName || 'Walk-in'}</p>
                {orderToView.customerPhone && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Phone className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                    <span>{orderToView.customerPhone}</span>
                  </div>
                )}
                {orderToView.customerEmail && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Mail className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                    <span className="break-all">{orderToView.customerEmail}</span>
                  </div>
                )}
                {orderToView.customerAddress && (
                  <div className="flex items-start gap-2 text-gray-600">
                    <MapPin className="h-3.5 w-3.5 text-gray-400 shrink-0 mt-0.5" />
                    <span>{orderToView.customerAddress}</span>
                  </div>
                )}
              </div>

              {/* Order Info */}
              <div className="space-y-2 border-t border-gray-100 pt-3">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Order</p>
                <div className="grid grid-cols-2 gap-y-2 gap-x-3">
                  <div>
                    <p className="text-[11px] text-gray-400">Service</p>
                    <p className="capitalize font-medium text-gray-800">{orderToView.serviceType || 'wash'}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-gray-400">Quantity</p>
                    <p className="font-medium text-gray-800">{orderToView.quantity ?? 1}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-gray-400">Price</p>
                    <p className="font-bold text-gray-900">Rs. {orderToView.price ?? 0}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-gray-400">Payment Method</p>
                    <p className="capitalize font-medium text-gray-800 flex items-center gap-1">
                      <Wallet className="h-3 w-3 text-gray-400" /> {orderToView.paymentMethod || 'cash'}
                    </p>
                  </div>
                  {orderToView.deliveryDate && (
                    <div>
                      <p className="text-[11px] text-gray-400">Delivery Date</p>
                      <p className="font-medium text-gray-800 flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-gray-400" />
                        {format(new Date(orderToView.deliveryDate), 'dd/MM/yyyy')}
                      </p>
                    </div>
                  )}
                  {orderToView.createdAt && (
                    <div>
                      <p className="text-[11px] text-gray-400">Created</p>
                      <p className="font-medium text-gray-800">
                        {format(new Date(orderToView.createdAt), 'dd/MM/yyyy')}
                      </p>
                    </div>
                  )}
                </div>
                {orderToView.dressDescription && (
                  <div className="pt-1">
                    <p className="text-[11px] text-gray-400 flex items-center gap-1"><FileText className="h-3 w-3" /> Description</p>
                    <p className="text-gray-700">{orderToView.dressDescription}</p>
                  </div>
                )}
                {orderToView.notes && (
                  <div className="pt-1">
                    <p className="text-[11px] text-gray-400">Notes</p>
                    <p className="text-gray-700">{orderToView.notes}</p>
                  </div>
                )}
              </div>

              {/* Items breakdown, if the order was created with multiple items */}
              {Array.isArray(orderToView.itemsList) && orderToView.itemsList.length > 0 && (
                <div className="space-y-2 border-t border-gray-100 pt-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Items</p>
                  <div className="space-y-1.5">
                    {orderToView.itemsList.map((it: any, i: number) => (
                      <div key={it.id || i} className="flex items-center justify-between bg-gray-50 rounded-lg px-2.5 py-1.5">
                        <span className="capitalize text-xs font-medium text-gray-700">{it.serviceType} × {it.quantity}</span>
                        <span className="text-xs text-gray-400">Rs. {it.itemPrice}/pc</span>
                        <span className="text-xs font-bold text-gray-900">Rs. {it.quantity * it.itemPrice}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="flex gap-2 sm:justify-end pt-2">
            <Button variant="outline" onClick={() => setDetailModalOpen(false)}>
              Close
            </Button>
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => {
                setDetailModalOpen(false);
                if (orderToView) handleEditOrder(orderToView._id);
              }}
            >
              <Pencil className="h-3.5 w-3.5 mr-1.5" /> Edit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ✨ Delete Confirmation Modal */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="sm:max-w-md w-[92vw] rounded-xl bg-white z-[100] border border-gray-200 shadow-2xl">
          <DialogHeader>
            <DialogTitle>Delete Order?</DialogTitle>
            <DialogDescription>
              Kya aap wakai is order ko delete karna chahte hain
              {orderToDelete?.customerName ? ` — ${orderToDelete.customerName}` : ''}
              {orderToDelete?.dressCode ? ` (${orderToDelete.dressCode})` : ''}?
              Ye action wapis nahi ho sakta.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:justify-end">
            <Button variant="outline" onClick={() => setDeleteModalOpen(false)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={deleting}>
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> Deleting...
                </>
              ) : (
                'Delete'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ✅ FIX: Default export is now a thin wrapper that provides the
// required Suspense boundary around the component using useSearchParams().
export default function OrdersPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-[60vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      }
    >
      <OrdersPageContent />
    </Suspense>
  );
} 