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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Modern UI Icons
import {
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
  Wallet,
  FileText,
  LayoutGrid,
  Shirt,
  Send,
  Inbox,
  Truck,
  HandCoins,
  ArrowUpCircle,
  ArrowDownCircle,
  BadgePercent,
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

// Service types that qualify an item for the "Laundry" pipeline.
// Checked case-insensitively against every item in itemsList.
const LAUNDRY_SERVICE_TYPES = ['wash', 'wash and press', 'suit wash and press', 'suit wash', 'only suit wash', 'only suit wash and press'];

const isLaundryOrder = (order: any): boolean => {
  if (!Array.isArray(order?.itemsList)) return false;
  return order.itemsList.some((item: any) =>
    LAUNDRY_SERVICE_TYPES.includes((item?.serviceType || '').trim().toLowerCase())
  );
};

// Total quantity across items eligible for laundry (wash / wash and press).
// Press-only items are excluded from this count.
const getLaundryEligibleQty = (order: any): number => {
  if (!Array.isArray(order?.itemsList)) return 0;
  return order.itemsList.reduce((sum: number, item: any) => {
    const type = (item?.serviceType || '').trim().toLowerCase();
    return LAUNDRY_SERVICE_TYPES.includes(type) ? sum + (Number(item.quantity) || 0) : sum;
  }, 0);
};

// Total quantity across press-only items — these stay out of the laundry pipeline.
const getPressOnlyQty = (order: any): number => {
  if (!Array.isArray(order?.itemsList)) return 0;
  return order.itemsList.reduce((sum: number, item: any) => {
    const type = (item?.serviceType || '').trim().toLowerCase();
    return !LAUNDRY_SERVICE_TYPES.includes(type) ? sum + (Number(item.quantity) || 0) : sum;
  }, 0);
};

// An order is "currently at the laundry" ONLY while status is "processing".
// Once received, status flips to "pending" and this becomes false — so it
// drops out of the Laundry tab/count immediately.
const isCurrentlyInLaundry = (order: any): boolean =>
  isLaundryOrder(order) && order.status === 'processing';

// computes the payment breakdown for an order using amountReceived
// if it was saved on the order, otherwise falls back to paymentStatus.
// balance > 0  -> customer still owes this much (balance due)
// balance < 0  -> customer overpaid -> this is their advance/credit
const getPaymentBreakdown = (order: any) => {
  const total = Number(order?.price) || 0;
  const received = typeof order?.amountReceived === 'number' ? order.amountReceived : null;
  if (received === null) return null; // older orders without this field saved
  const balance = total - received;
  return {
    total,
    received,
    balance,
    balanceDue: balance > 0 ? balance : 0,
    advanceCredit: balance < 0 ? Math.abs(balance) : 0,
    paidPercent: total > 0 ? Math.min(100, Math.round((received / total) * 100)) : 0,
  };
};

// formats any date string/Date into "dd/MM/yyyy HH:mm PKT" always in
// Pakistan Standard Time (Asia/Karachi, UTC+5) — regardless of the viewer's
// own browser/device timezone. Used anywhere we show date + time together.
const formatPKT = (date?: string | Date | null): string => {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';

  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Karachi',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).formatToParts(d);

  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  const dayPeriod = get('dayPeriod').toUpperCase(); // "am"/"pm" -> "AM"/"PM"
  return `${get('day')}/${get('month')}/${get('year')} ${get('hour')}:${get('minute')} ${dayPeriod}`;
};

type FilterStatus = OrderStatus | 'all' | 'laundry';

const ITEMS_PER_PAGE = 10;

function OrdersPageContent() {
  const router = useRouter();

  // `orders` is ALWAYS the full, unfiltered list for the selected branch.
  // Never filter this array directly for display — use `displayedOrders` below.
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [branchId, setBranchId] = useState('1');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [orderToView, setOrderToView] = useState<any>(null);

  // Send-to-laundry quantity dialog state.
  // sendQuantity is `number | ''` so the field can be fully cleared
  // (backspaced to empty) instead of snapping back to 0.
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [orderToSend, setOrderToSend] = useState<any>(null);
  const [sendQuantity, setSendQuantity] = useState<number | ''>(1);
  const [sending, setSending] = useState(false);

  const searchParams = useSearchParams();
  const editId = searchParams.get('id');
  const isEditMode = Boolean(editId);
  const [initialLoading, setInitialLoading] = useState(isEditMode);

  // Only refetch when branch changes. Status filtering happens client-side.
  useEffect(() => {
    loadOrders();
  }, [branchId]);

  // Reset to page 1 whenever branch or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [branchId, filterStatus]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const response = await orderApi.getByBranch(branchId);

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

  // Generic status update function - calls API endpoint
  const handleStatusUpdate = async (orderId: string, status: OrderStatus) => {
    try {
      setUpdatingStatus(orderId);
      await orderApi.updateStatus(orderId, status);
      toast.success(`Order status updated to ${status}!`);
      await loadOrders();
    } catch (error) {
      toast.error('Failed to update status');
    } finally {
      setUpdatingStatus(null);
    }
  };

  // Opens the quantity dialog before sending to laundry.
  // Default quantity = total wash / wash-and-press eligible quantity.
  const openSendToLaundryDialog = (order: any) => {
    const eligibleQty = getLaundryEligibleQty(order);
    setOrderToSend(order);
    setSendQuantity(eligibleQty > 0 ? eligibleQty : 1);
    setSendDialogOpen(true);
  };

  // Confirms sending the chosen quantity to laundry ->
  // status becomes "processing" + sendingDate + laundryQuantity stamped.
  const confirmSendToLaundry = async () => {
    if (!orderToSend) return;
    const eligibleQty = getLaundryEligibleQty(orderToSend);
    const qty = Math.min(Math.max(1, Number(sendQuantity) || 1), eligibleQty || 1);

    try {
      setSending(true);
      setUpdatingStatus(orderToSend._id);
      await orderApi.updateStatus(orderToSend._id, 'processing' as OrderStatus, {
        sendingDate: new Date().toISOString(),
        laundryQuantity: qty,
      });
      toast.success(`${qty} item(s) sent to laundry!`);
      setSendDialogOpen(false);
      setOrderToSend(null);
      await loadOrders();
    } catch (error) {
      toast.error('Failed to send order to laundry');
    } finally {
      setSending(false);
      setUpdatingStatus(null);
    }
  };

  // Receive order from laundry -> status becomes "pending" + receivingDate
  // stamped. Because isCurrentlyInLaundry() checks status === "processing",
  // this order drops out of the Laundry tab/count the instant this succeeds.
  const handleReceiveFromLaundry = async (orderId: string) => {
    try {
      setUpdatingStatus(orderId);
      await orderApi.updateStatus(orderId, 'pending' as OrderStatus, {
        receivingDate: new Date().toISOString(),
      });
      toast.success('Order received from laundry!');
      await loadOrders();
    } catch (error) {
      toast.error('Failed to receive order from laundry');
    } finally {
      setUpdatingStatus(null);
    }
  };

  // This is the list actually rendered in the UI. `orders` itself
  // stays untouched (full list) so counts below are always accurate.
  // "laundry" filter only matches status === "processing" — received orders
  // (status back to "pending") no longer linger here.
  const displayedOrders =
    filterStatus === 'all'
      ? orders
      : filterStatus === 'laundry'
        ? orders.filter((o) => isCurrentlyInLaundry(o))
        : orders.filter((o) => o.status === filterStatus);

  const totalPages = Math.max(1, Math.ceil(displayedOrders.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * ITEMS_PER_PAGE;
  const paginatedOrders = displayedOrders.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const goToPage = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  const handleEditOrder = (orderId: string) => {
    router.push(`/new-order?id=${orderId}`);
  };

  const handleDeleteClick = (order: any) => {
    setOrderToDelete(order);
    setDeleteModalOpen(true);
  };

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

  const handleViewDetail = (order: any) => {
    setOrderToView(order);
    setDetailModalOpen(true);
  };

  // Counts are derived from the FULL `orders` list — NOT from
  // `displayedOrders` — so they stay correct no matter which filter is active.
  // pendingCount counts ONLY real "pending" status orders — orders currently
  // sitting at the laundry ("processing") no longer inflate it.
  const allCount = orders.length;
  const pendingCount = orders.filter(o => o.status === 'pending').length;
  // laundryCount counts ONLY orders currently "processing" — the instant an
  // order is received back (status -> "pending"), it's gone.
  const laundryCount = orders.filter((o) => isCurrentlyInLaundry(o)).length;
  const readyCount = orders.filter(o => o.status === 'ready').length;
  const deliveredCount = orders.filter(o => o.status === 'delivered').length;

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // Small reusable icon-action button used to replace the dropdown menu.
  // `title` gives the native hover tooltip.
  const IconAction = ({
    onClick,
    title,
    icon: Icon,
    colorClass,
    hoverClass,
    disabled,
    loading: isLoading,
  }: {
    onClick: () => void;
    title: string;
    icon: any;
    colorClass: string;
    hoverClass: string;
    disabled?: boolean;
    loading?: boolean;
  }) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      disabled={disabled}
      className={`p-1.5 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${hoverClass}`}
    >
      {isLoading ? (
        <Loader2 className={`h-4 w-4 animate-spin ${colorClass}`} />
      ) : (
        <Icon className={`h-4 w-4 ${colorClass}`} />
      )}
    </button>
  );

  // Builds the full row of icon actions for a given order
  // (used identically on mobile cards and desktop table rows).
  // flex-wrap added so icons wrap gracefully on very narrow mobile widths
  // instead of overflowing the card.
  const renderActions = (order: any) => {
    const laundryEligible = isLaundryOrder(order);
    const isBusy = updatingStatus === order._id;

    return (
      <div className="flex items-center gap-1 flex-wrap justify-end shrink-0">
        <IconAction
          onClick={() => handleViewDetail(order)}
          title="View Detail"
          icon={Eye}
          colorClass="text-blue-600"
          hoverClass="hover:bg-blue-50 active:bg-blue-100"
        />

        <IconAction
          onClick={() => handleEditOrder(order._id)}
          title="Edit Order"
          icon={Pencil}
          colorClass="text-gray-600"
          hoverClass="hover:bg-gray-100 active:bg-gray-200"
        />

        {/* Send to Laundry — only for pending laundry-eligible orders */}
        {laundryEligible && order.status === 'pending' && (
          <IconAction
            onClick={() => openSendToLaundryDialog(order)}
            title="Send to Laundry"
            icon={Send}
            colorClass="text-indigo-600"
            hoverClass="hover:bg-indigo-50 active:bg-indigo-100"
            disabled={isBusy}
          />
        )}

        {/* Receive from Laundry — only while order is in laundry (processing) */}
        {laundryEligible && order.status === 'processing' && (
          <IconAction
            onClick={() => handleReceiveFromLaundry(order._id)}
            title="Received from Laundry"
            icon={Inbox}
            colorClass="text-emerald-600"
            hoverClass="hover:bg-emerald-50 active:bg-emerald-100"
            disabled={isBusy}
            loading={isBusy}
          />
        )}

        {/* Mark as Ready — available for any pending/processing order */}
        {(order.status === 'pending' || order.status === 'processing') && (
          <IconAction
            onClick={() => handleStatusUpdate(order._id, 'ready' as OrderStatus)}
            title="Mark as Ready"
            icon={PackageCheck}
            colorClass="text-emerald-600"
            hoverClass="hover:bg-emerald-50 active:bg-emerald-100"
            disabled={isBusy}
            loading={isBusy}
          />
        )}

        {/* Mark as Delivered — from Ready, OR directly from Pending */}
        {(order.status === 'ready' || order.status === 'pending') && (
          <IconAction
            onClick={() => handleStatusUpdate(order._id, 'delivered' as OrderStatus)}
            title={order.status === 'pending' ? 'Deliver Directly' : 'Mark as Delivered'}
            icon={order.status === 'pending' ? Truck : CheckCircle2}
            colorClass="text-slate-600"
            hoverClass="hover:bg-slate-100 active:bg-slate-200"
            disabled={isBusy}
            loading={isBusy}
          />
        )}

        <IconAction
          onClick={() => handleDeleteClick(order)}
          title="Delete"
          icon={Trash2}
          colorClass="text-red-600"
          hoverClass="hover:bg-red-50 active:bg-red-100"
        />
      </div>
    );
  };

  return (
    <>
      <div className="space-y-4 md:space-y-6 max-w-full">

        {/* DESKTOP ONLY HEADER & FILTERS PANEL */}
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
                  onValueChange={(value) => setFilterStatus(value as FilterStatus)}
                >
                  <SelectTrigger className="w-full bg-white border-gray-200 shadow-sm h-9">
                    <SelectValue placeholder="Filter Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="laundry">In Laundry</SelectItem>
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

        {/* MOBILE ONLY HEADER */}
        <div className="flex md:hidden items-center justify-between px-1">
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-gray-900">All Orders</h1>
            <p className="text-xs text-gray-500">{displayedOrders.length} total orders</p>
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

        {/* MOBILE ONLY STATUS COUNTERS: All / pending / laundry / ready / delivered */}
        <div className="flex md:hidden items-center justify-between bg-white border border-gray-100 p-2 rounded-xl shadow-sm mb-1">
          <div className="grid grid-cols-5 w-full gap-1">
            <button
              type="button"
              onClick={() => setFilterStatus('all')}
              className={`flex flex-col items-center justify-center gap-1 py-2 rounded-lg transition-colors ${filterStatus === 'all' ? 'bg-blue-50 ring-1 ring-blue-200' : 'active:bg-gray-50'
                }`}
            >
              <div className="relative">
                <LayoutGrid className="w-5 h-5 text-blue-500" />
                <span className="absolute -top-2 -right-3 bg-blue-500 text-white text-[9px] min-w-[16px] h-[16px] flex items-center justify-center px-1 rounded-full font-bold">
                  {allCount}
                </span>
              </div>
              <span className="text-[10px] font-semibold text-gray-600">All</span>
            </button>

            <button
              type="button"
              onClick={() => setFilterStatus(filterStatus === 'pending' ? 'all' : 'pending')}
              className={`flex flex-col items-center justify-center gap-1 py-2 rounded-lg transition-colors ${filterStatus === 'pending' ? 'bg-amber-50 ring-1 ring-amber-200' : 'active:bg-gray-50'
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

            <button
              type="button"
              onClick={() => setFilterStatus(filterStatus === 'laundry' ? 'all' : 'laundry')}
              className={`flex flex-col items-center justify-center gap-1 py-2 rounded-lg transition-colors ${filterStatus === 'laundry' ? 'bg-indigo-50 ring-1 ring-indigo-200' : 'active:bg-gray-50'
                }`}
            >
              <div className="relative">
                <Shirt className="w-5 h-5 text-indigo-500" />
                <span className="absolute -top-2 -right-3 bg-indigo-500 text-white text-[9px] min-w-[16px] h-[16px] flex items-center justify-center px-1 rounded-full font-bold">
                  {laundryCount}
                </span>
              </div>
              <span className="text-[10px] font-semibold text-gray-600">Laundry</span>
            </button>

            <button
              type="button"
              onClick={() => setFilterStatus(filterStatus === 'ready' ? 'all' : 'ready')}
              className={`flex flex-col items-center justify-center gap-1 py-2 rounded-lg transition-colors ${filterStatus === 'ready' ? 'bg-emerald-50 ring-1 ring-emerald-200' : 'active:bg-gray-50'
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

            <button
              type="button"
              onClick={() => setFilterStatus(filterStatus === 'delivered' ? 'all' : 'delivered')}
              className={`flex flex-col items-center justify-center gap-1 py-2 rounded-lg transition-colors ${filterStatus === 'delivered' ? 'bg-slate-100 ring-1 ring-slate-300' : 'active:bg-gray-50'
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
        {displayedOrders.length === 0 ? (
          <Card className="border-gray-200/80 shadow-sm bg-white rounded-lg p-8 text-center text-gray-400 text-sm">
            No orders found in this branch filter.
          </Card>
        ) : (
          <>
            {/* MOBILE VIEW: Card layout — actions live in the TOP row, right side */}
            <div className="flex flex-col gap-2 md:hidden">
              {paginatedOrders.map((order) => {
                const laundryEligible = isLaundryOrder(order);
                return (
                  <div
                    key={order._id}
                    className="bg-white border border-gray-200/70 shadow-sm rounded-xl p-3 active:scale-[0.99] transition-all"
                  >
                    {/* Top row: left = dress code/status/name, right = action icons */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono font-bold text-xs text-blue-700 bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded">
                            #{order.dressCode || 'N/A'}
                          </span>
                          <Badge variant="outline" className={`capitalize text-[10px] font-semibold px-1.5 py-0 ${statusColors[order.status as OrderStatus] || statusColors.pending}`}>
                            {order.status || 'pending'}
                          </Badge>
                          {laundryEligible && order.status === 'processing' && (
                            <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-600 border border-indigo-100">
                              In Laundry
                            </span>
                          )}
                          {order.paymentStatus === 'unpaid' && (
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse shrink-0" />
                          )}
                        </div>
                        <p className="text-sm font-semibold text-gray-900 truncate mt-1">
                          {order.customerName || 'Walk-in'}
                        </p>
                      </div>

                      {/* action icons anchored top-right, same side as before */}
                      {renderActions(order)}
                    </div>

                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span>Qty: <span className="font-bold text-gray-800">{order.quantity ?? 1}</span></span>
                        <span className="capitalize">{order.serviceType || 'wash'}</span>
                      </div>
                      <span className="text-sm font-bold text-gray-900">Rs. {order.price ?? 0}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* DESKTOP VIEW: Table layout with inline icon actions (no dropdown) */}
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
                        <TableHead className="text-right text-xs font-semibold text-gray-500 pr-6">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedOrders.map((order, index) => {
                        const laundryEligible = isLaundryOrder(order);
                        return (
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
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <Badge variant="outline" className={`capitalize text-[11px] font-semibold ${statusColors[order.status as OrderStatus] || statusColors.pending}`}>
                                  {order.status || 'pending'}
                                </Badge>
                                {laundryEligible && order.status === 'processing' && (
                                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-600 border border-indigo-100">
                                    In Laundry
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-xs text-gray-500 font-mono">
                              {order.createdAt ? format(new Date(order.createdAt), 'dd/MM/yyyy') : 'N/A'}
                            </TableCell>
                            <TableCell className="text-right pr-6">
                              {renderActions(order)}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* PAGINATION CONTROLS */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-1 pt-2 gap-2">
                <p className="text-xs text-gray-500 hidden sm:block">
                  Showing {startIndex + 1}-{Math.min(startIndex + ITEMS_PER_PAGE, displayedOrders.length)} of {displayedOrders.length}
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

      {/* Send to Laundry — quantity dialog */}
      <Dialog open={sendDialogOpen} onOpenChange={setSendDialogOpen}>
        <DialogContent className="sm:max-w-sm w-[90vw] rounded-xl bg-white z-[100] border border-gray-200 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-4 w-4 text-indigo-600" /> Send to Laundry
            </DialogTitle>
            <DialogDescription>
              {orderToSend?.customerName ? `${orderToSend.customerName} — ` : ''}
              {orderToSend?.dressCode ? `#${orderToSend.dressCode}` : ''}
              <br />
              Kitni quantity laundry mein bhejni hai wo daalen.
            </DialogDescription>
          </DialogHeader>

          {orderToSend && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
                <span>Eligible for laundry (wash / wash &amp; press)</span>
                <span className="font-bold text-gray-800">{getLaundryEligibleQty(orderToSend)} pcs</span>
              </div>
              {getPressOnlyQty(orderToSend) > 0 && (
                <div className="flex items-center justify-between text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
                  <span>Press only (stays in Pending)</span>
                  <span className="font-bold text-gray-800">{getPressOnlyQty(orderToSend)} pcs</span>
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="sendQty" className="text-xs text-gray-600">Quantity to send</Label>
                {/* value falls back to '' (not 0) when cleared, so the field
                    stays empty while typing instead of snapping to "0".
                    Blur re-clamps to a valid number so it never submits empty. */}
                <Input
                  id="sendQty"
                  type="number"
                  min={1}
                  max={getLaundryEligibleQty(orderToSend) || 1}
                  placeholder="Quantity"
                  value={sendQuantity === '' ? '' : sendQuantity}
                  onChange={(e) => {
                    const raw = e.target.value;
                    if (raw === '') {
                      setSendQuantity('');
                      return;
                    }
                    const num = Number(raw);
                    if (!isNaN(num)) setSendQuantity(num);
                  }}
                  onBlur={() => {
                    const eligibleQty = getLaundryEligibleQty(orderToSend) || 1;
                    const current = sendQuantity === '' ? eligibleQty : Number(sendQuantity);
                    const clamped = Math.min(Math.max(1, current || 1), eligibleQty);
                    setSendQuantity(clamped);
                  }}
                  className="h-10"
                />
              </div>
            </div>
          )}

          <DialogFooter className="flex gap-2 sm:justify-end pt-2">
            <Button variant="outline" onClick={() => setSendDialogOpen(false)} disabled={sending}>
              Cancel
            </Button>
            <Button
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
              onClick={confirmSendToLaundry}
              disabled={sending || sendQuantity === '' || Number(sendQuantity) < 1}
            >
              {sending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> Sending...
                </>
              ) : (
                'Send to Laundry'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Order Detail / Preview Modal */}
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
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className={`capitalize text-[11px] font-semibold ${statusColors[orderToView.status as OrderStatus] || statusColors.pending}`}>
                  {orderToView.status || 'pending'}
                </Badge>
                <Badge variant="outline" className={`capitalize text-[11px] font-semibold ${paymentStatusBadges[orderToView.paymentStatus as keyof typeof paymentStatusBadges] || 'bg-gray-100 text-gray-800'}`}>
                  {orderToView.paymentStatus || 'unpaid'}
                </Badge>
                {isLaundryOrder(orderToView) && orderToView.status === 'processing' && (
                  <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-600 border border-indigo-100">
                    In Laundry
                  </span>
                )}
              </div>

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
                  {/* ✅ NEW: Discount % and Discount Amount — only shown when present on the order */}
                  {(Number(orderToView.discountPercent) > 0 || Number(orderToView.discountAmount) > 0) && (
                    <>
                      <div>
                        <p className="text-[11px] text-gray-400">Discount %</p>
                        <p className="font-medium text-gray-800 flex items-center gap-1">
                          <BadgePercent className="h-3 w-3 text-gray-400" />
                          {orderToView.discountPercent ?? 0}%
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] text-gray-400">Discount Amount</p>
                        <p className="font-bold text-rose-600">- Rs. {orderToView.discountAmount ?? 0}</p>
                      </div>
                    </>
                  )}

                  {orderToView.deliveryDate && (
                    <div>
                      <p className="text-[11px] text-gray-400">Delivery Date</p>
                      <p className="font-medium text-gray-800 flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-gray-400" />
                        {formatPKT(orderToView.deliveryDate)}
                      </p>
                    </div>
                  )}
                  {orderToView.sendingDate && (
                    <div>
                      <p className="text-[11px] text-gray-400">Sent to Laundry</p>
                      <p className="font-medium text-gray-800 flex items-center gap-1">
                        <Send className="h-3 w-3 text-gray-400" />
                        {formatPKT(orderToView.sendingDate)}
                      </p>
                    </div>
                  )}
                  {orderToView.receivingDate && (
                    <div>
                      <p className="text-[11px] text-gray-400">Received from Laundry</p>
                      <p className="font-medium text-gray-800 flex items-center gap-1">
                        <Inbox className="h-3 w-3 text-gray-400" />
                        {formatPKT(orderToView.receivingDate)}
                      </p>
                    </div>
                  )}
                  {orderToView.createdAt && (
                    <div>
                      <p className="text-[11px] text-gray-400">Created</p>
                      <p className="font-medium text-gray-800">
                        {formatPKT(orderToView.createdAt)}
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

              {/* Press / Laundry breakdown chip */}
              {isLaundryOrder(orderToView) && (
                <div className="flex items-center gap-2 border-t border-gray-100 pt-3">
                  <span className="text-[11px] font-semibold px-2 py-1 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
                    {getLaundryEligibleQty(orderToView)} in Laundry
                  </span>
                  {getPressOnlyQty(orderToView) > 0 && (
                    <span className="text-[11px] font-semibold px-2 py-1 rounded-lg bg-amber-50 text-amber-600 border border-amber-100">
                      {getPressOnlyQty(orderToView)} in Press
                    </span>
                  )}
                </div>
              )}

              {Array.isArray(orderToView.itemsList) && orderToView.itemsList.length > 0 && (
                <div className="space-y-2 border-t border-gray-100 pt-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Items</p>
                  <div className="space-y-1.5">
                    {orderToView.itemsList
                      // While the order is currently at the laundry (processing),
                      // press-only items are hidden from this preview.
                      .filter((it: any) => {
                        if (orderToView.status !== 'processing') return true;
                        const type = (it?.serviceType || '').trim().toLowerCase();
                        return LAUNDRY_SERVICE_TYPES.includes(type);
                      })
                      .map((it: any, i: number) => (
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

          <DialogFooter className="flex flex-row justify-center pt-2">
            <Button
              variant="outline"
              className="w-1/2 h-11 px-6 text-base"
              onClick={() => setDetailModalOpen(false)}
            >
              Close
            </Button>

            <Button
              className="w-1/2 h-11 px-6 text-base bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => {
                setDetailModalOpen(false);
                if (orderToView) handleEditOrder(orderToView._id);
              }}
            >
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="sm:max-w-md w-[92vw] rounded-xl bg-white border border-gray-200 shadow-2xl z-[100]">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-900">
              Delete Order
            </DialogTitle>

            <DialogDescription className="text-gray-600 leading-6">
              Are you sure you want to delete this order
              {orderToDelete?.customerName
                ? ` for ${orderToDelete.customerName}`
                : ""}
              {orderToDelete?.dressCode
                ? ` (${orderToDelete.dressCode})`
                : ""}
              ? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex flex-row gap-3 sm:justify-between">
            <Button
              variant="outline"
              onClick={() => setDeleteModalOpen(false)}
              disabled={deleting}
              className="w-1/2 sm:w-36 h-11 text-base font-medium hover:bg-gray-100 transition-all duration-200"
            >
              Cancel
            </Button>

            <Button
              onClick={confirmDelete}
              disabled={deleting}
              className="w-1/2 sm:w-36 h-11 text-base font-medium bg-red-600 hover:bg-red-700 text-white transition-all duration-200"
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

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