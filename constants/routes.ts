export const ROUTES = {
  HOME: '/(tabs)',
  EXPLORE: '/(tabs)/explore',
  BOOKINGS: '/(tabs)/bookings',
  PROFILE: '/(tabs)/profile',
  NOTIFICATIONS: '/notifications',
  RIDE_BOOKING: '/rides/booking',
  EDIT_PROFILE: '/profile/editProfile',
  EDIT_NAME: '/profile/editName',
  EDIT_PHONE: '/profile/editPhone',
  EDIT_EMAIL: '/profile/editEmail',
  EDIT_BIO: '/profile/editBio',
  EDIT_DOB: '/profile/editDOB',
  EDIT_GENDER: '/profile/editGender',
  PREFERENCES: '/profile/preferences',
  IMAGE_VIEWER: '/profile/imageViewer',
} as const;

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES];
