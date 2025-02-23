document.addEventListener('DOMContentLoaded', function() {
    const editor = new window.Editor({
        element: document.querySelector('#editor'),
        extensions: [
            window.StarterKit.default,
            window.Underline.default
        ],
        content: '',
        editable: true,
        autofocus: true,
        editorProps: {
            attributes: {
                class: 'form-control editor-content',
                'data-placeholder': 'Type or paste your text here...\nExample: Apply formatting using the buttons above.'
            }
        }
    });

    const previewArea = document.getElementById('previewArea');
    const copyButton = document.getElementById('copyButton');
    const errorMessage = document.getElementById('errorMessage');
    let formatTimeout;

    // Format buttons click handlers
    document.querySelectorAll('[data-format]').forEach(button => {
        button.addEventListener('click', () => {
            const format = button.dataset.format;
            editor.chain().focus()[`toggle${format.charAt(0).toUpperCase() + format.slice(1)}`]().run();
            updateFormatButtonStates();
            formatText();
        });
    });

    // Update format button states based on current selection
    function updateFormatButtonStates() {
        document.querySelectorAll('[data-format]').forEach(button => {
            const format = button.dataset.format;
            const isActive = editor.isActive(format);
            button.classList.toggle('active', isActive);
        });
    }

    // Editor change handler
    editor.on('update', () => {
        clearTimeout(formatTimeout);
        formatTimeout = setTimeout(formatText, 300);
    });

    editor.on('selectionUpdate', () => {
        updateFormatButtonStates();
    });

    function formatText() {
        const content = editor.getHTML();
        if (!content || content === '<p></p>') {
            previewArea.textContent = 'Your formatted text will appear here...';
            copyButton.disabled = true;
            hideError();
            return;
        }

        fetch('/format', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ text: content })
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                showError(data.error);
                previewArea.textContent = 'Please fix the formatting errors...';
                copyButton.disabled = true;
            } else {
                hideError();
                previewArea.textContent = data.text;
                copyButton.disabled = false;
            }
        })
        .catch(error => {
            showError('An error occurred while formatting the text.');
            console.error('Error:', error);
        });
    }

    // Copy button functionality
    copyButton.addEventListener('click', async function() {
        try {
            await navigator.clipboard.writeText(previewArea.textContent);
            copyButton.classList.add('copy-success');
            copyButton.innerHTML = '<i class="bi bi-check"></i> Copied!';
            setTimeout(() => {
                copyButton.classList.remove('copy-success');
                copyButton.innerHTML = '<i class="bi bi-clipboard"></i> Copy';
            }, 2000);
        } catch (err) {
            showError('Failed to copy text. Please try selecting and copying manually.');
        }
    });

    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.classList.remove('d-none');
    }

    function hideError() {
        errorMessage.classList.add('d-none');
        errorMessage.textContent = '';
    }
});