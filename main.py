from flask import Flask, request, render_template, jsonify
import re
import os
import logging
from dotenv import load_dotenv

# Set up logging
logging.basicConfig(level=logging.DEBUG)

# Load environment variables from .env file
load_dotenv()

# Define style maps for formatting using Unicode characters
bold_map = {chr(ord('A') + i): chr(0x1D400 + i) for i in range(26)}
bold_map.update({chr(ord('a') + i): chr(0x1D41A + i) for i in range(26)})
bold_map.update({str(i): chr(0x1D7CE + i) for i in range(10)})  # Add bold numbers

italic_map = {chr(ord('A') + i): chr(0x1D434 + i) for i in range(26)}
italic_map.update({chr(ord('a') + i): chr(0x1D44E + i) for i in range(26)})

# Common punctuation and symbols to preserve in formatting
for char in "!@#$%^&*()_+-=[]{}|;:'\",.<>/?`~ ":
    bold_map[char] = char
    italic_map[char] = char

# Function to apply a style to text
def apply_style(text, style_map):
    return ''.join(style_map.get(char, char) for char in text)

# Function to parse text and apply styles based on markers
def parse_text(text):
    # Handle special formatting cases - we'll break the text into segments
    # so we can apply different formatting to different parts
    
    # Bold text replacer
    def bold_replacer(match):
        return apply_style(match.group(1), bold_map)
    
    # Italic text replacer
    def italic_replacer(match):
        return apply_style(match.group(1), italic_map)
    
    # Apply formatting - order matters to handle nested formatting
    # Process all markdown-style formatting markers
    text = re.sub(r'\*\*(.*?)\*\*', bold_replacer, text)  # **bold** syntax
    text = re.sub(r'\*(.*?)\*', bold_replacer, text)      # *bold* syntax (also common)
    text = re.sub(r'__(.*?)__', bold_replacer, text)      # __bold__ syntax
    text = re.sub(r'_(.*?)_', italic_replacer, text)      # _italic_ syntax
    
    # Process HTML-like tags (common in rich text editors)
    text = re.sub(r'<b>(.*?)</b>', bold_replacer, text)           # <b>bold</b>
    text = re.sub(r'<strong>(.*?)</strong>', bold_replacer, text) # <strong>bold</strong>
    text = re.sub(r'<i>(.*?)</i>', italic_replacer, text)         # <i>italic</i>
    text = re.sub(r'<em>(.*?)</em>', italic_replacer, text)       # <em>italic</em>
    
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