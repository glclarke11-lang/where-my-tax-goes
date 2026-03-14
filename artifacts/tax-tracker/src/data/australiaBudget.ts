export interface MicroCategory {
  key: string;
  label: string;
  percentage: number;
  description: string;
}

export interface MacroCategory {
  key: string;
  label: string;
  color: string;
  micros: MicroCategory[];
}

export const TOTAL_BUDGET_BILLIONS_AUD = 690;
export const FISCAL_YEAR = "2024-25";

export const AUSTRALIA_BUDGET: MacroCategory[] = [
  {
    key: "social_security_welfare",
    label: "Social Security & Welfare",
    color: "#8B5CF6",
    micros: [
      {
        key: "age_pension",
        label: "Age Pension",
        percentage: 0.1296,
        description: "Fortnightly pension payments for Australians aged 67+ who meet residency and income/assets tests.",
      },
      {
        key: "disability_support",
        label: "Disability Support Pension",
        percentage: 0.0576,
        description: "Income support for Australians with a permanent disability, illness, or injury that prevents work.",
      },
      {
        key: "family_tax_benefits",
        label: "Family Tax Benefits",
        percentage: 0.0432,
        description: "Part A and Part B payments helping families with the cost of raising children.",
      },
      {
        key: "jobseeker",
        label: "JobSeeker Payment",
        percentage: 0.0360,
        description: "Financial support for job-seekers aged 22 to pension age actively looking for work.",
      },
      {
        key: "carer_payments",
        label: "Carer Payment & Allowance",
        percentage: 0.0288,
        description: "Payments for Australians providing constant care to someone with a severe disability or medical condition.",
      },
      {
        key: "rent_assistance",
        label: "Commonwealth Rent Assistance",
        percentage: 0.0252,
        description: "Non-taxable rental subsidy for eligible people who pay rent in the private or community housing sector.",
      },
      {
        key: "childcare_subsidy",
        label: "Child Care Subsidy",
        percentage: 0.0216,
        description: "Means-tested subsidy reducing the cost of approved childcare for families.",
      },
      {
        key: "parenting_payments",
        label: "Parenting Payment",
        percentage: 0.0180,
        description: "Income support for primary carers of young children who are single or partnered.",
      },
    ],
  },
  {
    key: "health",
    label: "Health",
    color: "#10B981",
    micros: [
      {
        key: "hospitals",
        label: "Public Hospitals",
        percentage: 0.0512,
        description: "Commonwealth contribution to public hospital funding through the National Health Reform Agreement with states and territories.",
      },
      {
        key: "medicare",
        label: "Medicare Benefits",
        percentage: 0.0384,
        description: "Subsidised access to GP visits, specialist services, diagnostic imaging, and pathology under the Medicare Benefits Schedule.",
      },
      {
        key: "pharmaceuticals",
        label: "Pharmaceutical Benefits Scheme",
        percentage: 0.0256,
        description: "PBS subsidises the cost of a wide range of medicines for all Australians.",
      },
      {
        key: "aged_care",
        label: "Aged Care",
        percentage: 0.0224,
        description: "Home care packages, residential aged care, and support services for older Australians.",
      },
      {
        key: "mental_health",
        label: "Mental Health",
        percentage: 0.0080,
        description: "Headspace, Beyond Blue, NDIS mental health services, and Better Access to Mental Health Care.",
      },
      {
        key: "indigenous_health",
        label: "Indigenous Health",
        percentage: 0.0048,
        description: "Aboriginal Community Controlled Health Organisations, Closing the Gap health initiatives, and ear/eye health programs.",
      },
      {
        key: "medical_research",
        label: "Medical Research (NHMRC)",
        percentage: 0.0048,
        description: "National Health and Medical Research Council grants for clinical and population health research.",
      },
      {
        key: "public_health",
        label: "Public Health Programs",
        percentage: 0.0032,
        description: "Immunisation programs, chronic disease prevention, and population health surveillance.",
      },
      {
        key: "private_insurance_rebate",
        label: "Private Health Insurance Rebate",
        percentage: 0.0016,
        description: "Means-tested rebate for Australians holding private hospital cover to ease pressure on public hospitals.",
      },
    ],
  },
  {
    key: "general_public_services",
    label: "General Public Services",
    color: "#6B7280",
    micros: [
      {
        key: "debt_interest",
        label: "Public Debt Interest",
        percentage: 0.0560,
        description: "Interest payments on Commonwealth Government Securities — the cost of financing the national debt.",
      },
      {
        key: "federal_agencies",
        label: "Federal Agency Operations",
        percentage: 0.0280,
        description: "Running costs of the APS including the Department of Finance, PM&C, and central government operations.",
      },
      {
        key: "tax_admin",
        label: "ATO & Tax Administration",
        percentage: 0.0210,
        description: "Australian Taxation Office operations for collecting revenue, administering superannuation, and compliance.",
      },
      {
        key: "foreign_affairs",
        label: "Foreign Affairs (DFAT)",
        percentage: 0.0140,
        description: "Department of Foreign Affairs and Trade operations, consular services, trade promotion, and treaty obligations.",
      },
      {
        key: "parliament_courts",
        label: "Parliament, Courts & Attorney-General",
        percentage: 0.0140,
        description: "Parliament of Australia, federal courts, the AFP, ASIO, and the Attorney-General's Department.",
      },
      {
        key: "immigration",
        label: "Immigration & Border Force",
        percentage: 0.0070,
        description: "Home Affairs, Australian Border Force, visa processing, citizenship, and refugee programs.",
      },
    ],
  },
  {
    key: "education",
    label: "Education",
    color: "#3B82F6",
    micros: [
      {
        key: "public_schools",
        label: "Government Schools",
        percentage: 0.0240,
        description: "Commonwealth contribution to public school funding under the National School Reform Agreement.",
      },
      {
        key: "private_schools",
        label: "Non-Government Schools",
        percentage: 0.0160,
        description: "SES-based funding for Catholic and Independent schools under the Australian Education Act.",
      },
      {
        key: "universities",
        label: "Universities & Higher Education",
        percentage: 0.0144,
        description: "Commonwealth Grant Scheme funding for higher education places at public and private universities.",
      },
      {
        key: "student_loans",
        label: "HELP / HECS Student Loans",
        percentage: 0.0080,
        description: "Higher Education Loan Program providing income-contingent loans for tuition fees.",
      },
      {
        key: "vocational",
        label: "Vocational Education (TAFE/VET)",
        percentage: 0.0080,
        description: "Fee-Free TAFE places, National Skills Agreement, and apprenticeship incentives.",
      },
      {
        key: "research_grants",
        label: "Research Grants (ARC)",
        percentage: 0.0056,
        description: "Australian Research Council Discovery, Linkage, and Centre of Excellence grants.",
      },
      {
        key: "early_childhood",
        label: "Early Childhood Education",
        percentage: 0.0024,
        description: "Universal Access to Early Childhood Education for all children in the year before school.",
      },
      {
        key: "education_infra",
        label: "Education Infrastructure",
        percentage: 0.0016,
        description: "Building Education Revolution successor programs and capital grants for school upgrades.",
      },
    ],
  },
  {
    key: "defence",
    label: "Defence",
    color: "#EF4444",
    micros: [
      {
        key: "weapons_procurement",
        label: "Weapons & Platforms (AUKUS)",
        percentage: 0.0176,
        description: "Major capital equipment including AUKUS nuclear submarines, frigates, and joint strike fighters.",
      },
      {
        key: "army",
        label: "Army",
        percentage: 0.0160,
        description: "Australian Army personnel, armoured vehicles, rotary-wing aircraft, and land combat systems.",
      },
      {
        key: "air_force",
        label: "Air Force (RAAF)",
        percentage: 0.0160,
        description: "Royal Australian Air Force operations, F-35A fighters, surveillance aircraft, and base operations.",
      },
      {
        key: "navy",
        label: "Navy (RAN)",
        percentage: 0.0144,
        description: "Royal Australian Navy surface combatants, submarines, patrol vessels, and maritime operations.",
      },
      {
        key: "intelligence_cyber",
        label: "Intelligence & Cyber (ASD)",
        percentage: 0.0080,
        description: "Australian Signals Directorate, ASIS, DIO, and ACSC cyber security and intelligence gathering.",
      },
      {
        key: "personnel",
        label: "Personnel & Facilities",
        percentage: 0.0056,
        description: "Base services, housing, training, logistics, and support for ADF personnel.",
      },
      {
        key: "veteran_services",
        label: "Veteran Services (DVA)",
        percentage: 0.0024,
        description: "Department of Veterans' Affairs compensation, healthcare, and rehabilitation for former service members.",
      },
    ],
  },
  {
    key: "transport_infrastructure",
    label: "Transport & Infrastructure",
    color: "#F97316",
    micros: [
      {
        key: "roads",
        label: "Road Infrastructure",
        percentage: 0.0210,
        description: "Infrastructure Investment Program for national highways, Black Spot Program, and state road funding.",
      },
      {
        key: "rail_transit",
        label: "Rail & Urban Congestion",
        percentage: 0.0150,
        description: "City and regional rail projects, Urban Congestion Fund, and commuter infrastructure.",
      },
      {
        key: "airports_ports",
        label: "Airports, Ports & Freight",
        percentage: 0.0090,
        description: "Aviation safety (CASA/ATSB), regional airports, port development, and freight logistics.",
      },
      {
        key: "nbn_comms",
        label: "NBN & Communications",
        percentage: 0.0090,
        description: "National Broadband Network investment, telecommunications regulation, and spectrum management.",
      },
      {
        key: "water_infra",
        label: "Water Infrastructure",
        percentage: 0.0060,
        description: "Murray-Darling Basin Plan, national water grid, drought infrastructure, and water security projects.",
      },
    ],
  },
  {
    key: "other_economic",
    label: "Other Economic Affairs",
    color: "#F59E0B",
    micros: [
      {
        key: "industry_innovation",
        label: "Industry & Innovation",
        percentage: 0.0150,
        description: "R&D Tax Incentive, Industry Growth Program, National Reconstruction Fund, and manufacturing support.",
      },
      {
        key: "agriculture",
        label: "Agriculture & Resources",
        percentage: 0.0125,
        description: "Farm household allowance, drought support, export market development, and biosecurity.",
      },
      {
        key: "tourism_trade",
        label: "Tourism & Trade (Austrade)",
        percentage: 0.0075,
        description: "Tourism Australia, Export Market Development Grants, free trade agreement implementation.",
      },
      {
        key: "small_business",
        label: "Small Business Support",
        percentage: 0.0075,
        description: "Small Business Energy Incentive, instant asset write-off, and business advisory services.",
      },
      {
        key: "clean_energy",
        label: "Clean Energy (ARENA/CER)",
        percentage: 0.0075,
        description: "Australian Renewable Energy Agency, Clean Energy Finance Corporation, and Rewiring the Nation.",
      },
    ],
  },
  {
    key: "environment_culture",
    label: "Environment & Culture",
    color: "#22C55E",
    micros: [
      {
        key: "env_protection",
        label: "Environmental Protection",
        percentage: 0.0120,
        description: "EPBC Act enforcement, Great Barrier Reef protection, threatened species recovery, and land care.",
      },
      {
        key: "national_parks",
        label: "National Parks & Heritage",
        percentage: 0.0080,
        description: "Parks Australia, World Heritage site management, and Australian Institute of Aboriginal Studies.",
      },
      {
        key: "arts_broadcasting",
        label: "Arts, ABC & SBS",
        percentage: 0.0080,
        description: "Australia Council for the Arts, Australian Broadcasting Corporation, and SBS public funding.",
      },
      {
        key: "climate_change",
        label: "Climate Change Initiatives",
        percentage: 0.0080,
        description: "Safeguard Mechanism, Net Zero Plan, $20B Rewiring the Nation, and emissions reduction funds.",
      },
      {
        key: "science_space",
        label: "Science & Space (CSIRO/ASA)",
        percentage: 0.0040,
        description: "CSIRO research programs, Australian Space Agency, Antarctic Division, and Bureau of Meteorology.",
      },
    ],
  },
  {
    key: "international_relations",
    label: "International Relations & Aid",
    color: "#06B6D4",
    micros: [
      {
        key: "oda",
        label: "Official Development Assistance",
        percentage: 0.0150,
        description: "Australia's foreign aid budget managed by DFAT — health, education, disaster relief across the Indo-Pacific.",
      },
      {
        key: "diplomatic_missions",
        label: "Diplomatic Missions",
        percentage: 0.0090,
        description: "Embassies, high commissions, consulates, and multilateral engagement (UN, WTO, G20).",
      },
      {
        key: "pacific_stepup",
        label: "Pacific Engagement",
        percentage: 0.0060,
        description: "Pacific Australia Labour Mobility, Pacific Policing Initiative, and climate resilience funding.",
      },
    ],
  },
];
