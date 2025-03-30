from flask import Flask, request, render_template, jsonify
import re
import os
import logging
from dotenv import load_dotenv

# Set up logging
logging.basicConfig(level=logging.DEBUG)

# Load environment variables from .env file
load_dotenv()

# Define style maps for bold and italic using Unicode characters
bold_map = {chr(ord('A') + i): chr(0x1D400 + i) for i in range(26)}
bold_map.update({chr(ord('a') + i): chr(0x1D41A + i) for i in range(26)})
italic_map = {chr(ord('A') + i): chr(0x1D434 + i) for i in range(26)}
italic_map.update({chr(ord('a') + i): chr(0x1D44E + i) for i in range(26)})

# Function to apply a style to text
def apply_style(text, style_map):
    return ''.join(style_map.get(char, char) for char in text)

# Function to parse text and apply styles based on markers
def parse_text(text):
    def bold_replacer(match):
        return apply_style(match.group(1), bold_map)
    def italic_replacer(match):
        return apply_style(match.group(1), italic_map)
    text = re.sub(r'\*(.*?)\*', bold_replacer, text)
    text = re.sub(r'_(.*?)_', italic_replacer, text)
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