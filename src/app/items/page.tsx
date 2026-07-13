'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

import {
  Tag,
  Coins,
  Package,
  Layers,
  FileText,
  Loader2,
  Save,
  RotateCcw,
  Trash2,
  Pencil,
  Plus,
} from "lucide-react";
import { itemApi } from '@/lib/itemApi';

const itemTypes = [
  { value: 'wash', label: '🧺 Wash' },
  { value: 'Press', label: '👔 Press' },
  { value: 'dry-clean', label: '🧼 Dry Clean' },
];

const perItemUnits = [
  { value: 'piece', label: 'Per Piece' },
  { value: 'kg', label: 'Per Kg' },
  { value: 'pair', label: 'Per Pair' },
  { value: 'dozen', label: 'Per Dozen' },
];

const emptyForm = {
  itemName: '',
  price: 0,
  perItem: 'piece',
  type: 'wash',
  description: '',
};

export default function ItemsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null); // ✨ null = create mode, id = edit mode

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      setLoading(true);
      const response = await itemApi.getAll();
      const list = Array.isArray(response) ? response : (response?.data || []);
      setItems(list);
    } catch (error) {
      toast.error('Failed to load items');
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData(emptyForm);
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const payload = {
        ...formData,
        price: Number(formData.price),
      };

      if (editingId) {
        // ✨ UPDATE existing item
        await itemApi.update(editingId, payload);
        toast.success('Item updated successfully!');
      } else {
        // ✨ CREATE new item
        await itemApi.create(payload);
        toast.success('Item added successfully!');
      }

      resetForm();
      loadItems();
    } catch (error) {
      toast.error(editingId ? 'Failed to update item.' : 'Failed to add item.');
    } finally {
      setSaving(false);
    }
  };

  // ✨ Edit button click par form ko us item ki details se bhar dein (same page par, koi navigation nahi)
  const handleEditClick = (item: any) => {
    setEditingId(item._id);
    setFormData({
      itemName: item.itemName || '',
      price: item.price || 0,
      perItem: item.perItem || 'piece',
      type: item.type || 'wash',
      description: item.description || '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteClick = (item: any) => {
    setItemToDelete(item);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    setDeleting(true);
    try {
      await itemApi.delete(itemToDelete._id);
      toast.success('Item deleted successfully');
      setDeleteModalOpen(false);
      setItemToDelete(null);
      loadItems();
    } catch (error) {
      toast.error('Failed to delete item');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-4 md:space-y-6 max-w-full">

      {/* --- HEADER --- */}
      <div className="flex items-center justify-between gap-4 px-1">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-gray-900">Items</h1>
          <p className="text-sm text-gray-500 hidden sm:block">Manage service items and their pricing.</p>
        </div>
      </div>

      {/* --- FORM CARD --- */}
      <form onSubmit={handleSubmit}>
        <Card className="border-gray-200/80 shadow-sm bg-white rounded-xl overflow-hidden">
          <CardContent className="p-4 sm:p-6 space-y-4">
            <div className="flex items-center gap-2 pb-1 border-b border-gray-100">
              <Package className="h-4 w-4 text-blue-600 shrink-0" />
              <h2 className="text-xs font-bold tracking-wider text-gray-700 uppercase">
                {editingId ? 'Edit Item' : 'Add New Item'}
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-600">Item Name *</label>
                <div className="relative">
                  <Tag className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
                  <Input
                    type="text"
                    required
                    value={formData.itemName}
                    onChange={(e) => setFormData(p => ({ ...p, itemName: e.target.value }))}
                    className="h-9 pl-9 bg-gray-50/50 border-gray-200 focus-visible:ring-blue-500 text-sm"
                    placeholder="e.g. Shirt, Pant, Blanket"
                  />
                </div>
              </div>

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
                    onChange={(e) => setFormData(p => ({ ...p, price: Number(e.target.value) }))}
                    className="h-9 pl-9 bg-gray-50/50 border-gray-200 font-semibold focus-visible:ring-blue-500 text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-600">Per Item Unit *</label>
                <Select
                  value={formData.perItem}
                  onValueChange={(val) => setFormData(p => ({ ...p, perItem: val || 'piece' }))}
                >
                  <SelectTrigger className="h-9 w-full bg-gray-50/50 border-gray-200 text-sm">
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent>
                    {perItemUnits.map((unit) => (
                      <SelectItem key={unit.value} value={unit.value}>
                        {unit.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-600">Service Type *</label>
                <Select
                  value={formData.type}
                  onValueChange={(val) => setFormData(p => ({ ...p, type: val || 'wash' }))}
                >
                  <SelectTrigger className="h-9 w-full bg-gray-50/50 border-gray-200 text-sm">
                    <div className="flex items-center gap-2">
                      <Layers className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                      <SelectValue placeholder="Select type" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {itemTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="sm:col-span-2 space-y-1">
                <label className="text-xs font-medium text-gray-600">Description</label>
                <div className="relative">
                  <FileText className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
                  <Textarea
                    rows={1}
                    value={formData.description}
                    onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))}
                    className="pl-9 min-h-[38px] bg-gray-50/50 border-gray-200 resize-none focus-visible:ring-blue-500 text-sm py-2"
                    placeholder="Optional notes about this item..."
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              {editingId && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetForm}
                  className="h-9 px-3 border-gray-200 text-gray-700 bg-white hover:bg-gray-50 rounded-lg text-xs font-medium"
                >
                  <RotateCcw className="mr-1.5 h-3.5 w-3.5 text-gray-400" /> Cancel Edit
                </Button>
              )}
              <Button
                type="submit"
                disabled={saving}
                className="h-9 px-4 bg-blue-600 hover:bg-blue-700 text-white shadow-sm rounded-lg text-xs font-medium gap-1.5"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    {editingId ? 'Updating...' : 'Saving...'}
                  </>
                ) : (
                  <>
                    {editingId ? <Save className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                    {editingId ? 'Update Item' : 'Add Item'}
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>

      {/* --- ITEMS LIST --- */}
      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
        </div>
      ) : items.length === 0 ? (
        <Card className="border-gray-200/80 shadow-sm bg-white rounded-lg p-8 text-center text-gray-400 text-sm">
          No items added yet.
        </Card>
      ) : (
        <Card className="border-gray-200/80 shadow-sm bg-white rounded-lg overflow-hidden">
          <CardContent className="p-0">
            <div className="w-full overflow-x-auto">
              <Table className="min-w-full whitespace-nowrap">
                <TableHeader className="bg-gray-50/70">
                  <TableRow>
                    <TableHead className="text-xs font-semibold text-gray-500">Item Name</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-500">Price</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-500">Per Item</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-500">Type</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-500">Description</TableHead>
                    <TableHead className="text-right text-xs font-semibold text-gray-500 pr-6">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item._id} className="hover:bg-gray-50/60 transition-colors">
                      <TableCell className="text-sm font-semibold text-gray-900">{item.itemName}</TableCell>
                      <TableCell className="text-sm font-bold text-gray-900">Rs. {item.price}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize text-[11px] font-semibold bg-gray-100 text-gray-700">
                          {item.perItem}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="capitalize text-sm font-medium text-gray-800">{item.type}</span>
                      </TableCell>
                      <TableCell className="text-xs text-gray-500 max-w-[200px] truncate">
                        {item.description || '—'}
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-blue-600 hover:bg-blue-50"
                            onClick={() => handleEditClick(item)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-red-600 hover:bg-red-50"
                            onClick={() => handleDeleteClick(item)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

    {/* --- DELETE CONFIRMATION MODAL --- */}
<Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
  <DialogContent className="sm:max-w-md bg-white dark:bg-zinc-950 text-slate-900 dark:text-slate-50 border border-slate-200 dark:border-slate-800 p-6 rounded-lg shadow-lg">
    <DialogHeader>
      <DialogTitle className="text-xl font-semibold tracking-tight">Delete Item?</DialogTitle>
      <DialogDescription className="text-sm text-slate-500 dark:text-slate-400 mt-2">
        Kya aap wakai <span className="font-medium text-slate-900 dark:text-slate-100">"{itemToDelete?.itemName}"</span> ko delete karna chahte hain? 
        Ye action wapis nahi ho sakta.
      </DialogDescription>
    </DialogHeader>
    
    <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end mt-4">
      <Button 
        variant="outline" 
        onClick={() => setDeleteModalOpen(false)} 
        disabled={deleting}
        className="w-full sm:w-auto"
      >
        Cancel
      </Button>
      <Button 
  variant="destructive" 
  onClick={confirmDelete} 
  disabled={deleting}
  className="w-full sm:w-auto flex items-center justify-center border border-transparent hover:border-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 text-black hover:text-red-600 transition-all duration-200"
>
  {deleting ? (
    <>
      <Loader2 className="h-4 w-4 animate-spin mr-2" /> 
      Deleting...
    </>
  ) : (
    'Delete'
  )}
</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
    </div>
  );
}