# Incident Response Playbook

## Incident Classification

### Severity Levels

#### SEV0 - Critical
- **Definition:** Complete system outage affecting all users
- **Examples:** Database down, complete API failure, security breach
- **Response Time:** 5 minutes
- **Escalation:** Immediate to CTO and CEO
- **Communication:** Public status page update within 15 minutes

#### SEV1 - High
- **Definition:** Major service degradation affecting most users
- **Examples:** Core features broken, significant performance issues
- **Response Time:** 15 minutes
- **Escalation:** Engineering Lead after 30 minutes
- **Communication:** Status page update within 30 minutes

#### SEV2 - Medium
- **Definition:** Service degradation affecting some users
- **Examples:** Non-critical features broken, partial outage
- **Response Time:** 1 hour
- **Escalation:** Engineering Lead after 2 hours
- **Communication:** Status page update within 2 hours

#### SEV3 - Low
- **Definition:** Minor issues affecting few users
- **Examples:** Documentation issues, minor bugs
- **Response Time:** 4 hours
- **Escalation:** None
- **Communication:** Status page update within 24 hours

## Incident Response Process

### 1. Detection
- **Monitoring:** Automated alerts from Prometheus/Sentry
- **Manual:** User reports, internal testing
- **Action:** Acknowledge alert, assess severity

### 2. Triage
- **Assessment:** Determine severity level
- **Impact:** Number of users affected
- **Priority:** Assign appropriate priority
- **Action:** Create incident ticket, notify team

### 3. Mobilization
- **On-Call:** Primary on-call engineer takes lead
- **Team:** Assemble incident response team
- **Communication:** Start incident call, update #incidents
- **Action:** Assign roles, begin investigation

### 4. Investigation
- **Logs:** Review application logs, error logs
- **Metrics:** Check Grafana dashboards, Prometheus metrics
- **Traces:** Use distributed tracing to identify bottlenecks
- **Action:** Identify root cause

### 5. Resolution
- **Fix:** Implement fix or workaround
- **Verify:** Confirm fix resolves the issue
- **Monitor:** Watch for recurrence
- **Action:** Mark incident as resolved

### 6. Post-Incident
- **Documentation:** Complete incident report
- **Review:** Schedule post-incident review
- **Action Items:** Identify and track improvements
- **Learning:** Share with team

## Common Incident Scenarios

### Database Outage
**Detection:** Database connection errors, slow queries
**Triage:** Check MongoDB Atlas status, connection pool
**Investigation:** Review database logs, query performance
**Resolution:** Restart database, optimize queries, scale up
**Prevention:** Add read replicas, implement caching

### API Latency Spikes
**Detection:** High response times in Grafana
**Triage:** Check API metrics, external dependencies
**Investigation:** Review slow endpoints, external API calls
**Resolution:** Optimize code, add caching, scale horizontally
**Prevention:** Implement rate limiting, circuit breakers

### Authentication Failures
**Detection:** High login failure rate
**Triage:** Check auth service, JWT tokens
**Investigation:** Review auth logs, token validation
**Resolution:** Fix auth service, rotate keys, update tokens
**Prevention:** Add monitoring, implement token refresh

### Queue Backlog
**Detection:** High queue depth in BullMQ
**Triage:** Check worker status, Redis connection
**Investigation:** Review worker logs, job processing
**Resolution:** Scale workers, fix worker bugs, clear backlog
**Prevention:** Add queue monitoring, auto-scaling

## Communication Templates

### Initial Incident Announcement
```
🚨 INCIDENT ANNOUNCEMENT

Severity: SEV0/SEV1/SEV2/SEV3
Service: [Affected Service]
Impact: [Description of impact]
Started: [Time]
Status: [Investigating/Mitigating/Resolved]

Updates will be posted here and on status.simtrace.site
```

### Status Update
```
📊 INCIDENT UPDATE

Incident: [Incident Name]
Severity: SEV0/SEV1/SEV2/SEV3
Status: [Investigating/Mitigating/Resolved]
Update: [Description of update]
Next Update: [Time]

Current Status: status.simtrace.site
```

### Resolution Announcement
```
✅ INCIDENT RESOLVED

Incident: [Incident Name]
Severity: SEV0/SEV1/SEV2/SEV3
Resolved: [Time]
Duration: [Duration]
Root Cause: [Brief description]
Fix: [Brief description]

Post-incident review scheduled for: [Date/Time]
```

## Roles and Responsibilities

### Incident Commander
- Lead incident response
- Coordinate team communication
- Make final decisions
- Communicate with stakeholders

### Communications Lead
- Update status page
- Communicate with users
- Handle media inquiries
- Coordinate internal communication

### Technical Lead
- Lead technical investigation
- Coordinate engineering team
- Implement fixes
- Verify resolution

### Scribe
- Document incident timeline
- Record decisions made
- Capture action items
- Create incident report

## Tools and Resources

### Monitoring
- **Grafana:** https://grafana.simtrace.site
- **Prometheus:** https://prometheus.simtrace.site
- **Sentry:** https://sentry.io/simtrace

### Communication
- **Slack:** #incidents
- **Zoom:** https://zoom.us/simtrace-incident
- **Status Page:** status.simtrace.site

### Documentation
- **Runbooks:** /docs/runbooks/
- **Architecture:** /docs/architecture/
- **API Docs:** https://api.simtrace.site/docs

## Escalation Matrix

| Time | Action | Contact |
|------|--------|---------|
| 0-5 min | On-Call Engineer | @on-call |
| 5-15 min | Engineering Lead | @engineering-lead |
| 15-30 min | CTO | @cto |
| 30+ min | CEO | @ceo |

## Post-Incident Review

### Review Questions
1. What happened?
2. Why did it happen?
3. How did we respond?
4. What went well?
5. What could be improved?
6. What action items are needed?

### Review Participants
- Incident Commander
- Technical Lead
- Communications Lead
- Relevant Engineers
- Engineering Leadership

### Review Output
- Incident Report
- Action Items
- Process Improvements
- Updated Runbooks

## Training and Drills

### Incident Response Training
- Quarterly training sessions
- Practice scenarios
- Role-playing exercises
- Tool familiarization

### Incident Drills
- Monthly drills for common scenarios
- Annual full-scale drill
- Drill debrief and improvement

## Metrics and KPIs

### Response Metrics
- **MTTD (Mean Time To Detect):** Time from incident start to detection
- **MTTR (Mean Time To Resolve):** Time from detection to resolution
- **Escalation Rate:** Percentage of incidents escalated

### Quality Metrics
- **Incident Recurrence:** Same incident happening again
- **Post-Incident Review Completion:** Percentage of incidents reviewed
- **Action Item Completion:** Percentage of action items completed

### Targets
- **MTTD:** < 5 minutes for SEV0/SEV1
- **MTTR:** < 1 hour for SEV0, < 4 hours for SEV1
- **Escalation Rate:** < 15%
- **Post-Incident Review:** 100% for SEV0/SEV1

## Policy Review

This playbook will be reviewed quarterly and updated based on incident learnings and team feedback.
