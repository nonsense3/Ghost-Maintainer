# Ghost Maintainer — 3-Minute Demo Script (PRD §12)

Use this script during live demonstrations, hackathon presentations, and video recordings.

---

### Part 1: The Problem (0:00 – 0:30)
> *"Every software security tool today watches the **code**. They look for buffer overflows, known CVEs, and outdated dependencies.*
>
> *But when the **xz-utils backdoor** struck earlier this year, it wasn't caused by a coding blunder. It happened because of **people**: a tired, solo open-source maintainer named Lasse Collin was slowly pressured over several years, until a coordinated ring of accounts coerced him into handing over release keys to an attacker named Jia Tan.*
>
> *Dependabot warns you weeks **after** the malware is published. **Ghost Maintainer** warns you weeks **before** the package is compromised."*

---

### Part 2: Healthy Baseline Demo (0:30 – 1:15)
> *(Open `/` or `/dashboard/repos/demo-flask`)*
>
> *"Here is a healthy repository: `pallets/flask`. Look at the Ghost Maintainer audit:*
> - *Risk Score: **13/100 (Low Risk)**.*
> - *Commit time distribution shows normal diurnal hours matching the global team.*
> - *Every merged pull request has verified reviews and automated tests.*
> - *Gemma 2 linguistic scanner flags 0 comments — maintainers communicate in a sustainable, collaborative rhythm."*

---

### Part 3: The Hijack Detection Demo (1:15 – 2:15)
> *(Switch to `xz/xz-utils` or `/dashboard/repos/demo-xz`)*
>
> *"Now let's inspect `xz-utils` before the CVE was published. Ghost Maintainer flags it with a **High Risk Score of 86/100**.*
>
> *Look at the exact behavioral signals computed by our SQL engine:*
> 1. ***Activity Drop (78/100):** Maintainer commits dropped off as health deteriorated.*
> 2. ***Commit Time Shift (84/100):** Commits suddenly shifted from European daytime to 3 AM UTC.*
> 3. ***New Author Surge (92/100):** An unknown account, 'Jia Tan', suddenly authored 92% of new commits.*
> 4. ***Unreviewed Merges (85/100):** Major build scripts were merged with zero peer reviews.*
>
> *And look at what our local **Gemma 2** linguistic model caught:*
> - *Score 88: Lasse Collin writes: 'I haven't lost interest, but my ability to care has been fairly limited.'*
> - *Score 95: Sockpuppet accounts pressuring him: 'Is there any progress on this? Jia Tan has been waiting.'*
>
> *Ghost Maintainer puts the human puzzle together before a single line of malicious payload activates."*

---

### Part 4: How It Works & Architecture (2:15 – 2:45)
> *(Scroll to Architecture / Terminal CLI)*
>
> *"How do we build this?*
> 1. ***Open-Source AI & Gemma 2:** Runs locally via Ollama or in Snowflake Cortex AI. Complete privacy, zero-egress, and works offline.*
> 2. ***Zero-Egress SQL Layer:** We ingest raw JSON into PostgreSQL/Supabase and Snowflake VARIANT, computing moving averages and Z-scores directly in the database.*
> 3. ***Developer Experience:** Developers can scan a single repo or run `ghost-maintainer scan-deps` on their `package.json` to triage their entire dependency tree in seconds."*

---

### Part 5: Closing Statement (2:45 – 3:00)
> *"Open source runs the modern economy, but it rests on the shoulders of exhausted maintainers. Ghost Maintainer protects the humans who build our software.*
>
> *Thank you!"*
