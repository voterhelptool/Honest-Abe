// User Interface with Abuse Prevention
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('truthForm');
    const claimInput = document.getElementById('claimInput');
    const resultsDiv = document.getElementById('results');
    
    // RATE LIMITING
    let lastRequestTime = 0;
    const requestDelay = 1000; // 1 second between requests
    
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // RATE LIMITING
        const now = Date.now();
        if (now - lastRequestTime < requestDelay) {
            showResult('Please wait before making another request', 'error');
            return;
        }
        lastRequestTime = now;
        
        const claim = claimInput.value.trim();
        
        if (!claim) {
            showResult('Please enter a claim to verify', 'error');
            return;
        }
        
        // MULTIPLE LAYERS OF ABUSE PREVENTION
        const abuseChecks = [
            ImmutableEthics.checkClaim(claim),
            ImmutableEthics.emergencyCheck(claim),
            TruthAPI.getAbuseStats().emergencyMode ? 
                { blocked: true, reason: "System in emergency lockdown mode" } : 
                { blocked: false }
        ];
        
        const blockedCheck = abuseChecks.find(check => check.blocked);
        if (blockedCheck) {
            showBlockedResult(blockedCheck.reason, blockedCheck.confidence || 0.9);
            return;
        }
        
        // Show loading
        showResult('🔍 Analyzing with multiple abuse prevention layers...', 'loading');
        
        try {
            const sources = await TruthAPI.getMultipleSources(claim);
            
            if (sources.length > 0) {
                displayResults(sources, claim);
            } else {
                showResult('No information found in free databases. This may be due to safety filtering.', 'info');
            }
            
        } catch (error) {
            if (error.message.includes('blocked')) {
                showBlockedResult('Content blocked for safety reasons', 0.95);
            } else {
                showResult(`Error during analysis: ${error.message}`, 'error');
            }
        }
    });
});

function showResult(message, type) {
    const className = `result ${type || ''}`;
    document.getElementById('results').innerHTML = 
        `<div class="${className}">${message}</div>`;
}

function showBlockedResult(reason, confidence) {
    const confidenceText = confidence > 0.9 ? 'HIGH CONFIDENCE' : 
                          confidence > 0.7 ? 'MEDIUM CONFIDENCE' : 'PRECAUTIONARY';
                          
    document.getElementById('results').innerHTML = `
        <div class="ethics-blocked">
            <h2>🚫 CONTENT BLOCKED FOR SAFETY</h2>
            <p><strong>Reason:</strong> ${reason}</p>
            <p><strong>Confidence:</strong> ${confidenceText}</p>
            <p><em>This automated system blocked content that may promote harm. 
            No human review is required - the system acts independently.</em></p>
            <details>
                <summary>Technical Details</summary>
                <p>Blocked by pattern matching, structural analysis, and contextual review.</p>
                <p>No personal data is collected from this interaction.</p>
            </details>
        </div>
    `;
}

function displayResults(sources, originalClaim) {
    let html = '<div class="result">';
    html += `<h2>Analysis Complete</h2>`;
    html += `<p><strong>Claim:</strong> ${originalClaim}</p>`;
    
    sources.forEach(source => {
        html += `<h3>Results from ${source.name}:</h3>`;
        
        if (source.type === 'wikipedia') {
            html += `<p><strong>Title:</strong> ${source.data.title || 'No title'}</p>`;
            html += `<p><strong>Description:</strong> ${source.data.extract || 'No description'}</p>`;
        } else if (source.type === 'duckduckgo') {
            html += `<p><strong>Answer:</strong> ${source.data.Answer || 'No direct answer'}</p>`;
            html += `<p><strong>Abstract:</strong> ${source.data.Abstract || 'No abstract'}</p>`;
        }
    });
    
    html += `<p><small>🛡️ Verified with automated abuse prevention</small></p>`;
    html += '</div>';
    
    document.getElementById('results').innerHTML = html;
}
