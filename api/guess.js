// Vercel serverless function: proxies the Jr. Swetha / Jr. Ashwin guess
// counters through our own domain. The browser never talks to CounterAPI
// directly -- that avoids CORS entirely (server-to-server calls aren't
// subject to it) and keeps the API token out of public page source.
//
// GET /api/guess            -> { swetha, ashwin } current counts
// GET /api/guess?vote=swetha -> increments that counter, then returns counts

const COUNTER_BASE = "https://api.counterapi.dev/v2/kash-learners-team-5232/";
const COUNTER_TOKEN = "ut_WFGZGUzebas2VZAPYtEdxNNGXewwmPJv3zC7uC5Q";
const COUNTER_NAMES = { swetha: "jr-swetha", ashwin: "jr-ashwin" };

async function getCount(name) {
  try {
    const res = await fetch(COUNTER_BASE + name, {
      headers: { Authorization: "Bearer " + COUNTER_TOKEN },
    });
    if (!res.ok) return 0;
    const json = await res.json();
    if (!json || !json.data) return 0;
    return Math.max(0, (json.data.up_count || 0) - (json.data.down_count || 0));
  } catch (e) {
    return 0;
  }
}

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");

  const vote = req.query && req.query.vote;
  const counterName = vote && COUNTER_NAMES[vote];
  if (counterName) {
    try {
      await fetch(COUNTER_BASE + counterName + "/up", {
        headers: { Authorization: "Bearer " + COUNTER_TOKEN },
      });
    } catch (e) {
      // Ignore -- we still return the current counts below.
    }
  }

  const [swetha, ashwin] = await Promise.all([
    getCount("jr-swetha"),
    getCount("jr-ashwin"),
  ]);

  res.status(200).json({ swetha, ashwin });
};
