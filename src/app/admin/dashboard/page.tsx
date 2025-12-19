'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AdminLayout } from '@/components/layout/admin-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AnalyticsOverviewCard } from '@/components/ui/analytics-overview-card';
import { RecentEntitiesCard, formatDate } from '@/components/ui/recent-entities-card';
import { Users, Building2, Car, CalendarCheck, Star, Clock, Loader2 } from 'lucide-react';
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { format } from 'date-fns';

interface DashboardData {
  overview: {
    totalCustomers: number;
    totalGarages: number;
    totalBookings: number;
    totalVehicles: number;
    totalReviews: number;
    pendingGarages: number;
    averageRating: number;
  };
  statusDistribution: Record<string, number>;
  bookingsByMonth: Array<{ month: string; count: number }>;
  recentBookings: Array<{
    id: string;
    date: string;
    timeSlot: string;
    status: string;
    customerName: string;
    garageName: string;
    vehicle: string;
  }>;
  recentGarages: Array<{
    id: string;
    name: string;
    city: string;
    isActive: boolean;
    ownerName: string;
    createdAt: string;
  }>;
  recentReviews: Array<{
    id: string;
    rating: number;
    comment: string;
    reviewerName: string;
    garageName: string;
    createdAt: string;
  }>;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [recentEntities, setRecentEntities] = useState<{
    customers: Array<{ id: string; name: string; email: string; createdAt: string }>;
    vehicles: Array<{ id: string; make: string; model: string; registration: string; owner: { id: string; name: string; email: string } }>;
    garages: Array<{ id: string; name: string; location: string; specialty: string }>;
  } | null>(null);
  const [recentEntitiesLoading, setRecentEntitiesLoading] = useState(true);
  const [recentEntitiesError, setRecentEntitiesError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/admin/login');
      return;
    }

    if (session.user.role !== 'ADMIN') {
      router.push('/dashboard');
      return;
    }

