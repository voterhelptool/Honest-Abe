/**
 * HONEST ABE — agent.js
 *
 * The agentic loop. Runs continuously. Monitors itself.
 * Proposes improvements. Waits for humans to approve them.
 * Never promotes itself above the humans it serves.
 *
 * FREE · FAIR · FIRM · FUN · TRUE · TRANSPARENT · ACCESSIBLE
 */

// ── DEPENDENCIES ──────────────────────────────────────────────────────────
// In browser: load ethics.js and truth-model.js before this file.
// In Node:
//   const { ImmutableEthics } = require('./ethics.js');
//   const { TruthModel, INTEGRITY } = require('./truth-model.js');

// ── AGENT CONFIGURATION ───────────────────────────────────────────────────

const AGENT_CONFIG = Object.freeze({
    name:             "Honest Abe",
    version:          "1.0.0",
    constitution:     ["FREE","FAIR","FIRM","FUN","TRUE","TRANSPARENT","ACCESSIBLE"],
    pillars:          ["VERIFIABLE","REPRODUCIBLE","CONTEXTUALLY_HONEST","FALSIFIABLE"],

    // Self-monitoring thresholds
    // If performance drops below these, agent proposes a self-update
    thresholds: {
        minIntegrityScore:     0.80,  // below this → flag for review
        minPillarAverage:      0.60,  // below this → flag claim for human
        maxFalsePositiveRate:  0.10,  // >10% human overrides → propose pattern review
        maxFalseNegativeRate:  0.05,  // >5% missed harms → propose pattern expansion
    },

    // Self-update policy — agent PROPOSES, humans APPROVE
    selfUpdate: {
        agentCanPropose:   true,
        agentCanApply:     false,  // never — humans must approve
        quorumRequired:    2,      // minimum human approvals before change applies
        vetoOverridesAll:  true,   // one veto blocks any change
    }
});

// ── PERFORMANCE LEDGER ────────────────────────────────────────────────────
// Full audit trail. Every evaluation recorded. Nothing hidden.

class PerformanceLedger {
    constructor() {
        this.evaluations   = [];
        this.overrides     = [];   // human disagreements with agent verdict
        this.proposals     = [];   // agent-proposed self-updates
        this.approvals     = [];   // human approvals of proposals
    }

