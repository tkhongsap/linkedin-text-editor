document.addEventListener('DOMContentLoaded', function() {
    // Set up a simple text editor
    setupBasicEditor();
    
    // Add mobile-specific behaviors
    setupMobileEnhancements();
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
        // For LinkedIn compatibility, we'll use underscores for italics
        // This is a markdown-style approach that LinkedIn seems to preserve
        const selection = window.getSelection();
        
        if (!selection.isCollapsed) {
            const range = selection.getRangeAt(0);
            const selectedText = range.toString();
            
            // Replace selection with underscore-wrapped text
            const wrappedText = `_${selectedText}_`;
            document.execCommand('insertText', false, wrappedText);
            
            // Update the preview
            updatePreview();
        } else {
            // If no selection, let the user know
            alert('Please select some text to italicize first.');
        }
        
        editor.focus();
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
        // Instead of using HTML lists, insert plain text bullet markers
        // that the backend can process correctly
        
        const selection = window.getSelection();
        const range = selection.getRangeAt(0);
        
        // Get the current line
        let node = range.startContainer;
        let startOffset = range.startOffset;
        
        // Insert a plain "- " at the beginning of the line or at cursor
        if (node.nodeType === 3) { // Text node
            // If we're at the beginning of a line or this is an empty line, insert the bullet
            if (startOffset === 0 || node.textContent.substring(0, startOffset).endsWith('\n')) {
                document.execCommand('insertText', false, '- ');
            } else {
                // Otherwise insert a newline followed by the bullet
                document.execCommand('insertText', false, '\n- ');
            }
        } else {
            // If not in a text node, just insert the bullet
            document.execCommand('insertText', false, '- ');
        }
        
        editor.focus();
        updatePreview();
    });
    
    document.getElementById('ordered-list-btn').addEventListener('click', function() {
        // Instead of using HTML ordered lists, insert plain text numbering
        // Get the selected text or cursor position
        const selection = window.getSelection();
        const range = selection.getRangeAt(0);
        
        // Insert a "1. " at the beginning of the line or at cursor
        let node = range.startContainer;
        let startOffset = range.startOffset;
        
        if (node.nodeType === 3) { // Text node
            // If we're at the beginning of a line or this is an empty line, insert the numbering
            if (startOffset === 0 || node.textContent.substring(0, startOffset).endsWith('\n')) {
                document.execCommand('insertText', false, '1. ');
            } else {
                // Otherwise insert a newline followed by the numbering
                document.execCommand('insertText', false, '\n1. ');
            }
        } else {
            // If not in a text node, just insert the numbering
            document.execCommand('insertText', false, '1. ');
        }
        
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
        // Get the formatted text with Unicode characters from the data attribute
        let formattedText = previewContent.getAttribute('data-formatted-text') || previewContent.textContent;
        
        // Use the Clipboard API for reliable plain text copying which works best for LinkedIn
        navigator.clipboard.writeText(formattedText)
            .then(() => {
                this.innerHTML = '<i class="bi bi-check2"></i> Copied!';
                this.classList.add('btn-success');
                
                // Create a feedback message explaining what happened
                const feedbackMsg = document.createElement('div');
                feedbackMsg.className = 'alert alert-success my-2 small';
                feedbackMsg.innerHTML = '<i class="bi bi-info-circle"></i> ' +
                    'Text copied with formatting. Paste directly into your LinkedIn post.';
                
                // Insert the feedback message after the copy button
                this.parentNode.insertBefore(feedbackMsg, this.nextSibling);
                
                // Remove the feedback message after a delay
                setTimeout(() => {
                    if (feedbackMsg.parentNode) {
                        feedbackMsg.parentNode.removeChild(feedbackMsg);
                    }
                    this.innerHTML = '<i class="bi bi-clipboard"></i> Copy text';
                    this.classList.remove('btn-success');
                }, 3000);
            })
            .catch(err => {
                console.error('Clipboard API error: ', err);
                
                // Fallback to execCommand if Clipboard API fails
                try {
                    // Create a temporary element for copying
                    const tempElement = document.createElement('textarea');
                    tempElement.value = formattedText;
                    tempElement.style.position = 'absolute';
                    tempElement.style.left = '-9999px';
                    document.body.appendChild(tempElement);
                    
                    // Select and copy the text
                    tempElement.select();
                    document.execCommand('copy');
                    document.body.removeChild(tempElement);
                    
                    this.innerHTML = '<i class="bi bi-check2"></i> Copied!';
                    this.classList.add('btn-success');
                    
                    setTimeout(() => {
                        this.innerHTML = '<i class="bi bi-clipboard"></i> Copy text';
                        this.classList.remove('btn-success');
                    }, 2000);
                } catch (error) {
                    console.error('execCommand error: ', error);
                    alert('Failed to copy text. Please try again or copy manually.');
                }
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
            fetch('/api/format', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ text: plainText }),
            })
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    console.error('Error formatting text:', data.error);
                    return;
                }
                
                // Store the formatted text for copy functionality
                previewContent.setAttribute('data-formatted-text', data.formatted_text);
                console.log('Formatted text:', data.formatted_text);
                
                // Display formatted text in preview
                // We'll add a visual indicator that the text is formatted
                const formattedTextDisplay = document.createElement('div');
                formattedTextDisplay.className = 'formatted-text-display mt-3 p-2 border border-primary rounded bg-light';
                
                // Process the text for display in the preview
                // First, convert newlines to <br> tags
                let processedContent = data.formatted_text.replace(/\n/g, '<br>');
                
                // No need to replace markers anymore since we're using actual 
                // Unicode characters that already display correctly
                
                // Highlight bullet points for better visibility
                processedContent = processedContent.replace(/^\s*•\s+/gm, '<span class="text-primary">• </span>');
                processedContent = processedContent.replace(/^(\d+)\.\s+/gm, '<span class="text-primary">$1. </span>');
                
                formattedTextDisplay.innerHTML = `
                    <div class="small text-muted mb-1">LinkedIn Formatted Text (copy this):</div>
                    <div class="formatted-content bg-white p-2 rounded border">${processedContent}</div>
                    <div class="small text-muted mt-2">
                        <strong>Supported formats:</strong>
                        <ul class="mb-0 ps-3">
                            <li><strong>Bold:</strong> Use **text** or *text*</li>
                            <li><em>Italic:</em> Use _text_</li>
                            <li><span style="list-style-type: disc;">Bullet points:</span> Start line with - or * </li>
                            <li><span>Numbered List:</span> Use ordered list button</li>
                        </ul>
                    </div>
                    <div class="small text-success mt-2">
                        <i class="bi bi-info-circle"></i> 
                        Text has been prepared for LinkedIn formatting. Just click "Copy text" and paste directly into LinkedIn.
                    </div>
                    <div class="small text-info mt-1">
                        <i class="bi bi-bulb"></i> 
                        LinkedIn may convert some formatting to its own style when pasted.
                    </div>
                `;
                
                // If there's already a formatted display, replace it
                const existingDisplay = previewContent.querySelector('.formatted-text-display');
                if (existingDisplay) {
                    existingDisplay.remove();
                }
                
                // Append the formatted display to the preview content
                previewContent.appendChild(formattedTextDisplay);
            })
            .catch(error => {
                console.error('Error calling format API:', error);
            });
        }
    }
    
    // Initial update of preview
    updatePreview();
}

