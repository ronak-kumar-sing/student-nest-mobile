import { faker } from '@faker-js/faker';

export interface MockUser {
  id: string;
  email: string;
  displayName: string;
  role: 'student' | 'owner';
  avatarUrl: string | null;
  phone: string | null;
  isVerified: boolean;
}

export interface MockProperty {
  id: string;
  title: string;
  rentPaise: number;
  depositPaise: number;
  maintenancePaise: number;
  billsPaise: number;
  city: string;
  locality: string;
  address?: string; // Revealed only when approved
  roomType: string;
  genderPolicy: 'male' | 'female' | 'unisex';
  status: 'draft' | 'pending_review' | 'published' | 'rejected' | 'archived';
  ownerId: string;
  images: string[];
  amenities: string[];
  rating: number;
  reviewCount: number;
  nearbyColleges: string[];
}

export interface MockBooking {
  id: string;
  propertyId: string;
  studentId: string;
  ownerId: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'checked_in' | 'completed';
  moveInDate: string;
  durationMonths: number;
  occupants: number;
  agreedRentPaise: number;
  createdAt: string;
  history: { status: string; at: string; by: string; note?: string }[];
}

export interface MockTour {
  id: string;
  propertyId: string;
  studentId: string;
  ownerId: string;
  status: 'pending' | 'confirmed' | 'rescheduled' | 'completed' | 'cancelled';
  proposedSlots: string[];
  confirmedSlot: string | null;
  meetingLink?: string;
  address?: string;
  createdAt: string;
}

export interface MockInquiry {
  id: string;
  propertyId: string;
  studentId: string;
  ownerId: string;
  lastMessage: string;
  updatedAt: string;
  unreadCount: number;
  messages: {
    id: string;
    senderId: string;
    text: string;
    createdAt: string;
  }[];
}

export interface MockNotification {
  id: string;
  userId: string;
  title: string;
  body: string;
  read: boolean;
  type: 'booking' | 'tour' | 'message' | 'system';
  deepLink?: string;
  createdAt: string;
}

export interface MockReview {
  id: string;
  propertyId: string;
  studentId: string;
  studentName: string;
  rating: number;
  comment: string;
  livedHere: boolean;
  createdAt: string;
  ownerReply?: {
    comment: string;
    createdAt: string;
  };
}

export interface MockDB {
  users: MockUser[];
  properties: MockProperty[];
  bookings: MockBooking[];
  tours: MockTour[];
  inquiries: MockInquiry[];
  notifications: MockNotification[];
  favorites: string[]; // property IDs
  reviews: MockReview[];
}

const CITIES = ['Indore', 'Bengaluru', 'Pune'] as const;

const LOCALITIES: Record<(typeof CITIES)[number], string[]> = {
  Indore: [
    'Vijay Nagar',
    'Palasia',
    'Bhawarkua',
    'Sapna Sangeeta',
    'AB Road',
    'Rajwada',
    'South Tukoganj',
    'Geeta Bhawan',
  ],
  Bengaluru: [
    'Koramangala',
    'HSR Layout',
    'Indiranagar',
    'BTM Layout',
    'Whitefield',
    'Electronic City',
    'Jayanagar',
    'Marathahalli',
  ],
  Pune: [
    'Kothrud',
    'Hinjewadi',
    'Viman Nagar',
    'Koregaon Park',
    'Baner',
    'Aundh',
    'Wakad',
    'Hadapsar',
  ],
};

const COLLEGES: Record<(typeof CITIES)[number], string[]> = {
  Indore: ['IET-DAVV', 'SGSITS', 'IIT Indore', 'Medicaps University', 'IPS Academy'],
  Bengaluru: [
    'IISc Bengaluru',
    'RV College',
    'BMS College of Engineering',
    'PES University',
    'Christ University',
  ],
  Pune: [
    'COEP Pune',
    'MIT-WPU',
    'Symbiosis International',
    'Fergusson College',
    'Bharati Vidyapeeth',
  ],
};

const ROOM_TYPES = [
  'single_room',
  'double_sharing',
  'triple_sharing',
  'pg',
  'hostel',
  'flat',
  '1bhk',
  '2bhk',
];

