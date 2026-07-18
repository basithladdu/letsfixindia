import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const dataDir = path.join(root, "data");

function readJson(name) {
  return JSON.parse(fs.readFileSync(path.join(dataDir, name), "utf8"));
}

function writeJson(name, value) {
  fs.writeFileSync(path.join(dataDir, name), `${JSON.stringify(value, null, 2)}\n`);
}

const sourceUpdates = {
  hrwGujarat2002: {
    title: "We Have No Orders To Save You: Gujarat 2002",
    publisher: "Human Rights Watch",
    url: "https://www.hrw.org/reports/2002/india/",
    type: "Rights report"
  },
  scGujarat2022: {
    title: "Supreme Court dismisses Zakia Jafri plea against SIT clean chit",
    publisher: "Indian Express",
    url: "https://indianexpress.com/article/india/2002-gujarat-riots-sc-dismisses-zakia-jafri-plea-sit-clean-chit-modi-7987962/",
    type: "Court reporting"
  },
  hrwDelhi2020: {
    title: "India's Police Found Complicit in Anti-Muslim Mob Violence",
    publisher: "Human Rights Watch",
    url: "https://www.hrw.org/news/2020/07/17/indias-police-found-complicit-anti-muslim-mob-violence",
    type: "Rights report"
  },
  ieHathras2020: {
    title: "UP Police out in full force to cremate Hathras woman, away from family",
    publisher: "Indian Express",
    url: "https://indianexpress.com/article/india/hathras-rape-victim-cremation-up-police-6638470/",
    type: "News report"
  },
  aljFarmers2020: {
    title: "India farmers brave tear gas as they protest against new laws",
    publisher: "Al Jazeera",
    url: "https://www.aljazeera.com/news/2020/11/26/india-farmers-march-to-delhi-against-new-laws",
    type: "News report"
  },
  hrwPegasus2021: {
    title: "India: Spyware Use Violates Supreme Court Privacy Ruling",
    publisher: "Human Rights Watch",
    url: "https://www.hrw.org/news/2021/08/26/india-spyware-use-violates-supreme-court-privacy-ruling",
    type: "Rights report"
  },
  amnestyPegasus2021: {
    title: "The Pegasus Project",
    publisher: "Amnesty International",
    url: "https://www.amnesty.org/en/latest/press-release/2021/07/the-pegasus-project/",
    type: "Investigation"
  },
  ieMorbi2022: {
    title: "Morbi bridge collapse killed 135; reopened without fitness certificate",
    publisher: "Indian Express",
    url: "https://indianexpress.com/article/cities/ahmedabad/morbi-municipality-chief-officer-suspended-bridge-collapse-8248804/",
    type: "News report"
  },
  ieMorbiSIT2023: {
    title: "Corroded wires and welded suspenders behind Morbi bridge tragedy",
    publisher: "Indian Express",
    url: "https://indianexpress.com/article/cities/ahmedabad/morbi-bridge-tragedy-sit-in-preliminary-probe-8455322/",
    type: "Investigation report coverage"
  },
  ieAnkita2022: {
    title: "Uttarakhand ex-minister's son held for killing 19-year-old",
    publisher: "Indian Express",
    url: "https://indianexpress.com/article/india/uttarakhand-bjp-leader-son-arrested-killing-receptionist-8169132/",
    type: "News report"
  },
  ieAnkitaConviction2025: {
    title: "Ankita Bhandari murder case: life term for son of ex-BJP leader",
    publisher: "Indian Express",
    url: "https://indianexpress.com/article/india/ankita-bhandari-murder-case-life-term-for-son-of-ex-bjp-leader-2-others-10039525/",
    type: "Court reporting"
  },
  ieEd2024: {
    title: "95 percent of ED cases against politicians since 2014 targeted opposition leaders",
    publisher: "Indian Express",
    url: "https://indianexpress.com/article/political-pulse/kejriwal-arrest-bjp-liquor-policy-case-modi-9227288/",
    type: "Investigative analysis"
  },
  edStats2026: {
    title: "Directorate of Enforcement statistics up to 31 March 2026",
    publisher: "Directorate of Enforcement",
    url: "https://enforcementdirectorate.gov.in/performance/statistics/",
    type: "Official data"
  },
  hrwBbcRaid2023: {
    title: "Tax Authorities Raid BBC Offices in India",
    publisher: "Human Rights Watch",
    url: "https://www.hrw.org/news/2023/02/14/tax-authorities-raid-bbc-offices-india",
    type: "Rights report"
  },
  amnestyNewsClick2023: {
    title: "NewsClick arrests and raids signal attack on media critical of government",
    publisher: "Amnesty International",
    url: "https://www.amnesty.org/en/latest/news/2023/10/india-arrests-and-raids-at-newsclick-signals-attack-on-media-critical-of-the-government/",
    type: "Rights report"
  },
  reutersBalasore2023: {
    title: "India's worst train crash in decades kills at least 288",
    publisher: "Reuters via Investing.com",
    url: "https://www.investing.com/news/stock-market-news/indian-train-crash-death-toll-jumps-to-233-900-injured-3097458",
    type: "News wire"
  },
  reutersSilkyara2023: {
    title: "All 41 workers rescued from collapsed Himalayan tunnel",
    publisher: "Reuters via ThePrint",
    url: "https://theprint.in/india/india-jubilant-as-all-trapped-workers-rescued-from-himalayan-tunnel/1863005/",
    type: "News wire"
  },
  reutersTunnelAudit2023: {
    title: "India orders safety audit of tunnels after collapse in Himalayas",
    publisher: "Reuters via Investing.com",
    url: "https://www.investing.com/news/world-news/india-orders-safety-audit-of-tunnels-after-collapse-in-himalayas-3241264",
    type: "News wire"
  },
  ieBilkis2024: {
    title: "Supreme Court quashes remission granted to Bilkis Bano convicts",
    publisher: "Indian Express",
    url: "https://indianexpress.com/article/india/bilkis-bano-case-supreme-court-quashes-remission-granted-to-11-convicts-10-points-9099709/",
    type: "Court reporting"
  },
  reutersSebi2024: {
    title: "Hindenburg alleges India market regulator chief held stake in offshore funds used by Adani Group",
    publisher: "Reuters via Investing.com",
    url: "https://www.investing.com/news/stock-market-news/hindenburg-research-alleges-india-market-regulator-chief-held-investments-in-offshore-funds-used-by-adani-group-3565523",
    type: "News wire"
  },
  reutersRupee2026: {
    title: "Rupee hits record low of 96.18 vs USD as rising yields add to oil shock",
    publisher: "Reuters via Economic Times",
    url: "https://economictimes.indiatimes.com/markets/forex/rupee-hits-record-low-of-96-18-vs-usd-as-rising-yields-add-to-oil-shock/articleshow/131165837.cms",
    type: "News wire"
  },
  reutersInflation2026: {
    title: "India's inflation breaches target after more than a year",
    publisher: "Reuters via Investing.com",
    url: "https://www.investing.com/news/economy-news/indias-june-retail-inflation-at-438-on-year-4787882",
    type: "News wire"
  },
  congress44Claim2026: {
    title: "44 BJP MPs, MLAs face serious sexual offence charges",
    publisher: "Indian National Congress",
    url: "https://www.inc.in/voice-of-the-nation/congress-sandesh/44-bjp-mps-mlas-face-serious-sexual-offence-charges",
    type: "Opposition claim"
  },
  rgKarHrw2026: {
    title: "World Report 2026: India, women and girls' rights section",
    publisher: "Human Rights Watch",
    url: "https://www.hrw.org/world-report/2026/country-chapters/india",
    type: "Rights report"
  }
};

