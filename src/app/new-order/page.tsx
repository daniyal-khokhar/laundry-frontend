'use client';

import { Suspense, useState, useEffect } from 'react';
import { ServiceType, PaymentStatus } from '@/lib/types';
import toast from 'react-hot-toast';
import { orderApi } from '@/lib/api';
import { itemApi } from '@/lib/itemApi';

// Shadcn UI Components
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

// Modern UI Lucide Icons
import {
  User,
  Phone,
  MapPin,
  Mail,
  QrCode,
  Layers,
  FileText,
  Calendar,
  Building2,
  CreditCard,
  Wallet,
  Loader2,
  Save,
  RotateCcw,
  Sparkles,
  ArrowLeft,
  Plus,
  Minus,
  Trash2,
  ShoppingBag,
  Receipt,
  Lock,
} from "lucide-react";
import { useRouter, useSearchParams } from 'next/navigation';

// Order item interface
interface OrderItem {
  id: string;
  serviceType: string;
  quantity: number;
  itemPrice: number;
}

// Short random id generator
const generateItemId = () => Math.random().toString(36).slice(2, 9);

// Fetch available items from API
const fetchAvailableItems = async () => {
  const response = await itemApi.getAll();
  return Array.isArray(response) ? response : (response?.data || []);
};

function NewOrderPageContent() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [formData, setFormData] = useState({
    branchId: '1',
    branchCode: 'D1',
    customerName: '',
    customerPhone: '',
    customerAddress: '',
    dressCode: '',
    dressDescription: '',
    paymentStatus: 'unpaid' as PaymentStatus,
    paymentMethod: 'cash' as 'cash' | 'account' | 'online',
    deliveryDate: '',
    notes: '',
    status: 'pending',
  });

  // Cart items
  const [itemsList, setItemsList] = useState<OrderItem[]>([]);

  // Item picker modal state
  const [itemPickerOpen, setItemPickerOpen] = useState(false);
  const [availableItems, setAvailableItems] = useState<any[]>([]);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());

  const searchParams = useSearchParams();
  const editId = searchParams.get('id');
  const isEditMode = Boolean(editId);
  const [initialLoading, setInitialLoading] = useState(isEditMode);

  // Cart totals
  const totalQuantity = itemsList.reduce((sum, it) => sum + it.quantity, 0);
  const grandTotal = itemsList.reduce((sum, it) => sum + it.quantity * it.itemPrice, 0);

  // Auto-search for existing customer/order
  const handleAutoSearch = async (searchType: 'name' | 'code', value: string) => {
    if (isEditMode) return;
    if (!value || value.trim().length < 2) return;

    setSearching(true);
    try {
      const queryParams: Record<string, string> = {};
      if (searchType === 'code') {
        queryParams.dressCode = `D-${value.replace(/^D-/, '')}`;
      } else {
        queryParams.customerName = value;
      }

      const searchResponse = await orderApi.getAll(queryParams);

      const records = Array.isArray(searchResponse)
        ? searchResponse
        : (searchResponse?.data || []);

      let matchedId: string | null = null;

      if (records.length > 0) {
        const found = records.find((order: any) => {
          if (searchType === 'code') {
            return order.dressCode?.toUpperCase() === `D-${value}`.toUpperCase();
          }
          return order.customerName?.toLowerCase().includes(value.toLowerCase());
        });

        matchedId = found?._id || found?.id || null;
      }

      if (!matchedId) {
        toast.error('No previous record found for this customer');
        setSearching(false);
        return;
      }

      const existingRecordResponse = await orderApi.getById(matchedId);
      const existingRecord = existingRecordResponse?.data || existingRecordResponse;

      if (existingRecord) {
        const cleanDressCode = existingRecord.dressCode
          ? existingRecord.dressCode.replace(/^D-/, '')
          : '';

        setFormData(prev => ({
          ...prev,
          customerName: existingRecord.customerName || prev.customerName,
          customerPhone: existingRecord.customerPhone || prev.customerPhone,
          customerAddress: existingRecord.customerAddress || prev.customerAddress,
          dressCode: cleanDressCode || prev.dressCode,
          dressDescription: existingRecord.dressDescription || prev.dressDescription,
          paymentStatus: existingRecord.paymentStatus || prev.paymentStatus,
          paymentMethod: existingRecord.paymentMethod || prev.paymentMethod,
          notes: existingRecord.notes || prev.notes,
          status: existingRecord.status || prev.status,
        }));

        if (Array.isArray(existingRecord.itemsList) && existingRecord.itemsList.length > 0) {
          setItemsList(existingRecord.itemsList.map((it: any, i: number) => ({
            id: it.id || generateItemId(),
            serviceType: it.serviceType || 'wash',
            quantity: it.quantity || 1,
            itemPrice: it.itemPrice ?? it.price ?? 0,
          })));
        } else if (existingRecord.serviceType || existingRecord.price) {
          setItemsList([{
            id: generateItemId(),
            serviceType: existingRecord.serviceType || 'wash',
            quantity: existingRecord.quantity || 1,
            itemPrice: existingRecord.price || 0,
          }]);
        }

        toast.success('Record found and auto-populated! ✨');
      } else {
        toast.error('No previous record found for this customer');
      }
    } catch (err) {
      toast.error("Network Error: Cannot connect to backend server.", { id: 'network-err' });
    } finally {
      setSearching(false);
    }
  };

  // Open item picker modal
  const openItemPicker = async () => {
    setItemPickerOpen(true);
    setSelectedItemIds(new Set());
    setItemsLoading(true);

    try {
      const items = await fetchAvailableItems();
      setAvailableItems(items);
    } catch (err) {
      toast.error('Failed to load items list');
      setAvailableItems([]);
    } finally {
      setItemsLoading(false);
    }
  };

  // Toggle item selection
  const toggleItemSelect = (id: string) => {
    setSelectedItemIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Add selected items to cart
  const handleConfirmAddItems = () => {
    if (selectedItemIds.size === 0) {
      toast.error('Please select at least one item');
      return;
    }

    setItemsList(prev => {
      let updated = [...prev];

      selectedItemIds.forEach((id) => {
        const apiItem = availableItems.find((a) => (a._id || a.id) === id);
        if (!apiItem) return;

        const name = apiItem.itemName || apiItem.serviceType || apiItem.title || 'Item';
        const price = apiItem.price ?? apiItem.itemPrice ?? 0;

        const existingIndex = updated.findIndex(
          (it) => it.serviceType === name && it.itemPrice === price
        );

        if (existingIndex > -1) {
          updated[existingIndex] = {
            ...updated[existingIndex],
            quantity: updated[existingIndex].quantity + 1,
          };
        } else {
          updated.push({
            id: generateItemId(),
            serviceType: name,
            quantity: 1,
            itemPrice: price,
          });
        }
      });

      return updated;
    });

    toast.success('Items added to order! 🧺');
    setItemPickerOpen(false);
  };

  // Cart item controls
  const handleIncreaseItem = (id: string) => {
    setItemsList(prev => prev.map(it =>
      it.id === id ? { ...it, quantity: it.quantity + 1 } : it
    ));
  };

  const handleDecreaseItem = (id: string) => {
    setItemsList(prev => prev.map(it =>
      it.id === id ? { ...it, quantity: Math.max(1, it.quantity - 1) } : it
    ));
  };

  const handleRemoveItem = (id: string) => {
    setItemsList(prev => prev.filter(it => it.id !== id));
  };

  // Submit order
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  if (itemsList.length === 0) {
    toast.error('Please add at least one item to the order');
    return;
  }

  setLoading(true);

  try {
    const finalDressCode = formData.dressCode ? `D-${formData.dressCode.replace(/^D-/, '')}` : '';

    const payload = {
      ...formData,
      status: formData.status,
      dressCode: finalDressCode,
      itemsList,
      serviceType: itemsList[0]?.serviceType || 'wash',
      quantity: totalQuantity,
      price: grandTotal,
      deliveryDate: formData.deliveryDate ? new Date(formData.deliveryDate) : undefined,
    };

    if (isEditMode && editId) {
      await orderApi.update(editId, payload);
      toast.success('Order updated successfully!');
    } else {
      const order = await orderApi.create(payload);
      toast.success(`Order ${order.orderNumber || 'successfully'} created!`);
    }

    router.push('/orders');
  } catch (error) {
    toast.error(isEditMode ? 'Failed to update order.' : 'Failed to create order. Please try again.');
  } finally {
    setLoading(false);
  }
};

  // Generate dress code
  const generateDressCode = () => {
    const randomSuffix = Math.floor(10 + Math.random() * 90);
    setFormData(prev => ({ ...prev, dressCode: String(randomSuffix) }));
    toast.success('Dress Number Generated! ✨', { icon: '🪄' });
  };

  const handleSelectChange = (name: string, value: string | null) => {
    setFormData((prev) => ({ ...prev, [name]: value || '' }));
  };

  const resetForm = () => {
    setFormData({
      branchId: '1',
      branchCode: 'D1',
      customerName: '',
      customerPhone: '',
      customerAddress: '',
      dressCode: '',
      dressDescription: '',
      paymentStatus: 'unpaid',
      paymentMethod: 'cash',
      deliveryDate: '',
      notes: '',
      status: '',
    });
    setItemsList([]);
  };

  // Load order for edit
  useEffect(() => {
    if (!editId) return;

    const loadOrderForEdit = async () => {
      setInitialLoading(true);
      try {
        const response = await orderApi.getById(editId);
        const order = response?.data || response;

        if (!order) {
          toast.error('Order not found');
          router.push('/orders');
          return;
        }

        setFormData({
          branchId: order.branchId || '1',
          branchCode: order.branchCode || 'D1',
          customerName: order.customerName || '',
          customerPhone: order.customerPhone || '',
          customerAddress: order.customerAddress || '',
          dressCode: order.dressCode ? order.dressCode.replace(/^D-/, '') : '',
          dressDescription: order.dressDescription || '',
          paymentStatus: order.paymentStatus || 'unpaid',
          paymentMethod: order.paymentMethod || 'cash',
          deliveryDate: order.deliveryDate
            ? new Date(order.deliveryDate).toISOString().split('T')[0]
            : '',
          notes: order.notes || '',
          status: order.status || '',
        });

        if (Array.isArray(order.itemsList) && order.itemsList.length > 0) {
          setItemsList(order.itemsList.map((it: any, i: number) => ({
            id: it.id || generateItemId(),
            serviceType: it.serviceType || 'wash',
            quantity: it.quantity || 1,
            itemPrice: it.itemPrice ?? it.price ?? 0,
          })));
        } else if (order.serviceType || order.price) {
          setItemsList([{
            id: generateItemId(),
            serviceType: order.serviceType || 'wash',
            quantity: order.quantity || 1,
            itemPrice: order.price || 0,
          }]);
        }
      } catch (err) {
        toast.error('Failed to load order details');
        router.push('/orders');
      } finally {
        setInitialLoading(false);
      }
    };

    loadOrderForEdit();
  }, [editId]);

  if (initialLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6 max-w-full">

      {/* HEADER WITH BACK ARROW BUTTON */}
      <div className="flex items-center justify-between gap-4 px-1">
        <div>
          <h1 className="text-lg sm:text-xl font-semibold tracking-tight text-gray-900">
            {isEditMode ? 'Edit Order' : 'New Order'}
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 hidden sm:block">
            {isEditMode ? 'Update the existing laundry order details.' : 'Create a new laundry and dry cleaning order.'}
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-9 w-9 shrink-0 border-gray-200 bg-white hover:bg-gray-50 text-gray-700 transition-all shadow-sm rounded-lg"
          onClick={() => router.push('/orders')}
          title="Back to Orders"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
      </div>

      {/* Loading banner while searching */}
      {searching && (
        <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2.5">
          <Loader2 className="h-4 w-4 animate-spin text-blue-600 shrink-0" />
          <span className="text-xs font-semibold text-blue-700">Checking previous record, please wait...</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Card className="border-gray-200/80 shadow-sm bg-white rounded-xl overflow-hidden">
          <CardContent className="p-3 sm:p-6 space-y-6">

            {/* SECTION 0: DRESS CODE */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 pb-1 border-b border-gray-100">
                <QrCode className="h-4 w-4 text-blue-600 shrink-0" />
                <h2 className="text-xs font-bold tracking-wider text-gray-700 uppercase flex items-center gap-2">
                  Dress Code
                  {searching && <Loader2 className="h-3 w-3 animate-spin text-blue-500" />}
                </h2>
              </div>

              <div className="space-y-1 max-w-full sm:max-w-xs">
                <label className="text-xs font-medium text-gray-600 flex justify-between items-center">
                  <span>Dress Code *</span>
                  <button
                    type="button"
                    onClick={generateDressCode}
                    disabled={searching}
                    className="text-[11px] text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Sparkles className="h-3 w-3" /> Auto-Gen
                  </button>
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-3 flex items-center pointer-events-none gap-1">
                    <QrCode className="h-3.5 w-3.5 text-gray-400" />
                    <span className="text-sm font-bold text-blue-600 bg-blue-50 px-1 rounded border border-blue-200/60 font-mono">D-</span>
                  </div>
                  <Input
                    type="text"
                    required
                    placeholder="256"
                    disabled={searching}
                    value={formData.dressCode}
                    onChange={(e) => setFormData(p => ({ ...p, dressCode: e.target.value.replace(/[^a-zA-Z0-9]/g, '') }))}
                    onBlur={(e) => handleAutoSearch('code', e.target.value)}
                    className="h-10 sm:h-9 pl-[58px] bg-gray-50/50 border-gray-200 font-mono text-sm focus-visible:ring-blue-500 uppercase tracking-wider disabled:opacity-60"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 1: CUSTOMER INFORMATION */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 pb-1 border-b border-gray-100">
                <User className="h-4 w-4 text-blue-600 shrink-0" />
                <h2 className="text-xs font-bold tracking-wider text-gray-700 uppercase flex items-center gap-2">
                  Customer Information
                  {searching && <Loader2 className="h-3 w-3 animate-spin text-blue-500" />}
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-600">Customer Name *</label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
                    <Input
                      type="text"
                      required
                      disabled={searching}
                      value={formData.customerName}
                      onChange={(e) => setFormData(p => ({ ...p, customerName: e.target.value }))}
                      onBlur={(e) => handleAutoSearch('name', e.target.value)}
                      className="h-10 sm:h-9 pl-9 bg-gray-50/50 border-gray-200 focus-visible:ring-blue-500 text-sm disabled:opacity-60"
                      placeholder="e.g. Muhammad Daniyal"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-600">Phone Number *</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
                    <Input
                      type="tel"
                      required
                      disabled={searching}
                      value={formData.customerPhone}
                      onChange={(e) => setFormData(p => ({ ...p, customerPhone: e.target.value }))}
                      className="h-10 sm:h-9 pl-9 bg-gray-50/50 border-gray-200 focus-visible:ring-blue-500 text-sm disabled:opacity-60"
                      placeholder="03xx xxxxxxx"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-600">Address</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
                    <Textarea
                      name="customerAddress"
                      rows={1}
                      disabled={searching}
                      value={formData.customerAddress}
                      onChange={(e) => setFormData(p => ({ ...p, customerAddress: e.target.value }))}
                      className="pl-9 min-h-[40px] sm:min-h-[38px] bg-gray-50/50 border-gray-200 resize-none focus-visible:ring-blue-500 text-sm py-2 disabled:opacity-60"
                      placeholder="Street, City, Area"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 2: ORDER DETAILS */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 pb-1 border-b border-gray-100">
                <Layers className="h-4 w-4 text-blue-600 shrink-0" />
                <h2 className="text-xs font-bold tracking-wider text-gray-700 uppercase">Order Details</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-600">Delivery Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
                    <Input
                      type="date"
                      disabled={searching}
                      value={formData.deliveryDate}
                      onChange={(e) => setFormData(p => ({ ...p, deliveryDate: e.target.value }))}
                      className="h-10 sm:h-9 pl-9 bg-gray-50/50 border-gray-200 focus-visible:ring-blue-500 text-sm disabled:opacity-60"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2 space-y-1">
                  <label className="text-xs font-medium text-gray-600">Dress Description</label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
                    <Textarea
                      name="dressDescription"
                      rows={1}
                      placeholder="Color, fabric details, or specific stains..."
                      disabled={searching}
                      value={formData.dressDescription}
                      onChange={(e) => setFormData(p => ({ ...p, dressDescription: e.target.value }))}
                      className="pl-9 min-h-[40px] sm:min-h-[38px] bg-gray-50/50 border-gray-200 resize-none focus-visible:ring-blue-500 text-sm py-2 disabled:opacity-60"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 3: ITEMS (CART) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-1 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="h-4 w-4 text-blue-600 shrink-0" />
                  <h2 className="text-xs font-bold tracking-wider text-gray-700 uppercase">Items</h2>
                </div>

                <Button
                  type="button"
                  size="sm"
                  disabled={searching}
                  onClick={openItemPicker}
                  className="h-8 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold gap-1.5 disabled:opacity-60"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Item
                </Button>
              </div>

              {/* Added items list */}
              {itemsList.length === 0 ? (
                <p className="text-center text-xs text-gray-400 py-3">No items added yet. Tap "Add Item" above to choose items.</p>
              ) : (
                <div className="space-y-2">
                  {itemsList.map((it) => (
                    <div key={it.id} className="flex items-center justify-between gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2">
                      <div className="min-w-0 flex-1">
                        <p className="capitalize text-sm font-semibold text-gray-800 truncate">{it.serviceType}</p>
                        <p className="text-xs text-gray-400">Rs. {it.itemPrice} / pc</p>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          disabled={searching}
                          onClick={() => handleDecreaseItem(it.id)}
                          className="h-7 w-7 flex items-center justify-center rounded-full border border-gray-200 hover:bg-gray-50 active:bg-gray-100 transition-colors disabled:opacity-50"
                        >
                          <Minus className="h-3 w-3 text-gray-600" />
                        </button>
                        <span className="w-6 text-center text-sm font-bold text-gray-800">{it.quantity}</span>
                        <button
                          type="button"
                          disabled={searching}
                          onClick={() => handleIncreaseItem(it.id)}
                          className="h-7 w-7 flex items-center justify-center rounded-full border border-gray-200 hover:bg-gray-50 active:bg-gray-100 transition-colors disabled:opacity-50"
                        >
                          <Plus className="h-3 w-3 text-gray-600" />
                        </button>
                      </div>

                      <div className="w-16 sm:w-20 text-right shrink-0">
                        <p className="text-sm font-bold text-gray-900">Rs. {it.quantity * it.itemPrice}</p>
                      </div>

                      <button
                        type="button"
                        disabled={searching}
                        onClick={() => handleRemoveItem(it.id)}
                        className="h-7 w-7 flex items-center justify-center rounded-full hover:bg-red-50 active:bg-red-100 transition-colors shrink-0 disabled:opacity-50"
                      >
                        <Trash2 className="h-3.5 w-3.5 text-red-500" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Running total */}
              {itemsList.length > 0 && (
                <div className="flex items-center justify-between bg-blue-50 border border-blue-100 rounded-lg px-3 py-2.5">
                  <div className="flex items-center gap-1.5 text-blue-700">
                    <Receipt className="h-4 w-4" />
                    <span className="text-xs font-semibold">Total Qty: {totalQuantity} pcs</span>
                  </div>
                  <span className="text-base font-bold text-blue-800">Rs. {grandTotal}</span>
                </div>
              )}
            </div>

            {/* SECTION 4: PAYMENT & BILLING */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 pb-1 border-b border-gray-100">
                <CreditCard className="h-4 w-4 text-blue-600 shrink-0" />
                <h2 className="text-xs font-bold tracking-wider text-gray-700 uppercase">Payment & Billing</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-600">Payment Status *</label>
                  <Select
                    value={formData.paymentStatus}
                    disabled={searching}
                    onValueChange={(val) => handleSelectChange('paymentStatus', val)}
                  >
                    <SelectTrigger className="h-10 sm:h-9 w-full bg-gray-50/50 border-gray-200 text-sm disabled:opacity-60">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="paid">✅ Paid</SelectItem>
                      <SelectItem value="unpaid">❌ Unpaid</SelectItem>
                      <SelectItem value="partial">⏳ Partial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* ✨ Payment Method - ONLY SHOW when payment status is "paid" */}
                {formData.paymentStatus === 'paid' && (
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-600">Payment Method</label>
                    <Select
                      value={formData.paymentMethod}
                      disabled={searching}
                      onValueChange={(val) => handleSelectChange('paymentMethod', val)}
                    >
                      <SelectTrigger className="h-10 sm:h-9 w-full bg-gray-50/50 border-gray-200 text-sm disabled:opacity-60">
                        <div className="flex items-center gap-2">
                          <Wallet className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                          <SelectValue />
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">💵 Cash</SelectItem>
                        <SelectItem value="account">🏦 Account</SelectItem>
                        <SelectItem value="online">📱 Online</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="sm:col-span-2 space-y-1">
                  <label className="text-xs font-medium text-gray-600">Notes</label>
                  <Input
                    type="text"
                    name="notes"
                    placeholder="Urgent delivery, wrap separately etc."
                    disabled={searching}
                    value={formData.notes}
                    onChange={(e) => setFormData(p => ({ ...p, notes: e.target.value }))}
                    className="h-10 sm:h-9 bg-gray-50/50 border-gray-200 focus-visible:ring-blue-500 text-sm disabled:opacity-60"
                  />
                </div>
              </div>
            </div>

          </CardContent>
        </Card>

        {/* ACTIONS PANEL */}
        <div className="grid grid-cols-2 sm:flex sm:flex-row sm:items-center sm:justify-end gap-2 px-1 pb-2">
          <Button
            type="button"
            variant="outline"
            disabled={searching}
            className="h-11 sm:h-9 px-3 border-gray-200 text-gray-700 bg-white hover:bg-gray-50 rounded-lg text-xs font-medium transition-colors w-full sm:w-auto disabled:opacity-60"
            onClick={resetForm}
          >
            <RotateCcw className="mr-1.5 h-3.5 w-3.5 text-gray-400 inline" /> Reset
          </Button>

          <Button
            type="submit"
            disabled={loading || searching}
            className="h-11 sm:h-9 px-4 bg-blue-600 hover:bg-blue-700 text-white shadow-sm rounded-lg text-xs font-medium transition-all gap-1.5 w-full sm:w-auto disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                {isEditMode ? 'Updating...' : 'Saving...'}
              </>
            ) : searching ? (
              <>
                <Lock className="h-3.5 w-3.5" />
                Please wait...
              </>
            ) : (
              <>
                <Save className="h-3.5 w-3.5" />
                {isEditMode ? 'Update Order' : 'Save Order'}
              </>
            )}
          </Button>
        </div>
      </form>

      {/* Item picker modal */}
      <Dialog open={itemPickerOpen} onOpenChange={setItemPickerOpen}>
        <DialogContent className="sm:max-w-lg w-[92vw] rounded-xl max-h-[85vh] overflow-y-auto bg-white z-[100] border border-gray-200 shadow-2xl">
          <DialogHeader>
            <DialogTitle>Select Items</DialogTitle>
            <DialogDescription>Choose one or more items to add to this order.</DialogDescription>
          </DialogHeader>

          {itemsLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            </div>
          ) : availableItems.length === 0 ? (
            <p className="text-center text-xs text-gray-400 py-6">No items found.</p>
          ) : (
            <div className="grid grid-cols-2 gap-2 py-2">
              {availableItems.map((item) => {
                const id = item._id || item.id;
                const name = item.itemName || item.serviceType || item.title || 'Item';
                const price = item.price ?? item.itemPrice ?? 0;
                const checked = selectedItemIds.has(id);

                return (
                  <label
                    key={id}
                    className={`flex items-center gap-2 border rounded-lg px-2.5 py-2 cursor-pointer transition-colors ${
                      checked ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleItemSelect(id)}
                      className="h-4 w-4 accent-blue-600 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-gray-800 truncate capitalize">{name}</p>
                      <p className="text-[11px] text-gray-400">Rs. {price}</p>
                    </div>
                  </label>
                );
              })}
            </div>
          )}

          <DialogFooter className="flex gap-2 sm:justify-end pt-2">
            <Button variant="outline" onClick={() => setItemPickerOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={handleConfirmAddItems}
              disabled={itemsLoading}
            >
              Add Selected ({selectedItemIds.size})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function NewOrderPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-[60vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      }
    >
      <NewOrderPageContent />
    </Suspense>
  );
}