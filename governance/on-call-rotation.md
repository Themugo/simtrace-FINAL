# On-Call Rotation Policy

## Overview
This document defines the on-call rotation policy for the SimTrace engineering team.

## Rotation Schedule

### Primary On-Call
- **Duration:** 1 week (Monday 00:00 UTC to Sunday 23:59 UTC)
- **Handoff:** Sunday 23:00 UTC to Monday 01:00 UTC
- **Overlap:** 2 hours between outgoing and incoming on-call

### Secondary On-Call (Backup)
- **Duration:** 1 week (aligned with primary)
- **Role:** Backup for primary, escalations if primary unavailable

### On-Call Engineers
| Week | Primary | Secondary | Dates |
|------|---------|-----------|-------|
| Week 1 | @engineer1 | @engineer2 | YYYY-MM-DD to YYYY-MM-DD |
| Week 2 | @engineer2 | @engineer3 | YYYY-MM-DD to YYYY-MM-DD |
| Week 3 | @engineer3 | @engineer1 | YYYY-MM-DD to YYYY-MM-DD |

## Responsibilities

### Primary On-Call
- Monitor production systems 24/7
- Respond to alerts within 15 minutes (P0), 1 hour (P1), 4 hours (P2)
- Investigate and resolve incidents
- Escalate to secondary if needed
- Document all incidents
- Participate in post-incident reviews

### Secondary On-Call
- Backup for primary on-call
- Handle escalations if primary unavailable
- Cover during primary's planned absences
- Review incident documentation

## Alert Priorities

### P0 - Critical
- **Response Time:** 15 minutes
- **Examples:** Complete system outage, data loss, security breach
- **Escalation:** Immediately notify engineering lead and CTO

### P1 - High
- **Response Time:** 1 hour
- **Examples:** Major service degradation, significant feature broken
- **Escalation:** Notify engineering lead after 30 minutes

### P2 - Medium
- **Response Time:** 4 hours
- **Examples:** Minor service degradation, non-critical feature broken
- **Escalation:** Notify engineering lead after 2 hours

### P3 - Low
- **Response Time:** Next business day
- **Examples:** Documentation issues, minor bugs
- **Escalation:** None

## Communication Channels

### Internal
- **Slack:** #on-call (primary channel)
- **Slack:** #incidents (for active incidents)
- **Slack:** #engineering (for escalations)

### External
- **Status Page:** status.simtrace.site
- **Twitter:** @simtrace_status
- **Email:** support@simtrace.com

## Handoff Procedure

### Outgoing On-Call
1. Document all active incidents
2. Update incident status in tracking system
3. Provide summary of week's events
4. Transfer pagerduty/on-call duty
5. Notify team of handoff completion

### Incoming On-Call
1. Review previous week's incidents
2. Verify monitoring systems are working
3. Confirm access to all systems
4. Update contact information
5. Acknowledge handoff in #on-call channel

## Escalation Path

1. **Primary On-Call** → **Secondary On-Call**
2. **Secondary On-Call** → **Engineering Lead**
3. **Engineering Lead** → **CTO**
4. **CTO** → **CEO**

## Compensation

### On-Call Pay
- **Primary:** $X per week
- **Secondary:** $Y per week
- **Overtime:** 1.5x for incidents > 4 hours

### Time Off
- **Compensatory Time Off:** 1 day per week of on-call
- **No on-call for 2 weeks after on-call week**

## Tools

### Monitoring
- **PagerDuty:** Alert routing and escalation
- **Sentry:** Error tracking
- **Grafana:** Metrics and dashboards
- **Prometheus:** Metrics collection

### Communication
- **Slack:** Team communication
- **Zoom:** Incident calls
- **Google Docs:** Incident documentation

## Training

### New On-Call Engineers
1. Shadow current on-call for 2 weeks
2. Complete on-call training checklist
3. Practice incident response drills
4. Review all runbooks
5. Sign off on on-call policy

### Training Checklist
- [ ] Review all runbooks
- [ ] Practice incident response drills
- [ ] Complete security training
- [ ] Review monitoring dashboards
- [ ] Test alert notifications
- [ ] Complete handoff practice

## Incident Response

### During Incident
1. Acknowledge alert in monitoring system
2. Join incident call
3. Update incident status in #incidents
4. Investigate root cause
5. Implement fix or workaround
6. Verify resolution
7. Document incident

### Post-Incident
1. Complete incident report
2. Schedule post-incident review
3. Identify action items
4. Update runbooks
5. Share learnings with team

## Performance Metrics

### On-Call Metrics
- **Response Time:** Average time to respond to alerts
- **Resolution Time:** Average time to resolve incidents
- **Escalation Rate:** Percentage of incidents escalated
- **On-Call Satisfaction:** Team satisfaction with rotation

### Targets
- **P0 Response Time:** < 15 minutes
- **P1 Response Time:** < 1 hour
- **P2 Response Time:** < 4 hours
- **Resolution Time:** < 2 hours for P0/P1
- **Escalation Rate:** < 10%

## Policy Review

This policy will be reviewed quarterly and updated as needed.

## Contact Information

### Engineering Leadership
- **Engineering Lead:** @engineering-lead
- **CTO:** @cto
- **CEO:** @ceo

### On-Call Coordination
- **On-Call Coordinator:** @coordinator
- **Email:** on-call@simtrace.com
