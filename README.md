# Macro 365 Web

A static HTML/CSS/JavaScript macro data dashboard inspired by the Macro365 app. The interface supports English, Simplified Chinese, Traditional Chinese, Japanese, Korean, Spanish, Italian and Arabic, with English as the default.

## Run

Run `node server.js` and open `http://127.0.0.1:4173`. The small built-in Node server serves the static page and locally forwards FRED requests to avoid browser cross-origin restrictions. There are no npm dependencies or database. The global overview and country GDP/CPI history use the public World Bank API.

## FRED key

The United States page uses the Macro365 built-in FRED key by default. Use the `API` button at the top right to save your own key; the input stays masked, and clearing it restores the built-in key. Custom keys are stored in this browser's local storage and sent to the local proxy, which forwards requests to FRED.

To register your own key, use the registration link in the API settings, sign in, open the API Keys page, create a key, then paste and save it. The bundled default key is visible in the client source, so anyone deploying this site publicly should replace it with their own arrangement.