const newEvents = [
  {
    id: "gujarat-2002-prelude",
    year: 2002,
    date: "27 February-March 2002",
    title: "Gujarat communal violence and state-complicity allegations",
    category: "Prelude",
    actors: ["BJP-linked", "State institution", "Hindutva-linked"],
    status: "Court-tested and contested",
    severity: "Severe",
    summary: "Before the prime-ministerial period, Narendra Modi was Gujarat chief minister during the 2002 communal violence. HRW alleged state participation and complicity; later Supreme Court proceedings upheld the SIT clean chit to Modi and others on larger-conspiracy allegations.",
    outcome: "The site keeps this as a pre-2014 context entry, not a Modi-prime-ministership event.",
    sources: ["hrwGujarat2002", "scGujarat2022"]
  },
  {
    id: "covid-lockdown-2020",
    year: 2020,
    date: "24 March 2020",
    title: "Four-hour-notice national Covid lockdown",
    category: "Public health",
    actors: ["BJP-led government", "State institution"],
    status: "Official",
    severity: "Severe",
    summary: "India announced a nationwide Covid lockdown with only hours of notice. The sudden stoppage stranded migrant workers without wages, transport, food security, or housing protections.",
    outcome: "The migration crisis became one of the largest visible humanitarian failures of the first Covid year.",
    sources: ["hrwCovid"]
  },
  {
    id: "delhi-riots-2020-expanded",
    year: 2020,
    date: "23-29 February 2020",
    title: "Delhi communal violence and biased investigation allegations",
    category: "Communal violence",
    actors: ["BJP-linked", "Security forces", "Hindutva-linked"],
    status: "Reported",
    severity: "Severe",
    summary: "Delhi's worst communal violence in decades left 53 people dead and hundreds injured. HRW cited findings that police were complicit or failed to act while BJP leaders used inflammatory rhetoric against anti-CAA protesters.",
    outcome: "The investigation pattern later became a major UAPA and dissent-criminalization entry.",
    sources: ["hrwDelhi2020", "hrwCaaReport"]
  },
  {
    id: "hathras-2020-expanded",
    year: 2020,
    date: "14-30 September 2020",
    title: "Hathras assault, death, and forced cremation",
    category: "Sexual violence",
    actors: ["State institution"],
    status: "Court-tested",
    severity: "Severe",
    summary: "A 19-year-old Dalit woman in Hathras died after an assault. Police cremated her body late at night while the family was kept away, creating national outrage over caste, gender violence, and state handling.",
    outcome: "The case should be categorized under sexual violence and state-institution failure, with careful wording because court findings did not accept every initial public claim.",
    sources: ["ieHathras2020", "hrw2025"]
  },
  {
    id: "farmers-launch-2020-expanded",
    year: 2020,
    date: "26 November 2020",
    title: "Farmers' march to Delhi met with tear gas and water cannon",
    category: "Protest",
    actors: ["BJP-led government", "Security forces"],
    status: "Reported",
    severity: "High",
    summary: "Farmers marching toward Delhi against the three farm laws faced barricades, tear gas, and water cannon. The protest became a year-long mass mobilization at the capital's borders.",
    outcome: "The government repealed the farm laws in November 2021 after sustained pressure.",
    sources: ["aljFarmers2020"]
  },
  {
    id: "pegasus-2021-expanded",
    year: 2021,
    date: "18 July 2021",
    title: "Pegasus surveillance disclosures",
    category: "Press freedom",
    actors: ["BJP-led government", "State institution"],
    status: "Alleged",
    severity: "Severe",
    summary: "The Pegasus Project reported that Indian numbers connected to journalists, human-rights defenders, lawyers, officials, and opposition politicians appeared in leaked potential-target lists. Amnesty's forensic work confirmed infections in selected cases.",
    outcome: "The government did not provide a full public accounting, deepening concerns about surveillance impunity.",
    sources: ["hrwPegasus2021", "amnestyPegasus2021"]
  },
  {
    id: "bilkis-remission-2022",
    year: 2022,
    date: "15 August 2022",
    title: "Bilkis Bano convicts released by Gujarat remission order",
    category: "Sexual violence",
    actors: ["BJP-led government", "State institution"],
    status: "Court-tested",
    severity: "Severe",
    summary: "The BJP-led Gujarat government released 11 men serving life sentences for gang-raping Bilkis Bano and murdering members of her family during the 2002 riots.",
    outcome: "In January 2024, the Supreme Court quashed the remission and said the Gujarat government lacked jurisdiction.",
    sources: ["ieBilkis2024"]
  },
  {
    id: "ankita-bhandari-2022",
    year: 2022,
    date: "18-24 September 2022",
    title: "Ankita Bhandari murder and VIP coercion allegations",
    category: "Sexual violence",
    actors: ["BJP-linked"],
    status: "Convicted",
    severity: "Severe",
    summary: "Ankita Bhandari, a 19-year-old resort receptionist in Uttarakhand, was killed after resisting pressure to provide special services to guests. The main accused was Pulkit Arya, son of former BJP leader Vinod Arya.",
    outcome: "In 2025, Pulkit Arya and two others were sentenced to life imprisonment.",
    sources: ["ieAnkita2022", "ieAnkitaConviction2025"]
  },
  {
    id: "morbi-bridge-2022",
    year: 2022,
    date: "30 October 2022",
    title: "Morbi suspension bridge collapse",
    category: "Infrastructure",
    actors: ["BJP-linked", "State institution", "Corporate"],
    status: "Investigated",
    severity: "Severe",
    summary: "A suspension bridge in Morbi, Gujarat collapsed days after reopening, killing 135 people. Local reporting found it had reopened without a fitness certificate and without proper structural testing.",
    outcome: "A Gujarat SIT later cited corroded wires and welded suspenders among major faults behind the disaster.",
    sources: ["ieMorbi2022", "ieMorbiSIT2023"]
  },
  {
    id: "bbc-raid-2023",
    year: 2023,
    date: "14 February 2023",
    title: "BBC India offices raided after Modi documentary",
    category: "Press freedom",
    actors: ["BJP-led government", "State institution"],
    status: "Reported",
    severity: "High",
    summary: "Tax authorities searched BBC offices in Delhi and Mumbai weeks after the broadcaster aired a documentary critical of Narendra Modi's handling of the 2002 Gujarat violence.",
    outcome: "HRW described the searches as an apparent reprisal and part of pressure on free speech.",
    sources: ["hrwBbcRaid2023"]
  },
  {
    id: "balasore-train-2023",
    year: 2023,
    date: "2 June 2023",
    title: "Balasore three-train collision",
    category: "Infrastructure",
    actors: ["State institution"],
    status: "Investigated",
    severity: "Severe",
    summary: "A three-train collision in Odisha killed at least 288 people and injured more than 800. Reuters reported that a preliminary report blamed signal failure.",
    outcome: "The disaster forced scrutiny of railway safety systems, signaling, and modernization claims.",
    sources: ["reutersBalasore2023"]
  },
  {
    id: "newsclick-2023",
    year: 2023,
    date: "3 October 2023",
    title: "NewsClick UAPA raids and arrests",
    category: "Press freedom",
    actors: ["BJP-led government", "Security forces", "State institution"],
    status: "Reported",
    severity: "Severe",
    summary: "Delhi Police raided homes and offices linked to NewsClick and arrested founder Prabir Purkayastha and HR head Amit Chakravarty under UAPA.",
    outcome: "Amnesty called it an attack on media critical of the government and a case of anti-terror law being weaponized against journalism.",
    sources: ["amnestyNewsClick2023"]
  },
  {
    id: "silkyara-tunnel-2023",
    year: 2023,
    date: "12-28 November 2023",
    title: "Silkyara tunnel collapse traps 41 workers for 17 days",
    category: "Infrastructure",
    actors: ["State institution", "Corporate"],
    status: "Reported",
    severity: "High",
    summary: "A Himalayan highway tunnel under construction in Uttarakhand collapsed, trapping 41 workers for 17 days before all were rescued.",
    outcome: "The collapse triggered safety audits of other tunnels and raised questions about risk controls in fragile Himalayan infrastructure projects.",
    sources: ["reutersSilkyara2023", "reutersTunnelAudit2023"]
  },
  {
    id: "ed-weaponization-2024",
    year: 2024,
    date: "2014-2024",
    title: "Enforcement Directorate opposition-targeting pattern",
    category: "Institutional integrity",
    actors: ["BJP-led government", "State institution"],
    status: "Investigative analysis",
    severity: "High",
    summary: "Indian Express reported a four-fold jump in ED cases against politicians after 2014, with 115 of 121 prominent politicians under ED scanner through September 2022 being opposition leaders.",
    outcome: "Official ED statistics separately show large PMLA activity through 31 March 2026; the political-targeting claim should be presented as investigative analysis, not official ED admission.",
    sources: ["ieEd2024", "edStats2026"]
  },
  {
    id: "bilkis-supreme-court-2024",
    year: 2024,
    date: "8 January 2024",
    title: "Supreme Court reverses Bilkis Bano remission",
    category: "Sexual violence",
    actors: ["BJP-led government", "State institution"],
    status: "Court-tested",
    severity: "Severe",
    summary: "The Supreme Court quashed remission granted to the 11 Bilkis Bano convicts, holding that Gujarat did not have jurisdiction to decide their release.",
    outcome: "The judgment turned the 2022 remission into a concrete court-tested governance failure.",
    sources: ["ieBilkis2024"]
  },
  {
    id: "sebi-buch-2024",
    year: 2024,
    date: "10 August 2024",
    title: "SEBI chief conflict-of-interest allegations in Adani matter",
    category: "Institutional integrity",
    actors: ["State institution", "Corporate"],
    status: "Alleged",
    severity: "High",
    summary: "Hindenburg alleged that SEBI chair Madhabi Puri Buch and her husband had held investments in offshore funds also used by Adani-linked entities. Buch, SEBI, Adani-linked entities, and 360 ONE denied or disputed key allegations.",
    outcome: "The case belongs in the dataset as an alleged financial-regulator conflict, not as a proven conviction.",
    sources: ["reutersSebi2024"]
  },
  {
    id: "rg-kar-2024-expanded",
    year: 2024,
    date: "9 August 2024",
    title: "RG Kar doctor rape and murder",
    category: "Sexual violence",
    actors: ["State institution"],
    status: "Investigated",
    severity: "Severe",
    summary: "The rape and murder of a postgraduate trainee doctor inside Kolkata's RG Kar hospital triggered nationwide medical protests over workplace safety, institutional accountability, and evidence handling.",
    outcome: "HRW's 2026 India chapter cited continuing failures in protecting women and girls and barriers to justice.",
    sources: ["rgKarHrw2026"]
  },
  {
    id: "congress-44-claim-2026",
    year: 2026,
    date: "26 March 2026",
    title: "Opposition claim: 44 BJP MPs and MLAs face serious sexual-offence charges",
    category: "Sexual violence",
    actors: ["BJP-linked"],
    status: "Opposition claim",
    severity: "High",
    summary: "The Indian National Congress claimed that 44 BJP MPs and MLAs were facing serious rape or sexual-harassment charges. This is stored as an opposition claim pending direct ADR or court-record cross-check.",
    outcome: "The stronger current baseline is ADR's 2024 affidavit analysis: BJP had 54 sitting lawmakers with declared cases related to crimes against women and five with declared rape cases.",
    sources: ["congress44Claim2026", "adrWomen"]
  },
  {
    id: "rupee-inflation-2026",
    year: 2026,
    date: "May-July 2026",
    title: "Rupee breaches 96 per US dollar and inflation pressure returns",
    category: "Economy",
    actors: ["BJP-led government", "State institution"],
    status: "Reported",
    severity: "High",
    summary: "Reuters-linked market reporting said the rupee hit record lows past 96 per US dollar in May 2026 amid oil shocks, yields, and capital-flow pressure. Reuters also reported June 2026 retail inflation at 4.38 percent, above the RBI's 4 percent target for the first time in 17 months.",
    outcome: "The site should not blame every currency move on domestic governance alone, but it should record the macroeconomic pressure felt by households.",
    sources: ["reutersRupee2026", "reutersInflation2026"]
  }
];

