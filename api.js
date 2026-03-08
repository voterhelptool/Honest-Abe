// API with Built-in Abuse Prevention
class TruthAPI {
    static abuseLog = []; // Track suspicious activity
    
    static async searchWikipedia(query) {
        try {
            // PRE-CHECK FOR ABUSIVE QUERIES
            const abuseCheck = ImmutableEthics.checkClaim(query);
            if (abuseCheck.blocked && abuseCheck.confidence > 0.7) {
                this.logAbuse(query, 'wikipedia_blocked', abuseCheck);
                throw new Error('Query blocked for safety reasons');
            }
            
            const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`;
            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'TruthAgent/1.0 (Safety-Focused)'
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                // POST-CHECK RESULTS FOR PROBLEMATIC CONTENT
                if (data.extract && this.containsProblematicContent(data.extract)) {
                    this.logAbuse(query, 'wikipedia_problematic_result', {content: data.extract});
                    return null; // Don't return problematic results
                }
                return data;
            }
            return null;
        } catch (error) {
            console.error('Wikipedia API error:', error);
            return null;
        }
    }
    
    static async searchDuckDuckGo(query) {
        try {
            // ABUSE PREVENTION
            const abuseCheck = ImmutableEthics.checkClaim(query);
            if (abuseCheck.blocked && abuseCheck.confidence > 0.7) {
                this.logAbuse(query, 'ddg_blocked', abuseCheck);
                throw new Error('Query blocked for safety reasons');
            }
            
            const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1`;
            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'TruthAgent/1.0 (Safety-Focused)'
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                // CHECK RESULTS
                if (this.containsProblematicContent(data.Abstract || data.Answer)) {
                    this.logAbuse(query, 'ddg_problematic_result', data);
                    return null;
                }
                return data;
            }
            return null;
        } catch (error) {
            console.error('DuckDuckGo API error:', error);
            return null;
        }
    }
    
    static containsProblematicContent(content) {
        if (!content) return false;
        
        // Check if API results contain problematic content
        const check = ImmutableEthics.checkClaim(content.substring(0, 1000)); // First 1000 chars
        return check.blocked && check.confidence > 0.8;
    }
    
    static logAbuse(query, type, details) {
        this.abuseLog.push({
            timestamp: new Date().toISOString(),
            query: query,
            type: type,
            details: details
        });
        
        // Auto-enable emergency mode if too much abuse
        if (this.abuseLog.length > 10) {
            const recentAbuse = this.abuseLog.slice(-10);
            const highConfidenceAbuse = recentAbuse.filter(log => 
                log.details.confidence > 0.8
            );
            
            if (highConfidenceAbuse.length > 5) {
                console.warn('AUTO-ENABLING EMERGENCY MODE - HIGH ABUSE DETECTED');
                ImmutableEthics.setEmergencyMode(true);
            }
        }
    }
    
    static getAbuseStats() {
        return {
            totalAttempts: this.abuseLog.length,
            recentBlocks: this.abuseLog.slice(-50), // Last 50 attempts
            emergencyMode: ImmutableEthics.emergencyBlockMode
        };
    }
}
