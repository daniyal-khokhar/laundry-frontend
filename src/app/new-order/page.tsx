'use client';

import { Suspense, useState, useEffect } from 'react';
import { ServiceType, PaymentStatus } from '@/lib/types';
import toast from 'react-hot-toast';
import { orderApi } from '@/lib/api';

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

// Modern UI Lucide Icons
import {
  User,
  Phone,
  MapPin,
  Mail,
  QrCode,
  Layers,
  FileText,
  Hash,
  Coins,
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
} from "lucide-react";
import { useRouter, useSearchParams } from 'next/navigation';

const serviceTypes = [
  { value: 'wash', label: '🧺 Wash' },
  { value: 'Press', label: '👔 Press' },
  { value: 'dry-clean', label: '🧼 Dry Clean' },
];

// ✨ Ek order me multiple items (cart) rakhne ke liye type — backend payload shape ke mutabiq
// { id, serviceType, quantity, itemPrice }
interface OrderItem {
  id: string;
  serviceType: string;
  quantity: number;
  itemPrice: number;
}

// Short random id generator (jaisa "sl4gr67" backend payload me tha)
const generateItemId = () => Math.random().toString(36).slice(2, 9);

// ✅ FIX: Actual page logic moved into this inner component.
// This is the component that calls useSearchParams().
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
    customerEmail: '',
    dressCode: '', // Ab isme sirf numbers store honge (e.g., "12")
    dressDescription: '',
    paymentStatus: 'unpaid' as PaymentStatus,
    paymentMethod: 'cash' as 'cash' | 'account' | 'online',
    deliveryDate: '',
    notes: '',
  });

  // ✨ Item draft — abhi jo item form me select ho raha hai, "Add Item" click hone tak
  const [itemDraft, setItemDraft] = useState({
    serviceType: 'wash',
    quantity: 1,
    price: 0,
  });

  // ✨ Cart — jitne items add ho chuke hain is order ke liye (payload me "itemsList" jayega)
  const [itemsList, setItemsList] = useState<OrderItem[]>([]);

  const searchParams = useSearchParams();
  const editId = searchParams.get('id');
  const isEditMode = Boolean(editId);
  const [initialLoading, setInitialLoading] = useState(isEditMode);

  // ✨ Cart totals — quantity aur price dono auto badhtay hain jab item increase ho
  const totalQuantity = itemsList.reduce((sum, it) => sum + it.quantity, 0);
  const grandTotal = itemsList.reduce((sum, it) => sum + it.quantity * it.itemPrice, 0);

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
          customerEmail: existingRecord.customerEmail || prev.customerEmail,
          dressCode: cleanDressCode || prev.dressCode,
          dressDescription: existingRecord.dressDescription || prev.dressDescription,
          paymentStatus: existingRecord.paymentStatus || prev.paymentStatus,
          paymentMethod: existingRecord.paymentMethod || prev.paymentMethod,
          notes: existingRecord.notes || prev.notes,
        }));

        // ✨ Agar purana record itemsList ke sath hai to wahi as-is le aayein
        if (Array.isArray(existingRecord.itemsList) && existingRecord.itemsList.length > 0) {
          setItemsList(existingRecord.itemsList.map((it: any, i: number) => ({
            id: it.id || generateItemId(),
            serviceType: it.serviceType || 'wash',
            quantity: it.quantity || 1,
            itemPrice: it.itemPrice ?? it.price ?? 0,
          })));
        } else if (existingRecord.serviceType || existingRecord.price) {
          // Legacy single-item order -> ek item bana lo
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

  // ✨ "Add Item" button — draft ko cart me daal do.
  // Agar same service type + same price wala item already list me hai, uski quantity hi badha do (increase hoti rahay, price khud-b-khud barh jayegi).
  const handleAddItem = () => {
    if (!itemDraft.price || itemDraft.price <= 0) {
      toast.error('Please enter a valid price for this item');
      return;
    }
    if (!itemDraft.quantity || itemDraft.quantity <= 0) {
      toast.error('Please enter a valid quantity');
      return;
    }

    setItemsList(prev => {
      const existingIndex = prev.findIndex(
        it => it.serviceType === itemDraft.serviceType && it.itemPrice === itemDraft.price
      );

      if (existingIndex > -1) {
        // Same item dobara add ho raha hai -> quantity barhado (total khud recalc ho jata hai)
        const updated = [...prev];
        const existing = updated[existingIndex];
        updated[existingIndex] = {
          ...existing,
          quantity: existing.quantity + itemDraft.quantity,
        };
        return updated;
      }

      // Naya item
      return [
        ...prev,
        {
          id: generateItemId(),
          serviceType: itemDraft.serviceType,
          quantity: itemDraft.quantity,
          itemPrice: itemDraft.price,
        },
      ];
    });

    toast.success('Item added to order! 🧺');
    setItemDraft(prev => ({ ...prev, quantity: 1, price: 0 }));
  };

  // ✨ cart me kisi item ki quantity ±1 karo, price/total khud badh/ghat jaye
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (itemsList.length === 0) {
      toast.error('Please add at least one item to the order');
      return;
    }

    setLoading(true);

    try {
      const finalDressCode = formData.dressCode ? `D-${formData.dressCode.replace(/^D-/, '')}` : '';

      // ✨ payload backend DTO/schema ke mutabiq: itemsList[] + top-level serviceType/quantity/price
      // (total quantity aur grand total) backward-compatibility ke liye
      const payload = {
        ...formData,
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

  // Quick helper to auto-generate unique numbers instantly
  const generateDressCode = () => {
    const randomSuffix = Math.floor(10 + Math.random() * 90); // 2 digit random number
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
      customerEmail: '',
      dressCode: '',
      dressDescription: '',
      paymentStatus: 'unpaid',
      paymentMethod: 'cash',
      deliveryDate: '',
      notes: '',
    });
    setItemsList([]);
    setItemDraft({ serviceType: 'wash', quantity: 1, price: 0 });
  };

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
          customerEmail: order.customerEmail || '',
          dressCode: order.dressCode ? order.dressCode.replace(/^D-/, '') : '',
          dressDescription: order.dressDescription || '',
          paymentStatus: order.paymentStatus || 'unpaid',
          paymentMethod: order.paymentMethod || 'cash',
          deliveryDate: order.deliveryDate
            ? new Date(order.deliveryDate).toISOString().split('T')[0]
            : '',
          notes: order.notes || '',
        });

        // ✨ Agar order pehle se itemsList ke sath bana tha to wahi load karo,
        // warna legacy single serviceType/quantity/price ko ek item bana lo
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

      {/* --- HEADER WITH BACK ARROW BUTTON --- */}
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

      <form onSubmit={handleSubmit} className="space-y-4">
        <Card className="border-gray-200/80 shadow-sm bg-white rounded-xl overflow-hidden">
          <CardContent className="p-3 sm:p-6 space-y-6">

            {/* --- SECTION 1: CUSTOMER INFORMATION --- */}
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
                      value={formData.customerName}
                      onChange={(e) => setFormData(p => ({ ...p, customerName: e.target.value }))}
                      onBlur={(e) => handleAutoSearch('name', e.target.value)}
                      className="h-10 sm:h-9 pl-9 bg-gray-50/50 border-gray-200 focus-visible:ring-blue-500 text-sm"
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
                      value={formData.customerPhone}
                      onChange={(e) => setFormData(p => ({ ...p, customerPhone: e.target.value }))}
                      className="h-10 sm:h-9 pl-9 bg-gray-50/50 border-gray-200 focus-visible:ring-blue-500 text-sm"
                      placeholder="03xx xxxxxxx"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-600">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
                    <Input
                      type="email"
                      value={formData.customerEmail}
                      onChange={(e) => setFormData(p => ({ ...p, customerEmail: e.target.value }))}
                      className="h-10 sm:h-9 pl-9 bg-gray-50/50 border-gray-200 focus-visible:ring-blue-500 text-sm"
                      placeholder="customer@example.com"
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
                      value={formData.customerAddress}
                      onChange={(e) => setFormData(p => ({ ...p, customerAddress: e.target.value }))}
                      className="pl-9 min-h-[40px] sm:min-h-[38px] bg-gray-50/50 border-gray-200 resize-none focus-visible:ring-blue-500 text-sm py-2"
                      placeholder="Street, City, Area"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* --- SECTION 2: DRESS CODE / BRANCH / DELIVERY --- */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 pb-1 border-b border-gray-100">
                <Layers className="h-4 w-4 text-blue-600 shrink-0" />
                <h2 className="text-xs font-bold tracking-wider text-gray-700 uppercase">Order Details</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-600 flex justify-between items-center">
                    <span>Dress Code *</span>
                    <button
                      type="button"
                      onClick={generateDressCode}
                      className="text-[11px] text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1 transition-all"
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
                      value={formData.dressCode}
                      onChange={(e) => setFormData(p => ({ ...p, dressCode: e.target.value.replace(/[^a-zA-Z0-9]/g, '') }))}
                      onBlur={(e) => handleAutoSearch('code', e.target.value)}
                      className="h-10 sm:h-9 pl-[58px] bg-gray-50/50 border-gray-200 font-mono text-sm focus-visible:ring-blue-500 uppercase tracking-wider"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-600">Delivery Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
                    <Input
                      type="date"
                      value={formData.deliveryDate}
                      onChange={(e) => setFormData(p => ({ ...p, deliveryDate: e.target.value }))}
                      className="h-10 sm:h-9 pl-9 bg-gray-50/50 border-gray-200 focus-visible:ring-blue-500 text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-600">Branch *</label>
                  <Select
                    value={formData.branchId}
                    onValueChange={(value) => {
                      const safeValue = value || '1';
                      const branchMap: { [key: string]: string } = {
                        '1': 'D1',
                        '2': 'D2',
                        '3': 'D3',
                      };
                      setFormData((prev) => ({
                        ...prev,
                        branchId: safeValue,
                        branchCode: branchMap[safeValue] || 'D1',
                      }));
                    }}
                  >
                    <SelectTrigger className="h-10 sm:h-9 w-full bg-gray-50/50 border-gray-200 text-sm">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                        <SelectValue placeholder="Select Branch" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Decent1 (D1)</SelectItem>
                      <SelectItem value="2">Decent2 (D2)</SelectItem>
                      <SelectItem value="3">Decent3 (D3)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-600">Dress Description</label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
                    <Textarea
                      name="dressDescription"
                      rows={1}
                      placeholder="Color, fabric details, or specific stains..."
                      value={formData.dressDescription}
                      onChange={(e) => setFormData(p => ({ ...p, dressDescription: e.target.value }))}
                      className="pl-9 min-h-[40px] sm:min-h-[38px] bg-gray-50/50 border-gray-200 resize-none focus-visible:ring-blue-500 text-sm py-2"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* --- SECTION 3: ITEMS (CART) — Add Item button, list with +/- to grow qty & price, running total --- */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 pb-1 border-b border-gray-100">
                <ShoppingBag className="h-4 w-4 text-blue-600 shrink-0" />
                <h2 className="text-xs font-bold tracking-wider text-gray-700 uppercase">Items</h2>
              </div>

              {/* Item draft picker */}
              <div className="bg-gray-50/60 border border-gray-200 rounded-lg p-3 space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="col-span-2 sm:col-span-2 space-y-1">
                    <label className="text-xs font-medium text-gray-600">Service Type</label>
                    <Select
                      value={itemDraft.serviceType}
                      onValueChange={(val) => setItemDraft(p => ({ ...p, serviceType: val || 'wash' }))}
                    >
                      <SelectTrigger className="h-10 sm:h-9 w-full bg-white border-gray-200 text-sm">
                        <SelectValue placeholder="Select service" />
                      </SelectTrigger>
                      <SelectContent>
                        {serviceTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-600">Qty</label>
                    <div className="relative">
                      <Hash className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
                      <Input
                        type="number"
                        min="1"
                        value={itemDraft.quantity}
                        onChange={(e) => setItemDraft(p => ({ ...p, quantity: Math.max(1, Number(e.target.value)) }))}
                        className="h-10 sm:h-9 pl-9 bg-white border-gray-200 focus-visible:ring-blue-500 text-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-600">Price (Rs.)</label>
                    <div className="relative">
                      <Coins className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={itemDraft.price || ''}
                        onChange={(e) => setItemDraft(p => ({ ...p, price: Number(e.target.value) }))}
                        className="h-10 sm:h-9 pl-9 bg-white border-gray-200 font-semibold focus-visible:ring-blue-500 text-sm"
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>

                <Button
                  type="button"
                  onClick={handleAddItem}
                  className="w-full h-9 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold gap-1.5"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Item
                </Button>
              </div>

              {/* Added items list */}
              {itemsList.length === 0 ? (
                <p className="text-center text-xs text-gray-400 py-3">No items added yet. Add at least one item above.</p>
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
                          onClick={() => handleDecreaseItem(it.id)}
                          className="h-7 w-7 flex items-center justify-center rounded-full border border-gray-200 hover:bg-gray-50 active:bg-gray-100 transition-colors"
                        >
                          <Minus className="h-3 w-3 text-gray-600" />
                        </button>
                        <span className="w-6 text-center text-sm font-bold text-gray-800">{it.quantity}</span>
                        <button
                          type="button"
                          onClick={() => handleIncreaseItem(it.id)}
                          className="h-7 w-7 flex items-center justify-center rounded-full border border-gray-200 hover:bg-gray-50 active:bg-gray-100 transition-colors"
                        >
                          <Plus className="h-3 w-3 text-gray-600" />
                        </button>
                      </div>

                      <div className="w-16 sm:w-20 text-right shrink-0">
                        <p className="text-sm font-bold text-gray-900">Rs. {it.quantity * it.itemPrice}</p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveItem(it.id)}
                        className="h-7 w-7 flex items-center justify-center rounded-full hover:bg-red-50 active:bg-red-100 transition-colors shrink-0"
                      >
                        <Trash2 className="h-3.5 w-3.5 text-red-500" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Running total — quantity + grand total, jo payload me jayega */}
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

            {/* --- SECTION 4: PAYMENT & BILLING --- */}
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
                    onValueChange={(val) => handleSelectChange('paymentStatus', val)}
                  >
                    <SelectTrigger className="h-10 sm:h-9 w-full bg-gray-50/50 border-gray-200 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="paid">✅ Paid</SelectItem>
                      <SelectItem value="unpaid">❌ Unpaid</SelectItem>
                      <SelectItem value="partial">⏳ Partial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-600">Payment Method</label>
                  <Select
                    value={formData.paymentMethod}
                    onValueChange={(val) => handleSelectChange('paymentMethod', val)}
                  >
                    <SelectTrigger className="h-10 sm:h-9 w-full bg-gray-50/50 border-gray-200 text-sm">
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

                <div className="sm:col-span-2 space-y-1">
                  <label className="text-xs font-medium text-gray-600">Notes</label>
                  <Input
                    type="text"
                    name="notes"
                    placeholder="Urgent delivery, wrap separately etc."
                    value={formData.notes}
                    onChange={(e) => setFormData(p => ({ ...p, notes: e.target.value }))}
                    className="h-10 sm:h-9 bg-gray-50/50 border-gray-200 focus-visible:ring-blue-500 text-sm"
                  />
                </div>
              </div>
            </div>

          </CardContent>
        </Card>

        {/* --- ACTIONS PANEL ---
            Mobile par full-width stacked buttons (thumb-friendly, always visible in normal page flow),
            desktop par inline right-aligned. No "fixed" positioning here so it can never get hidden
            behind other UI (bottom nav bars, etc.) — it just sits at the end of the form. */}
        <div className="grid grid-cols-2 sm:flex sm:flex-row sm:items-center sm:justify-end gap-2 px-1 pb-2">
          <Button
            type="button"
            variant="outline"
            className="h-11 sm:h-9 px-3 border-gray-200 text-gray-700 bg-white hover:bg-gray-50 rounded-lg text-xs font-medium transition-colors w-full sm:w-auto"
            onClick={resetForm}
          >
            <RotateCcw className="mr-1.5 h-3.5 w-3.5 text-gray-400 inline" /> Reset
          </Button>

          <Button
            type="submit"
            disabled={loading}
            className="h-11 sm:h-9 px-4 bg-blue-600 hover:bg-blue-700 text-white shadow-sm rounded-lg text-xs font-medium transition-all gap-1.5 w-full sm:w-auto"
          >
            {loading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                {isEditMode ? 'Updating...' : 'Saving...'}
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
    </div>
  );
}

// ✅ FIX: Default export is now a thin wrapper that provides the
// required Suspense boundary around the component using useSearchParams().
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