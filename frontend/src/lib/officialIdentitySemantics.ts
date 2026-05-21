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

/**
 * Official ION App env keys (ice-blockchain/flutter-app-secrets + ion-framework AppEnv).
 * ION_ORIGIN is the Heimdall API base URL in production, not only a web CORS origin.
 */
export const OFFICIAL_IDENTITY_ENV_KEYS = {
  baseUrl: "ION_ORIGIN",
  androidClientId: "ION_ANDROID_APP_ID",
  iosClientId: "ION_IOS_APP_ID",
  clientIdHeader: "X-Client-ID",
  secretsRepo: "https://github.com/ice-blockchain/flutter-app-secrets",
  configureScript: "./scripts/configure_env.sh",
} as const;

/** Local heimdall dev defaults from application.yaml (not production). */
export const OFFICIAL_IDENTITY_DEV_DEFAULTS = {
  host: "localhost:8001",
  scheme: "https",
} as const;
