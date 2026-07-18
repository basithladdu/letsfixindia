/**
 * Session 24 — grave-issue promotions + statistics tighten.
 * Adds only citable sources; does not invent figures.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => JSON.parse(fs.readFileSync(path.join(root, p), "utf8"));
const write = (p, data) => fs.writeFileSync(path.join(root, p), `${JSON.stringify(data, null, 2)}\n`);

const events = read("data/events.json");
const sources = read("data/sources.json");
const indicators = read("data/indicators.json");
const backlog = read("data/research_backlog.json");

const newSources = {
  hrwKashmirComms2019: {
    title: "India: Restore Kashmir's Internet, Phones",
    publisher: "Human Rights Watch",
    url: "https://www.hrw.org/news/2019/08/28/india-restore-kashmirs-internet-phones",
    type: "Rights report"
  },
  hrwShutdowns2023: {
    title: "No Internet Means No Work, No Pay, No Food: Internet Shutdowns Deny Access to Basic Rights in Digital India",
    publisher: "Human Rights Watch",
    url: "https://www.hrw.org/report/2023/06/14/no-internet-means-no-work-no-pay-no-food/internet-shutdowns-deny-access-basic",
    type: "Rights report"
  },
  scAyodhya2019: {
    title: "M Siddiq (D) Thr Lrs v. Mahant Suresh Das & Ors — Ayodhya title suit judgment (9 November 2019)",
    publisher: "Supreme Court of India (Digital SCR)",
    url: "https://digiscr.sci.gov.in/view_judgment?id=MjE3MjA=",
    type: "Court coverage"
  },
  ieAyodhya2019: {
    title: "Ayodhya Verdict: Full Text",
    publisher: "The Indian Express",
    url: "https://indianexpress.com/article/india/ayodhya-verdict-full-text-supreme-court-6111349/",
    type: "News report"
  },
  prsTripleTalaq2019: {
    title: "The Muslim Women (Protection of Rights on Marriage) Bill, 2019",
    publisher: "PRS Legislative Research",
    url: "https://prsindia.org/billtrack/the-muslim-women-protection-of-rights-on-marriage-bill-2019",
    type: "Official report"
  },
  pibTripleTalaq2019: {
    title: "The Muslim Women (Protection of Rights on Marriage) Act, 2019 — Factsheet",
    publisher: "Press Information Bureau",
    url: "https://www.pib.gov.in/FactsheetDetails.aspx?Id=148565",
    type: "Official release"
  },
  hinduGalwan2020: {
    title: "Indian Army says 20 soldiers killed in clash with Chinese troops in the Galwan area",
    publisher: "The Hindu",
    url: "https://www.thehindu.com/news/national/indian-army-says-20-soldiers-killed-in-clash-with-chinese-troops-in-the-galwan-area/article61668218.ece",
    type: "News report"
  },
  reutersGalwan2020: {
    title: "India, China troops clash at Himalayan border, casualties on both sides",
    publisher: "Reuters",
    url: "https://www.reuters.com/article/world/india-china-troops-clash-at-himalayan-border-casualties-on-both-sides-idUSKBN23N0ZC/",
    type: "News wire"
  },
  hrwCowVigilantesNews2019: {
    title: "India: Vigilante 'Cow Protection' Groups Attack Minorities",
    publisher: "Human Rights Watch",
    url: "https://www.hrw.org/news/2019/02/19/india-vigilante-cow-protection-groups-attack-minorities",
    type: "Rights report"
  },
  hrwKashmirRights2019: {
    title: "India: Ensure Rights Protections in Kashmir",
    publisher: "Human Rights Watch",
    url: "https://www.hrw.org/news/2019/08/19/india-ensure-rights-protections-kashmir",
    type: "Rights report"
  }
};

for (const [id, source] of Object.entries(newSources)) {
  if (sources[id]) throw new Error(`Source already exists: ${id}`);
  sources[id] = source;
}

function upsertEvent(event) {
  const idx = events.findIndex((e) => e.id === event.id);
  if (idx >= 0) events[idx] = { ...events[idx], ...event };
  else events.push(event);
}

function patchEvent(id, patch) {
  const idx = events.findIndex((e) => e.id === id);
  if (idx < 0) throw new Error(`Missing event ${id}`);
  const current = events[idx];
  const next = { ...current, ...patch };
  if (patch.sources) {
    next.sources = Array.from(new Set([...(current.sources || []), ...patch.sources]));
  }
  events[idx] = next;
}

// --- Strengthen existing grave entries ---
patchEvent("article-370-2019", {
  summary:
    "The government revoked Jammu and Kashmir's special status, split the state into union territories, imposed a heavy security lockdown, restricted movement, and cut communications. HRW documented the communications blackout and preventive detentions that followed the 5 August 2019 decision.",
  outcome:
    "The decision reshaped federalism and civil-liberties debate in India. Communications restrictions and detentions became a separate rights record alongside the constitutional change.",
  sources: ["hrwKashmirComms2019", "hrwKashmirRights2019", "hrwShutdowns2023"]
});

patchEvent("anti-caa-crackdown-2019", {
  sources: ["hrwCaaReport"],
  outcome:
    "The crackdown became a major evidence point for excessive force, internet shutdowns, and criminalization of dissent around the Citizenship Amendment Act protests."
});

patchEvent("caa-2019", {
  sources: ["hrwCaaReport"]
});

patchEvent("delhi-riots-2020-expanded", {
  sources: ["hrw2026"],
  outcome:
    "More than 1,900 FIRs were filed. Critics documented that UAPA and related charges were disproportionately applied to activists and journalists. HRW later noted that Umar Khalid, Sharjeel Imam, Gulfisha Fatima, and others remained jailed for years without trial in related cases."
});

patchEvent("junaid-khan-2017", {
  sources: ["hrwCowVigilantes2019", "hrwCowVigilantesNews2019"]
});

patchEvent("dadri-2015", {
  sources: ["hrwCowVigilantes2019", "hrwCowVigilantesNews2019"],
  outcome:
    "HRW later placed Dadri within a wider cow-vigilante pattern. The political response around the case sharpened national debate on majoritarian mobilization and impunity."
});

patchEvent("una-2016", {
  sources: ["hrwCowVigilantes2019", "hrwCowVigilantesNews2019"]
});

patchEvent("pehlu-khan-2017", {
  sources: ["hrwCowVigilantesNews2019"]
});

patchEvent("tabrez-ansari-2019", {
  sources: ["hrwCowVigilantes2019"]
});

patchEvent("nuh-2023", {
  sources: ["hrwBulldozers2022", "hrw2026"],
  outcome:
    "The episode became part of the broader national record on vigilante mobilization and administrative punishment, including demolition drives criticized as punitive."
});

patchEvent("bulldozer-demolitions-2022", {
  sources: ["hrw2026"]
});

patchEvent("greenpeace-2015", {
  sources: ["hrw2026"],
  outcome:
    "The action became an early marker in the decade-long conflict between the state and civil society organizations using FCRA restrictions, later cited by HRW as part of a wider toolkit against activists and NGOs."
});

patchEvent("expulsions-2025", {
  summary:
    "HRW reported that authorities expelled hundreds of Bengali-speaking Muslims and Rohingya refugees to Bangladesh without due process, including some Indian citizens. The same chapter recorded Assam demolition drives in July–August that displaced more than 5,000 families, majority Bengali-speaking Muslims, and a fatal shooting in Goalpara during eviction clashes.",
  outcome:
    "Bangladesh authorities reported more than 1,500 men, women, and children expelled in May and June. Assam demolitions and Goalpara killing sit in the same HRW 2026 rights record as the cross-border expulsions.",
  sources: ["hrw2026"]
});

patchEvent("press-rank-2024", {
  summary:
    "RSF ranked India 159 out of 180 in the 2024 World Press Freedom Index, reflecting concerns over violence against journalists, media ownership concentration, and political pressure.",
  outcome:
    "The 2024 rank of 159 sits between the 2014 rank of 140 and later ranks of 151 (2025) and 157 (2026) in the site's RSF indicator series. Methodology changes mean year-to-year ranks should be read carefully."
});

// Archive thinner bulldozer duplicate; keep the HRW-specific demolitions record.
patchEvent("bulldozer-2022", {
  archived: true,
  outcome:
    "Superseded on the live timeline by bulldozer-demolitions-2022, which carries the dedicated HRW demolitions reporting for Jahangirpuri, Khargone, Prayagraj, and related drives. Kept archived for record continuity."
});

// --- New grave promotions ---
upsertEvent({
  id: "kashmir-comms-blackout-2019",
  year: 2019,
  date: "5 August 2019 onward",
  title: "Jammu and Kashmir communications blackout after Article 370",
  category: "Civil liberties",
  actors: ["BJP-led government", "State institution", "Security forces"],
  status: "Reported",
  severity: "Severe",
  summary:
    "After the Article 370 decision, authorities shut down internet, mobile networks, and for a period landlines across much of Jammu and Kashmir, alongside movement restrictions and preventive detentions. HRW described the blackout as disproportionate and harmful to medical care, livelihoods, and information access.",
  outcome:
    "HRW's later shutdown report stated the August 2019 internet shutdown lasted 213 days into March 2020, with mobile 4G access restricted for 550 days. The episode remains one of the longest communications blackouts documented in India.",
  sources: ["hrwKashmirComms2019", "hrwKashmirRights2019", "hrwShutdowns2023", "sflcShutdowns"]
});

upsertEvent({
  id: "shaheen-bagh-2019-2020",
  year: 2019,
  date: "December 2019 – March 2020",
  title: "Shaheen Bagh sit-in against CAA and NRC fears",
  category: "Protest",
  actors: ["BJP-led government", "State institution"],
  status: "Reported",
  severity: "High",
  summary:
    "A prolonged women-led sit-in at Shaheen Bagh in Delhi became the most visible sustained protest against the Citizenship Amendment Act and linked fears of a nationwide NRC. HRW's CAA reporting documented the discriminatory structure of the law and the repression that surrounded the protest wave.",
  outcome:
    "The sit-in ended amid the COVID-19 lockdown. It remains a public-record marker of mass constitutional protest and of the policing and political backlash that followed anti-CAA mobilization.",
  sources: ["hrwCaaReport", "hrwCaaDeadlyForce"]
});

upsertEvent({
  id: "ayodhya-sc-verdict-2019",
  year: 2019,
  date: "9 November 2019",
  title: "Supreme Court Ayodhya title verdict awards disputed site for temple",
  category: "Institutional integrity",
  actors: ["State institution", "BJP-linked", "Hindutva-linked"],
  status: "Court-tested",
  severity: "High",
  summary:
    "A five-judge Supreme Court bench delivered the Ayodhya title judgment, awarding the disputed site for a Ram temple while directing alternate land for a mosque. The judgment closed the long-running title litigation after the 1992 Babri Masjid demolition.",
  outcome:
    "The verdict was a court order, not a parliamentary statute. It remained politically central to Hindutva mobilization and to later consecration politics, while critics treated the communal aftermath as part of the majoritarian public record.",
  sources: ["scAyodhya2019", "ieAyodhya2019"]
});

upsertEvent({
  id: "triple-talaq-act-2019",
  year: 2019,
  date: "31 July 2019",
  title: "Muslim Women (Protection of Rights on Marriage) Act criminalises instant triple talaq",
  category: "Civil liberties",
  actors: ["BJP-led government", "State institution"],
  status: "Official",
  severity: "High",
  summary:
    "Parliament enacted the Muslim Women (Protection of Rights on Marriage) Act, 2019, declaring instant triple talaq void and illegal and making pronouncement a cognizable offence punishable by up to three years' imprisonment, with subsistence and custody provisions for affected women.",
  outcome:
    "The government presented the Act as women's-rights reform after Supreme Court scrutiny of talaq-e-biddat. Critics argued criminalisation of a personal-law practice raised due-process and minority-rights concerns even while opposing instant triple talaq itself.",
  sources: ["prsTripleTalaq2019", "pibTripleTalaq2019"]
});

upsertEvent({
  id: "galwan-2020",
  year: 2020,
  date: "15–16 June 2020",
  title: "Galwan Valley clash kills 20 Indian soldiers on LAC with China",
  category: "Security and terror",
  actors: ["State institution", "Security forces", "BJP-led government"],
  status: "Official",
  severity: "Severe",
  summary:
    "Indian Army statements confirmed 20 Indian soldiers killed in a violent face-off with Chinese troops in the Galwan Valley during a supposed de-escalation along the Line of Actual Control. Reporting described hand-to-hand fighting without firearms.",
  outcome:
    "The clash was the deadliest India-China border confrontation in decades and reshaped domestic security politics, military posture in Ladakh, and later commemorative politics. Chinese casualty figures were disclosed much later and remain contested in Indian assessments.",
  sources: ["hinduGalwan2020", "reutersGalwan2020"]
});

upsertEvent({
  id: "cow-vigilante-killings-2015-2018",
  year: 2019,
  date: "HRW tally covering May 2015 – December 2018",
  title: "HRW: at least 44 killed in cow-vigilante attacks",
  category: "Communal violence",
  actors: ["Hindutva-linked", "BJP-linked", "State institution"],
  status: "Reported",
  severity: "Severe",
  summary:
    "Human Rights Watch reported that between May 2015 and December 2018 at least 44 people were killed in cow-protection vigilante attacks across multiple states, including 36 Muslims, with around 280 people injured in over 100 incidents. The report documented police stalling, victim-blaming, and political rhetoric that accompanied the violence.",
  outcome:
    "The tally aggregates cases also represented individually on this timeline (Dadri, Pehlu Khan, Junaid Khan, and related attacks). It remains the clearest rights-group quantitative marker for the cow-vigilante wave after 2014.",
  sources: ["hrwCowVigilantes2019", "hrwCowVigilantesNews2019"]
});

upsertEvent({
  id: "delhi-riots-accused-prolonged-detention",
  year: 2025,
  date: "Noted in HRW World Report 2026 (covering 2025)",
  title: "Delhi riots accused remain jailed for years without trial",
  category: "Civil liberties",
  actors: ["State institution", "BJP-led government", "Security forces"],
  status: "Reported",
  severity: "Severe",
  summary:
    "HRW reported that the Delhi High Court refused bail to Umar Khalid, Sharjeel Imam, Gulfisha Fatima, and six others who had spent over five years in prison without trial in cases linked to the 2020 Delhi violence after anti-CAA protests.",
  outcome:
    "The prolonged pre-trial detention became a leading example of how UAPA and related process can silence dissenters long before any conviction. It sits beside the Delhi riots death toll as a separate due-process record.",
  sources: ["hrw2026", "hrwDelhi2020"]
});

upsertEvent({
  id: "internet-shutdowns-digital-india-2019-2023",
  year: 2023,
  date: "HRW report 14 June 2023 (pattern since 2014)",
  title: "HRW documents internet shutdowns as rights deprivation in Digital India",
  category: "Civil liberties",
  actors: ["BJP-led government", "State institution"],
  status: "Reported",
  severity: "High",
  summary:
    "HRW's 2023 report documented how central and state authorities used internet and communications shutdowns to deny access to work, pay, food, education, and emergency information, with Kashmir's post-2019 blackout as the extreme case and India repeatedly ranking among the world's heaviest users of shutdowns.",
  outcome:
    "The report complements SFLC tracker counts in the statistics section. It treats shutdowns as a governance tool with measurable human costs, not only as temporary security measures.",
  sources: ["hrwShutdowns2023", "sflcShutdowns", "hrwKashmirComms2019"]
});

// --- Indicators ---
const byTitle = (title) => {
  const idx = indicators.findIndex((i) => i.title === title);
  if (idx < 0) throw new Error(`Missing indicator ${title}`);
  return idx;
};

indicators[byTitle("Press freedom rank")] = {
  ...indicators[byTitle("Press freedom rank")],
  detail:
    "India ranked 140 in RSF's 2014 index, 159 in 2024, 151 in 2025, and 157 in 2026. RSF scores fell from 59.66 (2014) to 31.96 (2026), but methodology changes mean ranks and scores should be read carefully rather than as a single unbroken series.",
  chart: [
    { label: "2014", value: 140 },
    { label: "2024", value: 159 },
    { label: "2025", value: 151 },
    { label: "2026", value: 157 }
  ]
};

indicators[byTitle("Freedom House status")] = {
  ...indicators[byTitle("Freedom House status")],
  detail:
    "Freedom House assessed India as Free in Freedom in the World 2014 (Political Rights 2, Civil Liberties 3 on the old 1–7 scale) and Partly Free with a 62/100 aggregate score in 2026. The rating systems are not directly numeric-comparable; the status change is the comparable claim.",
  chart: [
    { label: "2014 PR", value: 2 },
    { label: "2014 CL", value: 3 },
    { label: "2026 score", value: 62 }
  ]
};

indicators[byTitle("Internet shutdowns")] = {
  ...indicators[byTitle("Internet shutdowns")],
  detail:
    "SFLC's India shutdown tracker lists 6 shutdowns in 2014 and 54 in 2025, with 2026 still incomplete at 21 YTD in the captured research note. HRW separately documented the human-cost pattern, including Kashmir's 213-day internet blackout after August 2019.",
  sources: ["sflcShutdowns", "hrwShutdowns2023"]
};

indicators[byTitle("Internet users")] = {
  ...indicators[byTitle("Internet users")],
  detail:
    "World Bank data shows individuals using the internet rising from 16.5% in 2016 to 70.0% in 2025. Higher connectivity coexists with rising shutdown counts; the two series measure different things and should not be collapsed into a single 'digital freedom' claim."
};

indicators[byTitle("World Happiness Report rank")] = {
  ...indicators[byTitle("World Happiness Report rank")],
  detail:
    "India ranked 126th of 143 countries in the 2024 World Happiness Report and 118th of 147 in the 2025 report. The rank improved, but the country count and report year changed, so this is not a direct measure of government-caused happiness change."
};

// Add cow-vigilante deaths indicator (HRW documented tally)
if (!indicators.some((i) => i.title === "Cow-vigilante killings (HRW tally)")) {
  indicators.push({
    title: "Cow-vigilante killings (HRW tally)",
    value: "44 killed (36 Muslim)",
    detail:
      "HRW counted at least 44 people killed in cow-protection vigilante attacks from May 2015 to December 2018, including 36 Muslims, with about 280 injured across more than 100 incidents. This is a rights-group tally for a defined window, not an official NCRB series.",
    direction: "Severe rights harm",
    sources: ["hrwCowVigilantes2019", "hrwCowVigilantesNews2019"],
    chart: [
      { label: "Killed", value: 44 },
      { label: "Muslim victims", value: 36 },
      { label: "Injured ~", value: 280 }
    ]
  });
}

if (!indicators.some((i) => i.title === "Kashmir internet blackout days")) {
  indicators.push({
    title: "Kashmir internet blackout days",
    value: "213 days (internet) / 550 days (4G curb)",
    detail:
      "HRW reported that the Jammu and Kashmir internet shutdown beginning August 2019 lasted 213 days until March 2020, while mobile 4G access remained restricted for 550 days. These are duration measures for one extreme episode, not annual nationwide shutdown counts.",
    direction: "Severe rights harm",
    sources: ["hrwShutdowns2023", "hrwKashmirComms2019"],
    chart: [
      { label: "Internet days", value: 213 },
      { label: "4G curb days", value: 550 }
    ]
  });
}

// GDP caveat tighten
indicators[byTitle("GDP per capita")] = {
  ...indicators[byTitle("GDP per capita")],
  detail:
    "World Bank current-dollar GDP per capita rose from $1,553.9 in 2014 to $2,702.5 in 2025. This is a real income-level improvement on that series, though current-dollar values move with exchange rates and inflation and do not by themselves measure distributional fairness or democratic quality."
};

indicators[byTitle("Unemployment rate")] = {
  ...indicators[byTitle("Unemployment rate")],
  detail:
    "PLFS usual-status unemployment fell from 6.0% in 2017-18 to 3.1% in 2025 on the cited PIB releases. Treat the comparison carefully: PLFS sampling and definitions differ from older employment measures, and a lower unemployment rate is not the same as secure formal work."
};

// --- Backlog updates ---
for (const item of backlog) {
  if (item.id === "shaheen-bagh-protest") {
    item.status = "promoted_or_covered";
    item.nextStep = "Promoted as shaheen-bagh-2019-2020 with hrwCaaReport and hrwCaaDeadlyForce.";
    item.sourceKeys = ["hrwCaaReport", "hrwCaaDeadlyForce"];
  }
  if (item.id === "2019-jamia-millia-islamia-attack") {
    item.status = "covered_via_related";
    item.nextStep =
      "Not promoted as a standalone stub; deadly-force pattern covered by anti-caa-crackdown-2019 (hrwCaaDeadlyForce). Jamia-specific primary source still open if a dedicated entry is wanted.";
  }
  if (item.id === "godi-media") {
    item.nextStep =
      "Still a category lead, not a single event. Press-freedom indicators + BBC raid, NewsClick, X blocks, and RSF ranks cover the evidence base.";
  }
  if (item.id === "2025-indian-electoral-controversy") {
    item.nextStep =
      "Still needs case-specific primary sources beyond Wikipedia before promotion. Do not promote on Wikipedia alone.";
  }
}

write("data/sources.json", sources);
write("data/events.json", events);
write("data/indicators.json", indicators);
write("data/research_backlog.json", backlog);

console.log(
  JSON.stringify(
    {
      events: events.length,
      active: events.filter((e) => !e.archived).length,
      archived: events.filter((e) => e.archived).length,
      sources: Object.keys(sources).length,
      indicators: indicators.length,
      newEventIds: [
        "kashmir-comms-blackout-2019",
        "shaheen-bagh-2019-2020",
        "ayodhya-sc-verdict-2019",
        "triple-talaq-act-2019",
        "galwan-2020",
        "cow-vigilante-killings-2015-2018",
        "delhi-riots-accused-prolonged-detention",
        "internet-shutdowns-digital-india-2019-2023"
      ]
    },
    null,
    2
  )
);
