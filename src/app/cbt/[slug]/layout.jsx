const SEO = {
  cyber_awareness: {
    title: 'Cyber Awareness Challenge Answers 2025/2026 — All Questions & Answers | QuizFeast',
    description: 'Complete Cyber Awareness Challenge answers for 2025/2026. 122 questions covering phishing, PII, spillage, social engineering, CUI, and more. Free DoD CBT answers.',
    keywords: 'cyber awareness challenge answers, cyber awareness challenge 2025, cyber awareness challenge 2026, DoD cyber awareness answers, CAC answers, DISA cyber awareness',
  },
  insider_threat: {
    title: 'Insider Threat Awareness Answers — All Questions & Answers | QuizFeast',
    description: 'Complete Insider Threat Awareness training answers. 61 questions on behavioral indicators, reporting, the 6 hotspots, and real case studies. Free.',
    keywords: 'insider threat awareness answers, insider threat training answers, CDSE insider threat, insider threat CBT answers',
  },
  opsec: {
    title: 'OPSEC Awareness Answers — All Questions & Answers | QuizFeast',
    description: 'Complete OPSEC Awareness training answers. 61 questions on the 5-step process, critical information, OSINT, and countermeasures. Free.',
    keywords: 'OPSEC answers, operations security answers, OPSEC CBT answers, OPSEC awareness training answers, 5 steps of OPSEC',
  },
  antiterrorism: {
    title: 'Antiterrorism Level 1 Answers — All Questions & Answers | QuizFeast',
    description: 'Complete Antiterrorism Level 1 (AT Level 1) answers. 61 questions on FPCON levels, active shooter, IED recognition, and iSALUTE. Free.',
    keywords: 'antiterrorism level 1 answers, AT level 1 answers, JKO antiterrorism answers, FPCON levels, active shooter training',
  },
  hipaa_privacy: {
    title: 'HIPAA & Privacy Act Training Answers — All Questions & Answers | QuizFeast',
    description: 'Complete HIPAA and Privacy Act training answers. 58 questions on PHI, breach notification, patient rights, and penalties. Free.',
    keywords: 'HIPAA training answers, Privacy Act training answers, HIPAA CBT answers, JKO HIPAA answers, PHI training',
  },
  law_of_war: {
    title: 'Law of War Answers — All Questions & Answers | QuizFeast',
    description: 'Complete Law of War (LOAC) training answers. 56 questions on Geneva Conventions, ROE, targeting principles, and war crimes. Free.',
    keywords: 'law of war answers, LOAC answers, law of armed conflict answers, Geneva Convention answers, JKO law of war',
  },
  sere: {
    title: 'SERE 100.2 Answers — All Questions & Answers | QuizFeast',
    description: 'Complete SERE 100.2 Level A answers. 50 questions on Code of Conduct, survival, evasion, resistance, and escape. Free.',
    keywords: 'SERE 100.2 answers, SERE training answers, Code of Conduct answers, JKO SERE answers, survival training',
  },
  cbrn: {
    title: 'CBRN Awareness Answers — All Questions & Answers | QuizFeast',
    description: 'Complete CBRN Awareness training answers. 50 questions on MOPP levels, chemical agents, decontamination, and NBC reporting. Free.',
    keywords: 'CBRN answers, CBRN awareness answers, MOPP levels, chemical warfare answers, NBC training answers',
  },
  ctip: {
    title: 'Combating Trafficking in Persons (CTIP) Answers — All Questions & Answers | QuizFeast',
    description: 'Complete CTIP training answers. 50 questions on trafficking indicators, DoD policy, reporting, and the TVPA. Free.',
    keywords: 'CTIP answers, combating trafficking in persons answers, JKO CTIP answers, human trafficking training answers',
  },
  tarp: {
    title: 'TARP — Threat Awareness & Reporting Answers — All Questions & Answers | QuizFeast',
    description: 'Complete TARP training answers. 44 questions on foreign intelligence threats, elicitation, suspicious contacts, and CI reporting. Free.',
    keywords: 'TARP answers, threat awareness reporting program answers, TARP training answers, counterintelligence training answers',
  },
  force_protection: {
    title: 'Force Protection Answers — All Questions & Answers | QuizFeast',
    description: 'Complete Force Protection training answers. 39 questions on physical security, access control, bomb threats, and RAM. Free.',
    keywords: 'force protection answers, force protection training answers, physical security training answers, FPCON answers',
  },
};

export async function generateMetadata({ params }) {
  const { slug } = params;
  const seo = SEO[slug];

  if (!seo) {
    return { title: 'CBT Not Found | QuizFeast' };
  }

  return {
    title: seo.title,
    description: seo.description,
    keywords: seo.keywords,
    openGraph: {
      title: seo.title,
      description: seo.description,
      type: 'article',
    },
  };
}

export default function CBTLayout({ children }) {
  return children;
}
