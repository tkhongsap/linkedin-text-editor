from flask import Flask, render_template, request, jsonify
import re
import os
import logging

# Configure logging
logging.basicConfig(level=logging.DEBUG)

app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "default-secret-key")

# Define character maps for formatting
BOLD_MAP = {chr(ord('A') + i): chr(0x1D400 + i) for i in range(26)}
BOLD_MAP.update({chr(ord('a') + i): chr(0x1D41A + i) for i in range(26)})
ITALIC_MAP = {chr(ord('A') + i): chr(0x1D434 + i) for i in range(26)}
ITALIC_MAP.update({chr(ord('a') + i): chr(0x1D44E + i) for i in range(26)})

def apply_style(text, style_map):
    """Apply Unicode style mapping to text"""
    return ''.join(style_map.get(c, c) for c in text)

def format_text(text):
    """Format text with bold and italic styles"""
    try:
        # Check for unmatched markers
        if text.count('*') % 2 != 0 or text.count('_') % 2 != 0:
            return {"error": "Unmatched formatting markers found"}

        # Apply bold formatting
        def bold_replacer(match):
            return apply_style(match.group(1), BOLD_MAP)
        
        # Apply italic formatting
        def italic_replacer(match):
            return apply_style(match.group(1), ITALIC_MAP)

        # Process the text
        formatted = text
        formatted = re.sub(r'\*(.*?)\*', bold_replacer, formatted)
        formatted = re.sub(r'_(.*?)_', italic_replacer, formatted)
        
        return {"text": formatted}
    except Exception as e:
        logging.error(f"Error formatting text: {str(e)}")
        return {"error": "An error occurred while formatting the text"}

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/format', methods=['POST'])
def format_text_endpoint():
    text = request.json.get('text', '')
    return jsonify(format_text(text))

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
