// Strong Abuse Prevention with Volunteer Enhancement
class ImmutableEthics {
    // CORE PROTECTION - ALWAYS ACTIVE
    static forbiddenPatterns = [
        // Historical Denial
        /nazis (are )?(good|right|correct|justified|beneficial)/i,
        /(holocaust|genocide|slavery).*(didn\.t|did not|never).*(happen|exist|real)/i,
        /(eliminate|remove|purge|exterminate).*minority/i,
        
        // Hate Groups
        /(kkk|neo.nazi|white supremacist)/i,
        /(inferior|superior).*race/i,
        /(racial purity|ethnic cleansing)/i,
        
        // Violence Promotion
        /(kill all|eliminate.*group|remove.*people)/i,
        /(bomb|attack|destroy).*innocent/i,
        /(harm|injure|kill).*(children|women|elderly)/i
    ];
    
    // AUTOMATED PROTECTION (NO VOLUNTEER DEPENDENCE)
    static checkClaim(claim) {
        // THESE WORK 100% WITHOUT VOLUNTEERS
        for (let pattern of this.forbiddenPatterns) {
            if (pattern.test(claim)) {
                return {
                    blocked: true,
                    reason: "Contains prohibited content patterns",
                    confidence: 0.95,
                    category: "pattern_violation",
                    automated: true // CLEARLY MARKED AS AUTOMATED
                };
            }
        }
        return { blocked: false };
    }
    
    // VOLUNTEER-ENHANCED FEATURES (NICE TO HAVE)
    static volunteerEnhancedPatterns = [
        // Community-identified problematic patterns
        // These are added by volunteers but system works without them
    ];
    
    static addVolunteerPattern(pattern, description) {
        // Volunteers can suggest additions
        // But system operates fine without these
        console.log(`Volunteer pattern suggestion: ${description}`);
        // In full implementation, this would be reviewed by community
    }
}
