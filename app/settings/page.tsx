'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { Card, Button, Input, Spinner } from '@/components/ui';

interface FlashProfileStatus {
  profileComplete: boolean;
  missingSteps: string[];
  preferences: any | null;
}

export default function SettingsPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [preferences, setPreferences] = useState({
    defaultCurrency: 'USD',
    travelerType: '',
    budgetMin: '',
    budgetMax: '',
  });
  const [flashProfile, setFlashProfile] = useState<FlashProfileStatus | null>(null);
  const [flashLoading, setFlashLoading] = useState(true);
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

      // Fetch flash profile status
      setFlashLoading(true);
      fetch('/api/flash/preferences')
        .then((res) => res.json())
        .then((data) => {
          setFlashProfile({
            profileComplete: data.profileComplete || false,
            missingSteps: data.missingSteps || [],
            preferences: data.preferences,
          });
        })
        .catch(console.error)
        .finally(() => setFlashLoading(false));
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

      {/* Flash Vacation Profile */}
      <Card className="mt-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-semibold">Flash Vacation Profile</h2>
            <p className="text-sm text-gray-500">
              Your preferences for instant trip generation
            </p>
          </div>
        </div>

        {flashLoading ? (
          <div className="flex items-center justify-center py-8">
            <Spinner size="md" />
          </div>
        ) : flashProfile?.profileComplete ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-green-600 bg-green-50 px-4 py-3 rounded-lg">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="font-medium">Profile Complete</span>
            </div>

            {flashProfile.preferences && (
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Travelers:</span>{' '}
                  <span className="font-medium">
                    {flashProfile.preferences.travelers?.adults || 0} adult
                    {(flashProfile.preferences.travelers?.adults || 0) !== 1 ? 's' : ''}
                    {flashProfile.preferences.travelers?.children?.length > 0 &&
                      `, ${flashProfile.preferences.travelers.children.length} child${flashProfile.preferences.travelers.children.length !== 1 ? 'ren' : ''}`}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Home Base:</span>{' '}
                  <span className="font-medium">{flashProfile.preferences.homeBase?.airportCode || 'Not set'}</span>
                </div>
                <div>
                  <span className="text-gray-500">Budget:</span>{' '}
                  <span className="font-medium">
                    {flashProfile.preferences.budget?.currency || 'USD'}{' '}
                    {flashProfile.preferences.budget?.perTripMax?.toLocaleString() || 'Not set'}/trip
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Min Hotel Rating:</span>{' '}
                  <span className="font-medium">{flashProfile.preferences.accommodation?.minStars || 3}+ stars</span>
                </div>
              </div>
            )}

            <Button
              variant="secondary"
              onClick={() => router.push('/flash/wizard')}
              className="w-full"
            >
              Edit Flash Profile
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-amber-800 text-sm">
                Complete your Flash profile to unlock instant trip generation.
              </p>
              {flashProfile?.missingSteps && flashProfile.missingSteps.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs text-amber-600 mb-2">Missing information:</p>
                  <div className="flex flex-wrap gap-1">
                    {flashProfile.missingSteps.map((step) => (
                      <span
                        key={step}
                        className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-xs"
                      >
                        {step.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <Button
              variant="primary"
              onClick={() => router.push('/flash/wizard')}
              className="w-full"
            >
              Complete Flash Profile
            </Button>
          </div>
        )}
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
