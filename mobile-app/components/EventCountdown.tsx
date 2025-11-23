import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../lib/constants';
import { Ionicons } from '@expo/vector-icons';

interface EventCountdownProps {
  eventDate: string | Date;
}

export default function EventCountdown({ eventDate }: EventCountdownProps) {
  const [timeRemaining, setTimeRemaining] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);

  useEffect(() => {
    const calculateTimeRemaining = () => {
      const now = new Date().getTime();
      const event = new Date(eventDate).getTime();
      const difference = event - now;

      if (difference <= 0) {
        setTimeRemaining(null);
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeRemaining({ days, hours, minutes, seconds });
    };

    // Calculate immediately
    calculateTimeRemaining();

    // Update every second
    const interval = setInterval(calculateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [eventDate]);

  if (!timeRemaining) {
    return (
      <Text style={styles.passedText}>Event passed</Text>
    );
  }

  return (
    <View style={styles.container}>
      <Ionicons name="time-outline" size={16} color={COLORS.crimson} />
      <Text style={styles.timeText}>
        {timeRemaining.days > 0 && `${timeRemaining.days}d `}
        {timeRemaining.hours}h {timeRemaining.minutes}m
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timeText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.crimson,
  },
  passedText: {
    fontSize: 14,
    color: COLORS.midnightNavy,
    opacity: 0.6,
  },
});

