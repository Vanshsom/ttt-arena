/**
 * ═══════════════════════════════════════════════════════════════
 *  TTT ARENA — firebase-config.js
 *  Online Friend Mode configuration
 * ═══════════════════════════════════════════════════════════════
 *
 *  ✅ STATUS: Not configured (placeholder values below)
 *
 *  HOW TO ENABLE ONLINE FRIEND MODE — STEP BY STEP:
 *  ─────────────────────────────────────────────────
 *
 *  STEP 1 — Create a Firebase project
 *    • Go to: https://console.firebase.google.com
 *    • Click "Add project" → Give it a name → Continue
 *    • Disable Google Analytics if not needed → Create project
 *
 *  STEP 2 — Create a Realtime Database
 *    • In your project, go to Build → Realtime Database
 *    • Click "Create Database"
 *    • Choose a region (e.g. Asia Southeast 1)
 *    • Set production rules (supporting indexed username/friendCode discovery):
 *        {
 *          "rules": {
 *            "usernames": {
 *              ".read": true,
 *              "$username": { ".write": "auth != null && (!data.exists() || data.val() == auth.uid)" }
 *            },
 *            "friendCodes": {
 *              ".read": true,
 *              "$code": { ".write": "auth != null && (!data.exists() || data.val() == auth.uid)" }
 *            },
 *            "players": {
 *              ".read": true,
 *              "$uid": { ".write": "auth != null && auth.uid == $uid" }
 *            },
 *            "ttt_rooms": { ".read": true, ".write": "auth != null" },
 *            "invites": { ".read": "auth != null", ".write": "auth != null" },
 *            "friends": {
 *              "$uid": {
 *                ".read": "auth != null && auth.uid == $uid",
 *                "$friendUid": { ".write": "auth != null && (auth.uid == $uid || auth.uid == $friendUid)" }
 *              }
 *            },
 *            "friendRequests": { ".read": "auth != null", ".write": "auth != null" },
 *            "outgoingRequests": { ".read": "auth != null", ".write": "auth != null" }
 *          }
 *        }
 *
 *  STEP 3 — Register a Web App
 *    • In Project Overview, click the </> (Web) icon
 *    • App nickname: "TTT Arena" → Register app
 *    • Copy the firebaseConfig object shown
 *
 *  STEP 4 — Paste your values below
 *    • Replace each "YOUR_..." string with the real values
 *    • Save this file — Online mode activates automatically
 *
 *  STEP 5 — Done!
 *    • Open the app, go to Online Friend Mode
 *    • Player 1 creates a room → shares the 6-character code
 *    • Player 2 enters the code → game begins!
 *
 *  ─────────────────────────────────────────────────────────────
 *  ℹ️  While Firebase is NOT configured:
 *    • Local PvP works 100% offline — no changes needed
 *    • AI Mode works 100% offline — no changes needed
 *    • Online Mode shows a friendly setup message (no crash)
 *  ─────────────────────────────────────────────────────────────
 */

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyDLWTLR3jnkYg7Z9DacP1QqzUt8dg5OCyQ",
  authDomain: "ttt-arena.firebaseapp.com",
  databaseURL: "https://ttt-arena-default-rtdb.asia-southeast1.firebasedatabase.app/",
  projectId: "ttt-arena",
  storageBucket: "ttt-arena.firebasestorage.app",
  messagingSenderId: "216759652786",
  appId: "1:216759652786:web:66e3e0751e334b7cb794ab"
};
