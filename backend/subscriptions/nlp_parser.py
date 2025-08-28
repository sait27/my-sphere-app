import json
import re
from datetime import datetime, timedelta
from django.utils import timezone
import google.generativeai as genai
import os

GOOGLE_API_KEY = os.environ.get('GEMINI_API_KEY', '')
if GOOGLE_API_KEY:
    genai.configure(api_key=GOOGLE_API_KEY)

class SubscriptionNLPParser:
    """AI-powered natural language parser for subscription creation"""
    
    def __init__(self):
        self.model = genai.GenerativeModel('gemini-1.5-flash') if GOOGLE_API_KEY else None
    
    def parse_subscription_query(self, query):
        """Parse natural language subscription description"""
        if not self.model:
            return self._fallback_parse(query)
        
        try:
            prompt = self._generate_parse_prompt(query)
            response = self.model.generate_content(prompt)
            
            # Clean and parse JSON response
            cleaned_response = response.text.strip().replace('`', '').replace('json', '')
            parsed_data = json.loads(cleaned_response)
            
            # Post-process dates
            parsed_data = self._process_dates(parsed_data)
            
            return {
                'success': True,
                'parsed_data': parsed_data,
                'confidence': parsed_data.get('confidence', 0.8)
            }
            
        except Exception as e:
            print(f"AI parsing failed: {e}")
            return self._fallback_parse(query)
    
    def _generate_parse_prompt(self, query):
        """Generate detailed prompt for AI parsing"""
        today = timezone.now().date().isoformat()
        
        return f"""
        Parse this subscription description into structured data. Today's date is {today}.
        
        User input: "{query}"
        
        Extract information and return ONLY valid JSON:
        {{
            "name": "service name (e.g., Netflix, Spotify Premium)",
            "provider": "company name (e.g., Netflix Inc., Spotify)",
            "amount": "numeric amount only (e.g., 15.99)",
            "billing_cycle": "weekly|monthly|quarterly|yearly",
            "start_date": "YYYY-MM-DD format or null",
            "next_billing_date": "YYYY-MM-DD format or null", 
            "payment_method": "card|bank_transfer|paypal|other",
            "description": "any additional notes",
            "confidence": 0.95
        }}
        
        Rules:
        1. Extract only numeric amount (no currency symbols)
        2. Standardize billing cycles: "per month"→"monthly", "annual"→"yearly"
        3. Convert relative dates: "today"→{today}, "tomorrow"→next day
        4. Payment methods: "upi"→"upi", "card"→"card", "bank"→"bank_transfer"
        5. If start_date not specified, use today's date
        6. Always calculate next_billing_date based on start_date and billing_cycle
        7. Set confidence based on how much information was extracted
        8. Provide default values for required fields if missing
        
        Examples:
        "Netflix 15.99 monthly" → {{"name": "Netflix", "provider": "Netflix", "amount": "15.99", "billing_cycle": "monthly", "start_date": "{today}", "next_billing_date": "next month", "payment_method": "card", "confidence": 0.9}}
        "Jio 200 monthly today next month UPI" → {{"name": "Jio", "provider": "Jio", "amount": "200", "billing_cycle": "monthly", "start_date": "{today}", "next_billing_date": "next month", "payment_method": "upi", "confidence": 0.95}}
        "Spotify premium 9.99 per month starting tomorrow" → {{"name": "Spotify Premium", "provider": "Spotify", "amount": "9.99", "billing_cycle": "monthly", "start_date": "{(datetime.now() + timedelta(days=1)).date().isoformat()}", "next_billing_date": "calculated", "payment_method": "card", "confidence": 0.95}}
        """
    
    def _process_dates(self, data):
        """Process and validate date fields"""
        today = timezone.now().date()
        
        # Process start_date
        if data.get('start_date'):
            if data['start_date'].lower() == 'today':
                data['start_date'] = today.isoformat()
            elif data['start_date'].lower() == 'tomorrow':
                data['start_date'] = (today + timedelta(days=1)).isoformat()
        else:
            # Default to today if not specified
            data['start_date'] = today.isoformat()
        
        # Process next_billing_date
        if data.get('next_billing_date'):
            if 'next month' in data['next_billing_date'].lower():
                # Calculate next month from start date
                start_date = datetime.fromisoformat(data['start_date']).date()
                if start_date.month == 12:
                    next_billing = start_date.replace(year=start_date.year + 1, month=1)
                else:
                    next_billing = start_date.replace(month=start_date.month + 1)
                data['next_billing_date'] = next_billing.isoformat()
        
        # Auto-calculate next_billing_date if not provided or still relative
        if not data.get('next_billing_date') or 'next month' in str(data.get('next_billing_date', '')).lower():
            start_date = datetime.fromisoformat(data['start_date']).date()
            billing_cycle = data.get('billing_cycle', 'monthly')
            
            if billing_cycle == 'weekly':
                data['next_billing_date'] = (start_date + timedelta(weeks=1)).isoformat()
            elif billing_cycle == 'monthly':
                # Calculate next month properly
                if start_date.month == 12:
                    next_billing = start_date.replace(year=start_date.year + 1, month=1)
                else:
                    next_billing = start_date.replace(month=start_date.month + 1)
                data['next_billing_date'] = next_billing.isoformat()
            elif billing_cycle == 'quarterly':
                data['next_billing_date'] = (start_date + timedelta(days=90)).isoformat()
            elif billing_cycle == 'yearly':
                data['next_billing_date'] = (start_date + timedelta(days=365)).isoformat()
        
        return data
    
    def _fallback_parse(self, query):
        """Fallback parsing using regex when AI is unavailable"""
        today = timezone.now().date()
        
        parsed_data = {
            'name': None,
            'provider': None,
            'amount': None,
            'billing_cycle': 'monthly',
            'start_date': today.isoformat(),
            'next_billing_date': None,
            'payment_method': 'card',
            'description': query,
            'confidence': 0.3
        }
        
        # Extract amount using regex
        amount_match = re.search(r'(\d+\.?\d*)', query)
        if amount_match:
            parsed_data['amount'] = amount_match.group(1)
            parsed_data['confidence'] += 0.2
        
        # Extract billing cycle
        if any(word in query.lower() for word in ['monthly', 'month', 'per month']):
            parsed_data['billing_cycle'] = 'monthly'
            parsed_data['confidence'] += 0.1
        elif any(word in query.lower() for word in ['yearly', 'annual', 'year']):
            parsed_data['billing_cycle'] = 'yearly'
            parsed_data['confidence'] += 0.1
        elif any(word in query.lower() for word in ['weekly', 'week']):
            parsed_data['billing_cycle'] = 'weekly'
            parsed_data['confidence'] += 0.1
        
        # Extract payment method
        if any(word in query.lower() for word in ['upi', 'gpay', 'paytm']):
            parsed_data['payment_method'] = 'upi'
            parsed_data['confidence'] += 0.1
        elif any(word in query.lower() for word in ['bank', 'transfer', 'neft']):
            parsed_data['payment_method'] = 'bank_transfer'
            parsed_data['confidence'] += 0.1
        
        # Extract service name (first word, capitalized)
        words = query.split()
        if words:
            service_name = words[0].capitalize()
            parsed_data['name'] = service_name
            parsed_data['provider'] = service_name
            parsed_data['confidence'] += 0.2
        
        # Handle date parsing
        if 'today' in query.lower():
            parsed_data['start_date'] = today.isoformat()
        
        # Calculate next billing date
        if parsed_data['start_date']:
            start_date = datetime.fromisoformat(parsed_data['start_date']).date()
            if parsed_data['billing_cycle'] == 'monthly':
                # Add one month
                if start_date.month == 12:
                    next_billing = start_date.replace(year=start_date.year + 1, month=1)
                else:
                    next_billing = start_date.replace(month=start_date.month + 1)
                parsed_data['next_billing_date'] = next_billing.isoformat()
            elif parsed_data['billing_cycle'] == 'yearly':
                parsed_data['next_billing_date'] = (start_date + timedelta(days=365)).isoformat()
            elif parsed_data['billing_cycle'] == 'weekly':
                parsed_data['next_billing_date'] = (start_date + timedelta(weeks=1)).isoformat()
        
        return {
            'success': True,
            'parsed_data': parsed_data,
            'confidence': parsed_data['confidence']
        }