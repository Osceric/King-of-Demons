# King of Demons online server (Cloudflare Worker + Durable Object)

What it does
- Serves the game page itself, so the page and the server share one address (needed because a Claude artifact cannot call other servers).
- Online games: the Game Master's browser still runs the game. The server holds each seat's latest turn view and the orders each seat has sent, so nobody pastes turn codes.
- Cloud saves: a save is stored under a secret key you choose, so a game can follow you between PC and iPad.
- Access is by code: one Game Master key and one key per seat. There are no accounts.

First-time setup (Windows, in a Command Prompt or PowerShell)
1. Install Node.js from nodejs.org if `node -v` prints nothing.
2. `cd C:\Users\denni\Documents\KoD\server`
3. `npm install`
4. `npx wrangler login`  (opens your browser; approve it)
5. `npm test`  (should print: all server tests pass)
6. `npm run deploy`  (copies ../index.html into public/, then deploys)
   The last line prints your address, like https://king-of-demons.<your-name>.workers.dev
7. Open that address. The game loads from Cloudflare.

Every time the game changes: `npm run deploy` again (it copies the newest ../index.html first).

Try it locally first: `npm run dev`, then open the address it prints (http://localhost:8787).

API (all under /api/room/<name>/<op>; keys go in ?k=)
- POST init           {seats, names, no}          creates a game; returns the Game Master key and one key per seat
- POST publish        (Game Master) {turn, views[]}   posts the new turn, one view code per seat; clears old orders
- GET  view           (seat key, or Game Master with &s=N)  the seat's latest turn view
- POST orders         (seat key) {turn, code}      sends or replaces this seat's orders for the current turn
- GET  orders         (Game Master)                every seat's orders for the current turn (null if not sent)
- GET  status         (any key)                    the turn, and who has sent orders
- PUT/GET/DELETE save (?k= secret, at least 8 characters)  {blob, info}  a cloud save

Limits: 2 MB per request, 1.5 MB per save, 250 KB per turn view, 2 to 8 human seats.

Game results (added 2.99 work)
- Finished games on the Cloudflare site send a copy of their result to a fixed room named "results".
- To read them you need an admin key. In the Cloudflare dashboard: Workers & Pages > king-of-demons > Settings > Variables and Secrets > Add, type Secret, name ADMIN_KEY, any long random value. It survives deploys.
- Open https://<your address>/test/ (the Test build on Cloudflare), press Maintenance, enter the key, Load results.
