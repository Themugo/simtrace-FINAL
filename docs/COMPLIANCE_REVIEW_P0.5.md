# SimTrace — Data-Protection & Legal Compliance Review (P0.5)

> **This is not legal advice, and I am not a lawyer.** It is an engineering-grounded
> gap analysis that maps what the SimTrace codebase actually collects and does to
> the obligations under Kenyan law, so that a **qualified Kenyan data-protection
> advocate** can review the real risks efficiently. Several items below cannot be
> fixed in code at all — they are licensing, registration, contractual, or
> organizational obligations. Treat the "blocking" flags as engineering judgement
> about user/legal risk, not legal determinations.

**Legal framework referenced:** Constitution of Kenya 2010 (Art. 31 privacy);
Data Protection Act, 2019 ("DPA"); Data Protection (General) Regulations 2021;
Data Protection (Registration of Data Controllers and Data Processors) Regulations
2021; ODPC Guidance Note for Processing Children's Data (2025); ODPC Data Sharing
Code. Enforcement context: through 2025 the ODPC moved from awareness to active
enforcement (compensation orders, penalty and enforcement notices); current
administrative fines reach KES 5M or 1% of annual turnover (the 2025 Amendment
Bill proposes "whichever is **higher**"), with criminal penalties up to 10 years
for some offences.

---

## 0. Threshold question — read this first

SimTrace is a **private** platform that creates and curates **criminal-justice
records**: `PoliceReport` (OB numbers, incident location/description),
`CourtCase` (charges, prosecutor / defense / judge names, case numbers),
`InterpolCase` (international notices), `CaseTransfer`, and an access-control
layer (`DataAccessControl`) for police access. It also produces accusations
(`ThiefReport`) and captures images of people (`SelfieCapture`).

The single largest exposure is **not a DPA technicality — it is authority**: by
what legal mandate does a private company originate, hold, and route police and
court records, and present itself in the chain of evidence? The General
Regulations' transfer rules even carve out "judicial co-operation in criminal
matters and police co-operation" as a domain of **international agreements
between states** — i.e. these flows are contemplated for *authorities*, not
private intermediaries. Before any of the line-item fixes below matter, get a
written legal opinion on:

- whether SimTrace may lawfully hold/operate these records at all without a
  statutory basis, gazettement, or a formal MOU/data-sharing agreement with the
  National Police Service / DCI / Judiciary / the Kenya Interpol NCB;
- who is the **data controller** for the police/court records (SimTrace, or the
  authority — with SimTrace as processor?). This determination changes almost
  every obligation below.

If that authority does not exist, the safest engineering posture is to **not
originate or store** OB numbers, charges, or Interpol notices, and instead hold
only the user's own device records + the user's *copy* of their own report.

---

## 1. ODPC registration (DPA s.18 + Registration Regulations 2021)

No entity may act as a **data controller or data processor** in Kenya without
registering with the ODPC. The general threshold is annual turnover above
KES 5,000,000 **and** more than 10 employees, **but** that threshold is
irrelevant here: entities processing **sensitive personal data**, **children's
data**, or operating in carved-out sectors (financial services,
**telecommunications**) must register regardless of size. SimTrace touches
telecom integration, payments, biometric-style images, children's data and
criminal data — so **registration is almost certainly mandatory**.

- **Action (legal/ops, blocking):** register SimTrace as a data controller; map
  and register each processor (hosting, payment, SMS/telecom, AI provider).
- **Note:** the law also reaches controllers/processors *outside* Kenya that
  process data of people in Kenya — relevant to your hosting/processors (s.5 below).

---

## 2. Lawful basis per data category (DPA s.30–31)

Every processing operation needs at least one lawful basis (consent;
contract; legal obligation; vital interests; public interest/official authority;
legitimate interest). Mapping the schemas:

| Model | Data subject(s) | Plausible basis | Gap / risk |
|---|---|---|---|
| `User`, `Device` | the customer | contract / consent | baseline; confirm notice + privacy policy exist |
| `PoliceReport` | owner **and** any named offender | legal obligation / public interest — **only if** authorised | no lawful basis as a private holder without authority (§0) |
| `CourtCase` (`charges`, named actors) | accused, court personnel | public-record / official authority | accuracy + authority; named third parties have rights |
| `InterpolCase` | accused | judicial co-operation (state function) | private processing basis very weak (§0, §5) |
| `DataAccessControl` | requesting officers | legitimate interest / legal obligation | this is your audit/consent layer — keep, enforce, log |
| `SelfieCapture` | **whoever holds the device** (maybe innocent) | legitimate interest (owner's recovery) | third-party biometric, no consent — see §7 |
| `ParentChild` (`childName`, `childAge`, `school`) | the **minor** | parental consent (s.33) | consent must be *verifiable*, not a flag — see §4 |
| `Payment`/`PayPalPayment` | the customer | contract | confirm PCI scope handled by processor, not stored here |
| reseller / partner PII | resellers, their customers | contract + data-sharing | needs processor contracts + Data Sharing Code (§8) |

- **Action (legal + eng):** produce a Record of Processing Activities (ROPA)
  from this table; confirm a published, specific, informed privacy notice; pin a
  documented lawful basis to each flow. Where the only honest basis is "we have
  no authority," that flow is a §0 problem, not a basis problem.

---

## 3. Sensitive data, biometrics, children, automated decisions → DPIA is mandatory

Under the General Regulations, a **Data Protection Impact Assessment** is required
for high-risk processing, expressly including **biometric/genetic data**,
**sensitive personal data**, **data relating to children or vulnerable groups**,
and **automated decision-making with legal/significant effects**. SimTrace hits
*all four*:

- biometric-style: `SelfieCapture.imageUrl` (facial images) + `imageHash`;
- children: `ParentChild`;
- sensitive/criminal: police + court records;
- automated decisions: the boot engines **`risk_scoring`** and
  **`fraud_detection`** score people/devices and may gate access or flag "fraud."

A DPIA is therefore **not optional**. The risk-scoring/fraud engines additionally
trigger the right not to be subject to solely automated decisions with
significant effects — you need human review, an explanation path, and a way to
contest outcomes.

- **Action (legal + eng, blocking before scale):** commission a DPIA covering
  these four; for the AI engines, document inputs/logic at a high level, add a
  human-in-the-loop and an appeal route, and avoid solely-automated adverse
  actions.

---

## 4. Children's data (DPA s.33 + ODPC 2025 Children's Data Guidance)

The age of consent is **18**. Processing a child's data is prohibited unless
**verifiable, informed consent of a parent/guardian** is obtained *and* the
processing demonstrably advances the **best interests** of the child. The ODPC's
2025 guidance describes the expected mechanism: collect date of birth at sign-up;
if under 18, trigger a parental/guardian consent flow (e.g. email a consent-form
link to the guardian) before processing.

What the code does today (after P0.4): `ParentChild` records a `guardianConsent`
boolean + `consentRecordedAt` + `dataRetentionUntil`, and `enableLiveTracking`
is now hard-gated on `guardianConsent === true`. **This is necessary but not
sufficient.** Gaps:

- the consent is an **API flag**, not *verifiable* parental consent — there is no
  proof the setter is the parent/guardian (identity/relationship verification);
- no **age gate** at registration (DOB capture + under-18 routing);
- no recorded **best-interests** assessment;
- `childName` / `childAge` / `school` are children's data and must be
  minimised, access-controlled, and retention-bound.

- **Action (eng):** add DOB capture + under-18 routing; build a real
  guardian-consent capture (emailed consent record tied to a verified guardian);
  store the consent artefact, not just a boolean; minimise child fields.
- **Action (legal):** confirm the consent mechanism meets "verifiable" + draft
  the best-interests basis.

---

## 5. Cross-border transfers (DPA s.48–49 + General Regulations transfer Part)

Transferring personal data **outside Kenya** is prohibited unless the destination
provides adequate safeguards and the controller can show proof of those
safeguards to the Data Commissioner; for **sensitive** personal data, the data
subject's **explicit consent** is additionally required. Countries that ratified
the AU Malabo Convention, or have a reciprocal agreement / adequate law, are
presumed adequate. Two transfer surfaces here:

1. **Hosting & processors** — Vercel (frontend) and Render (backend) and likely
   the AI provider are **outside Kenya**. That is a cross-border transfer of
   *everything*, including sensitive + children + criminal data. This needs
   safeguards (e.g. SCC-equivalent contract terms), the proof-to-Commissioner
   step, explicit consent for the sensitive categories, and a check on whether
   any of this data is subject to **localization** (the Cabinet Secretary may
   require certain data be stored in Kenya).
2. **`InterpolCase.targetCountries`** — cross-border by design. Note the carve-out
   that the transfer rules don't override international judicial/police
   co-operation agreements — which again points to this being a **state**
   function (§0).

- **Action (legal + eng):** data-transfer assessment for each processor; put
  transfer safeguards in processor contracts; decide on Kenya-region hosting /
  localization for the most sensitive collections; obtain explicit consent where
  sensitive data leaves Kenya.

---

## 6. Data-subject rights — need real endpoints + process

The DPA grants rights to be informed, to access (controller must respond within
**7 days** per the General Regulations), to rectification (**14 days**), to
erasure of false/misleading data, and to object/restrict. SimTrace has no
visible DSAR (data-subject access request) handling.

- **Action (eng + ops):** build a DSAR intake + fulfilment path (access export,
  rectify, erase, object). Watch two tensions: (a) `EncryptedData` and retention
  windows complicate *erasure* (crypto-shredding by destroying keys is one
  pattern); (b) criminal/evidence records may be subject to **preservation**
  duties that override erasure — flag per record type.

---

## 7. `SelfieCapture` + `ThiefReport` — the highest individual-harm risk

This flow captures an image of **whoever is holding a locked device** and can tie
it to a **"thief" report**. The person captured may be an innocent buyer, a
finder, a borrower, or a family member. Risks stack:

- **Biometric data of a non-consenting third party** (sensitive; DPIA; §3).
- **Defamation / false accusation** — labelling someone a "thief," especially if
  surfaced beyond the owner or to the public, is a civil (and potentially
  criminal) defamation exposure and a wrongful-accusation harm.
- **Constitutional privacy** (Art. 31) of the captured person.

P0.4 added a recorded `consentBasis` (defaulting to legitimate-interest in
recovering a device that is *locked/reported*) and a 90-day `retentionUntil`.
That is a reasonable data-protection floor, but it does **not** resolve the
defamation/accusation problem. Recommended posture:

- treat a capture strictly as **evidence for the owner and/or police**, never as
  a published or automated "thief" determination;
- **never auto-label** a person a thief; `ThiefReport` should be a request to an
  authority, gated and access-controlled, not a public statement;
- show captured subjects a notice of basis + retention where feasible; honour
  objection/erasure unless preservation applies;
- legitimate-interest basis requires a documented **balancing test** against the
  captured person's rights — get this in the DPIA.

- **Action (legal, blocking for the accusation flow):** defamation + lawful-basis
  review of capture and `ThiefReport` before this is user-visible at scale.

---

## 8. Telecom & reseller PII + Data Sharing Code + processor contracts

Telecom integration (IMEI/subscriber linkage) and reseller/partner flows share
personal data between organisations. The DPA (s.42(2)(b)) requires a **written
contract** with every data processor, including confidentiality commitments,
security measures, and deletion/return on termination; the ODPC's **Data Sharing
Code** governs controller-to-controller sharing.

- **Action (legal + eng):** written data-processing agreements with every
  processor (hosting, payments, SMS, AI, telecom); data-sharing agreements for
  telecom/police/reseller sharing; confirm reseller-collected PII has its own
  basis + notice; minimise subscriber data pulled from telecom partners.

---

## 9. Security safeguards & breach notification (DPA s.43 + General Regs)

Controllers must apply appropriate technical/organizational measures and
**notify the ODPC of a personal-data breach within 72 hours** (and affected data
subjects where there is real risk of harm). This ties directly to the hardening
work: encryption-at-rest for sensitive collections (P0.3 — now key-derived,
fail-closed, authTag fixed), access control + audit logging (P1 —
`DashboardAccessLog`/`DataAccessControl` must be *enforced and reviewed*), and
webhook/payment integrity (P0.2).

- **Action (eng + ops):** a documented breach-response runbook with the 72-hour
  clock; ensure access to police/criminal/biometric data is logged and the logs
  are immutable + reviewed; extend encryption-at-rest to all sensitive
  collections, not only `EncryptedData`.

---

## 10. Retention & minimisation (General Regs reg. 19)

Personal data must be kept only as long as necessary, on a defined retention
schedule, then deleted/anonymised. P0.4 added `retentionUntil` (selfies, 90d) and
`dataRetentionUntil` (children, 1y), but **nothing purges expired rows yet**, and
most other collections have no retention rule.

- **Action (eng):** scheduled retention-cleanup job honouring `retentionUntil` /
  `dataRetentionUntil`; define retention per collection; reconcile retention vs.
  any evidence-**preservation** duty on criminal records (these can conflict —
  legal must set the rule per record type).

---

## Prioritized action list

| # | Item | Owner | Blocking? |
|---|---|---|---|
| A | Legal authority/MOU to hold police/court/Interpol records (§0) | **Legal** | **Yes** — gates the whole law-enforcement module |
| B | ODPC registration as controller + map processors (§1) | Legal/Ops | **Yes** |
| C | DPIA covering biometrics, children, criminal data, AI scoring (§3) | Legal + Eng | **Yes** before scale |
| D | Defamation + lawful-basis review of selfie/ThiefReport (§7) | Legal | **Yes** for that flow |
| E | Verifiable parental consent + age gate (§4) | Eng + Legal | High |
| F | Cross-border transfer assessment + processor DPAs + localization call (§5,§8) | Legal + Eng | High |
| G | DSAR endpoints (access/rectify/erase/object) (§6) | Eng + Ops | High |
| H | Breach-response runbook (72h) + enforce/retain audit logs (§9) | Eng + Ops | Medium |
| I | Retention-cleanup job + per-collection retention schedule (§10) | Eng | Medium |
| J | Human-in-the-loop + appeal for automated risk/fraud decisions (§3) | Eng + Legal | Medium |

**What P0.1–P0.4 already contributed to compliance:** encryption-at-rest with
proper key handling (P0.3 → §9), webhook/payment integrity (P0.2 → §9), consent
capture + live-tracking gate for minors and selfie lawful-basis/retention fields
(P0.4 → §4, §7, §10), and authorization/IDOR hardening + access control on
officer/admin/user-scoped data (P0.1 → §9). These are the *engineering* floor;
items A–D above are predominantly **legal/organizational** and cannot be closed
in the codebase.
