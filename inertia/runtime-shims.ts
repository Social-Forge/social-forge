declare global {
  var __VUE_PROD_DEVTOOLS__: boolean | undefined
  var __VUE_OPTIONS_API__: boolean | undefined
  var __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: boolean | undefined
}

// Pinia and parts of the Vue runtime read these as global compile-time flags.
// Defining them here makes SSR safer even if a bundled define gets bypassed.
globalThis.__VUE_PROD_DEVTOOLS__ ??= false
globalThis.__VUE_OPTIONS_API__ ??= true
globalThis.__VUE_PROD_HYDRATION_MISMATCH_DETAILS__ ??= false

export {}
