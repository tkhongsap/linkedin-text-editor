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
# Mathematical Bold characters (for bold formatting)
bold_map = {chr(ord('A') + i): chr(0x1D400 + i) for i in range(26)}  # Uppercase
bold_map.update({chr(ord('a') + i): chr(0x1D41A + i) for i in range(26)})  # Lowercase
bold_map.update({str(i): chr(0x1D7CE + i) for i in range(10)})  # Numbers

# Mathematical Italic characters (for italic formatting)
# LinkedIn supports Mathematical Italic Unicode range
italic_map = {chr(ord('A') + i): chr(0x1D434 + i) for i in range(26)}  # Uppercase
italic_map.update({chr(ord('a') + i): chr(0x1D44E + i) for i in range(26)})  # Lowercase
# Also add numbers with italic styling
italic_map.update({str(i): chr(0x1D7F6 + i) for i in range(10)})  # Numbers in italic

# Special characters for bullet points in LinkedIn
bullet_map = {
    '•': '•',           # Standard bullet point (U+2022)
    '○': '○',           # White bullet (U+25E6)
    '▪': '▪',           # Black small square (U+25AA)
    '■': '■',           # Black square (U+25A0)
    '►': '►',           # Black right-pointing triangle (U+25B6)
    '★': '★',           # Black star (U+2605)
    '✓': '✓',           # Check mark (U+2713)
    '✔': '✔',           # Heavy check mark (U+2714)
    '-': '—',           # Em dash (for list items)
    '*': '•',           # Asterisk to bullet conversion
}

# Common punctuation and symbols to preserve in formatting
for char in "!@#$%^&*()_+-=[]{}|;:'\",.<>/?`~ \n":
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
    
    # Convert bullet lists properly
    def process_bullet_points(text):
        # Process unordered list items from HTML
        text = re.sub(r'<li>(.*?)</li>', r'• \1\n', text)
        
        # Process bullet points at the start of lines (common in plain text)
        text = re.sub(r'^\s*[-*]\s+(.*?)$', r'• \1', text, flags=re.MULTILINE)
        
        # Convert markdown list items
        text = re.sub(r'^\s*[-*+]\s+(.*?)$', r'• \1', text, flags=re.MULTILINE)
        
        # Handle ordered lists from HTML
        # Convert to numbered format that LinkedIn accepts
        ordered_list_pattern = r'<ol>(.*?)</ol>'
        ordered_list_matches = re.findall(ordered_list_pattern, text, re.DOTALL)
        for ol_content in ordered_list_matches:
            # Extract list items
            items = re.findall(r'<li>(.*?)</li>', ol_content)
            # Create formatted numbered list
            numbered_list = '\n'.join([f"{i+1}. {item}" for i, item in enumerate(items)])
            # Replace the original <ol> content with the numbered list
            text = text.replace(f"<ol>{ol_content}</ol>", numbered_list)
        
        return text

    # Process bullet points first
    text = process_bullet_points(text)
    
    # Process list elements in HTML
    text = re.sub(r'<ul>(.*?)</ul>', lambda m: m.group(1), text, flags=re.DOTALL)
    text = re.sub(r'<ol>(.*?)</ol>', lambda m: m.group(1), text, flags=re.DOTALL)
    
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
    
    # Make sure line breaks are preserved properly for LinkedIn
    text = re.sub(r'<br\s*/?>|<div>|<p>', '\n', text)
    text = re.sub(r'</div>|</p>', '', text)
    
    # Ensure double line breaks for paragraphs (LinkedIn styling)
    text = re.sub(r'\n\s*\n', '\n\n', text)
    
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
        
        # Clean up any invisible formatting that might cause issues
        user_text = re.sub(r'[\u200B-\u200F\uFEFF]', '', user_text)
        
        # Process the text for LinkedIn formatting
        formatted_text = parse_text(user_text)
        
        # Ensure all line breaks are consistent for LinkedIn
        formatted_text = re.sub(r'\r\n', '\n', formatted_text)
        
        # Add a non-breaking space at the beginning of lines starting with bullet points
        # This helps LinkedIn preserve bullet points when pasted
        formatted_text = re.sub(r'(^|\n)(•)', r'\1 \2', formatted_text)
        
        logging.debug(f"Formatted text: {formatted_text}")
        return jsonify({"formatted_text": formatted_text})
    except Exception as error:
        logging.error(f"Error processing text: {error}")
        return jsonify({"error": f"Error processing text: {str(error)}"}), 500

# Run the app
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)