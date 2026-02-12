'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Button } from '@/components/ui';
import { getDraftTrips, deleteDraftTrip, formatTimeAgo, DraftTrip } from '@/lib/flash/draft-storage';

export default function DraftTripsSection() {
  const router = useRouter();
  const [drafts, setDrafts] = useState<DraftTrip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    // Load drafts from API
    async function loadDrafts() {
      const loadedDrafts = await getDraftTrips();
      setDrafts(loadedDrafts);
      setIsLoading(false);
    }
    loadDrafts();
  }, []);

  const handleResume = (draft: DraftTrip) => {
    // Navigate to explore page with this draft's ID
    router.push(`/flash/explore?draft=${draft.id}`);
  };

  const handleDelete = async (draftId: string) => {
    setDeletingId(draftId);
    const success = await deleteDraftTrip(draftId);
    if (success) {
      setDrafts(drafts.filter(d => d.id !== draftId));
    }
    setDeletingId(null);
  };

  // Don't render anything if loading or no drafts
  if (isLoading) {
    return (
      <div className="mb-8">
        <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-4" />
        <div className="space-y-3">
          <div className="h-24 bg-gray-100 rounded-lg animate-pulse" />
        </div>
      </div>
    );
  }

  if (drafts.length === 0) return null;

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">
          Unfinished Trips
        </h2>
        <span className="text-sm text-gray-500">
          {drafts.length} saved
        </span>
      </div>

      <div className="space-y-3">
        {drafts.map((draft) => (
          <Card
            key={draft.id}
            className="relative overflow-hidden border-l-4 border-l-amber-400"
          >
            {/* Background destination image */}
            {draft.trip.imageUrl && (
              <div
                className="absolute inset-0 opacity-10"
                style={{
                  backgroundImage: `url(${draft.trip.imageUrl})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              />
            )}

            <div className="relative flex items-center justify-between p-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full">
                    Draft
                  </span>
                  <span className="text-xs text-gray-500">
                    {formatTimeAgo(draft.updatedAt)}
                  </span>
                </div>

                <h3 className="font-semibold text-gray-900">
                  {draft.trip.destination.city}, {draft.trip.destination.country}
                </h3>

                <p className="text-sm text-gray-600">
                  {draft.trip.itinerary.days} night{draft.trip.itinerary.days !== 1 ? 's' : ''}
                  {draft.trip.pricing?.hotel ? ` · $${draft.trip.pricing.hotel} hotel` : ''}
                </p>

                <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                  {draft.favorites.length > 0 && (
                    <span>
                      {draft.favorites.length} saved place{draft.favorites.length !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 ml-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(draft.id)}
                  disabled={deletingId === draft.id}
                  className="text-gray-400 hover:text-red-500"
                >
                  {deletingId === draft.id ? (
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  )}
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleResume(draft)}
                >
                  Continue
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <p className="text-xs text-gray-400 mt-3 text-center">
        Your 3 most recent drafts are saved across all your devices
      </p>
    </div>
  );
}
