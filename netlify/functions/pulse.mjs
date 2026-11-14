const DOELEN = [
  ["Portaal", "https://boaportaal.nl/", "boaportaal.nl"],
  ["Servicedesk", "https://servicedesk.boaportaal.nl/", "servicedesk.boaportaal.nl"],
  ["Systeem", "https://systeem.boaportaal.nl/", "systeem.boaportaal.nl"],
  ["Mail", "https://mail.boaportaal.nl/", "mail.boaportaal.nl"],
  ["Aanmelden", "https://ofzyqwpztohflxdhqgbb.supabase.co/auth/v1/health", "het accountsysteem"],
];

async function meet(url) {
  const start = Date.now();
  const timer = AbortSignal.timeout(8000);
  try {
    const antwoord = await fetch(url, { signal: timer, redirect: "follow" });
    const ms = Date.now() - start;
    if (antwoord.status >= 500) return { staat: "storing", ms };
    if (ms > 4000) return { staat: "traag", ms };
    return { staat: "werkt", ms };
  } catch {
    return { staat: "storing", ms: Date.now() - start };
  }
}

async function onderhoud() {
  const basis = process.env.URL || "https://status.boaportaal.nl";
  try {
    const antwoord = await fetch(`${basis}/staat.json`, { signal: AbortSignal.timeout(4000) });
    if (!antwoord.ok) return { melding: "", onderhoud: [] };
    const data = await antwoord.json();
    return {
      melding: String(data.melding || ""),
      onderhoud: Array.isArray(data.onderhoud) ? data.onderhoud : [],
    };
  } catch {
    return { melding: "", onderhoud: [] };
  }
}

export default async () => {
  const extra = await onderhoud();
  const nu = Date.now();
  const gepland = new Map();
  for (const item of extra.onderhoud) {
    const tot = item.tot ? Date.parse(item.tot) : Infinity;
    if (!item.dienst || (Number.isFinite(tot) && tot < nu)) continue;
    gepland.set(String(item.dienst), String(item.tekst || "Onderhoud"));
  }
  const diensten = [
    { naam: "Status", staat: "werkt", ms: 0, tekst: "Deze pagina haalt de controle zelf op.", url: "" },
  ];
  for (const [naam, url, leesbaar] of DOELEN) {
    if (gepland.has(naam)) {
      diensten.push({ naam, staat: "onderhoud", ms: 0, tekst: gepland.get(naam), url: leesbaar });
      continue;
    }
    const uit = await meet(url);
    diensten.push({
      naam,
      staat: uit.staat,
      ms: uit.ms,
      tekst: uit.staat === "storing" ? `${leesbaar} antwoordde niet.` : leesbaar,
      url: leesbaar,
    });
  }
  const staten = diensten.map((d) => d.staat);
  const totaal = staten.includes("storing") ? "storing" : staten.includes("onderhoud") ? "onderhoud" : staten.includes("traag") ? "traag" : "werkt";
  return new Response(JSON.stringify({
    moment: new Date().toISOString(),
    totaal,
    melding: extra.melding,
    diensten,
  }), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
};
