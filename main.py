from flask import Flask, request, render_template, jsonify
import re
import os
import logging
from dotenv import load_dotenv

# Set up logging
logging.basicConfig(level=logging.DEBUG)

# Load environment variables from .env file
load_dotenv()

# LinkedIn actually supports a specific set of markdown-like syntax
# Instead of using Unicode characters, we'll use LinkedIn's supported formatting

# For bold: LinkedIn supports *bold* syntax
# For italic: LinkedIn supports _italic_ syntax (but doesn't display well in all cases)
# For bullet points: LinkedIn supports standard bullet points with proper formatting

# Define style maps for formatting using Unicode characters (only for BOLD)
# Since LinkedIn's native bold with asterisks doesn't always work in mobile
bold_map = {chr(ord('A') + i): chr(0x1D400 + i) for i in range(26)}  # Uppercase
bold_map.update({chr(ord('a') + i): chr(0x1D41A + i) for i in range(26)})  # Lowercase
bold_map.update({str(i): chr(0x1D7CE + i) for i in range(10)})  # Numbers

# Common punctuation and symbols to preserve in formatting
for char in "!@#$%^&*()_+-=[]{}|;:'\",.<>/?`~ \n":
    bold_map[char] = char

# Function to apply a style to text
def apply_style(text, style_map):
    return ''.join(style_map.get(char, char) for char in text)

# Function to parse text and apply styles based on markers
def parse_text(text):
    # First, process the input text to detect HTML tags
    # For LinkedIn, we need to convert HTML formatting to LinkedIn-friendly formatting
    # This includes converting <b> to *text*, <i> to _text_, etc.
    
    # Process white space and containers first
    text = re.sub(r'<div[^>]*>|<p[^>]*>', '\n', text, flags=re.DOTALL)
    text = re.sub(r'</div>|</p>', '', text)
    text = re.sub(r'<br\s*/?>', '\n', text)
    
    # Process bullet points 
    def process_bullet_points(text):
        # Handle HTML lists
        text = re.sub(r'<li[^>]*>(.*?)</li>', r'• \1\n', text, flags=re.DOTALL)
        
        # Handle markdown-style lists
        text = re.sub(r'(?m)^\s*[-*]\s+(.*?)$', r'• \1', text)
        
        # Ensure proper spacing for bullet points
        text = re.sub(r'•\s*', '• ', text)
        
        return text
    
    # Process list elements
    text = re.sub(r'<ul[^>]*>(.*?)</ul>', lambda m: process_bullet_points(m.group(1)), text, flags=re.DOTALL)
    text = re.sub(r'<ol[^>]*>(.*?)</ol>', lambda m: m.group(1), text, flags=re.DOTALL)
    
    # Handle standalone bullet points
    text = process_bullet_points(text)
    
    # Bold formatting handlers
    def bold_to_linkedin(match):
        # Use Unicode characters for bold in LinkedIn (more reliable)
        return apply_style(match.group(1), bold_map)
    
    # Convert HTML bold tags to LinkedIn formatting
    text = re.sub(r'<b[^>]*>(.*?)</b>', lambda m: f"*{m.group(1)}*", text, flags=re.DOTALL)
    text = re.sub(r'<strong[^>]*>(.*?)</strong>', lambda m: f"*{m.group(1)}*", text, flags=re.DOTALL)
    
    # Convert HTML italic tags to LinkedIn formatting
    text = re.sub(r'<i[^>]*>(.*?)</i>', lambda m: f"_{m.group(1)}_", text, flags=re.DOTALL)
    text = re.sub(r'<em[^>]*>(.*?)</em>', lambda m: f"_{m.group(1)}_", text, flags=re.DOTALL)
    
    # Handle any markdown-style formatting in the text too
    text = re.sub(r'\*\*(.*?)\*\*', bold_to_linkedin, text)  # **bold**
    text = re.sub(r'\*(.*?)\*', bold_to_linkedin, text)      # *bold*
    
    # Clean up the text
    text = re.sub(r' +', ' ', text)  # Multiple spaces to single space
    text = re.sub(r'\n\s*\n', '\n\n', text)  # Multiple newlines to double newline
    text = re.sub(r'^\s+|\s+$', '', text, flags=re.MULTILINE)  # Trim lines
    
    return text

# Initialize the Flask app
app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET")

# Define the main route with proper error handling
@app.route('/', methods=['GET', 'POST'])
def index():
    return render_template('index.html')

# API endpoint for formatting text
@app.route('/api/format', methods=['POST'])
def format_text():
    try:
        data = request.get_json()
        user_text = data.get('text', '')
        formatted_text = parse_text(user_text)
        logging.debug(f"Formatted text: {formatted_text}")
        return jsonify({"formatted_text": formatted_text})
    except Exception as error:
        logging.error(f"Error processing text: {error}")
        return jsonify({"error": f"Error processing text: {str(error)}"}), 500

# Run the app
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)