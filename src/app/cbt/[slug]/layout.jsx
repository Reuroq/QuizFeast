const SEO = {
  cyber_awareness: { title: 'Cyber Awareness Challenge Answers 2025/2026', description: 'Complete Cyber Awareness Challenge answers. 122 questions on phishing, PII, spillage, social engineering, CUI.', keywords: 'cyber awareness challenge answers 2025 2026, DoD cyber awareness, CAC answers, DISA cyber awareness' },
  insider_threat: { title: 'Insider Threat Awareness Answers', description: 'Complete Insider Threat Awareness answers. 61 questions on behavioral indicators, reporting, hotspots, case studies.', keywords: 'insider threat awareness answers, insider threat training, CDSE insider threat' },
  opsec: { title: 'OPSEC Awareness Answers', description: 'Complete OPSEC Awareness answers. 61 questions on the 5-step process, critical information, countermeasures.', keywords: 'OPSEC answers, operations security, OPSEC CBT answers' },
  antiterrorism: { title: 'Antiterrorism Level 1 Answers', description: 'Complete AT Level 1 answers. 61 questions on FPCON, active shooter, IED, iSALUTE.', keywords: 'antiterrorism level 1 answers, AT level 1, JKO antiterrorism, FPCON levels' },
  hipaa_privacy: { title: 'HIPAA & Privacy Act Training Answers', description: 'Complete HIPAA answers. 58 questions on PHI, breach notification, patient rights.', keywords: 'HIPAA training answers, Privacy Act answers, JKO HIPAA' },
  law_of_war: { title: 'Law of War Answers', description: 'Complete Law of War answers. 56 questions on Geneva Conventions, ROE, targeting, war crimes.', keywords: 'law of war answers, LOAC answers, JKO law of war' },
  sere: { title: 'SERE 100.2 Answers', description: 'Complete SERE 100.2 answers. 50 questions on Code of Conduct, survival, evasion, resistance.', keywords: 'SERE 100.2 answers, SERE training, Code of Conduct answers' },
  cbrn: { title: 'CBRN Awareness Answers', description: 'Complete CBRN Awareness answers. 50 questions on MOPP levels, chemical agents, decontamination.', keywords: 'CBRN answers, MOPP levels, chemical warfare answers' },
  ctip: { title: 'CTIP Answers — Combating Trafficking in Persons', description: 'Complete CTIP answers. 50 questions on trafficking indicators, DoD policy, TVPA.', keywords: 'CTIP answers, combating trafficking answers, JKO CTIP' },
  tarp: { title: 'TARP Answers — Threat Awareness & Reporting', description: 'Complete TARP answers. 44 questions on foreign intelligence, elicitation, CI reporting.', keywords: 'TARP answers, threat awareness reporting, counterintelligence training' },
  force_protection: { title: 'Force Protection Answers', description: 'Complete Force Protection answers. 39 questions on physical security, access control, bomb threats.', keywords: 'force protection answers, physical security training' },
  sapr: { title: 'SAPR Answers — Sexual Assault Prevention & Response', description: 'Complete SAPR answers. 42 questions on restricted/unrestricted reporting, SARC, bystander intervention.', keywords: 'SAPR answers, SAPR training, sexual assault prevention answers' },
  suicide_prevention: { title: 'Suicide Prevention Training Answers', description: 'Complete Suicide Prevention answers. 43 questions on ACE model, warning signs, crisis resources.', keywords: 'suicide prevention training answers, ACE model, military crisis line' },
  equal_opportunity: { title: 'Equal Opportunity Training Answers', description: 'Complete EO/EEO answers. 41 questions on protected categories, harassment, complaint procedures.', keywords: 'equal opportunity answers, EEO training answers, MEO answers' },
  cui: { title: 'CUI Training Answers — Controlled Unclassified Information', description: 'Complete CUI answers. 41 questions on CUI marking, safeguarding, NIST 800-171.', keywords: 'CUI training answers, controlled unclassified information, CUI marking' },
  ethics: { title: 'DoD Ethics Training Answers', description: 'Complete DoD Ethics answers. 40 questions on gift rules, Hatch Act, financial disclosure.', keywords: 'DoD ethics training answers, government ethics, Hatch Act' },
  risk_management: { title: 'Composite Risk Management Answers', description: 'Complete CRM/ORM answers. 41 questions on the 5-step process, risk matrix, hazard ID.', keywords: 'composite risk management answers, CRM answers, ORM answers' },
  sejpme: { title: 'SEJPME I Answers', description: 'Complete SEJPME I answers. 48 questions on joint operations, combatant commands, joint planning.', keywords: 'SEJPME answers, SEJPME I, joint professional military education' },
  information_security: { title: 'Information Security Training Answers', description: 'Complete Info Security answers. 42 questions on classification, clearances, markings.', keywords: 'information security training answers, security clearance, classification levels' },
  records_management: { title: 'Records Management Training Answers', description: 'Complete Records Management answers. 40 questions on Federal Records Act, disposition, FOIA.', keywords: 'records management training answers, federal records act' },
  dod_cyber_fundamentals: { title: 'Cyber Fundamentals Answers', description: 'Complete Cyber Fundamentals answers. 41 questions on PKI, RMF, FISMA, incident response.', keywords: 'cyber fundamentals answers, RMF answers, information assurance' },
  driving_for_life: { title: 'Driving for Life Answers', description: 'Complete Driving for Life answers. 40 questions on distracted driving, DUI, motorcycle safety.', keywords: 'driving for life answers, POV safety, JKO driving for life' },
  hazmat: { title: 'HAZMAT / HAZCOM Training Answers', description: 'Complete HAZMAT answers. 41 questions on GHS labels, SDS, PPE, spill response.', keywords: 'HAZMAT training answers, HAZCOM answers, GHS labels, SDS' },
  sharp: { title: 'Army SHARP Training Answers', description: 'Complete SHARP answers. 51 questions on reporting, bystander intervention, AR 600-20.', keywords: 'SHARP answers, Army SHARP training, sexual harassment prevention' },
  army_values: { title: 'Army Values & Leadership Answers', description: 'Complete Army Values answers. 44 questions on LDRSHIP, Soldier\'s Creed, ADP 6-22.', keywords: 'Army values answers, LDRSHIP, Soldier Creed, ADP 6-22' },
  air_force_pme: { title: 'Air Force PME / PDG Study Answers', description: 'Complete AF PME answers. 52 questions on enlisted force, EPR, promotion, core values.', keywords: 'Air Force PME answers, PDG answers, AF promotion, AFI 36-2618' },
  navy_bmt: { title: 'Navy GMT / BMR Answers', description: 'Complete Navy GMT answers. 50 questions on ranks, core values, watch standing, damage control.', keywords: 'Navy GMT answers, BMR answers, Navy general military training' },
  ucmj: { title: 'UCMJ Basics Answers', description: 'Complete UCMJ answers. 50 questions on punitive articles, NJP, courts-martial, Article 31.', keywords: 'UCMJ answers, Article 15 answers, courts-martial, military justice' },
  pii_training: { title: 'PII Training Answers', description: 'Complete PII answers. 40 questions on PII/PHI, breach reporting, safeguarding, encryption.', keywords: 'PII training answers, personally identifiable information, PII CBT' },
  dod_annual_security: { title: 'Annual Security Awareness Refresher Answers', description: 'Complete Security Awareness answers. 39 questions on insider threat, CI, social media.', keywords: 'annual security awareness answers, security refresher training, CDSE' },
  wmd: { title: 'Combating WMD Answers', description: 'Complete CWMD answers. 36 questions on proliferation, counterproliferation, treaty compliance.', keywords: 'combating WMD answers, CWMD, weapons of mass destruction training' },
  trafficking_awareness: { title: 'Human Trafficking Awareness Answers', description: 'Complete trafficking awareness answers. 36 questions on indicators, TVPA, victim ID.', keywords: 'human trafficking awareness answers, trafficking training, TVPA' },
  domestic_violence: { title: 'Domestic Violence / FAP Training Answers', description: 'Complete DV/FAP answers. 36 questions on warning signs, safety planning, MPOs.', keywords: 'domestic violence training answers, family advocacy program, FAP' },
  financial_readiness: { title: 'Military Financial Readiness Answers', description: 'Complete financial readiness answers. 36 questions on TSP, BAH, SCRA, SBP.', keywords: 'military financial readiness answers, TSP, SCRA, military pay' },
  first_aid: { title: 'TCCC / Military First Aid Answers', description: 'Complete TCCC answers. 54 questions on MARCH, tourniquet, 9-line MEDEVAC.', keywords: 'TCCC answers, military first aid, MARCH algorithm, tactical combat casualty care' },
};

export async function generateMetadata({ params }) {
  const { slug } = params;
  const seo = SEO[slug];

  if (!seo) {
    return { title: 'CBT Not Found | QuizFeast' };
  }

  return {
    title: `${seo.title} — All Questions & Answers | QuizFeast`,
    description: `${seo.description} Free.`,
    keywords: seo.keywords,
    openGraph: {
      title: `${seo.title} | QuizFeast`,
      description: seo.description,
      type: 'article',
    },
  };
}

export default function CBTLayout({ children }) {
  return children;
}