    fetchData();
    fetchRecentEntities();
  }, [session, status, router]);

  const fetchData = async () => {
    try {
      const response = await fetch('/api/admin/stats');
      if (response.ok) {
        const result = await response.json();
        setData(result);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentEntities = async () => {
    try {
      setRecentEntitiesError(null);
      const response = await fetch('/api/recent-entities');
      if (response.ok) {
        const result = await response.json();
        setRecentEntities(result);
      } else {
        setRecentEntitiesError('Failed to load recent entities');
      }
    } catch (error) {
      console.error('Error fetching recent entities:', error);
      setRecentEntitiesError('Failed to load recent entities');
    } finally {
      setRecentEntitiesLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      CONFIRMED: 'bg-blue-100 text-blue-800',
      COMPLETED: 'bg-green-100 text-green-800',
      CANCELLED: 'bg-red-100 text-red-800',
      NO_SHOW: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-red-600" />
      </div>
    );
  }

  if (!data) {
    return (
      <AdminLayout>
        <div className="p-8">
          <p className="text-center text-muted-foreground">Error loading dashboard</p>
        </div>
      </AdminLayout>
    );
  }

  const pieData = Object.entries(data.statusDistribution).map(([name, value]) => ({
    name,
    value
  }));

  return (
    <AdminLayout>
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
            <p className="text-muted-foreground mt-1">Overview of the BookaMOT platform</p>
          </div>

          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
            <AnalyticsOverviewCard title="Customers" value={data.overview.totalCustomers} icon={Users} color="blue" />
            <AnalyticsOverviewCard title="Garages" value={data.overview.totalGarages} icon={Building2} color="green" />
            <AnalyticsOverviewCard title="Bookings" value={data.overview.totalBookings} icon={CalendarCheck} color="purple" />
            <AnalyticsOverviewCard title="Vehicles" value={data.overview.totalVehicles} icon={Car} color="orange" />
            <AnalyticsOverviewCard title="Reviews" value={data.overview.totalReviews} icon={Star} color="yellow" description={`Avg: ${data.overview.averageRating.toFixed(1)} ⭐`} />
            {data.overview.pendingGarages > 0 ? (
              <Link href="/admin/garages/pending" className="block">
                <div className="relative">
                  <AnalyticsOverviewCard 
                    title="Pending" 
                    value={data.overview.pendingGarages} 
                    icon={Clock} 
                    color="red" 
                    description="Garages awaiting approval"
                  />
                  <div className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 rounded-full animate-pulse" />
                </div>
              </Link>
            ) : (
              <AnalyticsOverviewCard 
                title="Pending" 
                value={data.overview.pendingGarages} 
                icon={Clock} 
                color="red" 
                description="Garages awaiting approval"
              />
            )}
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Bookings by Month */}
            <Card>
              <CardHeader>
                <CardTitle>Bookings Over Time</CardTitle>
                <CardDescription>Monthly booking trends</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.bookingsByMonth}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Booking Status Distribution</CardTitle>
                <CardDescription>Current booking statuses</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${((percent as number) * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Recent Bookings */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Bookings</CardTitle>
                <CardDescription>Latest booking activity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.recentBookings.slice(0, 5).map((booking) => (
                    <div key={booking.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div>
                        <p className="font-medium text-sm">{booking.customerName}</p>
                        <p className="text-xs text-muted-foreground">{booking.garageName} • {booking.vehicle}</p>
                        <p className="text-xs text-muted-foreground">{format(new Date(booking.date), 'dd MMM yyyy')} at {booking.timeSlot}</p>
                      </div>
                      <Badge className={getStatusColor(booking.status)}>{booking.status}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Reviews */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Reviews</CardTitle>
                <CardDescription>Latest customer feedback</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.recentReviews.map((review) => (
                    <div key={review.id} className="p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">{review.reviewerName}</span>
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`h-4 w-4 ${i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">{review.comment || 'No comment'}</p>
                      <p className="text-xs text-muted-foreground mt-1">{review.garageName} • {format(new Date(review.createdAt), 'dd MMM yyyy')}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Entities */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Customers */}
            <RecentEntitiesCard
              title="Recent Customers"
              description="Latest registered customers"
              entities={recentEntities?.customers || []}
              loading={recentEntitiesLoading}
              error={recentEntitiesError}
              viewAllHref="/admin/customers"
              emptyMessage="No customers found"
              renderEntity={(customer) => (
                <div>
                  <p className="font-medium text-sm">{customer.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{customer.email}</p>
                  <p className="text-xs text-muted-foreground mt-1">Joined {formatDate(customer.createdAt)}</p>
                </div>
              )}
            />

            {/* Recent Vehicles */}
            <RecentEntitiesCard
              title="Recent Vehicles"
              description="Latest registered vehicles"
              entities={recentEntities?.vehicles || []}
              loading={recentEntitiesLoading}
              error={recentEntitiesError}
              viewAllHref="/admin/vehicles"
              emptyMessage="No vehicles found"
              renderEntity={(vehicle) => (
                <div>
                  <p className="font-medium text-sm">{vehicle.make} {vehicle.model}</p>
                  <p className="text-xs text-muted-foreground">Registration: {vehicle.registration}</p>
                  <p className="text-xs text-muted-foreground mt-1">Owner: {vehicle.owner.name}</p>
                </div>
              )}
            />

            {/* Recent Garages */}
            <RecentEntitiesCard
              title="Recent Garages"
              description="Latest registered garages"
              entities={recentEntities?.garages || []}
              loading={recentEntitiesLoading}
              error={recentEntitiesError}
              viewAllHref="/admin/garages"
              emptyMessage="No garages found"
              renderEntity={(garage) => (
                <div>
                  <p className="font-medium text-sm">{garage.name}</p>
                  <p className="text-xs text-muted-foreground">{garage.location}</p>
                  <p className="text-xs text-muted-foreground mt-1">{garage.specialty}</p>
                </div>
              )}
            />
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
