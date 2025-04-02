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
        // Standard italic command
        document.execCommand('italic');
        
        // LinkedIn specific handling - ensure selection is properly marked for our backend processor
        const selection = window.getSelection();
        if (!selection.isCollapsed) {
            const range = selection.getRangeAt(0);
            const selectedText = range.toString();
            
            // If there's no <em> or <i> tag applied, manually wrap with underscore
            // This ensures our backend processor can identify it for LinkedIn formatting
            const container = range.commonAncestorContainer;
            const parentElement = container.nodeType === 3 ? container.parentNode : container;
            
            if (!parentElement.closest('em') && !parentElement.closest('i')) {
                // Replace selection with underscore-wrapped text for our processor
                const wrappedText = `_${selectedText}_`;
                document.execCommand('insertText', false, wrappedText);
            }
        }
        
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
        // First try standard HTML list command
        document.execCommand('insertUnorderedList');
        
        // Additionally, ensure bullet points are properly formatted for LinkedIn
        // If selection is empty, just add a bullet point at cursor position
        const selection = window.getSelection();
        if (selection.isCollapsed) {
            const range = selection.getRangeAt(0);
            const listItem = document.createElement('li');
            listItem.innerHTML = ' ';
            range.insertNode(listItem);
            
            // Place cursor inside the list item
            range.setStart(listItem, 0);
            range.setEnd(listItem, 0);
            selection.removeAllRanges();
            selection.addRange(range);
        }
        
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
        // Get the formatted text with Unicode characters from the data attribute
        let formattedText = previewContent.getAttribute('data-formatted-text') || previewContent.textContent;
        
        // Process any special markers that our backend added for formatting
        
        // Handle italic markers
        // We need to replace these markers with actual italic text using HTML
        // LinkedIn only accepts the italic formatting when it's actual HTML
        const italicRegex = /<i-marker>(.*?)<\/i-marker>/g;
        formattedText = formattedText.replace(italicRegex, '<i>$1</i>');
        
        // Handle bullet point markers
        // Replace with proper HTML list for better copying to LinkedIn
        const bulletRegex = /<bullet-marker>(.*?)<\/bullet-marker>/g;
        formattedText = formattedText.replace(bulletRegex, '<span style="list-style-type: disc;">$1</span>');
        
        // Improve list formatting for LinkedIn
        // Convert lines starting with bullets to proper list items
        const bulletLineRegex = /^(\s*)• (.*)$/gm;
        formattedText = formattedText.replace(bulletLineRegex, '<li>$2</li>');
        
        // Convert numbered list items
        const numberedLineRegex = /^(\s*)(\d+)\. (.*)$/gm;
        formattedText = formattedText.replace(numberedLineRegex, '<li>$3</li>');
        
        // Create a rich-text div that will be used for copying with formatting intact
        const richTextDiv = document.createElement('div');
        richTextDiv.style.position = 'absolute';
        richTextDiv.style.left = '-9999px';
        richTextDiv.contentEditable = 'true';
        richTextDiv.innerHTML = formattedText;
        document.body.appendChild(richTextDiv);
        
        // Select the rich text content
        richTextDiv.focus();
        const selection = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(richTextDiv);
        selection.removeAllRanges();
        selection.addRange(range);
        
        try {
            // Execute the copy command to get the formatted text in clipboard
            const successful = document.execCommand('copy');
            if (successful) {
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
            } else {
                throw new Error('Copy command was unsuccessful');
            }
        } catch (err) {
            console.error('Error copying text: ', err);
            
            // Fallback to the Clipboard API if execCommand fails
            // Note: This will lose formatting, but at least the text will be copied
            navigator.clipboard.writeText(richTextDiv.textContent)
                .then(() => {
                    this.innerHTML = '<i class="bi bi-check2"></i> Copied (plain text only)';
                    this.classList.add('btn-warning');
                    
                    setTimeout(() => {
                        this.innerHTML = '<i class="bi bi-clipboard"></i> Copy text';
                        this.classList.remove('btn-warning');
                    }, 2000);
                })
                .catch(err => {
                    console.error('Clipboard API error: ', err);
                    alert('Failed to copy text. Please try again or copy manually.');
                });
        } finally {
            // Clean up
            selection.removeAllRanges();
            document.body.removeChild(richTextDiv);
        }
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
                
                // Replace the italic markers with actual italic HTML for display
                processedContent = processedContent.replace(/<i-marker>(.*?)<\/i-marker>/g, '<em>$1</em>');
                
                // Process bullet point markers for the display
                processedContent = processedContent.replace(/<bullet-marker>(.*?)<\/bullet-marker>/g, '<span class="text-primary">$1</span>');
                
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