'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Save, MapPin, Phone, Mail, Clock } from 'lucide-react';
import { GarageLayout } from '@/components/layout/garage-layout';

interface GarageSettings {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postcode: string;
  description?: string;
  website?: string;
  motPrice: number;
  retestPrice: number;
  openingHours?: any;
}

interface OpeningHours {
  [key: string]: {
    open: string;
    close: string;
    closed: boolean;
  };
}

const defaultOpeningHours: OpeningHours = {
  monday: { open: '09:00', close: '17:00', closed: false },
  tuesday: { open: '09:00', close: '17:00', closed: false },
  wednesday: { open: '09:00', close: '17:00', closed: false },
  thursday: { open: '09:00', close: '17:00', closed: false },
  friday: { open: '09:00', close: '17:00', closed: false },
  saturday: { open: '09:00', close: '13:00', closed: false },
  sunday: { open: '10:00', close: '16:00', closed: true },
};

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [settings, setSettings] = useState<GarageSettings | null>(null);
  const [openingHours, setOpeningHours] = useState<OpeningHours>(defaultOpeningHours);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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

    fetchSettings();
  }, [session, status, router]);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/garage-admin/settings');
      if (response.ok) {
        const data = await response.json();
        setSettings(data.garage);
        
        // Parse opening hours if available
        if (data.garage.openingHours) {
          setOpeningHours({ ...defaultOpeningHours, ...data.garage.openingHours });
        }
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;
    
    setSaving(true);
    try {
      const response = await fetch('/api/garage-admin/settings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...settings,
          openingHours,
        }),
      });

      if (response.ok) {
        alert('Settings saved successfully!');
      } else {
        alert('Error saving settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Error saving settings');
    } finally {
      setSaving(false);
    }
  };

  const updateOpeningHours = (day: string, field: string, value: string | boolean) => {
    setOpeningHours(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value,
      },
    }));
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Garage settings not found</p>
      </div>
    );
  }

  return (
    <GarageLayout>
      <div className="min-h-screen bg-background">
        <div className="bg-card shadow-sm border-b border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div>
                <h1 className="text-2xl font-bold text-foreground">Configurações da Oficina</h1>
                <p className="text-muted-foreground text-sm">Gerencie as informações e preferências da sua oficina</p>
              </div>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <Save className="h-4 w-4" />
                {saving ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-6">
            {/* Basic Information */}
            <Card className="shadow-xl rounded-lg border border-border bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Basic Information
              </CardTitle>
              <CardDescription>
                Update your garage's basic details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Garage Name</Label>
                  <Input
                    id="name"
                    value={settings.name}
                    onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={settings.email}
                    onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={settings.phone}
                    onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={settings.website || ''}
                    onChange={(e) => setSettings({ ...settings, website: e.target.value })}
                    placeholder="https://yourgarage.com"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={settings.address}
                  onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={settings.city}
                    onChange={(e) => setSettings({ ...settings, city: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="postcode">Postcode</Label>
                  <Input
                    id="postcode"
                    value={settings.postcode}
                    onChange={(e) => setSettings({ ...settings, postcode: e.target.value })}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                  rows={3}
                  value={settings.description || ''}
                  onChange={(e) => setSettings({ ...settings, description: e.target.value })}
                  placeholder="Brief description of your garage services..."
                />
              </div>
            </CardContent>
          </Card>

            {/* Pricing */}
            <Card className="shadow-xl rounded-lg border border-border bg-card">
            <CardHeader>
              <CardTitle>Pricing</CardTitle>
              <CardDescription>
                Set your MOT test prices
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="motPrice">MOT Test Price (£)</Label>
                  <Input
                    id="motPrice"
                    type="number"
                    step="0.01"
                    value={settings.motPrice}
                    onChange={(e) => setSettings({ ...settings, motPrice: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label htmlFor="retestPrice">Retest Price (£)</Label>
                  <Input
                    id="retestPrice"
                    type="number"
                    step="0.01"
                    value={settings.retestPrice}
                    onChange={(e) => setSettings({ ...settings, retestPrice: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

            {/* Opening Hours */}
            <Card className="shadow-xl rounded-lg border border-border bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Opening Hours
              </CardTitle>
              <CardDescription>
                Set your garage's operating hours
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(openingHours).map(([day, hours]) => (
                  <div key={day} className="flex items-center gap-4">
                    <div className="w-24">
                      <Label className="capitalize">{day}</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={!hours.closed}
                        onChange={(e) => updateOpeningHours(day, 'closed', !e.target.checked)}
                        className="rounded"
                      />
                      <span className="text-sm">Open</span>
                    </div>
                    {!hours.closed && (
                      <>
                        <Input
                          type="time"
                          value={hours.open}
                          onChange={(e) => updateOpeningHours(day, 'open', e.target.value)}
                          className="w-32"
                        />
                        <span className="text-sm">to</span>
                        <Input
                          type="time"
                          value={hours.close}
                          onChange={(e) => updateOpeningHours(day, 'close', e.target.value)}
                          className="w-32"
                        />
                      </>
                    )}
                    {hours.closed && (
                      <span className="text-sm text-gray-500">Closed</span>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          </div>
        </div>
      </div>
    </GarageLayout>
  );
}