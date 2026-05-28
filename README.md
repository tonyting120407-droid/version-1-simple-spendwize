# SpendWise

SpendWise is a client-side personal finance app with Google sign-in through Firebase Authentication and user-specific data stored in Firestore.

## Firebase configuration

Create a Firebase web app, enable **Authentication > Google** provider, and create a Firestore database. Then provide these values to the app.

For a Vite setup, add these environment variables:

```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

For this static HTML version, you can also set the same values before `app.js` loads by assigning `window.SPENDWISE_FIREBASE_CONFIG` with Firebase's web app config object.

Firestore data is saved under each signed-in user's UID, for example:

- `users/{uid}/transactions`
- `users/{uid}/incomeSources`
- `users/{uid}/fixedBills`
- `users/{uid}/subscriptions`
- `users/{uid}/savingsGoals`
- `users/{uid}/emergencyFundGoals`
- `users/{uid}/otherDeductions`
- `users/{uid}/creditCards`
- `users/{uid}/dashboardSettings/preferences`
