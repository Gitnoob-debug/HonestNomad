'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { Card, Button, Input } from '@/components/ui';

export default function SettingsPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [preferences, setPreferences] = useState({
    defaultCurrency: 'USD',
    travelerType: '',
    budgetMin: '',
    budgetMax: '',
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (user) {
      // Fetch user preferences
      fetch('/api/user/preferences')
        .then((res) => res.json())
        .then((data) => {
          if (data.preferences) {
            setPreferences({
              defaultCurrency: data.preferences.defaultCurrency || 'USD',
              travelerType: data.preferences.travelerType || '',
              budgetMin: data.preferences.budgetRange?.min?.toString() || '',
              budgetMax: data.preferences.budgetRange?.max?.toString() || '',
            });
          }
        })
        .catch(console.error);
    }
  }, [user]);

  const handleSave = async () => {
    setSaving(true);
    setMessage('');

    try {
      const response = await fetch('/api/user/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          defaultCurrency: preferences.defaultCurrency,
          travelerType: preferences.travelerType,
          budgetRange: {
            min: preferences.budgetMin ? parseInt(preferences.budgetMin) : undefined,
            max: preferences.budgetMax ? parseInt(preferences.budgetMax) : undefined,
          },
        }),
      });

      if (response.ok) {
        setMessage('Preferences saved successfully!');
      } else {
        setMessage('Failed to save preferences');
      }
    } catch (error) {
      setMessage('An error occurred');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6" />
          <div className="h-64 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>

      <Card>
        <h2 className="text-lg font-semibold mb-4">Travel Preferences</h2>
        <p className="text-gray-600 text-sm mb-6">
          Set your default preferences to speed up future searches.
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Default Currency
            </label>
            <select
              value={preferences.defaultCurrency}
              onChange={(e) =>
                setPreferences((p) => ({ ...p, defaultCurrency: e.target.value }))
              }
              className="input-field"
            >
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
              <option value="CAD">CAD ($)</option>
              <option value="AUD">AUD ($)</option>
              <option value="JPY">JPY (¥)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Traveler Type
            </label>
            <select
              value={preferences.travelerType}
              onChange={(e) =>
                setPreferences((p) => ({ ...p, travelerType: e.target.value }))
              }
              className="input-field"
            >
              <option value="">Select...</option>
              <option value="solo">Solo Traveler</option>
              <option value="couple">Couple</option>
              <option value="family">Family</option>
              <option value="group">Group</option>
              <option value="business">Business</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Budget Min (per night)"
              type="number"
              value={preferences.budgetMin}
              onChange={(e) =>
                setPreferences((p) => ({ ...p, budgetMin: e.target.value }))
              }
              placeholder="50"
            />
            <Input
              label="Budget Max (per night)"
              type="number"
              value={preferences.budgetMax}
              onChange={(e) =>
                setPreferences((p) => ({ ...p, budgetMax: e.target.value }))
              }
              placeholder="300"
            />
          </div>
        </div>

        {message && (
          <div
            className={`mt-4 p-3 rounded-lg text-sm ${
              message.includes('success')
                ? 'bg-green-50 text-green-800'
                : 'bg-red-50 text-red-800'
            }`}
          >
            {message}
          </div>
        )}

        <div className="mt-6 pt-4 border-t">
          <Button onClick={handleSave} loading={saving}>
            Save Preferences
          </Button>
        </div>
      </Card>

      <Card className="mt-6">
        <h2 className="text-lg font-semibold mb-4">Account</h2>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-500">
              Email
            </label>
            <p className="text-gray-900">{user?.email}</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
