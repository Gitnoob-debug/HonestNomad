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

interface LoyaltyProgram {
  id: string;
  type: 'airline' | 'hotel';
  name: string;
  memberNumber: string;
}

const AIRLINE_PROGRAMS = [
  'American Airlines AAdvantage',
  'United MileagePlus',
  'Delta SkyMiles',
  'Southwest Rapid Rewards',
  'JetBlue TrueBlue',
  'Alaska Airlines Mileage Plan',
  'British Airways Executive Club',
  'Air France Flying Blue',
  'Lufthansa Miles & More',
  'Emirates Skywards',
  'Qatar Airways Privilege Club',
  'Singapore Airlines KrisFlyer',
];

const HOTEL_PROGRAMS = [
  'Marriott Bonvoy',
  'Hilton Honors',
  'IHG One Rewards',
  'World of Hyatt',
  'Wyndham Rewards',
  'Choice Privileges',
  'Best Western Rewards',
  'Accor Live Limitless',
  'Radisson Rewards',
];

export default function SettingsPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [flashProfile, setFlashProfile] = useState<FlashProfileStatus | null>(null);
  const [flashLoading, setFlashLoading] = useState(true);

  // Account info
  const [accountInfo, setAccountInfo] = useState({
    firstName: '',
    lastName: '',
    phone: '',
  });
  const [accountSaving, setAccountSaving] = useState(false);
  const [accountMessage, setAccountMessage] = useState('');

  // Loyalty programs
  const [loyaltyPrograms, setLoyaltyPrograms] = useState<LoyaltyProgram[]>([]);
  const [showAddProgram, setShowAddProgram] = useState(false);
  const [newProgram, setNewProgram] = useState({
    type: 'airline' as 'airline' | 'hotel',
    name: '',
    memberNumber: '',
  });
  const [loyaltySaving, setLoyaltySaving] = useState(false);
  const [loyaltyMessage, setLoyaltyMessage] = useState('');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (user) {
      // Fetch user account info and loyalty programs
      fetch('/api/user/preferences')
        .then((res) => res.json())
        .then((data) => {
          if (data.preferences) {
            setAccountInfo({
              firstName: data.preferences.firstName || '',
              lastName: data.preferences.lastName || '',
              phone: data.preferences.phone || '',
            });
            setLoyaltyPrograms(data.preferences.loyaltyPrograms || []);
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

  const handleSaveAccount = async () => {
    setAccountSaving(true);
    setAccountMessage('');

    try {
      const response = await fetch('/api/user/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: accountInfo.firstName,
          lastName: accountInfo.lastName,
          phone: accountInfo.phone,
        }),
      });

      if (response.ok) {
        setAccountMessage('Account info saved successfully!');
      } else {
        setAccountMessage('Failed to save account info');
      }
    } catch (error) {
      setAccountMessage('An error occurred');
    } finally {
      setAccountSaving(false);
    }
  };

  const handleAddProgram = async () => {
    if (!newProgram.name || !newProgram.memberNumber) return;

    const program: LoyaltyProgram = {
      id: Date.now().toString(),
      type: newProgram.type,
      name: newProgram.name,
      memberNumber: newProgram.memberNumber,
    };

    const updatedPrograms = [...loyaltyPrograms, program];
    setLoyaltySaving(true);
    setLoyaltyMessage('');

    try {
      const response = await fetch('/api/user/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          loyaltyPrograms: updatedPrograms,
        }),
      });

      if (response.ok) {
        setLoyaltyPrograms(updatedPrograms);
        setNewProgram({ type: 'airline', name: '', memberNumber: '' });
        setShowAddProgram(false);
        setLoyaltyMessage('Loyalty program added!');
      } else {
        setLoyaltyMessage('Failed to add program');
      }
    } catch (error) {
      setLoyaltyMessage('An error occurred');
    } finally {
      setLoyaltySaving(false);
    }
  };

  const handleRemoveProgram = async (programId: string) => {
    const updatedPrograms = loyaltyPrograms.filter((p) => p.id !== programId);
    setLoyaltySaving(true);

    try {
      const response = await fetch('/api/user/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          loyaltyPrograms: updatedPrograms,
        }),
      });

      if (response.ok) {
        setLoyaltyPrograms(updatedPrograms);
      }
    } catch (error) {
      console.error('Failed to remove program:', error);
    } finally {
      setLoyaltySaving(false);
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

      {/* Account Section */}
      <Card>
        <h2 className="text-lg font-semibold mb-4">Account</h2>
        <p className="text-gray-600 text-sm mb-6">
          Your personal information and login details.
        </p>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="First Name"
              value={accountInfo.firstName}
              onChange={(e) =>
                setAccountInfo((p) => ({ ...p, firstName: e.target.value }))
              }
              placeholder="John"
            />
            <Input
              label="Last Name"
              value={accountInfo.lastName}
              onChange={(e) =>
                setAccountInfo((p) => ({ ...p, lastName: e.target.value }))
              }
              placeholder="Doe"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">
              Email
            </label>
            <p className="text-gray-900 py-2">{user?.email}</p>
          </div>

          <Input
            label="Phone Number (optional)"
            type="tel"
            value={accountInfo.phone}
            onChange={(e) =>
              setAccountInfo((p) => ({ ...p, phone: e.target.value }))
            }
            placeholder="+1 (555) 123-4567"
          />
        </div>

        {accountMessage && (
          <div
            className={`mt-4 p-3 rounded-lg text-sm ${
              accountMessage.includes('success')
                ? 'bg-green-50 text-green-800'
                : 'bg-red-50 text-red-800'
            }`}
          >
            {accountMessage}
          </div>
        )}

        <div className="mt-6 pt-4 border-t">
          <Button onClick={handleSaveAccount} loading={accountSaving}>
            Save Account Info
          </Button>
        </div>
      </Card>

      {/* Loyalty Programs Section */}
      <Card className="mt-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold">Loyalty Programs</h2>
            <p className="text-gray-600 text-sm">
              Your airline and hotel membership numbers for easy booking.
            </p>
          </div>
        </div>

        {loyaltyPrograms.length > 0 ? (
          <div className="space-y-3 mb-4">
            {loyaltyPrograms.map((program) => (
              <div
                key={program.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      program.type === 'airline'
                        ? 'bg-blue-100 text-blue-600'
                        : 'bg-purple-100 text-purple-600'
                    }`}
                  >
                    {program.type === 'airline' ? (
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 12h14M5 12l4-4m-4 4l4 4"
                          transform="rotate(-45 12 12)"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                        />
                      </svg>
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{program.name}</p>
                    <p className="text-gray-500 text-xs">#{program.memberNumber}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveProgram(program.id)}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                  disabled={loyaltySaving}
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 bg-gray-50 rounded-lg mb-4">
            <p className="text-gray-500 text-sm">No loyalty programs added yet</p>
          </div>
        )}

        {showAddProgram ? (
          <div className="border rounded-lg p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Program Type</label>
              <select
                value={newProgram.type}
                onChange={(e) =>
                  setNewProgram((p) => ({
                    ...p,
                    type: e.target.value as 'airline' | 'hotel',
                    name: '',
                  }))
                }
                className="input-field"
              >
                <option value="airline">Airline</option>
                <option value="hotel">Hotel</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Program Name</label>
              <select
                value={newProgram.name}
                onChange={(e) =>
                  setNewProgram((p) => ({ ...p, name: e.target.value }))
                }
                className="input-field"
              >
                <option value="">Select a program...</option>
                {(newProgram.type === 'airline' ? AIRLINE_PROGRAMS : HOTEL_PROGRAMS).map(
                  (program) => (
                    <option key={program} value={program}>
                      {program}
                    </option>
                  )
                )}
              </select>
            </div>

            <Input
              label="Member Number"
              value={newProgram.memberNumber}
              onChange={(e) =>
                setNewProgram((p) => ({ ...p, memberNumber: e.target.value }))
              }
              placeholder="Enter your member number"
            />

            <div className="flex gap-2">
              <Button
                onClick={handleAddProgram}
                loading={loyaltySaving}
                disabled={!newProgram.name || !newProgram.memberNumber}
              >
                Add Program
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setShowAddProgram(false);
                  setNewProgram({ type: 'airline', name: '', memberNumber: '' });
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button variant="secondary" onClick={() => setShowAddProgram(true)}>
            + Add Loyalty Program
          </Button>
        )}

        {loyaltyMessage && (
          <div
            className={`mt-4 p-3 rounded-lg text-sm ${
              loyaltyMessage.includes('added') || loyaltyMessage.includes('success')
                ? 'bg-green-50 text-green-800'
                : 'bg-red-50 text-red-800'
            }`}
          >
            {loyaltyMessage}
          </div>
        )}
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
    </div>
  );
}
