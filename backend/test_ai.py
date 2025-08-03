import os
import google.generativeai as genai

# --- Configuration ---
# IMPORTANT: In your terminal, run `export GOOGLE_API_KEY="YOUR_API_KEY"` first
# to set your key as an environment variable. NEVER put your key directly in the code.
genai.configure(api_key=os.environ["GOOGLE_API_KEY"])

# --- Your Prompt ---
# This is the "brain" of your expense tracker
prompt = """
You are an expert expense categorization system for an Indian user.
From the user's text, extract the amount, category, and vendor.
The possible categories are: Food & Dining, Groceries, Shopping, Travel, Entertainment, Utilities, Health, Education, and Other.
The date should be today unless specified otherwise.
Respond ONLY with a valid JSON object. Do not add any other text or markdown.

User's Text: "chai aur samosa ke liye 75 rupaye kharch kiye at the local bakery"
Your JSON Response:
"""

# --- Calling the AI ---
model = genai.GenerativeModel('gemini-1.5-flash') # Using the faster model for this task
response = model.generate_content(prompt)

# --- Printing the Result ---
print("AI Response:")
print(response.text)