Object.assign(sourceUpdates, {
  reutersUber2014: {
    title: "Uber cab driver in India arrested after suspected rape",
    publisher: "Reuters via Trust.org",
    url: "https://news.trust.org/item/20141207141526-wlew4",
    type: "News wire"
  },
  ieUberFake2014: {
    title: "Uber cab rape: forged police clearance document",
    publisher: "Indian Express",
    url: "https://indianexpress.com/article/cities/delhi/uber-cab-rape-police-identify-man-who-forged-yadavs-clearance-document/",
    type: "News report"
  },
  guardianVyapam2015: {
    title: "India calls in top investigators to review Vyapam scandal and suspicious deaths",
    publisher: "The Guardian",
    url: "https://www.theguardian.com/world/2015/jul/09/india-calls-investigators-review-vyapam-scandal-suspicious-deaths",
    type: "News report"
  },
  indiaTodayFtii2015: {
    title: "140-day FTII strike against Chauhan ends",
    publisher: "India Today",
    url: "https://www.indiatoday.in/india/story/140-day-ftii-strike-over-gajendra-chauhan-appointment-ends-270206-2015-10-28",
    type: "News report"
  },
  eastAsiaLalitgate2015: {
    title: "Lalitgate narrows windows of Modi's popularity",
    publisher: "East Asia Forum",
    url: "https://eastasiaforum.org/2015/07/09/lalitgate-narrows-windows-of-modis-popularity/",
    type: "Analysis"
  },
  ieLalitgate2015: {
    title: "Lalit Modi admits links with Sushma Swaraj, Vasundhara Raje",
    publisher: "Indian Express",
    url: "https://indianexpress.com/article/india/india-others/sushma-raje-helped-me-admits-lalit-blames-upa-and-murdoch/",
    type: "News report"
  },
  hrwJnu2016: {
    title: "India: Outspoken Activists Charged with Sedition",
    publisher: "Human Rights Watch",
    url: "https://www.hrw.org/news/2016/02/19/india-outspoken-activists-charged-sedition",
    type: "Rights report"
  },
  sccUttarakhand2016: {
    title: "Floor test puts an end to Uttarakhand Assembly crisis",
    publisher: "SCC Online",
    url: "https://www.scconline.com/blog/post/2016/05/12/floor-test-puts-an-end-to-the-uttarakhand-assembly-crisis-presidents-rule-to-be-revoked-harish-rawat-to-assume-the-chief-minister-of-uttarakhands-office/",
    type: "Court coverage"
  },
  ieAgusta2016: {
    title: "Explaining the VVIP chopper row that rocked Parliament",
    publisher: "Indian Express",
    url: "https://indianexpress.com/article/explained/agusta-westland-vvip-helicopter-deal-behind-the-moving-parts-2773448/",
    type: "Explainer"
  },
  reutersJayShah2017: {
    title: "Jay Shah Temple Enterprise revenue controversy",
    publisher: "Times of India",
    url: "https://timesofindia.indiatimes.com/politics/jay-shah/amp_articleshow/61001998.cms",
    type: "News report"
  },
  ieEcGujarat2017: {
    title: "The EC disappoints",
    publisher: "Indian Express",
    url: "https://indianexpress.com/article/opinion/editorials/election-commission-himachal-pradesh-gujarat-elections-ec-model-code-of-conduct-bjp-the-ec-disappoints-4889241/",
    type: "Editorial"
  },
  pibEcGujarat2017: {
    title: "General elections to Legislative Assemblies of Himachal Pradesh and Gujarat, 2017",
    publisher: "Press Information Bureau",
    url: "https://www.pib.gov.in/PressReleasePage.aspx?PRID=1508553&lang=2&reg=48",
    type: "Official release"
  },
  reutersRafale2018: {
    title: "Supreme Court rejects call for probe into Rafale jet deal",
    publisher: "Reuters via Business Standard",
    url: "https://www.business-standard.com/amp/article/reuters/supreme-court-rejects-call-for-probe-into-rafale-jet-deal-118121400270_1.html",
    type: "News wire"
  },
  ieLoya2018: {
    title: "Supreme Court rules out probe into Judge Loya's death",
    publisher: "Indian Express",
    url: "https://indianexpress.com/article/india/supreme-court-on-b-h-loyas-death-case-here-are-top-quotes-from-judgement/",
    type: "Court reporting"
  },
  reutersIlfs2018: {
    title: "Factbox: IL&FS troubles and why investors should care",
    publisher: "Reuters via Business Standard",
    url: "https://www.business-standard.com/article/reuters/factbox-il-fs-its-recent-troubles-and-why-investors-should-care-118092501003_1.html",
    type: "News wire"
  },
  ieIlfs2018: {
    title: "IL&FS defaults, NBFC whiplash: understanding the debt market crisis",
    publisher: "Indian Express",
    url: "https://indianexpress.com/article/explained/ilfs-defaults-nbfc-whiplash-understanding-the-debt-market-crisis-5374379/",
    type: "Explainer"
  },
  reutersChanda2022: {
    title: "Former ICICI Bank CEO Chanda Kochhar arrested in loan fraud case",
    publisher: "Reuters via ThePrint",
    url: "https://theprint.in/india/former-icici-bank-ceo-chanda-kochhar-arrested-in-loan-fraud-case-source/1279700/",
    type: "News wire"
  },
  reutersChinmayanand2019: {
    title: "Former BJP minister arrested over alleged rape",
    publisher: "Reuters via Yahoo News",
    url: "https://sg.news.yahoo.com/former-bjp-minister-arrested-over-111424618.html",
    type: "News wire"
  },
  ieChinmayanand2019: {
    title: "Chinmayanand held for sexual assault of law student",
    publisher: "Indian Express",
    url: "https://indianexpress.com/article/india/chinmayanand-held-for-sexual-assault-of-law-student-he-has-owned-up-cops-6015337/",
    type: "News report"
  },
  hrwBhima2024: {
    title: "Indian Court, Finding Lack of Evidence, Grants Bail to Activist",
    publisher: "Human Rights Watch",
    url: "https://www.hrw.org/news/2024/04/09/indian-court-finding-lack-evidence-grants-bail-activist",
    type: "Rights report"
  },
  wpBhima2021: {
    title: "Evidence found on Indian activists' computers was planted, reports say",
    publisher: "Washington Post",
    url: "https://www.washingtonpost.com/world/2021/07/06/bhima-koregaon-case-india/",
    type: "Forensic reporting"
  }
});

