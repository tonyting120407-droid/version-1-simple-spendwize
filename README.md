# SpendWise

SpendWise is a client-side personal finance app that stores data in the browser with `localStorage`.

## Local development

This repo includes lightweight npm scripts that do not require opening `index.html` directly:

```bash
npm run dev
npm run build
```

`npm run dev` starts a local static server, and `npm run build` copies the static app files into `dist/`.

## Data storage

SpendWise currently stores all app data locally in the browser, including:

- Transactions
- Income sources
- Fixed bills
- Subscriptions
- Savings goals
- Emergency fund goals
- Other deductions
- Credit cards
- Dashboard settings
