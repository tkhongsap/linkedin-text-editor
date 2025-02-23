from flask import Flask, request, render_template_string
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

# HTML template with basic styling and clipboard functionality
HTML_TEMPLATE = """
<html>
<head>
    <title>LinkedIn Text Formatter</title>
    <link rel="icon" type="image/svg+xml" href="{{ url_for('static', filename='favicon.svg') }}">
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 20px;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            background-color: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        textarea {
            width: 100%;
            margin: 10px 0;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 16px;
        }
        pre {
            background-color: #f8f9fa;
            padding: 15px;
            border-radius: 4px;
            border: 1px solid #ddd;
            white-space: pre-wrap;
            word-wrap: break-word;
        }
        button {
            background-color: #0a66c2;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 16px;
        }
        button:hover {
            background-color: #004182;
        }
        .instructions {
            background-color: #e8f4f8;
            padding: 15px;
            border-radius: 4px;
            margin-bottom: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>LinkedIn Text Formatter</h1>
        <div class="instructions">
            <p><strong>How to use:</strong></p>
            <p>Use * for bold and _ for italic. For example: This is *bold* and this is _italic_.</p>
            <p><em>Note: Ensure markers are properly closed and do not nest them.</em></p>
        </div>
        <form id="formatterForm" method="post">
            <textarea name="text" id="inputText" rows="10" placeholder="e.g., Hello *world*! This is _important_." {% if request.form.get('text') %}value="{{ request.form.get('text') }}"{% endif %}>{{ request.form.get('text', '') }}</textarea><br>
            <button type="submit">Preview</button>
        </form>
        <div id="previewSection" {% if not formatted_text %}style="display: none"{% endif %}>
            <h2>Preview:</h2>
            <pre id="preview">{{ formatted_text or '' }}</pre>
            <button onclick="copyToClipboard()">Copy to Clipboard</button>
            <p><i>Note: If the copy button doesn't work, manually select and copy the text above.</i></p>
        </div>
        <script>
            document.getElementById('formatterForm').addEventListener('submit', function(e) {
                e.preventDefault();

                const formData = new FormData(this);
                fetch('/', {
                    method: 'POST',
                    body: formData
                })
                .then(response => response.text())
                .then(html => {
                    // Parse the response HTML to extract the formatted text
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(html, 'text/html');
                    const formattedText = doc.getElementById('preview').textContent;

                    // Update the preview section
                    document.getElementById('preview').textContent = formattedText;
                    document.getElementById('previewSection').style.display = 'block';
                })
                .catch(error => {
                    console.error('Error:', error);
                    alert('An error occurred while formatting the text.');
                });
            });

            function copyToClipboard() {
                var text = document.getElementById('preview').textContent;
                navigator.clipboard.writeText(text).then(function() {
                    alert('Copied to clipboard!');
                }, function(err) {
                    alert('Failed to copy: ' + err);
                });
            }
        </script>
    </div>
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
            logging.debug(f"Formatted text: {formatted_text}")
        except Exception as error:
            logging.error(f"Error processing text: {error}")
            formatted_text = f"Error processing text: {str(error)}"
        return render_template_string(HTML_TEMPLATE, formatted_text=formatted_text)
    return render_template_string(HTML_TEMPLATE)

# Run the app
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)