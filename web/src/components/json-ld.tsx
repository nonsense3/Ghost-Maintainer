import React from "react";

export function JsonLd() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Ghost Maintainer",
    "applicationCategory": "SecurityApplication",
    "operatingSystem": "Linux, macOS, Windows",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "description": "AI-powered open-source supply chain risk assessment engine predicting maintainer burnout, account hijacking, and pre-CVE backdoor threats using Gemma 4B and SQL analytics.",
    "softwareVersion": "1.0.0",
    "license": "https://opensource.org/licenses/MIT",
    "author": {
      "@type": "Organization",
      "name": "Ghost Maintainer Core Team",
      "url": "https://ghost-maintainer.onrender.com"
    },
    "featureList": [
      "Gemma 4B Linguistic Burnout Analysis",
      "5 SQL Behavioral Anomaly Signals",
      "Pre-CVE Supply Chain Attack Triage",
      "Package.json Dependency Audit",
      "Zero-Dependency Node.js & Python CLI Suite",
      "Snowflake Data Warehouse Integration"
    ]
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
