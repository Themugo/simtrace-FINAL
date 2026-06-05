# GDPR Compliance Documentation

## Overview

This document outlines SIMTrace's compliance with the General Data Protection Regulation (GDPR) for processing personal data of EU residents.

## Legal Basis for Processing

### Primary Legal Bases

**1. Contract Performance (Article 6(1)(b))**
- Processing is necessary for the performance of the service contract
- User agreement to terms of service
- Device tracking functionality

**2. Legitimate Interests (Article 6(1)(f))**
- Fraud prevention and detection
- Security monitoring
- Service improvement
- Analytics (with anonymization)

**3. Consent (Article 6(1)(a))**
- Marketing communications (opt-in)
- Location tracking (explicit consent)
- Data sharing with third parties (explicit consent)

## Data Categories

### Personal Data Processed

**Identity Data**
- Name
- Email address
- Phone number
- Physical address (if provided)

**Device Data**
- IMEI number
- Device brand and model
- Device nickname
- Device location history
- Device status (active, stolen, recovered)

**Usage Data**
- Login history
- Device registration dates
- Subscription details
- Payment information (processed via Stripe)

**Technical Data**
- IP address
- Device identifier
- Browser type and version
- Operating system

## Data Subject Rights

### Right to Information (Article 13 & 14)
- Provided at time of data collection
- Includes: purpose, legal basis, retention period, data recipients
- Available in Privacy Policy and Terms of Service

### Right to Access (Article 15)
- Users can request copy of their personal data
- Response within 30 days
- Format: Machine-readable (JSON, CSV)
- Contact: privacy@simtrace.com

### Right to Rectification (Article 16)
- Users can correct inaccurate data
- Self-service via profile page
- Support via email request
- Response within 30 days

### Right to Erasure (Article 17)
- Users can request deletion of their data
- Conditions:
  - Data no longer needed for original purpose
  - Consent withdrawn
  - Processing unlawful
  - Legal obligation
- Exceptions:
  - Legal requirements (e.g., financial records)
  - Legitimate interests (e.g., fraud prevention)
- Response within 30 days

### Right to Restrict Processing (Article 18)
- Users can request restriction of processing
- Conditions:
  - Data accuracy contested
  - Processing unlawful but user opposes erasure
  - No longer needed but needed for legal claims
- Response within 30 days

### Right to Data Portability (Article 20)
- Users can receive data in structured format
- Can transfer to another controller
- Applies to data provided with consent or contract
- Response within 30 days

### Right to Object (Article 21)
- Users can object to processing based on legitimate interests
- Must have compelling grounds
- Applies to direct marketing (always allowed)
- Response within 30 days

### Rights Regarding Automated Decision Making (Article 22)
- Users not subject to solely automated decisions
- Human review available for significant decisions
- Right to express point of view and contest

## Data Protection Principles

### Lawfulness, Fairness, and Transparency (Article 5(1)(a))
- Legal basis documented for all processing
- Privacy policy clearly explains data use
- No hidden or deceptive practices

### Purpose Limitation (Article 5(1)(b))
- Data collected for specified purposes
- No processing incompatible with original purpose
- Consent obtained for new purposes

### Data Minimization (Article 5(1)(c))
- Only collect data necessary for stated purposes
- Regular data audits to remove unnecessary data
- Anonymization where possible

### Accuracy (Article 5(1)(d))
- Data kept accurate and up-to-date
- Users can correct their data
- Regular data validation

### Storage Limitation (Article 5(1)(e))
- Data retained only as long as necessary
- Retention periods documented
- Automatic deletion after retention period

### Integrity and Confidentiality (Article 5(1)(f))
- Appropriate security measures
- Encryption at rest and in transit
- Access controls and authentication
- Regular security audits

### Accountability (Article 5(2))
- Compliance documented
- Records of processing activities
- Regular compliance audits
- Data protection by design and default

## Data Transfers

### Third Countries
- Data stored in AWS EU regions (Ireland, Frankfurt)
- US transfers via GDPR-compliant mechanisms:
  - Standard Contractual Clauses (SCCs)
  - Privacy Shield (if applicable)
- No transfers to countries without adequate protection

### Data Processors
- AWS (cloud infrastructure) - SCCs in place
- Stripe (payment processing) - SCCs in place
- SendGrid (email service) - SCCs in place
- Africa's Talking (SMS service) - SCCs in place

### Data Sharing
- Only shared with explicit consent
- Third-party agreements reviewed for GDPR compliance
- Data sharing documented in privacy policy

## Security Measures

### Technical Security
- Encryption at rest (AES-256)
- Encryption in transit (TLS 1.3)
- Secure authentication (bcrypt, JWT)
- Regular security updates
- Penetration testing (bi-annual)

### Organizational Security
- Data protection training for all staff
- Access controls and least privilege
- Incident response procedures
- Data breach notification process
- Regular security audits

### Physical Security
- AWS data center security
- Access controls
- Surveillance
- Environmental controls

## Data Breach Notification

### Notification Requirements
- Notify supervisory authority within 72 hours
- Notify data subjects without undue delay
- Include: nature, scope, consequences, mitigation measures

### Notification Process
1. Detect breach
2. Assess risk to data subjects
3. Notify supervisory authority (if high risk)
4. Notify data subjects (if high risk)
5. Document breach and response

### Contact Information
- **DPO:** privacy@simtrace.com
- **Supervisory Authority:** Data Protection Commission (Ireland)

## Data Protection Impact Assessment (DPIA)

### High-Risk Processing
- Systematic monitoring (location tracking)
- Large-scale processing of special categories
- Processing of criminal offense data

### DPIA Process
1. Describe processing
2. Assess necessity and proportionality
3. Assess risks to data subjects
4. Identify mitigation measures
5. Document findings

### Completed DPIAs
- Location tracking system
- Device monitoring
- Data analytics

## Records of Processing Activities (ROPA)

### Documentation Requirements
- Purposes of processing
- Data categories
- Data recipients
- International transfers
- Retention periods
- Security measures

### ROPA Location
- Internal document maintained by DPO
- Available to supervisory authority on request
- Updated annually or when processing changes

## Data Protection Officer (DPO)

### DPO Contact
- **Email:** privacy@simtrace.com
- **Address:** Nairobi, Kenya
- **Responsibilities:**
  - Monitoring compliance
  - Advising on GDPR obligations
  - Cooperating with supervisory authority
  - Point of contact for data subjects

### DPO Qualifications
- Expert knowledge of data protection law
- Understanding of SIMTrace operations
- Independence in performing duties

## Compliance Monitoring

### Regular Reviews
- Quarterly compliance reviews
- Annual GDPR audit
- Continuous monitoring of processing activities
- Regular staff training

### Key Performance Indicators
- Data subject response time
- Data breach notification timeliness
- Security incident frequency
- Training completion rate

## Version History

- **v1.0** - June 5, 2026 - Initial GDPR compliance documentation