newEvents.push(
  {
    id: "uber-rape-2014",
    year: 2014,
    date: "5 December 2014",
    title: "Delhi Uber rape case exposes vetting failure",
    category: "Sexual violence",
    actors: ["Corporate", "State institution"],
    status: "Convicted",
    severity: "High",
    summary: "A woman passenger was raped by an Uber driver in Delhi. Reporting and police statements pointed to failures in driver background checks and forged police-clearance paperwork.",
    outcome: "The case forced scrutiny of app-based transport regulation and the gap between platform growth and public-safety enforcement.",
    sources: ["reutersUber2014", "ieUberFake2014"]
  },
  {
    id: "vyapam-cbi-2015",
    year: 2015,
    date: "9 July 2015",
    title: "Supreme Court transfers Vyapam probe to CBI",
    category: "Corruption",
    actors: ["BJP-linked", "State institution"],
    status: "Court-tested",
    severity: "High",
    summary: "After national outrage over the Madhya Pradesh Vyapam recruitment and admissions scam and dozens of suspicious deaths linked to people around the case, the Supreme Court ordered a CBI investigation.",
    outcome: "This is the stronger dated entry for the Vyapam escalation.",
    sources: ["guardianVyapam2015"]
  },
  {
    id: "ftii-2015",
    year: 2015,
    date: "12 June-28 October 2015",
    title: "FTII student strike over Gajendra Chauhan appointment",
    category: "Institutional integrity",
    actors: ["BJP-linked", "BJP-led government"],
    status: "Reported",
    severity: "Medium",
    summary: "FTII students launched a long strike after actor and BJP member Gajendra Chauhan was appointed chairman, arguing that the appointment reflected political capture of a premier cultural institution.",
    outcome: "The strike lasted roughly 139-140 days and remained a major symbol of ideological appointments in public institutions.",
    sources: ["indiaTodayFtii2015"]
  },
  {
    id: "lalitgate-2015",
    year: 2015,
    date: "June 2015",
    title: "Lalitgate travel-document controversy",
    category: "Corruption",
    actors: ["BJP-linked"],
    status: "Reported",
    severity: "Medium",
    summary: "External Affairs Minister Sushma Swaraj and Rajasthan Chief Minister Vasundhara Raje came under fire over assistance or support connected to Lalit Modi's UK travel documents while he faced Indian investigations.",
    outcome: "The controversy became an early test of the BJP's anti-corruption positioning after 2014.",
    sources: ["eastAsiaLalitgate2015", "ieLalitgate2015"]
  },
  {
    id: "land-ordinance-reissues-2015",
    year: 2015,
    date: "3 April and 30 May 2015",
    title: "Land acquisition ordinance re-promulgated",
    category: "Institutional integrity",
    actors: ["BJP-led government"],
    status: "Official",
    severity: "Medium",
    summary: "After resistance in Parliament, the land acquisition amendment ordinance was re-promulgated, keeping alive changes opposed by farmers and civil-society groups.",
    outcome: "The episode is an early executive-power entry in the dataset.",
    sources: ["wikipedia2026"]
  },
  {
    id: "jnu-sedition-2016",
    year: 2016,
    date: "12-19 February 2016",
    title: "JNU sedition clampdown",
    category: "Civil liberties",
    actors: ["BJP-linked", "RSS or ABVP-linked", "Security forces"],
    status: "Reported",
    severity: "High",
    summary: "JNU student leader Kanhaiya Kumar and others faced sedition proceedings after a campus event. HRW called the use of sedition against outspoken activists politically motivated.",
    outcome: "The case became a national marker for anti-national rhetoric, campus policing, and colonial-era sedition law.",
    sources: ["hrwJnu2016"]
  },
  {
    id: "uttarakhand-president-rule-2016",
    year: 2016,
    date: "27 March-11 May 2016",
    title: "Uttarakhand President's Rule crisis",
    category: "Institutional integrity",
    actors: ["BJP-led government", "State institution"],
    status: "Court-tested",
    severity: "Medium",
    summary: "President's Rule was imposed in Uttarakhand after a rebellion in the Congress-led state government. A Supreme Court-supervised floor test restored Harish Rawat.",
    outcome: "The case belongs in the federalism and Article 356 misuse bucket.",
    sources: ["sccUttarakhand2016"]
  },
  {
    id: "agustawestland-2016",
    year: 2016,
    date: "April 2016",
    title: "AgustaWestland chopper scandal returns to Parliament",
    category: "Corruption",
    actors: ["State institution", "Opposition-linked"],
    status: "Investigated",
    severity: "Medium",
    summary: "Italian court developments in the VVIP helicopter bribery matter reignited Indian political confrontation over the AgustaWestland deal signed before 2014.",
    outcome: "This is a corruption-history entry for the Modi period's political use of pre-2014 scandals, not a BJP-origin scandal.",
    sources: ["ieAgusta2016"]
  },
  {
    id: "demonetization-rbi-2017",
    year: 2017,
    date: "30 August 2017",
    title: "RBI data undercuts demonetization black-money claim",
    category: "Economy",
    actors: ["BJP-led government", "State institution"],
    status: "Official",
    severity: "High",
    summary: "RBI reporting showed almost all demonetized notes returned to banks, weakening the claim that the shock would extinguish large amounts of illegal cash.",
    outcome: "This is the clean dated follow-up to the November 2016 shock.",
    sources: ["rbiAnnual", "reutersDemon"]
  },
  {
    id: "jay-shah-2017",
    year: 2017,
    date: "8 October 2017",
    title: "Jay Shah Temple Enterprise revenue controversy",
    category: "Corruption",
    actors: ["BJP-linked"],
    status: "Alleged",
    severity: "Medium",
    summary: "Reporting based on company filings said Temple Enterprise, owned by Jay Shah, son of BJP president Amit Shah, saw revenue rise from Rs 50,000 to more than Rs 80 crore in a year after 2014.",
    outcome: "The entry should remain marked alleged or reported because it was a controversy over filings and political conflict, not a conviction.",
    sources: ["reutersJayShah2017"]
  },
  {
    id: "gujarat-poll-delay-2017",
    year: 2017,
    date: "12-26 October 2017",
    title: "Election Commission Gujarat poll-date delay row",
    category: "Institutional integrity",
    actors: ["State institution", "BJP-linked"],
    status: "Reported",
    severity: "Medium",
    summary: "The Election Commission announced Himachal Pradesh poll dates while delaying Gujarat's schedule, prompting criticism that the ruling party received more time for announcements before the Model Code of Conduct applied.",
    outcome: "Official notices confirm staggered announcement dates; motive remains contested.",
    sources: ["ieEcGujarat2017", "pibEcGujarat2017"]
  },
  {
    id: "rafale-2018",
    year: 2018,
    date: "14 December 2018",
    title: "Rafale procurement controversy and Supreme Court dismissal",
    category: "Corruption",
    actors: ["BJP-led government", "Corporate"],
    status: "Court-tested",
    severity: "High",
    summary: "Opposition parties alleged corruption and favoritism in the 36-aircraft Rafale deal and offset arrangements. The Supreme Court rejected petitions seeking a probe and said it found no material showing commercial favoritism.",
    outcome: "The entry should present both the political allegation and the court outcome.",
    sources: ["reutersRafale2018"]
  },
  {
    id: "loya-2018",
    year: 2018,
    date: "19 April 2018",
    title: "Judge Loya death probe pleas dismissed",
    category: "Institutional integrity",
    actors: ["State institution", "BJP-linked"],
    status: "Court-tested",
    severity: "Medium",
    summary: "Petitioners sought an independent probe into the death of Judge B.H. Loya, who had heard the Sohrabuddin Sheikh encounter case involving Amit Shah before Shah was discharged. The Supreme Court dismissed the pleas and held the death was due to natural causes.",
    outcome: "This belongs in the contested-institutional-record bucket with the Supreme Court outcome visible.",
    sources: ["ieLoya2018"]
  },
  {
    id: "ilfs-2018",
    year: 2018,
    date: "September 2018",
    title: "IL&FS default and NBFC liquidity shock",
    category: "Economy",
    actors: ["Corporate", "State institution"],
    status: "Reported",
    severity: "High",
    summary: "IL&FS missed debt obligations, triggering stress in debt markets and fears of contagion across India's non-bank financial sector.",
    outcome: "The event exposed hidden leverage, weak governance, and regulatory blind spots in a major infrastructure-finance group.",
    sources: ["reutersIlfs2018", "ieIlfs2018"]
  },
  {
    id: "chanda-kochhar-2018-2022",
    year: 2018,
    date: "2018-23 December 2022",
    title: "Chanda Kochhar ICICI-Videocon loan case",
    category: "Corruption",
    actors: ["Corporate", "State institution"],
    status: "Investigated",
    severity: "Medium",
    summary: "Chanda Kochhar exited ICICI leadership after allegations connected to Videocon loans and alleged quid-pro-quo investments linked to her husband's company. CBI arrested Chanda and Deepak Kochhar in December 2022.",
    outcome: "This is a corporate-governance and investigative-agency entry, not a BJP-specific sexual-violence entry.",
    sources: ["reutersChanda2022"]
  },
  {
    id: "chinmayanand-2019",
    year: 2019,
    date: "20 September 2019",
    title: "Swami Chinmayanand sexual-assault case",
    category: "Sexual violence",
    actors: ["BJP-linked"],
    status: "Charged",
    severity: "High",
    summary: "Former Union minister and BJP leader Swami Chinmayanand was arrested after a law student accused him of sexual assault and exploitation. BJP later claimed he was no longer a party member.",
    outcome: "The case remains a key political-actor sexual-violence entry and should be tracked with trial status separately.",
    sources: ["reutersChinmayanand2019", "ieChinmayanand2019"]
  },
  {
    id: "bhima-koregaon-elgar-2018-2024",
    year: 2021,
    date: "2018-2024",
    title: "Elgar Parishad / Bhima Koregaon UAPA imprisonments",
    category: "Civil liberties",
    actors: ["BJP-led government", "Security forces", "State institution"],
    status: "Court-tested and contested",
    severity: "Severe",
    summary: "Activists, lawyers, academics, and a priest were arrested under UAPA in the Bhima Koregaon case. Father Stan Swamy died in custody in 2021. Later court orders and forensic reporting raised serious doubts about parts of the evidence.",
    outcome: "This should be tracked as one of the decade's central anti-terror-law and political-prisoner controversies.",
    sources: ["hrwBhima2024", "wpBhima2021"]
  }
);

const sources = readJson("sources.json");
Object.assign(sources, sourceUpdates);
writeJson("sources.json", sources);

const events = readJson("events.json");
const byId = new Map(events.map((event) => [event.id, event]));
for (const event of newEvents) {
  byId.set(event.id, event);
}
const mergedEvents = Array.from(byId.values()).sort((a, b) => {
  if (a.year !== b.year) return a.year - b.year;
  return String(a.date).localeCompare(String(b.date));
});
writeJson("events.json", mergedEvents);

const indicators = readJson("indicators.json");
const hasRupee = indicators.some((indicator) => indicator.title === "Rupee pressure");
if (!hasRupee) {
  indicators.push({
    title: "Rupee pressure",
    value: "96+ per US dollar",
    detail: "Reuters-linked reports showed the rupee breaching 96 per US dollar in May 2026. The driver mix includes oil shocks, yields, capital flows, and domestic macro pressure.",
    direction: "Record low in 2026",
    sources: ["reutersRupee2026"],
    chart: [
      { label: "2026 low", value: 96.18 }
    ]
  });
}
writeJson("indicators.json", indicators);
