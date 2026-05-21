/**
 * Official ION Identity semantics (Heimdall + ion_identity_client).
 *
 * Sources:
 * - https://github.com/ice-blockchain/heimdall
 * - https://github.com/ice-blockchain/ion-framework/tree/master/packages/ion_identity_client
 *
 * NOT in heimdall: KYC Pass, kycPass levels — DEX mock only.
 */

export const OFFICIAL_IDENTITY_REPOS = {
  heimdall: "https://github.com/ice-blockchain/heimdall",
  ionFramework: "https://github.com/ice-blockchain/ion-framework",
  ionIdentityClient:
    "https://github.com/ice-blockchain/ion-framework/tree/master/packages/ion_identity_client",
  identityProduct: "https://identity.io",
} as const;

export const OFFICIAL_IDENTITY_IO_SERVICE = "heimdall-identity-io";

export const OFFICIAL_IDENTITY_API_PATHS = {
  getUser: "/auth/users/{userIdOrMasterKey}",
  verifiedBadge: "/v1/users/{userIdOrMasterKey}/verified-badge",
  socialProfile: "/v1/users/{userIdOrMasterKey}/profiles/social",
  verifyUsername: "/v1/users/verify-username-availability",
} as const;

export const OFFICIAL_HEIMDALL_USER_FIELDS = [
  "id",
  "identity_key_name",
  "master_pubkey",
  "verified",
  "email",
  "phone_number",
  "ion_connect_relays",
] as const;

export const OFFICIAL_SDK_USER_FIELDS = ["id", "username", "orgId"] as const;

export const OFFICIAL_VERIFIED_BADGE_DTAG = "verified";

export const OFFICIAL_VERIFIED_BADGE_NAME = "Verified by ION Identity (identity.io)";

export const OFFICIAL_VERIFIED_BADGE_HTTP = {
  verified: 200,
  notVerified: 204,
} as const;

export const DEX_MOCK_IDENTITY_NOTE =
  "ION DEX kycPass / KYC Pass / ionIdStatus are local-seed until Heimdall verified-badge is wired. No raw KYC storage.";

export const IDENTITY_VS_DNS_NOTE =
  "Heimdall accounts are not .ion DNS; resolve domains via ion node DNS contracts and indexer.";
