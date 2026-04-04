import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Package, Users, ShoppingCart, TrendingUp, Download, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useApp } from '@/context/AppContext';
import { Product } from '@/types';
import { toast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { getApiUrl } from '@/lib/api';

// All available categories
const ALL_CATEGORIES = [
  { value: 'chargers', label: 'Chargers' },
  { value: 'headphones', label: 'Headphones' },
  { value: 'smart-watches', label: 'Smart Watches' },
  { value: 'viral', label: 'Viral Gadgets' },
  { value: 'electronics-devices', label: 'Electronics Devices' },
  { value: 'toys', label: 'Toys' },
];

const AdminPanel = () => {
  const { products, dispatch, user, cart, fetchProducts } = useApp();
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [editingOrder, setEditingOrder] = useState<any | null>(null);
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isProcessingLogistics, setIsProcessingLogistics] = useState(false);
  const [shippingStageFilter, setShippingStageFilter] = useState<string>('all');
  const [allOrders, setAllOrders] = useState<any[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<any[]>([]);
  const [dateFilter, setDateFilter] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [productSearch, setProductSearch] = useState('');

  const [coupons, setCoupons] = useState<any[]>([]);
  const [isAddingCoupon, setIsAddingCoupon] = useState(false);
  const [newCoupon, setNewCoupon] = useState({
    code: '',
    discountType: 'flat',
    discountValue: '',
    applicableProducts: [] as string[]
  });

  const getEmptyProduct = () => ({
    name: '',
    price: '',
    originalPrice: '',
    description: '',
    category: 'chargers',
    image: '',
    images: [] as string[],
    video: '',
    rating: '4.5',
    reviews: '0',
    inStock: true,
    discount: '',
    color: '',
    features: '',
    isTrending: false,
    quantity: '10',
    weight: '0.5',
    length: '10',
    breadth: '10',
    height: '5'
  });

  const [newProduct, setNewProduct] = useState(getEmptyProduct());

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    if (user?.token) {
      fetchCoupons();
    }
  }, [user?.token]);

  useEffect(() => {
    if (dateFilter) {
      setFilteredOrders(allOrders.filter(o => o.createdAt && o.createdAt.startsWith(dateFilter)));
    } else {
      setFilteredOrders(allOrders);
    }
  }, [dateFilter, allOrders]);

  const fetchOrders = async () => {
    try {
      const response = await fetch(getApiUrl('/api/orders'));
      if (response.ok) {
        const data = await response.json();
        setAllOrders(data);
        setFilteredOrders(data);
      }
    } catch (error) {
      console.error("Failed to fetch orders", error);
    }
  };

  const fetchCoupons = async () => {
    try {
      const response = await fetch(getApiUrl('/api/coupons'), {
        headers: { 'Authorization': `Bearer ${user?.token}` }
      });
      if (response.ok) {
        setCoupons(await response.json());
      }
    } catch (err) { }
  };

  const handleAddCoupon = async () => {
    if (!newCoupon.code || !newCoupon.discountValue) {
      toast({ title: 'Error', description: 'Please fill in required fields.', variant: 'destructive' });
      return;
    }
    try {
      const res = await fetch(getApiUrl('/api/coupons'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.token}`
        },
        body: JSON.stringify({
          code: newCoupon.code.toUpperCase(),
          discountType: newCoupon.discountType,
          discountValue: Number(newCoupon.discountValue),
          applicableProducts: newCoupon.applicableProducts
        })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to add coupon");
      }
      toast({ title: "Coupon created", description: "Coupon added successfully." });
      setIsAddingCoupon(false);
      setNewCoupon({ code: '', discountType: 'flat', discountValue: '', applicableProducts: [] as string[] });
      fetchCoupons();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleDeleteCoupon = async (id: string) => {
    if (!confirm("Delete this coupon permanently?")) return;
    try {
      await fetch(getApiUrl(`/api/coupons/${id}`), {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${user?.token}` }
      });
      toast({ title: "Deleted", description: "Coupon removed." });
      fetchCoupons();
    } catch (err) {}
  };

  const handleUpdateOrder = async () => {
    if (!editingOrder) return;
    try {
      const response = await fetch(getApiUrl(`/api/orders/${editingOrder._id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: editingOrder.status })
      });
      if (response.ok) {
        toast({ title: "Order Updated", description: "Order status has been updated." });
        setEditingOrder(null);
        fetchOrders();
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to update order", variant: "destructive" });
    }
  };

  // ---- SHIPPING COMMAND CENTER HANDLERS ----

  const apiPost = async (endpoint: string, body: any) => {
    const res = await fetch(getApiUrl(endpoint), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user?.token}` },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || `Error ${res.status}`);
    return data;
  };

  const handleShiprocketSync = async () => {
    const toSync = selectedOrderIds.filter(id => !allOrders.find(o => o._id === id)?.shiprocketOrderId);
    if (toSync.length === 0) {
      toast({ title: 'Nothing to Sync', description: 'Selected orders are already synced or none selected.', variant: 'destructive' });
      return;
    }
    setIsSyncing(true);
    try {
      const data = await apiPost('/api/shiprocket/sync-bulk', { orderIds: toSync });
      const ok = data.results.filter((r: any) => r.status === 'success').length;
      const skip = data.results.filter((r: any) => r.status === 'skipped').length;
      const fail = data.results.filter((r: any) => r.status === 'error').length;
      const awbCount = data.results.filter((r: any) => r.awb).length;
      toast({
        title: `✅ Sync Complete`,
        description: `${ok} synced${awbCount > 0 ? ` (${awbCount} AWB auto-assigned)` : ''} · ${skip} skipped · ${fail} failed`
      });
      setSelectedOrderIds([]);
      fetchOrders();
    } catch (err: any) {
      toast({ title: 'Sync Error', description: err.message, variant: 'destructive' });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleBulkAWB = async () => {
    const eligible = allOrders.filter(o => selectedOrderIds.includes(o._id) && o.shiprocketOrderId && !o.awbNumber);
    if (eligible.length === 0) {
      toast({ title: 'No Eligible Orders', description: 'Select synced orders that don\'t have an AWB yet.', variant: 'destructive' });
      return;
    }
    setIsProcessingLogistics(true);
    try {
      const data = await apiPost('/api/shiprocket/assign-awb-bulk', { orderIds: eligible.map((o: any) => o._id) });
      const ok = data.results.filter((r: any) => r.status === 'success').length;
      const skip = data.results.filter((r: any) => r.status === 'skipped').length;
      const fail = data.results.filter((r: any) => r.status === 'error').length;
      toast({
        title: `🏷️ AWB Assignment Done`,
        description: `${ok} assigned · ${skip} skipped (already had AWB) · ${fail} failed`
      });
      if (fail > 0) {
        const failMsg = data.results.filter((r: any) => r.status === 'error').map((r: any) => r.message)[0];
        toast({ title: 'Note', description: failMsg || 'Some AWBs failed — check Shiprocket wallet balance.', variant: 'destructive' });
      }
      setSelectedOrderIds([]);
      fetchOrders();
    } catch (err: any) {
      toast({ title: 'AWB Error', description: err.message, variant: 'destructive' });
    } finally {
      setIsProcessingLogistics(false);
    }
  };

  const handleBulkLabels = async () => {
    const eligible = allOrders.filter(o => selectedOrderIds.includes(o._id) && o.awbNumber && o.shiprocketShipmentId);
    if (eligible.length === 0) {
      toast({ title: 'No Eligible Orders', description: 'Select orders that have AWB numbers assigned.', variant: 'destructive' });
      return;
    }
    setIsProcessingLogistics(true);
    try {
      const shipmentIds = eligible.map((o: any) => o.shiprocketShipmentId);
      const data = await apiPost('/api/shiprocket/generate-labels', { shipmentIds });
      if (data.label_url) {
        window.open(data.label_url, '_blank');
        toast({ title: `📄 Labels Ready`, description: `${eligible.length} label(s) opened in new tab.` });
      } else {
        throw new Error(data.message || 'Label URL not received from Shiprocket');
      }
    } catch (err: any) {
      toast({ title: 'Label Error', description: err.message, variant: 'destructive' });
    } finally {
      setIsProcessingLogistics(false);
    }
  };

  const handleBulkPickup = async () => {
    const eligible = allOrders.filter(o => selectedOrderIds.includes(o._id) && o.awbNumber && o.shiprocketShipmentId);
    if (eligible.length === 0) {
      toast({ title: 'No Eligible Orders', description: 'Select orders with AWB numbers to schedule pickup.', variant: 'destructive' });
      return;
    }
    if (!window.confirm(`Schedule courier pickup for ${eligible.length} order(s)?`)) return;
    setIsProcessingLogistics(true);
    try {
      const shipmentIds = eligible.map((o: any) => o.shiprocketShipmentId);
      await apiPost('/api/shiprocket/schedule-pickup', { shipmentIds });
      toast({ title: `🚚 Pickup Scheduled`, description: `Courier notified for ${eligible.length} order(s).` });
      setSelectedOrderIds([]);
      fetchOrders();
    } catch (err: any) {
      toast({ title: 'Pickup Error', description: err.message, variant: 'destructive' });
    } finally {
      setIsProcessingLogistics(false);
    }
  };

  // Helpers for the Shipping Command Center
  const getOrderStage = (order: any): { label: string; color: string; emoji: string } => {
    if (order.status === 'delivered') return { label: 'Delivered', color: 'text-green-400 bg-green-500/10 border-green-500/30', emoji: '✅' };
    if (order.status === 'shipped') return { label: 'Shipped', color: 'text-blue-400 bg-blue-500/10 border-blue-500/30', emoji: '🚚' };
    if (order.awbNumber) return { label: 'AWB Ready', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30', emoji: '🟢' };
    if (order.shiprocketOrderId) return { label: 'Synced', color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30', emoji: '🟡' };
    return { label: 'New', color: 'text-red-400 bg-red-500/10 border-red-500/30', emoji: '🔴' };
  };

  const getShippingOrders = () => {
    let orders = [...allOrders];
    if (shippingStageFilter === 'new') orders = orders.filter(o => !o.shiprocketOrderId);
    else if (shippingStageFilter === 'synced') orders = orders.filter(o => o.shiprocketOrderId && !o.awbNumber);
    else if (shippingStageFilter === 'awb') orders = orders.filter(o => o.awbNumber);
    else if (shippingStageFilter === 'shipped') orders = orders.filter(o => o.status === 'shipped' || o.status === 'delivered');
    return orders;
  };

  // Counts for smart action buttons
  const syncEligible = selectedOrderIds.filter(id => !allOrders.find(o => o._id === id)?.shiprocketOrderId).length;
  const awbEligible = allOrders.filter(o => selectedOrderIds.includes(o._id) && o.shiprocketOrderId && !o.awbNumber).length;
  const labelEligible = allOrders.filter(o => selectedOrderIds.includes(o._id) && o.awbNumber).length;
  const pickupEligible = allOrders.filter(o => selectedOrderIds.includes(o._id) && o.awbNumber).length;



  const handleDeleteOrder = async (id: string) => {
    if (!confirm("Delete this order?")) return;
    try {
      const response = await fetch(getApiUrl(`/api/orders/${id}`), { method: 'DELETE' });
      if (response.ok) {
        toast({ title: "Order Deleted", description: "Order has been removed." });
        fetchOrders();
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete order", variant: "destructive" });
    }
  };

  const exportToExcel = () => {
    const dataToExport = dateFilter ? filteredOrders : allOrders;
    const exportData = dataToExport.map(order => ({
      'Order ID': order._id,
      'Date': new Date(order.createdAt).toLocaleDateString(),
      'Customer Name': order.address?.name,
      'Customer Email': order.address?.email,
      'Phone': order.address?.phone,
      'Address': `${order.address?.address}, ${order.address?.city}, ${order.address?.state} - ${order.address?.pincode}`,
      'Products': order.products?.map((p: any) => `${p.name} (x${p.quantity})`).join(', '),
      'Total Amount': order.amount,
      'Status': order.status,
      'Payment Method': order.paymentMethod || 'COD'
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Orders");
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
    saveAs(data, `orders_export_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Check if user is admin
  if (!user?.isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="glass border-white/20 p-8 text-center max-w-sm">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-muted-foreground mb-4">
            You need admin privileges to access this page.
          </p>
          <Button onClick={() => window.history.back()}>Go Back</Button>
        </Card>
      </div>
    );
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, isEditing: boolean = false) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const readers: Promise<string>[] = [];
      Array.from(files).forEach(file => {
        readers.push(new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        }));
      });

      Promise.all(readers).then(base64Strings => {
        if (isEditing && editingProduct) {
          setEditingProduct({
            ...editingProduct,
            image: base64Strings[0],
            images: base64Strings
          } as any);
        } else {
          setNewProduct({
            ...newProduct,
            image: base64Strings[0],
            images: base64Strings
          });
        }
      });
    }
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>, isEditing: boolean = false) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (isEditing && editingProduct) {
          setEditingProduct({ ...editingProduct, video: reader.result as string });
        } else {
          setNewProduct({ ...newProduct, video: reader.result as string });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddProduct = async () => {
    if (!newProduct.name || !newProduct.price || !newProduct.description) {
      toast({ title: 'Error', description: 'Please fill in all required fields.', variant: 'destructive' });
      return;
    }

    setIsLoading(true);

    try {
      const productData = {
        title: newProduct.name,
        price: parseFloat(newProduct.price),
        originalPrice: newProduct.originalPrice ? parseFloat(newProduct.originalPrice) : undefined,
        desc: newProduct.description,
        categories: [newProduct.category],
        img: newProduct.image || 'https://via.placeholder.com/400',
        images: newProduct.images || [],
        video: newProduct.video || '',
        rating: parseFloat(newProduct.rating) || 4.5,
        reviews: parseInt(newProduct.reviews) || 0,
        inStock: newProduct.inStock,
        discount: newProduct.discount ? parseFloat(newProduct.discount) : undefined,
        color: newProduct.color,
        features: newProduct.features ? newProduct.features.split('\n').filter((f: string) => f.trim() !== '') : [],
        isTrending: newProduct.isTrending,
        quantity: parseInt(newProduct.quantity) || 0,
        weight: parseFloat(newProduct.weight) || 0.5,
        length: parseFloat(newProduct.length) || 10,
        breadth: parseFloat(newProduct.breadth) || 10,
        height: parseFloat(newProduct.height) || 5,
      };

      const response = await fetch(getApiUrl('/api/products'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.token}`
        },
        body: JSON.stringify(productData)
      });

      if (!response.ok) throw new Error('Failed to add product');

      await fetchProducts();

      toast({ title: 'Product Added', description: `${productData.title} has been added to the catalog.` });
      setNewProduct(getEmptyProduct());
      setIsAddingProduct(false);
    } catch (error) {
      console.error('Error adding product:', error);
      toast({ title: 'Error', description: 'Failed to add product', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditProduct = async () => {
    if (!editingProduct) return;

    try {
      const productUpdatePayload = {
        title: editingProduct.name,
        desc: editingProduct.description,
        img: editingProduct.image,
        images: (editingProduct as any).images || [],
        price: editingProduct.price,
        categories: editingProduct.category ? [editingProduct.category] : editingProduct.categories,
        originalPrice: editingProduct.originalPrice,
        rating: editingProduct.rating,
        reviews: editingProduct.reviews,
        inStock: editingProduct.inStock,
        discount: editingProduct.discount,
        video: editingProduct.video || '',
        color: editingProduct.color,
        features: Array.isArray(editingProduct.features) ? editingProduct.features : (typeof editingProduct.features === 'string' ? (editingProduct.features as string).split('\n').filter(f => f.trim() !== '') : []),
        isTrending: editingProduct.isTrending,
        quantity: typeof editingProduct.quantity === 'string' ? parseInt(editingProduct.quantity) : (editingProduct.quantity ?? 0)
      };

      const response = await fetch(getApiUrl(`/api/products/${editingProduct.id}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.token}`
        },
        body: JSON.stringify(productUpdatePayload)
      });

      if (!response.ok) throw new Error('Failed to update product');

      const updatedProduct = await response.json();

      const mappedUpdatedProduct = {
        ...updatedProduct,
        id: updatedProduct._id,
        image: updatedProduct.img,
        name: updatedProduct.title,
        description: updatedProduct.desc,
        category: (updatedProduct.categories && updatedProduct.categories[0]) || 'chargers'
      };

      dispatch({ type: 'UPDATE_PRODUCT', payload: mappedUpdatedProduct });

      toast({ title: 'Product Updated', description: `${editingProduct.name} has been updated.` });
      setEditingProduct(null);
    } catch (error) {
      console.error('Error updating product:', error);
      toast({ title: 'Error', description: 'Failed to update product', variant: 'destructive' });
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;

    try {
      const response = await fetch(getApiUrl(`/api/products/${productId}`), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${user?.token}`
        }
      });

      if (!response.ok) throw new Error('Failed to delete product');

      dispatch({ type: 'DELETE_PRODUCT', payload: productId });
      toast({ title: 'Product Deleted', description: 'Product has been removed from the catalog.' });
    } catch (error) {
      console.error('Error deleting product:', error);
      toast({ title: 'Error', description: 'Failed to delete product', variant: 'destructive' });
    }
  };

  const updateEditingProduct = (field: string, value: any) => {
    if (!editingProduct) return;
    setEditingProduct({ ...editingProduct, [field]: value });
  };

  const filteredProducts = productSearch
    ? products.filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase()))
    : products;

  const stats = [
    { title: 'Total Products', value: products.length, icon: Package, color: 'bg-gradient-to-br from-blue-500 to-indigo-600' },
    { title: 'Total Orders', value: allOrders.length, icon: ShoppingCart, color: 'bg-gradient-to-br from-purple-500 to-pink-500' },
    { title: 'Revenue', value: `₹${allOrders.reduce((t, o) => t + (o.amount || 0), 0).toLocaleString()}`, icon: TrendingUp, color: 'bg-gradient-to-br from-emerald-500 to-teal-400' },
    { title: 'Active Users', value: 1, icon: Users, color: 'bg-gradient-to-br from-amber-500 to-orange-500' }
  ];

  // --- Category selector component ---
  const CategorySelector = ({ value, onChange }: { value: string; onChange: (val: string) => void }) => (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="glass border-white/20">
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="glass border-white/20">
        {ALL_CATEGORIES.map(cat => (
          <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-playfair font-bold mb-2">Admin Panel</h1>
          <p className="text-muted-foreground">Manage your SM Gadgets store</p>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="glass border-white/20">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="shipping" className="text-primary font-bold">🚀 Shipping (Shiprocket)</TabsTrigger>
            <TabsTrigger value="coupons">Coupons</TabsTrigger>
          </TabsList>

          {/* =========== OVERVIEW TAB =========== */}
          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {stats.map((stat, index) => {
                const IconComponent = stat.icon;
                return (
                  <Card key={index} className="glass border-white/20 hover:shadow-medium transition-all duration-300">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">{stat.title}</p>
                          <p className="text-3xl font-bold mt-1">{stat.value}</p>
                        </div>
                        <div className={`w-12 h-12 ${stat.color} rounded-xl flex items-center justify-center shadow-md`}>
                          <IconComponent className="h-6 w-6 text-white" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Recent Orders */}
            <Card className="glass border-white/20">
              <CardHeader>
                <CardTitle>Recent Orders</CardTitle>
              </CardHeader>
              <CardContent>
                {allOrders.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No orders yet.</p>
                ) : (
                  <div className="space-y-4">
                    {allOrders.slice(0, 5).map((order) => (
                      <div key={order._id} className="flex items-center justify-between py-3 border-b border-white/10 last:border-0">
                        <div className="flex items-center gap-4">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <div>
                            <span className="text-sm font-medium">{order.address?.name || 'Guest'}</span>
                            <span className="text-xs text-muted-foreground ml-3">#{order._id.slice(-6)}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <Badge className={
                            order.status === 'delivered' ? 'bg-green-500/20 text-green-300' :
                            order.status === 'shipped' ? 'bg-blue-500/20 text-blue-300' :
                            'bg-gray-500/20 text-gray-300'
                          }>
                            {order.status}
                          </Badge>
                          <span className="font-medium">₹{order.amount?.toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* =========== PRODUCTS TAB =========== */}
          <TabsContent value="products">
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-2xl font-playfair font-bold">Product Management</h2>
                <div className="flex gap-3 w-full sm:w-auto">
                  <div className="relative flex-1 sm:flex-initial">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search products..."
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      className="pl-10 glass border-white/20 w-full sm:w-64"
                    />
                  </div>
                  <Dialog open={isAddingProduct} onOpenChange={setIsAddingProduct}>
                    <DialogTrigger asChild>
                      <Button className="shadow-soft whitespace-nowrap">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Product
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="glass border-white/20 max-w-2xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Add New Product</DialogTitle>
                      </DialogHeader>
                      <div className="grid gap-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Product Name *</Label>
                            <Input
                              value={newProduct.name}
                              onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                              className="glass border-white/20"
                            />
                          </div>
                          <div>
                            <Label>Category *</Label>
                            <CategorySelector
                              value={newProduct.category}
                              onChange={(val) => setNewProduct({ ...newProduct, category: val })}
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <Label>Price (₹) *</Label>
                            <Input
                              type="number"
                              value={newProduct.price}
                              onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                              className="glass border-white/20"
                            />
                          </div>
                          <div>
                            <Label>Original Price (₹)</Label>
                            <Input
                              type="number"
                              value={newProduct.originalPrice}
                              onChange={(e) => setNewProduct({ ...newProduct, originalPrice: e.target.value })}
                              className="glass border-white/20"
                            />
                          </div>
                          <div>
                            <Label>Discount (%)</Label>
                            <Input
                              type="number"
                              value={newProduct.discount}
                              onChange={(e) => setNewProduct({ ...newProduct, discount: e.target.value })}
                              className="glass border-white/20"
                            />
                          </div>
                          <div>
                            <Label>Stock Quantity *</Label>
                            <Input
                              type="number"
                              value={newProduct.quantity}
                              onChange={(e) => setNewProduct({ ...newProduct, quantity: e.target.value })}
                              className="glass border-white/20"
                              placeholder="e.g. 50"
                            />
                          </div>
                        </div>
                        <div>
                          <Label>Color Options</Label>
                          <div className="flex flex-wrap gap-2 mb-2 mt-1">
                            {newProduct.color?.split(',').filter(Boolean).map((c, i) => (
                              <div key={i} className="flex items-center gap-1 bg-white/10 rounded-full px-2 py-1">
                                <div className="w-4 h-4 rounded-full border border-white/20" style={{ backgroundColor: c }} />
                                <span className="text-xs uppercase">{c}</span>
                                <button type="button" onClick={() => {
                                  const arr = newProduct.color.split(',').filter(Boolean);
                                  arr.splice(i, 1);
                                  setNewProduct({ ...newProduct, color: arr.join(',') });
                                }} className="hover:text-red-400 p-0.5"><X className="h-3 w-3" /></button>
                              </div>
                            ))}
                          </div>
                          <div className="flex gap-2">
                            <Input type="color" id="addColorSelector" className="w-12 h-10 p-1 cursor-pointer" defaultValue="#FF0000" />
                            <Button type="button" variant="outline" className="glass border-white/20" onClick={() => {
                              const el = document.getElementById('addColorSelector') as HTMLInputElement;
                              if (el && el.value) {
                                const currentColors = newProduct.color ? newProduct.color.split(',').map(c=>c.trim()).filter(Boolean) : [];
                                if (!currentColors.includes(el.value.toUpperCase())) {
                                  setNewProduct({ ...newProduct, color: [...currentColors, el.value.toUpperCase()].join(',') });
                                }
                              }
                            }}>Add Color Hex</Button>
                          </div>
                        </div>
                        <div>
                          <Label>Description *</Label>
                          <Textarea
                            value={newProduct.description}
                            onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                            className="glass border-white/20"
                          />
                        </div>
                        <div>
                          <Label>Features (One per line)</Label>
                          <Textarea
                            value={newProduct.features}
                            onChange={(e) => setNewProduct({ ...newProduct, features: e.target.value })}
                            placeholder="Excellent Battery Life&#10;Water resistant&#10;Noise Cancelling"
                            className="glass border-white/20"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Rating</Label>
                            <Input
                              type="number"
                              step="0.1"
                              min="0"
                              max="5"
                              value={newProduct.rating}
                              onChange={(e) => setNewProduct({ ...newProduct, rating: e.target.value })}
                              className="glass border-white/20"
                            />
                          </div>
                          <div>
                            <Label>Reviews Count</Label>
                            <Input
                              type="number"
                              value={newProduct.reviews}
                              onChange={(e) => setNewProduct({ ...newProduct, reviews: e.target.value })}
                              className="glass border-white/20"
                            />
                          </div>
                        </div>
                        <div>
                          <Label>Product Images</Label>
                          <Input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={(e) => handleImageUpload(e, false)}
                            className="glass border-white/20"
                          />
                          {newProduct.images.length > 0 && (
                            <div className="flex gap-2 mt-2 overflow-x-auto pb-2">
                              {newProduct.images.map((img, i) => (
                                <img key={i} src={img} alt={`Preview ${i}`} className="w-16 h-16 object-cover rounded border border-white/20" />
                              ))}
                            </div>
                          )}
                        </div>
                        <div>
                          <Label>Product Video (Optional)</Label>
                          <Input
                            type="file"
                            accept="video/*"
                            onChange={(e) => handleVideoUpload(e, false)}
                            className="glass border-white/20"
                          />
                          {newProduct.video && (
                            <p className="text-xs text-green-500 mt-1">✓ Video selected</p>
                          )}
                        </div>
                        <div className="flex gap-6">
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="addInStock"
                              checked={newProduct.inStock}
                              onChange={(e) => setNewProduct({ ...newProduct, inStock: e.target.checked })}
                              className="rounded w-4 h-4"
                            />
                            <Label htmlFor="addInStock">In Stock</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="addIsTrending"
                              checked={newProduct.isTrending}
                              onChange={(e) => setNewProduct({ ...newProduct, isTrending: e.target.checked })}
                              className="rounded w-4 h-4"
                            />
                            <Label htmlFor="addIsTrending">Is Trending</Label>
                          </div>
                        </div>

                        {/* Shipping Dimensions */}
                        <div className="border border-white/20 rounded-lg p-4 bg-white/5">
                          <Label className="text-sm font-semibold text-blue-400 mb-3 block">📦 Shipping Dimensions (for Shiprocket)</Label>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label className="text-xs">Weight (kg)</Label>
                              <Input
                                type="number" step="0.1" min="0.1"
                                placeholder="0.5"
                                value={newProduct.weight}
                                onChange={(e) => setNewProduct({ ...newProduct, weight: e.target.value })}
                                className="glass border-white/20"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Length (cm)</Label>
                              <Input
                                type="number" min="1"
                                placeholder="10"
                                value={newProduct.length}
                                onChange={(e) => setNewProduct({ ...newProduct, length: e.target.value })}
                                className="glass border-white/20"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Breadth (cm)</Label>
                              <Input
                                type="number" min="1"
                                placeholder="10"
                                value={newProduct.breadth}
                                onChange={(e) => setNewProduct({ ...newProduct, breadth: e.target.value })}
                                className="glass border-white/20"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Height (cm)</Label>
                              <Input
                                type="number" min="1"
                                placeholder="5"
                                value={newProduct.height}
                                onChange={(e) => setNewProduct({ ...newProduct, height: e.target.value })}
                                className="glass border-white/20"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-end space-x-2 pt-2">
                          <Button variant="outline" onClick={() => setIsAddingProduct(false)}>Cancel</Button>
                          <Button onClick={handleAddProduct} disabled={isLoading}>
                            {isLoading ? 'Adding...' : 'Add Product'}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              {/* Products Table */}
              <Card className="glass border-white/20">
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="border-b border-white/20">
                        <tr>
                          <th className="text-left p-4">Product</th>
                          <th className="text-left p-4">Category</th>
                          <th className="text-left p-4">Price</th>
                          <th className="text-left p-4">Stock</th>
                          <th className="text-left p-4">Rating</th>
                          <th className="text-left p-4">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredProducts.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="p-8 text-center text-muted-foreground">
                              {productSearch ? 'No products match your search.' : 'No products found.'}
                            </td>
                          </tr>
                        ) : (
                          filteredProducts.map((product) => (
                            <tr key={product.id} className="border-b border-white/10 hover:bg-white/5 transition-colors">
                              <td className="p-4">
                                <div className="flex items-center space-x-3">
                                  <img
                                    src={product.image}
                                    alt={product.name}
                                    className="w-12 h-12 object-cover rounded-lg"
                                  />
                                  <div>
                                    <div className="font-medium">{product.name}</div>
                                    <div className="text-xs text-muted-foreground truncate max-w-[200px]">ID: {product.id}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="p-4">
                                <Badge variant="secondary" className="capitalize">
                                  {product.category?.replace('-', ' ') || (product.categories && product.categories[0]?.replace('-', ' ')) || 'Uncategorized'}
                                </Badge>
                              </td>
                              <td className="p-4">
                                <div>₹{product.price.toLocaleString()}</div>
                                {product.originalPrice && (
                                  <div className="text-sm text-muted-foreground line-through">
                                    ₹{Number(product.originalPrice).toLocaleString()}
                                  </div>
                                )}
                              </td>
                              <td className="p-4">
                                <Badge variant={product.inStock ? 'default' : 'secondary'}>
                                  {product.inStock ? 'In Stock' : 'Out of Stock'}
                                </Badge>
                              </td>
                              <td className="p-4">
                                <div className="flex items-center">
                                  <span>{Number(product.rating).toFixed(1)}</span>
                                  <span className="text-yellow-400 ml-1">★</span>
                                  <span className="text-sm text-muted-foreground ml-2">
                                    ({product.reviews})
                                  </span>
                                </div>
                              </td>
                              <td className="p-4">
                                <div className="flex items-center space-x-2">
                                  <Button variant="ghost" size="sm" onClick={() => setEditingProduct(product)}>
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteProduct(product.id)}
                                    className="text-destructive hover:text-destructive-foreground hover:bg-destructive"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* =========== SHIPPING CENTER (SHIPROCKET) =========== */}
          <TabsContent value="shipping">
            {/* Stats Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-5">
              {[
                { label: 'Total', count: allOrders.length, color: 'bg-white/10', filter: 'all' },
                { label: '🔴 New', count: allOrders.filter(o => !o.shiprocketOrderId).length, color: 'bg-red-500/10', filter: 'new' },
                { label: '🟡 Synced', count: allOrders.filter(o => o.shiprocketOrderId && !o.awbNumber).length, color: 'bg-yellow-500/10', filter: 'synced' },
                { label: '🟢 AWB Ready', count: allOrders.filter(o => o.awbNumber).length, color: 'bg-emerald-500/10', filter: 'awb' },
                { label: '✅ Done', count: allOrders.filter(o => o.status === 'shipped' || o.status === 'delivered').length, color: 'bg-blue-500/10', filter: 'shipped' },
              ].map(s => (
                <button
                  key={s.filter}
                  onClick={() => { setShippingStageFilter(s.filter); setSelectedOrderIds([]); }}
                  className={`rounded-lg p-3 text-left border transition-all ${s.color} ${shippingStageFilter === s.filter ? 'border-primary ring-1 ring-primary' : 'border-white/10 hover:border-white/30'}`}
                >
                  <div className="text-xl font-bold">{s.count}</div>
                  <div className="text-xs text-muted-foreground">{s.label}</div>
                </button>
              ))}
            </div>

            {/* Action Bar */}
            <div className="flex flex-wrap items-center gap-3 mb-4 p-3 rounded-lg glass border border-white/10">
              <span className="text-sm text-muted-foreground font-medium">
                {selectedOrderIds.length > 0 ? `${selectedOrderIds.length} selected` : 'Select orders below'}
              </span>
              <div className="flex-1" />
              <Button
                onClick={handleShiprocketSync}
                disabled={isSyncing || syncEligible === 0 || isProcessingLogistics}
                className="bg-primary hover:bg-primary/90 text-white gap-2"
                size="sm"
              >
                {isSyncing ? '⏳ Syncing...' : `🚀 Sync (${syncEligible})`}
              </Button>
              <Button
                onClick={handleBulkAWB}
                disabled={awbEligible === 0 || isProcessingLogistics || isSyncing}
                variant="secondary"
                className="bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/20 gap-2"
                size="sm"
              >
                {isProcessingLogistics ? '⏳' : `🏷️ Assign AWB (${awbEligible})`}
              </Button>
              <Button
                onClick={handleBulkLabels}
                disabled={labelEligible === 0 || isProcessingLogistics || isSyncing}
                variant="secondary"
                className="bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 gap-2"
                size="sm"
              >
                {isProcessingLogistics ? '⏳' : `📄 Labels (${labelEligible})`}
              </Button>
              <Button
                onClick={handleBulkPickup}
                disabled={pickupEligible === 0 || isProcessingLogistics || isSyncing}
                variant="secondary"
                className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 gap-2"
                size="sm"
              >
                {isProcessingLogistics ? '⏳' : `🚚 Pickup (${pickupEligible})`}
              </Button>
            </div>

            {/* Orders Table */}
            <div className="rounded-md border border-white/20 glass overflow-hidden">
              <table className="w-full">
                <thead className="bg-white/10 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  <tr>
                    <th className="p-3 w-10">
                      <input
                        type="checkbox"
                        className="rounded border-white/20 bg-transparent"
                        checked={selectedOrderIds.length > 0 && selectedOrderIds.length === getShippingOrders().length}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedOrderIds(getShippingOrders().map(o => o._id));
                          else setSelectedOrderIds([]);
                        }}
                      />
                    </th>
                    <th className="p-3">Order</th>
                    <th className="p-3">Customer</th>
                    <th className="p-3">Items</th>
                    <th className="p-3">Payment</th>
                    <th className="p-3">Stage</th>
                    <th className="p-3">AWB Number</th>
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-white/10">
                  {getShippingOrders().length === 0 ? (
                    <tr><td colSpan={7} className="p-10 text-center text-muted-foreground">No orders found for this filter.</td></tr>
                  ) : (
                    getShippingOrders().map(order => {
                      const stage = getOrderStage(order);
                      const isSelected = selectedOrderIds.includes(order._id);
                      return (
                        <tr
                          key={order._id}
                          className={`hover:bg-white/5 transition-colors cursor-pointer ${isSelected ? 'bg-primary/5' : ''}`}
                          onClick={() => {
                            if (isSelected) setSelectedOrderIds(selectedOrderIds.filter(id => id !== order._id));
                            else setSelectedOrderIds([...selectedOrderIds, order._id]);
                          }}
                        >
                          <td className="p-3" onClick={e => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              className="rounded border-white/20 bg-transparent"
                              checked={isSelected}
                              onChange={(e) => {
                                if (e.target.checked) setSelectedOrderIds([...selectedOrderIds, order._id]);
                                else setSelectedOrderIds(selectedOrderIds.filter(id => id !== order._id));
                              }}
                            />
                          </td>
                          <td className="p-3 font-mono text-xs">
                            <div>#{order._id.slice(-6)}</div>
                            <div className="text-muted-foreground text-[10px]">{new Date(order.createdAt).toLocaleDateString()}</div>
                          </td>
                          <td className="p-3">
                            <div className="font-medium">{order.address?.name}</div>
                            <div className="text-[10px] text-muted-foreground">{order.address?.phone}</div>
                          </td>
                          <td className="p-3 text-xs">{order.products?.length} item(s)</td>
                          <td className="p-3">
                            <Badge variant="outline" className={order.paymentMethod === 'cod' ? 'border-amber-500/40 text-amber-400 text-[10px]' : 'border-blue-500/40 text-blue-400 text-[10px]'}>
                              {order.paymentMethod === 'cod' ? 'COD' : 'PAID'}
                            </Badge>
                          </td>
                          <td className="p-3">
                            <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border ${stage.color}`}>
                              {stage.emoji} {stage.label}
                            </span>
                          </td>
                          <td className="p-3">
                            {order.awbNumber ? (
                              <span className="font-mono text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                                {order.awbNumber}
                              </span>
                            ) : order.shiprocketOrderId ? (
                              <span className="text-[11px] text-yellow-400/60 italic">Awaiting AWB</span>
                            ) : (
                              <span className="text-[11px] text-muted-foreground/50">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </TabsContent>

          {/* =========== ORDERS TAB =========== */}
          <TabsContent value="orders">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
              <div>
                <h3 className="text-xl font-semibold">Orders List</h3>
                <p className="text-muted-foreground text-sm">Manage and track all customer orders</p>
              </div>
              <div className="flex gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <Label htmlFor="date-filter" className="whitespace-nowrap text-sm">Date:</Label>
                  <Input
                    id="date-filter"
                    type="date"
                    value={dateFilter}
                    className="glass border-white/20 w-auto"
                    onChange={(e) => setDateFilter(e.target.value)}
                  />
                  {dateFilter && (
                    <Button variant="ghost" size="sm" onClick={() => setDateFilter('')} className="text-xs">Clear</Button>
                  )}
                </div>
                <Button variant="outline" onClick={exportToExcel}>
                  <Download className="mr-2 h-4 w-4" />
                  Export Excel
                </Button>
              </div>
            </div>

            <div className="rounded-md border border-white/20 glass overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white/10 text-left">
                    <tr>
                      <th className="p-4">Order ID</th>
                      <th className="p-4">Date</th>
                      <th className="p-4">Customer</th>
                      <th className="p-4">Amount</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Method</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-muted-foreground">
                          {dateFilter ? 'No orders found for this date.' : 'No orders found.'}
                        </td>
                      </tr>
                    ) : (
                      filteredOrders.map((order) => (
                        <tr key={order._id} className="border-t border-white/10 hover:bg-white/5 transition-colors">
                          <td className="p-4 font-mono text-xs">#{order._id.slice(-6)}</td>
                          <td className="p-4 text-sm">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </td>
                          <td className="p-4">
                            <div className="flex flex-col">
                              <span className="font-medium text-sm">{order.address?.name || 'Guest'}</span>
                              <span className="text-xs text-muted-foreground">{order.address?.phone}</span>
                            </div>
                          </td>
                          <td className="p-4 font-medium">₹{order.amount?.toLocaleString()}</td>
                          <td className="p-4">
                            <Badge className={
                              order.status === 'delivered' ? 'bg-green-500/20 text-green-200 hover:bg-green-500/30' :
                              order.status === 'shipped' ? 'bg-blue-500/20 text-blue-200 hover:bg-blue-500/30' :
                              order.status === 'processing' ? 'bg-yellow-500/20 text-yellow-200 hover:bg-yellow-500/30' :
                              order.status === 'cancelled' ? 'bg-red-500/20 text-red-200 hover:bg-red-500/30' :
                              'bg-gray-500/20 text-gray-200 hover:bg-gray-500/30'
                            }>
                              {order.status?.toUpperCase()}
                            </Badge>
                          </td>
                          <td className="p-4 text-sm font-medium">
                            <Badge variant="outline" className={order.paymentMethod === 'cod' ? 'border-yellow-500/50 text-yellow-500' : 'border-blue-500/50 text-blue-500'}>
                              {order.paymentMethod === 'cod' ? 'COD' : (order.paymentMethod?.toUpperCase() || 'ONLINE')}
                            </Badge>
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="icon" onClick={() => setEditingOrder(order)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive hover:text-destructive-foreground hover:bg-destructive/20"
                                onClick={() => handleDeleteOrder(order._id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          {/* =========== COUPONS TAB =========== */}
          <TabsContent value="coupons">
            <div className="space-y-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-xl font-semibold">Coupon Management</h3>
                  <p className="text-muted-foreground text-sm">Create and track active discount codes</p>
                </div>
                <Dialog open={isAddingCoupon} onOpenChange={setIsAddingCoupon}>
                  <DialogTrigger asChild>
                    <Button><Plus className="h-4 w-4 mr-2"/> Add Coupon</Button>
                  </DialogTrigger>
                  <DialogContent className="glass border-white/20">
                    <DialogHeader>
                       <DialogTitle>Create New Coupon</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                       <div>
                         <Label>Coupon Code</Label>
                         <Input value={newCoupon.code} onChange={e => setNewCoupon({...newCoupon, code: e.target.value})} className="uppercase glass border-white/20" placeholder="e.g. SUMMER50" />
                       </div>
                       <div>
                         <Label>Discount Type</Label>
                         <Select value={newCoupon.discountType} onValueChange={v => setNewCoupon({...newCoupon, discountType: v})}>
                           <SelectTrigger className="glass border-white/20"><SelectValue/></SelectTrigger>
                           <SelectContent className="glass border-white/20">
                             <SelectItem value="flat">Flat Amount (₹)</SelectItem>
                             <SelectItem value="percent">Percentage (%)</SelectItem>
                           </SelectContent>
                         </Select>
                       </div>
                       <div>
                         <Label>Discount Value</Label>
                         <Input type="number" value={newCoupon.discountValue} onChange={e => setNewCoupon({...newCoupon, discountValue: e.target.value})} className="glass border-white/20" placeholder="e.g. 150" />
                       </div>
                       <div>
                         <Label>Applicable Products (Optional)</Label>
                         <div className="mt-2 max-h-40 overflow-y-auto border border-white/10 rounded-md p-2 space-y-1 glass">
                            {products.map(p => (
                              <div key={p.id} className="flex items-center gap-2">
                                <input 
                                  type="checkbox" 
                                  id={`coupon-p-${p.id}`}
                                  checked={newCoupon.applicableProducts.includes(p.id)}
                                  onChange={(e) => {
                                    const checked = e.target.checked;
                                    setNewCoupon(prev => ({
                                      ...prev,
                                      applicableProducts: checked 
                                        ? [...prev.applicableProducts, p.id]
                                        : prev.applicableProducts.filter(id => id !== p.id)
                                    }));
                                  }}
                                />
                                <label htmlFor={`coupon-p-${p.id}`} className="text-xs truncate cursor-pointer">{p.name}</label>
                              </div>
                            ))}
                         </div>
                         <p className="text-[10px] text-muted-foreground mt-1">Leave empty if coupon applies to all products.</p>
                       </div>
                       <Button className="w-full" onClick={handleAddCoupon}>Save Coupon</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="rounded-md border border-white/20 glass overflow-hidden">
                <table className="w-full">
                   <thead className="bg-white/10 text-left text-sm font-medium">
                      <tr>
                         <th className="p-4">Code</th>
                         <th className="p-4">Type</th>
                         <th className="p-4">Value</th>
                         <th className="p-4">Total Uses</th>
                         <th className="p-4 text-right">Actions</th>
                      </tr>
                   </thead>
                   <tbody>
                      {coupons.map(coupon => (
                         <tr key={coupon._id} className="border-b border-white/10 last:border-0 hover:bg-white/5">
                            <td className="p-4 font-bold text-primary">{coupon.code}</td>
                            <td className="p-4 capitalize">{coupon.discountType}</td>
                            <td className="p-4">{coupon.discountType === 'percent' ? `${coupon.discountValue}%` : `₹${coupon.discountValue}`}</td>
                            <td className="p-4">
                               <Badge variant="secondary">{coupon.usageCount} times</Badge>
                            </td>
                            <td className="p-4 text-right text-destructive">
                               <Button variant="ghost" size="sm" onClick={() => handleDeleteCoupon(coupon._id)} className="hover:bg-destructive/20 hover:text-destructive">
                                  <Trash2 className="h-4 w-4" />
                               </Button>
                            </td>
                         </tr>
                      ))}
                      {coupons.length === 0 && (
                         <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No coupons created yet.</td></tr>
                      )}
                   </tbody>
                </table>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* =========== EDIT ORDER DIALOG =========== */}
        <Dialog open={!!editingOrder} onOpenChange={() => setEditingOrder(null)}>
          <DialogContent className="glass border-white/20">
            {editingOrder && (
              <>
                <DialogHeader>
                  <DialogTitle>Update Order #{editingOrder._id.slice(-6)}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select
                      value={editingOrder.status}
                      onValueChange={(val) => setEditingOrder({ ...editingOrder, status: val })}
                    >
                      <SelectTrigger className="glass border-white/20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="processing">Processing</SelectItem>
                        <SelectItem value="shipped">Shipped</SelectItem>
                        <SelectItem value="delivered">Delivered</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Details</Label>
                    <div className="text-sm space-y-1 p-3 border border-white/10 rounded-md bg-white/5">
                      <p><span className="text-muted-foreground">Customer:</span> {editingOrder.address?.name}</p>
                      <p><span className="text-muted-foreground">Email:</span> {editingOrder.address?.email}</p>
                      <p><span className="text-muted-foreground">Address:</span> {editingOrder.address?.address}, {editingOrder.address?.city}</p>
                      <div className="pt-2 border-t border-white/10 mt-2">
                        <p className="font-semibold mb-1">Products:</p>
                        {editingOrder.products?.map((p: any, i: number) => (
                          <div key={i} className="flex justify-between text-xs">
                            <div className="flex flex-col">
                              <span>{p.quantity}x {p.name}</span>
                              {p.color && <span className="text-[10px] text-primary italic">Color: {p.color}</span>}
                            </div>
                            <span>₹{(p.price * p.quantity).toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" onClick={() => setEditingOrder(null)}>Cancel</Button>
                    <Button onClick={handleUpdateOrder}>Update Order</Button>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* =========== EDIT PRODUCT DIALOG (SINGLE) =========== */}
        <Dialog open={!!editingProduct} onOpenChange={(open) => !open && setEditingProduct(null)}>
          <DialogContent className="glass border-white/20 max-w-2xl max-h-[90vh] overflow-y-auto">
            {editingProduct && (
              <>
                <DialogHeader>
                  <DialogTitle>Edit Product</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4">
                  <div className="flex items-start gap-4">
                    {editingProduct.image && (
                      <div className="w-20 h-20 shrink-0">
                        <img src={editingProduct.image} alt="Current" className="w-full h-full object-cover rounded-md" />
                      </div>
                    )}
                    <div className="flex-1">
                      <Label>Product Images</Label>
                      <Input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => handleImageUpload(e, true)}
                        className="glass border-white/20 mt-1"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Product Name</Label>
                      <Input
                        value={editingProduct.name}
                        onChange={(e) => updateEditingProduct('name', e.target.value)}
                        className="glass border-white/20"
                      />
                    </div>
                    <div>
                      <Label>Category</Label>
                      <CategorySelector
                        value={editingProduct.category || (editingProduct.categories && editingProduct.categories[0]) || 'chargers'}
                        onChange={(val) => updateEditingProduct('category', val)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label>Price (₹)</Label>
                      <Input
                        type="number"
                        value={editingProduct.price}
                        onChange={(e) => updateEditingProduct('price', parseFloat(e.target.value))}
                        className="glass border-white/20"
                      />
                    </div>
                    <div>
                      <Label>Stock Quantity</Label>
                      <Input
                        type="number"
                        value={(editingProduct as any).quantity || 0}
                        onChange={(e) => updateEditingProduct('quantity', parseInt(e.target.value))}
                        className="glass border-white/20"
                      />
                    </div>
                    <div>
                      <Label>Original Price (₹)</Label>
                      <Input
                        type="number"
                        value={editingProduct.originalPrice || ''}
                        onChange={(e) => updateEditingProduct('originalPrice', parseFloat(e.target.value) || undefined)}
                        className="glass border-white/20"
                      />
                    </div>
                    <div>
                      <Label>Discount (%)</Label>
                      <Input
                        type="number"
                        value={editingProduct.discount || ''}
                        onChange={(e) => updateEditingProduct('discount', parseFloat(e.target.value) || undefined)}
                        className="glass border-white/20"
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Color Options</Label>
                    <div className="flex flex-wrap gap-2 mb-2 mt-1">
                      {editingProduct.color?.split(',').filter(Boolean).map((c, i) => (
                        <div key={i} className="flex items-center gap-1 bg-white/10 rounded-full px-2 py-1">
                          <div className="w-4 h-4 rounded-full border border-white/20" style={{ backgroundColor: c }} />
                          <span className="text-xs uppercase">{c}</span>
                          <button type="button" onClick={() => {
                            const arr = editingProduct.color.split(',').filter(Boolean);
                            arr.splice(i, 1);
                            updateEditingProduct('color', arr.join(','));
                          }} className="hover:text-red-400 p-0.5"><X className="h-3 w-3" /></button>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input type="color" id="editColorSelector" className="w-12 h-10 p-1 cursor-pointer" defaultValue="#FF0000" />
                      <Button type="button" variant="outline" className="glass border-white/20" onClick={() => {
                        const el = document.getElementById('editColorSelector') as HTMLInputElement;
                        if (el && el.value) {
                          const currentColors = editingProduct.color ? editingProduct.color.split(',').map(c=>c.trim()).filter(Boolean) : [];
                          if (!currentColors.includes(el.value.toUpperCase())) {
                            updateEditingProduct('color', [...currentColors, el.value.toUpperCase()].join(','));
                          }
                        }
                      }}>Add Color Hex</Button>
                    </div>
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Textarea
                      value={editingProduct.description}
                      onChange={(e) => updateEditingProduct('description', e.target.value)}
                      className="glass border-white/20"
                    />
                  </div>
                  <div>
                    <Label>Features (One per line)</Label>
                    <Textarea
                      value={Array.isArray(editingProduct.features) ? editingProduct.features.join('\n') : (editingProduct.features || '')}
                      onChange={(e) => updateEditingProduct('features', e.target.value)}
                      className="glass border-white/20"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Rating</Label>
                      <Input
                        type="number"
                        step="0.1"
                        max="5"
                        value={editingProduct.rating}
                        onChange={(e) => updateEditingProduct('rating', parseFloat(e.target.value))}
                        className="glass border-white/20"
                      />
                    </div>
                    <div>
                      <Label>Reviews Count</Label>
                      <Input
                        type="number"
                        value={editingProduct.reviews}
                        onChange={(e) => updateEditingProduct('reviews', parseInt(e.target.value))}
                        className="glass border-white/20"
                      />
                    </div>
                  </div>

                  <div className="flex gap-6">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="editInStock"
                        checked={editingProduct.inStock}
                        onChange={(e) => updateEditingProduct('inStock', e.target.checked)}
                        className="rounded w-4 h-4"
                      />
                      <Label htmlFor="editInStock">In Stock</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="editIsTrending"
                        checked={editingProduct.isTrending}
                        onChange={(e) => updateEditingProduct('isTrending', e.target.checked)}
                        className="rounded w-4 h-4"
                      />
                      <Label htmlFor="editIsTrending">Is Trending</Label>
                    </div>
                  </div>

                  <div>
                    <Label>Product Video (Optional)</Label>
                    <Input
                      type="file"
                      accept="video/*"
                      onChange={(e) => handleVideoUpload(e, true)}
                      className="glass border-white/20"
                    />
                    {editingProduct.video && (
                      <p className="text-xs text-green-500 mt-1">✓ Video present</p>
                    )}
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <Button variant="outline" onClick={() => setEditingProduct(null)}>Cancel</Button>
                    <Button onClick={handleEditProduct}>Save Changes</Button>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default AdminPanel;