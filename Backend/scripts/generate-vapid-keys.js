/**
 * Generate VAPID keys for Web Push notifications
 * Run this once and add the keys to your .env file
 */

import webpush from 'web-push'

const vapidKeys = webpush.generateVAPIDKeys()

console.log('\n=== VAPID Keys Generated ===\n')
console.log('Add these to your .env file:\n')
console.log(`VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`)
console.log(`VAPID_PRIVATE_KEY=${vapidKeys.privateKey}`)
console.log(`VAPID_SUBJECT=mailto:admin@ahpunjab.gov.in`)
console.log('\nPublic key (add to frontend):', vapidKeys.publicKey)
console.log('\n')
