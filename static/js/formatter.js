document.addEventListener('DOMContentLoaded', function() {
    // Set up a simple text editor first before trying to initialize TipTap
    setupBasicEditor();
    
    // Try to initialize TipTap with a delay to ensure all scripts are loaded
    setTimeout(initTipTap, 500);
});

// Basic editor functionality using contenteditable
function setupBasicEditor() {
    const editor = document.getElementById('editor');
    const previewContent = document.getElementById('preview-content');
    const previewToggle = document.getElementById('preview-toggle');
    const previewContainer = document.getElementById('preview-container');
    const editorContainer = document.querySelector('.editor-container');
    
    // Make editor editable
    editor.contentEditable = true;
    editor.innerHTML = '<p>Start writing your LinkedIn post here...</p>';
    
    // Focus on editor by default
    editor.focus();
    
    // Basic formatting buttons functionality
    document.getElementById('bold-btn').addEventListener('click', function() {
        document.execCommand('bold');
        editor.focus();
        updatePreview();
    });
    
    document.getElementById('italic-btn').addEventListener('click', function() {
        document.execCommand('italic');
        editor.focus();
        updatePreview();
    });
    
    document.getElementById('underline-btn').addEventListener('click', function() {
        document.execCommand('underline');
        editor.focus();
        updatePreview();
    });
    
    document.getElementById('strikethrough-btn').addEventListener('click', function() {
        document.execCommand('strikeThrough');
        editor.focus();
        updatePreview();
    });
    
    document.getElementById('code-btn').addEventListener('click', function() {
        // For code, we'll wrap in <code> tags
        if (window.getSelection) {
            let selection = window.getSelection();
            if (selection.rangeCount) {
                let range = selection.getRangeAt(0);
                let codeEl = document.createElement('code');
                range.surroundContents(codeEl);
                editor.focus();
                updatePreview();
            }
        }
    });
    
    document.getElementById('link-btn').addEventListener('click', function() {
        const url = prompt('Enter URL');
        if (url) {
            document.execCommand('createLink', false, url);
            editor.focus();
            updatePreview();
        }
    });
    
    document.getElementById('bullet-list-btn').addEventListener('click', function() {
        document.execCommand('insertUnorderedList');
        editor.focus();
        updatePreview();
    });
    
    document.getElementById('ordered-list-btn').addEventListener('click', function() {
        document.execCommand('insertOrderedList');
        editor.focus();
        updatePreview();
    });
    
    document.getElementById('undo-btn').addEventListener('click', function() {
        document.execCommand('undo');
        editor.focus();
        updatePreview();
    });
    
    document.getElementById('redo-btn').addEventListener('click', function() {
        document.execCommand('redo');
        editor.focus();
        updatePreview();
    });
    
    document.getElementById('clear-formatting-btn').addEventListener('click', function() {
        document.execCommand('removeFormat');
        editor.focus();
        updatePreview();
    });
    
    // Handle input event to update preview
    editor.addEventListener('input', updatePreview);
    
    // Toggle preview visibility
    previewToggle.addEventListener('click', function() {
        if (previewContainer.style.display === 'none') {
            previewContainer.style.display = 'block';
            editorContainer.style.display = 'none';
            this.textContent = 'Back to Editor';
            updatePreview();
        } else {
            previewContainer.style.display = 'none';
            editorContainer.style.display = 'block';
            this.textContent = 'Post Preview';
        }
    });
    
    // Copy text button
    document.getElementById('copy-btn').addEventListener('click', function() {
        const formattedText = previewContent.textContent;
        navigator.clipboard.writeText(formattedText)
            .then(() => {
                this.innerHTML = '<i class="bi bi-check2"></i> Copied!';
                this.classList.add('btn-success');
                
                setTimeout(() => {
                    this.innerHTML = '<i class="bi bi-clipboard"></i> Copy text';
                    this.classList.remove('btn-success');
                }, 2000);
            })
            .catch(err => {
                console.error('Error copying text: ', err);
                alert('Failed to copy text: ' + err);
            });
    });
    
    // Placeholder functionality for other buttons
    document.getElementById('schedule-btn').addEventListener('click', function() {
        alert('Scheduling feature coming soon!');
    });
    
    document.getElementById('post-now-btn').addEventListener('click', function() {
        alert('This is a demo. In a real application, this would post to LinkedIn.');
    });
    
    // Function to update the preview with formatted content
    function updatePreview() {
        // Process the HTML content to apply LinkedIn styling
        let processedHTML = editor.innerHTML;
        
        // Replace hashtags with styled versions
        processedHTML = processedHTML.replace(/#(\w+)/g, '<span class="text-primary">#$1</span>');
        
        // Format content for LinkedIn preview
        previewContent.innerHTML = processedHTML;
        
        // Format the text using the backend API if needed
        const plainText = previewContent.textContent;
        if (plainText && plainText.trim() !== '') {
            formatText(plainText);
        }
    }
    
    // Initial update of preview
    updatePreview();
}

// Function to send text to backend for formatting
function formatText(text) {
    fetch('/api/format', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: text }),
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            console.error('Error formatting text:', data.error);
            return;
        }
        
        // Use the formatted text if needed
        console.log('Formatted text:', data.formatted_text);
        // You could update the preview with this text if needed
    })
    .catch(error => {
        console.error('Error calling format API:', error);
    });
}

// Try to initialize TipTap editor (this is a fallback that may work if scripts load properly)
function initTipTap() {
    try {
        if (typeof tiptap !== 'undefined' && tiptap.Editor) {
            console.log('TipTap initialized');
            const editor = new tiptap.Editor({
                element: document.querySelector('#editor'),
                content: document.querySelector('#editor').innerHTML,
                editable: true
            });
        }
    } catch (e) {
        console.log('TipTap initialization skipped, using basic editor', e);
    }
}