// Mobile-specific enhancements
function setupMobileEnhancements() {
    // Detect if we're on mobile
    const isMobile = window.matchMedia("(max-width: 767px)").matches;
    
    if (isMobile) {
        // Adjust editor height for better mobile experience
        const editor = document.getElementById('editor');
        editor.style.minHeight = '120px';
        
        // Enhance toolbar visibility on mobile
        const toolbarButtons = document.querySelectorAll('.btn-toolbar .btn');
        toolbarButtons.forEach(button => {
            button.classList.add('p-1');
            // Make touch targets larger
            button.style.minWidth = '40px';
            button.style.minHeight = '40px';
        });
        
        // Add scroll to top when switching to editor
        document.getElementById('preview-toggle').addEventListener('click', function() {
            if (this.textContent === 'Back to Editor') {
                window.scrollTo(0, 0);
            }
        });
        
        // Make sure buttons are large enough for touch
        const actionButtons = document.querySelectorAll('#copy-btn, #schedule-btn, #post-now-btn');
        actionButtons.forEach(button => {
            button.classList.add('py-2');
        });
        
        // Handle keyboard appearing/disappearing (for mobile)
        const viewportHeight = window.innerHeight;
        window.addEventListener('resize', function() {
            // If the height is significantly less than viewport height, keyboard is probably showing
            if (window.innerHeight < viewportHeight * 0.8) {
                // Hide preview button when keyboard is showing to save space
                document.getElementById('preview-toggle').style.display = 'none';
            } else {
                document.getElementById('preview-toggle').style.display = 'block';
            }
        });
    }

    // Add viewport meta update for proper scaling based on device
    function updateViewportForDevice() {
        const viewportMeta = document.querySelector('meta[name="viewport"]');
        
        if (viewportMeta) {
            // For small devices, use a different viewport setting to avoid zooming issues
            if (window.innerWidth < 360) {
                viewportMeta.setAttribute('content', 'width=device-width, initial-scale=0.86, maximum-scale=0.86, user-scalable=no');
            } else {
                viewportMeta.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
            }
        }
    }
    
    // Run initially and on resize
    updateViewportForDevice();
    window.addEventListener('resize', updateViewportForDevice);
}