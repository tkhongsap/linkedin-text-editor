from flask import Flask, request, render_template_string
import re
import os
from dotenv import load_dotenv

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

# HTML template with basic styling and clipboard functionality
HTML_TEMPLATE = """
<html>
<head>
    <title>LinkedIn Text Formatter</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 20px;
        }
        textarea {
            margin: 10px 0;
        }
        pre {
            background-color: #f0f0f0;
            padding: 10px;
            border-radius: 5px;
        }
    </style>
</head>
<body>
    <h1>LinkedIn Text Formatter</h1>
    <p>Use * for bold and _ for italic. For example: This is *bold* and this is _italic_. Ensure markers are properly closed and do not nest them.</p>
    <form method="post">
        <textarea name="text" rows="10" cols="50" placeholder="e.g., Hello *world*! This is _important_."></textarea><br>
        <input type="submit" value="Preview">
    </form>
    {% if formatted_text %}
        <h2>Preview:</h2>
        <pre id="preview">{{ formatted_text }}</pre>
        <button onclick="copyToClipboard()">Copy to Clipboard</button>
        <p><i>Note: If the copy button doesn't work, manually select and copy the text above.</i></p>
        <script>
            function copyToClipboard() {
                var text = document.getElementById('preview').textContent;
                navigator.clipboard.writeText(text).then(function() {
                    alert('Copied to clipboard');
                }, function(err) {
                    alert('Failed to copy: ' + err);
                });
            }
        </script>
    {% endif %}
</body>
</html>
"""

# Define the main route with proper error handling
@app.route('/', methods=['GET', 'POST'])
def index():
    if request.method == 'POST':
        try:
            user_text = request.form['text']
            formatted_text = parse_text(user_text)
        except Exception as error:
            formatted_text = "Error processing text: " + str(error)
        return render_template_string(HTML_TEMPLATE, formatted_text=formatted_text)
    return render_template_string(HTML_TEMPLATE)

# Run the app
if __name__ == '__main__':
    try:
        port = int(os.getenv('PORT', '8080'))
    except ValueError as error:
        print("Invalid PORT value. Using default port 8080.", error)
        port = 8080
    app.run(host='0.0.0.0', port=port)