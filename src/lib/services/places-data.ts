/**
 * Common Bangalore Tech Hubs and Transit Points
 * Provides instant, zero-latency autocomplete with precise coordinates and Place IDs,
 * while seamlessly supporting custom live queries.
 */
export interface PlaceSuggestion {
  placeId: string;
  primaryText: string;
  secondaryText: string;
  lat: number;
  lng: number;
}

export const BANGALORE_HUBS: PlaceSuggestion[] = [
  {
    placeId: 'blr_manyata_01',
    primaryText: 'Manyata Tech Park',
    secondaryText: 'Nagavara, Outer Ring Road, Bangalore',
    lat: 13.0500,
    lng: 77.6200,
  },
  {
    placeId: 'blr_ecospace_02',
    primaryText: 'EcoSpace / EcoWorld Business Park',
    secondaryText: 'Bellandur, Outer Ring Road, Bangalore',
    lat: 12.9260,
    lng: 77.6762,
  },
  {
    placeId: 'blr_prestige_tech_03',
    primaryText: 'Prestige Tech Park (Cessna / JP Morgan)',
    secondaryText: 'Kadubeesanahalli, Marathahalli-Sarjapur ORR, Bangalore',
    lat: 12.9360,
    lng: 77.6910,
  },
  {
    placeId: 'blr_bagmane_tech_04',
    primaryText: 'Bagmane Tech Park',
    secondaryText: 'CV Raman Nagar, Byrasandra, Bangalore',
    lat: 12.9800,
    lng: 77.6600,
  },
  {
    placeId: 'blr_bagmane_constellation_05',
    primaryText: 'Bagmane Constellation Business Park',
    secondaryText: 'K R Puram / Doddanekundi, Bangalore',
    lat: 12.9890,
    lng: 77.7010,
  },
  {
    placeId: 'blr_itpl_whitefield_06',
    primaryText: 'ITPL / International Tech Park',
    secondaryText: 'Whitefield Main Road, Bangalore',
    lat: 12.9856,
    lng: 77.7314,
  },
  {
    placeId: 'blr_electronic_city_ph1_07',
    primaryText: 'Electronic City Phase 1 (Infosys / Wipro / HP)',
    secondaryText: 'Hosur Road, Bangalore',
    lat: 12.8452,
    lng: 77.6602,
  },
  {
    placeId: 'blr_electronic_city_ph2_08',
    primaryText: 'Electronic City Phase 2 (TCS / Tech Mahindra)',
    secondaryText: 'Hosur Road, Bangalore',
    lat: 12.8390,
    lng: 77.6770,
  },
  {
    placeId: 'blr_global_tech_village_09',
    primaryText: 'Global Village Tech Park',
    secondaryText: 'Mylasandra, Mysore Road / RR Nagar, Bangalore',
    lat: 12.9150,
    lng: 77.5020,
  },
  {
    placeId: 'blr_embassy_golf_links_10',
    primaryText: 'Embassy Golf Links (EGL)',
    secondaryText: 'Challaghatta, Off Intermediate Ring Road, Domlur, Bangalore',
    lat: 12.9520,
    lng: 77.6480,
  },
  {
    placeId: 'blr_rmz_infinity_11',
    primaryText: 'RMZ Infinity (Google / Bennigana Halli)',
    secondaryText: 'Old Madras Road, Bangalore',
    lat: 12.9930,
    lng: 77.6610,
  },
  {
    placeId: 'blr_hosa_road_12',
    primaryText: 'Mahaveer Ranches Main Clubhouse Gate',
    secondaryText: 'Hosa Road, Off Hosur Road, Bangalore',
    lat: 12.8715,
    lng: 77.6534,
  },
];
