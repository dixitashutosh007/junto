import { z } from 'zod';

// Phone number regex for Indian standard: +91 followed by 10 digits
export const phoneRegex = /^(\+91)?[6-9]\d{9}$/;

// Ride creation schema
export const CreateRideSchema = z.object({
  vehicleId: z.string().min(1, 'Vehicle is required'),
  journeyDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Valid date YYYY-MM-DD required'),
  departureWindowStart: z.string().min(1, 'Departure window start required'),
  departureWindowEnd: z.string().optional(),
  direction: z.enum(['OUTBOUND_SOCIETY', 'INBOUND_SOCIETY']).optional().default('OUTBOUND_SOCIETY'),
  originName: z.string().optional(),
  originLat: z.number().optional(),
  originLng: z.number().optional(),
  destinationName: z.string().min(2, 'Destination name required'),
  destinationPlaceId: z.string().optional(),
  destinationLat: z.number().optional().default(13.05),
  destinationLng: z.number().optional().default(77.62),
  totalSeats: z.number().int().min(1).max(6).default(2),
  genderPreference: z.enum(['ANY', 'MALE_ONLY', 'FEMALE_ONLY']).default('ANY'),
  visibility: z.enum(['SOCIETY_WIDE', 'MATCH_ONLY']).optional().default('SOCIETY_WIDE'),
});

// Ride request schema
export const CreateRideRequestSchema = z.object({
  journeyId: z.string().min(1, 'journeyId is required'),
  requestedSeats: z.number().int().min(1).max(4).default(1),
  pickupName: z.string().optional(),
  pickupLat: z.number().optional(),
  pickupLng: z.number().optional(),
  dropoffName: z.string().optional(),
  dropoffLat: z.number().optional(),
  dropoffLng: z.number().optional(),
});

// Member registration schema
export const MemberRegistrationSchema = z.object({
  societyCode: z.string().min(2, 'Society invitation code required'),
  fullName: z.string().min(2, 'Full name required'),
  email: z.string().email('Valid email address required'),
  mobile: z.string().min(10, 'Valid mobile number required'),
  flatNumber: z.string().min(1, 'Flat / Apartment number required'),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY']).default('PREFER_NOT_TO_SAY'),
  workLocationName: z.string().optional(),
});

// Feedback schema
export const FeedbackSchema = z.object({
  journeyId: z.string().min(1, 'journeyId required'),
  toUserId: z.string().min(1, 'toUserId required'),
  role: z.enum(['OFFERER', 'SEEKER']).default('SEEKER'),
  outcome: z.enum([
    'COMPLETED',
    'DRIVER_CANCELLED',
    'PASSENGER_CANCELLED',
    'PASSENGER_NO_SHOW',
    'DRIVER_NO_SHOW',
    'OTHER',
  ]),
  qualitativeTags: z.array(z.string()).default([]),
  privateNote: z.string().max(500).optional(),
});

// Moderation report schema
export const ModerationReportSchema = z.object({
  reportedUserId: z.string().min(1, 'reportedUserId required'),
  journeyId: z.string().optional(),
  category: z.enum([
    'INAPPROPRIATE_BEHAVIOUR',
    'MISREPRESENTATION',
    'REPEATED_CANCELLATION',
    'NO_SHOW',
    'SAFETY_CONCERN',
    'HARASSMENT',
    'OTHER',
  ]),
  description: z.string().min(5, 'Detailed description required').max(1000),
});
