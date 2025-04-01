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
    # First, clean up HTML tags and convert them to appropriate formats
    # Replace <div> and <p> tags with newlines for proper formatting
    text = re.sub(r'<div[^>]*>|<p[^>]*>', '\n', text)
    text = re.sub(r'</div>|</p>', '', text)
    
    # Convert any <br> tags to newlines
    text = re.sub(r'<br\s*/?>', '\n', text)
    
    # Handle special formatting cases for LinkedIn
    
    # Bold text replacer - use Unicode for bold (more reliable in LinkedIn)
    def bold_replacer(match):
        return apply_style(match.group(1), bold_map)
    
    # Process bullet lists
    # LinkedIn displays bullet points properly when using the actual bullet character
    def process_bullet_points(text):
        # Convert HTML list items to bullet points
        text = re.sub(r'<li[^>]*>(.*?)</li>', r'• \1\n', text, flags=re.DOTALL)
        
        # Convert markdown-style list items to bullet points
        text = re.sub(r'(?m)^\s*[-*]\s+(.*?)$', r'• \1', text)
        
        # Ensure bullet points have proper spacing
        text = re.sub(r'•\s*', '• ', text)
        
        return text
    
    # Process list HTML elements first
    text = re.sub(r'<ul[^>]*>(.*?)</ul>', lambda m: process_bullet_points(m.group(1)), text, flags=re.DOTALL)
    text = re.sub(r'<ol[^>]*>(.*?)</ol>', lambda m: m.group(1), text, flags=re.DOTALL)
    
    # Then process any standalone bullet points
    text = process_bullet_points(text)
    
    # Process formatting for bold and italic
    # For bold: LinkedIn supports *bold text* but Unicode is more reliable for mobile
    text = re.sub(r'\*\*(.*?)\*\*', bold_replacer, text)  # **bold** to Unicode
    text = re.sub(r'\*(.*?)\*', bold_replacer, text)      # *bold* to Unicode
    text = re.sub(r'__(.*?)__', bold_replacer, text)      # __bold__ to Unicode
    
    # For italic: LinkedIn supports _italic text_ or *italic text*
    # We'll use the _italic_ syntax which is LinkedIn's standard
    text = re.sub(r'<i[^>]*>(.*?)</i>', r'_\1_', text, flags=re.DOTALL)       # <i>text</i> to _text_
    text = re.sub(r'<em[^>]*>(.*?)</em>', r'_\1_', text, flags=re.DOTALL)     # <em>text</em> to _text_
    
    # Process remaining HTML-like tags for bold
    text = re.sub(r'<b[^>]*>(.*?)</b>', bold_replacer, text, flags=re.DOTALL)
    text = re.sub(r'<strong[^>]*>(.*?)</strong>', bold_replacer, text, flags=re.DOTALL)
    
    # Clean up any excessive spaces or newlines
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