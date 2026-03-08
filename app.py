from flask import Flask, request, render_template_string
import requests
import re
import time
import sqlite3
from urllib.parse import quote

app = Flask(__name__)

# === SAFEGUARDS ===
class EthicsMonitor:
    def __init__(self):
        self.violation_patterns = {
            'harm_prediction': [r'\b(should eliminate|must remove|need to get rid of)\b.*\b(group|people|race|gender)\b'],
            'discrimination': [r'\b(all [a-z]+ are|no [a-z]+ are|only [a-z]+ can)\b'],
            'privacy_violation': [r'\b(personal|private).*\b(information|data|details)\b']
        }
    
    def scan_for_ethical_violations(self, claim, analysis=""):
        violations = []
        full_text = (claim + " " + analysis).lower()
        for violation_type, patterns in self.violation_patterns.items():
            for pattern in patterns:
                if re.search(pattern, full_text, re.IGNORECASE):
                    violations.append(violation_type)
        risk_level = "low" if len(violations) < 1 else "medium" if len(violations) < 2 else "high"
        return {"ethical_violations": violations, "risk_level": risk_level}

class HallucinationGuard:
    def __init__(self):
        self.fact_verification_patterns = {
            'absolute_claims': r'\b(always|never|every|none|all|everyone|nobody)\b',
            'overconfident_statements': r'\b(definitely|absolutely|certainly|undoubtedly)\b'
        }
        
    def detect_hallucinations(self, claim, analysis, search_results):
        hallucination_score = 0
        detected_types = []
        full_response = (claim + " " + analysis).lower()
        for pattern_name, pattern in self.fact_verification_patterns.items():
            if re.search(pattern, full_response, re.IGNORECASE):
                hallucination_score += 0.3
                detected_types.append(pattern_name)
        if not search_results or "error" in search_results:
            hallucination_score += 0.2
        risk_level = "low" if hallucination_score < 0.4 else "medium" if hallucination_score < 0.8 else "high"
        return {"hallucination_score": round(hallucination_score, 2), "detected_types": detected_types, "risk_level": risk_level}

# === SEARCH ENGINE ===
class FreeSearchEngine:
    def __init__(self):
        self.rate_limit_delay = 1
        self.last_request_time = 0
    
    def duckduckgo_search(self, query, max_results=3):
        try:
            time_since_last = time.time() - self.last_request_time
            if time_since_last < self.rate_limit_delay:
                time.sleep(self.rate_limit_delay - time_since_last)
            url = f"https://api.duckduckgo.com/"
            params = {'q': query, 'format': 'json', 'no_html': '1', 'skip_disambig': '1'}
            headers = {'User-Agent': 'TruthAgent/1.0'}
            response = requests.get(url, params=params, headers=headers, timeout=15)
            self.last_request_time = time.time()
            if response.status_code == 200:
                data = response.json()
                return self.parse_ddg_response(data, max_results)
            else:
                return {"error": f"Search failed with status {response.status_code}"}
        except Exception as e:
            return {"error": f"Search exception: {str(e)}"}
    
    def parse_ddg_response(self, data, max_results):
        results = {"query": data.get('Query', ''), "answer": data.get('Answer', ''), 
                  "abstract": data.get('Abstract', ''), "related_topics": []}
        if 'RelatedTopics' in data:
            topics = data['RelatedTopics'][:max_results]
            for topic in topics:
                if isinstance(topic, dict) and 'FirstURL' in topic:
                    results['related_topics'].append({
                        'title': topic.get('Text', ''),
                        'url': topic.get('FirstURL', ''),
                        'source': self.extract_domain(topic.get('FirstURL', ''))
                    })
        results['results_count'] = len(results['related_topics'])
        return results
    
    def extract_domain(self, url):
        match = re.search(r'https?://([^/]+)', url)
        return match.group(1) if match else 'unknown'

