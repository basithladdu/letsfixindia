import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const dataDir = path.join(root, "data");

function readJson(name, fallback) {
  const file = path.join(dataDir, name);
  if (!fs.existsSync(file)) return fallback;
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function writeJson(name, value) {
  fs.writeFileSync(path.join(dataDir, name), `${JSON.stringify(value, null, 2)}\n`);
}

const sourceUpdates = {
  wikipedia2025: {
    title: "2025 in India",
    publisher: "Wikipedia",
    url: "https://en.wikipedia.org/wiki/2025_in_India",
    type: "Dynamic lead list"
  },
  wikipediaBjpControversies: {
    title: "Category: Bharatiya Janata Party controversies",
    publisher: "Wikipedia",
    url: "https://en.wikipedia.org/wiki/Category:Bharatiya_Janata_Party_controversies",
    type: "Dynamic lead list"
  },
  wikipediaPoliticalRiots: {
    title: "Category: Political riots in India",
    publisher: "Wikipedia",
    url: "https://en.wikipedia.org/wiki/Category:Political_riots_in_India",
    type: "Dynamic lead list"
  },
  wikipediaPoliceBrutality: {
    title: "Category: Police brutality in India",
    publisher: "Wikipedia",
    url: "https://en.wikipedia.org/wiki/Category:Police_brutality_in_India",
    type: "Dynamic lead list"
  },
  wikipediaWbViolence: {
    title: "Category: Politico-Religious violence in West Bengal",
    publisher: "Wikipedia",
    url: "https://en.wikipedia.org/wiki/Category:Politico-Religious_violence_in_West_Bengal",
    type: "Dynamic lead list"
  },
  hrw2026: {
    title: "Human Rights Watch - World Report 2026: India",
    publisher: "Human Rights Watch",
    url: "https://www.hrw.org/world-report/2026/country-chapters/india",
    type: "Rights report"
  },
  rsfIndia: {
    title: "India country page and World Press Freedom Index",
    publisher: "Reporters Without Borders",
    url: "https://rsf.org/en/country/india",
    type: "Index"
  },
  rsf2014: {
    title: "World Press Freedom Index 2014",
    publisher: "Reporters Without Borders",
    url: "https://rsf.org/en/node/79154?data_type=general&year=2014",
    type: "Index archive"
  },
  aljFarmers2020: {
    title: "India farmers brave tear gas as they protest against new laws",
    publisher: "Al Jazeera",
    url: "https://www.aljazeera.com/news/2020/11/26/india-farmers-march-to-delhi-against-new-laws",
    type: "News report"
  },
  reutersMallya2016: {
    title: "Tycoon Mallya denies fleeing India, Delhi left red-faced over exit",
    publisher: "Reuters via Business Standard",
    url: "https://www.business-standard.com/article/reuters/tycoon-mallya-denies-fleeing-india-delhi-left-red-faced-over-exit-116031100560_1.html",
    type: "News wire"
  },
  reutersGstGlitches2017: {
    title: "India eyes spending cuts as glitches in GST hit revenue",
    publisher: "Reuters via Business Standard",
    url: "https://www.business-standard.com/article/reuters/india-eyes-spending-cuts-as-glitches-in-gst-hit-revenue-117091800932_1.html",
    type: "News wire"
  },
  reutersPnb2018: {
    title: "Eyes wide shut: the $1.8 billion PNB fraud that went unnoticed",
    publisher: "Reuters via Business Standard",
    url: "https://www.business-standard.com/article/reuters/eyes-wide-shut-the-1-8-billion-pnb-fraud-that-went-unnoticed-118021900094_1.html",
    type: "News wire"
  },
  reutersPnbLapses2018: {
    title: "Lapses at many levels of bank led to India's huge PNB fraud",
    publisher: "Reuters via Business Standard",
    url: "https://www.business-standard.com/article/reuters/exclusive-lapses-at-many-levels-of-bank-led-to-india-s-huge-pnb-fraud-internal-report-shows-118062000096_1.html",
    type: "News wire"
  },
  aljPulwama2019: {
    title: "Nine killed in Kashmir gun battle days after deadly attack",
    publisher: "Al Jazeera",
    url: "https://www.aljazeera.com/news/2019/2/18/nine-killed-in-kashmir-gun-battle-days-after-deadly-attack",
    type: "News report"
  },
  ieKalburgi2015: {
    title: "Former Karnatak University vice-chancellor M M Kalburgi shot",
    publisher: "Indian Express",
    url: "https://indianexpress.com/article/india/india-others/ex-vc-m-m-kalaburgi-who-had-run-ins-with-hardliners-shot/lite/",
    type: "News report"
  },
  ieAwardWapsi2015: {
    title: "M M Kalburgi murder: writers return awards",
    publisher: "Indian Express",
    url: "https://indianexpress.com/article/india/india-others/m-m-kalburgi-murder-kannada-poet-hindi-writer-to-return-awards/lite/",
    type: "News report"
  },
  cpjGauri2017: {
    title: "Journalists Killed in 2017: Gauri Lankesh",
    publisher: "Committee to Protect Journalists via Refworld",
    url: "https://www.refworld.org/reference/annualreport/cpj/2017/en/119702",
    type: "Press freedom record"
  },
  ieAkbar2018: {
    title: "M J Akbar resigns after flurry of #MeToo allegations",
    publisher: "Indian Express",
    url: "https://indianexpress.com/article/india/mj-akbar-resigns/",
    type: "News report"
  },
  prsFarmRepeal2021: {
    title: "The Farm Laws Repeal Bill, 2021",
    publisher: "PRS Legislative Research",
    url: "https://prsindia.org/billtrack/the-farm-laws-repeal-bill-2021",
    type: "Legislative tracker"
  },
  pibFarmRepeal2021: {
    title: "Prime Minister announces decision to repeal three farm laws",
    publisher: "Press Information Bureau",
    url: "https://www.pib.gov.in/PressReleasePage.aspx?PRID=1773175&lang=2&reg=48",
    type: "Official release"
  },
  ieLakhimpurChargesheet2022: {
    title: "Lakhimpur case: MoS son faces murder, conspiracy case",
    publisher: "Indian Express",
    url: "https://indianexpress.com/article/cities/lucknow/lakhimpur-kheri-sit-chargesheet-union-minister-ajay-mishra-son-ashish-others-7703537/lite/",
    type: "Court reporting"
  },
  ieMoinulHaque2021: {
    title: "Assam eviction violence: two deaths in Darrang police firing",
    publisher: "Indian Express",
    url: "https://indianexpress.com/article/north-east-india/assam/assam-eviction-violence-two-deaths-clashes-7532641/",
    type: "News report"
  },
  aljAssamEvictions2021: {
    title: "To dehumanise, terrorise us: Muslims evicted in India's Assam",
    publisher: "Al Jazeera",
    url: "https://www.aljazeera.com/news/2021/10/12/india-assam-muslims-forcibly-evicted-dhalpur-bjp-darrang",
    type: "News report"
  },
  reutersNupur2022: {
    title: "Suspended India ruling party spokeswoman in more trouble after Prophet Mohammed remarks",
    publisher: "Reuters via Euronews",
    url: "https://www.euronews.com/2022/06/10/us-india-politics-diplomacy",
    type: "News wire"
  },
  reutersKanhaiya2022: {
    title: "Indian police arrest masterminds behind murder of Hindu tailor",
    publisher: "Reuters via Euronews",
    url: "https://www.euronews.com/2022/07/03/india-religion-tension",
    type: "News wire"
  },
  freedomHouse2024: {
    title: "India: Freedom in the World 2024",
    publisher: "Freedom House",
    url: "https://freedomhouse.org/country/india/freedom-world/2024",
    type: "Democracy index"
  },
  reutersRahul2023: {
    title: "India's parliament reinstates Rahul Gandhi as lawmaker",
    publisher: "Reuters via ThePrint",
    url: "https://theprint.in/india/indias-parliament-reinstates-rahul-gandhi-as-lawmaker/1703470/",
    type: "News wire"
  },
  ieRahulDisqualified2023: {
    title: "Rahul Gandhi disqualified from Lok Sabha day after conviction",
    publisher: "Indian Express",
    url: "https://indianexpress.com/article/india/rahukl-gandhi-conviction-disqualified-lok-sabha-mp-8516551/",
    type: "News report"
  },
  reutersAdani2023: {
    title: "Explainer: Adani vs Hindenburg, what you need to know",
    publisher: "Reuters via Investing.com",
    url: "https://www.investing.com/news/economy/explaineradani-vs-hindenburg-what-you-need-to-know-2993502",
    type: "News wire"
  },
  reutersAdaniRout2023: {
    title: "India's Adani tries to calm investors as regulator confirms probe",
    publisher: "Reuters via Investing.com",
    url: "https://www.investing.com/news/stock-market-news/adani-saga-spotlight-shifts-to-indian-regulator-shares-skid-again-3001577",
    type: "News wire"
  },
  toiIitBhu2024: {
    title: "BJP IT cell duo among three held for IIT-BHU student's gang rape",
    publisher: "Times of India",
    url: "https://timesofindia.indiatimes.com/city/varanasi/bjp-it-cell-duo-among-3-held-for-iit-bhu-girls-gang-rape/articleshow/106426429.cms",
    type: "News report"
  },
  pibOneNation2024: {
    title: "High Level Committee submits report on One Nation, One Election",
    publisher: "Press Information Bureau",
    url: "https://www.pib.gov.in/PressReleaseIframePage.aspx?PRID=2014497&lang=2&reg=48",
    type: "Official release"
  },
  ieOneNation2024: {
    title: "Opposition told panel simultaneous elections against basic structure",
    publisher: "Indian Express",
    url: "https://indianexpress.com/article/india/report-opp-told-panel-its-against-the-basic-structure-of-constitution-9214949/",
    type: "News report"
  },
  cpjMukesh2025: {
    title: "Mukesh Chandrakar killed",
    publisher: "Committee to Protect Journalists",
    url: "https://cpj.org/data/people/mukesh-chandrakar/",
    type: "Press freedom record"
  },
  iePrajwal2025: {
    title: "Former MP Prajwal Revanna gets life sentence for rape of domestic worker",
    publisher: "Indian Express",
    url: "https://indianexpress.com/article/cities/bangalore/prajwal-revanna-life-sentence-rape-case-10165502/",
    type: "Court reporting"
  },
  ieSanchar2025: {
    title: "Government revokes order mandating preloading of Sanchar Saathi app",
    publisher: "Indian Express",
    url: "https://indianexpress.com/article/business/govt-amend-order-mandating-sanchar-saathi-phones-backlash-10399934/",
    type: "News report"
  },
  aljSanchar2025: {
    title: "Why did India order smartphone makers to install a government app?",
    publisher: "Al Jazeera",
    url: "https://www.aljazeera.com/news/2025/12/3/why-did-india-order-smartphone-makers-to-install-a-government-app",
    type: "News report"
  },
  ieNuns2025: {
    title: "Kerala nuns arrested in Chhattisgarh to remain in jail",
    publisher: "Indian Express",
    url: "https://indianexpress.com/article/india/kerala-nuns-arrested-in-chhattisgarh-religious-conversion-nia-10159203/",
    type: "News report"
  },
  ieNunsWomenCommission2025: {
    title: "Women's commission demands FIR against right-wing workers in Chhattisgarh nuns case",
    publisher: "Indian Express",
    url: "https://indianexpress.com/article/india/chhattisgarh-nuns-arrest-case-womens-commission-demands-fir-against-right-wing-workers-for-harassment-10298003/",
    type: "News report"
  },
  ieReutersX2025: {
    title: "Reuters X account blocked in India; government says no legal requirement made",
    publisher: "Indian Express",
    url: "https://indianexpress.com/article/cities/delhi/reuters-x-account-blocked-in-india-govt-legal-requirement-10110051/",
    type: "News report"
  },
  ndtvWaqf2025: {
    title: "Three killed in Bengal Waqf protests",
    publisher: "NDTV",
    url: "https://www.ndtv.com/india-news/3-killed-in-clashes-linked-to-protests-against-waqf-act-in-bengals-murshidabad-police-8148399",
    type: "News report"
  },
  ieSscProtests2025: {
    title: "Cancellations, glitches, wrong exam centre: why SSC aspirants are protesting",
    publisher: "Indian Express",
    url: "https://indianexpress.com/article/cities/delhi/cancellations-glitches-wrong-exam-centre-ssc-aspirants-protest-delhi-10165270/lite/",
    type: "News report"
  },
  ieSscChair2025: {
    title: "Technical, operational issues being resolved: SSC Chairman",
    publisher: "Indian Express",
    url: "https://indianexpress.com/article/education/ssc-cgl-2025-technical-operational-issues-being-resolved-ssc-chief-on-irregularities-in-recruitment-exams-selection-posts-10211971/",
    type: "News report"
  },
  pibAaib171: {
    title: "AAIB interim statement on Air India Flight AI-171 investigation",
    publisher: "Press Information Bureau",
    url: "https://www.pib.gov.in/newsite/erelcontent.aspx?lang=2&reg=48&relid=289951",
    type: "Official release"
  },
  aljRedFort2025: {
    title: "Delhi Red Fort blast kills 13: what happened as police invoke terror law?",
    publisher: "Al Jazeera",
    url: "https://www.aljazeera.com/news/2025/11/11/delhi-red-fort-blast-kills-13-what-happened-as-police-invoke-terror-law",
    type: "News report"
  },
  aljRedFortArrest2025: {
    title: "India arrests Kashmir resident over deadly Delhi car blast",
    publisher: "Al Jazeera",
    url: "https://www.aljazeera.com/news/2025/11/16/india-arrests-kashmir-resident-over-deadly-delhi-car-blast",
    type: "News report"
  },
  prs130th2025: {
    title: "The Constitution (130th Amendment) Bill, 2025",
    publisher: "PRS Legislative Research",
    url: "https://prsindia.org/billtrack/the-constitution-one-hundred-and-thirtieth-amendment-bill-2025",
    type: "Legislative tracker"
  },
  pib130th2025: {
    title: "Amit Shah introduces Constitution (130th Amendment) Bill, 2025",
    publisher: "Press Information Bureau",
    url: "https://www.pib.gov.in/PressReleasePage.aspx?PRID=2158593&lang=1&reg=3",
    type: "Official release"
  },
  prsVbGramg2025: {
    title: "The Viksit Bharat Guarantee for Rozgar and Ajeevika Mission (Gramin) Bill, 2025",
    publisher: "PRS Legislative Research",
    url: "https://prsindia.org/billtrack/the-viksit-bharat-%E2%80%93-guarantee-for-rozgar-and-ajeevika-mission-gramin-vb-%E2%80%93-g-ram-g-bill-2025",
    type: "Legislative tracker"
  },
  pibVbGramg2025: {
    title: "President gives assent to VB-G RAM G Bill, 2025",
    publisher: "Press Information Bureau",
    url: "https://www.pib.gov.in/PressReleasePage.aspx?PRID=2207187&lang=1&reg=1",
    type: "Official release"
  },
  aljKashmirVpn2026: {
    title: "India's VPN ban in Kashmir adds to psychological pressure, say residents",
    publisher: "Al Jazeera",
    url: "https://www.aljazeera.com/amp/news/2026/1/12/indias-vpn-ban-in-kashmir-adds-to-psychological-pressure-say-residents",
    type: "News report"
  },
  hrwKashmirForce2016: {
    title: "India: Investigate Use of Lethal Force in Kashmir",
    publisher: "Human Rights Watch",
    url: "https://www.hrw.org/news/2016/07/13/india-investigate-use-lethal-force-kashmir",
    type: "Rights report"
  },
  worldBankGdpPc: {
    title: "GDP per capita, current US dollars - India",
    publisher: "World Bank",
    url: "https://api.worldbank.org/v2/country/IND/indicator/NY.GDP.PCAP.CD?format=json&per_page=200",
    type: "Official dataset"
  },
  worldBankCpi: {
    title: "Inflation, consumer prices annual percent - India",
    publisher: "World Bank",
    url: "https://api.worldbank.org/v2/country/IND/indicator/FP.CPI.TOTL.ZG?format=json&per_page=200",
    type: "Official dataset"
  },
  worldBankInternet: {
    title: "Individuals using the Internet percent of population - India",
    publisher: "World Bank DataBank",
    url: "https://databank.worldbank.org/reports.aspx?country=IND&series=IT.NET.USER.ZS&source=2",
    type: "Official dataset"
  },
  pibPlfs2017: {
    title: "PLFS unemployment reference for 2017-18",
    publisher: "Press Information Bureau",
    url: "https://www.pib.gov.in/PressReleasePage.aspx?PRID=2196924&lang=1&reg=3&sharetype=link",
    type: "Official release"
  },
  pibPlfs2025: {
    title: "PLFS unemployment reference for 2025",
    publisher: "Press Information Bureau",
    url: "https://www.pib.gov.in/PressReleasePage.aspx?PRID=2246009&lang=1&reg=1",
    type: "Official release"
  },
  eciAtlas2024Turnout: {
    title: "Election Commission Atlas 2024 turnout table",
    publisher: "Election Commission of India",
    url: "https://www.eci.gov.in/EBooks/atlas-2024/files/basic-html/page90.html",
    type: "Official dataset"
  },
  eciAtlas2024Votes: {
    title: "Election Commission Atlas 2024 electorate and votes table",
    publisher: "Election Commission of India",
    url: "https://www.eci.gov.in/EBooks/atlas-2024/files/basic-html/page93.html",
    type: "Official dataset"
  },
  adrLokSabha2024: {
    title: "Analysis of criminal background, financial, education, gender and other details of winning candidates, 2024",
    publisher: "Association for Democratic Reforms",
    url: "https://adrindia.org/content/analysis-criminal-background-financial-education-gender-and-other-details-winning-31",
    type: "Affidavit analysis"
  },
  adrLokSabha2024Details: {
    title: "ADR winning candidate criminal, serious criminal and asset figures",
    publisher: "Association for Democratic Reforms / National Election Watch",
    url: "https://groups.google.com/g/national-election-watch/c/Ngg1Yzd_9kI",
    type: "Affidavit analysis"
  },
  freedomHouse2014: {
    title: "Freedom in the World 2014: India",
    publisher: "Freedom House via Refworld",
    url: "https://www.refworld.org/reference/annualreport/freehou/2014/17339",
    type: "Democracy index"
  },
  freedomHouse2026: {
    title: "India: Freedom in the World 2026",
    publisher: "Freedom House",
    url: "https://freedomhouse.org/country/india/freedom-world/2026",
    type: "Democracy index"
  },
  sflcShutdowns: {
    title: "Internet shutdowns in India tracker",
    publisher: "Software Freedom Law Center India",
    url: "https://internetshutdowns.in/",
    type: "Civil-society tracker"
  },
  dataGovSuicides2023: {
    title: "Year-wise incidence and rate of suicides, all India, 2013-2023",
    publisher: "Open Government Data / NCRB",
    url: "https://www.data.gov.in/resource/year-wise-details-incidence-and-rate-suicides-all-india-2013-2023",
    type: "Official dataset"
  },
  pibSuicides2014: {
    title: "NCRB accidental deaths and suicides release",
    publisher: "Press Information Bureau",
    url: "https://www.pib.gov.in/newsite/PrintRelease.aspx?lang=2&reg=48&relid=124338",
    type: "Official release"
  }
};

const eventRemovals = [
  "delhi-violence-2020",
  "hathras-2020",
  "pegasus-2021",
  "rg-kar-2024"
];

const eventUpserts = [
  {
    id: "mallya-2016",
    year: 2016,
    date: "2 March 2016",
    title: "Vijay Mallya leaves India amid bank-default scrutiny",
    category: "Corruption",
    actors: ["State institution", "Corporate"],
    status: "Reported",
    severity: "High",
    summary: "Vijay Mallya left India for Britain while banks were seeking repayment of more than $1 billion tied to Kingfisher Airlines, triggering political scrutiny over how he was able to depart despite creditor pressure.",
    outcome: "Keep this as a banking-governance and elite-fugitive entry; it is not a court-tested BJP conviction.",
    sources: ["reutersMallya2016"]
  },
  {
    id: "kalburgi-2015",
    year: 2015,
    date: "30 August 2015",
    title: "M.M. Kalburgi killing and Award Wapsi protests",
    category: "Civil liberties",
    actors: ["Hindutva-linked"],
    status: "Reported",
    severity: "High",
    summary: "Rationalist scholar M.M. Kalburgi was shot dead at his home in Dharwad. Reporting described his run-ins with hardliners and the Hindutva fringe; his killing became one trigger for writers returning awards in protest.",
    outcome: "The entry is framed as a violent-intolerance and dissent-protection issue, not as a settled conviction against a named BJP actor.",
    sources: ["ieKalburgi2015", "ieAwardWapsi2015"]
  },
  {
    id: "gst-2017",
    year: 2017,
    date: "1 July-September 2017",
    title: "GST rollout disrupts small businesses and revenue systems",
    category: "Economy",
    actors: ["BJP-led government", "State institution"],
    status: "Reported",
    severity: "High",
    summary: "Reuters reported that GST compliance glitches, ambiguous rules, and a burdensome filing system complicated business and hurt collections after the July 2017 launch.",
    outcome: "The entry records rollout stress, especially for smaller firms, without denying GST's broader goal of creating a national tax market.",
    sources: ["reutersGstGlitches2017"]
  },
  {
    id: "gauri-2017",
    year: 2017,
    date: "5 September 2017",
    title: "Gauri Lankesh assassinated",
    category: "Press freedom",
    actors: ["Hindutva-linked"],
    status: "Investigated",
    severity: "Severe",
    summary: "Journalist Gauri Lankesh was shot dead outside her home in Bengaluru. CPJ recorded her as a murdered journalist and noted her criticism of right-wing extremism.",
    outcome: "The case stays in the press-freedom and ideological-violence bucket with event-specific sourcing.",
    sources: ["cpjGauri2017", "rsfIndia"]
  },
  {
    id: "pnb-2018",
    year: 2018,
    date: "14 February-20 June 2018",
    title: "Nirav Modi and Punjab National Bank fraud",
    category: "Corruption",
    actors: ["Corporate", "State institution"],
    status: "Investigated",
    severity: "High",
    summary: "Punjab National Bank disclosed a fraud linked to jeweller Nirav Modi and Mehul Choksi. Reuters later reported that internal findings pointed to risk-control and monitoring lapses across many parts of the bank.",
    outcome: "This is a banking-regulation and public-sector-bank failure entry, not a settled party-corruption conviction.",
    sources: ["reutersPnb2018", "reutersPnbLapses2018"]
  },
  {
    id: "akbar-2018",
    year: 2018,
    date: "17 October 2018",
    title: "M.J. Akbar resigns after #MeToo allegations",
    category: "Sexual violence",
    actors: ["BJP-linked", "BJP-led government"],
    status: "Alleged",
    severity: "High",
    summary: "Junior foreign minister M.J. Akbar resigned after multiple women accused him of sexual harassment during his earlier journalism career. Akbar denied the allegations and said he would contest them in court.",
    outcome: "This is preserved as an attributed allegation plus ministerial resignation, not as a conviction.",
    sources: ["ieAkbar2018"]
  },
  {
    id: "pulwama-2019",
    year: 2019,
    date: "14 February 2019",
    title: "Pulwama terror attack",
    category: "Security and terror",
    actors: ["Terror group", "Security forces", "BJP-led government"],
    status: "Reported",
    severity: "Severe",
    summary: "A suicide bomber attacked a CRPF convoy in Pulwama, killing dozens of Indian security personnel. Jaish-e-Mohammad claimed responsibility, and the attack led to a sharp India-Pakistan escalation.",
    outcome: "The entry records the attack and aftermath; allegations about election use of the escalation should be separately sourced before being stated as fact.",
    sources: ["aljPulwama2019"]
  },
  {
    id: "farm-laws-2020",
    year: 2020,
    date: "September 2020",
    title: "Three farm laws pass and trigger mass mobilization",
    category: "Protest",
    actors: ["BJP-led government", "State institution"],
    status: "Official",
    severity: "High",
    summary: "Parliament passed three farm laws in September 2020. PRS records that the 2021 repeal bill repealed those three Acts; protesters argued the original process and market changes threatened farmer protections.",
    outcome: "This pairs with the November 2020 protest entry and the 2021 repeal entry.",
    sources: ["prsFarmRepeal2021", "aljFarmers2020"]
  },
  {
    id: "moinul-haque-assam-2021",
    year: 2021,
    date: "23 September 2021",
    title: "Assam Darrang eviction firing and Moinul Haque killing",
    category: "Police brutality",
    actors: ["BJP-led government", "Security forces", "State institution"],
    status: "Reported",
    severity: "Severe",
    summary: "During a state eviction drive in Darrang, Assam police opened fire on residents; Moinul Haque and a 12-year-old, Sheikh Farid, died. Video of a government photographer attacking Haque's body went viral.",
    outcome: "The event is directly relevant to BJP-governed Assam and belongs in police-brutality and minority-displacement tracking.",
    sources: ["ieMoinulHaque2021", "aljAssamEvictions2021"]
  },
  {
    id: "farm-repeal-2021",
    year: 2021,
    date: "19-29 November 2021",
    title: "Farm laws repealed after year-long protest",
    category: "Protest",
    actors: ["BJP-led government", "State institution"],
    status: "Official",
    severity: "High",
    summary: "Prime Minister Narendra Modi announced the decision to repeal the three farm laws on 19 November 2021. PRS records the Farm Laws Repeal Bill being passed by both houses on 29 November 2021.",
    outcome: "The repeal shows mass protest forcing policy reversal; it should be recorded as an official rollback, not merely a protest claim.",
    sources: ["pibFarmRepeal2021", "prsFarmRepeal2021"]
  },
  {
    id: "lakhimpur-2021",
    year: 2021,
    date: "3 October 2021",
    title: "Lakhimpur Kheri killings during farmers' protest",
    category: "Political violence",
    actors: ["BJP-linked", "Security forces"],
    status: "Charged",
    severity: "Severe",
    summary: "During farm-law protests in Lakhimpur Kheri, four farmers and a journalist were killed after vehicles ran over protesters. The UP Police SIT later chargesheeted Union minister Ajay Mishra's son Ashish Mishra and others under murder and conspiracy provisions.",
    outcome: "The site should track court outcomes separately; the charge sheet does not equal conviction.",
    sources: ["ieLakhimpurChargesheet2022"]
  },
  {
    id: "nupur-sharma-remarks-2022",
    year: 2022,
    date: "5-10 June 2022",
    title: "BJP spokesperson Prophet remarks trigger diplomatic backlash",
    category: "Communal friction",
    actors: ["BJP-linked", "BJP-led government"],
    status: "Reported",
    severity: "High",
    summary: "BJP spokesperson Nupur Sharma was suspended and Naveen Jindal expelled after remarks about Prophet Mohammed triggered condemnation from Muslim-majority countries and police complaints in Delhi.",
    outcome: "The event is a direct BJP communication and communal-friction controversy; subsequent violence should be separately sourced.",
    sources: ["reutersNupur2022"]
  },
  {
    id: "kanhaiya-lal-2022",
    year: 2022,
    date: "28 June-3 July 2022",
    title: "Kanhaiya Lal murder after post supporting Nupur Sharma",
    category: "Security and terror",
    actors: ["Terror group", "Communal violence"],
    status: "Investigated",
    severity: "Severe",
    summary: "Tailor Kanhaiya Lal Teli was murdered in Udaipur. Reuters reported that the accused said the killing was in response to the victim's support for Nupur Sharma's remarks about Prophet Mohammed.",
    outcome: "This is not a BJP culpability event; it is included because it is directly connected to the BJP remarks controversy and violent communal escalation.",
    sources: ["reutersKanhaiya2022"]
  },
  {
    id: "rahul-disqualification-2023",
    year: 2023,
    date: "24 March-7 August 2023",
    title: "Rahul Gandhi disqualified, then reinstated after Supreme Court stay",
    category: "Institutional integrity",
    actors: ["BJP-linked", "State institution"],
    status: "Court-tested",
    severity: "High",
    summary: "Rahul Gandhi was disqualified from the Lok Sabha after a Gujarat court convicted him in a defamation case brought by a BJP lawmaker over a Modi-surname remark. Parliament reinstated him after the Supreme Court stayed the conviction.",
    outcome: "Freedom House cited the episode under concerns about political-opposition space and institutions.",
    sources: ["ieRahulDisqualified2023", "reutersRahul2023", "freedomHouse2024"]
  },
  {
    id: "adani-hindenburg-2023",
    year: 2023,
    date: "24 January-February 2023",
    title: "Adani-Hindenburg crisis",
    category: "Corporate power",
    actors: ["Corporate", "State institution"],
    status: "Alleged",
    severity: "High",
    summary: "Hindenburg Research accused the Adani Group of improper use of offshore tax havens and stock manipulation; the Adani Group denied wrongdoing. Reuters reported the report triggered a major listed-stock rout and regulator scrutiny.",
    outcome: "The event is recorded as alleged market and regulator controversy; it should not be written as a proven conviction.",
    sources: ["reutersAdani2023", "reutersAdaniRout2023"]
  },
  {
    id: "iit-bhu-gang-rape-2023",
    year: 2023,
    date: "2 November 2023-1 January 2024",
    title: "IIT-BHU gang-rape case and BJP IT cell arrests",
    category: "Sexual violence",
    actors: ["BJP-linked"],
    status: "Charged",
    severity: "Severe",
    summary: "A 20-year-old IIT-BHU student was allegedly gang-raped on campus in November 2023. Times of India reported that two of three men arrested later were BJP IT cell office-bearers in Varanasi.",
    outcome: "This is a direct political-actor sexual-violence entry and needs continued trial-status tracking.",
    sources: ["toiIitBhu2024"]
  },
  {
    id: "one-nation-one-election-2024",
    year: 2024,
    date: "14 March 2024",
    title: "One Nation, One Election federalism controversy",
    category: "Institutional integrity",
    actors: ["BJP-led government", "State institution"],
    status: "Official proposal",
    severity: "Medium",
    summary: "The Kovind committee submitted an 18,626-page report backing simultaneous elections. Opposition parties told the panel the proposal was anti-federal and against the basic structure, while the committee rejected those objections.",
    outcome: "This is a structural electoral-governance controversy, not an atrocity entry.",
    sources: ["pibOneNation2024", "ieOneNation2024"]
  },
  {
    id: "mukesh-chandrakar-2025",
    year: 2025,
    date: "1-3 January 2025",
    title: "Mukesh Chandrakar murder after corruption reporting",
    category: "Press freedom",
    actors: ["State institution", "Corporate"],
    status: "Charged",
    severity: "Severe",
    summary: "Journalist Mukesh Chandrakar, who reported on corruption and local governance in Chhattisgarh, was found killed in a septic tank on a contractor's property. CPJ recorded the case and said police alleged the killing was retaliation for reporting on road construction.",
    outcome: "This is a press-safety and public-contracting corruption entry under a BJP-governed state, but not a settled party-direction allegation.",
    sources: ["cpjMukesh2025"]
  },
  {
    id: "prajwal-conviction-2025",
    year: 2025,
    date: "1-2 August 2025",
    title: "Prajwal Revanna convicted and sentenced to life imprisonment",
    category: "Sexual violence",
    actors: ["NDA ally-linked"],
    status: "Convicted",
    severity: "Severe",
    summary: "A special court convicted former JD(S) MP Prajwal Revanna on 1 August 2025 and sentenced him to life imprisonment the next day in the rape of a domestic worker. He had been the JD(S)-BJP alliance candidate in Hassan in 2024.",
    outcome: "This updates the 2024 scandal with a court-tested conviction in one of the registered cases.",
    sources: ["iePrajwal2025"]
  },
  {
    id: "prajwal-2024",
    year: 2024,
    date: "April-May 2024",
    title: "Prajwal Revanna sexual-abuse scandal",
    category: "Sexual violence",
    actors: ["NDA ally-linked"],
    status: "Investigated",
    severity: "Severe",
    summary: "Karnataka MP Prajwal Revanna of JD(S), then a BJP ally, faced multiple sexual-abuse allegations after videos surfaced during the 2024 election period. He denied wrongdoing in public legal proceedings.",
    outcome: "A special court later convicted and sentenced him to life imprisonment in August 2025 in one rape case; other case status should be tracked separately.",
    sources: ["iePrajwal2025"]
  },
  {
    id: "waqf-murshidabad-2025",
    year: 2025,
    date: "5-12 April 2025",
    title: "Waqf Amendment Act protests and Murshidabad violence",
    category: "Communal violence",
    actors: ["BJP-led government", "State institution"],
    status: "Reported",
    severity: "High",
    summary: "After Parliament cleared the Waqf Amendment framework, protests in West Bengal's Murshidabad district turned violent. NDTV reported three deaths and more than 100 arrests.",
    outcome: "This is included as a central-law fallout and politico-religious violence entry; responsibility for local violence remains event-specific and contested.",
    sources: ["ndtvWaqf2025", "wikipedia2025"]
  },
  {
    id: "ladakh-wangchuk-2025",
    year: 2025,
    date: "24-26 September 2025",
    title: "Leh statehood protests, four killed, Sonam Wangchuk held under NSA",
    category: "Civil liberties",
    actors: ["BJP-led government", "Security forces", "State institution"],
    status: "Reported",
    severity: "High",
    summary: "HRW and Wikipedia's 2025 India lead record four deaths after protests over Ladakh statehood turned violent in Leh. Sonam Wangchuk, associated with peaceful statehood demands, was arrested under the National Security Act.",
    outcome: "This entry tracks protest policing, detention under national-security law, and the post-2019 federal status question.",
    sources: ["hrw2026", "wikipedia2025"]
  },
  {
    id: "x-reuters-2025",
    year: 2025,
    date: "5-7 July 2025",
    title: "Reuters X accounts withheld in India",
    category: "Press freedom",
    actors: ["BJP-led government", "State institution", "Corporate"],
    status: "Reported",
    severity: "High",
    summary: "Reuters' main X accounts became inaccessible in India with a legal-demand notice; the government said no current legal requirement existed and that it was working with X to resolve the issue.",
    outcome: "This is a concrete example of opaque platform blocking and media-access disruption.",
    sources: ["ieReutersX2025"]
  },
  {
    id: "kerala-nuns-2025",
    year: 2025,
    date: "25 July-10 October 2025",
    title: "Kerala nuns arrested in Chhattisgarh after Bajrang Dal complaint",
    category: "Civil liberties",
    actors: ["RSS or ABVP-linked", "BJP-led government", "State institution"],
    status: "Reported",
    severity: "High",
    summary: "Two Kerala nuns were arrested at Durg railway station in Chhattisgarh on allegations of forced conversion and human trafficking. Indian Express later reported the state women's commission asked police to register an FIR against right-wing workers accused of harassment in the episode.",
    outcome: "The entry is a religious-freedom and vigilante-pressure case in a BJP-governed state; trial outcomes still need tracking.",
    sources: ["ieNuns2025", "ieNunsWomenCommission2025", "wikipedia2025"]
  },
  {
    id: "ssc-protests-2025",
    year: 2025,
    date: "24 July-29 August 2025",
    title: "SSC exam glitches and aspirant protests",
    category: "Education",
    actors: ["State institution"],
    status: "Reported",
    severity: "High",
    summary: "Staff Selection Commission exams faced cancellations, software crashes, biometric failures, and wrong centre allotments. Indian Express reported thousands of aspirants protested and the SSC chairman later said technical and operational issues were being resolved.",
    outcome: "This is separate from NEET but belongs in the exam-integrity and youth-accountability track.",
    sources: ["ieSscProtests2025", "ieSscChair2025"]
  },
  {
    id: "air-india-171-2025",
    year: 2025,
    date: "12 June 2025",
    title: "Air India Flight 171 crash",
    category: "Infrastructure",
    actors: ["State institution", "Corporate"],
    status: "Official investigation",
    severity: "Severe",
    summary: "Air India Flight AI-171, a Boeing 787-8 from Ahmedabad to London, crashed shortly after takeoff on 12 June 2025, killing 260 people according to the official accident-investigation statement.",
    outcome: "The AAIB investigation remained ongoing; this is a public-safety and aviation-oversight entry, not a party-specific allegation.",
    sources: ["pibAaib171", "wikipedia2025"]
  },
  {
    id: "red-fort-blast-2025",
    year: 2025,
    date: "10-16 November 2025",
    title: "Delhi Red Fort car explosion investigated under terror law",
    category: "Security and terror",
    actors: ["Terror group", "Security forces", "BJP-led government"],
    status: "Investigated",
    severity: "Severe",
    summary: "A car explosion near Delhi's Red Fort killed at least 13 people and wounded more than 20. Police invoked UAPA, and Al Jazeera later reported an NIA arrest of a Kashmir resident as an alleged accomplice.",
    outcome: "The entry records terror-law investigation and casualties; attribution should follow court and NIA updates.",
    sources: ["aljRedFort2025", "aljRedFortArrest2025"]
  },
  {
    id: "sanchar-saathi-2025",
    year: 2025,
    date: "28 November-3 December 2025",
    title: "Sanchar Saathi preinstall order revoked after backlash",
    category: "Civil liberties",
    actors: ["BJP-led government", "State institution"],
    status: "Official reversed",
    severity: "High",
    summary: "The Department of Telecommunications ordered smartphone makers to preinstall the state-owned Sanchar Saathi app on new devices, then revoked the mandate after backlash over privacy, security, and user autonomy.",
    outcome: "This is a concrete digital-rights entry with an official reversal, not merely a hypothetical surveillance concern.",
    sources: ["ieSanchar2025", "aljSanchar2025"]
  },
  {
    id: "amendment-130-2025",
    year: 2025,
    date: "20 August 2025",
    title: "130th Constitutional Amendment Bill on detained ministers",
    category: "Institutional integrity",
    actors: ["BJP-led government", "State institution"],
    status: "Official proposal",
    severity: "Medium",
    summary: "Amit Shah introduced the Constitution (130th Amendment) Bill, 2025, proposing removal of prime ministers, chief ministers, and ministers detained for 30 consecutive days in serious-offence cases.",
    outcome: "PRS flagged basic-structure concerns around automatic removal; the government framed it as anti-corruption reform.",
    sources: ["pib130th2025", "prs130th2025"]
  },
  {
    id: "vbg-ramg-2025",
    year: 2025,
    date: "16-21 December 2025",
    title: "VB-G RAM G replaces MGNREGA framework",
    category: "Economy",
    actors: ["BJP-led government", "State institution"],
    status: "Official",
    severity: "Medium",
    summary: "The Viksit Bharat Guarantee for Rozgar and Ajeevika Mission (Gramin) Bill, 2025 replaced MGNREGA while increasing the statutory employment guarantee from 100 to 125 days.",
    outcome: "This entry must be written honestly: it is a major policy replacement with a higher guaranteed-days headline, while labour and opposition responses require separate sourcing.",
    sources: ["prsVbGramg2025", "pibVbGramg2025"]
  },
  {
    id: "kashmir-vpn-ban-2025",
    year: 2025,
    date: "29 December 2025",
    title: "Jammu and Kashmir VPN ban",
    category: "Civil liberties",
    actors: ["BJP-led government", "Security forces", "State institution"],
    status: "Official",
    severity: "High",
    summary: "District authorities in Kashmir ordered a two-month VPN ban citing national-security risks. Al Jazeera reported residents and professionals saying the ban added pressure and disrupted secure work.",
    outcome: "This belongs with the Kashmir communications-restriction record and should be updated if the order lapses, is extended, or is challenged.",
    sources: ["aljKashmirVpn2026", "wikipedia2025"]
  },
  {
    id: "kashmir-unrest-2016",
    year: 2016,
    date: "July 2016-2017",
    title: "Kashmir unrest and pellet-gun injuries under PDP-BJP government",
    category: "Police brutality",
    actors: ["Security forces", "BJP-linked", "State institution"],
    status: "Reported",
    severity: "Severe",
    summary: "After Burhan Wani's killing, protests in Jammu and Kashmir were met with pellet guns, tear gas, and live ammunition. HRW called for investigation into lethal force after more than 30 deaths and hundreds of injuries.",
    outcome: "The BJP connection is indirect but real through the central government and the then PDP-BJP state coalition.",
    sources: ["hrwKashmirForce2016"]
  }
];

const indicatorUpserts = [
  {
    title: "GDP per capita",
    value: "$1,553.9 to $2,702.5",
    detail: "World Bank current-dollar GDP per capita rose from 2014 to 2025. This is a real improvement, though current-dollar values are affected by exchange rates and inflation.",
    direction: "Higher",
    sources: ["worldBankGdpPc"],
    chart: [
      { label: "2014", value: 1553.9 },
      { label: "2025", value: 2702.5 }
    ]
  },
  {
    title: "CPI inflation",
    value: "6.67% to 2.40%",
    detail: "World Bank annual CPI inflation was lower in 2025 than in 2014. This is an improvement on that metric, even though food and local price stress can diverge from annual averages.",
    direction: "Lower",
    sources: ["worldBankCpi"],
    chart: [
      { label: "2014", value: 6.67 },
      { label: "2025", value: 2.4 }
    ]
  },
  {
    title: "Internet users",
    value: "16.5% to 70.0%",
    detail: "World Bank data shows internet usage rising sharply from the earliest comparable 2016 value to 2025.",
    direction: "Higher",
    sources: ["worldBankInternet"],
    chart: [
      { label: "2016", value: 16.5 },
      { label: "2025", value: 70 }
    ]
  },
  {
    title: "Unemployment rate",
    value: "6.0% to 3.1%",
    detail: "PLFS usual-status unemployment fell from 2017-18 to 2025. Treat the comparison carefully because the PLFS series and 2025 sampling differ from older employment measures.",
    direction: "Lower",
    sources: ["pibPlfs2017", "pibPlfs2025"],
    chart: [
      { label: "2017-18", value: 6 },
      { label: "2025", value: 3.1 }
    ]
  },
  {
    title: "Lok Sabha turnout",
    value: "66.44% to 66.10%",
    detail: "Election Commission atlas figures show turnout broadly flat between the 2014 and 2024 Lok Sabha elections, with the 2024 note excluding the uncontested Surat seat.",
    direction: "Nearly flat",
    sources: ["eciAtlas2024Turnout"],
    chart: [
      { label: "2014", value: 66.44 },
      { label: "2024", value: 66.1 }
    ]
  },
  {
    title: "Lok Sabha electorate",
    value: "83.41cr to 97.98cr",
    detail: "The electorate rose by about 14.57 crore from 2014 to 2024, while votes polled rose from 55.42 crore to 64.64 crore.",
    direction: "Higher participation base",
    sources: ["eciAtlas2024Votes"],
    chart: [
      { label: "2014 electorate", value: 83.41 },
      { label: "2024 electorate", value: 97.98 },
      { label: "2014 votes", value: 55.42 },
      { label: "2024 votes", value: 64.64 }
    ]
  },
  {
    title: "Winning MPs with criminal cases",
    value: "34% to 46%",
    detail: "ADR affidavit analysis shows winning Lok Sabha candidates with declared criminal cases rose from 185 of 542 in 2014 to 251 of 543 in 2024.",
    direction: "Worse",
    sources: ["adrLokSabha2024", "adrLokSabha2024Details"],
    chart: [
      { label: "2014", value: 34 },
      { label: "2024", value: 46 }
    ]
  },
  {
    title: "Winning MPs with serious criminal cases",
    value: "21% to 31%",
    detail: "ADR/NEW figures show winning Lok Sabha candidates with declared serious criminal cases rose from 112 of 542 in 2014 to 170 of 543 in 2024.",
    direction: "Worse",
    sources: ["adrLokSabha2024Details"],
    chart: [
      { label: "2014", value: 21 },
      { label: "2024", value: 31 }
    ]
  },
  {
    title: "Crorepati winning MPs",
    value: "82% to 93%",
    detail: "ADR/NEW figures show the share of winning Lok Sabha candidates declaring assets above Rs 1 crore rose from 82% in 2014 to 93% in 2024.",
    direction: "More wealth concentration",
    sources: ["adrLokSabha2024Details"],
    chart: [
      { label: "2014", value: 82 },
      { label: "2024", value: 93 }
    ]
  },
  {
    title: "Freedom House status",
    value: "Free to Partly Free",
    detail: "Freedom House assessed India as Free in 2014 under its older rating scale and Partly Free with a 62/100 score in 2026. The scales are not directly numeric-comparable.",
    direction: "Worse",
    sources: ["freedomHouse2014", "freedomHouse2026"],
    chart: [
      { label: "2026 score", value: 62 }
    ]
  },
  {
    title: "Internet shutdowns",
    value: "6 to 54",
    detail: "SFLC's India shutdown tracker lists 6 shutdowns in 2014 and 54 in 2025, with 2026 still incomplete at 21 YTD in the captured research note.",
    direction: "Worse",
    sources: ["sflcShutdowns"],
    chart: [
      { label: "2014", value: 6 },
      { label: "2025", value: 54 },
      { label: "2026 YTD", value: 21 }
    ]
  },
  {
    title: "Suicide incidence",
    value: "131,666 to 171,418",
    detail: "NCRB-linked data shows total reported suicides rose from 131,666 in 2014 to 171,418 in 2023. These numbers depend on state and UT reporting.",
    direction: "Higher reported volume",
    sources: ["pibSuicides2014", "dataGovSuicides2023"],
    chart: [
      { label: "2014", value: 131666 },
      { label: "2023", value: 171418 }
    ]
  },
  {
    title: "Press freedom rank",
    value: "140/180 to 157/180",
    detail: "India ranked 140 in RSF's 2014 index and 157 in the 2026 index. RSF scores fell from 59.66 to 31.96, but methodology changes mean the trend should be read carefully.",
    direction: "Worse",
    sources: ["rsf2014", "rsfIndia"],
    chart: [
      { label: "2014", value: 140 },
      { label: "2025", value: 151 },
      { label: "2026", value: 157 }
    ]
  }
];

const categoryBacklog = [
  ["130th Constitutional Amendment Bill", "2025", "Bharatiya Janata Party controversies", "direct", true, "Added to timeline as amendment-130-2025."],
  ["2025 Indian electoral controversy", "2025", "Bharatiya Janata Party controversies", "direct", false, "Keep as opposition-claim lead until stronger non-opposition evidence is attached."],
  ["2026 West Bengal election controversies", "2026", "Bharatiya Janata Party controversies / Political riots / West Bengal violence", "indirect", false, "Future/live topic; add only after stable reporting."],
  ["Demolition of the Babri Masjid", "1992", "Bharatiya Janata Party controversies", "direct", false, "Pre-2014 historical context; not part of current timeline unless adding prelude section."],
  ["Cockroach Janta Party", "2026", "Bharatiya Janata Party controversies", "indirect", false, "Live protest-politics lead; needs stable sourcing."],
  ["Disqualification of Rahul Gandhi", "2023", "Bharatiya Janata Party controversies", "direct", true, "Added to timeline as rahul-disqualification-2023."],
  ["Godi media", "2014-2026", "Bharatiya Janata Party controversies", "direct", false, "Better handled through press-freedom indicators and source-specific media-pressure events."],
  ["2002 Gujarat violence", "2002", "Bharatiya Janata Party controversies", "direct", true, "Already included as pre-2014 context entry."],
  ["India: The Modi Question", "2023", "Bharatiya Janata Party controversies", "direct", true, "Already covered through BBC raid/documentary entry."],
  ["2020-2021 Indian farmers' protest", "2020-2021", "Bharatiya Janata Party controversies", "direct", true, "Already covered through farm laws, protests, and repeal."],
  ["2021 Kawardha riots", "2021", "Bharatiya Janata Party controversies / Political riots", "indirect", false, "Needs stronger event-specific source before timeline inclusion."],
  ["Murder of Kanhaiya Lal", "2022", "Bharatiya Janata Party controversies", "indirect", true, "Added as connected to Nupur Sharma remarks, not as BJP culpability."],
  ["2022 Muhammad remarks controversy", "2022", "Bharatiya Janata Party controversies", "direct", true, "Added as nupur-sharma-remarks-2022."],
  ["Indira Oinam", "unknown", "Bharatiya Janata Party controversies", "unclear", false, "Needs identification and reliable source."],
  ["One Nation, One Election", "2023-2025", "Bharatiya Janata Party controversies", "direct", true, "Added as one-nation-one-election-2024."],
  ["Ram Rath Yatra", "1990", "Bharatiya Janata Party controversies", "direct", false, "Pre-2014 context; backlog only."],
  ["2023 IIT-BHU gang rape", "2023", "Bharatiya Janata Party controversies", "direct", true, "Added as iit-bhu-gang-rape-2023."],
  ["Roshni Act controversy", "2020", "Bharatiya Janata Party controversies", "indirect", false, "Needs clear Modi-era governance link and stronger sources."],
  ["Sanchar Saathi", "2025", "Bharatiya Janata Party controversies", "direct", true, "Added as sanchar-saathi-2025."],
  ["Shaheen Bagh protest", "2019-2020", "Bharatiya Janata Party controversies", "direct", false, "Already partly represented through CAA/anti-CAA protest entries; standalone card pending."],
  ["Death of Sohrabuddin Sheikh", "2005", "Bharatiya Janata Party controversies", "direct", false, "Pre-2014 context; linked to Loya/Gujarat prelude if needed."],
  ["Viksit Bharat-G RAM G Act, 2025", "2025", "Bharatiya Janata Party controversies", "direct", true, "Added as vbg-ramg-2025 with positive 125-day guarantee noted."],
  ["2021 West Bengal post-poll violence", "2021", "Political riots / West Bengal violence", "indirect", false, "BJP victims/opposition claims need careful source-specific entry."],
  ["2025 Nagpur violence", "2025", "Political riots", "indirect", false, "Needs stronger non-Wikipedia source before inclusion."],
  ["1966 anti-cow slaughter riot", "1966", "Political riots", "not_bjp", false, "Historical, outside scope."],
  ["1970 Bhiwandi riots", "1970", "Political riots", "not_bjp", false, "Historical, outside scope."],
  ["Dinakaran attack", "2007", "Political riots", "not_bjp", false, "Outside requested BJP/RSS/government scope."],
  ["2021 Indian farmers' Republic Day protest", "2021", "Political riots", "direct", false, "Covered by farmers protest entries; can add if sourced separately."],
  ["1961 Jabalpur riots", "1961", "Political riots", "not_bjp", false, "Historical, outside scope."],
  ["Kadakkal Revolt", "1938", "Political riots", "not_bjp", false, "Historical, outside scope."],
  ["2016 Kaliachak riots", "2016", "Political riots / West Bengal violence", "unclear", false, "Not clearly BJP-governed; backlog only."],
  ["Attack on Arvind Kejriwal's residence", "2022", "Political riots", "direct", false, "Needs source and legal status before timeline inclusion."],
  ["2007 Kolkata riots", "2007", "Political riots / West Bengal violence", "not_bjp", false, "Historical, outside scope."],
  ["2013 Marakkanam violence", "2013", "Political riots", "not_bjp", false, "Pre-2014 and not clearly BJP."],
  ["Murshidabad violence", "2025", "Political riots / West Bengal violence", "direct", true, "Added as waqf-murshidabad-2025."],
  ["2001 Odisha Assembly attack", "2001", "Political riots", "not_bjp", false, "Pre-2014, outside scope."],
  ["Prince of Wales riots", "1921", "Political riots", "not_bjp", false, "Historical, outside scope."],
  ["1957 Ramnad riots", "1957", "Political riots", "not_bjp", false, "Historical, outside scope."],
  ["Sandeshkhali violence", "2024", "Political riots", "indirect", false, "TMC-governed state; BJP relevance is opposition mobilization. Needs separate sourcing."],
  ["2006 Vadodara riots", "2006", "Political riots / Police brutality", "direct", false, "Pre-2014 Gujarat BJP context; backlog only."],
  ["2023 West Bengal local elections violence", "2023", "Political riots / West Bengal violence", "indirect", false, "Not BJP-governed; include only if BJP/RSS link is source-specific."],
  ["List of cases of police brutality in India", "various", "Police brutality", "unclear", false, "Category index only; not an event."],
  ["2015 sandalwood smugglers encounter in Andhra Pradesh", "2015", "Police brutality", "indirect", false, "NDA-era but not clearly BJP-directed; needs source."],
  ["2018 Bengali teacher recruitment movement", "2018", "Police brutality", "not_bjp", false, "West Bengal state issue; backlog only."],
  ["2018 Thoothukudi protest shooting", "2018", "Police brutality", "indirect", false, "AIADMK-era Tamil Nadu; not clearly BJP."],
  ["2020 Bangalore riots", "2020", "Police brutality", "direct", false, "Karnataka BJP government; needs event-specific source."],
  ["Murders of P. Jayaraj and J. Bennix", "2020", "Police brutality", "not_bjp", false, "Tamil Nadu police custody case; not clearly BJP."],
  ["Death of Somnath Suryawanshi", "unknown", "Police brutality", "unclear", false, "Needs identification and source."],
  ["2019 Jamia Millia Islamia attack", "2019", "Police brutality", "direct", false, "Covered through anti-CAA/police crackdown; standalone source-specific card pending."],
  ["2016-2017 Kashmir unrest", "2016-2017", "Police brutality", "direct", true, "Added as kashmir-unrest-2016."],
  ["Killing of Moinul Haque", "2021", "Police brutality", "direct", true, "Added as moinul-haque-assam-2021."],
  ["Killing of Tulsiram Prajapati", "2006", "Police brutality", "direct", false, "Pre-2014 Gujarat/encounter context; backlog only."],
  ["2017 Baduria riots", "2017", "West Bengal violence", "indirect", false, "Not BJP-governed; source-specific BJP/RSS role needed."],
  ["2022 Birbhum violence", "2022", "West Bengal violence", "not_bjp", false, "TMC-governed state issue; backlog only."],
  ["2013 Canning riots", "2013", "West Bengal violence", "not_bjp", false, "Pre-2014 and not clearly BJP."],
  ["2010 Deganga riots", "2010", "West Bengal violence", "not_bjp", false, "Pre-2014 and not clearly BJP."],
  ["2016 Dhulagarh riots", "2016", "West Bengal violence", "unclear", false, "Not BJP-governed; needs source-specific link."],
  ["Nandigram violence", "2007", "West Bengal violence / Police brutality", "not_bjp", false, "Pre-2014 and not BJP."],
  ["Angamaly police firing", "1959", "Police brutality", "not_bjp", false, "Historical, outside scope."],
  ["Anti-POSCO movement", "2005-2017", "Police brutality", "unclear", false, "Needs source-specific BJP/government relevance."],
  ["Hashimpura massacre", "1987", "Police brutality", "not_bjp", false, "Historical, outside scope."],
  ["1985 Gujarat riots", "1985", "Police brutality", "not_bjp", false, "Historical, outside scope."],
  ["Tata Nano Singur controversy", "2006-2008", "Police brutality", "not_bjp", false, "Pre-2014 and not BJP."],
  ["Uttawar forced sterilisations", "1976", "Police brutality", "not_bjp", false, "Emergency-era historical case."]
].map(([title, years, sourcePage, bjpRelevance, includeInTimeline, nextStep], index) => ({
  id: title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || `lead-${index}`,
  title,
  years,
  sourcePage,
  bjpRelevance,
  includeInTimeline,
  status: includeInTimeline ? "promoted_or_covered" : "research_backlog",
  nextStep,
  sourceKeys: sourcePage.includes("Bharatiya") ? ["wikipediaBjpControversies"] :
    sourcePage.includes("Police") ? ["wikipediaPoliceBrutality"] :
    sourcePage.includes("West Bengal") ? ["wikipediaWbViolence"] :
    ["wikipediaPoliticalRiots"]
}));

const sources = readJson("sources.json", {});
Object.assign(sources, sourceUpdates);
writeJson("sources.json", sources);

const currentEvents = readJson("events.json", []);
const byId = new Map(currentEvents.filter((event) => !eventRemovals.includes(event.id)).map((event) => [event.id, event]));
for (const event of eventUpserts) {
  byId.set(event.id, event);
}
const statusCorrections = {
  "gujarat-2002-prelude": "Court-tested",
  "bhima-koregaon-elgar-2018-2024": "Court-tested",
  "kashmir-vpn-ban-2025": "Official",
  "custody-2025": "Reported"
};
for (const [id, status] of Object.entries(statusCorrections)) {
  if (byId.has(id)) {
    byId.get(id).status = status;
  }
}
const mergedEvents = Array.from(byId.values()).sort((a, b) => {
  if (a.year !== b.year) return a.year - b.year;
  return String(a.date).localeCompare(String(b.date));
});
writeJson("events.json", mergedEvents);

const indicators = readJson("indicators.json", []);
const indicatorsByTitle = new Map(indicators.map((indicator) => [indicator.title, indicator]));
for (const indicator of indicatorUpserts) {
  indicatorsByTitle.set(indicator.title, indicator);
}
writeJson("indicators.json", Array.from(indicatorsByTitle.values()));

const backlogById = new Map(readJson("research_backlog.json", []).map((item) => [item.id, item]));
for (const item of categoryBacklog) {
  backlogById.set(item.id, item);
}
writeJson("research_backlog.json", Array.from(backlogById.values()).sort((a, b) => a.title.localeCompare(b.title)));