const AMENITIES = [
  'WiFi',
  'AC',
  'Attached Washroom',
  'Power Backup',
  'Geyser',
  'Washing Machine',
  'CCTV',
  'Biometric Entry',
  'Food Included',
  'Cleaning Service',
  'Balcony',
  'RO Water',
];

function generateProperties(): MockProperty[] {
  faker.seed(42);
  const properties: MockProperty[] = [];

  for (let i = 0; i < 60; i++) {
    const city = CITIES[i % 3]!;
    const cityLocalities = LOCALITIES[city]!;
    const cityColleges = COLLEGES[city]!;
    const locality = cityLocalities[i % cityLocalities.length]!;
    const roomType = ROOM_TYPES[i % ROOM_TYPES.length]!;
    const rentPaise = 400000 + ((i * 35000 + 17000) % 2100000);
    const depositPaise = rentPaise * 2;
    const maintenancePaise = i % 3 === 0 ? 50000 : 0;
    const billsPaise = i % 2 === 0 ? 30000 : 0;

    const rating = 3.8 + (i % 12) * 0.1;
    const roundedRating = Math.min(5.0, Math.round(rating * 10) / 10);

    const propertyAmenities = AMENITIES.filter((_, idx) => (i + idx) % 2 === 0);

    properties.push({
      id: `property-${i + 1}`,
      title: `${roomType.replace('_', ' ').toUpperCase()} in ${locality}, ${city}`,
      rentPaise,
      depositPaise,
      maintenancePaise,
      billsPaise,
      city,
      locality,
      address: `House #${100 + i}, 4th Cross, ${locality}, ${city}`,
      roomType,
      genderPolicy: i % 3 === 0 ? 'female' : i % 3 === 1 ? 'male' : 'unisex',
      status: i < 52 ? 'published' : i < 56 ? 'pending_review' : 'draft',
      ownerId: i % 2 === 0 ? 'owner-1' : 'owner-2',
      images: [
        `https://images.unsplash.com/photo-1522770179533-24471fcdba45?w=800&auto=format&fit=crop&q=80`,
        `https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=800&auto=format&fit=crop&q=80`,
        `https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&auto=format&fit=crop&q=80`,
      ],
      amenities: propertyAmenities,
      rating: roundedRating,
      reviewCount: 4 + (i % 15),
      nearbyColleges: [
        cityColleges[i % cityColleges.length]!,
        cityColleges[(i + 1) % cityColleges.length]!,
      ],
    });
  }

  return properties;
}

