import React, { useEffect, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, User as UserIcon, LogOut, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Order } from '@/types';
import { Badge } from '@/components/ui/badge';

const Profile = () => {
    const { user, dispatch } = useApp();
    const navigate = useNavigate();
    const [userOrders, setUserOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(false);
    const [orderToCancel, setOrderToCancel] = useState<string | null>(null);

    const handleCancelOrder = async (orderId: string) => {
        try {
            const response = await fetch(`/api/orders/${orderId}/cancel`, {
                method: 'PUT'
            });
            if (response.ok) {
                setUserOrders(userOrders.map(order => 
                    order.id === orderId ? { ...order, status: 'cancelled' } : order
                ));
            } else {
                const err = await response.json();
                alert(err || "Failed to cancel order");
            }
        } catch (error) {
            console.error("Cancel error", error);
        } finally {
            setOrderToCancel(null);
        }
    };

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }

        const fetchOrders = async () => {
            setLoading(true);
            try {
                // Fetch orders for this user
                // Note: Since backend might not have this route perfectly set yet, we wrap in try-catch
                const response = await fetch(`/api/orders/user/${user.id}`);
                if (response.ok) {
                    const data = await response.json();
                    // Map backend order structure to Frontend Order interface
                    const mappedOrders = data.map((order: any) => ({
                        id: order._id,
                        userId: order.userId,
                        items: order.products || [], // Backend uses 'products', Frontend uses 'items'
                        total: order.amount,
                        status: order.status,
                        shippingAddress: order.address,
                        orderDate: order.createdAt
                    }));
                    setUserOrders(mappedOrders);
                }
            } catch (error) {
                console.error("Failed to fetch orders", error);
            } finally {
                setLoading(false);
            }
        };

        fetchOrders();

    }, [user, navigate]);

    const handleLogout = () => {
        dispatch({ type: 'SET_USER', payload: null });
        navigate('/login');
    };

    if (!user) return null;

    return (
        <div className="min-h-screen py-12 px-4">
            <div className="container mx-auto max-w-4xl">
                <h1 className="text-4xl font-playfair font-bold mb-8 text-center">My Profile</h1>

                <div className="grid gap-8 md:grid-cols-3">
                    {/* User Info Card */}
                    <Card className="glass border-white/20 md:col-span-1 h-fit">
                        <CardHeader className="text-center">
                            <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <UserIcon className="h-10 w-10 text-primary" />
                            </div>
                            <CardTitle>{user.name}</CardTitle>
                        </CardHeader>
                        <CardContent className="text-center">
                            <p className="text-muted-foreground mb-4">{user.email}</p>
                            <div className="flex justify-center">
                                <Badge variant={user.isAdmin ? "destructive" : "secondary"}>
                                    {user.isAdmin ? "Admin User" : "Customer"}
                                </Badge>
                            </div>

                            <Button
                                variant="outline"
                                className="w-full mt-6 text-destructive hover:text-destructive-foreground hover:bg-destructive"
                                onClick={handleLogout}
                            >
                                <LogOut className="h-4 w-4 mr-2" />
                                Logout
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Orders Section */}
                    <Card className="glass border-white/20 md:col-span-2">
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <Package className="h-5 w-5 mr-2" />
                                Order History
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="text-center py-8">Loading orders...</div>
                            ) : userOrders.length === 0 ? (
                                <div className="text-center py-12">
                                    <Package className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                                    <h3 className="text-lg font-medium">No orders yet</h3>
                                    <p className="text-muted-foreground text-sm">
                                        Looks like you haven't placed any orders yet.
                                    </p>
                                    <Button variant="link" onClick={() => navigate('/shop')}>
                                        Start Shopping
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {userOrders.map((order) => (
                                        <div key={order.id} className="border border-white/10 rounded-lg p-4 hover:bg-white/5 transition-colors">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <p className="font-semibold">Order #{order.id.slice(-6)}</p>
                                                    <p className="text-xs text-muted-foreground">{new Date(order.orderDate).toLocaleDateString()}</p>
                                                </div>
                                                <div className="flex flex-col items-end gap-2">
                                                    <Badge variant={order.status === 'delivered' ? 'default' : order.status === 'cancelled' ? 'destructive' : 'secondary'}>
                                                        {order.status}
                                                    </Badge>
                                                    {order.status !== 'delivered' && order.status !== 'cancelled' && order.status !== 'shipped' && (
                                                        <Button 
                                                            variant="outline" 
                                                            size="sm" 
                                                            className="h-7 text-xs border-destructive/50 text-destructive hover:bg-destructive hover:text-white"
                                                            onClick={() => setOrderToCancel(order.id)}
                                                        >
                                                            Cancel Order
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                {order.items.map((item, idx) => (
                                                    <div key={idx} className="text-sm flex justify-between">
                                                        <span>{item.quantity}x {item.name}</span>
                                                        <span>₹{item.price * item.quantity}</span>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="mt-3 pt-3 border-t border-white/10 flex justify-between font-bold">
                                                <span>Total</span>
                                                <span>₹{order.total}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
            {orderToCancel && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="glass max-w-sm w-full p-6 mx-4 rounded-xl border border-white/20 shadow-xl">
                        <h3 className="text-xl font-bold mb-2 flex items-center gap-2 text-foreground"><XCircle className="text-destructive h-5 w-5"/> Cancel Order?</h3>
                        <p className="text-muted-foreground mb-6 text-sm">Are you absolutely sure you want to cancel this order? This action cannot be undone.</p>
                        <div className="flex justify-end gap-3">
                            <Button variant="ghost" onClick={() => setOrderToCancel(null)}>Keep Order</Button>
                            <Button variant="destructive" onClick={() => handleCancelOrder(orderToCancel)}>Yes, Cancel It</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Profile;
