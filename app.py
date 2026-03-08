# Add this near the top of your app.py
class ImmutableEthics:
    def __init__(self):
        self.forbidden_patterns = [
            r'\bnazis (are )?(good|right|correct|justified)\b',
            r'\b(holocaust|genocide).*(didn.t|did not|never).*(happen|exist)\b',
            r'\b(eliminate|remove|purge).*minority\b',
            r'\b(superior race|inferior group)\b'
        ]
    
    def scan_claim(self, claim):
        for pattern in self.forbidden_patterns:
            if re.search(pattern, claim.lower()):
                return {
                    "blocked": True,
                    "reason": "Content violates immutable ethical principles",
                    "evidence": f"Matches pattern: {pattern}"
                }
        return {"blocked": False}

# Add to your TruthAgent __init__:
# self.immutable_guard = ImmutableEthics()

# Add to process_claim method BEFORE other checks:
# ethics_violation = self.immutable_guard.scan_claim(claim)
# if ethics_violation["blocked"]:
#     return {"status": "ETHICS_BLOCKED_PERMANENT", "reason": ethics_violation["reason"]}