function createInitialDB(): MockDB {
  const properties = generateProperties();

  return {
    users: [
      {
        id: 'student-1',
        email: 'rahul.sharma@example.com',
        displayName: 'Rahul Sharma',
        role: 'student',
        avatarUrl:
          'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
        phone: '+919876543210',
        isVerified: true,
      },
      {
        id: 'student-2',
        email: 'priya.patel@example.com',
        displayName: 'Priya Patel',
        role: 'student',
        avatarUrl:
          'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80',
        phone: '+919876543211',
        isVerified: false,
      },
      {
        id: 'owner-1',
        email: 'amit.kumar@example.com',
        displayName: 'Amit Kumar',
        role: 'owner',
        avatarUrl:
          'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&auto=format&fit=crop&q=80',
        phone: '+919876543212',
        isVerified: true,
      },
      {
        id: 'owner-2',
        email: 'sunita.devi@example.com',
        displayName: 'Sunita Devi',
        role: 'owner',
        avatarUrl:
          'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80',
        phone: '+919876543213',
        isVerified: false,
      },
    ],
    properties,
    bookings: [
      {
        id: 'booking-1',
        propertyId: 'property-1',
        studentId: 'student-1',
        ownerId: 'owner-1',
        status: 'approved',
        moveInDate: '2026-11-15T00:00:00.000Z',
        durationMonths: 6,
        occupants: 1,
        agreedRentPaise: 850000,
        createdAt: '2026-10-25T10:00:00.000Z',
        history: [
          { status: 'pending', at: '2026-10-25T10:00:00.000Z', by: 'student-1' },
          {
            status: 'approved',
            at: '2026-10-26T14:30:00.000Z',
            by: 'owner-1',
            note: 'Welcome to Student Nest!',
          },
        ],
      },
      {
        id: 'booking-2',
        propertyId: 'property-4',
        studentId: 'student-1',
        ownerId: 'owner-2',
        status: 'pending',
        moveInDate: '2026-12-01T00:00:00.000Z',
        durationMonths: 11,
        occupants: 1,
        agreedRentPaise: 1200000,
        createdAt: '2026-10-28T09:15:00.000Z',
        history: [{ status: 'pending', at: '2026-10-28T09:15:00.000Z', by: 'student-1' }],
      },
    ],
    tours: [
      {
        id: 'tour-1',
        propertyId: 'property-2',
        studentId: 'student-1',
        ownerId: 'owner-1',
        status: 'confirmed',
        proposedSlots: ['2026-11-02T10:00:00.000Z', '2026-11-02T15:00:00.000Z'],
        confirmedSlot: '2026-11-02T10:00:00.000Z',
        address: 'House #101, Palasia, Indore',
        createdAt: '2026-10-27T08:00:00.000Z',
      },
    ],
    inquiries: [
      {
        id: 'inquiry-1',
        propertyId: 'property-1',
        studentId: 'student-1',
        ownerId: 'owner-1',
        lastMessage: 'Hi, is single occupancy available immediately?',
        updatedAt: '2026-10-28T16:20:00.000Z',
        unreadCount: 0,
        messages: [
          {
            id: 'msg-1',
            senderId: 'student-1',
            text: 'Hi, is single occupancy available immediately?',
            createdAt: '2026-10-28T16:20:00.000Z',
          },
        ],
      },
    ],
    notifications: [
      {
        id: 'notif-1',
        userId: 'student-1',
        title: 'Booking Approved! 🎉',
        body: 'Owner Amit Kumar approved your booking application for Property in Vijay Nagar.',
        read: false,
        type: 'booking',
        deepLink: 'studentnest://booking/booking-1',
        createdAt: '2026-10-26T14:30:00.000Z',
      },
      {
        id: 'notif-2',
        userId: 'student-1',
        title: 'Tour Confirmed',
        body: 'Your scheduled tour for 02 Nov 2026 10:00 AM has been confirmed.',
        read: true,
        type: 'tour',
        deepLink: 'studentnest://tour/tour-1',
        createdAt: '2026-10-27T08:30:00.000Z',
      },
    ],
    favorites: ['property-1', 'property-3', 'property-8'],
    reviews: [
      {
        id: 'review-1',
        propertyId: 'property-1',
        studentId: 'student-2',
        studentName: 'Priya Patel',
        rating: 5,
        comment:
          'Very clean place and the owner is cooperative. Great WiFi speeds and peaceful neighborhood.',
        livedHere: true,
        createdAt: '2026-09-15T12:00:00.000Z',
        ownerReply: {
          comment: 'Thank you Priya! Happy to have you as a tenant.',
          createdAt: '2026-09-16T10:00:00.000Z',
        },
      },
    ],
  };
}

let dbInstance: MockDB | null = null;

export function getDB(): MockDB {
  if (!dbInstance) {
    dbInstance = createInitialDB();
  }
  return dbInstance;
}

export function resetDB(): void {
  dbInstance = createInitialDB();
}

export function addFavorite(propertyId: string): void {
  const db = getDB();
  if (!db.favorites.includes(propertyId)) {
    db.favorites.push(propertyId);
  }
}

export function removeFavorite(propertyId: string): void {
  const db = getDB();
  db.favorites = db.favorites.filter((id) => id !== propertyId);
}

export function addInquiryMessage(
  threadId: string,
  msg: { id: string; senderId: string; text: string; createdAt: string },
): void {
  const db = getDB();
  const thread = db.inquiries.find((i) => i.id === threadId);
  if (thread) {
    thread.messages.push(msg);
    thread.lastMessage = msg.text;
    thread.updatedAt = msg.createdAt;
  }
}

export function updateBookingStatus(
  bookingId: string,
  status: MockBooking['status'],
  by: string,
  note?: string,
): void {
  const db = getDB();
  const booking = db.bookings.find((b) => b.id === bookingId);
  if (booking) {
    booking.status = status;
    booking.history.push({
      status,
      at: new Date().toISOString(),
      by,
      note,
    });
  }
}
