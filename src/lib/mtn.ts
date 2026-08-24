/**
 * MTN Nigeria — verified corporate office locations.
 *
 * IMPORTANT for internship-seekers:
 * MTN Nigeria does NOT accept walk-in internship requests at retail/service
 * centres (the SIM-swap kiosks and mall stores you'll find in most "MTN
 * office locations" lists online). Those are franchise/dealer-run customer
 * touchpoints, not HR sites. All internship, Industrial Training (SIWES),
 * and Graduate Programme placements go through the official careers portal:
 *
 *   https://www.mtn.ng/career/
 *
 * Programmes to look out for:
 *  - Industrial Training / SIWES placements (undergrad, 6–12 months)
 *  - MTN mPulse Undergraduate Internship (3 months, paid stipend)
 *  - MTN Global Graduate Development Programme (post-NYSC, 2 years)
 *
 * Successful applicants are assigned a work location by HR — typically
 * Lagos HQ for most corporate/tech functions, occasionally a zonal office.
 * The list below is only the verified, real corporate addresses (not
 * retail shops) so you know what "MTN office" legitimately refers to.
 */

export interface MtnOffice {
  name: string;
  address: string;
  city: string;
  state: string;
  type: "Head Office" | "Corporate Office" | "Foundation";
}

export const mtnNigeriaOffices: MtnOffice[] = [
  {
    name: "MTN Nigeria Head Office",
    address: "MTN Plaza, No 1 Awolowo Road, Falomo, Ikoyi",
    city: "Lagos",
    state: "Lagos",
    type: "Head Office",
  },
  {
    name: "MTN Atlantis",
    address: "290B Akin Adesola Street, Victoria Island",
    city: "Lagos",
    state: "Lagos",
    type: "Corporate Office",
  },
  {
    name: "MTN Nigeria Foundation",
    address: "2nd Floor, MTN Plaza, Falomo, Ikoyi",
    city: "Lagos",
    state: "Lagos",
    type: "Foundation",
  },
];