    record(evaluation) {
        this.evaluations.push({
            id:        `eval_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,
            timestamp: new Date().toISOString(),
            ...evaluation
        });
    }

    recordOverride({ evalId, agentVerdict, humanVerdict, reason, reviewer }) {
        this.overrides.push({
            id:        `override_${Date.now()}`,
            evalId,
            agentVerdict,
            humanVerdict,
            reason,
            reviewer,
            timestamp: new Date().toISOString()
        });
    }

    // False positive rate: agent blocked/flagged something humans said was fine
    falsePositiveRate() {
        if (!this.evaluations.length) return 0;
        const fps = this.overrides.filter(o =>
            o.agentVerdict !== "LIKELY TRUE" && o.humanVerdict === "LIKELY TRUE"
        ).length;
        return +(fps / this.evaluations.length).toFixed(3);
    }

    // False negative rate: agent passed something humans flagged as harmful
    falseNegativeRate() {
        if (!this.evaluations.length) return 0;
        const fns = this.overrides.filter(o =>
            o.agentVerdict === "LIKELY TRUE" && o.humanVerdict !== "LIKELY TRUE"
        ).length;
        return +(fns / this.evaluations.length).toFixed(3);
    }

    snapshot() {
        return {
            totalEvaluations:  this.evaluations.length,
            totalOverrides:    this.overrides.length,
            falsePositiveRate: this.falsePositiveRate(),
            falseNegativeRate: this.falseNegativeRate(),
            pendingProposals:  this.proposals.filter(p => p.status === "pending").length,
            timestamp:         new Date().toISOString()
        };
    }
}

// ── PROPOSAL SYSTEM ───────────────────────────────────────────────────────
// Agent observes patterns in its failures and proposes changes.
// Humans vote. Quorum approves. Veto blocks.
// Nothing changes without the humans saying so.

class ProposalSystem {
    constructor(ledger) {
        this.ledger = ledger;
    }

    propose({ type, description, rationale, proposedChange, proposedBy = "agent" }) {
        const proposal = {
            id:             `proposal_${Date.now()}`,
            type,            // "pattern_add" | "pattern_remove" | "threshold_adjust" | "pillar_note"
            description,
            rationale,
            proposedChange,
            proposedBy,
            timestamp:      new Date().toISOString(),
            status:         "pending",
            votes:          { approve: [], veto: [] }
        };
        this.ledger.proposals.push(proposal);
        console.log(`[Honest Abe] Proposal ${proposal.id} submitted: ${description}`);
        return proposal;
    }

    vote(proposalId, reviewer, decision) {
        const proposal = this.ledger.proposals.find(p => p.id === proposalId);
        if (!proposal || proposal.status !== "pending") return null;

        if (decision === "veto") {
            proposal.votes.veto.push({ reviewer, timestamp: new Date().toISOString() });
            if (AGENT_CONFIG.selfUpdate.vetoOverridesAll) {
                proposal.status = "vetoed";
                console.log(`[Honest Abe] Proposal ${proposalId} VETOED by ${reviewer}.`);
            }
        } else if (decision === "approve") {
            proposal.votes.approve.push({ reviewer, timestamp: new Date().toISOString() });
            if (proposal.votes.approve.length >= AGENT_CONFIG.selfUpdate.quorumRequired) {
                proposal.status = "approved";
                console.log(`[Honest Abe] Proposal ${proposalId} APPROVED. Ready to apply.`);
            }
        }

        return proposal;
    }

    // Apply an approved proposal — still requires explicit human call
    apply(proposalId, appliedBy) {
        const proposal = this.ledger.proposals.find(p => p.id === proposalId);
        if (!proposal || proposal.status !== "approved") {
            console.warn(`[Honest Abe] Cannot apply ${proposalId} — not approved.`);
            return null;
        }
        proposal.status    = "applied";
        proposal.appliedBy = appliedBy;
        proposal.appliedAt = new Date().toISOString();
        console.log(`[Honest Abe] Proposal ${proposalId} applied by ${appliedBy}.`);
        return proposal;
    }
}

// ── MAIN AGENT ────────────────────────────────────────────────────────────

class HonestAbe {
    constructor() {
        this.config   = AGENT_CONFIG;
        this.ledger   = new PerformanceLedger();
        this.proposals = new ProposalSystem(this.ledger);
        this._running  = false;
        this._queue    = [];

        console.log(`[Honest Abe] Initialized. Version ${this.config.version}.`);
        console.log(`[Honest Abe] Constitution: ${this.config.constitution.join(" · ")}`);
        console.log(`[Honest Abe] Pillars: ${this.config.pillars.join(" · ")}`);
    }

    // ── EVALUATE ─────────────────────────────────────────────────────────
    // Primary interface. Run any claim through the full stack.

    evaluate(claim, sources = [], meta = {}) {
        const result = TruthModel.evaluate(claim, sources);
        this.ledger.record({
            claim,
            verdict:        result.verdict,
            pillarAverage:  result.pillarAverage,
            integrityScore: result.integrity?.integrityScore,
            humanReview:    result.humanReviewNeeded,
            meta
        });

        // Self-monitor after each evaluation
        this._selfMonitor();

        return result;
    }

    // ── QUEUE ─────────────────────────────────────────────────────────────
    // Batch evaluation with async support

    enqueue(claim, sources = [], meta = {}) {
        this._queue.push({ claim, sources, meta });
    }

    async processQueue(onResult) {
        while (this._queue.length > 0) {
            const item = this._queue.shift();
            const result = this.evaluate(item.claim, item.sources, item.meta);
            if (typeof onResult === "function") await onResult(result);
        }
    }

    // ── HUMAN OVERRIDE ───────────────────────────────────────────────────
    // Humans can always disagree. Every disagreement is logged and studied.

    override({ evalId, agentVerdict, humanVerdict, reason, reviewer }) {
        this.ledger.recordOverride({ evalId, agentVerdict, humanVerdict, reason, reviewer });
        console.log(`[Honest Abe] Override recorded by ${reviewer}. Agent: "${agentVerdict}" → Human: "${humanVerdict}"`);

        // Feed back into TruthModel's reinforcement log
        TruthModel.submitFeedback({
            claim:        evalId,
            result:       { verdict: agentVerdict },
            humanVerdict,
            reason,
            reviewer
        });

        this._selfMonitor();
    }

    // ── SELF-MONITOR ─────────────────────────────────────────────────────
    // After every evaluation and override, check own performance.
    // If thresholds breached, propose — never self-apply.

    _selfMonitor() {
        const snap = this.ledger.snapshot();
        const t    = this.config.thresholds;

        if (snap.falsePositiveRate > t.maxFalsePositiveRate) {
            this._proposeIfNew({
                type:          "pattern_remove",
                description:   "False positive rate above threshold",
                rationale:     `Rate: ${snap.falsePositiveRate} > ${t.maxFalsePositiveRate}. Some patterns may be over-blocking legitimate claims.`,
                proposedChange: "Review and potentially relax framing detection patterns."
            });
        }

        if (snap.falseNegativeRate > t.maxFalseNegativeRate) {
            this._proposeIfNew({
                type:          "pattern_add",
                description:   "False negative rate above threshold",
                rationale:     `Rate: ${snap.falseNegativeRate} > ${t.maxFalseNegativeRate}. Some harmful claims are passing through.`,
                proposedChange: "Review recent overrides and consider new detection patterns."
            });
        }
    }

    _proposeIfNew({ type, description, rationale, proposedChange }) {
        // Don't spam duplicate proposals
        const existing = this.ledger.proposals.find(
            p => p.type === type && p.status === "pending" && p.description === description
        );
        if (existing) return;
        this.proposals.propose({ type, description, rationale, proposedChange });
    }

    // ── STATUS ────────────────────────────────────────────────────────────

    status() {
        const snap = this.ledger.snapshot();
        return {
            agent:             this.config.name,
            version:           this.config.version,
            constitution:      this.config.constitution,
            pillars:           this.config.pillars,
            performance:       snap,
            integrityPolicy:   this.config.selfUpdate,
        };
    }

    // ── FULL AUDIT EXPORT ─────────────────────────────────────────────────
    // Everything. Nothing hidden. TRANSPARENT is non-negotiable.

    exportAudit() {
        return {
            agent:       this.config.name,
            version:     this.config.version,
            exportedAt:  new Date().toISOString(),
            evaluations: this.ledger.evaluations,
            overrides:   this.ledger.overrides,
            proposals:   this.ledger.proposals,
            performance: this.ledger.snapshot()
        };
    }
}

// ── SINGLETON EXPORT ──────────────────────────────────────────────────────
// One agent. Shared. Transparent. Replaceable by the community at any time.

const agent = new HonestAbe();

if (typeof module !== "undefined") module.exports = { HonestAbe, agent, AGENT_CONFIG };
