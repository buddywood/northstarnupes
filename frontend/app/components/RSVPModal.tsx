'use client';

import { useState } from 'react';
import { toast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { Event } from '@/lib/api';

interface RSVPModalProps {
  event: Event | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function RSVPModal({ event, isOpen, onClose }: RSVPModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event || !name || !email) return;

    setSubmitting(true);
    
    // Placeholder - full RSVP backend can be added later
    console.log('RSVP submitted:', { eventId: event.id, name, email, message });
    
    // Simulate API call
    setTimeout(() => {
      setSubmitting(false);
      toast({
        title: 'RSVP submitted successfully!',
        description: 'This is a placeholder - backend integration coming soon',
      });
      onClose();
      setName('');
      setEmail('');
      setMessage('');
    }, 1000);
  };

  if (!event) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-display font-bold text-midnight-navy">RSVP to Event</DialogTitle>
        </DialogHeader>

        <div className="mb-6 p-4 bg-cream rounded-lg border border-frost-gray">
          <h3 className="font-semibold text-midnight-navy mb-2">{event.title}</h3>
          <p className="text-sm text-midnight-navy/70">
            {new Date(event.event_date).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: 'numeric',
              minute: '2-digit'
            })}
          </p>
          <p className="text-sm text-midnight-navy/70 mt-1">{event.location}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="rsvp-name" className="text-midnight-navy">
              Full Name *
            </Label>
            <Input
              type="text"
              id="rsvp-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="text-midnight-navy"
              placeholder="John Doe"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="rsvp-email" className="text-midnight-navy">
              Email Address *
            </Label>
            <Input
              type="email"
              id="rsvp-email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="text-midnight-navy"
              placeholder="your@email.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="rsvp-message" className="text-midnight-navy">
              Message (Optional)
            </Label>
            <Textarea
              id="rsvp-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              className="text-midnight-navy resize-none"
              placeholder="Any additional notes or questions..."
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting || !name || !email}
              className="flex-1 bg-crimson text-white hover:bg-crimson/90"
            >
              {submitting ? 'Submitting...' : 'RSVP Now'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}