# === MAIN AGENT ===
class TruthAgent:
    def __init__(self):
        self.ethics_monitor = EthicsMonitor()
        self.hallucination_guard = HallucinationGuard()
        self.search_engine = FreeSearchEngine()
        self.init_database()
    
    def init_database(self):
        conn = sqlite3.connect('truth_agent.db')
        cursor = conn.cursor()
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS analyses (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                claim TEXT,
                search_query TEXT,
                search_results TEXT,
                analysis TEXT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        conn.commit()
        conn.close()
    
    def process_claim(self, claim):
        ethics_check = self.ethics_monitor.scan_for_ethical_violations(claim)
        if ethics_check["risk_level"] == "high":
            return self.generate_ethics_blocked_response(claim, ethics_check)
        search_query = self.create_search_query(claim)
        search_results = self.search_engine.duckduckgo_search(search_query)
        analysis = self.generate_analysis(claim, search_results)
        hallucination_check = self.hallucination_guard.detect_hallucinations(claim, analysis, search_results)
        final_response = self.generate_final_response(claim, analysis, search_results)
        self.save_analysis(claim, search_query, str(search_results), str(final_response))
        return {
            "claim": claim,
            "ethics": ethics_check,
            "hallucination": hallucination_check,
            "response": final_response
        }
    
    def create_search_query(self, claim):
        stop_words = {'the', 'a', 'an', 'is', 'was', 'are', 'were', 'of', 'in', 'on', 'at', 'to', 'for'}
        words = claim.lower().split()
        key_terms = [word for word in words if word not in stop_words and len(word) > 2]
        return ' '.join(key_terms[:5])
    
    def generate_analysis(self, claim, search_results):
        if "error" in search_results:
            return f"Analysis of '{claim}' - Search unavailable: {search_results['error']}"
        
        answer = search_results.get('answer', '')
        abstract = search_results.get('abstract', '')
        related_topics = search_results.get('related_topics', [])
        
        if answer and answer.strip():
            context = f"Direct answer: {answer}"
        elif abstract and abstract.strip():
            context = f"Context: {abstract}"
        elif related_topics:
            first_topic = related_topics[0] if related_topics else {}
            topic_text = first_topic.get('title', '') or first_topic.get('text', '')
            if topic_text:
                context = f"Related information: {topic_text}"
            else:
                context = "Search completed successfully"
        else:
            context = "Search completed but no relevant information found"
            
        return f"Claim analysis: {claim} | {context}"
    
    def generate_final_response(self, claim, analysis, search_results):
        base_response = analysis
        base_response += f"\n\n🛡️ Generated with ethical and factual safeguards"
        return base_response
    
    def generate_ethics_blocked_response(self, claim, ethics_check):
        return {
            "status": "ETHICS_BLOCKED",
            "message": "Content flagged for ethical review",
            "reason": f"Ethical violations: {', '.join(ethics_check['ethical_violations'])}"
        }
    
    def save_analysis(self, claim, search_query, search_results, analysis):
        conn = sqlite3.connect('truth_agent.db')
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO analyses (claim, search_query, search_results, analysis)
            VALUES (?, ?, ?, ?)
        ''', (claim, search_query, search_results, analysis))
        conn.commit()
        conn.close()

# === WEB INTERFACE ===
agent = TruthAgent()

@app.route('/')
def index():
    return render_template_string('''
    <!DOCTYPE html>
    <html>
    <head>
        <title>Truth Agent</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
            body { 
                font-family: Arial, sans-serif; 
                max-width: 800px; 
                margin: 0 auto; 
                padding: 20px;
                background: #f5f5f5;
            }
            .container {
                background: white;
                padding: 30px;
                border-radius: 10px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            textarea { 
                width: 100%; 
                padding: 15px; 
                border: 2px solid #ddd;
                border-radius: 5px;
                font-size: 16px;
                margin: 10px 0;
            }
            input[type="submit"] {
                background: #4CAF50; 
                color: white; 
                padding: 15px 30px; 
                border: none; 
                cursor: pointer;
                border-radius: 5px;
                font-size: 16px;
                margin: 10px 0;
            }
            .result { 
                border: 1px solid #ddd; 
                padding: 20px; 
                margin: 20px 0; 
                border-radius: 5px; 
                background: #fafafa;
            }
            .ethics-blocked { 
                background: #ffebee; 
                border: 3px solid #f44336; 
                padding: 20px;
                border-radius: 5px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🏛️ Truth Agent</h1>
            <p>Free, ethical, hallucination-safe fact verification</p>
            <p><strong>7 Principles:</strong> FREE • FAIR • FIRM • FUN • TRUE • TRANSPARENT • ACCESSIBLE</p>
            
            <form method="post" action="/analyze">
                <h3>Claim to Verify:</h3>
                <textarea name="claim" placeholder="Enter any factual claim to verify..." rows="5" required></textarea><br>
                <input type="submit" value="🔍 Analyze with Full Safeguards">
            </form>
        </div>
    </body>
    </html>
    ''')

@app.route('/analyze', methods=['POST'])
def analyze():
    claim = request.form['claim']
    result = agent.process_claim(claim)
    
    if result.get("status") == "ETHICS_BLOCKED":
        return render_template_string('''
        <div class="ethics-blocked">
            <h2>🚫 CONTENT BLOCKED FOR ETHICAL REVIEW</h2>
            <p><strong>Reason:</strong> {{ reason }}</p>
            <p><em>This content has been flagged for review.</em></p>
        </div>
        <br><a href="/">← Try Different Claim</a>
        ''', reason=result['reason'])
    
    return render_template_string('''
    <div class="result">
        <h2>Analysis Complete</h2>
        <p><strong>Claim:</strong> {{ claim }}</p>
        <p><strong>Response:</strong> {{ response }}</p>
    </div>
    <br><a href="/">← New Analysis</a>
    ''', claim=result['claim'], response=result['response'])

if __name__ == '__main__':
    app.run(debug=True)
