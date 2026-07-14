export interface Place {
  id: string;
  name: string;
  address: string;
  distance: string;
  lat: string;
  lon: string;
}

export const NEARBY_PLACES: Place[] = [
  { id: '1', name: '5/127, Block 17', address: 'Block 5, Subhash Nagar, Delhi', distance: '34 km', lat: '28.6421', lon: '77.1156' },
  { id: '2', name: 'Gurgaon Railway Station Parking', address: 'Kheri, Ashok Vihar, Sector 3, Gurugram, Haryana', distance: '16 km', lat: '28.4595', lon: '77.0266' },
  { id: '3', name: 'Jagannath Community College (JCC)', address: 'Community Center, Plot No. 2 & 3, Sector 3, Rohini', distance: '43 km', lat: '28.7041', lon: '77.1025' },
  { id: '4', name: 'Centrum Plaza', address: 'Golf Course Rd, near ILM Institute, Sector 53', distance: '3.3 km', lat: '28.4437', lon: '77.1028' },
  { id: '5', name: 'Huda City Centre Metro', address: 'Huda City Centre, Sector 29, New Delhi', distance: '7.5 km', lat: '28.4594', lon: '77.0724' },
  { id: '6', name: 'Netaji Subhash Place Metro Station', address: 'Ring Rd, Near D Mall, Netaji Subhash Place', distance: '42 km', lat: '28.6969', lon: '77.1537' },
];
