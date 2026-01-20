'use client';

import { useState } from 'react';
import { Button, Input, Card } from '@/components/ui';
import type { NormalizedHotel } from '@/types/hotel';
import type { GuestDetails } from '@/types/chat';

interface GuestFormProps {
  hotel: NormalizedHotel;
  onSubmit: (details: GuestDetails, paymentToken: string) => void;
}

export function GuestForm({ hotel, onSubmit }: GuestFormProps) {
  const [details, setDetails] = useState<GuestDetails>({
    givenName: '',
    familyName: '',
    email: '',
    phone: '',
  });
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setError(null);

    try {
      // In production, use Duffel Pay or Stripe to tokenize the card
      // For now, we'll simulate tokenization
      const paymentToken = await tokenizePayment(cardNumber, expiry, cvc);
      onSubmit(details, paymentToken);
    } catch (err: any) {
      setError(err.message || 'Payment failed. Please try again.');
      setIsProcessing(false);
    }
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    return parts.length ? parts.join(' ') : value;
  };

  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.slice(0, 2) + '/' + v.slice(2, 4);
    }
    return v;
  };

  return (
    <Card className="max-w-lg mx-auto">
      <h3 className="text-lg font-semibold mb-4">Complete Your Booking</h3>

      {/* Booking Summary */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <p className="font-medium text-gray-900">{hotel.name}</p>
        <p className="text-sm text-gray-600">{hotel.location.address}</p>
        <div className="mt-3 pt-3 border-t flex justify-between">
          <span className="text-gray-600">Total</span>
          <span className="font-bold text-gray-900">
            {hotel.pricing.currency} {hotel.pricing.totalAmount.toFixed(2)}
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Guest Details */}
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="First Name"
            value={details.givenName}
            onChange={(e) => setDetails((d) => ({ ...d, givenName: e.target.value }))}
            required
            placeholder="John"
          />
          <Input
            label="Last Name"
            value={details.familyName}
            onChange={(e) => setDetails((d) => ({ ...d, familyName: e.target.value }))}
            required
            placeholder="Doe"
          />
        </div>

        <Input
          label="Email"
          type="email"
          value={details.email}
          onChange={(e) => setDetails((d) => ({ ...d, email: e.target.value }))}
          required
          placeholder="john@example.com"
        />

        <Input
          label="Phone"
          type="tel"
          value={details.phone || ''}
          onChange={(e) => setDetails((d) => ({ ...d, phone: e.target.value }))}
          placeholder="+1 555 123 4567"
        />

        {/* Payment Section */}
        <div className="border-t pt-4 mt-4">
          <h4 className="font-medium mb-3">Payment Details</h4>

          <Input
            label="Card Number"
            value={cardNumber}
            onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
            placeholder="4242 4242 4242 4242"
            maxLength={19}
            required
          />

          <div className="grid grid-cols-2 gap-4 mt-4">
            <Input
              label="Expiry"
              value={expiry}
              onChange={(e) => setExpiry(formatExpiry(e.target.value))}
              placeholder="MM/YY"
              maxLength={5}
              required
            />
            <Input
              label="CVC"
              value={cvc}
              onChange={(e) => setCvc(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="123"
              maxLength={4}
              required
            />
          </div>

          <p className="text-xs text-gray-500 mt-2">
            Test card: 4242 4242 4242 4242, any future expiry, any CVC
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <Button
          type="submit"
          disabled={isProcessing}
          loading={isProcessing}
          className="w-full"
          size="lg"
        >
          {isProcessing
            ? 'Processing...'
            : `Pay ${hotel.pricing.currency} ${hotel.pricing.totalAmount.toFixed(2)}`}
        </Button>

        <p className="text-xs text-gray-500 text-center">
          By booking, you agree to the hotel's terms and cancellation policy.
        </p>
      </form>
    </Card>
  );
}

// Placeholder for payment tokenization
// In production, use Duffel Pay or Stripe
async function tokenizePayment(
  cardNumber: string,
  expiry: string,
  cvc: string
): Promise<string> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Basic validation
  const cleanCardNumber = cardNumber.replace(/\s/g, '');
  if (cleanCardNumber.length < 15) {
    throw new Error('Invalid card number');
  }

  // Return a test token
  return `tok_test_${Date.now()}`;
}
