'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
  RotateCcw
} from "lucide-react";

const serviceTypes = [
  { value: 'wash', label: '🧺 Wash' },
  { value: 'iron', label: '👔 Iron' },
  { value: 'dry-clean', label: '🧼 Dry Clean' },
];

export default function NewOrderPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    branchId: '1',
    branchCode: 'D1',
    customerName: '',
    customerPhone: '',
    customerAddress: '',
    customerEmail: '',
    dressCode: '',
    dressDescription: '',
    serviceType: 'wash' as ServiceType,
    quantity: 1,
    price: 0,
    paymentStatus: 'unpaid' as PaymentStatus,
    paymentMethod: 'cash' as 'cash' | 'account' | 'online',
    deliveryDate: '',
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const order = await orderApi.create({
        ...formData,
        price: Number(formData.price),
        quantity: Number(formData.quantity),
        deliveryDate: formData.deliveryDate ? new Date(formData.deliveryDate) : undefined,
      });
      
      toast.success(`Order ${order.orderNumber} created successfully!`);
      router.push('/orders');
    } catch (error) {
      toast.error('Failed to create order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectChange = (name: string, value: string | null) => {
    setFormData((prev) => ({ ...prev, [name]: value || '' }));
  };

  return (
    <div className="space-y-6 max-w-full">
      
      {/* Header exactly aligned with list component text headers */}
      <div className="flex flex-col gap-0.5 px-1">
        <h1 className="text-xl font-semibold tracking-tight text-gray-900">New Order</h1>
        <p className="text-sm text-gray-500">Create a new laundry and dry cleaning order.</p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="border-gray-200/80 shadow-sm bg-white rounded-lg">
          {/* Responsive inner padding */}
          <CardContent className="p-4 sm:p-6 space-y-6">
            
            {/* --- SECTION 1: CUSTOMER INFORMATION (Strictly 2 Inputs Per Row) --- */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 pb-1 border-b border-gray-100">
                <User className="h-4 w-4 text-blue-600 shrink-0" />
                <h2 className="text-xs font-bold tracking-wider text-gray-700 uppercase">Customer Information</h2>
              </div>
              
              {/* Responsive grid: 1 column on mobile, exactly 2 columns on sm screens and up */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
                {/* Row 1 - Input 1 */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-600">Customer Name *</label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
                    <Input
                      type="text"
                      required
                      value={formData.customerName}
                      onChange={(e) => setFormData(p => ({...p, customerName: e.target.value}))}
                      className="h-9 pl-9 bg-gray-50/50 border-gray-200 focus-visible:ring-blue-500 text-sm"
                      placeholder="John Doe"
                    />
                  </div>
                </div>

                {/* Row 1 - Input 2 */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-600">Phone Number *</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
                    <Input
                      type="tel"
                      required
                      value={formData.customerPhone}
                      onChange={(e) => setFormData(p => ({...p, customerPhone: e.target.value}))}
                      className="h-9 pl-9 bg-gray-50/50 border-gray-200 focus-visible:ring-blue-500 text-sm"
                      placeholder="03xx xxxxxxx"
                    />
                  </div>
                </div>

                {/* Row 2 - Input 1 */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-600">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
                    <Input
                      type="email"
                      value={formData.customerEmail}
                      onChange={(e) => setFormData(p => ({...p, customerEmail: e.target.value}))}
                      className="h-9 pl-9 bg-gray-50/50 border-gray-200 focus-visible:ring-blue-500 text-sm"
                      placeholder="customer@example.com"
                    />
                  </div>
                </div>

                {/* Row 2 - Input 2 */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-600">Address</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
                    <Textarea
                      name="customerAddress"
                      rows={1}
                      value={formData.customerAddress}
                      onChange={(e) => setFormData(p => ({...p, customerAddress: e.target.value}))}
                      className="pl-9 min-h-[38px] bg-gray-50/50 border-gray-200 resize-none focus-visible:ring-blue-500 text-sm py-2"
                      placeholder="Street, City, Area"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* --- SECTION 2: ORDER DETAILS (Strictly 2 Inputs Per Row) --- */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 pb-1 border-b border-gray-100">
                <Layers className="h-4 w-4 text-blue-600 shrink-0" />
                <h2 className="text-xs font-bold tracking-wider text-gray-700 uppercase">Order Details</h2>
              </div>

              {/* Responsive grid: 1 column on mobile, exactly 2 columns on sm screens and up */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
                {/* Row 1 - Input 1 */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-600">Dress Code *</label>
                  <div className="relative">
                    <QrCode className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
                    <Input
                      type="text"
                      required
                      placeholder="e.g., SUIT-001"
                      value={formData.dressCode}
                      onChange={(e) => setFormData(p => ({...p, dressCode: e.target.value}))}
                      className="h-9 pl-9 bg-gray-50/50 border-gray-200 font-mono text-sm focus-visible:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Row 1 - Input 2 */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-600">Service Type *</label>
                  <Select 
                    value={formData.serviceType} 
                    onValueChange={(val) => handleSelectChange('serviceType', val)}
                  >
                    <SelectTrigger className="h-9 bg-gray-50/50 border-gray-200 text-sm">
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

                {/* Row 2 - Input 1 */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-600">Quantity</label>
                  <div className="relative">
                    <Hash className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
                    <Input
                      type="number"
                      min="1"
                      value={formData.quantity}
                      onChange={(e) => setFormData(p => ({...p, quantity: Number(e.target.value)}))}
                      className="h-9 pl-9 bg-gray-50/50 border-gray-200 focus-visible:ring-blue-500 text-sm"
                    />
                  </div>
                </div>

                {/* Row 2 - Input 2 */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-600">Price (Rs.) *</label>
                  <div className="relative">
                    <Coins className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
                    <Input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData(p => ({...p, price: Number(e.target.value)}))}
                      className="h-9 pl-9 bg-gray-50/50 border-gray-200 font-semibold focus-visible:ring-blue-500 text-sm"
                    />
                  </div>
                </div>

                {/* Row 3 - Input 1 */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-600">Delivery Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
                    <Input
                      type="date"
                      value={formData.deliveryDate}
                      onChange={(e) => setFormData(p => ({...p, deliveryDate: e.target.value}))}
                      className="h-9 pl-9 bg-gray-50/50 border-gray-200 focus-visible:ring-blue-500 text-sm"
                    />
                  </div>
                </div>

                {/* Row 3 - Input 2 */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-600">Branch</label>
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
                    <SelectTrigger className="h-9 bg-gray-50/50 border-gray-200 text-sm">
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

                {/* Row 4 - Input 1 (Spans both columns on desktop, full width on mobile) */}
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-xs font-medium text-gray-600">Dress Description</label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
                    <Textarea
                      name="dressDescription"
                      rows={1}
                      placeholder="Color, fabric, special instructions..."
                      value={formData.dressDescription}
                      onChange={(e) => setFormData(p => ({...p, dressDescription: e.target.value}))}
                      className="pl-9 min-h-[38px] bg-gray-50/50 border-gray-200 resize-none focus-visible:ring-blue-500 text-sm py-2"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* --- SECTION 3: PAYMENT & BILLING (Strictly 2 Inputs Per Row) --- */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 pb-1 border-b border-gray-100">
                <CreditCard className="h-4 w-4 text-blue-600 shrink-0" />
                <h2 className="text-xs font-bold tracking-wider text-gray-700 uppercase">Payment & Billing</h2>
              </div>

              {/* Responsive grid: 1 column on mobile, exactly 2 columns on sm screens and up */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
                {/* Row 1 - Input 1 */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-600">Payment Status *</label>
                  <Select 
                    value={formData.paymentStatus} 
                    onValueChange={(val) => handleSelectChange('paymentStatus', val)}
                  >
                    <SelectTrigger className="h-9 bg-gray-50/50 border-gray-200 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="paid">✅ Paid</SelectItem>
                      <SelectItem value="unpaid">❌ Unpaid</SelectItem>
                      <SelectItem value="partial">🔄 Partial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Row 1 - Input 2 */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-600">Payment Method</label>
                  <Select 
                    value={formData.paymentMethod} 
                    onValueChange={(val) => handleSelectChange('paymentMethod', val)}
                  >
                    <SelectTrigger className="h-9 bg-gray-50/50 border-gray-200 text-sm">
                      <div className="flex items-center gap-2">
                        <Wallet className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                        <SelectValue />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="account">Account</SelectItem>
                      <SelectItem value="online">Online</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Row 2 - Input 1 (Full width notes section) */}
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-xs font-medium text-gray-600">Notes</label>
                  <Input
                    type="text"
                    name="notes"
                    placeholder="Special instructions"
                    value={formData.notes}
                    onChange={(e) => setFormData(p => ({...p, notes: e.target.value}))}
                    className="h-9 bg-gray-50/50 border-gray-200 focus-visible:ring-blue-500 text-sm"
                  />
                </div>
              </div>
            </div>

          </CardContent>
        </Card>

        {/* --- ACTIONS PANEL: Fully Responsive Footer Buttons --- */}
        <div className="flex flex-row items-center justify-end gap-2 pt-3 px-1 w-full sm:w-auto">
          <Button
            type="reset"
            variant="outline"
            className="h-9 px-3 border-gray-200 text-gray-700 bg-white hover:bg-gray-50 rounded-md text-xs font-medium transition-colors flex-1 sm:flex-initial"
            onClick={() => setFormData({
              branchId: '1',
              branchCode: 'D1',
              customerName: '',
              customerPhone: '',
              customerAddress: '',
              customerEmail: '',
              dressCode: '',
              dressDescription: '',
              serviceType: 'wash',
              quantity: 1,
              price: 0,
              paymentStatus: 'unpaid',
              paymentMethod: 'cash',
              deliveryDate: '',
              notes: '',
            })}
          >
            <RotateCcw className="mr-1.5 h-3.5 w-3.5 text-gray-400 inline" /> Reset
          </Button>

          <Button
            type="submit"
            disabled={loading}
            className="h-9 px-4 bg-blue-600 hover:bg-blue-700 text-white shadow-sm rounded-md text-xs font-medium transition-all gap-1.5 flex-1 sm:flex-initial"
          >
            {loading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-3.5 w-3.5" />
                Save Order
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}