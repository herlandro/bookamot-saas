'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { GarageLayout } from '@/components/layout/garage-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AnalyticsOverviewCard } from '@/components/ui/analytics-overview-card';
import { ArrowLeft, Users, Car, TrendingUp, DollarSign, RefreshCw, Star } from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

interface AnalyticsData {
  overview: {
    totalCustomers: number;
    totalVehicles: number;
    totalBookings: number;
    completedBookings: number;
    totalRevenue: number;
    averageBookingValue: number;
    averageBookingsPerCustomer: number;
    retentionRate: number;
    activeCustomers: number;
    inactiveCustomers: number;
    totalReviews: number;
    averageRating: number;
  };
  trends: {
    bookingsByMonth: Array<{ month: string; count: number }>;
    revenueByMonth: Array<{ month: string; revenue: number }>;
  };
  customers: {
    topCustomers: Array<{ name: string; bookings: number }>;
    recentCustomers: Array<{ name: string; email: string; joinedDate: string; bookings: number }>;
    statusDistribution: { active: number; inactive: number };
  };
  vehicles: {
    topMakes: Array<{ make: string; count: number }>;
    yearDistribution: Array<{ year: number; count: number }>;
    motStatusDistribution: {
      valid: number;
      expiring_soon: number;
      expired: number;
      failed: number;
      unknown: number;
    };
  };
  bookings: {
    statusDistribution: {
      pending: number;
      confirmed: number;
      completed: number;
      cancelled: number;
    };
    expiringMotVehicles: Array<{
      registration: string;
      make: string;
      model: string;
      ownerName: string;
      expiryDate: string;
      daysUntilExpiry: number | null;
    }>;
  };
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function AnalyticsDashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/signin');
      return;
    }

    if (session.user.role !== 'GARAGE_OWNER') {
      router.push('/dashboard');
      return;
    }

    fetchAnalytics();
  }, [session, status, router]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      let url = '/api/garage-admin/analytics';
      
      if (dateFrom || dateTo) {
        const params = new URLSearchParams();
        if (dateFrom) params.append('dateFrom', dateFrom);
        if (dateTo) params.append('dateTo', dateTo);
        url += `?${params.toString()}`;
      }

      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      } else {
        console.error('Failed to fetch analytics');
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDateFilter = () => {
    setLoading(true);
    fetchAnalytics();
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'GBP',
    }).format(value);
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <GarageLayout>
        <div className="min-h-screen bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Button
              onClick={() => router.push('/garage-admin')}
              variant="outline"
              className="flex items-center gap-2 mb-6"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">Error loading dashboard</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </GarageLayout>
    );
  }

  return (
    <GarageLayout>
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header Section - Outside Card */}
          <div className="mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="flex items-center gap-2 text-3xl font-bold text-foreground">
                  <TrendingUp className="h-6 w-6" />
                  Analytics Dashboard
                </h1>
                <p className="text-muted-foreground mt-1">
                  View statistics and trends for your garage
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex flex-col sm:flex-row gap-2 items-end">
                  <div className="flex-1">
                    <label className="text-sm font-medium mb-1 block">From</label>
                    <Input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="w-full sm:w-40"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-sm font-medium mb-1 block">To</label>
                    <Input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      className="w-full sm:w-40"
                    />
                  </div>
                  <Button onClick={handleDateFilter} className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4" />
                    Apply
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setDateFrom('');
                      setDateTo('');
                      setLoading(true);
                      fetchAnalytics();
                    }}
                  >
                    Clear
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Card */}
          <Card className="shadow-xl rounded-lg border border-border bg-card">
            <CardContent className="space-y-8 pt-6">

          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <AnalyticsOverviewCard
              title="Total Customers"
              value={analytics.overview.totalCustomers}
              icon={Users}
              color="blue"
              description={`${analytics.overview.activeCustomers} active`}
            />
            <AnalyticsOverviewCard
              title="Total Vehicles"
              value={analytics.overview.totalVehicles}
              icon={Car}
              color="green"
            />
            <AnalyticsOverviewCard
              title="Total Bookings"
              value={analytics.overview.totalBookings}
              icon={TrendingUp}
              color="purple"
              description={`${analytics.overview.completedBookings} completed`}
            />
            <AnalyticsOverviewCard
              title="Total de Reviews"
              value={analytics.overview.totalReviews}
              icon={Star}
              color="orange"
              description={`Média: ${analytics.overview.averageRating.toFixed(1)} ⭐`}
            />
            <AnalyticsOverviewCard
              title="Retention Rate"
              value={`${analytics.overview.retentionRate.toFixed(1)}%`}
              icon={Users}
              color="red"
              description="Repeat customers"
            />
            <AnalyticsOverviewCard
              title="Total Revenue"
              value={formatCurrency(analytics.overview.totalRevenue)}
              icon={DollarSign}
              color="green"
              description={`Average: ${formatCurrency(analytics.overview.averageBookingValue)}`}
            />
          </div>

          {/* Trends Charts - Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Bookings Trend */}
            <Card className="border border-border bg-card">
              <CardHeader>
                <CardTitle>Booking Trends (Last 12 Months)</CardTitle>
                <CardDescription>Number of bookings per month</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analytics.trends.bookingsByMonth}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="#3b82f6"
                      name="Bookings"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Revenue Trend */}
            <Card className="border border-border bg-card">
              <CardHeader>
                <CardTitle>Revenue Trends (Last 12 Months)</CardTitle>
                <CardDescription>Total revenue per month</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics.trends.revenueByMonth}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(value as number)} />
                    <Legend />
                    <Bar
                      dataKey="revenue"
                      fill="#10b981"
                      name="Revenue"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Top Customers */}
            <Card className="border border-border bg-card">
              <CardHeader>
                <CardTitle>Top 10 Customers</CardTitle>
                <CardDescription>Customers with most bookings</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics.customers.topCustomers}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="bookings" fill="#3b82f6" name="Bookings" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Vehicles by Make */}
            <Card className="border border-border bg-card">
              <CardHeader>
                <CardTitle>Top 10 Makes</CardTitle>
                <CardDescription>Most common vehicle makes</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics.vehicles.topMakes}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="make" angle={-45} textAnchor="end" height={80} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#10b981" name="Vehicles" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Distribution Charts - Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* MOT Status Distribution */}
            <Card className="border border-border bg-card">
              <CardHeader>
                <CardTitle>MOT Status Distribution</CardTitle>
                <CardDescription>Status of vehicle MOT tests</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Valid', value: analytics.vehicles.motStatusDistribution.valid },
                        { name: 'Expiring Soon', value: analytics.vehicles.motStatusDistribution.expiring_soon },
                        { name: 'Expired', value: analytics.vehicles.motStatusDistribution.expired },
                        { name: 'Failed', value: analytics.vehicles.motStatusDistribution.failed },
                        { name: 'Unknown', value: analytics.vehicles.motStatusDistribution.unknown },
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {COLORS.map((color, index) => (
                        <Cell key={`cell-${index}`} fill={color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Booking Status Distribution */}
            <Card className="border border-border bg-card">
              <CardHeader>
                <CardTitle>Booking Status Distribution</CardTitle>
                <CardDescription>Status of bookings</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Pending', value: analytics.bookings.statusDistribution.pending },
                        { name: 'Confirmed', value: analytics.bookings.statusDistribution.confirmed },
                        { name: 'Completed', value: analytics.bookings.statusDistribution.completed },
                        { name: 'Cancelled', value: analytics.bookings.statusDistribution.cancelled },
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {COLORS.map((color, index) => (
                        <Cell key={`cell-${index}`} fill={color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Vehicles with Expiring MOT */}
          {analytics.bookings.expiringMotVehicles.length > 0 && (
            <Card className="border border-border bg-card">
              <CardHeader>
                <CardTitle>Vehicles with Expiring MOT (Next 30 Days)</CardTitle>
                <CardDescription>Recommended action: Contact owners</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 font-medium">Registration</th>
                        <th className="text-left py-3 px-4 font-medium">Vehicle</th>
                        <th className="text-left py-3 px-4 font-medium">Owner</th>
                        <th className="text-left py-3 px-4 font-medium">Expiry Date</th>
                        <th className="text-left py-3 px-4 font-medium">Days Remaining</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.bookings.expiringMotVehicles.map((vehicle, idx) => (
                        <tr key={idx} className="border-b border-border hover:bg-muted/50">
                          <td className="py-3 px-4 font-medium">{vehicle.registration}</td>
                          <td className="py-3 px-4">{vehicle.make} {vehicle.model}</td>
                          <td className="py-3 px-4">{vehicle.ownerName}</td>
                          <td className="py-3 px-4">{vehicle.expiryDate}</td>
                          <td className="py-3 px-4">
                            <span className={vehicle.daysUntilExpiry && vehicle.daysUntilExpiry <= 7 ? 'text-red-600 font-semibold' : ''}>
                              {vehicle.daysUntilExpiry} days
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Customers */}
          <Card className="border border-border bg-card">
            <CardHeader>
              <CardTitle>Recent Customers</CardTitle>
              <CardDescription>Last 10 customers who joined</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 font-medium">Name</th>
                      <th className="text-left py-3 px-4 font-medium">Email</th>
                      <th className="text-left py-3 px-4 font-medium">Join Date</th>
                      <th className="text-left py-3 px-4 font-medium">Bookings</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.customers.recentCustomers.map((customer, idx) => (
                      <tr key={idx} className="border-b border-border hover:bg-muted/50">
                        <td className="py-3 px-4 font-medium">{customer.name}</td>
                        <td className="py-3 px-4">{customer.email}</td>
                        <td className="py-3 px-4">{customer.joinedDate}</td>
                        <td className="py-3 px-4">{customer.bookings}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
            </CardContent>
          </Card>
        </div>
      </div>
    </GarageLayout>
  );
}

